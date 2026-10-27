import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';

// ─── Constants ────────────────────────────────────────────────────────────────
const FORMULA_OPTIONS = [
  { value: 'best2of3', label: 'Best 2 of 3 Tests',  desc: 'Average of the two highest test scores' },
  { value: 'best1of3', label: 'Best 1 of 3 Tests',  desc: 'Only the single highest test score counts' },
  { value: 'average',  label: 'Average of All 3',   desc: 'Sum of all 3 tests divided by 3' },
  { value: 'all3',     label: 'Sum of All 3 Tests', desc: 'All 3 test scores added together directly' },
];

const BUILTIN_KEYS = ['4credit_combined', '3credit_combined', '4credit_theory', '3credit_theory'];

const BUILTIN_META = {
  '4credit_combined': { label: '4 Credit Course', sub: '3 Credit Theory + 1 Credit Practical', combined: true },
  '3credit_combined': { label: '3 Credit Course', sub: '2 Credit Theory + 1 Credit Practical', combined: true },
  '4credit_theory':   { label: '4 Credit Course', sub: 'Theory Only',                          combined: false },
  '3credit_theory':   { label: '3 Credit Course', sub: 'Theory Only',                          combined: false },
};

// ─── Shared styles ─────────────────────────────────────────────────────────────
const sectionBox = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--bg-subtle)',
  padding: '16px 18px',
  marginBottom: 12,
};

const sectionTitle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: 'var(--text-muted)',
  marginBottom: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'center',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 11,
  color: 'var(--text-muted)',
  fontWeight: 600,
  marginBottom: 5,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: 0.3,
};

// ─── New Template Modal ────────────────────────────────────────────────────────
function NewTemplateModal({ onClose, onCreate, existing }) {
  const [name, setName]         = useState('');
  const [key,  setKey]          = useState('');
  const [type, setType]         = useState('theory');
  const [keyError, setKeyError] = useState('');

  const slugify = (v) => v.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_');

  const handleNameChange = (v) => {
    setName(v);
    if (!key || key === slugify(name)) setKey(slugify(v));
    setKeyError('');
  };

  const handleCreate = () => {
    if (!name.trim()) { toast.error('Template name is required'); return; }
    const k = key.trim();
    if (!k) { toast.error('Template key is required'); return; }
    if (BUILTIN_KEYS.includes(k)) { setKeyError('This key is reserved for a built-in template.'); return; }
    if (existing[k]) { setKeyError('A template with this key already exists.'); return; }
    onCreate(k, name.trim(), type);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    }}>
      <div className="card" style={{ width: 420, boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            <Icons.Plus style={{ width: 16, height: 16 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>New Mark Scheme Template</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Define a custom credit type preset</div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Template Name *</label>
          <input className="form-input" placeholder="e.g. 2 Credit Lab Course"
            value={name} onChange={e => handleNameChange(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">
            Template Key *
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
              (unique identifier, auto-generated)
            </span>
          </label>
          <input className="form-input"
            placeholder="e.g. 2credit_lab"
            value={key}
            onChange={e => { setKey(slugify(e.target.value)); setKeyError(''); }}
            style={keyError ? { borderColor: 'var(--red)' } : {}}
          />
          {keyError && <span style={{ fontSize: 11, color: 'var(--red)', marginTop: 4, display: 'block' }}>{keyError}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Subject Type *</label>
          <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
            <option value="theory">Theory Only</option>
            <option value="combined">Theory + Practical (Combined)</option>
            <option value="practical">Practical Only</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>
            <Icons.Plus style={{ width: 14, height: 14 }} /> Create Template
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Template Editor Card ──────────────────────────────────────────────────────
function TemplateEditor({ tkey, label, sub, data, onChange, onDelete, isBuiltin }) {
  const f   = data;
  const set = (field, val) => onChange(tkey, { ...f, [field]: val });
  const num = (v) => parseFloat(v) || 0;

  const isCombined = f.subject_type === 'combined';
  const theoryCCA  = num(f.max_test_marks) + num(f.max_assignment) + num(f.max_seminar) + num(f.max_attendance_marks);
  const practCCA   = isCombined ? num(f.max_practical_exam) + num(f.max_viva) + num(f.max_record) : 0;
  const theoryOk   = Math.abs(theoryCCA - num(f.theory_cca)) < 0.01;
  const practOk    = !isCombined || Math.abs(practCCA - num(f.practical_cca)) < 0.01;
  const allOk      = theoryOk && practOk;

  const NumField = ({ label: lbl, fkey, max = 200 }) => (
    <div style={{ flex: 1, minWidth: 90 }}>
      <label style={labelStyle}>{lbl}</label>
      <input style={inputStyle} type="number" min={0} max={max} step={0.5}
        value={f[fkey] ?? 0} onChange={e => set(fkey, e.target.value)} />
    </div>
  );

  const validationBar = (ok, sum, components, referenceKey) => (
    <div style={{
      marginTop: 10, padding: '8px 12px', borderRadius: 8,
      background: ok ? 'var(--green-bg)' : 'var(--red-bg)',
      border: `1px solid ${ok ? 'var(--accent-border)' : '#FECACA'}`,
      fontSize: 12.5, fontWeight: 600,
      color: ok ? 'var(--accent)' : 'var(--red)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {ok
          ? <Icons.Check style={{ width: 13, height: 13 }} />
          : <Icons.Warning style={{ width: 13, height: 13 }} />}
        {components} = <strong style={{ marginLeft: 4 }}>{sum}</strong>
        {ok ? ' — matches reference total' : ' — does not match reference'}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <label style={{ ...labelStyle, marginBottom: 0, color: ok ? 'var(--accent)' : 'var(--red)' }}>
          Reference:
        </label>
        <input
          type="number" min={0} max={200}
          value={f[referenceKey] ?? 0}
          onChange={e => set(referenceKey, e.target.value)}
          style={{
            width: 64, padding: '4px 8px', textAlign: 'center', fontSize: 12.5, fontWeight: 700,
            border: `1px solid ${ok ? 'var(--accent-border)' : '#FECACA'}`,
            borderRadius: 6, background: 'var(--bg-surface)', color: 'var(--text-primary)',
            fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg-subtle)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
          flexShrink: 0,
        }}>
          {isCombined ? <Icons.Flask style={{ width: 16, height: 16 }} /> : <Icons.Book style={{ width: 16, height: 16 }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {isBuiltin ? (
            <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
          ) : (
            <input
              value={f.label || ''}
              placeholder="Template name..."
              onChange={e => set('label', e.target.value)}
              style={{
                fontWeight: 700, fontSize: 14, background: 'transparent', border: 'none',
                borderBottom: '1px dashed var(--border-strong)', outline: 'none',
                width: '100%', padding: '1px 0', color: 'var(--text-primary)', fontFamily: 'inherit',
              }}
            />
          )}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {isBuiltin ? sub : (
              <select
                value={f.subject_type}
                onChange={e => set('subject_type', e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer',
                  fontFamily: 'inherit', padding: 0,
                }}
              >
                <option value="theory">Theory Only</option>
                <option value="combined">Theory + Practical (Combined)</option>
                <option value="practical">Practical Only</option>
              </select>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isBuiltin && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: 'var(--amber-bg)', color: 'var(--amber)',
              border: '1px solid #FDE68A', letterSpacing: 0.4,
            }}>
              CUSTOM
            </span>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20,
            fontSize: 12, fontWeight: 700,
            background: allOk ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `1px solid ${allOk ? 'var(--accent-border)' : '#FECACA'}`,
            color: allOk ? 'var(--accent)' : 'var(--red)',
          }}>
            {allOk ? <Icons.Check style={{ width: 12, height: 12 }} /> : <Icons.Warning style={{ width: 12, height: 12 }} />}
            CCA: {theoryCCA + practCCA}
          </div>

          {!isBuiltin && (
            <button
              type="button"
              onClick={() => onDelete(tkey)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                background: 'var(--red-bg)', border: '1px solid #FECACA',
                color: 'var(--red)', fontSize: 12, fontWeight: 600,
              }}
            >
              <Icons.Delete style={{ width: 13, height: 13 }} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Test formula */}
        <div style={sectionBox}>
          <div style={sectionTitle}>
            <Icons.Sliders style={{ width: 13, height: 13, color: 'var(--accent)' }} />
            Test Score Calculation Method
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {FORMULA_OPTIONS.map(opt => {
              const sel = f.test_formula === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => set('test_formula', opt.value)} style={{
                  border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '9px 12px',
                  background: sel ? 'var(--accent-light)' : 'var(--bg-surface)',
                  cursor: 'pointer', textAlign: 'left', transition: 'var(--t-fast)',
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: sel ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 2 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>
              Each test is written out of:
            </label>
            <input style={{ ...inputStyle, width: 90 }} type="number" min={10} max={200}
              value={f.max_test_score ?? 100} onChange={e => set('max_test_score', e.target.value)} />
          </div>
        </div>

        {/* Theory CCA */}
        <div style={sectionBox}>
          <div style={sectionTitle}>
            <Icons.Subject style={{ width: 13, height: 13, color: 'var(--accent)' }} />
            Theory CCA Components
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <NumField label="Test Weight (CCA pts)" fkey="max_test_marks" max={100} />
            <NumField label="Assignment / Book-Article" fkey="max_assignment" max={50} />
            <NumField label="Seminar / Viva-Voce" fkey="max_seminar" max={50} />
            <NumField label="Attendance Marks" fkey="max_attendance_marks" max={20} />
          </div>
          {validationBar(
            theoryOk,
            theoryCCA,
            `${num(f.max_test_marks)} + ${num(f.max_assignment)} + ${num(f.max_seminar)} + ${num(f.max_attendance_marks)}`,
            'theory_cca',
          )}
        </div>

        {/* Practical CCA */}
        {isCombined && (
          <div style={sectionBox}>
            <div style={sectionTitle}>
              <Icons.Flask style={{ width: 13, height: 13, color: 'var(--accent)' }} />
              Practical CCA Components
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <NumField label="Test Papers" fkey="max_practical_exam" max={50} />
              <NumField label="Lab Skill & Punctuality" fkey="max_viva" max={50} />
              <NumField label="Observation Book" fkey="max_record" max={50} />
            </div>
            {validationBar(
              practOk,
              practCCA,
              `${num(f.max_practical_exam)} + ${num(f.max_viva)} + ${num(f.max_record)}`,
              'practical_cca',
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab]       = useState('profile');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [tmplSaving, setTmplSaving]     = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm_password: '', institution_name: '',
  });
  const [templates, setTemplates] = useState(null);

  useEffect(() => {
    api.get('/api/admin/profile/')
      .then(res => setForm({
        username: res.data.username || '', email: res.data.email || '',
        password: '', confirm_password: '', institution_name: res.data.institution_name || '',
      }))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const loadTemplates = useCallback(() => {
    api.get('/api/mark-scheme-templates/')
      .then(res => setTemplates(res.data))
      .catch(() => toast.error('Failed to load templates'));
  }, []);
  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm_password) {
      toast.error('Passwords do not match'); return;
    }
    setSaving(true);
    try {
      const payload = { username: form.username, email: form.email, institution_name: form.institution_name };
      if (form.password) payload.password = form.password;
      const res = await api.put('/api/admin/profile/', payload);
      toast.success(res.data.message || 'Settings updated!');
      setForm(prev => ({ ...prev, password: '', confirm_password: '' }));
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleTemplateChange = (key, updated) =>
    setTemplates(prev => ({ ...prev, [key]: updated }));

  const handleTemplatesSave = async () => {
    setTmplSaving(true);
    try {
      await api.put('/api/mark-scheme-templates/set/', templates);
      toast.success('Templates saved. New subjects will use these values.');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save templates');
    } finally { setTmplSaving(false); }
  };

  const handleReload = () => {
    if (!window.confirm('Discard unsaved changes and reload from the last saved state?')) return;
    loadTemplates();
    toast.success('Reloaded from saved state.');
  };

  const handleCreateTemplate = (key, name, type) => {
    const isCombined = type === 'combined';
    setTemplates(prev => ({
      ...prev,
      [key]: {
        label: name, sub: isCombined ? 'Theory + Practical' : type === 'practical' ? 'Practical Only' : 'Theory Only',
        subject_type: type, credits: 3,
        max_test_score: 100, max_test_marks: 0, test_formula: 'best2of3',
        max_assignment: 0, max_seminar: 0, max_attendance_marks: 0,
        max_record: 0, max_viva: 0, max_practical_exam: 0,
        theory_cca: 0, practical_cca: 0, _custom: true,
      },
    }));
    toast.success(`Template "${name}" created. Fill in the marks, then click Save.`);
  };

  const handleDeleteTemplate = (key) => {
    if (!window.confirm(`Delete the template "${templates[key]?.label || key}"?`)) return;
    setTemplates(prev => { const n = { ...prev }; delete n[key]; return n; });
    toast.success('Template removed. Click Save to apply.');
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  // Build ordered list: builtins first, then custom
  const orderedEntries = templates
    ? [
        ...BUILTIN_KEYS.filter(k => templates[k]).map(k => ({ key: k, data: templates[k], isBuiltin: true })),
        ...Object.entries(templates)
          .filter(([k]) => !BUILTIN_KEYS.includes(k))
          .map(([k, v]) => ({ key: k, data: v, isBuiltin: false })),
      ]
    : [];

  const tabs = [
    { key: 'profile',   label: 'Admin Profile',         Icon: Icons.User },
    { key: 'templates', label: 'Mark Scheme Templates',  Icon: Icons.Sliders },
  ];

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb">
            <span>Admin</span><span className="sep">›</span><span className="current">Settings</span>
          </div>
          <h1>System Settings</h1>
          <p>Configure administrator credentials, institution details, and mark scheme templates</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28, gap: 2 }}>
        {tabs.map(({ key, label, Icon }) => (
          <button key={key} type="button" onClick={() => setActiveTab(key)} style={{
            padding: '10px 20px', background: 'transparent', cursor: 'pointer',
            fontWeight: activeTab === key ? 700 : 400, fontSize: 13.5,
            color: activeTab === key ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, transition: 'var(--t-fast)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <Icon style={{ width: 15, height: 15 }} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Admin Profile ── */}
      {activeTab === 'profile' && (
        <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.Staff style={{ width: 17, height: 17, color: 'var(--accent)' }} />
              Administrator Profile
            </h3>
            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input className="form-input" required value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email ID (Recovery Email) *</label>
                <input className="form-input" type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. admin@college.edu" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Used for password recovery if you forget your credentials.
                </span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={form.password}
                    placeholder="Leave blank to keep current"
                    onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input className="form-input" type="password" value={form.confirm_password}
                    placeholder="Confirm new password"
                    onChange={e => setForm({ ...form, confirm_password: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Institution Name</label>
                <input className="form-input" value={form.institution_name}
                  onChange={e => setForm({ ...form, institution_name: e.target.value })}
                  placeholder="e.g. Kerala University Dept. of Computer Science" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Displayed on student reports and system sheets.
                </span>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }} disabled={saving}>
                <Icons.Save style={{ width: 14, height: 14 }} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>

          <div className="card" style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-dark)' }}>
              <Icons.Report style={{ width: 17, height: 17 }} />
              Settings Information
            </h3>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>
                <strong>Institutional Branding:</strong> Changing the <em>Institution Name</em> updates headers across all PDF reports generated for students.
              </p>
              <p style={{ marginBottom: 12 }}>
                <strong>Account Recovery:</strong> Register a valid <em>Email ID</em>. If you forget the password, reset it from the login screen using OTP verification.
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 600 }}>
                <Icons.Check style={{ width: 15, height: 15 }} />
                Changes apply instantly across the system.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Scheme Templates ── */}
      {activeTab === 'templates' && (
        <div>
          {/* Info bar */}
          <div style={{
            marginBottom: 20, padding: '12px 16px', borderRadius: 10,
            background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
            fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Icons.Sliders style={{ width: 15, height: 15, color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
            <span>
              These are the default mark distributions applied when you add a new subject using a credit type preset.
              Editing here <em>does not affect existing subjects</em> — only new subjects will pick up the updated values.
            </span>
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowNewModal(true)}>
              <Icons.Plus style={{ width: 14, height: 14 }} /> New Template
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleReload} disabled={tmplSaving}>
                <Icons.Refresh style={{ width: 14, height: 14 }} /> Reload from Saved
              </button>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleTemplatesSave} disabled={tmplSaving || !templates}>
                {tmplSaving
                  ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Saving...</>
                  : <><Icons.Save style={{ width: 14, height: 14 }} /> Save All Templates</>}
              </button>
            </div>
          </div>

          {/* Template list */}
          {templates ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orderedEntries.map(({ key, data, isBuiltin }) => {
                const meta = BUILTIN_META[key];
                return (
                  <TemplateEditor
                    key={key}
                    tkey={key}
                    label={meta?.label || data.label || key}
                    sub={meta?.sub || data.sub || ''}
                    data={data}
                    onChange={handleTemplateChange}
                    onDelete={handleDeleteTemplate}
                    isBuiltin={isBuiltin}
                  />
                );
              })}
              {orderedEntries.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                  <Icons.Subject style={{ width: 36, height: 36, opacity: 0.3, marginBottom: 10 }} />
                  <div style={{ fontWeight: 600 }}>No templates loaded</div>
                </div>
              )}
            </div>
          ) : (
            <div className="loading-page"><div className="spinner" /></div>
          )}

          {/* Bottom save */}
          {orderedEntries.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleTemplatesSave} disabled={tmplSaving || !templates}>
                {tmplSaving ? 'Saving...' : <><Icons.Save style={{ width: 14, height: 14 }} /> Save All Templates</>}
              </button>
            </div>
          )}
        </div>
      )}

      {showNewModal && (
        <NewTemplateModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateTemplate}
          existing={templates || {}}
        />
      )}
    </div>
  );
}
