// ═══════════════════════════════════
//   NEXUS TECH — Main JS
// ═══════════════════════════════════

// ─── Product Data ───
const products = [
  {
    id: 1,
    brand: "Apple",
    name: "MacBook Air M3 — 15\" Midnight",
    img: "assets/images/laptop_macbook.png",
    specs: ["M3 Chip", "16GB", "512GB SSD"],
    rating: 4.9,
    reviews: 2841,
    price: 1299,
    oldPrice: 1499,
    badges: ["bestseller"],
    category: "ultrabook",
    trending: true,
    rank: 1,
  },
  {
    id: 2,
    brand: "ASUS ROG",
    name: "ROG Strix G16 — Eclipse Grey",
    img: "assets/images/laptop_gaming.png",
    specs: ["RTX 4060", "32GB", "1TB SSD"],
    rating: 4.8,
    reviews: 1562,
    price: 1549,
    oldPrice: 1799,
    badges: ["hot", "sale"],
    category: "gaming",
    trending: true,
    rank: 2,
  },
  {
    id: 3,
    brand: "Lenovo",
    name: "ThinkPad X1 Carbon Gen 12",
    img: "assets/images/laptop_business.png",
    specs: ["Core Ultra 7", "32GB", "1TB SSD"],
    rating: 4.7,
    reviews: 986,
    price: 1199,
    oldPrice: null,
    badges: ["new"],
    category: "business",
    trending: true,
    rank: 3,
  },
  {
    id: 4,
    brand: "Microsoft",
    name: "Surface Pro 10 — Sapphire",
    img: "assets/images/laptop_2in1.png",
    specs: ["Core Ultra 5", "16GB", "256GB SSD"],
    rating: 4.6,
    reviews: 734,
    price: 999,
    oldPrice: 1149,
    badges: ["sale"],
    category: "2in1",
    trending: true,
    rank: 4,
  },
  {
    id: 5,
    brand: "Dell",
    name: "XPS 13 Plus — Graphite",
    img: "assets/images/laptop_ultrabook.png",
    specs: ["Core Ultra 7", "16GB", "512GB SSD"],
    rating: 4.7,
    reviews: 1203,
    price: 1099,
    oldPrice: 1299,
    badges: ["bestseller"],
    category: "ultrabook",
    trending: true,
    rank: 5,
  },
  {
    id: 6,
    brand: "HP",
    name: "Spectre x360 14 — Nightfall Black",
    img: "assets/images/laptop_macbook.png",
    specs: ["Core Ultra 7", "32GB", "1TB SSD"],
    rating: 4.6,
    reviews: 877,
    price: 1349,
    oldPrice: 1499,
    badges: ["new", "sale"],
    category: "2in1",
    trending: false,
    rank: 6,
  },
  {
    id: 7,
    brand: "Razer",
    name: "Blade 16 — Mercury White",
    img: "assets/images/laptop_gaming.png",
    specs: ["RTX 4080", "32GB", "2TB SSD"],
    rating: 4.9,
    reviews: 643,
    price: 2499,
    oldPrice: 2799,
    badges: ["hot"],
    category: "gaming",
    trending: false,
    rank: 7,
  },
  {
    id: 8,
    brand: "Acer",
    name: "Swift Edge 16 — Olivine Black",
    img: "assets/images/laptop_business.png",
    specs: ["Ryzen 7", "16GB", "1TB SSD"],
    rating: 4.4,
    reviews: 421,
    price: 849,
    oldPrice: 999,
    badges: ["sale"],
    category: "ultrabook",
    trending: false,
    rank: 8,
  },
  {
    id: 9,
    brand: "Samsung",
    name: "Galaxy Book4 Ultra — Moonstone Gray",
    img: "assets/images/laptop_ultrabook.png",
    specs: ["Core Ultra 9", "32GB", "1TB SSD"],
    rating: 4.8,
    reviews: 512,
    price: 1799,
    oldPrice: null,
    badges: ["new"],
    category: "business",
    trending: false,
    rank: 9,
  },
  {
    id: 10,
    brand: "LG",
    name: "Gram 17 — White",
    img: "assets/images/laptop_2in1.png",
    specs: ["Core Ultra 5", "16GB", "512GB SSD"],
    rating: 4.5,
    reviews: 398,
    price: 979,
    oldPrice: 1099,
    badges: ["sale"],
    category: "ultrabook",
    trending: false,
    rank: 10,
  },
  {
    id: 11,
    brand: "ASUS",
    name: "Vivobook Pro 16X OLED",
    img: "assets/images/laptop_gaming.png",
    specs: ["RTX 4060", "24GB", "1TB SSD"],
    rating: 4.6,
    reviews: 714,
    price: 1199,
    oldPrice: 1399,
    badges: ["hot", "sale"],
    category: "gaming",
    trending: false,
    rank: 11,
  },
  {
    id: 12,
    brand: "MSI",
    name: "Stealth 16 Mercedes-AMG",
    img: "assets/images/laptop_business.png",
    specs: ["RTX 4070", "32GB", "2TB SSD"],
    rating: 4.7,
    reviews: 287,
    price: 2199,
    oldPrice: 2499,
    badges: ["new", "hot"],
    category: "gaming",
    trending: false,
    rank: 12,
  },
];

// ─── State ───
let cart = JSON.parse(localStorage.getItem('nexuscart')) || [];
let wishlist = JSON.parse(localStorage.getItem('nexuswish')) || [];
let activeCategory = 'all';
let sortMode = 'featured';
let layoutMode = 'grid';
let activeFilters = { brands: [], priceMax: 3000 };

// ─── Helpers ───
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt = (n) => '$' + n.toLocaleString('en-US');

function starsHTML(r) {
  return Array.from({ length: 5 }, (_, i) => {
    if (r >= i + 1) return '<i class="fas fa-star"></i>';
    if (r >= i + 0.5) return '<i class="fas fa-star-half-alt"></i>';
    return '<i class="far fa-star"></i>';
  }).join('');
}

function badgeHTML(badges) {
  const map = { new: 'badge-new', hot: 'badge-hot', sale: 'badge-sale', bestseller: 'badge-bestseller' };
  return badges.map(b => `<span class="badge ${map[b]}">${b}</span>`).join('');
}

// ─── Cart ───
function saveCart() { localStorage.setItem('retrotech', JSON.stringify(cart)); }
function saveWish() { localStorage.setItem('retrowish', JSON.stringify(wishlist)); }

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(x => x.id === id);
  if (existing) existing.qty++;
  else cart.push({ id, qty: 1 });
  saveCart();
  updateCartCount();
  showToast('Added to Cart', `${p.name} added to your cart.`, 'fas fa-shopping-cart');
}

function updateCartCount() {
  const total = cart.reduce((a, c) => a + c.qty, 0);
  $$('.cart-count').forEach(el => el.textContent = total);
}

function toggleWishlist(id, btn) {
  const idx = wishlist.indexOf(id);
  if (idx === -1) {
    wishlist.push(id);
    btn && btn.classList.add('active');
    const p = products.find(x => x.id === id);
    showToast('Wishlist', `${p?.name} added to wishlist.`, 'fas fa-heart');
  } else {
    wishlist.splice(idx, 1);
    btn && btn.classList.remove('active');
  }
  saveWish();
}

// ─── Toast ───
function showToast(title, msg, icon = 'fas fa-check-circle') {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon"><i class="${icon}"></i></span>
    <div>
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${msg}</div>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fadeout');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3200);
}

// ─── Render Trending ───
function renderTrending() {
  const wrap = $('#trending-scroll');
  if (!wrap) return;
  const list = products.filter(p => p.trending).sort((a, b) => a.rank - b.rank);
  wrap.innerHTML = list.map(p => `
    <div class="trending-card" data-id="${p.id}">
      <div class="trending-card-img-wrap">
        <div class="trending-card-rank">#${p.rank}</div>
        <img src="${p.img}" alt="${p.name}" class="trending-card-img" loading="lazy">
        <div class="trending-card-overlay"></div>
      </div>
      <div class="trending-card-body">
        <div class="trending-card-badges">${badgeHTML(p.badges)}</div>
        <div class="trending-card-name">${p.name}</div>
        <div class="trending-card-specs">
          ${p.specs.map(s => `<span class="spec-tag">${s}</span>`).join('')}
        </div>
        <div class="trending-card-rating">
          <span class="stars">${starsHTML(p.rating)}</span>
          <span class="rating-num">${p.rating}</span>
          <span class="rating-count">(${p.reviews.toLocaleString()})</span>
        </div>
        <div class="trending-card-price">
          <span class="price-current">${fmt(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${fmt(p.oldPrice)}</span>` : ''}
          ${p.oldPrice ? `<span class="price-discount">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : ''}
        </div>
      </div>
      <div class="trending-card-footer">
        <button class="btn btn-primary add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${p.id})">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
        <button class="btn btn-icon wishlist-btn ${wishlist.includes(p.id) ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist(${p.id}, this)" style="border-color: ${wishlist.includes(p.id) ? 'var(--accent-warm)' : 'var(--border)'}; color: ${wishlist.includes(p.id) ? 'var(--accent-warm)' : 'var(--text-secondary)'}">
          <i class="${wishlist.includes(p.id) ? 'fas' : 'far'} fa-heart"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  initTrendingScroll();
}

// ─── Init Trending Scroll Navigation ───
function initTrendingScroll() {
  const scroll = $('#trending-scroll');
  const prevBtn = $('#trending-prev');
  const nextBtn = $('#trending-next');
  const indicatorsContainer = $('#trending-indicators');
  
  if (!scroll || !prevBtn || !nextBtn || !indicatorsContainer) return;
  
  const cards = $$('.trending-card');
  const cardWidth = 280 + 20; // card width + gap
  
  // Create indicators
  indicatorsContainer.innerHTML = cards.map((_, i) => 
    `<div class="trending-indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
  ).join('');
  
  // Update indicators based on scroll position
  const updateIndicators = () => {
    const scrollLeft = scroll.scrollLeft;
    const activeIndex = Math.round(scrollLeft / cardWidth);
    $$('.trending-indicator').forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });
  };
  
  // Navigation button handlers
  const scroll_amount = cardWidth;
  
  prevBtn.addEventListener('click', () => {
    scroll.scrollBy({ left: -scroll_amount, behavior: 'smooth' });
    setTimeout(updateIndicators, 300);
  });
  
  nextBtn.addEventListener('click', () => {
    scroll.scrollBy({ left: scroll_amount, behavior: 'smooth' });
    setTimeout(updateIndicators, 300);
  });
  
  // Indicator click handlers
  $$('.trending-indicator').forEach(dot => {
    dot.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      scroll.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
      setTimeout(updateIndicators, 300);
    });
  });
  
  // Update on scroll
  scroll.addEventListener('scroll', updateIndicators);
  
  // Update on window resize
  window.addEventListener('resize', updateIndicators);
}

// ─── Render Catalog ───
function getFilteredProducts() {
  let list = [...products];
  if (activeCategory !== 'all') {
    list = list.filter(p => p.category === activeCategory);
  }
  if (activeFilters.brands.length) {
    list = list.filter(p => activeFilters.brands.includes(p.brand.toLowerCase()));
  }
  list = list.filter(p => p.price <= activeFilters.priceMax);

  switch (sortMode) {
    case 'price-asc': list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    case 'reviews': list.sort((a, b) => b.reviews - a.reviews); break;
    default: list.sort((a, b) => a.rank - b.rank);
  }
  return list;
}

function renderCatalog() {
  const grid = $('#product-grid');
  if (!grid) return;
  const list = getFilteredProducts();
  $('#results-count').innerHTML = `Showing <strong>${list.length}</strong> products`;

  grid.innerHTML = list.map(p => `
    <div class="product-card reveal" data-id="${p.id}">
      <div class="product-card-img-wrap">
        <img src="${p.img}" alt="${p.name}" class="product-card-img" loading="lazy">
        <div class="product-card-badges">${badgeHTML(p.badges)}</div>
        <div class="product-card-actions">
          <button class="action-btn ${wishlist.includes(p.id) ? 'active' : ''}" title="Wishlist"
            onclick="event.stopPropagation(); toggleWishlist(${p.id}, this)">
            <i class="${wishlist.includes(p.id) ? 'fas' : 'far'} fa-heart"></i>
          </button>
          <button class="action-btn" title="Quick View" onclick="event.stopPropagation(); quickView(${p.id})">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
      <div class="product-card-body">
        <div class="product-brand">${p.brand}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-specs">
          ${p.specs.map(s => `<span class="spec-tag">${s}</span>`).join('')}
        </div>
        <div class="product-rating">
          <span class="stars">${starsHTML(p.rating)}</span>
          <span class="rating-num" style="font-size:0.8rem;font-weight:600;color:var(--text-secondary)">${p.rating}</span>
          <span class="rating-count">(${p.reviews.toLocaleString()})</span>
        </div>
        <div class="product-price-row">
          <span class="price-current">${fmt(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${fmt(p.oldPrice)}</span>` : ''}
          ${p.oldPrice ? `<span class="price-discount">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : ''}
        </div>
      </div>
      <div class="product-card-footer">
        <button class="btn btn-primary" style="flex:1;height:38px;font-size:0.8rem;border-radius:var(--radius-sm)"
          onclick="event.stopPropagation(); addToCart(${p.id})">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
      </div>
    </div>
  `).join('');

  // Apply staggered reveal
  setTimeout(() => {
    $$('.product-card.reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 60);
    });
  }, 50);
}

// ─── Quick View ───
function quickView(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  showToast('Quick View', `${p.name} — ${fmt(p.price)}. Full product page coming soon!`, 'fas fa-eye');
}

// ─── Category Chips ───
function initChips() {
  $$('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.cat;
      renderCatalog();
    });
  });
}

// ─── Sort ───
function initSort() {
  const sel = $('#sort-select');
  if (sel) {
    sel.addEventListener('change', () => {
      sortMode = sel.value;
      renderCatalog();
    });
  }
}

// ─── Grid Toggle ───
function initGridToggle() {
  $$('.grid-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.grid-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      layoutMode = btn.dataset.layout;
      const grid = $('#product-grid');
      if (grid) {
        grid.classList.toggle('list-layout', layoutMode === 'list');
      }
    });
  });
}

// ─── Brand Filters ───
function initBrandFilters() {
  $$('[data-brand]').forEach(cb => {
    cb.addEventListener('change', () => {
      const brand = cb.dataset.brand;
      if (cb.checked) {
        if (!activeFilters.brands.includes(brand)) activeFilters.brands.push(brand);
      } else {
        activeFilters.brands = activeFilters.brands.filter(b => b !== brand);
      }
      renderCatalog();
    });
  });
}

// ─── Price Slider ───
function initPriceSlider() {
  const slider = $('#price-slider');
  const maxInput = $('#price-max');
  if (!slider || !maxInput) return;

  slider.addEventListener('input', () => {
    const val = parseInt(slider.value);
    maxInput.value = val;
    activeFilters.priceMax = val;
    const pct = ((val - 300) / (3000 - 300)) * 100;
    slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, var(--border) ${pct}%, var(--border) 100%)`;
    renderCatalog();
  });

  maxInput.addEventListener('change', () => {
    const val = Math.min(Math.max(parseInt(maxInput.value) || 3000, 300), 3000);
    slider.value = val;
    activeFilters.priceMax = val;
    renderCatalog();
  });
}

// ─── Filter Reset ───
function initFilterReset() {
  const btn = $('#filter-reset');
  if (btn) {
    btn.addEventListener('click', () => {
      activeFilters = { brands: [], priceMax: 3000 };
      $$('[data-brand]').forEach(cb => cb.checked = false);
      const slider = $('#price-slider');
      const maxInput = $('#price-max');
      if (slider) slider.value = 3000;
      if (maxInput) maxInput.value = 3000;
      renderCatalog();
    });
  }
}

// ─── Navbar scroll ───
function initNavbar() {
  const nav = $('.navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ─── Mobile nav ───
function initMobileNav() {
  const hamburger = $('#hamburger');
  const mobileNav = $('#mobile-nav');
  const backdrop = $('#mobile-nav-backdrop');

  hamburger?.addEventListener('click', () => {
    mobileNav.classList.add('open');
  });
  backdrop?.addEventListener('click', () => {
    mobileNav.classList.remove('open');
  });
}

// ─── Search ───
function initSearch() {
  const input = $('#nav-search-input');
  if (!input) return;
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim().toLowerCase();
      if (!q) return;
      const cat = $('#catalog');
      if (cat) {
        cat.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          const filtered = products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.specs.some(s => s.toLowerCase().includes(q))
          );
          const grid = $('#product-grid');
          if (grid) {
            const list = filtered.length ? filtered : products;
            grid.innerHTML = list.map(p => renderProductCard(p)).join('');
            $('#results-count').innerHTML = `<strong>${filtered.length}</strong> results for "<em>${q}</em>"`;
            setTimeout(() => {
              $$('.product-card.reveal').forEach((el, i) => {
                setTimeout(() => el.classList.add('visible'), i * 60);
              });
            }, 50);
          }
        }, 600);
      }
    }
  });
}

function renderProductCard(p) {
  return `
    <div class="product-card reveal" data-id="${p.id}">
      <div class="product-card-img-wrap">
        <img src="${p.img}" alt="${p.name}" class="product-card-img">
        <div class="product-card-badges">${badgeHTML(p.badges)}</div>
        <div class="product-card-actions">
          <button class="action-btn ${wishlist.includes(p.id) ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist(${p.id}, this)">
            <i class="${wishlist.includes(p.id) ? 'fas' : 'far'} fa-heart"></i>
          </button>
          <button class="action-btn" onclick="event.stopPropagation(); quickView(${p.id})">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
      <div class="product-card-body">
        <div class="product-brand">${p.brand}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-specs">${p.specs.map(s => `<span class="spec-tag">${s}</span>`).join('')}</div>
        <div class="product-rating">
          <span class="stars">${starsHTML(p.rating)}</span>
          <span class="rating-num" style="font-size:0.8rem;font-weight:600;color:var(--text-secondary)">${p.rating}</span>
          <span class="rating-count">(${p.reviews.toLocaleString()})</span>
        </div>
        <div class="product-price-row">
          <span class="price-current">${fmt(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${fmt(p.oldPrice)}</span>` : ''}
          ${p.oldPrice ? `<span class="price-discount">-${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>` : ''}
        </div>
      </div>
      <div class="product-card-footer">
        <button class="btn btn-primary" style="flex:1;height:38px;font-size:0.8rem;border-radius:var(--radius-sm)"
          onclick="event.stopPropagation(); addToCart(${p.id})">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
      </div>
    </div>
  `;
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderTrending();
  renderCatalog();
  initChips();
  initSort();
  initGridToggle();
  initBrandFilters();
  initPriceSlider();
  initFilterReset();
  initNavbar();
  initMobileNav();
  initSearch();
});
