// ═══════════════════════════════════
//   NEXUS TECH 
// ═══════════════════════════════════

// Product Data - Loaded from JSON
let products = [];

// Load products from JSON file
async function loadProducts() {
  try {
    const response = await fetch('api/products.json');
    if (!response.ok) throw new Error('Failed to load products');
    products = await response.json();
    console.log(`✓ Loaded ${products.length} products`);
    renderAll();
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Error', 'Failed to load products', 'fas fa-exclamation-circle');
  }
}

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
function saveCart() { localStorage.setItem('nexuscart', JSON.stringify(cart)); }
function saveWish() { localStorage.setItem('nexuswish', JSON.stringify(wishlist)); }

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

  if (list.length === 0) {
    $('#results-count').innerHTML = `<span style="color:var(--text-muted)">No products match your filters</span>`;
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted)">
        <i class="fas fa-search" style="font-size:3rem;opacity:0.3;margin-bottom:16px;display:block"></i>
        <h3 style="margin-bottom:8px;color:var(--text-secondary)">No products found</h3>
        <p>Try adjusting your filters or search terms</p>
      </div>
    `;
    return;
  }

  $('#results-count').innerHTML = `Showing <strong>${list.length}</strong> of <strong>${products.length}</strong> products`;

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
      el.classList.add('visible');
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
  // Restore layout preference
  const savedLayout = localStorage.getItem('nexuslayout') || 'grid';
  layoutMode = savedLayout;

  const grid = $('#product-grid');
  if (grid) {
    grid.classList.toggle('list-layout', savedLayout === 'list');
  }

  $$('.grid-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layout === savedLayout);
    btn.addEventListener('click', () => {
      $$('.grid-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      layoutMode = btn.dataset.layout;
      localStorage.setItem('nexuslayout', layoutMode);
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
      if (slider) {
        slider.value = 3000;
        slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) 100%, var(--border) 100%, var(--border) 100%)`;
      }
      if (maxInput) maxInput.value = 3000;
      renderCatalog();
      showToast('Filters', 'All filters have been reset', 'fas fa-filter');
    });
  }
}

// ─── Mobile Filter Toggle ───
function initMobileFilterToggle() {
  const toggleBtn = $('#mobile-filter-toggle');
  const filterBox = $('#filter-box');
  if (toggleBtn && filterBox) {
    toggleBtn.addEventListener('click', () => {
      filterBox.classList.toggle('show');
      toggleBtn.innerHTML = filterBox.classList.contains('show')
        ? '<i class="fas fa-times"></i> Hide Filters'
        : '<i class="fas fa-filter"></i> Show Filters';
    });
  }
}

// ─── Load More ───
function initLoadMore() {
  const btn = $('#load-more-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const grid = $('#product-grid');
      const cards = $$('.product-card');
      // Simple pagination: show next 3 products
      const nextCards = $$('.product-card.hidden');
      if (nextCards.length === 0) {
        btn.innerHTML = '<i class="fas fa-check"></i> All products loaded';
        btn.disabled = true;
        return;
      }
      nextCards.slice(0, 3).forEach(card => card.classList.remove('hidden'));
      if ($$('.product-card.hidden').length === 0) {
        btn.innerHTML = '<i class="fas fa-check"></i> All products loaded';
        btn.disabled = true;
      }
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
      if (!q) {
        renderCatalog();
        return;
      }
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.specs.some(s => s.toLowerCase().includes(q))
      );

      if (filtered.length === 0) {
        $('#product-grid').innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted)">
            <i class="fas fa-search" style="font-size:3rem;opacity:0.3;margin-bottom:16px;display:block"></i>
            <h3 style="margin-bottom:8px;color:var(--text-secondary)">No results for "<em>${q}</em>"</h3>
            <p>Try different keywords</p>
          </div>
        `;
        $('#results-count').innerHTML = `<span style="color:var(--text-muted)">0 results for "<em>${q}</em>"</span>`;
      } else {
        $('#results-count').innerHTML = `<strong>${filtered.length}</strong> results for "<em>${q}</em>"`;
        const grid = $('#product-grid');
        grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
        setTimeout(() => {
          $$('.product-card.reveal').forEach(el => {
            el.classList.add('visible');
          });
        }, 50);
      }

      const cat = $('#catalog');
      if (cat) {
        cat.scrollIntoView({ behavior: 'smooth' });
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
function renderAll() {
  updateCartCount();
  renderTrending();
  renderCatalog();
  initChips();
  initSort();
  initGridToggle();
  initBrandFilters();
  initPriceSlider();
  initFilterReset();
  initMobileFilterToggle();
  initLoadMore();
  initNavbar();
  initMobileNav();
  initSearch();
  initRevealAnimation();
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});

// ─── Reveal Animation ───
function initRevealAnimation() {
  const revealElements = $$('.reveal');
  if (revealElements.length === 0) return;

  // Make all reveal elements visible immediately
  revealElements.forEach(el => {
    el.classList.add('visible');
  });

  // Optional: IntersectionObserver for scroll reveal (advanced)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => observer.observe(el));
}
