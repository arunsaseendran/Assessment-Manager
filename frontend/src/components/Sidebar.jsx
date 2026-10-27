import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ── SVG Icon components ─────────────────────────────────────────────────── */
const Icon = ({ d, viewBox = "0 0 24 24" }) => (
  <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
    <path d={d} />
  </svg>
);

const Icons = {
  Dashboard: () => <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />,
  Department: () => <Icon d="M3 21h18 M9 8h1m5 0h1M9 12h1m5 0h1M9 16h1m5 0h1M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14" />,
  Course: () => <Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  Semester: () => <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  Subject: () => <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  Staff: () => <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  Student: () => <Icon d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />,
  Report: () => <Icon d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  Marks: () => <Icon d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  Attendance: () => <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  Promote: () => <Icon d="M5 10l7-7m0 0l7 7m-7-7v18" />,
  Logout: () => <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
  Settings: () => <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
};

const ADMIN_NAV = [
  {
    section: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', Icon: Icons.Dashboard, end: true }],
  },
  {
    section: 'Academic Setup',
    items: [
      { to: '/admin/departments', label: 'Departments', Icon: Icons.Department },
      { to: '/admin/courses',     label: 'Courses',     Icon: Icons.Course },
      { to: '/admin/subjects',    label: 'Subjects',    Icon: Icons.Subject },
      { to: '/admin/promote',     label: 'Promotion',   Icon: Icons.Promote },
    ],
  },
  {
    section: 'People',
    items: [
      { to: '/admin/staff',    label: 'Tutors',    Icon: Icons.Staff },
      { to: '/admin/students', label: 'Students', Icon: Icons.Student },
    ],
  },
  {
    section: 'Reports',
    items: [{ to: '/admin/reports', label: 'Reports', Icon: Icons.Report }],
  },
  {
    section: 'Configuration',
    items: [{ to: '/admin/settings', label: 'Settings', Icon: Icons.Settings }],
  },
];

const STAFF_NAV = [
  { section: 'Overview', items: [{ to: '/staff', label: 'Dashboard', Icon: Icons.Dashboard, end: true }] },
  {
    section: 'Assessment',
    items: [
      { to: '/staff/marks',      label: 'Enter Marks', Icon: Icons.Marks },
      { to: '/staff/attendance', label: 'Attendance',  Icon: Icons.Attendance },
    ],
  },
  { section: 'Reports', items: [{ to: '/staff/reports', label: 'Reports', Icon: Icons.Report }] },
  {
    section: 'Configuration',
    items: [{ to: '/staff/settings', label: 'Settings', Icon: Icons.Settings }],
  },
];

const STUDENT_NAV = [
  { section: 'Overview', items: [{ to: '/student', label: 'Dashboard', Icon: Icons.Dashboard, end: true }] },
  {
    section: 'Academics',
    items: [
      { to: '/student/marks',  label: 'My Marks',  Icon: Icons.Marks },
      { to: '/student/report', label: 'My Report', Icon: Icons.Report },
    ],
  },
  {
    section: 'Configuration',
    items: [{ to: '/student/settings', label: 'Settings', Icon: Icons.Settings }],
  },
];

const ROLE_LABELS = { admin: 'Administrator', staff: 'Tutor', student: 'Student' };


export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navConfig =
    user?.role === 'admin'   ? ADMIN_NAV :
    user?.role === 'staff'   ? STAFF_NAV : STUDENT_NAV;

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon-box">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <div className="app-name">Assessment Manager</div>
            <div className="app-tagline">Internal Evaluation System</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navConfig.map((section) => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <div className="nav-icon-wrap">
                  <item.Icon />
                </div>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="sidebar-footer">
        <div className="user-card" style={{ cursor: 'default' }}>
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name?.split(' ')[0] || 'User'}
            </div>
            <div className="user-role">{ROLE_LABELS[user?.role]}</div>
          </div>
        </div>
        
        <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', marginTop: '12px', justifyContent: 'center', color: 'var(--red)', borderColor: 'var(--red-bg)' }}>
          <Icons.Logout /> Sign Out
        </button>
      </div>
    </aside>
  );
}
