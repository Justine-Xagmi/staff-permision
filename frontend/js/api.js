// API base URL - automatically detect if running on same server
const API_BASE = window.location.origin + '/api';

// Generic API call function
async function apiCall(method, endpoint, body = null) {
  const token = localStorage.getItem('sps_token');
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(API_BASE + endpoint, options);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { message: 'Network error. Is the server running?' } };
  }
}

// Auth helpers
function getUser() {
  const u = localStorage.getItem('sps_user');
  return u ? JSON.parse(u) : null;
}

function getToken() {
  return localStorage.getItem('sps_token');
}

function logout() {
  localStorage.removeItem('sps_token');
  localStorage.removeItem('sps_user');
  window.location.href = '/';
}

// Check auth and redirect if needed
function requireAuth(requiredRole = null) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    window.location.href = '/';
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to correct dashboard
    redirectByRole(user.role);
    return null;
  }

  return user;
}

function redirectByRole(role) {
  if (role === 'staff') window.location.href = '/pages/staff-dashboard.html';
  else if (role === 'head_of_department') window.location.href = '/pages/hod-dashboard.html';
  else if (role === 'head_of_college') window.location.href = '/pages/hoc-dashboard.html';
  else window.location.href = '/';
}

// Format helpers
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatType(type) {
  const map = {
    annual_leave: 'Annual Leave',
    sick_leave: 'Sick Leave',
    emergency_leave: 'Emergency Leave',
    other: 'Other'
  };
  return map[type] || type;
}

function getStatusBadge(status) {
  return `<span class="status-badge ${status}">${status}</span>`;
}

function getProgressSteps(p) {
  const hodClass = p.hod_status === 'approved' ? 'done' : p.hod_status === 'rejected' ? 'fail' : '';
  const hocClass = p.hoc_status === 'approved' ? 'done' : p.hoc_status === 'rejected' ? 'fail' : '';
  const hodIcon = p.hod_status === 'approved' ? '✓' : p.hod_status === 'rejected' ? '✗' : '⏳';
  const hocIcon = p.hoc_status === 'approved' ? '✓' : p.hoc_status === 'rejected' ? '✗' : '⏳';

  return `
    <div class="perm-progress">
      <div class="progress-step ${hodClass}">${hodIcon} HOD: ${p.hod_status}</div>
      <div class="progress-step ${hocClass}">${hocIcon} HOC: ${p.hoc_status}</div>
    </div>
  `;
}

// ===== PWA Service Worker Registration =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('✅ Service Worker registered:', reg.scope))
      .catch((err) => console.log('❌ SW registration failed:', err));
  });
}

// ===== PWA Install Prompt =====
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show install banner if not already installed
  const banner = document.getElementById('installBanner');
  if (banner) banner.classList.remove('hidden');
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((result) => {
      console.log('Install result:', result.outcome);
      deferredPrompt = null;
      const banner = document.getElementById('installBanner');
      if (banner) banner.classList.add('hidden');
    });
  }
}

window.addEventListener('appinstalled', () => {
  console.log('✅ App installed successfully!');
  const banner = document.getElementById('installBanner');
  if (banner) banner.classList.add('hidden');
});
