import { useState, useEffect } from 'react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Icons } from '../../components/Icons';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function StudentsPage() {
  const [data, setData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '', roll_number: '', course_id: '', semester_id: '', batch_year: new Date().getFullYear(), phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [filteredSems, setFilteredSems] = useState([]);
  
  // View mode
  const [viewArchived, setViewArchived] = useState(false);
  
  // Filters state
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterBatchYear, setFilterBatchYear] = useState('');
  
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    return Promise.all([
      api.get(`/api/students/?is_graduated=${viewArchived}`).then(r => setData(r.data)),
      api.get('/api/courses/').then(r => setCourses(r.data)),
      api.get('/api/semesters/').then(r => setSemesters(r.data)),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    // Whenever view mode toggles, reload students list
    api.get(`/api/students/?is_graduated=${viewArchived}`).then(r => setData(r.data));
  }, [viewArchived]);

  useEffect(() => {
    setFilteredSems(semesters.filter(s => s.course_id === parseInt(form.course_id)));
  }, [form.course_id, semesters]);

  const courseName = (id) => courses.find(c => c.id === id)?.name || '—';
  const semLabel = (id) => { const s = semesters.find(x => x.id === id); return s ? `Sem ${s.number}` : '—'; };

  const openAdd = () => {
    setEditing(null);
    const c = courses[0];
    setForm({ username: '', email: '', full_name: '', password: '', roll_number: '', course_id: c?.id || '', semester_id: '', batch_year: new Date().getFullYear(), phone: '', address: '' });
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ username: row.user.username, email: row.user.email, full_name: row.user.full_name, password: '', roll_number: row.roll_number, course_id: row.course_id, semester_id: row.semester_id, batch_year: row.batch_year || '', phone: row.phone || '', address: '' });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, course_id: parseInt(form.course_id), semester_id: parseInt(form.semester_id), batch_year: parseInt(form.batch_year) };
      if (editing) { await api.put(`/api/students/${editing.id}`, payload); toast.success('Student updated!'); }
      else { await api.post('/api/students/', payload); toast.success('Student added!'); }
      setModal(false); load();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Error saving'); }
    finally { setSaving(false); }
  };


  const del = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try { await api.delete(`/api/students/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err?.response?.data?.detail || 'Cannot delete'); }
  };

  const columns = [
    { key: 'roll_number', label: 'Roll No.', render: r => <span className="badge badge-primary">{r.roll_number}</span> },
    { key: 'user', label: 'Student Name', render: r => r.user?.full_name },
    { key: 'course_id', label: 'Course', render: r => courseName(r.course_id) },
    { key: 'semester_id', label: 'Semester', render: r => semLabel(r.semester_id) },
    { key: 'batch_year', label: 'Batch' },
  ];

  // Filtering calculations
  const filteredByCourse = filterCourse
    ? data.filter(s => s.course_id === parseInt(filterCourse))
    : data;

  const filteredBySem = filterSemester
    ? filteredByCourse.filter(s => s.semester_id === parseInt(filterSemester))
    : filteredByCourse;

  const filteredData = filterBatchYear
    ? filteredBySem.filter(s => s.batch_year === parseInt(filterBatchYear))
    : filteredBySem;

  const filterSemesters = filterCourse
    ? semesters.filter(s => s.course_id === parseInt(filterCourse)).sort((a, b) => a.number - b.number)
    : [];

  const uniqueBatchYears = Array.from(new Set(data.map(s => s.batch_year).filter(Boolean))).sort((a, b) => b - a);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Admin</span><span className="sep">›</span><span className="current">Students</span></div>
          <h1>Students</h1>
          <p>Manage student enrollment and academic details</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Icons.Plus /> Enroll Student</button>
      </div>

      {/* Active / Archive tabs */}
      <div style={{ display: 'flex', marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => { setViewArchived(false); setFilterCourse(''); setFilterSemester(''); setFilterBatchYear(''); }}
          style={{
            padding: '10px 24px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontWeight: !viewArchived ? 700 : 400,
            color: !viewArchived ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: !viewArchived ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, fontSize: 14, transition: 'all .15s'
          }}
        >
          Active Students
        </button>
        <button
          type="button"
          onClick={() => { setViewArchived(true); setFilterCourse(''); setFilterSemester(''); setFilterBatchYear(''); }}
          style={{
            padding: '10px 24px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontWeight: viewArchived ? 700 : 400,
            color: viewArchived ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: viewArchived ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, fontSize: 14, transition: 'all .15s'
          }}
        >
          Archived / Graduated Students
        </button>
      </div>

      {/* Filter panel */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
            <label className="form-label">Filter by Course</label>
            <select className="form-select" value={filterCourse} onChange={e => { setFilterCourse(e.target.value); setFilterSemester(''); }}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
            <label className="form-label">Filter by Semester</label>
            <select className="form-select" value={filterSemester} onChange={e => setFilterSemester(e.target.value)} disabled={!filterCourse}>
              <option value="">All Semesters</option>
              {filterSemesters.map(s => <option key={s.id} value={s.id}>Semester {s.number}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
            <label className="form-label">Filter by Batch Year</label>
            <select className="form-select" value={filterBatchYear} onChange={e => setFilterBatchYear(e.target.value)}>
              <option value="">All Batches</option>
              {uniqueBatchYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}
            </select>
          </div>
          {(filterCourse || filterSemester || filterBatchYear) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setFilterCourse(''); setFilterSemester(''); setFilterBatchYear(''); }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <DataTable title={`${filteredData.length} Students`} columns={columns} data={filteredData}
        actions={(row) => (<>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/reports/student/${row.id}`)}><Icons.Report /> Report</button>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(row)} title="Edit"><Icons.Edit /></button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(row.id)} title="Delete"><Icons.Delete /></button>
        </>)}
      />
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Student' : 'Enroll Student'} size="lg">
        <form onSubmit={save}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Roll Number *</label>
              <input className="form-input" required value={form.roll_number} onChange={e => setForm({ ...form, roll_number: e.target.value })} disabled={!!editing} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="form-input" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!!editing} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password {editing ? '(leave blank)' : '*'}</label>
              <input className="form-input" type="password" required={!editing} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Course *</label>
              <select className="form-select" required value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value, semester_id: '' })}>
                <option value="">Select course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select className="form-select" required value={form.semester_id} onChange={e => setForm({ ...form, semester_id: e.target.value })}>
                <option value="">Select semester</option>
                {filteredSems.map(s => <option key={s.id} value={s.id}>Semester {s.number}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Batch Year</label>
            <input className="form-input" type="number" value={form.batch_year} onChange={e => setForm({ ...form, batch_year: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Enroll Student'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
