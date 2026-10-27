import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { Icons } from '../../components/Icons';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [avgAttendance, setAvgAttendance] = useState(null);
  const [attendanceLow, setAttendanceLow] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        // get_student_me now returns enriched data: semester_number, course_name, subjects_count, marks_count
        const profRes = await api.get('/api/students/me/');
        const prof = profRes.data;
        setProfile(prof);

        // Load attendance summary
        try {
          const attRes = await api.get(`/api/marks/attendance/?student_id=${prof.id}`);
          if (attRes.data.length > 0) {
            const avg = attRes.data.reduce((a, x) => a + x.percentage, 0) / attRes.data.length;
            const rounded = Math.round(avg);
            setAvgAttendance(rounded);
            setAttendanceLow(rounded < 75);
          }
        } catch (_) {}
      } catch (e) {
        // Student profile not found
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)' }}>Loading your profile...</span>
    </div>
  );

  const marksCount = (profile?.marks_count || 0) + (profile?.practical_marks_count || 0);
  const subjectsCount = profile?.subjects_count || 0;

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div className="page-title">
          <div className="breadcrumb"><span>Student</span><span className="sep">/</span><span className="current">Dashboard</span></div>
          <h1>Welcome, {user?.full_name?.split(' ')[0]}! 👋</h1>
          <p>Here's your academic overview for this semester.</p>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(0,212,255,0.06))' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, flexShrink: 0,
          }}>
            {user?.full_name?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{user?.full_name}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {[
                { label: 'Roll No.', value: profile?.roll_number || '—', color: 'var(--accent)' },
                { label: 'Course', value: profile?.course_name || '—', color: 'var(--accent-secondary)' },
                { label: 'Semester', value: profile?.semester_number != null ? `Semester ${profile.semester_number}` : '—', color: 'var(--accent-green)' },
                { label: 'Batch', value: profile?.batch_year ? `${profile.batch_year}` : '—', color: 'var(--text-secondary)' },
              ].map(item => (
                <div key={item.label} style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: 'var(--bg-glass)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: item.color, marginTop: 2 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Low attendance warning */}
      {attendanceLow && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: 20,
          borderRadius: 10, background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)',
          color: 'var(--accent-red)',
        }}>
          <Icons.Warning style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span style={{ fontSize: 13 }}>
            <strong>Low Attendance Alert:</strong> Your average attendance is {avgAttendance}% — below the 75% requirement. Please attend more classes.
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          label="Enrolled Subjects"
          value={subjectsCount}
          icon={Icons.Book}
          color="blue"
        />
        <StatCard
          label="Marks Recorded"
          value={marksCount}
          icon={Icons.Marks}
          color="amber"
        />
        <StatCard
          label="Avg. Attendance"
          value={avgAttendance !== null ? `${avgAttendance}%` : '—'}
          icon={Icons.Check}
          color={attendanceLow ? 'red' : 'green'}
        />
        <StatCard
          label="Semester"
          value={profile?.semester_number != null ? `Sem ${profile.semester_number}` : '—'}
          icon={Icons.Semester}
          color="blue"
        />
      </div>

      {/* Quick action cards */}
      <div className="grid-2" style={{ gap: 20 }}>
        {[
          {
            title: 'My Marks',
            icon: Icons.Marks,
            desc: 'View your internal assessment marks for theory and practical subjects',
            to: '/student/marks',
            color: 'var(--accent)',
          },
          {
            title: 'My Report Card',
            icon: Icons.Report,
            desc: 'View and download your consolidated academic performance report',
            to: '/student/report',
            color: 'var(--accent-secondary)',
          },
        ].map((item) => (
          <div key={item.to} className="card" style={{ cursor: 'pointer', borderLeft: `3px solid ${item.color}` }} onClick={() => navigate(item.to)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                <item.icon style={{ width: 22, height: 22 }} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
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
