"""Backend tests for multi-image upload feature.

Covers:
- POST /api/admin/upload (auth, MIME validation, size validation, multi-file)
- GET /api/files/{path} (public access, correct Content-Type)
- POST/PUT /api/admin/products with `images` array — primary mirroring to `image`
- GET /api/products returns `images` array (backfilled from legacy `image`)
"""
import os
import io
import base64
import struct
import zlib
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ayurveda-wellness-30.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@justayurveda.in"
ADMIN_PASSWORD = "admin123"


def make_png(width=2, height=2):
    """Construct a minimal valid PNG."""
    def chunk(ctype, data):
        crc = zlib.crc32(ctype + data) & 0xffffffff
        return struct.pack(">I", len(data)) + ctype + data + struct.pack(">I", crc)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    raw = b""
    for _ in range(height):
        raw += b"\x00" + b"\xff\x00\x00" * width  # filter byte + RGB pixels
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# --- Auth checks ---
class TestUploadAuth:
    def test_upload_requires_auth(self):
        png = make_png()
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            files=[("files", ("a.png", png, "image/png"))],
            timeout=60,
        )
        assert r.status_code in (401, 403)


# --- Upload validation ---
class TestUpload:
    def test_upload_single_png(self, auth_headers):
        png = make_png()
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers=auth_headers,
            files=[("files", ("test1.png", png, "image/png"))],
            timeout=120,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "files" in data and len(data["files"]) == 1
        f = data["files"][0]
        assert f["url"].startswith("/api/files/")
        assert f["filename"] == "test1.png"
        # Persist for later test
        pytest._uploaded_url = f["url"]
        pytest._uploaded_path = f["path"]

    def test_upload_multiple(self, auth_headers):
        png = make_png()
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers=auth_headers,
            files=[
                ("files", ("a.png", png, "image/png")),
                ("files", ("b.png", png, "image/png")),
                ("files", ("c.png", png, "image/png")),
            ],
            timeout=120,
        )
        assert r.status_code == 200
        assert len(r.json()["files"]) == 3

    def test_upload_rejects_unsupported_mime(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers=auth_headers,
            files=[("files", ("evil.txt", b"hello", "text/plain"))],
            timeout=60,
        )
        assert r.status_code == 400
        assert "Unsupported" in r.text or "Allowed" in r.text

    def test_upload_rejects_oversize(self, auth_headers):
        big = b"\x00" * (5 * 1024 * 1024 + 100)  # 5MB + 100 bytes
        # PNG header so MIME check passes
        png_header = b"\x89PNG\r\n\x1a\n"
        payload = png_header + big
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers=auth_headers,
            files=[("files", ("big.png", payload, "image/png"))],
            timeout=120,
        )
        assert r.status_code == 400
        assert "5MB" in r.text or "exceeds" in r.text.lower()


# --- Public file serving ---
class TestFileServe:
    def test_serve_uploaded_image(self):
        url_path = getattr(pytest, "_uploaded_url", None)
        if not url_path:
            pytest.skip("No uploaded URL captured")
        r = requests.get(f"{BASE_URL}{url_path}", timeout=60)
        assert r.status_code == 200, r.text
        assert r.headers.get("Content-Type", "").startswith("image/")
        assert len(r.content) > 0
        # Verify PNG signature
        assert r.content[:4] == b"\x89PNG"

    def test_serve_nonexistent_file(self):
        r = requests.get(f"{BASE_URL}/api/files/nonexistent/abc123.png", timeout=30)
        assert r.status_code == 404


# --- Product image normalization ---
class TestProductImages:
    _created_id = None

    def test_create_product_with_images(self, auth_headers):
        url = getattr(pytest, "_uploaded_url", "/api/files/just-ayurveda/products/dummy.png")
        payload = {
            "name": "TEST_MultiImg Product",
            "slug": "test-multiimg-product",
            "short_description": "test",
            "description": "test desc",
            "price": 100, "original_price": 150,
            "images": [
                {"url": "https://example.com/a.jpg", "isPrimary": False},
                {"url": url, "isPrimary": True},
                {"url": "https://example.com/b.jpg", "isPrimary": False},
            ],
        }
        r = requests.post(f"{BASE_URL}/api/admin/products", headers=auth_headers, json=payload, timeout=30)
        assert r.status_code == 200, r.text
        prod = r.json()
        assert prod["image"] == url, f"Primary URL not mirrored to image field. Got: {prod['image']}"
        assert len(prod["images"]) == 3
        primaries = [i for i in prod["images"] if i.get("isPrimary")]
        assert len(primaries) == 1
        assert primaries[0]["url"] == url
        TestProductImages._created_id = prod["id"]

    def test_get_created_product_persists(self):
        pid = TestProductImages._created_id
        assert pid
        r = requests.get(f"{BASE_URL}/api/products/{pid}", timeout=30)
        assert r.status_code == 200
        prod = r.json()
        assert len(prod["images"]) == 3
        assert sum(1 for i in prod["images"] if i.get("isPrimary")) == 1

    def test_update_product_changes_primary(self, auth_headers):
        pid = TestProductImages._created_id
        new_primary = "https://example.com/newprimary.jpg"
        payload = {
            "name": "TEST_MultiImg Product",
            "slug": "test-multiimg-product",
            "short_description": "test", "description": "test desc",
            "price": 100, "original_price": 150,
            "images": [
                {"url": "https://example.com/a.jpg", "isPrimary": False},
                {"url": new_primary, "isPrimary": True},
            ],
        }
        r = requests.put(f"{BASE_URL}/api/admin/products/{pid}", headers=auth_headers, json=payload, timeout=30)
        assert r.status_code == 200, r.text
        prod = r.json()
        assert prod["image"] == new_primary
        assert len(prod["images"]) == 2

    def test_create_product_legacy_image_only(self, auth_headers):
        # No images array, only legacy `image` field
        payload = {
            "name": "TEST_Legacy Product",
            "slug": "test-legacy-product",
            "short_description": "x", "description": "x",
            "price": 50, "original_price": 75,
            "image": "https://example.com/legacy.jpg",
            "images": [],
        }
        r = requests.post(f"{BASE_URL}/api/admin/products", headers=auth_headers, json=payload, timeout=30)
        assert r.status_code == 200, r.text
        prod = r.json()
        # _normalize_product_images should derive images[] from image
        assert prod["images"] == [{"url": "https://example.com/legacy.jpg", "isPrimary": True}]
        assert prod["image"] == "https://example.com/legacy.jpg"
        # cleanup
        requests.delete(f"{BASE_URL}/api/admin/products/{prod['id']}", headers=auth_headers, timeout=30)

    def test_seed_products_have_images_array(self):
        r = requests.get(f"{BASE_URL}/api/products", timeout=30)
        assert r.status_code == 200
        prods = r.json()
        assert len(prods) > 0
        for p in prods:
            assert "images" in p, f"Product {p.get('id')} missing 'images' field"
            assert isinstance(p["images"], list)
            if p.get("image"):
                # If there is a legacy image, it should be in images[]
                urls = [i["url"] for i in p["images"]]
                assert p["image"] in urls, f"Product {p.get('id')}: image {p['image']} not in images {urls}"

    def teardown_class(cls):
        # Cleanup created product
        if cls._created_id:
            try:
                r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
                tok = r.json()["token"]
                requests.delete(f"{BASE_URL}/api/admin/products/{cls._created_id}", headers={"Authorization": f"Bearer {tok}"}, timeout=10)
            except Exception:
                pass
