import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Icons } from '../../components/Icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const PIE_COLORS = { 'Passing': '#16A34A', 'Failing': '#DC2626' };
const BAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const DONUT_COLORS = ['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 8, boxShadow: 'var(--shadow-md)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.fill || p.stroke, fontWeight: 700, fontSize: 14 }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/reports/dashboard/stats/')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const barData = stats.course_enrollment || [];
  const pieData = stats.performance_distribution || [];
  const donutData = stats.tutor_distribution || [];

  if (loading) return <div className="loading-page"><div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading dashboard...</span></div>;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Admin</span><span className="sep">/</span><span className="current">Dashboard</span></div>
          <h1>Dashboard Overview</h1>
          <p>Manage your institution's academic data from one place</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => navigate('/admin/students')}>
            <Icons.Plus /> Add Student
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Departments" value={stats.total_departments || 0} icon={Icons.Department} color="green" />
        <StatCard label="Courses" value={stats.total_courses || 0} icon={Icons.Course} color="blue" />
        <StatCard label="Subjects" value={stats.total_subjects || 0} icon={Icons.Subject} color="amber" />
        <StatCard label="Tutors" value={stats.total_staff || 0} icon={Icons.Staff} color="green" />
        <StatCard label="Students" value={stats.total_students || 0} icon={Icons.Student} color="blue" />
      </div>

      <div className="grid-3" style={{ gap: 24, marginBottom: 24 }}>
        <div className="chart-card">
          <div className="chart-header">
            <Icons.BarChart /> Student Enrollment by Course
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-muted)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <Icons.PieChart /> Assessment Performance (Pass/Fail)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="var(--bg-surface)" strokeWidth={2}>
                {pieData.map((entry, i) => <Cell key={i} fill={PIE_COLORS[entry.name] || '#6B7280'} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <Icons.Semester /> Tutors by Department
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="value" stroke="var(--bg-surface)" strokeWidth={2}>
                {donutData.map((entry, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-3" style={{ gap: 20 }}>
        {[
          { title: 'Departments', icon: Icons.Department, desc: 'Add & manage academic departments', to: '/admin/departments' },
          { title: 'Courses', icon: Icons.Course, desc: 'Manage degree programs & courses', to: '/admin/courses' },
          { title: 'Semesters', icon: Icons.Semester, desc: 'Configure semester schedules', to: '/admin/semesters' },
          { title: 'Subjects', icon: Icons.Subject, desc: 'Add theory & practical subjects', to: '/admin/subjects' },
          { title: 'Tutors', icon: Icons.Staff, desc: 'Manage tutor profiles', to: '/admin/staff' },
          { title: 'Students', icon: Icons.Student, desc: 'Manage student enrollment', to: '/admin/students' },
        ].map((item) => (

          <div key={item.to} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(item.to)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <item.icon style={{ width: 20, height: 20 }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.desc}</div>
            <div style={{ marginTop: 16, color: 'var(--accent)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Manage <Icons.ArrowRight style={{ width: 14, height: 14 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
