// ═══════════════════════════════════════════════
//   CART DRAWER  —  NEXUS TECH
// ═══════════════════════════════════════════════

(function () {
  // ─── Constants ───
  const FREE_SHIPPING_THRESHOLD = 1500;
  const TAX_RATE = 0.08; // 8 %

  // ─── Open / Close ───
  function openCartDrawer() {
    // Always require auth to view cart
    if (typeof currentUser === 'undefined' || !currentUser) {
      if (typeof showToast === 'function') {
        showToast(
          'Sign In Required',
          'Please sign in to view your cart.',
          'fas fa-lock'
        );
      }
      if (typeof openAuthModal === 'function') openAuthModal();
      return;
    }

    renderCartDrawer();

    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  // Expose globally so navbar button can call it
  window.openCartDrawer = openCartDrawer;
  window.closeCartDrawer = closeCartDrawer;
  // Expose for live refresh from addToCart
  window._renderCartDrawer = renderCartDrawer;

  // ─── Render ───
  function renderCartDrawer() {
    const bodyEl = document.getElementById('cart-drawer-body');
    const footerEl = document.getElementById('cart-drawer-footer');
    if (!bodyEl || !footerEl) return;

    // Get current cart & products from main.js globals
    const cartItems = window.cart || [];
    const allProducts = window.products || [];

    // Resolve full product data for each cart entry
    const resolved = cartItems
      .map((entry) => {
        const product = allProducts.find((p) => p.id === entry.id);
        return product ? { product, qty: entry.qty } : null;
      })
      .filter(Boolean);

    if (resolved.length === 0) {
      renderEmpty(bodyEl, footerEl);
      return;
    }

    renderItems(bodyEl, resolved);
    renderFooter(footerEl, resolved);
  }

  // ─── Empty State ───
  function renderEmpty(bodyEl, footerEl) {
    bodyEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon"><i class="fas fa-shopping-cart"></i></div>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added anything yet.<br>Browse our catalog and find your perfect laptop!</p>
        <button class="btn btn-primary cart-empty-shop-btn" id="cart-shop-now-btn">
          <i class="fas fa-laptop"></i> Shop Now
        </button>
      </div>
    `;
    footerEl.innerHTML = '';

    document.getElementById('cart-shop-now-btn')?.addEventListener('click', () => {
      closeCartDrawer();
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ─── Items List ───
  function renderItems(bodyEl, resolved) {
    const totalItems = resolved.reduce((s, e) => s + e.qty, 0);

    bodyEl.innerHTML = `
      <div class="cart-clear-row">
        <button class="cart-clear-btn" id="cart-clear-all-btn" title="Remove all items">
          <i class="fas fa-trash-alt"></i> Clear cart
        </button>
      </div>
      <div class="cart-items-list" id="cart-items-list">
        ${resolved.map((e) => cartItemHTML(e)).join('')}
      </div>
    `;

    // Update header badge count
    const badge = document.getElementById('cart-drawer-count');
    if (badge) badge.textContent = totalItems;

    // Wire up item controls
    bindItemControls();

    // Clear all — mutate in-place to keep main.js's cart reference valid
    document.getElementById('cart-clear-all-btn')?.addEventListener('click', () => {
      if (confirm('Remove all items from your cart?')) {
        // Splice instead of replace to keep the same array reference
        (window.cart || []).splice(0);
        if (typeof window.saveCart === 'function') window.saveCart();
        if (typeof window.updateCartCount === 'function') window.updateCartCount();
        renderCartDrawer();
        if (typeof showToast === 'function')
          showToast('Cart Cleared', 'All items have been removed.', 'fas fa-trash-alt');
        // Sync to API
        if (typeof authFetch === 'function') {
          authFetch(`${_apiBase()}/api/cart`, { method: 'DELETE' })
            .catch(err => console.warn('[Cart] API sync failed (clear):', err));
        }
      }
    });
  }

  function cartItemHTML(entry) {
    const { product: p, qty } = entry;
    const lineTotal = p.price * qty;
    // Fallback placeholder if image fails to load
    const imgFallback = `this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2272%22 height=%2272%22 viewBox=%220 0 72 72%22%3E%3Crect width=%2272%22 height=%2272%22 fill=%22%23242630%22/%3E%3Ctext x=%2236%22 y=%2242%22 text-anchor=%22middle%22 font-size=%2228%22%3E💻%3C/text%3E%3C/svg%3E'`;
    return `
      <div class="cart-item" data-id="${p.id}">
        <div class="cart-item-img-wrap">
          <img src="${p.img}" alt="${p.name}" class="cart-item-img" loading="lazy" onerror="${imgFallback}">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-brand">${p.brand}</div>
          <div class="cart-item-name" title="${p.name}">${p.name}</div>
          <div class="cart-item-price">${fmtPrice(p.price)}</div>
          <div class="cart-item-controls">
            <div class="qty-stepper">
              <button class="qty-stepper-btn cart-qty-dec" data-id="${p.id}" aria-label="Decrease quantity" ${qty <= 1 ? 'disabled' : ''}>
                <i class="fas fa-minus"></i>
              </button>
              <span class="qty-stepper-val" id="qty-val-${p.id}">${qty}</span>
              <button class="qty-stepper-btn cart-qty-inc" data-id="${p.id}" aria-label="Increase quantity">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <div class="cart-item-subtotal">= ${fmtPrice(lineTotal)}</div>
            <button class="cart-item-remove" data-id="${p.id}" aria-label="Remove ${p.name}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Footer / Summary ───
  function renderFooter(footerEl, resolved) {
    const subtotal = resolved.reduce((s, e) => s + e.product.price * e.qty, 0);
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 29;
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + shipping + tax;

    const shippingHTML =
      shipping === 0
        ? `<span class="summary-free"><i class="fas fa-check-circle" style="margin-right:4px;"></i>Free</span>`
        : `<span class="summary-value">${fmtPrice(shipping)}</span>`;

    const bannerHTML =
      subtotal < FREE_SHIPPING_THRESHOLD
        ? `<div class="cart-shipping-banner">
             <i class="fas fa-truck"></i>
             Add ${fmtPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for <strong style="margin:0 4px">FREE shipping!</strong>
           </div>`
        : `<div class="cart-shipping-banner">
             <i class="fas fa-check-circle"></i>
             You've unlocked <strong style="margin:0 4px">FREE shipping!</strong> 🎉
           </div>`;

    footerEl.innerHTML = `
      ${bannerHTML}
      <div class="cart-summary">
        <div class="cart-summary-row">
          <span class="summary-label">Subtotal</span>
          <span class="summary-value">${fmtPrice(subtotal)}</span>
        </div>
        <div class="cart-summary-row">
          <span class="summary-label">Shipping</span>
          ${shippingHTML}
        </div>
        <div class="cart-summary-row">
          <span class="summary-label">Tax (8%)</span>
          <span class="summary-value">${fmtPrice(tax)}</span>
        </div>
        <div class="cart-summary-row total">
          <span>Total</span>
          <span class="summary-value">${fmtPrice(total)}</span>
        </div>
      </div>

      <button class="btn btn-primary cart-checkout-btn" id="cart-checkout-btn">
        <i class="fas fa-lock"></i> Proceed to Checkout
      </button>
      <button class="btn btn-outline cart-continue-btn" id="cart-continue-btn">
        <i class="fas fa-arrow-left"></i> Continue Shopping
      </button>
    `;

    document.getElementById('cart-continue-btn')?.addEventListener('click', closeCartDrawer);

    document.getElementById('cart-checkout-btn')?.addEventListener('click', () => {
      if (typeof showToast === 'function')
        showToast(
          'Coming Soon',
          'Checkout flow is being built — stay tuned!',
          'fas fa-hammer'
        );
    });
  }

  // ─── Bind item controls (qty +/–, remove) ───
  function bindItemControls() {
    // Decrement
    document.querySelectorAll('.cart-qty-dec').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        updateQty(id, -1);
      });
    });

    // Increment
    document.querySelectorAll('.cart-qty-inc').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        updateQty(id, +1);
      });
    });

    // Remove
    document.querySelectorAll('.cart-item-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        removeFromCart(id);
      });
    });
  }

  function updateQty(id, delta) {
    const cart = window.cart || [];
    const entry = cart.find((e) => e.id === id);
    if (!entry) return;
    const newQty = Math.max(1, entry.qty + delta);
    entry.qty = newQty;
    if (typeof window.saveCart === 'function') window.saveCart();
    if (typeof window.updateCartCount === 'function') window.updateCartCount();
    bumpCartBtn();
    renderCartDrawer();

    // Sync to API
    if (typeof authFetch === 'function') {
      authFetch(`${_apiBase()}/api/cart/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ qty: newQty })
      }).catch(err => console.warn('[Cart] API sync failed (updateQty):', err));
    }
  }

  function removeFromCart(id) {
    // Splice in-place so main.js's `cart` and window.cart remain the same array reference
    const cartArr = window.cart || [];
    const idx = cartArr.findIndex((e) => e.id === id);
    if (idx !== -1) cartArr.splice(idx, 1);
    if (typeof window.saveCart === 'function') window.saveCart();
    if (typeof window.updateCartCount === 'function') window.updateCartCount();

    // Sync to API
    if (typeof authFetch === 'function') {
      authFetch(`${_apiBase()}/api/cart/${id}`, { method: 'DELETE' })
        .catch(err => console.warn('[Cart] API sync failed (remove):', err));
    }

    // Animate removal then re-render
    const itemEl = document.querySelector(`.cart-item[data-id="${id}"]`);
    if (itemEl) {
      itemEl.style.transition = 'opacity 0.25s, transform 0.25s';
      itemEl.style.opacity = '0';
      itemEl.style.transform = 'translateX(30px)';
      setTimeout(() => renderCartDrawer(), 260);
    } else {
      renderCartDrawer();
    }

    if (typeof showToast === 'function')
      showToast('Removed', 'Item removed from cart.', 'fas fa-trash');
  }

  // ─── Cart nav button bump animation ───
  function bumpCartBtn() {
    const btn = document.getElementById('cart-nav-btn');
    if (!btn) return;
    btn.classList.add('bump');
    setTimeout(() => btn.classList.remove('bump'), 350);
  }

  // ─── Helpers ───
  function fmtPrice(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  /** Resolve API base URL consistently with main.js / auth.js */
  function _apiBase() {
    if (typeof API_BASE_URL !== 'undefined') return API_BASE_URL;
    return window.location.port === '5000' ? '' : 'http://localhost:5000';
  }

  // ─── Init ───
  function init() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    const closeBtn = document.getElementById('cart-drawer-close');
    const navCartBtn = document.getElementById('cart-nav-btn');

    if (!drawer || !overlay) return;

    closeBtn?.addEventListener('click', closeCartDrawer);
    overlay?.addEventListener('click', closeCartDrawer);

    // Keyboard ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeCartDrawer();
      }
    });

    // Hook up navbar cart button
    navCartBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      openCartDrawer();
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
