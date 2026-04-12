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
const usersPath = path.join(__dirname, 'users.json');
let products = [];
let users = [];

function loadData() {
  try {
    const productsData = fs.readFileSync(productsPath, 'utf-8');
    products = JSON.parse(productsData);
  } catch (error) {
    console.error('Error loading products:', error);
    products = [];
  }

  try {
    const usersData = fs.readFileSync(usersPath, 'utf-8');
    users = JSON.parse(usersData);
  } catch (error) {
    console.error('Error loading users:', error);
    users = [];
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

loadData();

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
    productsCount: products.length,
    usersCount: users.length
  });
});

// ─── User Auth & Management Routes ───

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    role: 'user',
    status: 'pending' // SCRUM 19
  };

  users.push(newUser);
  saveUsers();
  res.json({ message: 'Registration complete. Pending admin approval.', user: { ...newUser, password: '' } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, isAdminLogin } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (isAdminLogin && user.role !== 'admin') {
    return res.status(403).json({ error: 'Invalid admin credentials.' });
  }

  if (user.role !== 'admin') {
    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Registration rejected.', status: 'rejected' });
    }
    if (user.status === 'deactivated') {
      return res.status(403).json({ error: 'Account deactivated.', status: 'deactivated' });
    }
    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Account pending admin approval.', status: 'pending' });
    }
  }

  res.json({ message: 'Login successful', user: { ...user, password: '' } });
});

app.get('/api/users', (req, res) => {
  res.json(users.map(u => ({ ...u, password: '' })));
});

app.put('/api/users/:id/status', (req, res) => {
  const { status } = req.body;
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  user.status = status;
  saveUsers();
  res.json({ message: 'User status updated', user: { ...user, password: '' } });
});

app.delete('/api/users/:id', (req, res) => {
  users = users.filter(u => u.id !== parseInt(req.params.id));
  saveUsers();
  res.json({ message: 'User deleted' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ NEXUS TECH Backend running on http://localhost:${PORT}`);
  console.log(`✓ Total products: ${products.length} | Total users: ${users.length}`);
  console.log('\nAvailable endpoints:');
  console.log(`  GET    /api/products            - Get all products`);
  console.log(`  GET    /api/products/:id        - Get product by ID`);
  console.log(`  GET    /api/products/trending/all`);
  console.log(`  GET    /api/category/:category`);
  console.log(`  GET    /api/search?q=keyword`);
  console.log(`  POST   /api/auth/register       - Register new user`);
  console.log(`  POST   /api/auth/login          - Login (User/Admin)`);
  console.log(`  GET    /api/users               - List all users (Admin)`);
  console.log(`  PUT    /api/users/:id/status    - Update user status`);
  console.log(`  DELETE /api/users/:id          - Delete user`);
  console.log(`  GET    /api/health              - Health check`);
});
