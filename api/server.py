from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Load products from JSON file
products_file = os.path.join(os.path.dirname(__file__), 'products.json')

def load_products():
    try:
        with open(products_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# Get all products
@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify(load_products())

# Get product by ID
@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    products = load_products()
    product = next((p for p in products if p['id'] == product_id), None)
    if product:
        return jsonify(product)
    return jsonify({'message': 'Product not found'}), 404

# Get trending products
@app.route('/api/products/trending/all', methods=['GET'])
def get_trending():
    products = load_products()
    trending = [p for p in products if p.get('trending', False)]
    trending.sort(key=lambda x: x.get('rank', 999))
    return jsonify(trending)

# Get products by category
@app.route('/api/category/<category>', methods=['GET'])
def get_category(category):
    products = load_products()
    category_products = [p for p in products if p.get('category') == category]
    if not category_products:
        return jsonify({'message': 'No products found in this category'}), 404
    return jsonify(category_products)

# Search products
@app.route('/api/search', methods=['GET'])
def search_products():
    query = request.args.get('q', '').lower()
    products = load_products()
    
    if not query:
        return jsonify(products)
    
    results = [p for p in products if query in p.get('name', '').lower() or query in p.get('brand', '').lower()]
    return jsonify(results)

# Health check
@app.route('/api/health', methods=['GET'])
def health():
    products = load_products()
    return jsonify({
        'status': 'OK',
        'productsCount': len(products)
    })

if __name__ == '__main__':
    products = load_products()
    print(f'✓ NEXUS TECH Backend running on http://localhost:5000')
    print(f'✓ Total products: {len(products)}')
    print('\nAvailable endpoints:')
    print('  GET  /api/products              - Get all products')
    print('  GET  /api/products/:id          - Get product by ID')
    print('  GET  /api/products/trending/all - Get trending products')
    print('  GET  /api/category/:category    - Get products by category')
    print('  GET  /api/search?q=keyword      - Search products')
    print('  GET  /api/health                - Health check')
    app.run(debug=False, port=5000)
