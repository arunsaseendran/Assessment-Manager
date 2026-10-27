import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Icons } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';

export default function SemesterReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [semestersList, setSemestersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      api.get(`/api/reports/semester/${id}`)
        .then(r => setReport(r.data))
        .catch(() => toast.error('Failed to load report'))
        .finally(() => setLoading(false));
    } else {
      Promise.all([
        api.get('/api/semesters/'),
        api.get('/api/courses/')
      ])
      .then(([semRes, courseRes]) => {
        setSemestersList(semRes.data.map(s => {
          const course = courseRes.data.find(c => c.id === s.course_id);
          return { ...s, course_name: course ? course.name : '—' };
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
      pdf.save(`Semester_Report_Sem${report?.semester?.number}.pdf`);
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
            <div className="breadcrumb"><span>Reports</span><span className="sep">›</span><span className="current">Semester Report</span></div>
            <h1>Select Semester</h1>
            <p>Choose a semester to view consolidated marks</p>
          </div>
        </div>
        <div className="card" style={{ maxWidth: 500, marginTop: 24 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select a Semester</label>
            <select className="form-select" onChange={e => { if (e.target.value) navigate(`/${user?.role}/reports/semester/${e.target.value}`); }}>
              <option value="">— Select —</option>
              {semestersList.map(s => <option key={s.id} value={s.id}>{s.course_name} — Semester {s.number} ({s.academic_year})</option>)}
            </select>
          </div>
        </div>
      </div>
    );
  }

  const { semester, subjects, students } = report;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Reports</span><span className="sep">›</span><span className="current">Semester Report</span></div>
          <h1>Semester {semester.number} Report</h1>
          <p>Consolidated marks for all students — {semester.academic_year}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}><Icons.ArrowLeft /> Back</button>
          <button className="btn btn-primary" onClick={downloadPDF} disabled={generating}>{generating ? 'Generating...' : <><Icons.Download /> Download PDF</>}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-primary)' }}>{students.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Total Students</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-secondary)' }}>{subjects.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Subjects</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-green)' }}>Sem {semester.number}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{semester.academic_year}</div>
        </div>
      </div>

      <div ref={reportRef} style={{ overflowX: 'auto' }}>
        <div className="table-container">
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="table-title">Semester {semester.number} — Consolidated Report</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Roll No.</th>
                <th>Student Name</th>
                {subjects.map(s => (
                  <th key={s.id}>
                    <div>{s.code}</div>
                    <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)' }}>{s.type}</div>
                  </th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map((stu, i) => {
                const total = Object.values(stu.marks).reduce((a, m) => a + (m?.final ?? 0), 0);
                return (
                  <tr key={stu.student_id}>
                    <td>{i + 1}</td>
                    <td><span className="badge badge-primary">{stu.roll_number}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{stu.full_name}</td>
                    {subjects.map(s => {
                      const mark = stu.marks[s.code];
                      const val = mark?.final ?? 0;
                      const passed = val >= 12;
                      return (
                        <td key={s.id} style={{ textAlign: 'center', fontWeight: 700, color: passed ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          {val || '—'}
                        </td>
                      );
                    })}
                    <td style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent-primary)' }}>{total}</td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr><td colSpan={subjects.length + 4}><div className="empty-state" style={{ padding: 30 }}><p>No students found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
