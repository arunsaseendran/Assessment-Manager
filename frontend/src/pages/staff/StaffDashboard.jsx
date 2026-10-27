import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { Icons } from '../../components/Icons';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/reports/staff/stats/')
      .then(r => setStats(r.data))
      .catch(() => {
        // Fallback to global stats if staff profile not found (e.g., admin viewing staff)
        api.get('/api/reports/dashboard/stats/')
          .then(r => setStats({
            ...r.data,
            assigned_subjects: r.data.total_subjects,
            students_under_me: r.data.total_students,
            department: '—',
            designation: '—',
            employee_id: '—',
          }))
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)' }}>Loading dashboard...</span>
    </div>
  );

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Tutor</span><span className="sep">/</span><span className="current">Dashboard</span></div>
          <h1>Welcome back, {user?.full_name?.split(' ')[0]}! 👋</h1>
          <p>Manage marks, attendance, and academic performance from here.</p>
        </div>
      </div>

      {/* Staff Profile Card */}
      {stats && (
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(108,99,255,0.08))' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent))',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, flexShrink: 0,
            }}>
              {user?.full_name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{user?.full_name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'Employee ID', value: stats.employee_id },
                  { label: 'Designation', value: stats.designation },
                  { label: 'Department', value: stats.department },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '5px 12px', borderRadius: 8,
                    background: 'var(--bg-glass)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 1 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats — staff-relevant */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          label="Assigned Subjects"
          value={stats?.assigned_subjects ?? 0}
          icon={Icons.Book}
          color="blue"
        />
        <StatCard
          label="Students Under Me"
          value={stats?.students_under_me ?? 0}
          icon={Icons.Users}
          color="amber"
        />
        <StatCard
          label="Total Subjects"
          value={stats?.total_subjects ?? 0}
          icon={Icons.Subject}
          color="green"
        />
        <StatCard
          label="Total Students"
          value={stats?.total_students ?? 0}
          icon={Icons.Student}
          color="blue"
        />
      </div>

      {/* Quick action cards */}
      <div className="grid-3" style={{ gap: 20 }}>
        {[
          {
            title: 'Enter Marks',
            icon: Icons.Edit,
            desc: 'Record and update internal assessment marks for theory and practical subjects',
            to: '/staff/marks',
            color: 'var(--accent)',
          },
          {
            title: 'Mark Attendance',
            icon: Icons.Attendance,
            desc: 'Record total and attended classes. Attendance affects internal marks automatically',
            to: '/staff/attendance',
            color: 'var(--accent-secondary)',
          },
          {
            title: 'View Reports',
            icon: Icons.Report,
            desc: 'Analyze class performance, subject reports, and student report cards',
            to: '/staff/reports',
            color: 'var(--accent-green)',
          },
        ].map((item) => (
          <div key={item.to} className="card" style={{ cursor: 'pointer', borderLeft: `3px solid ${item.color}` }} onClick={() => navigate(item.to)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                <item.icon style={{ width: 22, height: 22 }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
            <div style={{ marginTop: 16, color: item.color, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Open <Icons.ArrowRight style={{ width: 14, height: 14 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
