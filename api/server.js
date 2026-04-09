const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Read products from JSON file
const productsPath = path.join(__dirname, 'products.json');
let products = [];

function loadProducts() {
  try {
    const data = fs.readFileSync(productsPath, 'utf-8');
    products = JSON.parse(data);
  } catch (error) {
    console.error('Error loading products:', error);
    products = [];
  }
}

loadProducts();

// Routes

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

// Get trending products
app.get('/api/products/trending/all', (req, res) => {
  const trending = products.filter(p => p.trending).sort((a, b) => a.rank - b.rank);
  res.json(trending);
});

// Get products by category
app.get('/api/category/:category', (req, res) => {
  const categoryProducts = products.filter(p => p.category === req.params.category);
  if (categoryProducts.length === 0) {
    return res.status(404).json({ message: 'No products found in this category' });
  }
  res.json(categoryProducts);
});

// Search products
app.get('/api/search', (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  if (!query) {
    return res.json(products);
  }
  
  const results = products.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.brand.toLowerCase().includes(query)
  );
  res.json(results);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    productsCount: products.length 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ NEXUS TECH Backend running on http://localhost:${PORT}`);
  console.log(`✓ Total products: ${products.length}`);
  console.log('\nAvailable endpoints:');
  console.log(`  GET  /api/products              - Get all products`);
  console.log(`  GET  /api/products/:id          - Get product by ID`);
  console.log(`  GET  /api/products/trending/all - Get trending products`);
  console.log(`  GET  /api/category/:category    - Get products by category`);
  console.log(`  GET  /api/search?q=keyword      - Search products`);
  console.log(`  GET  /api/health                - Health check`);
});
