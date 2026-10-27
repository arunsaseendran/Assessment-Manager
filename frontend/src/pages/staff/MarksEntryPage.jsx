import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';

// ─── Preset CCA labels for display ───────────────────────────────────────────
const CREDIT_TYPE_LABELS = {
  '4credit_combined': '4C (3T+1P)',
  '3credit_combined': '3C (2T+1P)',
  '4credit_theory':   '4C Theory',
  '3credit_theory':   '3C Theory',
  'custom': 'Custom',
};

export default function MarksEntryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [students, setStudents] = useState([]);
  const [theoryMarks, setTheoryMarks] = useState({});
  const [practicalMarks, setPracticalMarks] = useState({});
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectData, setSubjectData] = useState(null); // full subject object
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState({});

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/subjects/my/').then(r => setSubjects(r.data)),
      api.get('/api/semesters/').then(r => setSemesters(r.data)),
      api.get('/api/courses/').then(r => setCourses(r.data)),
    ])
      .catch(() => { /* silently handle */ })
      .finally(() => setInitLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    const subj = subjects.find(s => s.id === parseInt(selectedSubject));
    if (!subj) return;
    setSubjectData(subj);
    setLoading(true);
    setSaved({});

    api.get(`/api/students/?semester_id=${subj.semester_id}`)
      .then(async stuRes => {
        const stus = stuRes.data;
        setStudents(stus);

        const isCombined = subj.subject_type === 'combined';
        const isTheory = subj.subject_type === 'theory' || isCombined;
        const isPractical = subj.subject_type === 'practical' || isCombined;

        // Load theory (internal) marks
        if (isTheory) {
          const r = await api.get(`/api/marks/internal?subject_id=${selectedSubject}`);
          const map = {};
          for (const s of stus) {
            const m = r.data.find(x => x.student_id === s.id);
            map[s.id] = {
              test1: m?.test1 ?? 0, test2: m?.test2 ?? 0, test3: m?.test3 ?? 0,
              assignment: m?.assignment ?? 0, seminar: m?.seminar ?? 0,
            };
          }
          setTheoryMarks(map);
        } else {
          setTheoryMarks({});
        }

        // Load practical marks
        if (isPractical) {
          const r = await api.get(`/api/marks/practical?subject_id=${selectedSubject}`);
          const map = {};
          for (const s of stus) {
            const m = r.data.find(x => x.student_id === s.id);
            map[s.id] = {
              internal_exam: m?.internal_exam ?? 0, // Test Papers
              viva: m?.viva ?? 0,                   // Lab Skill & Punctuality
              record: m?.record ?? 0,               // Observation Book
            };
          }
          setPracticalMarks(map);
        } else {
          setPracticalMarks({});
        }
      })
      .finally(() => setLoading(false));
  }, [selectedSubject]);

  const updateTheory = (stuId, field, val) => {
    let cleanVal = val.replace(/^0+(?=\d)/, '');
    if (cleanVal === '') cleanVal = '0';
    setTheoryMarks(prev => ({ ...prev, [stuId]: { ...prev[stuId], [field]: cleanVal } }));
    setSaved(prev => ({ ...prev, [stuId]: false }));
  };

  const updatePractical = (stuId, field, val) => {
    let cleanVal = val.replace(/^0+(?=\d)/, '');
    if (cleanVal === '') cleanVal = '0';
    setPracticalMarks(prev => ({ ...prev, [stuId]: { ...prev[stuId], [field]: cleanVal } }));
    setSaved(prev => ({ ...prev, [stuId]: false }));
  };

  const saveOne = async (stuId) => {
    const subj = subjectData;
    const isCombined = subj.subject_type === 'combined';
    const isTheory = subj.subject_type === 'theory' || isCombined;
    const isPractical = subj.subject_type === 'practical' || isCombined;
    try {
      if (isTheory) {
        await api.post('/api/marks/internal', {
          student_id: stuId,
          subject_id: parseInt(selectedSubject),
          ...theoryMarks[stuId],
        });
      }
      if (isPractical) {
        await api.post('/api/marks/practical', {
          student_id: stuId,
          subject_id: parseInt(selectedSubject),
          ...practicalMarks[stuId],
        });
      }
      setSaved(prev => ({ ...prev, [stuId]: true }));
      toast.success('Saved!');
    } catch (e) { toast.error('Error saving'); }
  };

  const saveAll = async () => {
    setSaving(true);
    let successCount = 0;
    for (const student of students) {
      try {
        await saveOne(student.id);
        successCount++;
      } catch (e) { toast.error(`Error for ${student.user?.full_name}`); }
    }
    setSaving(false);
    if (successCount > 0) toast.success(`✅ Saved marks for ${successCount} students`);
  };

  const getSubjectCourse = (subj) => {
    const sem = semesters.find(s => s.id === subj.semester_id);
    if (!sem) return null;
    return courses.find(c => c.id === sem.course_id);
  };

  const filteredSubjects = selectedCourseId
    ? subjects.filter(s => {
        const c = getSubjectCourse(s);
        return c && c.id === parseInt(selectedCourseId);
      })
    : subjects;

  if (initLoading) return <div className="loading-page"><div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading subjects...</span></div>;

  const subj = subjectData;
  const isCombined = subj?.subject_type === 'combined';
  const isTheory = subj?.subject_type === 'theory' || isCombined;
  const isPractical = subj?.subject_type === 'practical' || isCombined;

  // Theory field definitions from subject scheme
  const THEORY_FIELDS = subj ? [
    { key: 'test1', label: 'Test 1', max: subj.max_test_score, group: 'Theory CCA' },
    { key: 'test2', label: 'Test 2', max: subj.max_test_score, group: 'Theory CCA' },
    { key: 'test3', label: 'Test 3', max: subj.max_test_score, group: 'Theory CCA' },
    { key: 'assignment', label: 'Book-Article / Assign', max: subj.max_assignment, group: 'Theory CCA' },
    { key: 'seminar', label: 'Seminar / Viva-Voce', max: subj.max_seminar, group: 'Theory CCA' },
  ] : [];

  // Practical field definitions from subject scheme
  const PRACTICAL_FIELDS = subj ? [
    { key: 'internal_exam', label: 'Test Papers', max: subj.max_practical_exam, group: 'Practical CCA' },
    { key: 'viva', label: 'Lab Skill & Punctuality', max: subj.max_viva, group: 'Practical CCA' },
    { key: 'record', label: 'Observation Book', max: subj.max_record, group: 'Practical CCA' },
  ] : [];

  const creditLabel = subj ? (CREDIT_TYPE_LABELS[subj.credit_type] || subj.credit_type || subj.subject_type) : '';

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Tutor</span><span className="sep">›</span><span className="current">Enter Marks</span></div>
          <h1>Marks Entry</h1>
          <p>Enter and update internal assessment marks for students</p>
        </div>
        {selectedSubject && students.length > 0 && (
          <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
            {saving ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : <><Icons.Save size={16} /> Save All Marks</>}
          </button>
        )}
      </div>

      {/* ── Subject selector ── */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, flexDirection: 'row', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0, flex: '1 1 250px' }}>
          <label className="form-label">Filter by Course</label>
          <select className="form-select" value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); setSelectedSubject(''); }}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0, flex: '1 1 250px' }}>
          <label className="form-label">Select Subject</label>
          <select className="form-select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
            <option value="">— Choose a subject —</option>
            {filteredSubjects.map(s => {
              const c = getSubjectCourse(s);
              const ctLabel = CREDIT_TYPE_LABELS[s.credit_type] || s.subject_type;
              return <option key={s.id} value={s.id}>{s.name} ({s.code}) {c ? `[${c.code}]` : ''} — {ctLabel}</option>;
            })}
          </select>
        </div>
      </div>

      {/* ── Subject info banner ── */}
      {subj && !loading && (
        <div style={{
          marginBottom: 20, padding: '12px 20px', borderRadius: 10,
          background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)',
          display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', fontSize: 13,
        }}>
          <span><strong style={{ color: 'var(--accent)' }}>Credit Type:</strong> {creditLabel}</span>
          {isTheory && (
            <span><strong style={{ color: 'var(--accent)' }}>Theory CCA:</strong> Tests (/{subj.max_test_score}) × {subj.test_formula} → {subj.max_test_marks} + Assign {subj.max_assignment} + Seminar {subj.max_seminar} = <strong>{(+subj.max_test_marks||0)+(+subj.max_assignment||0)+(+subj.max_seminar||0)}</strong></span>
          )}
          {isPractical && (
            <span><strong style={{ color: '#10b981' }}>Practical CCA:</strong> Test Papers {subj.max_practical_exam} + Lab {subj.max_viva} + Obs Book {subj.max_record} = <strong>{(+subj.max_practical_exam||0)+(+subj.max_viva||0)+(+subj.max_record||0)}</strong></span>
          )}
          {!isAdmin && <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>Showing only your assigned subjects</span>}
        </div>
      )}

      {loading && <div className="loading-page"><div className="spinner" /></div>}

      {!loading && selectedSubject && students.length === 0 && (
        <div className="empty-state"><div className="empty-icon"><Icons.Users /></div><h3>No students found</h3><p>No students enrolled in this subject's semester</p></div>
      )}

      {!loading && students.length > 0 && (
        <div className="table-container">
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="table-title">
                {subj?.name} — Marks Entry
              </div>
              <div className="table-subtitle">{students.length} students • {creditLabel}</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ verticalAlign: 'middle', position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>Roll No.</th>
                  <th rowSpan={2} style={{ verticalAlign: 'middle', position: 'sticky', left: 80, zIndex: 10, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>Student Name</th>
                  {isTheory && (
                    <th colSpan={THEORY_FIELDS.length} style={{ textAlign: 'center', background: 'rgba(108,99,255,0.07)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, borderBottom: '1px solid rgba(108,99,255,0.2)' }}>
                      Theory CCA
                    </th>
                  )}
                  {isPractical && (
                    <th colSpan={PRACTICAL_FIELDS.length} style={{ textAlign: 'center', background: 'rgba(16,185,129,0.07)', color: '#10b981', fontSize: 11, fontWeight: 700, borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
                      Practical CCA
                    </th>
                  )}
                  <th rowSpan={2} style={{ verticalAlign: 'middle', position: 'sticky', right: 0, zIndex: 10, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>Action</th>
                </tr>
                <tr>
                  {isTheory && THEORY_FIELDS.map(f => (
                    <th key={f.key} style={{ background: 'rgba(108,99,255,0.04)', fontSize: 12 }}>
                      {f.label} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(/{f.max})</span>
                    </th>
                  ))}
                  {isPractical && PRACTICAL_FIELDS.map(f => (
                    <th key={f.key} style={{ background: 'rgba(16,185,129,0.04)', fontSize: 12 }}>
                      {f.label} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(/{f.max})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(stu => (
                  <tr key={stu.id}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 5, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}><span className="badge badge-primary">{stu.roll_number}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: 160, position: 'sticky', left: 80, zIndex: 5, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
                      {stu.user?.full_name}
                      {saved[stu.id] && <span className="badge badge-success" style={{ marginLeft: 8 }}><Icons.Check /> Saved</span>}
                    </td>
                    {/* Theory columns */}
                    {isTheory && THEORY_FIELDS.map(f => (
                      <td key={f.key} style={{ background: 'rgba(108,99,255,0.02)' }}>
                        <input
                          className="marks-input"
                          type="number"
                          min={0}
                          max={f.max}
                          step={0.5}
                          value={theoryMarks[stu.id]?.[f.key] ?? 0}
                          onChange={e => updateTheory(stu.id, f.key, e.target.value)}
                        />
                      </td>
                    ))}
                    {/* Practical columns */}
                    {isPractical && PRACTICAL_FIELDS.map(f => (
                      <td key={f.key} style={{ background: 'rgba(16,185,129,0.02)' }}>
                        <input
                          className="marks-input"
                          type="number"
                          min={0}
                          max={f.max}
                          step={0.5}
                          value={practicalMarks[stu.id]?.[f.key] ?? 0}
                          onChange={e => updatePractical(stu.id, f.key, e.target.value)}
                        />
                      </td>
                    ))}
                    <td style={{ position: 'sticky', right: 0, zIndex: 5, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>
                      <button className="btn btn-success btn-sm" onClick={() => saveOne(stu.id)}><Icons.Save /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedSubject && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-icon"><Icons.Book /></div>
          <h3>Select a Subject</h3>
          <p>Choose a subject from the dropdown above to start entering marks</p>
        </div>
      )}
    </div>
  );
}
