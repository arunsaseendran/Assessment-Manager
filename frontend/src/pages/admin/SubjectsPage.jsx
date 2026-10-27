import { useState, useEffect } from 'react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Icons } from '../../components/Icons';
import toast from 'react-hot-toast';

// Fallback presets used before API loads
const FALLBACK_PRESETS = {
  '4credit_combined': {
    label: '4 Credit Course', sub: '3 Credit Theory + 1 Credit Practical',
    subject_type: 'combined', credits: 4,
    max_test_score: 100, max_test_marks: 12, test_formula: 'best2of3',
    max_assignment: 5, max_seminar: 8, max_attendance_marks: 0,
    max_record: 2, max_viva: 3, max_practical_exam: 5,
    theory_cca: 25, practical_cca: 10,
  },
  '3credit_combined': {
    label: '3 Credit Course', sub: '2 Credit Theory + 1 Credit Practical',
    subject_type: 'combined', credits: 3,
    max_test_score: 100, max_test_marks: 8, test_formula: 'best2of3',
    max_assignment: 2, max_seminar: 5, max_attendance_marks: 0,
    max_record: 2, max_viva: 3, max_practical_exam: 5,
    theory_cca: 15, practical_cca: 10,
  },
  '4credit_theory': {
    label: '4 Credit Course', sub: 'Theory Only',
    subject_type: 'theory', credits: 4,
    max_test_score: 100, max_test_marks: 15, test_formula: 'best2of3',
    max_assignment: 10, max_seminar: 5, max_attendance_marks: 0,
    max_record: 0, max_viva: 0, max_practical_exam: 0,
    theory_cca: 30, practical_cca: 0,
  },
  '3credit_theory': {
    label: '3 Credit Course', sub: 'Theory Only',
    subject_type: 'theory', credits: 3,
    max_test_score: 100, max_test_marks: 12, test_formula: 'best2of3',
    max_assignment: 5, max_seminar: 8, max_attendance_marks: 0,
    max_record: 0, max_viva: 0, max_practical_exam: 0,
    theory_cca: 25, practical_cca: 0,
  },
};



const CREDIT_TYPE_META = {
  '4credit_combined': { color: '#6366f1', icon: '📚' },
  '3credit_combined': { color: '#8b5cf6', icon: '📖' },
  '4credit_theory':   { color: '#0ea5e9', icon: '📝' },
  '3credit_theory':   { color: '#06b6d4', icon: '✏️' },
  'custom':           { color: '#64748b', icon: '⚙️' },
};

const FORMULA_LABELS = {
  best2of3: 'Average of Best 2 of 3 Tests',
  average:  'Average of All 3 Tests',
  best1of3: 'Best Single Test Score (highest of 3)',
  all3:     'Sum of All 3 Tests',
};

const DEFAULT_FORM = {
  name: '', code: '', semester_id: '', subject_type: 'theory', credit_type: '',
  credits: 3, max_internal_marks: 30,
  max_test_score: 100, max_test_marks: 20, test_formula: 'best2of3',
  max_assignment: 5, max_seminar: 0, max_attendance_marks: 0,
  max_record: 0, max_viva: 0, max_practical_exam: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Visual scheme breakdown table — matches the image format
// ─────────────────────────────────────────────────────────────────────────────
function SchemeTable({ creditType, form, presets }) {
  const preset = presets[creditType];
  if (!preset) {
    // Custom — show a simple numeric summary
    const theorySum = (+form.max_test_marks || 0) + (+form.max_assignment || 0) + (+form.max_seminar || 0) + (+form.max_attendance_marks || 0);
    const practicalSum = (+form.max_record || 0) + (+form.max_viva || 0) + (+form.max_practical_exam || 0);
    return (
      <div style={{ background: 'rgba(100,116,139,0.06)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
        <strong>Custom Scheme:</strong><br />
        {form.subject_type !== 'practical' && <>Theory CCA: Tests {form.max_test_marks} + Assignment {form.max_assignment} + Seminar {form.max_seminar} + Attendance {form.max_attendance_marks} = <strong>{theorySum}</strong><br /></>}
        {form.subject_type !== 'theory' && <>Practical CCA: Record {form.max_record} + Viva {form.max_viva} + Exam {form.max_practical_exam} = <strong>{practicalSum}</strong></>}
      </div>
    );
  }

  const isCombined = preset.subject_type === 'combined';
  const tdStyle = { padding: '7px 10px', borderBottom: '1px solid var(--border)', fontSize: 13 };
  const thStyle = { ...tdStyle, fontWeight: 700, background: 'rgba(0,0,0,0.03)', textAlign: 'center' };
  const numStyle = { ...tdStyle, textAlign: 'center', fontWeight: 700, color: 'var(--accent)' };
  const totalStyle = { ...tdStyle, fontWeight: 800, fontSize: 14, color: '#10b981', textAlign: 'center' };

  if (!isCombined) {
    // Theory-only layout (single table)
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left', width: '60%' }}>Evaluation Type</th>
              <th style={thStyle}>Marks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...tdStyle, fontWeight: 700 }}>CCA (Internal Assessment)</td>
              <td style={numStyle}>{preset.theory_cca}</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, paddingLeft: 26 }}>a) *Test Paper <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(Best 2 of 3)</span></td>
              <td style={numStyle}>{preset.max_test_marks}</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, paddingLeft: 26 }}>b) **Assignment / Book-Article Review</td>
              <td style={numStyle}>{preset.max_assignment}</td>
            </tr>
            <tr>
              <td style={{ ...tdStyle, paddingLeft: 26 }}>c) Seminar / Viva-Voce</td>
              <td style={numStyle}>{preset.max_seminar}</td>
            </tr>
            <tr>
              <td style={{ ...totalStyle, textAlign: 'left' }}>CCA Total</td>
              <td style={totalStyle}>{preset.theory_cca}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          * Best out of two test papers &nbsp;|&nbsp; ** Best out of submitted assignments
        </div>
      </div>
    );
  }

  // Combined layout (side-by-side theory + practical)
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <thead>
          <tr>
            <th colSpan={2} style={{ ...thStyle, borderRight: '2px solid var(--border)' }}>Theory CCA</th>
            <th style={thStyle}>Marks</th>
            <th colSpan={2} style={{ ...thStyle, borderLeft: '2px solid var(--border)' }}>Practical CCA</th>
            <th style={thStyle}>Marks</th>
            <th style={{ ...thStyle, color: '#10b981' }}>CCA Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>i</td>
            <td style={{ ...tdStyle, borderRight: '2px solid var(--border)' }}>*Test Paper</td>
            <td style={numStyle}>{preset.max_test_marks}</td>
            <td style={{ ...tdStyle, borderLeft: '2px solid var(--border)' }}>i</td>
            <td style={tdStyle}>Test Papers</td>
            <td style={numStyle}>{preset.max_practical_exam}</td>
            <td rowSpan={4} style={{ ...totalStyle, verticalAlign: 'middle', fontSize: 18 }}>{preset.theory_cca + preset.practical_cca}</td>
          </tr>
          <tr>
            <td style={tdStyle}>ii</td>
            <td style={{ ...tdStyle, borderRight: '2px solid var(--border)' }}>**Book-Article Review / Assignment</td>
            <td style={numStyle}>{preset.max_assignment}</td>
            <td style={{ ...tdStyle, borderLeft: '2px solid var(--border)' }}>ii</td>
            <td style={tdStyle}>Lab Skill & Punctuality</td>
            <td style={numStyle}>{preset.max_viva}</td>
          </tr>
          <tr>
            <td style={tdStyle}>iii</td>
            <td style={{ ...tdStyle, borderRight: '2px solid var(--border)' }}>Seminar / Viva-Voce</td>
            <td style={numStyle}>{preset.max_seminar}</td>
            <td style={{ ...tdStyle, borderLeft: '2px solid var(--border)' }}>iii</td>
            <td style={tdStyle}>Observation Book</td>
            <td style={numStyle}>{preset.max_record}</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ ...totalStyle, textAlign: 'right', borderRight: '2px solid var(--border)' }}>CCA Subtotal</td>
            <td style={totalStyle}>{preset.theory_cca}</td>
            <td colSpan={2} style={{ ...totalStyle, textAlign: 'right', borderLeft: '2px solid var(--border)' }}>CCA Subtotal</td>
            <td style={totalStyle}>{preset.practical_cca}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        * Best out of two test papers &nbsp;|&nbsp; ** Best out of submitted assignments
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Credit Type Card Picker
// ─────────────────────────────────────────────────────────────────────────────
function CreditTypePicker({ value, onChange, presets }) {
  const BUILTIN_ORDER = ['4credit_combined', '3credit_combined', '4credit_theory', '3credit_theory'];

  const builtinCards = BUILTIN_ORDER.filter(k => presets[k]).map(k => {
    const p = presets[k];
    const isCombined = p.subject_type === 'combined';
    return {
      key: k,
      label: p.label || k,
      sub: p.sub || (isCombined ? 'Theory + Practical' : 'Theory Only'),
      ccaTotal: (p.theory_cca || 0) + (isCombined ? (p.practical_cca || 0) : 0),
      badge: isCombined ? 'Combined' : 'Theory',
      isCustom: false,
    };
  });

  const customCards = Object.keys(presets)
    .filter(k => !BUILTIN_ORDER.includes(k))
    .map(k => {
      const p = presets[k];
      const isCombined = p.subject_type === 'combined';
      return {
        key: k,
        label: p.label || k,
        sub: p.sub || (isCombined ? 'Theory + Practical' : p.subject_type === 'practical' ? 'Practical Only' : 'Theory Only'),
        ccaTotal: (p.theory_cca || 0) + (isCombined ? (p.practical_cca || 0) : 0),
        badge: isCombined ? 'Combined' : p.subject_type === 'practical' ? 'Practical' : 'Theory',
        isCustom: true,
      };
    });

  const cards = [...builtinCards, ...customCards];

  return (
    <div style={{ marginBottom: 8 }}>
      <label className="form-label" style={{ marginBottom: 12 }}>Credit Type *</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {cards.map(card => {
          const sel = value === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onChange(card.key)}
              style={{
                border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10,
                padding: '12px 14px',
                background: sel ? 'var(--accent-light)' : 'var(--bg-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'var(--t-fast)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {sel && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 12 12" fill="none" style={{ width: 10, height: 10 }}>
                    <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              {card.isCustom && (
                <div style={{
                  display: 'inline-block', marginBottom: 4,
                  fontSize: 9, fontWeight: 700,
                  color: 'var(--amber)', background: 'var(--amber-bg)',
                  border: '1px solid #FDE68A', borderRadius: 4, padding: '1px 5px',
                  letterSpacing: 0.4,
                }}>CUSTOM</div>
              )}
              <div style={{ fontWeight: 700, fontSize: 13, color: sel ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 3 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8 }}>{card.sub}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                  background: sel ? 'var(--accent-mid)' : 'var(--bg-muted)',
                  color: sel ? 'var(--accent-dark)' : 'var(--text-muted)',
                  border: `1px solid ${sel ? 'var(--accent-border)' : 'var(--border)'}`,
                }}>
                  {card.badge}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>CCA: {card.ccaTotal}</span>
              </div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onChange('custom')}
        style={{
          width: '100%', marginTop: 8,
          border: `1.5px solid ${value === 'custom' ? 'var(--border-strong)' : 'var(--border)'}`,
          borderRadius: 10, padding: '10px 16px',
          background: value === 'custom' ? 'var(--bg-muted)' : 'var(--bg-surface)',
          cursor: 'pointer', textAlign: 'left',
          color: value === 'custom' ? 'var(--text-secondary)' : 'var(--text-muted)',
          fontSize: 13, fontWeight: value === 'custom' ? 600 : 400,
          transition: 'var(--t-fast)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
          <path d="M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6" />
        </svg>
        Custom — Manually configure marks scheme
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function SubjectsPage() {
  const [data, setData] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [presets, setPresets] = useState(FALLBACK_PRESETS);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [modalCourseId, setModalCourseId] = useState('');

  const load = () => {
    const t = Date.now();
    return Promise.all([
      api.get(`/api/subjects/?t=${t}`).then(r => setData(r.data)),
      api.get(`/api/semesters/?t=${t}`).then(r => setSemesters(r.data)),
      api.get(`/api/courses/?t=${t}`).then(r => setCourses(r.data)),
      api.get('/api/mark-scheme-templates/').then(r => setPresets(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const semCourse   = (semId) => courses.find(c => c.id === semesters.find(s => s.id === semId)?.course_id);
  const semLabel    = (id)    => { const s = semesters.find(x => x.id === id); return s ? `Semester ${s.number}` : '—'; };
  const sems4course = (cid)   => semesters.filter(s => s.course_id === parseInt(cid)).sort((a, b) => a.number - b.number);

  const filteredByCourse = filterCourse ? data.filter(s => semCourse(s.semester_id)?.id === parseInt(filterCourse)) : data;
  const filteredData     = filterSemester ? filteredByCourse.filter(s => s.semester_id === parseInt(filterSemester)) : filteredByCourse;
  const filterSemesters  = filterCourse ? sems4course(filterCourse) : [];

  // Apply a preset to the form — uses live templates from API
  const applyPreset = (creditTypeKey) => {
    const preset = presets[creditTypeKey];
    if (!preset) {
      // custom: keep current values but set credit_type
      setForm(prev => ({ ...prev, credit_type: 'custom' }));
      return;
    }
    setForm(prev => ({
      ...prev,
      credit_type: creditTypeKey,
      subject_type: preset.subject_type,
      credits: preset.credits,
      max_internal_marks: preset.theory_cca,
      max_test_score: preset.max_test_score,
      max_test_marks: preset.max_test_marks,
      test_formula: preset.test_formula,
      max_assignment: preset.max_assignment,
      max_seminar: preset.max_seminar,
      max_attendance_marks: preset.max_attendance_marks,
      max_record: preset.max_record,
      max_viva: preset.max_viva,
      max_practical_exam: preset.max_practical_exam,
    }));
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...DEFAULT_FORM });
    setModalCourseId('');
    setActiveTab('basic');
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const sem = semesters.find(s => s.id === row.semester_id);
    setForm({
      name: row.name, code: row.code, semester_id: row.semester_id,
      subject_type: row.subject_type,
      credit_type: row.credit_type || 'custom',
      credits: row.credits,
      max_internal_marks: row.max_internal_marks,
      max_test_score:       row.max_test_score ?? 100,
      max_test_marks:       row.max_test_marks ?? 20,
      test_formula:         row.test_formula   ?? 'best2of3',
      max_assignment:       row.max_assignment ?? 5,
      max_seminar:          row.max_seminar ?? 0,
      max_attendance_marks: row.max_attendance_marks ?? 0,
      max_record:           row.max_record ?? 0,
      max_viva:             row.max_viva   ?? 0,
      max_practical_exam:   row.max_practical_exam ?? 0,
    });
    setModalCourseId(sem ? String(sem.course_id) : '');
    setActiveTab('basic');
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.credit_type) {
      toast.error('Please select a Credit Type to continue.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        semester_id: parseInt(form.semester_id),
        subject_type: form.subject_type,
        credit_type: form.credit_type,
        credits: parseInt(form.credits),
        max_internal_marks: parseInt(form.max_internal_marks),
        max_test_score:       parseFloat(form.max_test_score),
        max_test_marks:       parseFloat(form.max_test_marks),
        test_formula:         form.test_formula,
        max_assignment:       parseFloat(form.max_assignment),
        max_seminar:          parseFloat(form.max_seminar),
        max_attendance_marks: parseFloat(form.max_attendance_marks),
        max_record:           parseFloat(form.max_record),
        max_viva:             parseFloat(form.max_viva),
        max_practical_exam:   parseFloat(form.max_practical_exam),
      };
      if (editing) {
        await api.put(`/api/subjects/${editing.id}/`, payload);
        toast.success('Subject updated!');
      } else {
        await api.post('/api/subjects/', payload);
        toast.success('Subject added!');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || Object.values(err?.response?.data || {})?.[0]?.[0] || 'Error saving');
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await api.delete(`/api/subjects/${id}/`);
      setData(prev => prev.filter(s => s.id !== id));
      toast.success('Deleted');
      load();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Cannot delete'); }
  };

  // Credit type badge for table
  const creditTypeBadge = (row) => {
    const ct = row.credit_type || 'custom';
    const meta = CREDIT_TYPE_META[ct] || CREDIT_TYPE_META['custom'];
    const labels = {
      '4credit_combined': '4C Combined',
      '3credit_combined': '3C Combined',
      '4credit_theory': '4C Theory',
      '3credit_theory': '3C Theory',
      'custom': 'Custom',
    };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
        background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30`,
      }}>
        {labels[ct] || ct}
      </span>
    );
  };

  // Total marks from scheme
  const schemeSummary = (row) => {
    const ct = row.credit_type;
    const preset = presets[ct];
    if (preset) {
      const isCombined = preset.subject_type === 'combined';
      if (isCombined) {
        return (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Theory CCA <strong>{preset.theory_cca}</strong> + Practical CCA <strong>{preset.practical_cca}</strong>
            {' = '}<strong style={{ color: 'var(--accent)' }}>{preset.theory_cca + preset.practical_cca}</strong>
          </span>
        );
      }
      return (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          CCA: <strong style={{ color: 'var(--accent)' }}>{preset.theory_cca}</strong>
        </span>
      );
    }
    const th = (+(row.max_test_marks ?? 0)) + (+(row.max_assignment ?? 0)) + (+(row.max_seminar ?? 0)) + (+(row.max_attendance_marks ?? 0));
    const pr = (+(row.max_record ?? 0)) + (+(row.max_viva ?? 0)) + (+(row.max_practical_exam ?? 0));
    return (
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {row.subject_type !== 'practical' && <>CCA: <strong>{th}</strong></>}
        {row.subject_type === 'combined' && <> + Prac CCA: <strong>{pr}</strong></>}
        {row.subject_type === 'practical' && <>CCA: <strong>{pr}</strong></>}
      </span>
    );
  };

  const columns = [
    { key: 'name', label: 'Subject Name' },
    { key: 'code', label: 'Code', render: r => <span className="badge badge-primary">{r.code}</span> },
    { key: 'course', label: 'Course', render: r => semCourse(r.semester_id)?.name || '—' },
    { key: 'semester_id', label: 'Semester', render: r => semLabel(r.semester_id) },
    { key: 'credit_type', label: 'Credit Type', render: creditTypeBadge },
    { key: 'scheme', label: 'Marks Summary', render: schemeSummary },
  ];

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  // Custom scheme validation
  const theoryTotal    = (+form.max_test_marks || 0) + (+form.max_assignment || 0) + (+form.max_seminar || 0) + (+form.max_attendance_marks || 0);
  const practicalTotal = (+form.max_record || 0) + (+form.max_viva || 0) + (+form.max_practical_exam || 0);
  const isCustom = form.credit_type === 'custom';

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Admin</span><span className="sep">›</span><span className="current">Subjects</span></div>
          <h1>Subjects</h1>
          <p>Manage subjects and configure marks schemes per subject</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Icons.Plus /> Add Subject</button>
      </div>

      {/* ── Filter bar ── */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 220 }}>
            <label className="form-label">Filter by Course</label>
            <select className="form-select" value={filterCourse} onChange={e => { setFilterCourse(e.target.value); setFilterSemester(''); }}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
            <label className="form-label">Filter by Semester</label>
            <select className="form-select" value={filterSemester} onChange={e => setFilterSemester(e.target.value)} disabled={!filterCourse}>
              <option value="">All Semesters</option>
              {filterSemesters.map(s => <option key={s.id} value={s.id}>Semester {s.number}</option>)}
            </select>
          </div>
          {(filterCourse || filterSemester) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setFilterCourse(''); setFilterSemester(''); }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <DataTable title={`${filteredData.length} Subjects`} columns={columns} data={filteredData}
        actions={(row) => (<>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(row)} title="Edit"><Icons.Edit /></button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(row.id)} title="Delete"><Icons.Delete /></button>
        </>)}
      />

      {/* ── Subject Modal ── */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? `Edit — ${editing.name}` : 'Add Subject'}>
        <form onSubmit={save}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
            {['basic', 'scheme'].map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{
                padding: '8px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontWeight: activeTab === tab ? 700 : 400,
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, fontSize: 14, transition: 'all .15s',
              }}>
                {tab === 'basic' ? 'Basic Info' : 'Marks Scheme'}
              </button>
            ))}
          </div>

          {/* ── Tab: Basic Info ── */}
          {activeTab === 'basic' && (<>
            {/* Subject Name & Code */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Subject Name *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Data Structures" />
              </div>
              <div className="form-group">
                <label className="form-label">Code *</label>
                <input className="form-input" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. CS201" />
              </div>
            </div>

            {/* Course & Semester */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Course *</label>
                <select className="form-select" required value={modalCourseId} onChange={e => { setModalCourseId(e.target.value); setForm({ ...form, semester_id: '' }); }}>
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester *</label>
                <select className="form-select" required value={form.semester_id} onChange={e => setForm({ ...form, semester_id: e.target.value })} disabled={!modalCourseId}>
                  <option value="">Select semester</option>
                  {sems4course(modalCourseId).map(s => <option key={s.id} value={s.id}>Semester {s.number}</option>)}
                </select>
              </div>
            </div>

            {/* Credit Type Picker */}
            <div style={{ marginTop: 8 }}>
              <CreditTypePicker
                value={form.credit_type}
                onChange={(key) => applyPreset(key)}
                presets={presets}
              />
            </div>

            {/* Custom mode: show type/credits/internal marks overrides */}
            {form.credit_type === 'custom' && (
              <div style={{ marginTop: 16, padding: '16px', background: 'rgba(100,116,139,0.06)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Custom Configuration
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Subject Type</label>
                    <select className="form-select" value={form.subject_type} onChange={e => setForm({ ...form, subject_type: e.target.value })}>
                      <option value="theory">Theory</option>
                      <option value="practical">Practical</option>
                      <option value="combined">Combined (Theory + Practical)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credits</label>
                    <input className="form-input" type="number" min={1} max={10} value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Theory CCA Marks (max internal marks)</label>
                    <input className="form-input" type="number" min={0} max={100} value={form.max_internal_marks} onChange={e => setForm({ ...form, max_internal_marks: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* Show selected type summary for presets */}
            {form.credit_type && form.credit_type !== 'custom' && presets[form.credit_type] && (
              <div style={{
                marginTop: 16, padding: '12px 16px',
                background: `${CREDIT_TYPE_META[form.credit_type]?.color}0f`,
                border: `1px solid ${CREDIT_TYPE_META[form.credit_type]?.color}30`,
                borderRadius: 10, fontSize: 13,
              }}>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <span><strong style={{ color: CREDIT_TYPE_META[form.credit_type]?.color }}>Type:</strong> {form.subject_type}</span>
                  <span><strong style={{ color: CREDIT_TYPE_META[form.credit_type]?.color }}>Credits:</strong> {form.credits}</span>
                  <span><strong style={{ color: CREDIT_TYPE_META[form.credit_type]?.color }}>CCA:</strong> {presets[form.credit_type].theory_cca}{presets[form.credit_type].practical_cca > 0 ? ` + ${presets[form.credit_type].practical_cca} (practical)` : ''}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-muted)' }}>
                  Marks scheme auto-configured from template • Go to "Marks Scheme" tab to view breakdown
                </div>
              </div>
            )}
          </>)}

          {/* ── Tab: Marks Scheme ── */}
          {activeTab === 'scheme' && (<>
            {!form.credit_type ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 600 }}>Select a Credit Type in Basic Info first</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>The marks scheme breakdown will appear here</div>
              </div>
            ) : (<>
              {/* Scheme visual table */}
              <div style={{ marginBottom: 20 }}>
                <SchemeTable creditType={form.credit_type} form={form} presets={presets} />
              </div>

              {/* Custom scheme fields */}
              {form.credit_type === 'custom' && (<>
                {/* Validation */}
                {(form.subject_type === 'theory' || form.subject_type === 'combined') && (
                  <div style={{
                    background: theoryTotal === parseInt(form.max_internal_marks) ? 'rgba(16,185,129,0.08)' : 'rgba(255,71,87,0.08)',
                    border: `1px solid ${theoryTotal === parseInt(form.max_internal_marks) ? 'rgba(16,185,129,0.25)' : 'rgba(255,71,87,0.25)'}`,
                    borderRadius: 8, padding: '10px 14px', fontSize: 13,
                    color: theoryTotal === parseInt(form.max_internal_marks) ? '#10b981' : '#ff4757', marginBottom: 16,
                  }}>
                    <strong>Theory CCA:</strong> {form.max_test_marks}+{form.max_assignment}+{form.max_seminar}+{form.max_attendance_marks} = {theoryTotal}
                    {theoryTotal !== parseInt(form.max_internal_marks) && <span> (expected {form.max_internal_marks})</span>}
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Each Test Is Out Of</label>
                    <input className="form-input" type="number" min={10} max={200} value={form.max_test_score} onChange={e => setForm({ ...form, max_test_score: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Test Weight (CCA marks)</label>
                    <input className="form-input" type="number" min={0} max={100} value={form.max_test_marks} onChange={e => setForm({ ...form, max_test_marks: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Test Formula</label>
                  <select className="form-select" value={form.test_formula} onChange={e => setForm({ ...form, test_formula: e.target.value })}>
                    {Object.entries(FORMULA_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Assignment / Book-Article Review</label>
                    <input className="form-input" type="number" min={0} max={50} step={0.5} value={form.max_assignment} onChange={e => setForm({ ...form, max_assignment: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Seminar / Viva-Voce</label>
                    <input className="form-input" type="number" min={0} max={50} step={0.5} value={form.max_seminar} onChange={e => setForm({ ...form, max_seminar: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Attendance Marks</label>
                    <input className="form-input" type="number" min={0} max={20} step={0.5} value={form.max_attendance_marks} onChange={e => setForm({ ...form, max_attendance_marks: e.target.value })} />
                  </div>
                </div>

                {(form.subject_type === 'practical' || form.subject_type === 'combined') && (<>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', margin: '12px 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Practical CCA Components
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Test Papers</label>
                      <input className="form-input" type="number" min={0} max={50} step={0.5} value={form.max_practical_exam} onChange={e => setForm({ ...form, max_practical_exam: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lab Skill & Punctuality</label>
                      <input className="form-input" type="number" min={0} max={50} step={0.5} value={form.max_viva} onChange={e => setForm({ ...form, max_viva: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Observation Book</label>
                      <input className="form-input" type="number" min={0} max={50} step={0.5} value={form.max_record} onChange={e => setForm({ ...form, max_record: e.target.value })} />
                    </div>
                  </div>
                </>)}
              </>)}

              {/* Preset info — read-only */}
              {form.credit_type !== 'custom' && (
                <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                  <strong style={{ color: '#10b981' }}>✓ Preset scheme applied</strong> — All values are pre-configured per the institution mark scheme.
                  Switch to <strong>Custom</strong> credit type in Basic Info if you need manual overrides.
                </div>
              )}
            </>)}
          </>)}

          <div className="modal-footer" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}