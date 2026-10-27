import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../../components/Icons';

export default function ReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const reports = [
    {
      title: 'Student Report Card',
      desc: 'Generate comprehensive academic report for a specific student.',
      icon: Icons.User,
      to: `/${user?.role}/reports/student`
    },
    {
      title: 'Subject Performance',
      desc: 'View performance analytics and marks distribution for a specific subject.',
      icon: Icons.Book,
      to: `/${user?.role}/reports/subject`
    },
    {
      title: 'Semester Overview',
      desc: 'Analyze overall performance of a department across a semester.',
      icon: Icons.Semester,
      to: `/${user?.role}/reports/semester`
    }
  ];

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>{user?.role === 'admin' ? 'Admin' : 'Tutor'}</span><span className="sep">/</span><span className="current">Reports</span></div>
          <h1>Reports Hub</h1>
          <p>Generate and analyze academic performance reports</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: 32 }}>
        {reports.map((r, i) => (
          <div key={i} className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => navigate(r.to)}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', marginBottom: 16 }}>
              <r.icon style={{ width: 24, height: 24 }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{r.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>{r.desc}</p>
            <div style={{ marginTop: 20, color: 'var(--accent)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Open Report <Icons.ArrowRight style={{ width: 14, height: 14 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
