import { useState, useEffect } from 'react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Icons } from '../../components/Icons';
import toast from 'react-hot-toast';

export default function SemestersPage() {
  const [data, setData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ number: 1, course_id: '', academic_year: '' });
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([
    api.get('/api/semesters/').then(r => setData(r.data)),
    api.get('/api/courses/').then(r => setCourses(r.data)),
  ]).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const courseName = (id) => courses.find(c => c.id === id)?.name || '—';
  const openAdd = () => { setEditing(null); setForm({ number: 1, course_id: courses[0]?.id || '', academic_year: '2024-25' }); setModal(true); };
  const openEdit = (row) => { setEditing(row); setForm({ number: row.number, course_id: row.course_id, academic_year: row.academic_year || '' }); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, course_id: parseInt(form.course_id), number: parseInt(form.number) };
      if (editing) { await api.put(`/api/semesters/${editing.id}`, payload); toast.success('Semester updated!'); }
      else { await api.post('/api/semesters/', payload); toast.success('Semester added!'); }
      setModal(false); load();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Error saving'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this semester?')) return;
    try { await api.delete(`/api/semesters/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err?.response?.data?.detail || 'Cannot delete'); }
  };

  const columns = [
    { key: 'number', label: 'Semester', render: r => <span className="badge badge-info">Semester {r.number}</span> },
    { key: 'course_id', label: 'Course', render: r => courseName(r.course_id) },
    { key: 'academic_year', label: 'Academic Year' },
  ];

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Admin</span><span className="sep">›</span><span className="current">Semesters</span></div>
          <h1>Semesters</h1>
          <p>Configure academic semesters for each course</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Icons.Plus /> Add Semester</button>
      </div>
      <DataTable title={`${data.length} Semesters`} columns={columns} data={data}
        actions={(row) => (<>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(row)} title="Edit"><Icons.Edit /></button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(row.id)} title="Delete"><Icons.Delete /></button>
        </>)}
      />
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Semester' : 'Add Semester'}>
        <form onSubmit={save}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Semester Number *</label>
              <input className="form-input" type="number" min={1} max={12} required value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Academic Year</label>
              <input className="form-input" value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} placeholder="2024-25" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Course *</label>
            <select className="form-select" required value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Semester'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
