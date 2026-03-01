let currentUser = null;
let reviewingId = null;

window.addEventListener('DOMContentLoaded', async () => {
  currentUser = requireAuth('head_of_college');
  if (!currentUser) return;
  document.getElementById('navUserName').textContent = currentUser.full_name;
  await loadPermissions();
});

async function loadPermissions() {
  const filter = document.getElementById('filterStatus').value;
  const list = document.getElementById('permissionsList');
  list.innerHTML = '<div class="loading">Loading requests...</div>';

  const { ok, data } = await apiCall('GET', '/permissions/hoc/all');

  if (!ok) {
    list.innerHTML = `<div class="error-msg">${data.message}</div>`;
    return;
  }

  const filtered = filter ? data.filter(p => p.hoc_status === filter) : data;

  document.getElementById('statTotal').textContent = data.length;
  document.getElementById('statPending').textContent = data.filter(p => p.hoc_status === 'pending').length;
  document.getElementById('statApproved').textContent = data.filter(p => p.hoc_status === 'approved').length;
  document.getElementById('statRejected').textContent = data.filter(p => p.hoc_status === 'rejected').length;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>No requests found</p>
        <small>Requests only appear here after HOD approves them</small>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(p => `
    <div class="permission-card ${p.hoc_status}" id="card-${p.id}">
      <div class="perm-header">
        <div>
          <div class="perm-type">${formatType(p.type)}</div>
          <div style="font-size:13px;color:var(--text-light);margin-top:3px">
            👤 <strong>${p.staff_name}</strong> — ${p.department}
          </div>
          <div style="font-size:12px;color:var(--text-light)">📧 ${p.staff_email}</div>
        </div>
        ${getStatusBadge(p.hoc_status)}
      </div>

      <div class="perm-info" style="margin:10px 0">
        📅 <strong>${formatDate(p.start_date)}</strong> → <strong>${formatDate(p.end_date)}</strong><br>
        🕐 Submitted: ${formatDate(p.created_at)}
      </div>

      <div class="perm-reason">"${p.reason}"</div>

      <div style="margin-top:8px;padding:8px 12px;background:#f0fdf4;border-radius:6px;font-size:12px;color:#15803d;border:1px solid #bbf7d0">
        ✓ HOD Approved by: <strong>${p.hod_reviewer_name || 'HOD'}</strong>
        ${p.hod_comment ? ` — "${p.hod_comment}"` : ''}
      </div>

      ${p.hoc_status === 'pending' ? `
        <div style="margin-top:14px;padding:14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:#475569">Your Final Decision:</div>
          <div style="margin-bottom:10px">
            <label style="font-size:12px;font-weight:600;color:#64748b">Comment (optional)</label>
            <textarea id="comment-${p.id}" rows="2"
              style="width:100%;margin-top:4px;padding:8px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;resize:none"
              placeholder="Write a comment for the staff member..."></textarea>
          </div>
          <div style="display:flex;gap:10px">
            <button onclick="quickReview(${p.id}, 'rejected')"
              style="flex:1;padding:12px;background:#dc2626;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">
              ✗ REJECT
            </button>
            <button onclick="quickReview(${p.id}, 'approved')"
              style="flex:1;padding:12px;background:#16a34a;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">
              ✓ FINAL APPROVE
            </button>
          </div>
          <div id="result-${p.id}" style="margin-top:8px;font-size:13px;text-align:center"></div>
        </div>
      ` : `
        <div style="margin-top:12px;padding:10px 14px;border-radius:8px;font-size:13px;
          background:${p.hoc_status === 'approved' ? '#f0fdf4' : '#fef2f2'};
          border:1px solid ${p.hoc_status === 'approved' ? '#bbf7d0' : '#fecaca'};
          color:${p.hoc_status === 'approved' ? '#15803d' : '#dc2626'}">
          ${p.hoc_status === 'approved' ? '✓ Finally Approved by you (Head of College)' : '✗ Rejected by you (Head of College)'}
          ${p.hoc_comment ? `<div style="margin-top:4px;font-style:italic">"${p.hoc_comment}"</div>` : ''}
        </div>
      `}
    </div>
  `).join('');
}

async function quickReview(id, status) {
  const comment = document.getElementById('comment-' + id).value.trim();
  const resultDiv = document.getElementById('result-' + id);

  resultDiv.textContent = 'Processing...';
  resultDiv.style.color = '#64748b';

  const { ok, data } = await apiCall('PUT', '/permissions/hoc/review/' + id, { status, comment });

  if (!ok) {
    resultDiv.textContent = 'Error: ' + data.message;
    resultDiv.style.color = '#dc2626';
    return;
  }

  resultDiv.textContent = status === 'approved' ? '✓ Permission finally approved!' : '✗ Permission rejected.';
  resultDiv.style.color = status === 'approved' ? '#16a34a' : '#dc2626';

  setTimeout(() => loadPermissions(), 1000);
}

function closeModal() {
  document.getElementById('reviewModal').classList.add('hidden');
  reviewingId = null;
}
