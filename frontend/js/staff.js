let currentUser = null;
let editingId = null;

window.addEventListener('DOMContentLoaded', async () => {
  currentUser = requireAuth('staff');
  if (!currentUser) return;
  document.getElementById('navUserName').textContent = currentUser.full_name;
  await loadPermissions();
});

async function loadPermissions() {
  const { ok, data } = await apiCall('GET', '/permissions/my');
  const list = document.getElementById('permissionsList');

  if (!ok) {
    list.innerHTML = `<div class="error-msg">${data.message}</div>`;
    return;
  }

  // Update stats
  document.getElementById('statTotal').textContent = data.length;
  document.getElementById('statPending').textContent = data.filter(p => p.final_status === 'pending').length;
  document.getElementById('statApproved').textContent = data.filter(p => p.final_status === 'approved').length;
  document.getElementById('statRejected').textContent = data.filter(p => p.final_status === 'rejected').length;

  if (data.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        <p>No permission requests yet</p>
        <small>Click "+ New Request" to submit your first request</small>
      </div>`;
    return;
  }

  list.innerHTML = data.map(p => `
    <div class="permission-card ${p.final_status}">
      <div class="perm-header">
        <div class="perm-type">${formatType(p.type)}</div>
        ${getStatusBadge(p.final_status)}
      </div>
      <div class="perm-info">
        📅 ${formatDate(p.start_date)} → ${formatDate(p.end_date)}<br>
        🕐 Submitted: ${formatDate(p.created_at)}
      </div>
      <div class="perm-reason">"${p.reason}"</div>
      ${getProgressSteps(p)}
      <div class="perm-actions" style="margin-top:10px">
        <button class="btn-icon view" onclick="viewDetails(${p.id})">👁 View</button>
        ${p.hod_status === 'pending' ? `
          <button class="btn-icon edit" onclick="openEditModal(${JSON.stringify(p).replace(/"/g,'&quot;')})">✏️ Edit</button>
          <button class="btn-icon delete" onclick="deletePermission(${p.id})">🗑 Delete</button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function openModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'New Permission Request';
  document.getElementById('permissionForm').reset();
  document.getElementById('editPermissionId').value = '';
  document.getElementById('permError').classList.add('hidden');
  document.getElementById('permissionModal').classList.remove('hidden');
}

function openEditModal(p) {
  editingId = p.id;
  document.getElementById('modalTitle').textContent = 'Edit Permission Request';
  document.getElementById('permType').value = p.type;
  document.getElementById('permStartDate').value = p.start_date ? p.start_date.split('T')[0] : '';
  document.getElementById('permEndDate').value = p.end_date ? p.end_date.split('T')[0] : '';
  document.getElementById('permReason').value = p.reason;
  document.getElementById('editPermissionId').value = p.id;
  document.getElementById('permError').classList.add('hidden');
  document.getElementById('permissionModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('permissionModal').classList.add('hidden');
}

async function submitPermission(e) {
  e.preventDefault();
  const reason = document.getElementById('permReason').value.trim();
  const start_date = document.getElementById('permStartDate').value;
  const end_date = document.getElementById('permEndDate').value;
  const type = document.getElementById('permType').value;
  const errorDiv = document.getElementById('permError');
  const btn = document.getElementById('submitPermBtn');

  errorDiv.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  let result;
  if (editingId) {
    result = await apiCall('PUT', `/permissions/${editingId}`, { reason, start_date, end_date, type });
  } else {
    result = await apiCall('POST', '/permissions', { reason, start_date, end_date, type });
  }

  btn.disabled = false;
  btn.textContent = 'Submit Request';

  if (!result.ok) {
    errorDiv.textContent = result.data.message || 'Failed to submit.';
    errorDiv.classList.remove('hidden');
    return;
  }

  closeModal();
  await loadPermissions();
}

async function deletePermission(id) {
  if (!confirm('Are you sure you want to delete this request?')) return;
  const { ok, data } = await apiCall('DELETE', `/permissions/${id}`);
  if (!ok) { alert(data.message); return; }
  await loadPermissions();
}

async function viewDetails(id) {
  const { ok, data } = await apiCall('GET', `/permissions/${id}`);
  if (!ok) { alert('Failed to load details.'); return; }

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-section">
      <h4>Request Info</h4>
      <div class="detail-row"><span>Type</span><span>${formatType(data.type)}</span></div>
      <div class="detail-row"><span>Start Date</span><span>${formatDate(data.start_date)}</span></div>
      <div class="detail-row"><span>End Date</span><span>${formatDate(data.end_date)}</span></div>
      <div class="detail-row"><span>Submitted</span><span>${formatDate(data.created_at)}</span></div>
      <div class="detail-row"><span>Final Status</span><span>${getStatusBadge(data.final_status)}</span></div>
    </div>
    <div class="detail-section">
      <h4>Reason</h4>
      <div class="perm-reason">${data.reason}</div>
    </div>
    <div class="detail-section">
      <h4>HOD Review</h4>
      <div class="detail-row"><span>Status</span><span>${getStatusBadge(data.hod_status)}</span></div>
      <div class="detail-row"><span>Reviewed by</span><span>${data.hod_reviewer_name || 'Not yet'}</span></div>
      <div class="detail-row"><span>Comment</span><span>${data.hod_comment || 'No comment'}</span></div>
      <div class="detail-row"><span>Date</span><span>${data.hod_reviewed_at ? formatDate(data.hod_reviewed_at) : '-'}</span></div>
    </div>
    <div class="detail-section">
      <h4>Head of College Review</h4>
      <div class="detail-row"><span>Status</span><span>${getStatusBadge(data.hoc_status)}</span></div>
      <div class="detail-row"><span>Reviewed by</span><span>${data.hoc_reviewer_name || 'Not yet'}</span></div>
      <div class="detail-row"><span>Comment</span><span>${data.hoc_comment || 'No comment'}</span></div>
      <div class="detail-row"><span>Date</span><span>${data.hoc_reviewed_at ? formatDate(data.hoc_reviewed_at) : '-'}</span></div>
    </div>
  `;
  document.getElementById('detailModal').classList.remove('hidden');
}

function closeDetailModal() {
  document.getElementById('detailModal').classList.add('hidden');
}
