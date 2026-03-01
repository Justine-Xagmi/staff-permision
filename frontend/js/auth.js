// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  const user = getUser();
  if (token && user) {
    redirectByRole(user.role);
  }
});

function showTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.remove('active');
    c.classList.add('hidden');
  });
  document.getElementById(`${tab}-tab`).classList.remove('hidden');
  document.getElementById(`${tab}-tab`).classList.add('active');
  event.target.classList.add('active');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  errorDiv.classList.add('hidden');
  btn.disabled = true;
  btn.querySelector('.btn-text').classList.add('hidden');
  btn.querySelector('.btn-loader').classList.remove('hidden');

  const { ok, data } = await apiCall('POST', '/auth/login', { email, password });

  btn.disabled = false;
  btn.querySelector('.btn-text').classList.remove('hidden');
  btn.querySelector('.btn-loader').classList.add('hidden');

  if (!ok) {
    errorDiv.textContent = data.message || 'Login failed.';
    errorDiv.classList.remove('hidden');
    return;
  }

  localStorage.setItem('sps_token', data.token);
  localStorage.setItem('sps_user', JSON.stringify(data.user));
  redirectByRole(data.user.role);
}

async function handleRegister(e) {
  e.preventDefault();
  const full_name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const department = document.getElementById('regDepartment').value;
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  const errorDiv = document.getElementById('registerError');
  const successDiv = document.getElementById('registerSuccess');
  const btn = document.getElementById('registerBtn');

  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');

  if (password !== confirmPassword) {
    errorDiv.textContent = 'Passwords do not match.';
    errorDiv.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.querySelector('.btn-text').classList.add('hidden');
  btn.querySelector('.btn-loader').classList.remove('hidden');

  const { ok, data } = await apiCall('POST', '/auth/register', { full_name, email, password, department });

  btn.disabled = false;
  btn.querySelector('.btn-text').classList.remove('hidden');
  btn.querySelector('.btn-loader').classList.add('hidden');

  if (!ok) {
    errorDiv.textContent = data.message || 'Registration failed.';
    errorDiv.classList.remove('hidden');
    return;
  }

  successDiv.textContent = data.message;
  successDiv.classList.remove('hidden');
  document.getElementById('registerForm').reset();

  // Auto-switch to login after 2s
  setTimeout(() => {
    document.querySelector('.tab-btn').click();
  }, 2000);
}
