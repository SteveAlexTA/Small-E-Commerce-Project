const API_URL = window.location.port === '5000' ? '' : 'http://localhost:5000';
console.log('[Auth] API_URL set to:', API_URL || '(relative)');

let currentUser = JSON.parse(localStorage.getItem('nexusCurrentUser')) || null;
let sessionTimeout = null;

async function authFetch(url, options = {}) {
  const token = localStorage.getItem('nexusToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    handleForcedLogout();
    throw new Error('Session expired');
  }
  
  return response;
}

function handleForcedLogout() {
  performLogout(false); // No confirm on forced
}

/**
 * Fetch the user's cart from the backend and merge into the local cart.
 * Server items take priority for qty; local-only items are kept.
 * Called after every successful login.
 */
async function loadServerCart() {
  try {
    const resp = await authFetch(`${typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : (window.location.port === '5000' ? '' : 'http://localhost:5000')}/api/cart`);
    if (!resp.ok) return;
    const serverItems = await resp.json(); // [{product_id, qty, product:{...}}, ...]

    // Build a map of server items keyed by product_id
    const serverMap = {};
    serverItems.forEach(item => { serverMap[item.product_id] = item.qty; });

    // Merge: use server qty for items on server, keep local-only items
    const localCart = JSON.parse(localStorage.getItem('nexuscart')) || [];
    const merged = [];

    // Add all server items (server qty is authoritative)
    serverItems.forEach(item => {
      merged.push({ id: item.product_id, qty: item.qty });
    });

    // Add local-only items that didn't exist on server
    localCart.forEach(local => {
      if (!serverMap[local.id]) {
        merged.push(local);
        // Push local-only item to server too
        if (typeof authFetch === 'function') {
          authFetch(`${typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:5000'}/api/cart`, {
            method: 'POST',
            body: JSON.stringify({ product_id: local.id, qty: local.qty })
          }).catch(() => {});
        }
      }
    });

    // Write merged result back
    localStorage.setItem('nexuscart', JSON.stringify(merged));

    // Sync into main.js cart array via its saveCart/updateCartCount globals
    if (Array.isArray(window.cart)) {
      window.cart.length = 0;
      merged.forEach(item => window.cart.push(item));
    }
    if (typeof window.updateCartCount === 'function') window.updateCartCount();

    console.log('[Cart] Loaded from server:', merged.length, 'item(s)');
  } catch (err) {
    console.warn('[Cart] Could not load server cart:', err);
  }
}

function performLogout(ask = true) {
  // Removing confirm() to ensure instant logout as requested by the user's flow
  console.log('[Auth] performLogout called. Logging out user:', currentUser?.email);
  currentUser = null;
  localStorage.removeItem('nexusCurrentUser');
  localStorage.removeItem('nexusToken');
  localStorage.removeItem('nexusExpiresAt');
  // Clear local cart on logout so next user starts fresh
  localStorage.removeItem('nexuscart');
  if (Array.isArray(window.cart)) window.cart.length = 0;
  if (typeof window.updateCartCount === 'function') window.updateCartCount();
  if (sessionTimeout) clearTimeout(sessionTimeout);
  
  updateAuthUI();
  closeAuthModal();
  closeAdminDashboard();
  document.querySelector('#user-dropdown')?.classList.remove('active');
  
  if (typeof showToast === 'function') {
    showToast('Signed Out', 'You have been signed out successfully.', 'fas fa-sign-out-alt');
  }
}

function startSessionTimer(expiresAt) {
  if (sessionTimeout) clearTimeout(sessionTimeout);
  
  const remaining = parseInt(expiresAt) - Date.now();
  if (remaining <= 0) {
    handleForcedLogout();
  } else {
    sessionTimeout = setTimeout(() => {
      handleForcedLogout();
    }, remaining);
  }
}

function openAuthModal() {
  const modal = document.querySelector('#auth-modal');
  if (modal) modal.classList.add('open');
}

function closeAuthModal() {
  const modal = document.querySelector('#auth-modal');
  if (modal) modal.classList.remove('open');
}

function updateAuthUI() {
  const signInBtn = document.querySelector('#sign-in-btn');
  const adminDashboardBtn = document.querySelector('#admin-dashboard-btn');
  if (!signInBtn) return;
  
  if (currentUser) {
    signInBtn.innerHTML = `<i class="fas fa-user-circle" style="margin-right:6px"></i> ${currentUser.name.split(' ')[0]}`;
    signInBtn.classList.remove('btn-primary');
    signInBtn.classList.add('btn-outline');
    signInBtn.title = 'Click to Sign Out';

    if (currentUser.role === 'admin') {
      if (adminDashboardBtn) adminDashboardBtn.style.display = 'inline-flex';
      document.querySelector('#drop-admin').style.display = 'flex';
      document.querySelector('#drop-dashboard').style.display = 'none';
    } else {
      if (adminDashboardBtn) adminDashboardBtn.style.display = 'none';
      document.querySelector('#drop-admin').style.display = 'none';
      document.querySelector('#drop-dashboard').style.display = 'flex';
    }
  } else {
    signInBtn.innerHTML = `Sign In`;
    signInBtn.classList.add('btn-primary');
    signInBtn.classList.remove('btn-outline');
    signInBtn.title = 'Sign In';
    if (adminDashboardBtn) adminDashboardBtn.style.display = 'none';
    
    // Hide dropdown items if logged out
    document.querySelector('#drop-admin').style.display = 'none';
    document.querySelector('#drop-dashboard').style.display = 'none';
  }
}

function checkSessionExpiration() {
  const expiresAt = localStorage.getItem('nexusExpiresAt');
  if (currentUser && expiresAt && Date.now() > parseInt(expiresAt)) {
    currentUser = null;
    localStorage.removeItem('nexusCurrentUser');
    localStorage.removeItem('nexusToken');
    localStorage.removeItem('nexusExpiresAt');
    updateAuthUI();
    if (typeof showToast === 'function') {
      showToast('Session Expired', 'Your session has expired. Please sign in again.', 'fas fa-clock');
    }
  }
}

let isAuthInitialized = false;

function initAuth() {
  if (isAuthInitialized) {
    updateAuthUI();
    return;
  }
  isAuthInitialized = true;
  console.log('[Auth] Initializing authentication system...');
  const expiresAt = localStorage.getItem('nexusExpiresAt');
  if (expiresAt) {
    startSessionTimer(expiresAt);
  } else {
    checkSessionExpiration();
  }
  updateAuthUI();

  const authModal = document.querySelector('#auth-modal');
  const overlay = document.querySelector('#auth-modal-backdrop');
  const closeBtn = document.querySelector('#auth-close-btn');

  const goToLogin = document.querySelector('#go-to-login');
  const goToRegister = document.querySelector('#go-to-register');
  const goToAdminLogin = document.querySelector('#go-to-admin-login');
  const backToLogin = document.querySelector('#back-to-login');
  const loginForm = document.querySelector('#login-form');
  const registerForm = document.querySelector('#register-form');
  const adminLoginForm = document.querySelector('#admin-login-form');
  const authTitle = document.querySelector('#auth-title');
  const authSubtitle = document.querySelector('#auth-subtitle');

  if (!authModal) return;

  // Toggle forms
  goToRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    authTitle.textContent = 'Create an account';
    authSubtitle.textContent = 'Join NEXUS TECH to start shopping.';
  });

  goToLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
    authTitle.textContent = 'Sign in to your account';
    authSubtitle.textContent = 'Welcome back! Please enter your details.';
  });

  goToAdminLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    adminLoginForm.classList.add('active');
    authTitle.textContent = 'Admin Sign In';
    authSubtitle.textContent = 'Secure area. Authorized personnel only.';
  });

  backToLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    adminLoginForm.classList.remove('active');
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
    authTitle.textContent = 'Sign in to your account';
    authSubtitle.textContent = 'Welcome back! Please enter your details.';
  });

  // Password toggles
  document.querySelectorAll('.pwd-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      const icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'far fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'far fa-eye';
      }
    });
  });

  // Close modal
  closeBtn?.addEventListener('click', closeAuthModal);
  overlay?.addEventListener('click', closeAuthModal);

  // Sign-In / Sign-Out Global Listener
  // Form Submission
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#login-email').value;
    const pwd = document.querySelector('#login-pwd').value;
    
    try {
      const resp = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd })
      });
      
      const data = await resp.json();
      
      if (!resp.ok) {
        if (typeof showToast === 'function') showToast('Error', data.error || 'Login failed.', 'fas fa-exclamation-circle');
        return;
      }
      
      currentUser = data.user;
      localStorage.setItem('nexusCurrentUser', JSON.stringify(currentUser));
      localStorage.setItem('nexusToken', data.token);
      localStorage.setItem('nexusExpiresAt', data.expiresAt.toString());
      startSessionTimer(data.expiresAt);
      updateAuthUI();
      closeAuthModal();
      if (typeof showToast === 'function') showToast('Success', 'Logged in successfully!', 'fas fa-check-circle');
      // Load & merge server cart
      loadServerCart();
    } catch (err) {
      console.error(err);
      if (typeof showToast === 'function') showToast('Error', 'Server connection failed.', 'fas fa-wifi');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.querySelector('#reg-name').value;
    const email = document.querySelector('#reg-email').value;
    const pwd = document.querySelector('#reg-pwd').value;

    try {
      const resp = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username: email, password: pwd })
      });
      
      const data = await resp.json();
      
      if (!resp.ok) {
        alert(data.error || 'Registration failed.');
        if (typeof showToast === 'function') showToast('Error', data.error || 'Registration failed.', 'fas fa-exclamation-circle');
        return;
      }
      
      alert(data.message || 'Registration complete!');
      if (typeof showToast === 'function') showToast('Registration complete', 'Your account is pending admin approval.', 'fas fa-info-circle');
      
      // Switch to login form automatically
      registerForm.classList.remove('active');
      loginForm.classList.add('active');
    } catch (err) {
      console.error(err);
      alert('Server connection failed.');
    }
  });

  adminLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#admin-email').value;
    const pwd = document.querySelector('#admin-pwd').value;
    
    try {
      const resp = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd, isAdminLogin: true })
      });
      
      const data = await resp.json();
      
      if (!resp.ok) {
        if (typeof showToast === 'function') showToast('Error', data.error || 'Admin login failed.', 'fas fa-exclamation-circle');
        return;
      }
      
      currentUser = data.user;
      localStorage.setItem('nexusCurrentUser', JSON.stringify(currentUser));
      localStorage.setItem('nexusToken', data.token);
      localStorage.setItem('nexusExpiresAt', data.expiresAt.toString());
      startSessionTimer(data.expiresAt);
      updateAuthUI();
      closeAuthModal();
      if (typeof showToast === 'function') showToast('Success', 'Logged in as Admin!', 'fas fa-shield-alt');
      // Admin carts can be synced too
      loadServerCart();
    } catch (err) {
      console.error(err);
      if (typeof showToast === 'function') showToast('Error', 'Server connection failed.', 'fas fa-wifi');
    }
  });

  // Sign-In / Sign-Out Global Listener
  document.querySelector('#sign-in-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal();
    }
    // If logged in, we let the dropdown menu items handle the actions
  });

  // Admin Dashboard Sign-Out
  document.querySelector('#admin-sign-out-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    performLogout();
  });

  // Dropdown Sign-Out
  document.querySelector('#drop-signout')?.addEventListener('click', (e) => {
    e.preventDefault();
    performLogout();
  });

  // Toggle dropdown on click for better accessibility
  document.querySelector('#sign-in-btn')?.addEventListener('click', (e) => {
    if (currentUser) {
      document.querySelector('#user-dropdown').classList.toggle('active');
    }
  });

  // Dropdown Admin/Dashboard
  document.querySelector('#drop-admin')?.addEventListener('click', (e) => {
    e.preventDefault();
    openAdminDashboard();
  });
}

// ─── Admin Dashboard Logic ───
function openAdminDashboard() {
  const modal = document.querySelector('#admin-modal');
  if (modal) {
    renderAdminDashboard();
    modal.classList.add('open');
  }
}

function closeAdminDashboard() {
  const modal = document.querySelector('#admin-modal');
  if (modal) modal.classList.remove('open');
}

function renderAdminDashboard() {
  const tbody = document.querySelector('#admin-users-list');
  const searchInput = document.querySelector('#admin-user-search');
  const countEl = document.querySelector('#admin-total-count');
  if (!tbody) return;
  
  const query = searchInput?.value.toLowerCase() || '';
  
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">Loading users...</td></tr>';
  
  authFetch(`${API_URL}/api/users`)
    .then(resp => resp.json())
    .then(users => {
      const regularUsers = users.filter(u => u.role !== 'admin');
      if (countEl) countEl.textContent = regularUsers.length;

      const filtered = regularUsers.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
      );

      tbody.innerHTML = '';
      
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted)">${query ? 'No matching users found.' : 'No registered users found.'}</td></tr>`;
        return;
      }
      
      filtered.forEach(user => {
        const tr = document.createElement('tr');
        
        let statusHTML = '';
        if (user.status === 'approved') {
          statusHTML = `<span class="status-badge status-approved">Active</span>`;
        } else if (user.status === 'rejected') {
          statusHTML = `<span class="status-badge status-rejected">Rejected</span>`;
        } else if (user.status === 'deactivated') {
          statusHTML = `<span class="status-badge status-deactivated">Deactivated</span>`;
        } else {
          statusHTML = `<span class="status-badge status-pending">Pending</span>`;
        }
        
        let actionHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;">`;
        if (user.status === 'pending') {
          actionHTML += `
            <button class="btn-approve" onclick="updateUserStatus(${user.id}, 'approved')">Approve</button>
            <button class="btn-reject" onclick="updateUserStatus(${user.id}, 'rejected')">Reject</button>
          `;
        } else if (user.status === 'approved') {
          actionHTML += `
            <button class="btn-deactivate" onclick="updateUserStatus(${user.id}, 'deactivated')">Deactivate</button>
          `;
        } else if (user.status === 'deactivated') {
          actionHTML += `
            <button class="btn-approve" onclick="updateUserStatus(${user.id}, 'approved')">Activate</button>
          `;
        }
        actionHTML += `<button class="btn-delete" onclick="deleteUser(${user.id})">Delete</button></div>`;
        
        tr.innerHTML = `
          <td style="font-weight:500;">${user.name}</td>
          <td>${user.email}</td>
          <td>${statusHTML}</td>
          <td>${actionHTML}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--badge-hot)">Failed to load users.</td></tr>`;
    });
}

// Ensure updateUserStatus is accessible globally
window.updateUserStatus = async function(userId, newStatus) {
  try {
    const resp = await authFetch(`${API_URL}/api/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    
    if (resp.ok) {
      renderAdminDashboard();
      const msg = newStatus === 'approved' ? 'User approved successfully!' : 
                  newStatus === 'rejected' ? 'User registration rejected.' :
                  'User account deactivated.';
      if (typeof showToast === 'function') showToast('Success', msg, 'fas fa-check-circle');
    }
  } catch (err) {
    console.error(err);
  }
}

window.deleteUser = async function(userId) {
  if(confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) {
    try {
      const resp = await authFetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (resp.ok) {
        renderAdminDashboard();
        if (typeof showToast === 'function') showToast('Deleted', 'User account removed.', 'fas fa-trash-alt');
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// Ensure init is run when DOM is loaded, if not handled elsewhere
document.addEventListener('DOMContentLoaded', () => {
  // If main.js calls initAuth, we don't need to call it twice, but we do need the admin listeners
  const adminDashboardBtn = document.querySelector('#admin-dashboard-btn');
  const adminCloseBtn = document.querySelector('#admin-close-btn');
  const adminBackdrop = document.querySelector('#admin-modal-backdrop');
  
  adminDashboardBtn?.addEventListener('click', () => {
    openAdminDashboard();
  });
  
  adminCloseBtn?.addEventListener('click', closeAdminDashboard);
  adminBackdrop?.addEventListener('click', closeAdminDashboard);

  // Admin Search
  document.querySelector('#admin-user-search')?.addEventListener('input', () => {
    // We can just re-render or do local filtering for speed
    renderAdminDashboard();
  });
});
