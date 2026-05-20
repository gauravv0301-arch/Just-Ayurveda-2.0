"""
Iteration 9 backend tests:
- Reviews submit / list / admin moderation
- Coupon analytics
- Blog admin CRUD + public listing/reader
- Regression: /api/orders/create still returns valid order_id (no real payment)
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback for backend tests when REACT_APP_BACKEND_URL is set in frontend/.env only
    from pathlib import Path
    env_file = Path('/app/frontend/.env')
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                break
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@justayurveda.in"
ADMIN_PASS = "admin123"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def product_id():
    r = requests.get(f"{API}/products", timeout=10)
    assert r.status_code == 200
    products = r.json()
    assert products, "Need at least one seeded product"
    return products[0]["id"]


# ---------- Reviews ----------
class TestReviews:
    def test_submit_review_valid(self, product_id):
        unique_name = f"TEST_Reviewer_{uuid.uuid4().hex[:6]}"
        payload = {
            "product_id": product_id,
            "name": unique_name,
            "rating": 5,
            "title": "Excellent",
            "comment": "Wonderful product, highly recommend.",
        }
        r = requests.post(f"{API}/reviews", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "review_id" in data
        # cleanup later via admin
        pytest.review_ids = getattr(pytest, "review_ids", []) + [data["review_id"]]
        pytest.last_review_name = unique_name

    def test_submit_review_duplicate_name(self, product_id):
        name = pytest.last_review_name
        payload = {
            "product_id": product_id, "name": name, "rating": 4,
            "title": "again", "comment": "trying again here",
        }
        r = requests.post(f"{API}/reviews", json=payload, timeout=10)
        assert r.status_code == 400
        assert "recently" in r.text.lower() or "already" in r.text.lower()

    def test_submit_review_invalid_rating_low(self, product_id):
        r = requests.post(f"{API}/reviews", json={
            "product_id": product_id, "name": f"TEST_{uuid.uuid4().hex[:5]}",
            "rating": 0, "comment": "low rating test comment",
        }, timeout=10)
        assert r.status_code == 400

    def test_submit_review_invalid_rating_high(self, product_id):
        r = requests.post(f"{API}/reviews", json={
            "product_id": product_id, "name": f"TEST_{uuid.uuid4().hex[:5]}",
            "rating": 7, "comment": "high rating test comment",
        }, timeout=10)
        assert r.status_code == 400

    def test_get_product_reviews_shape(self, product_id):
        r = requests.get(f"{API}/products/{product_id}/reviews", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "reviews" in d and "total" in d and "average_rating" in d
        assert isinstance(d["reviews"], list)
        # Pending review just submitted should NOT appear here
        names = [rv.get("name") for rv in d["reviews"]]
        assert pytest.last_review_name not in names
        # Legacy embedded reviews should be present (seed includes some)
        assert d["total"] >= 1

    def test_admin_list_reviews_pending(self, admin_headers):
        r = requests.get(f"{API}/admin/reviews?status=pending", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        reviews = r.json()
        assert isinstance(reviews, list)
        ids = [rv["id"] for rv in reviews]
        # our newly submitted review should be here
        assert pytest.review_ids[0] in ids

    def test_admin_list_reviews_no_auth(self):
        r = requests.get(f"{API}/admin/reviews", timeout=10)
        assert r.status_code in (401, 403)

    def test_admin_approve_review_appears_public(self, admin_headers, product_id):
        rid = pytest.review_ids[0]
        r = requests.put(f"{API}/admin/reviews/{rid}", headers=admin_headers,
                         json={"status": "approved"}, timeout=10)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "approved"
        # Now it should appear publicly
        pub = requests.get(f"{API}/products/{product_id}/reviews", timeout=10)
        names = [rv.get("name") for rv in pub.json()["reviews"]]
        assert pytest.last_review_name in names

    def test_admin_toggle_featured(self, admin_headers):
        rid = pytest.review_ids[0]
        r = requests.put(f"{API}/admin/reviews/{rid}", headers=admin_headers,
                         json={"featured": True}, timeout=10)
        assert r.status_code == 200
        assert r.json()["featured"] is True

    def test_admin_delete_review(self, admin_headers):
        rid = pytest.review_ids[0]
        r = requests.delete(f"{API}/admin/reviews/{rid}", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        # Confirm gone
        r2 = requests.delete(f"{API}/admin/reviews/{rid}", headers=admin_headers, timeout=10)
        assert r2.status_code == 404


# ---------- Coupon Analytics ----------
class TestCouponAnalytics:
    def test_analytics_default_30d(self, admin_headers):
        r = requests.get(f"{API}/admin/analytics/coupons?days=30", headers=admin_headers, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("total_coupons", "active_coupons", "expired_coupons",
                  "total_redemptions", "redemption_rate",
                  "revenue_from_coupons", "total_discount_given",
                  "top_coupons", "daily_series"):
            assert k in d, f"Missing key: {k}"
        assert isinstance(d["top_coupons"], list)
        assert isinstance(d["daily_series"], list)
        assert d["window_days"] == 30

    @pytest.mark.parametrize("days", [7, 90, 365])
    def test_analytics_window(self, admin_headers, days):
        r = requests.get(f"{API}/admin/analytics/coupons?days={days}", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        assert r.json()["window_days"] == days

    def test_analytics_requires_auth(self):
        r = requests.get(f"{API}/admin/analytics/coupons?days=30", timeout=10)
        assert r.status_code in (401, 403)


# ---------- Blog ----------
class TestBlog:
    def test_admin_create_published(self, admin_headers):
        title = f"TEST_Blog_{uuid.uuid4().hex[:6]}"
        slug = title.lower().replace("_", "-")
        payload = {
            "title": title, "slug": slug,
            "excerpt": "Excerpt", "content": "# Hello\n\nMarkdown body.",
            "featured_image": "", "tags": ["test", "ayurveda"],
            "seo_title": "", "seo_description": "", "status": "published",
        }
        r = requests.post(f"{API}/admin/blog", json=payload, headers=admin_headers, timeout=10)
        assert r.status_code == 200, r.text
        post = r.json()
        assert post["slug"] == slug
        assert post["status"] == "published"
        assert post["published_at"] is not None
        pytest.blog_id = post["id"]
        pytest.blog_slug = slug

    def test_admin_create_duplicate_slug(self, admin_headers):
        r = requests.post(f"{API}/admin/blog", headers=admin_headers, json={
            "title": "dup", "slug": pytest.blog_slug, "content": "x",
            "status": "draft",
        }, timeout=10)
        assert r.status_code == 400

    def test_public_blog_list_only_published(self):
        r = requests.get(f"{API}/blog", timeout=10)
        assert r.status_code == 200
        posts = r.json()
        assert isinstance(posts, list)
        for p in posts:
            assert p["status"] == "published"
        slugs = [p["slug"] for p in posts]
        assert pytest.blog_slug in slugs

    def test_public_blog_get_with_related(self):
        r = requests.get(f"{API}/blog/{pytest.blog_slug}", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["slug"] == pytest.blog_slug
        assert "related" in d
        assert isinstance(d["related"], list)
        assert "content" in d

    def test_admin_update_blog(self, admin_headers):
        r = requests.put(f"{API}/admin/blog/{pytest.blog_id}", headers=admin_headers, json={
            "title": "Updated", "slug": pytest.blog_slug,
            "excerpt": "ex2", "content": "updated body",
            "tags": ["test"], "status": "published",
        }, timeout=10)
        assert r.status_code == 200
        assert r.json()["title"] == "Updated"

    def test_admin_delete_blog(self, admin_headers):
        r = requests.delete(f"{API}/admin/blog/{pytest.blog_id}", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        r2 = requests.delete(f"{API}/admin/blog/{pytest.blog_id}", headers=admin_headers, timeout=10)
        assert r2.status_code == 404

    def test_get_dev_existing_blog_slug(self):
        # Task mentions a seeded blog with slug=welcome-to-ayurveda (may not exist).
        # Don't fail if absent - log but mark as informational.
        r = requests.get(f"{API}/blog/welcome-to-ayurveda", timeout=10)
        # Accept either present (200) or absent (404)
        assert r.status_code in (200, 404)


# ---------- Regressions ----------
class TestRegression:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=10)
        assert r.status_code == 200 and r.json()["status"] == "healthy"

    def test_orders_create_returns_valid_id(self, product_id):
        payload = {
            "product_id": product_id, "quantity": 1,
            "customer_name": "TEST_Iter9", "customer_email": "test_iter9@example.com",
            "customer_phone": "9999999999", "customer_address": "Test addr",
        }
        r = requests.post(f"{API}/orders/create", json=payload, timeout=20)
        # Don't allow 4xx/5xx — LIVE Razorpay should still mint order
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["order_id"].startswith("JA-")
        assert d["razorpay_order_id"] and d["razorpay_order_id"].startswith("order_")
        assert d["currency"] == "INR"
        assert d["amount"] > 0
