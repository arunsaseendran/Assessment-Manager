import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../../components/Icons';
import toast from 'react-hot-toast';

export default function StudentMarksPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [marks, setMarks] = useState([]);
  const [practicalMarks, setPracticalMarks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('theory');

  useEffect(() => {
    const load = async () => {
      try {
        const profRes = await api.get('/api/students/me');
        setProfile(profRes.data);
        const [mRes, pmRes, aRes, sRes] = await Promise.all([
          api.get(`/api/marks/internal?student_id=${profRes.data.id}`),
          api.get(`/api/marks/practical?student_id=${profRes.data.id}`),
          api.get(`/api/marks/attendance?student_id=${profRes.data.id}`),
          api.get(`/api/subjects/?course_id=${profRes.data.course_id}`),
        ]);
        setMarks(mRes.data);
        setPracticalMarks(pmRes.data);
        setAttendance(aRes.data);
        setSubjects(sRes.data);
      } catch (e) {
        toast.error('Failed to load marks');
      }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const getSubject = (id) => subjects.find(s => s.id === id);
  const getAtt = (subId) => attendance.find(a => a.subject_id === subId);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Student</span><span className="sep">›</span><span className="current">My Marks</span></div>
          <h1>Internal Marks</h1>
          <p>View your detailed assessment scores across all subjects</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['theory', 'practical'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)}>
            {t === 'theory' ? <><Icons.Book /> Theory</> : <><Icons.Flask /> Practical</>}
          </button>
        ))}
      </div>

      {tab === 'theory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {marks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon"><Icons.Book /></div><h3>No Marks Found</h3><p>Your marks for this semester have not been entered yet.</p></div>
          ) : marks.map(m => {
            const subj = getSubject(m.subject_id);
            const att = getAtt(m.subject_id);
            const pct = (m.final_marks / 30) * 100;
            return (
              <div key={m.id} className="card" style={{ borderLeft: `3px solid ${pct >= 60 ? 'var(--accent-green)' : 'var(--accent-orange)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{subj?.name || `Subject ${m.subject_id}`}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{subj?.code} • {subj?.credits} Credits</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: pct >= 60 ? 'var(--accent-green)' : 'var(--accent-orange)', lineHeight: 1 }}>{m.final_marks}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>out of 30</div>
                  </div>
                </div>
                <div className="marks-breakdown">
                  {[
                    { label: 'Test 1', value: m.test1, max: 100 },
                    { label: 'Test 2', value: m.test2, max: 100 },
                    { label: 'Test 3', value: m.test3, max: 100 },
                    { label: 'Assignment', value: m.assignment, max: 5 },
                    { label: 'Att. Marks', value: m.attendance_marks, max: 5 },
                  ].map(item => (
                    <div key={item.label} className="mark-item">
                      <div className="value">{item.value}</div>
                      <div className="label">{item.label}</div>
                    </div>
                  ))}
                </div>
                {att && (
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Attendance:</span>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className={`progress-fill ${att.percentage >= 75 ? 'green' : att.percentage >= 60 ? 'orange' : 'red'}`} style={{ width: `${att.percentage}%` }} />
                    </div>
                    <span style={{ fontWeight: 700, color: att.percentage >= 75 ? 'var(--accent-green)' : 'var(--accent-orange)', fontSize: 13 }}>{att.attended_classes}/{att.total_classes} ({Math.round(att.percentage)}%)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'practical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {practicalMarks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🔬</div><h3>No practical marks available</h3></div>
          ) : practicalMarks.map(m => {
            const subj = getSubject(m.subject_id);
            const pct = (m.total / 30) * 100;
            return (
              <div key={m.id} className="card" style={{ borderLeft: `3px solid ${pct >= 60 ? 'var(--accent-secondary)' : 'var(--accent-orange)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{subj?.name || `Subject ${m.subject_id}`}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{subj?.code} • Practical</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-secondary)', lineHeight: 1 }}>{m.total}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>out of 30</div>
                  </div>
                </div>
                <div className="marks-breakdown">
                  {[
                    { label: 'Record', value: m.record, max: 10 },
                    { label: 'Viva', value: m.viva, max: 10 },
                    { label: 'Internal Exam', value: m.internal_exam, max: 10 },
                  ].map(item => (
                    <div key={item.label} className="mark-item">
                      <div className="value" style={{ color: 'var(--accent-secondary)' }}>{item.value}</div>
                      <div className="label">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
