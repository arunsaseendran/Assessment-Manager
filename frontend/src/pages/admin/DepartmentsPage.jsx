import { useState, useEffect } from 'react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Icons } from '../../components/Icons';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/api/departments/').then(r => setData(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', code: '', description: '' }); setModal(true); };
  const openEdit = (row) => { setEditing(row); setForm({ name: row.name, code: row.code, description: row.description || '' }); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await api.put(`/api/departments/${editing.id}`, form); toast.success('Department updated!'); }
      else { await api.post('/api/departments/', form); toast.success('Department added!'); }
      setModal(false); load();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Error saving'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try { await api.delete(`/api/departments/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err?.response?.data?.detail || 'Cannot delete'); }
  };

  const columns = [
    { key: 'name', label: 'Department Name' },
    { key: 'code', label: 'Code', render: (r) => <span className="badge badge-primary">{r.code}</span> },
    { key: 'description', label: 'Description' },
    { key: 'created_at', label: 'Created', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '—' },
  ];

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Admin</span><span className="sep">›</span><span className="current">Departments</span></div>
          <h1>Departments</h1>
          <p>Manage academic departments in your institution</p>
        </div>
        <button id="add-dept-btn" className="btn btn-primary" onClick={openAdd}><Icons.Plus /> Add Department</button>
      </div>

      <DataTable
        title={`${data.length} Departments`}
        columns={columns}
        data={data}
        actions={(row) => (
          <>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(row)} title="Edit"><Icons.Edit /></button>
            <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(row.id)} title="Delete"><Icons.Delete /></button>
          </>
        )}
      />

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={save}>
          <div className="form-group">
            <label className="form-label">Department Name *</label>
            <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Science" />
          </div>
          <div className="form-group">
            <label className="form-label">Code *</label>
            <input className="form-input" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. CS" maxLength={10} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Department'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
