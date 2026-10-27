import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Icons } from '../../components/Icons';
import toast from 'react-hot-toast';

export default function StudentReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const reportRef = useRef(null);
  const navigate = useNavigate();

  const studentId = id || null;

  useEffect(() => {
    const fetchReport = async () => {
      try {
        let sid = studentId;
        if (!sid && user?.role === 'student') {
          const profRes = await api.get('/api/students/me');
          sid = profRes.data.id;
        }
        if (sid) {
          const r = await api.get(`/api/reports/student/${sid}/`);
          setReport(r.data);
          
          // Select default semester (student's active semester or highest available)
          if (r.data.subjects && r.data.subjects.length > 0) {
            const sems = Array.from(new Set(r.data.subjects.map(s => s.semester_number))).sort((a, b) => a - b);
            if (sems.includes(r.data.student.semester)) {
              setSelectedSemester(String(r.data.student.semester));
            } else if (sems.length > 0) {
              setSelectedSemester(String(sems[sems.length - 1]));
            }
          }
        } else if (user?.role !== 'student') {
          // Include graduated students in report lists too
          const sRes = await api.get('/api/students/?is_graduated=any');
          setStudentsList(sRes.data);
        }
      } catch (e) { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    };
    fetchReport();
  }, [studentId, user]);

  const downloadPDF = async () => {
    setGenerating(true);
    toast('Generating PDF...', { icon: '📄' });
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, useCORS: true, logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Student_Report_${report?.student?.roll_number}_Sem_${selectedSemester}.pdf`);
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
            <div className="breadcrumb"><span>Reports</span><span className="sep">›</span><span className="current">Student Report</span></div>
            <h1>Select Student</h1>
            <p>Choose a student to generate their report card</p>
          </div>
        </div>
        <div className="card" style={{ maxWidth: 500, marginTop: 24 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select a Student</label>
            <select className="form-select" onChange={e => { if (e.target.value) navigate(`/${user?.role}/reports/student/${e.target.value}`); }}>
              <option value="">— Select —</option>
              {studentsList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.user?.full_name} ({s.roll_number}) {s.is_graduated ? '[Graduated]' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  const { student, subjects } = report;
  
  // Get all unique semester terms with registered subjects
  const semestersWithData = Array.from(new Set(subjects.map(s => s.semester_number))).sort((a, b) => a - b);
  
  // Filter subjects by selected semester
  const activeSemesterSubjects = subjects.filter(s => String(s.semester_number) === selectedSemester);
  const theorySubjects = activeSemesterSubjects.filter(s => s.subject_type === 'theory');
  const practicalSubjects = activeSemesterSubjects.filter(s => s.subject_type === 'practical');

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Reports</span><span className="sep">›</span><span className="current">Student Report</span></div>
          <h1>Student Report Card</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}><Icons.ArrowLeft /> Back</button>
          <button className="btn btn-primary" onClick={downloadPDF} disabled={generating}>
            {generating ? 'Generating...' : <><Icons.Download /> Download PDF</>}
          </button>
        </div>
      </div>

      {/* Semester filter dropdown */}
      {semestersWithData.length > 1 && (
        <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14 }}>Select Academic Term:</span>
            <select className="form-select" style={{ maxWidth: 220 }} value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
              {semestersWithData.map(semNum => (
                <option key={semNum} value={semNum}>
                  Semester {semNum} {parseInt(semNum) === student.semester && !student.is_graduated ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div ref={reportRef} style={{ background: 'var(--bg-primary)', padding: 4 }}>
        {/* Report Header */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,255,0.08))', marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 28 }}><Icons.Award /></div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>Internal Assessment Report</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Semester {selectedSemester} Evaluation • {report.institution_name || 'Academic Institution'}
          </p>
        </div>

        {/* Student Info */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' }}>Student Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Name', value: student.full_name },
              { label: 'Roll Number', value: student.roll_number },
              { label: 'Course', value: student.course },
              { label: 'Status', value: student.is_graduated ? 'Graduated (Archived)' : `Active (Semester ${student.semester})` },
              { label: 'Batch Year', value: student.batch_year || '—' },
              { label: 'Email', value: student.email },
            ].map(item => (
              <div key={item.label} style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Theory Marks */}
        {theorySubjects.length > 0 && (
          <div className="table-container" style={{ marginBottom: 24 }}>
            <div className="table-toolbar">
              <div className="table-toolbar-left">
                <div className="table-title"><Icons.Book /> Theory Subjects (Semester {selectedSemester})</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Test 1</th>
                  <th>Test 2</th>
                  <th>Test 3</th>
                  <th>Assignment</th>
                  <th>Seminar</th>
                  <th>Att. Marks</th>
                  <th>Final</th>
                  <th>Attendance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {theorySubjects.map(s => {
                  const m = s.internal_marks;
                  const att = s.attendance;
                  const hasMarks = m !== null && m !== undefined;
                  const final = hasMarks ? m.final_marks : 'NA';
                  const passed = hasMarks ? final >= 12 : null;
                  
                  const statusLabel = passed === null ? 'NA' : (passed ? 'Pass' : 'Fail');
                  const statusClass = passed === null ? 'badge-secondary' : (passed ? 'success' : 'danger');
                  const finalColor = passed === null ? 'var(--text-muted)' : (passed ? 'var(--accent-green)' : 'var(--accent-red)');

                  return (
                    <tr key={s.subject_id}>
                      <td><div style={{ fontWeight: 600 }}>{s.subject_name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.subject_code}</div></td>
                      <td>{hasMarks && m.test1 !== undefined ? m.test1 : '—'}</td>
                      <td>{hasMarks && m.test2 !== undefined ? m.test2 : '—'}</td>
                      <td>{hasMarks && m.test3 !== undefined ? m.test3 : '—'}</td>
                      <td>{hasMarks && m.assignment !== undefined ? m.assignment : '—'}</td>
                      <td>{hasMarks && m.seminar !== undefined ? m.seminar : '—'}</td>
                      <td>{hasMarks && m.attendance_marks !== undefined ? m.attendance_marks : '—'}</td>
                      <td style={{ fontWeight: 800, fontSize: 16, color: finalColor }}>{final}</td>
                      <td>{att ? `${Math.round(att.percentage)}%` : '—'}</td>
                      <td><span className={`badge badge-${statusClass}`}>{statusLabel}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Practical Marks */}
        {practicalSubjects.length > 0 && (
          <div className="table-container" style={{ marginBottom: 24 }}>
            <div className="table-toolbar">
              <div className="table-toolbar-left">
                <div className="table-title"><Icons.Flask /> Practical Subjects (Semester {selectedSemester})</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Record</th>
                  <th>Viva</th>
                  <th>Internal Exam</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {practicalSubjects.map(s => {
                  const m = s.practical_marks;
                  const hasMarks = m !== null && m !== undefined;
                  const total = hasMarks ? m.total : 'NA';
                  const passed = hasMarks ? total >= 12 : null;

                  const statusLabel = passed === null ? 'NA' : (passed ? 'Pass' : 'Fail');
                  const statusClass = passed === null ? 'badge-secondary' : (passed ? 'success' : 'danger');
                  const finalColor = passed === null ? 'var(--text-muted)' : (passed ? 'var(--accent-green)' : 'var(--accent-red)');

                  return (
                    <tr key={s.subject_id}>
                      <td><div style={{ fontWeight: 600 }}>{s.subject_name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.subject_code}</div></td>
                      <td>{hasMarks && m.record !== undefined ? m.record : '—'}</td>
                      <td>{hasMarks && m.viva !== undefined ? m.viva : '—'}</td>
                      <td>{hasMarks && m.internal_exam !== undefined ? m.internal_exam : '—'}</td>
                      <td style={{ fontWeight: 800, fontSize: 16, color: finalColor }}>{total}</td>
                      <td><span className={`badge badge-${statusClass}`}>{statusLabel}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeSemesterSubjects.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><Icons.Inbox /></div>
            <h3>No subjects recorded for Semester {selectedSemester}</h3>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: 12, borderTop: '1px solid var(--border)', marginTop: 16 }}>
          Generated by Internal Assessment Manager • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
