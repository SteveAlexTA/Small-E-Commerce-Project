// ─── Authentication State ───
let currentUser = JSON.parse(localStorage.getItem('nexusCurrentUser')) || null;
let usersDb = JSON.parse(localStorage.getItem('nexusUsers')) || [];

// Initialize default admin if not exists
if (!usersDb.find(u => u.role === 'admin')) {
  usersDb.push({
    id: 0,
    name: 'Admin',
    email: 'admin@nexustech.com',
    password: 'admin',
    role: 'admin',
    status: 'approved'
  });
  localStorage.setItem('nexusUsers', JSON.stringify(usersDb));
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

    if (currentUser.role === 'admin' && adminDashboardBtn) {
      adminDashboardBtn.style.display = 'inline-flex';
    } else if (adminDashboardBtn) {
      adminDashboardBtn.style.display = 'none';
    }

    // Implement signout logic if clicked when logged in
    signInBtn.onclick = (e) => {
      e.preventDefault();
      // Simple confirm before signing out
      if(confirm('Are you sure you want to sign out?')) {
        currentUser = null;
        localStorage.removeItem('nexusCurrentUser');
        updateAuthUI();
        if (typeof showToast === 'function') {
          showToast('Signed Out', 'You have been signed out successfully.', 'fas fa-sign-out-alt');
        }
      }
    };
  } else {
    signInBtn.innerHTML = `Sign In`;
    signInBtn.classList.add('btn-primary');
    signInBtn.classList.remove('btn-outline');
    if (adminDashboardBtn) adminDashboardBtn.style.display = 'none';
    signInBtn.onclick = (e) => {
      e.preventDefault();
      openAuthModal();
    };
  }
}

function initAuth() {
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

  // Form Submission
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.querySelector('#login-email').value;
    const pwd = document.querySelector('#login-pwd').value;
    
    const user = usersDb.find(u => u.email === email && u.password === pwd);
    
    if (!user) {
      if (typeof showToast === 'function') showToast('Error', 'Invalid email or password.', 'fas fa-exclamation-circle');
      return;
    }
    
    if (user.status === 'rejected') {
      if (typeof showToast === 'function') showToast('Account Rejected', 'Your registration was rejected by the admin.', 'fas fa-ban');
      return;
    }

    if (user.status !== 'approved') {
      if (typeof showToast === 'function') showToast('Account Pending', 'Your account is pending admin approval.', 'fas fa-clock');
      return;
    }
    
    currentUser = user;
    localStorage.setItem('nexusCurrentUser', JSON.stringify(currentUser));
    updateAuthUI();
    closeAuthModal();
    if (typeof showToast === 'function') showToast('Success', 'Logged in successfully!', 'fas fa-check-circle');
  });

  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.querySelector('#reg-name').value;
    const email = document.querySelector('#reg-email').value;
    const pwd = document.querySelector('#reg-pwd').value;

    if (usersDb.find(u => u.email === email)) {
      if (typeof showToast === 'function') showToast('Error', 'Email is already registered.', 'fas fa-exclamation-circle');
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password: pwd,
      status: 'pending' // Admin must approve
    };
    
    usersDb.push(newUser);
    localStorage.setItem('nexusUsers', JSON.stringify(usersDb));
    
    if (typeof showToast === 'function') showToast('Registration complete', 'Your account has been created and is pending admin approval.', 'fas fa-info-circle');
    
    // Switch to login form automatically
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
    authTitle.textContent = 'Sign in to your account';
    authSubtitle.textContent = 'Welcome back! Please enter your details.';
    document.querySelector('#login-email').value = email;
    document.querySelector('#login-pwd').value = pwd; // helpful auto-fill
  });

  adminLoginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.querySelector('#admin-email').value;
    const pwd = document.querySelector('#admin-pwd').value;
    
    const user = usersDb.find(u => u.email === email && u.password === pwd && u.role === 'admin');
    
    if (!user) {
      if (typeof showToast === 'function') showToast('Error', 'Invalid admin credentials.', 'fas fa-exclamation-circle');
      return;
    }
    
    currentUser = user;
    localStorage.setItem('nexusCurrentUser', JSON.stringify(currentUser));
    updateAuthUI();
    closeAuthModal();
    if (typeof showToast === 'function') showToast('Success', 'Logged in as Admin!', 'fas fa-shield-alt');
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
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  // Filter out admin users or show all non-admin
  const regularUsers = usersDb.filter(u => u.role !== 'admin');
  
  if (regularUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted)">No registered users found.</td></tr>`;
    return;
  }
  
  regularUsers.forEach(user => {
    const tr = document.createElement('tr');
    
    // Status Badge
    let statusHTML = '';
    if (user.status === 'approved') {
      statusHTML = `<span class="status-badge status-approved">Active</span>`;
    } else if (user.status === 'rejected') {
      statusHTML = `<span class="status-badge status-rejected">Rejected</span>`;
    } else {
      statusHTML = `<span class="status-badge status-pending">Pending</span>`;
    }
    
    // Action Button
    let actionHTML = '';
    if (user.status === 'pending') {
      actionHTML = `
        <div style="display:flex;gap:6px;">
          <button class="btn-approve" onclick="approveUser(${user.id})">Approve</button>
          <button class="btn-reject" onclick="rejectUser(${user.id})">Reject</button>
        </div>
      `;
    } else {
      actionHTML = `<span style="color:var(--text-muted);font-size:0.8rem;">None</span>`;
    }
    
    tr.innerHTML = `
      <td style="font-weight:500;">${user.name}</td>
      <td>${user.email}</td>
      <td>${statusHTML}</td>
      <td>${actionHTML}</td>
    `;
    
    tbody.appendChild(tr);
  });
}

// Ensure approveUser is accessible globally
window.approveUser = function(userId) {
  const userIndex = usersDb.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    usersDb[userIndex].status = 'approved';
    localStorage.setItem('nexusUsers', JSON.stringify(usersDb));
    renderAdminDashboard();
    if (typeof showToast === 'function') showToast('Success', 'User approved successfully!', 'fas fa-check-circle');
  }
}

// Ensure rejectUser is accessible globally
window.rejectUser = function(userId) {
  const userIndex = usersDb.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    usersDb[userIndex].status = 'rejected';
    localStorage.setItem('nexusUsers', JSON.stringify(usersDb));
    renderAdminDashboard();
    if (typeof showToast === 'function') showToast('Rejected', 'User registration rejected.', 'fas fa-ban');
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
});
