import requests
import sys
from datetime import datetime

class JustAyurvedaAPITester:
    def __init__(self, base_url="https://ayurveda-wellness-30.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response: Dict with keys: {list(response_data.keys())[:5]}")
                    return True, response_data
                except:
                    print(f"   Response: Non-JSON response")
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        return success

    def test_get_all_products(self):
        """Test getting all products"""
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} products")
            if len(response) == 5:
                print("✅ Correct number of products (5)")
            else:
                print(f"⚠️  Expected 5 products, got {len(response)}")
            
            # Check product structure
            if response:
                product = response[0]
                required_fields = ['id', 'name', 'price', 'description', 'highlights', 'category']
                missing_fields = [field for field in required_fields if field not in product]
                if not missing_fields:
                    print("✅ Product structure is correct")
                else:
                    print(f"⚠️  Missing fields in product: {missing_fields}")
        
        return success, response if success else []

    def test_get_single_product(self, product_id="prod-001"):
        """Test getting a single product by ID"""
        success, response = self.run_test(
            f"Get Single Product ({product_id})",
            "GET",
            f"products/{product_id}",
            200
        )
        if success and isinstance(response, dict):
            print(f"   Product: {response.get('name', 'Unknown')}")
            print(f"   Price: ₹{response.get('price', 0)}")
        return success

    def test_search_products(self, search_term="shilajit"):
        """Test product search functionality"""
        success, response = self.run_test(
            f"Search Products ({search_term})",
            "GET",
            "products",
            200,
            params={"search": search_term}
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} products matching '{search_term}'")
            if response:
                for product in response:
                    name = product.get('name', '').lower()
                    desc = product.get('short_description', '').lower()
                    if search_term.lower() in name or search_term.lower() in desc:
                        print(f"   ✅ Match: {product.get('name')}")
                    else:
                        print(f"   ⚠️  No match: {product.get('name')}")
        return success

    def test_sort_products(self, sort_by="price_low"):
        """Test product sorting functionality"""
        success, response = self.run_test(
            f"Sort Products ({sort_by})",
            "GET",
            "products",
            200,
            params={"sort": sort_by}
        )
        if success and isinstance(response, list) and len(response) > 1:
            print(f"   Found {len(response)} products sorted by {sort_by}")
            if sort_by == "price_low":
                prices = [p.get('price', 0) for p in response]
                is_sorted = all(prices[i] <= prices[i+1] for i in range(len(prices)-1))
                if is_sorted:
                    print("✅ Products correctly sorted by price (low to high)")
                else:
                    print(f"⚠️  Products not properly sorted: {prices}")
            elif sort_by == "price_high":
                prices = [p.get('price', 0) for p in response]
                is_sorted = all(prices[i] >= prices[i+1] for i in range(len(prices)-1))
                if is_sorted:
                    print("✅ Products correctly sorted by price (high to low)")
                else:
                    print(f"⚠️  Products not properly sorted: {prices}")
        return success

    def test_category_filter(self, category="Capsules"):
        """Test category filtering"""
        success, response = self.run_test(
            f"Filter by Category ({category})",
            "GET",
            "products",
            200,
            params={"category": category}
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} products in category '{category}'")
            if response:
                for product in response:
                    prod_category = product.get('category', '')
                    if prod_category.lower() == category.lower():
                        print(f"   ✅ Match: {product.get('name')} ({prod_category})")
                    else:
                        print(f"   ⚠️  Category mismatch: {product.get('name')} ({prod_category})")
        return success

    def test_invalid_product_id(self):
        """Test getting a non-existent product"""
        success, response = self.run_test(
            "Get Invalid Product",
            "GET",
            "products/invalid-id",
            404
        )
        return success

def main():
    print("🧪 Starting Just Ayurveda API Tests")
    print("=" * 50)
    
    # Setup
    tester = JustAyurvedaAPITester()
    
    # Run tests
    print("\n📡 Testing API Connectivity...")
    tester.test_api_root()
    
    print("\n📦 Testing Product Endpoints...")
    success, products = tester.test_get_all_products()
    
    if success and products:
        # Test with actual product ID from the response
        product_id = products[0].get('id', 'prod-001')
        tester.test_get_single_product(product_id)
    else:
        tester.test_get_single_product()
    
    print("\n🔍 Testing Search & Filter...")
    tester.test_search_products("shilajit")
    tester.test_search_products("ashwagandha")
    
    print("\n📊 Testing Sorting...")
    tester.test_sort_products("price_low")
    tester.test_sort_products("price_high")
    tester.test_sort_products("popularity")
    tester.test_sort_products("newest")
    
    print("\n🏷️ Testing Category Filter...")
    tester.test_category_filter("Capsules")
    tester.test_category_filter("Resin")
    
    print("\n❌ Testing Error Handling...")
    tester.test_invalid_product_id()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())