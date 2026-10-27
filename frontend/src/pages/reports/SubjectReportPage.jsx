import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Icons } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';

export default function SubjectReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      api.get(`/api/reports/subject/${id}`)
        .then(r => setReport(r.data))
        .catch(() => toast.error('Failed to load report'))
        .finally(() => setLoading(false));
    } else {
      Promise.all([
        api.get('/api/subjects/'),
        api.get('/api/semesters/'),
        api.get('/api/courses/')
      ])
      .then(([subRes, semRes, courseRes]) => {
        setSubjectsList(subRes.data.map(sub => {
          const sem = semRes.data.find(s => s.id === sub.semester_id);
          const course = sem ? courseRes.data.find(c => c.id === sem.course_id) : null;
          return { ...sub, course_name: course ? course.name : '—' };
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    }
  }, [id]);

  const downloadPDF = async () => {
    setGenerating(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Subject_Report_${report?.subject?.code}.pdf`);
      toast.success('PDF downloaded!');
    } catch (e) { toast.error('PDF generation failed'); }
    finally { setGenerating(false); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!report) {
    return (
      <div className="animate-slide-up">
        <div className="page-header">
          <div className="page-title">
            <div className="breadcrumb"><span>Reports</span><span className="sep">›</span><span className="current">Subject Report</span></div>
            <h1>Select Subject</h1>
            <p>Choose a subject to view performance analytics</p>
          </div>
        </div>
        <div className="card" style={{ maxWidth: 500, marginTop: 24 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select a Subject</label>
            <select className="form-select" onChange={e => { if (e.target.value) navigate(`/${user?.role}/reports/subject/${e.target.value}`); }}>
              <option value="">— Select —</option>
              {subjectsList.map(s => <option key={s.id} value={s.id}>{s.course_name} — {s.name} ({s.code})</option>)}
            </select>
          </div>
        </div>
      </div>
    );
  }

  const { subject, students } = report;
  const isTheory = subject.type === 'theory';
  const avg = students.length ? (students.reduce((a, s) => a + (isTheory ? s.final_marks : s.total), 0) / students.length).toFixed(1) : 0;
  const passCount = students.filter(s => (isTheory ? s.final_marks : s.total) >= 12).length;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Reports</span><span className="sep">›</span><span className="current">Subject Report</span></div>
          <h1>{subject.name}</h1>
          <p>Subject-wise performance report • {subject.code}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}><Icons.ArrowLeft /> Back</button>
          <button className="btn btn-primary" onClick={downloadPDF} disabled={generating}>{generating ? 'Generating...' : <><Icons.Download /> Download PDF</>}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Students', value: students.length, color: 'var(--accent-primary)' },
          { label: 'Average Marks', value: avg + '/30', color: 'var(--accent-secondary)' },
          { label: 'Pass Count', value: passCount, color: 'var(--accent-green)' },
          { label: 'Pass Rate', value: students.length ? `${Math.round(passCount / students.length * 100)}%` : '0%', color: 'var(--accent-green)' },
        ].map(item => (
          <div key={item.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div ref={reportRef}>
        <div className="table-container">
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="table-title">{subject.name} — {subject.code}</div>
              <div className="table-subtitle">Semester {subject.semester_number} • {subject.type}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Roll No.</th>
                <th>Student Name</th>
                {isTheory ? (
                  <>
                    <th>Test 1</th><th>Test 2</th><th>Test 3</th>
                    <th>Assignment</th><th>Att. Marks</th><th>Final (/30)</th>
                    <th>Attendance</th>
                  </>
                ) : (
                  <>
                    <th>Record</th><th>Viva</th><th>Internal Exam</th><th>Total (/30)</th>
                    <th>Attendance</th>
                  </>
                )}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const score = isTheory ? s.final_marks : s.total;
                const passed = score >= 12;
                return (
                  <tr key={s.student_id}>
                    <td>{i + 1}</td>
                    <td><span className="badge badge-primary">{s.roll_number}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.full_name}</td>
                    {isTheory ? (
                      <>
                        <td>{s.test1}</td><td>{s.test2}</td><td>{s.test3}</td>
                        <td>{s.assignment}</td><td>{s.attendance_marks}</td>
                        <td style={{ fontWeight: 800, color: passed ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 15 }}>{s.final_marks}</td>
                        <td>{s.attendance_pct ? `${Math.round(s.attendance_pct)}%` : '—'}</td>
                      </>
                    ) : (
                      <>
                        <td>{s.record}</td><td>{s.viva}</td><td>{s.internal_exam}</td>
                        <td style={{ fontWeight: 800, color: passed ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 15 }}>{s.total}</td>
                        <td>{s.attendance_pct ? `${Math.round(s.attendance_pct)}%` : '—'}</td>
                      </>
                    )}
                    <td><span className={`badge badge-${passed ? 'success' : 'danger'}`}>{passed ? 'Pass' : 'Fail'}</span></td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr><td colSpan={12}><div className="empty-state" style={{ padding: 30 }}><p>No students found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
