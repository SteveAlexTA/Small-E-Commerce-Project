from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import json
import os
import secrets
from datetime import datetime, timedelta

# Find project root (D:\Small-E-Commerce-Project)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__, 
            static_folder=PROJECT_ROOT,
            static_url_path='')
CORS(app)

# MySQL Connection - nexustech at localhost:3307
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:@localhost:3307/nexustech'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# === Models ===

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False) # Maps to Email
    name = db.Column(db.String(100), nullable=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')
    is_approved = db.Column(db.Boolean, default=False) 

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(100))
    name = db.Column(db.String(200))
    img = db.Column(db.String(255))
    specs = db.Column(db.Text) # Stored as JSON string
    rating = db.Column(db.Float)
    reviews = db.Column(db.Integer)
    price = db.Column(db.Integer)
    oldPrice = db.Column(db.Integer, nullable=True)
    badges = db.Column(db.Text) # Stored as JSON string
    category = db.Column(db.String(50))
    trending = db.Column(db.Boolean)
    rank = db.Column(db.Integer)
    features = db.Column(db.Text) # Stored as JSON string
    condition = db.Column(db.String(50))

# Simple Session Store (In-memory)
sessions = {}

# === Helper Functions ===

def get_product_json(p):
    return {
        'id': p.id,
        'brand': p.brand,
        'name': p.name,
        'img': p.img,
        'specs': json.loads(p.specs) if p.specs else [],
        'rating': p.rating,
        'reviews': p.reviews,
        'price': p.price,
        'oldPrice': p.oldPrice,
        'badges': json.loads(p.badges) if p.badges else [],
        'category': p.category,
        'trending': p.trending,
        'rank': p.rank,
        'features': json.loads(p.features) if getattr(p, 'features', None) else [],
        'condition': getattr(p, 'condition', 'New')
    }

# === Initialization & Migration ===

def migrate_products():
    """Migrate products from JSON to MySQL permanently if table is empty"""
    if Product.query.first():
        return
    
    json_path = os.path.join(os.path.dirname(__file__), 'products.json')
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for p in data:
                    new_p = Product(
                        id=p['id'],
                        brand=p['brand'],
                        name=p['name'],
                        img=p['img'],
                        specs=json.dumps(p['specs']),
                        rating=p['rating'],
                        reviews=p['reviews'],
                        price=p['price'],
                        oldPrice=p.get('oldPrice'),
                        badges=json.dumps(p['badges']),
                        category=p['category'],
                        trending=p['trending'],
                        rank=p['rank'],
                        features=json.dumps(p.get('features', [])),
                        condition=p.get('condition', 'New')
                    )
                    db.session.merge(new_p)
                db.session.commit()
                print(f"Done: Migrated {len(data)} products from JSON to MySQL")
        except Exception as e:
            print(f"Error during migration: {e}")

def create_admin():
    """Create a default admin if none exists"""
    if not User.query.filter_by(role='admin').first():
        admin = User(
            username='admin@nexus.com',
            name='Administrator',
            password='admin', # In a real app, use hashing!
            role='admin',
            is_approved=True
        )
        db.session.add(admin)
        db.session.commit()
        print("Done: Default admin created (admin@nexus.com / admin)")

with app.app_context():
    try:
        db.create_all()
        migrate_products()
        create_admin()
        print("Done: MySQL connection and schema verification successful.")
    except Exception as e:
        print(f"DATABASE CONNECTION ERROR: {e}")

# === Static Routes ===

@app.route('/')
def serve_index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# === API Routes: Products ===

@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([get_product_json(p) for p in products])

@app.route('/api/products/trending/all', methods=['GET'])
def get_trending():
    trending = Product.query.filter_by(trending=True).order_by(Product.rank).all()
    return jsonify([get_product_json(p) for p in trending])

@app.route('/api/products/<int:pid>', methods=['GET'])
def get_product(pid):
    p = Product.query.get(pid)
    if not p: return jsonify({'error': 'Not found'}), 404
    return jsonify(get_product_json(p))

@app.route('/api/category/<category>', methods=['GET'])
def get_by_category(category):
    products = Product.query.filter_by(category=category).all()
    return jsonify([get_product_json(p) for p in products])

@app.route('/api/search', methods=['GET'])
def search():
    q = request.args.get('q', '').lower()
    if not q:
        products = Product.query.all()
    else:
        # Simple case-insensitive search
        products = Product.query.filter(
            (Product.name.ilike(f'%{q}%')) | (Product.brand.ilike(f'%{q}%'))
        ).all()
    return jsonify([get_product_json(p) for p in products])

# ─── API Routes: Auth ───

@app.route('/register', methods=['POST'])
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username') or data.get('email')
        password = data.get('password')
        name = data.get('name', username.split('@')[0] if username else 'User')
        
        if not username or not password:
            return jsonify({'error': 'Missing fields'}), 400
            
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'User exists'}), 400
            
        user = User(username=username, name=name, password=password, is_approved=False)
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'Registration complete! Pending approval.'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        is_admin_login = data.get('isAdminLogin', False)
        
        user = User.query.filter_by(username=email, password=password).first()
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
            
        if is_admin_login and user.role != 'admin':
            return jsonify({'error': 'Access denied'}), 403
            
        if user.role != 'admin' and not user.is_approved:
            return jsonify({'error': 'Account pending approval', 'status': 'pending'}), 403
            
        token = secrets.token_hex(32)
        expires_at = datetime.now() + timedelta(hours=2)
        sessions[token] = {
            'user': {'id': user.id, 'name': user.name, 'email': user.username, 'role': user.role},
            'expiresAt': expires_at.timestamp() * 1000
        }
        return jsonify({
            'message': 'Login successful',
            'user': sessions[token]['user'],
            'token': token,
            'expiresAt': sessions[token]['expiresAt']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── API Routes: Admin ───

@app.route('/api/users', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id, 'name': u.name, 'email': u.username, 
        'role': u.role, 'status': 'approved' if u.is_approved else 'pending'
    } for u in users])

@app.route('/api/users/<int:uid>/status', methods=['PUT'])
def update_status(uid):
    data = request.get_json()
    user = User.query.get(uid)
    if not user: return jsonify({'error': 'Not found'}), 404
    user.is_approved = (data.get('status') == 'approved')
    db.session.commit()
    return jsonify({'message': 'Status updated'})

@app.route('/api/users/<int:uid>', methods=['DELETE'])
def delete_user(uid):
    user = User.query.get(uid)
    if not user: return jsonify({'error': 'Not found'}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'})

@app.route('/api/health')
def health():
    return jsonify({'status': 'OK', 'migration': 'Full SQL'})

if __name__ == '__main__':
    print("Starting NEXUS TECH Backend...")
    print("Serving from:", PROJECT_ROOT)
    app.run(host='127.0.0.1', port=5000, debug=True)
