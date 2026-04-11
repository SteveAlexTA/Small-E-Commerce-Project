// ─── Authentication State ───
let currentUser = JSON.parse(localStorage.getItem('nexusCurrentUser')) || null;
let usersDb = JSON.parse(localStorage.getItem('nexusUsers')) || [];

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
  if (!signInBtn) return;
  
  if (currentUser) {
    signInBtn.innerHTML = `<i class="fas fa-user-circle" style="margin-right:6px"></i> ${currentUser.name.split(' ')[0]}`;
    signInBtn.classList.remove('btn-primary');
    signInBtn.classList.add('btn-outline');
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
  const loginForm = document.querySelector('#login-form');
  const registerForm = document.querySelector('#register-form');
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
}
