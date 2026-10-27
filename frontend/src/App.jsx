import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import CoursesPage from './pages/admin/CoursesPage';
import SemestersPage from './pages/admin/SemestersPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import StaffPage from './pages/admin/StaffPage';
import StudentsPage from './pages/admin/StudentsPage';
import SemesterPromotionPage from './pages/admin/SemesterPromotionPage';
import SettingsPage from './pages/admin/SettingsPage';

// Staff
import StaffDashboard from './pages/staff/StaffDashboard';
import MarksEntryPage from './pages/staff/MarksEntryPage';
import AttendancePage from './pages/staff/AttendancePage';
import TutorSettingsPage from './pages/staff/TutorSettingsPage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import StudentMarksPage from './pages/student/StudentMarksPage';
import StudentSettingsPage from './pages/student/StudentSettingsPage';

// Reports
import ReportsPage from './pages/reports/ReportsPage';
import StudentReportPage from './pages/reports/StudentReportPage';
import SubjectReportPage from './pages/reports/SubjectReportPage';
import SemesterReportPage from './pages/reports/SemesterReportPage';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'staff') return <Navigate to="/staff" replace />;
  return <Navigate to="/student" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#131430',
              color: '#f0f0ff',
              border: '1px solid rgba(108,99,255,0.3)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00ffa3', secondary: '#131430' } },
            error: { iconTheme: { primary: '#ff4757', secondary: '#131430' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="semesters" element={<SemestersPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="promote" element={<SemesterPromotionPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reports/student" element={<StudentReportPage />} />
            <Route path="reports/student/:id" element={<StudentReportPage />} />
            <Route path="reports/subject" element={<SubjectReportPage />} />
            <Route path="reports/subject/:id" element={<SubjectReportPage />} />
            <Route path="reports/semester" element={<SemesterReportPage />} />
            <Route path="reports/semester/:id" element={<SemesterReportPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Staff Routes */}
          <Route path="/staff" element={<ProtectedRoute roles={['staff', 'admin']}><Layout /></ProtectedRoute>}>
            <Route index element={<StaffDashboard />} />
            <Route path="marks" element={<MarksEntryPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reports/student" element={<StudentReportPage />} />
            <Route path="reports/student/:id" element={<StudentReportPage />} />
            <Route path="reports/subject" element={<SubjectReportPage />} />
            <Route path="reports/subject/:id" element={<SubjectReportPage />} />
            <Route path="settings" element={<TutorSettingsPage />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><Layout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="marks" element={<StudentMarksPage />} />
            <Route path="report" element={<StudentReportPage />} />
            <Route path="settings" element={<StudentSettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
