import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Icons } from '../../components/Icons';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Subject picker component: Course → Semester → Subjects (checkboxes)
// ─────────────────────────────────────────────────────────────────────────────
function SubjectAssignmentPicker({ selectedIds, onChange, courses, semesters, subjects }) {
  const [pickCourse, setPickCourse] = useState('');
  const [pickSemester, setPickSemester] = useState('');

  const courseSemesters = pickCourse
    ? semesters.filter(s => s.course_id === parseInt(pickCourse)).sort((a, b) => a.number - b.number)
    : [];

  const semSubjects = pickSemester
    ? subjects.filter(s => s.semester_id === parseInt(pickSemester))
    : pickCourse
      ? subjects.filter(s => {
          const sem = semesters.find(x => x.id === s.semester_id);
          return sem && sem.course_id === parseInt(pickCourse);
        })
      : [];

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    const allIds = semSubjects.map(s => s.id);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      onChange(selectedIds.filter(id => !allIds.includes(id)));
    } else {
      const newIds = [...new Set([...selectedIds, ...allIds])];
      onChange(newIds);
    }
  };

  // Group assigned subjects by course for summary display
  const assignedSubjects = subjects.filter(s => selectedIds.includes(s.id));
  const byCourse = {};
  for (const subj of assignedSubjects) {
    const sem = semesters.find(s => s.id === subj.semester_id);
    if (!sem) continue;
    const course = courses.find(c => c.id === sem.course_id);
    if (!course) continue;
    const key = course.id;
    if (!byCourse[key]) byCourse[key] = { course, subjects: [] };
    byCourse[key].subjects.push({ subj, sem });
  }

  const allSelected = semSubjects.length > 0 && semSubjects.every(s => selectedIds.includes(s.id));

  return (
    <div>
      {/* Summary chips */}
      {selectedIds.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Assigned Subjects ({selectedIds.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.values(byCourse).map(({ course, subjects: subs }) => (
              <div key={course.id} style={{ width: '100%', marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>{course.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {subs.map(({ subj, sem }) => (
                    <span key={subj.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                      background: 'rgba(108,99,255,0.1)', color: 'var(--accent)',
                      border: '1px solid rgba(108,99,255,0.25)',
                    }}>
                      {subj.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(S{sem.number})</span>
                      <button type="button" onClick={() => toggle(subj.id)} style={{
                        border: 'none', background: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: '0 0 0 2px', lineHeight: 1,
                        display: 'flex', alignItems: 'center',
                      }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 10,
          background: 'var(--red-bg)', border: '1px solid #FECACA',
          fontSize: 13, color: 'var(--red)', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icons.Warning style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>At least one subject must be assigned to create or save a tutor.</span>
        </div>
      )}

      {/* Picker */}
      <div style={{ padding: '16px', background: 'var(--bg-muted)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Add Subjects
        </div>
        <div className="form-row" style={{ marginBottom: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Course</label>
            <select className="form-select" value={pickCourse} onChange={e => { setPickCourse(e.target.value); setPickSemester(''); }}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Semester</label>
            <select className="form-select" value={pickSemester} onChange={e => setPickSemester(e.target.value)} disabled={!pickCourse}>
              <option value="">All Semesters</option>
              {courseSemesters.map(s => <option key={s.id} value={s.id}>Semester {s.number}</option>)}
            </select>
          </div>
        </div>

        {semSubjects.length > 0 ? (
          <div>
            {/* Select All / None */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{semSubjects.length} subject{semSubjects.length !== 1 ? 's' : ''} found</span>
              <button type="button" onClick={toggleAll} style={{
                fontSize: 12, fontWeight: 600, color: 'var(--accent)', border: 'none',
                background: 'none', cursor: 'pointer', padding: '2px 0',
              }}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {semSubjects.map(subj => {
                const sem = semesters.find(s => s.id === subj.semester_id);
                const isChecked = selectedIds.includes(subj.id);
                return (
                  <label key={subj.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: isChecked ? 'rgba(108,99,255,0.08)' : 'var(--surface)',
                    border: `1px solid ${isChecked ? 'rgba(108,99,255,0.3)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(subj.id)}
                      style={{ accentColor: 'var(--accent)', width: 15, height: 15, cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: isChecked ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {subj.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {subj.code} · Semester {sem?.number}
                        {subj.credit_type && subj.credit_type !== 'custom' && (
                          <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 10, background: 'rgba(108,99,255,0.1)', color: 'var(--accent)', fontSize: 10, fontWeight: 700 }}>
                            {subj.credit_type.replace('credit_', 'C ').toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    {isChecked && (
                      <svg viewBox="0 0 16 16" fill="none" style={{ width: 16, height: 16 }}>
                        <circle cx="8" cy="8" r="8" fill="var(--accent)" />
                        <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: 13 }}>
            {pickCourse ? 'No subjects found for this selection' : 'Select a course to browse subjects'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main StaffPage Component
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  username: '', email: '', full_name: '', password: '',
  department_id: '', employee_id: '', designation: '', phone: '',
};

export default function StaffPage() {
  const [data, setData] = useState([]);
  const [depts, setDepts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const [profileForm, setProfileForm] = useState(DEFAULT_PROFILE);
  const [assignedIds, setAssignedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  // Staff quick-view assignment counts (staffId → count)
  const [assignmentCounts, setAssignmentCounts] = useState({});

  const load = useCallback(() => {
    return Promise.all([
      api.get('/api/staff/').then(r => setData(r.data)),
      api.get('/api/departments/').then(r => setDepts(r.data)),
      api.get('/api/courses/').then(r => setCourses(r.data)),
      api.get('/api/semesters/').then(r => setSemesters(r.data)),
      api.get('/api/subjects/').then(r => setSubjects(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load assignment counts for all staff members (for table display)
  useEffect(() => {
    if (!data.length) return;
    // Fire all requests in parallel
    Promise.all(
      data.map(s =>
        api.get(`/api/staff/${s.id}/assignments/`)
          .then(r => ({ id: s.id, count: r.data.length }))
          .catch(() => ({ id: s.id, count: 0 }))
      )
    ).then(results => {
      const counts = {};
      results.forEach(({ id, count }) => { counts[id] = count; });
      setAssignmentCounts(counts);
    });
  }, [data]);

  const deptName = (id) => depts.find(d => d.id === id)?.name || '—';

  const openAdd = () => {
    setEditing(null);
    setProfileForm({ ...DEFAULT_PROFILE, department_id: depts[0]?.id || '' });
    setAssignedIds([]);
    setActiveTab('profile');
    setModal(true);
  };

  const openEdit = async (row) => {
    setEditing(row);
    setProfileForm({
      username: row.user.username, email: row.user.email,
      full_name: row.user.full_name, password: '',
      department_id: row.department_id || '',
      employee_id: row.employee_id, designation: row.designation || '',
      phone: row.phone || '',
    });
    // Load existing assignments
    try {
      const r = await api.get(`/api/staff/${row.id}/assignments/`);
      setAssignedIds(r.data.map(a => a.subject_id));
    } catch {
      setAssignedIds([]);
    }
    setActiveTab('profile');
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();

    if (!assignedIds || assignedIds.length === 0) {
      toast.error('Please assign at least one subject to this tutor before saving.');
      setActiveTab('assignments');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...profileForm,
        department_id: profileForm.department_id ? parseInt(profileForm.department_id) : null,
      };

      let staffId;
      if (editing) {
        await api.put(`/api/staff/${editing.id}`, payload);
        staffId = editing.id;
        toast.success('Tutor updated!');
      } else {
        const res = await api.post('/api/staff/', payload);
        staffId = res.data.id;
        toast.success('Tutor added!');
      }

      // Save subject assignments
      await api.put(`/api/staff/${staffId}/assignments/set/`, { subject_ids: assignedIds });

      setModal(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || Object.values(err?.response?.data || {})?.[0]?.[0] || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this tutor? Their subject assignments will also be removed.')) return;
    try {
      await api.delete(`/api/staff/${id}`);
      toast.success('Tutor deleted');
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Cannot delete'); }
  };

  const TABS = [
    { key: 'profile', label: 'Profile' },
    { key: 'assignments', label: `Subject Assignments${assignedIds.length ? ` (${assignedIds.length})` : ''}` },
  ];

  const columns = [
    { key: 'user', label: 'Name', render: r => r.user?.full_name },
    { key: 'employee_id', label: 'Tutor ID', render: r => <span className="badge badge-primary">{r.employee_id}</span> },
    { key: 'designation', label: 'Designation' },
    { key: 'department_id', label: 'Department', render: r => deptName(r.department_id) },
    { key: 'phone', label: 'Phone' },
    {
      key: 'subjects',
      label: 'Assigned Subjects',
      render: r => {
        const count = assignmentCounts[r.id];
        if (count === undefined) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>loading…</span>;
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: count > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(255,71,87,0.08)',
            color: count > 0 ? '#10b981' : '#ff6b7a',
            border: `1px solid ${count > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(255,71,87,0.2)'}`,
          }}>
            {count > 0 ? `✓ ${count} subject${count !== 1 ? 's' : ''}` : '⚠ Unassigned'}
          </span>
        );
      }
    },
  ];

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Admin</span><span className="sep">›</span><span className="current">Tutors</span></div>
          <h1>Tutor Management</h1>
          <p>Manage tutors, their profile, and subject assignments</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Icons.Plus /> Add Tutor</button>
      </div>

      {/* Unassigned warning banner */}
      {Object.values(assignmentCounts).some(c => c === 0) && (
        <div style={{
          marginBottom: 20, padding: '12px 18px', borderRadius: 10,
          background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.2)',
          fontSize: 13, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠️</span>
          <span>Some tutors have no subject assignments and won't be able to enter marks or attendance.</span>
        </div>
      )}

      <DataTable
        title={`${data.length} Tutors`}
        columns={columns}
        data={data}
        actions={(row) => (<>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(row)} title="Edit"><Icons.Edit /></button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(row.id)} title="Delete"><Icons.Delete /></button>
        </>)}
      />

      {/* ── Modal ── */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? `Edit — ${editing.user?.full_name}` : 'Add Tutor'}>
        <form onSubmit={save}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
            {TABS.map(tab => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={{
                padding: '8px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontWeight: activeTab === tab.key ? 700 : 400,
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, fontSize: 14, transition: 'all .15s', whiteSpace: 'nowrap',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Profile ── */}
          {activeTab === 'profile' && (<>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" required value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} placeholder="e.g. Dr. Sarah Johnson" />
              </div>
              <div className="form-group">
                <label className="form-label">Tutor ID *</label>
                <input className="form-input" required value={profileForm.employee_id} onChange={e => setProfileForm({ ...profileForm, employee_id: e.target.value })} disabled={!!editing} placeholder="e.g. T001" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input className="form-input" required value={profileForm.username} onChange={e => setProfileForm({ ...profileForm, username: e.target.value })} disabled={!!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" required value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password {editing ? '(leave blank to keep)' : '*'}</label>
                <input className="form-input" type="password" required={!editing} value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="e.g. +91 98765 43210" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-input" value={profileForm.designation} onChange={e => setProfileForm({ ...profileForm, designation: e.target.value })} placeholder="e.g. Associate Professor" />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" value={profileForm.department_id} onChange={e => setProfileForm({ ...profileForm, department_id: e.target.value })}>
                  <option value="">Select department</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 8,
              background: assignedIds.length > 0 ? 'var(--accent-light)' : 'var(--red-bg)',
              border: `1px solid ${assignedIds.length > 0 ? 'var(--accent-border)' : '#FECACA'}`,
              fontSize: 12.5,
              color: assignedIds.length > 0 ? 'var(--accent-dark)' : 'var(--red)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {assignedIds.length > 0 ? (
                <>
                  <Icons.Check style={{ width: 15, height: 15, color: 'var(--accent)', flexShrink: 0 }} />
                  <span><strong>{assignedIds.length} subject{assignedIds.length !== 1 ? 's' : ''} assigned.</strong> Manage subjects in the <button type="button" onClick={() => setActiveTab('assignments')} style={{ color: 'var(--accent)', fontWeight: 700, underline: 'always', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Subject Assignments</button> tab.</span>
                </>
              ) : (
                <>
                  <Icons.Warning style={{ width: 15, height: 15, color: 'var(--red)', flexShrink: 0 }} />
                  <span><strong>Action required:</strong> At least one subject must be selected in the <button type="button" onClick={() => setActiveTab('assignments')} style={{ color: 'var(--red)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>Subject Assignments</button> tab.</span>
                </>
              )}
            </div>
          </>)}

          {/* ── Tab: Subject Assignments ── */}
          {activeTab === 'assignments' && (
            <SubjectAssignmentPicker
              selectedIds={assignedIds}
              onChange={setAssignedIds}
              courses={courses}
              semesters={semesters}
              subjects={subjects}
            />
          )}

          <div className="modal-footer" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Tutor' : 'Add Tutor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
