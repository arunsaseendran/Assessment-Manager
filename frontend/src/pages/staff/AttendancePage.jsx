import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Icons } from '../../components/Icons';

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState({});
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
    setLoading(true);

    api.get(`/api/students/?semester_id=${subj.semester_id}`)
      .then(async stuRes => {
        const stus = stuRes.data;
        setStudents(stus);
        const attRes = await api.get(`/api/marks/attendance?subject_id=${selectedSubject}`);
        const attMap = {};
        for (const s of stus) {
          const a = attRes.data.find(x => x.student_id === s.id);
          attMap[s.id] = { total_classes: a?.total_classes || 0, attended_classes: a?.attended_classes || 0 };
        }
        setAttendance(attMap);
        setSaved({});
      })
      .finally(() => setLoading(false));
  }, [selectedSubject]); // only re-run on subject change

  const update = (stuId, field, val) => {
    let cleanVal = val.replace(/^0+(?=\d)/, '');
    if (cleanVal === '') cleanVal = '0';
    setAttendance(prev => ({ ...prev, [stuId]: { ...prev[stuId], [field]: cleanVal } }));
  };

  const getPercentage = (stuId) => {
    const a = attendance[stuId];
    if (!a || !a.total_classes) return 0;
    return Math.round((a.attended_classes / a.total_classes) * 100);
  };

  const saveOne = async (stuId) => {
    try {
      await api.post('/api/marks/attendance/', {
        student_id: stuId,
        subject_id: parseInt(selectedSubject),
        ...attendance[stuId],
      });
      setSaved(prev => ({ ...prev, [stuId]: true }));
      toast.success('Attendance saved!');
    } catch (e) { toast.error('Error saving'); }
  };

  const saveAll = async () => {
    setSaving(true);
    let count = 0;
    for (const stu of students) {
      try {
        await api.post('/api/marks/attendance/', {
          student_id: stu.id,
          subject_id: parseInt(selectedSubject),
          ...attendance[stu.id],
        });
        setSaved(prev => ({ ...prev, [stu.id]: true }));
        count++;
      } catch (e) {}
    }
    setSaving(false);
    toast.success(`Saved attendance for ${count} students`);
  };

  const getPctColor = (pct) => pct >= 75 ? 'var(--accent-green)' : pct >= 60 ? 'var(--accent-orange)' : 'var(--accent-red)';
  const getPctClass = (pct) => pct >= 75 ? 'success' : pct >= 60 ? 'warning' : 'danger';

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

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Tutor</span><span className="sep">›</span><span className="current">Attendance</span></div>
          <h1>Attendance Management</h1>
          <p>Record and update student attendance records</p>
        </div>
        {selectedSubject && students.length > 0 && (
          <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
            <Icons.Save /> {saving ? 'Saving...' : 'Save All'}
          </button>
        )}
      </div>

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
              return <option key={s.id} value={s.id}>{s.name} ({s.code}) {c ? `[${c.code}]` : ''}</option>;
            })}
          </select>
        </div>
        {!isAdmin && (
          <div style={{ flex: '0 0 100%', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: 4 }}>
            Showing only your assigned subjects — contact admin to update your subject assignments.
          </div>
        )}
      </div>

      {loading && <div className="loading-page"><div className="spinner" /></div>}

      {!loading && students.length > 0 && (
        <div className="table-container">
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="table-title">
                {subjects.find(s => s.id === parseInt(selectedSubject))?.name} — Attendance
              </div>
              <div className="table-subtitle">{students.length} students</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>Roll No.</th>
                  <th style={{ position: 'sticky', left: 80, zIndex: 10, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>Student Name</th>
                  <th>Total Classes</th>
                  <th>Attended</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th style={{ position: 'sticky', right: 0, zIndex: 10, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map(stu => {
                  const pct = getPercentage(stu.id);
                  return (
                    <tr key={stu.id}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 5, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}><span className="badge badge-primary">{stu.roll_number}</span></td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', position: 'sticky', left: 80, zIndex: 5, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
                        {stu.user?.full_name}
                        {saved[stu.id] && <span className="badge badge-success" style={{ marginLeft: 8 }}><Icons.Check /></span>}
                      </td>
                      <td>
                        <input className="marks-input" type="number" min={0} style={{ width: 90 }}
                          value={attendance[stu.id]?.total_classes ?? 0}
                          onChange={e => update(stu.id, 'total_classes', e.target.value)}
                        />
                      </td>
                      <td>
                        <input className="marks-input" type="number" min={0} style={{ width: 90 }}
                          value={attendance[stu.id]?.attended_classes ?? 0}
                          onChange={e => update(stu.id, 'attended_classes', e.target.value)}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
                          <div className="progress-bar" style={{ flex: 1 }}>
                            <div className={`progress-fill ${pct >= 75 ? 'green' : pct >= 60 ? 'orange' : 'red'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: getPctColor(pct), minWidth: 38 }}>{pct}%</span>
                        </div>
                      </td>
                      <td><span className={`badge badge-${getPctClass(pct)}`}>{pct >= 75 ? 'Good' : pct >= 60 ? 'Low' : 'Short'}</span></td>
                      <td style={{ position: 'sticky', right: 0, zIndex: 5, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}><button className="btn btn-success btn-sm" onClick={() => saveOne(stu.id)}><Icons.Save /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedSubject && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-icon"><Icons.Book /></div>
          <h3>Select a Subject</h3>
          <p>Choose a subject to manage attendance</p>
        </div>
      )}
    </div>
  );
}
