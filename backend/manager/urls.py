from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomLoginView,
    DepartmentViewSet, CourseViewSet, SemesterViewSet,
    SubjectViewSet, StaffViewSet, StudentViewSet,
    InternalMarkViewSet, PracticalMarkViewSet, AttendanceViewSet,
    marks_bulk_update, get_dashboard_stats,
    get_semester_report, get_subject_report, get_student_report,
    get_student_me, get_staff_stats, preview_promotion, promote_semester,
    admin_profile_view, forgot_password_view, reset_password_otp_view,
    tutor_profile_view, student_profile_view,
    get_my_subjects, get_staff_assignments, set_staff_assignments,
    get_mark_scheme_templates, set_mark_scheme_templates,
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'semesters', SemesterViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'students', StudentViewSet)
router.register(r'marks/internal', InternalMarkViewSet, basename='internal-marks')
router.register(r'marks/practical', PracticalMarkViewSet, basename='practical-marks')
router.register(r'marks/attendance', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('auth/login/', CustomLoginView.as_view(), name='login'),
    path('students/me/', get_student_me, name='student-me'),
    path('marks/bulk/', marks_bulk_update, name='marks-bulk'),
    path('reports/dashboard/stats/', get_dashboard_stats, name='dashboard-stats'),
    path('reports/staff/stats/', get_staff_stats, name='staff-stats'),
    path('promote-semester/preview/', preview_promotion, name='promote-preview'),
    path('promote-semester/', promote_semester, name='promote-semester'),
    path('reports/semester/<int:semester_id>/', get_semester_report, name='semester-report'),
    path('reports/subject/<int:subject_id>/', get_subject_report, name='subject-report'),
    path('reports/student/<int:student_id>/', get_student_report, name='student-report'),
    path('admin/profile/', admin_profile_view, name='admin-profile'),
    path('auth/forgot-password/', forgot_password_view, name='forgot-password'),
    path('auth/reset-password-otp/', reset_password_otp_view, name='reset-password-otp'),
    path('tutor/profile/', tutor_profile_view, name='tutor-profile'),
    path('student/profile/', student_profile_view, name='student-profile'),
    # ── Subject access: filtered per role ────────────────────────────────────
    path('subjects/my/', get_my_subjects, name='my-subjects'),
    # ── Staff subject assignments ─────────────────────────────────────────────
    path('staff/<int:staff_id>/assignments/', get_staff_assignments, name='staff-assignments-get'),
    path('staff/<int:staff_id>/assignments/set/', set_staff_assignments, name='staff-assignments-set'),
    # ── Mark Scheme Templates ─────────────────────────────────────────────────
    path('mark-scheme-templates/', get_mark_scheme_templates, name='mark-scheme-templates-get'),
    path('mark-scheme-templates/set/', set_mark_scheme_templates, name='mark-scheme-templates-set'),
    path('', include(router.urls)),
]
