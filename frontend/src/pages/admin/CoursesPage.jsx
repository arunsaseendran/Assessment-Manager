import { useState, useEffect } from 'react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Icons } from '../../components/Icons';
import toast from 'react-hot-toast';

export default function CoursesPage() {
  const [data, setData] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', department_id: '', duration_years: 3, num_semesters: 6, description: '' });
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [codeError, setCodeError] = useState('');

  const load = () => {
    const t = new Date().getTime();
    return Promise.all([
      api.get(`/api/courses/?t=${t}`).then(r => setData(r.data)),
      api.get(`/api/departments/?t=${t}`).then(r => setDepts(r.data)),
    ]).catch(() => toast.error('Failed to load data')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deptName = (id) => depts.find(d => d.id === id)?.name || '—';

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', code: '', department_id: depts[0]?.id || '', duration_years: 3, num_semesters: 6, description: '' });
    setNameError(''); setCodeError('');
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name, code: row.code, department_id: row.department_id, duration_years: row.duration_years, num_semesters: row.num_semesters || 6, description: row.description || '' });
    setNameError(''); setCodeError('');
    setModal(true);
  };

  // Inline validation — check uniqueness as user types
  const validateName = (val) => {
    const exists = data.find(c => c.name.toLowerCase() === val.toLowerCase() && c.id !== editing?.id);
    setNameError(exists ? `Course name "${val}" already exists.` : '');
  };

  const validateCode = (val) => {
    const exists = data.find(c => c.code.toLowerCase() === val.toLowerCase() && c.id !== editing?.id);
    setCodeError(exists ? `Code "${val}" is already in use.` : '');
  };

  const save = async (e) => {
    e.preventDefault();
    if (nameError || codeError) { toast.error('Please fix validation errors first'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        department_id: parseInt(form.department_id),
        duration_years: parseInt(form.duration_years),
        num_semesters: parseInt(form.num_semesters),
      };
      if (editing) {
        await api.put(`/api/courses/${editing.id}/`, payload);
        toast.success('Course updated!');
      } else {
        await api.post('/api/courses/', payload);
        toast.success('Course added!');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Error saving course');
    } finally { setSaving(false); }
  };

  const del = async (row) => {
    if (!window.confirm(`Delete course "${row.name}"? This will also remove all linked semesters and subjects.`)) return;
    try {
      await api.delete(`/api/courses/${row.id}/`);
      setData(prev => prev.filter(c => c.id !== row.id));
      toast.success(`Course "${row.name}" deleted`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Cannot delete this course');
    }
  };

  const columns = [
    {
      key: 'name', label: 'Course Name',
      render: r => (
        <div>
          <div style={{ fontWeight: 700 }}>{r.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.description || ''}</div>
        </div>
      )
    },
    {
      key: 'code', label: 'Code',
      render: r => <span className="badge badge-primary" style={{ fontWeight: 800, letterSpacing: 1 }}>{r.code}</span>
    },
    { key: 'department_id', label: 'Department', render: r => deptName(r.department_id) },
    { key: 'duration_years', label: 'Duration', render: r => `${r.duration_years} Yrs` },
    { key: 'num_semesters', label: 'Semesters', render: r => `${r.num_semesters || 6} Sems` },
  ];

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Admin</span><span className="sep">›</span><span className="current">Courses</span></div>
          <h1>Courses</h1>
          <p>Manage degree programs — Course Name and Code are unique identifiers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Icons.Plus /> Add Course</button>
      </div>

      <DataTable title={`${data.length} Courses`} columns={columns} data={data}
        actions={(row) => (
          <>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(row)} title="Edit"><Icons.Edit /></button>
            <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(row)} title="Delete"><Icons.Delete /></button>
          </>
        )}
      />

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Course' : 'Add Course'}>
        <form onSubmit={save}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Course Name *
              </label>
              <input
                className={`form-input${nameError ? ' input-error' : ''}`}
                required
                value={form.name}
                onChange={e => { setForm({ ...form, name: e.target.value }); validateName(e.target.value); }}
                placeholder="e.g. Bachelor of Computer Applications"
                style={nameError ? { borderColor: 'var(--accent-red)' } : {}}
              />
              {nameError && <div style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{nameError}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">
                Code *
              </label>
              <input
                className="form-input"
                required
                value={form.code}
                onChange={e => { const v = e.target.value.toUpperCase(); setForm({ ...form, code: v }); validateCode(v); }}
                placeholder="e.g. BCA"
                maxLength={20}
                style={codeError ? { borderColor: 'var(--accent-red)' } : { fontWeight: 700, letterSpacing: 1 }}
              />
              {codeError && <div style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4 }}>{codeError}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" required value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                <option value="">Select department</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Duration (Years)</label>
              <input className="form-input" type="number" min={1} max={6} value={form.duration_years} onChange={e => setForm({ ...form, duration_years: e.target.value })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Number of Semesters</label>
              <input
                className="form-input" type="number" min={1} max={12}
                value={form.num_semesters}
                onChange={e => setForm({ ...form, num_semesters: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea form-input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the course..." />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !!nameError || !!codeError}>
              {saving ? 'Saving...' : editing ? 'Update Course' : 'Add Course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
