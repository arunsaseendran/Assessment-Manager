import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';

export default function StudentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    full_name: '',
    roll_number: '',
    course_name: '',
    semester_number: '',
    phone: '',
    address: '',
    password: '',
    confirm_password: ''
  });

  useEffect(() => {
    api.get('/api/student/profile/')
      .then(res => {
        setForm({
          username: res.data.username || '',
          email: res.data.email || '',
          full_name: res.data.full_name || '',
          roll_number: res.data.roll_number || '',
          course_name: res.data.course_name || '',
          semester_number: res.data.semester_number || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          password: '',
          confirm_password: ''
        });
      })
      .catch(() => toast.error('Failed to load student profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        phone: form.phone,
        address: form.address
      };
      if (form.password) {
        payload.password = form.password;
      }

      const res = await api.put('/api/student/profile/', payload);
      toast.success(res.data.message || 'Profile updated successfully!');
      
      setForm(prev => ({
        ...prev,
        password: '',
        confirm_password: ''
      }));
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Student</span><span className="sep">›</span><span className="current">Settings</span></div>
          <h1>Profile Settings</h1>
          <p>Update your learner record details, phone, address, and credentials</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24, marginTop: 24, alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icons.Student style={{ width: 18, height: 18, color: 'var(--accent)' }} /> Update Profile Details
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.full_name} disabled style={{ background: 'var(--bg-subtle)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input className="form-input" value={form.roll_number} disabled style={{ background: 'var(--bg-subtle)' }} />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Course</label>
                <input className="form-input" value={form.course_name} disabled style={{ background: 'var(--bg-subtle)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Academic Semester</label>
                <input className="form-input" value={`Semester ${form.semester_number}`} disabled style={{ background: 'var(--bg-subtle)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                className="form-input"
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email ID *</label>
              <input
                className="form-input"
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Home Address</label>
              <textarea
                className="form-input"
                rows="3"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Enter complete address"
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Change Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.password}
                  placeholder="Leave blank to keep current"
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.confirm_password}
                  placeholder="Confirm password"
                  onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(37,99,235,0.06))' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icons.Report style={{ width: 18, height: 18, color: 'var(--accent)' }} /> Profile Guidelines
          </h3>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: 12 }}>
              <strong>Recovery Email:</strong> Please maintain an accurate active Email ID. This email is critical for recovering your credentials if you ever forget them.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong>Restricted Fields:</strong> Name, Roll Number, Course, and Semester can only be modified by the portal administrator to maintain assessment identity records.
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-green)', fontWeight: 600 }}>
              <Icons.Attendance style={{ width: 16, height: 16 }} /> Changes apply immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
