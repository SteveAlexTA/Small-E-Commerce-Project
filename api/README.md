# NEXUS TECH Backend API

A simple Node.js/Express backend for the NEXUS TECH e-commerce platform with 20 laptop products.

## Features

- ✅ **20 Laptop Products** across 5 categories (ultrabook, gaming, business, 2-in-1)
- ✅ **RESTful API** endpoints for products, categories, and search
- ✅ **CORS Enabled** for cross-origin requests
- ✅ **Search Functionality** to find laptops by brand or name
- ✅ **Category Filtering** to browse by laptop type
- ✅ **6 Product Images** in the assets/images folder

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm (comes with Node.js)

### Installation

1. Navigate to the api folder:
   ```bash
   cd api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. The server will run on `http://localhost:5000`

## API Endpoints

### 1. Get All Products
```
GET /api/products
```
Returns all 20 laptop products.

### 2. Get Product by ID
```
GET /api/products/:id
```
Example: `GET /api/products/1`

### 3. Get Trending Products
```
GET /api/products/trending/all
```
Returns products marked as trending.

### 4. Get Products by Category
```
GET /api/category/:category
```
Available categories:
- `ultrabook`
- `gaming`
- `business`
- `2in1`

Example: `GET /api/category/gaming`

### 5. Search Products
```
GET /api/search?q=keyword
```
Search by brand or product name.

Example: `GET /api/search?q=Apple`

### 6. Health Check
```
GET /api/health
```
Returns server status and product count.

## Product Structure

Each product object contains:
```json
{
  "id": 1,
  "brand": "Apple",
  "name": "MacBook Air M3",
  "img": "assets/images/laptop_macbook.png",
  "specs": ["M3 Chip", "16GB", "512GB SSD"],
  "rating": 4.9,
  "reviews": 2841,
  "price": 1299,
  "oldPrice": 1499,
  "badges": ["bestseller"],
  "category": "ultrabook",
  "trending": true,
  "rank": 1
}
```

## Connecting Frontend

Update your `main.js` to fetch from the API:

```javascript
const API_URL = 'http://localhost:5000';

// Fetch all products
async function loadProducts() {
  const response = await fetch(`${API_URL}/api/products`);
  const products = await response.json();
  console.log(products);
}

// Search products
async function searchProducts(query) {
  const response = await fetch(`${API_URL}/api/search?q=${query}`);
  const results = await response.json();
  console.log(results);
}

// Get category products
async function getCategory(category) {
  const response = await fetch(`${API_URL}/api/category/${category}`);
  const products = await response.json();
  console.log(products);
}
```

## Project Structure

```
Small-E-Commerce-Project/
├── api/
│   ├── server.js          # Express server
│   ├── package.json       # Dependencies
│   ├── products.json      # Product data (20 items)
│   └── README.md          # This file
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── images/
│   │   ├── hero_laptop.png
│   │   ├── laptop_2in1.png
│   │   ├── laptop_business.png
│   │   ├── laptop_gaming.png
│   │   ├── laptop_macbook.png
│   │   └── laptop_ultrabook.png
│   └── js/
│       └── main.js
├── index.html
└── ...
```

## Product Categories

| Category | Count | Image |
|----------|-------|-------|
| Gaming | 5 | laptop_gaming.png |
| Ultrabook | 5 | laptop_ultrabook.png, laptop_macbook.png |
| Business | 4 | laptop_business.png |
| 2-in-1 | 3 | laptop_2in1.png |
| Featured | 3 | hero_laptop.png |

## Features by Product Count

- **5 Gaming Laptops**: ASUS ROG, MSI, Alienware, RAZER, Lenovo Legion
- **5 Ultrabook/MacBook**: Apple (3), Dell XPS, Samsung Galaxy
- **4 Business**: Lenovo ThinkPad, HP EliteBook, Dell Precision, Lenovo ThinkBook
- **3 2-in-1**: Microsoft Surface (2), Lenovo Yoga
- **3 Budget/Featured**: ASUS VivoBook, HP Pavilion, Lenovo ThinkBook Plus

## Environment Setup

For production deployment, set the PORT environment variable:
```bash
PORT=8080 npm start
```

## License
MIT

## Support
For issues or questions, check the main project repository.
