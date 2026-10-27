from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from django.db.models import ProtectedError
from .models import *
from .serializers import *


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


def is_staff_assigned_to_subject(user, subject_id):
    """
    Returns True if:
    - the user is an admin (no restriction), OR
    - the user is a staff member assigned to the given subject_id via SubjectAssignment.
    """
    if user.role == 'admin':
        return True
    if user.role != 'staff':
        return False
    try:
        staff = Staff.objects.get(user=user)
    except Staff.DoesNotExist:
        return False
    return SubjectAssignment.objects.filter(staff=staff, subject_id=subject_id).exists()


class CustomLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            if not user.is_active:
                return Response({'detail': 'Account is disabled'}, status=400)
            refresh = RefreshToken.for_user(user)
            return Response({
                'access_token': str(refresh.access_token),
                'role': user.role,
                'user_id': user.id,
                'full_name': user.full_name
            })
        return Response({'detail': 'Invalid username or password'}, status=401)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {'detail': f'Cannot delete department "{instance.name}" — it has courses or staff linked to it. Remove those first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {'detail': f'Cannot delete department "{instance.name}" — it is still referenced by other records.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset.all()
        dept_id = self.request.query_params.get('department_id')
        if dept_id:
            return qs.filter(department_id=dept_id)
        return qs

    def generate_semesters(self, course):
        for i in range(1, course.num_semesters + 1):
            Semester.objects.get_or_create(course=course, number=i)

    def perform_create(self, serializer):
        course = serializer.save()
        self.generate_semesters(course)

    def perform_update(self, serializer):
        course = serializer.save()
        self.generate_semesters(course)

    def create(self, request, *args, **kwargs):
        # Check for duplicate name/code
        name = request.data.get('name', '').strip()
        code = request.data.get('code', '').strip().upper()
        if Course.objects.filter(code__iexact=code).exists():
            return Response({'detail': f'Course code "{code}" already exists. Each course must have a unique code.'}, status=400)
        if Course.objects.filter(name__iexact=name).exists():
            return Response({'detail': f'Course name "{name}" already exists. Each course must have a unique name.'}, status=400)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        name = request.data.get('name', '').strip()
        code = request.data.get('code', '').strip().upper()
        # Check uniqueness excluding current instance
        if code and Course.objects.filter(code__iexact=code).exclude(pk=instance.pk).exists():
            return Response({'detail': f'Course code "{code}" is already used by another course.'}, status=400)
        if name and Course.objects.filter(name__iexact=name).exclude(pk=instance.pk).exists():
            return Response({'detail': f'Course name "{name}" is already used by another course.'}, status=400)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {'detail': f'Cannot delete course "{instance.name}" — it has semesters or students enrolled. Remove those first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {'detail': f'Cannot delete course "{instance.name}" — it is still referenced by other records.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset.all()
        course_id = self.request.query_params.get('course_id')
        if course_id:
            return qs.filter(course_id=course_id)
        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {'detail': f'Cannot delete Semester {instance.number} — it has subjects or students linked to it. Remove those first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {'detail': f'Cannot delete Semester {instance.number} — it is still referenced by other records.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset.all()
        semester_id = self.request.query_params.get('semester_id')
        course_id = self.request.query_params.get('course_id')
        if semester_id:
            qs = qs.filter(semester_id=semester_id)
        if course_id:
            qs = qs.filter(semester__course_id=course_id)
        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {'detail': f'Cannot delete subject "{instance.name}" — it has marks or attendance records linked to it.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {'detail': f'Cannot delete subject "{instance.name}" — it is still referenced by other records.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name')
        if not username:
            return Response({'detail': 'Username is required.'}, status=400)
        if not password:
            return Response({'detail': 'Password is required.'}, status=400)
        if User.objects.filter(username=username).exists():
            return Response({'detail': f'Username "{username}" already exists. Please choose a different username.'}, status=400)
        if email and User.objects.filter(email=email).exists():
            return Response({'detail': f'Email "{email}" is already registered.'}, status=400)
        user = User.objects.create_user(
            username=username, email=email, password=password,
            full_name=full_name, role='staff'
        )
        mutable_data = request.data.copy()
        serializer = self.get_serializer(data=mutable_data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user)
        return Response(serializer.data, status=201)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = instance.user
        if 'full_name' in request.data:
            user.full_name = request.data['full_name']
        if 'email' in request.data:
            new_email = request.data['email']
            if new_email and User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
                return Response({'detail': f'Email "{new_email}" is already registered to another user.'}, status=400)
            user.email = new_email
        if request.data.get('password'):
            user.set_password(request.data['password'])
        user.save()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = instance.user
        try:
            instance.delete()
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {'detail': f'Cannot delete staff member "{user.full_name}" — they have subject assignments linked to them.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {'detail': f'Cannot delete staff member "{user.full_name}" — they are still referenced by other records.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset.all()
        semester_id = self.request.query_params.get('semester_id')
        course_id = self.request.query_params.get('course_id')
        is_graduated = self.request.query_params.get('is_graduated')

        if is_graduated is not None:
            if is_graduated.lower() == 'true':
                qs = qs.filter(is_graduated=True)
            elif is_graduated.lower() == 'false':
                qs = qs.filter(is_graduated=False)
        else:
            qs = qs.filter(is_graduated=False)

        if semester_id:
            qs = qs.filter(semester_id=semester_id)
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs


    def create(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password', 'student123')
        full_name = request.data.get('full_name')
        roll_number = request.data.get('roll_number')
        if not username:
            return Response({'detail': 'Username is required.'}, status=400)
        if not roll_number:
            return Response({'detail': 'Roll number is required.'}, status=400)
        if User.objects.filter(username=username).exists():
            return Response({'detail': f'Username "{username}" already exists. Please choose a different username.'}, status=400)
        if email and User.objects.filter(email=email).exists():
            return Response({'detail': f'Email "{email}" is already registered.'}, status=400)
        if Student.objects.filter(roll_number=roll_number).exists():
            return Response({'detail': f'Roll number "{roll_number}" already exists. Each student must have a unique roll number.'}, status=400)
        user = User.objects.create_user(
            username=username, email=email, password=password,
            full_name=full_name, role='student'
        )
        mutable_data = request.data.copy()
        serializer = self.get_serializer(data=mutable_data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user)
        return Response(serializer.data, status=201)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = instance.user
        if 'full_name' in request.data:
            user.full_name = request.data['full_name']
        if 'email' in request.data:
            new_email = request.data['email']
            if new_email and User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
                return Response({'detail': f'Email "{new_email}" is already registered to another user.'}, status=400)
            user.email = new_email
        if request.data.get('password'):
            user.set_password(request.data['password'])
        user.save()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = instance.user
        try:
            # Delete marks/attendance first (CASCADE should handle, but be explicit)
            instance.delete()
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {'detail': f'Cannot delete student "{user.full_name}" — they have linked records.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {'detail': f'Cannot delete student "{user.full_name}" — they are still referenced by other records.'},
                status=status.HTTP_400_BAD_REQUEST
            )


def calculate_internal_marks(mark):
    """
    Auto-calculate final_marks from test scores using the subject's marks scheme.

    Works for subject_type in ('theory', 'combined').
    For 'combined' subjects, this calculates the theory CCA component only.
    The practical CCA component is stored in PracticalMark.

    Formulas:
      best2of3 → average of top 2 tests (default)
      average  → average of all 3 tests
      best1of3 → best single test
      all3     → sum of all 3 tests (raw)

    Scaling: the test result (out of max_test_score) is scaled to max_test_marks.
    Final = test_marks + assignment + seminar + attendance_marks
    """
    subject = mark.subject
    # ── Test score calculation ────────────────────────────────────────────────
    t = [mark.test1, mark.test2, mark.test3]
    formula = getattr(subject, 'test_formula', 'best2of3')
    max_score = getattr(subject, 'max_test_score', 100.0) or 100.0
    max_tm    = getattr(subject, 'max_test_marks', 20.0) or 20.0

    if formula == 'best2of3':
        top2 = sorted(t, reverse=True)[:2]
        raw = sum(top2) / 2
    elif formula == 'average':
        raw = sum(t) / 3
    elif formula == 'best1of3':
        raw = max(t)
    elif formula == 'all3':
        raw = sum(t)          # raw is now out of max_score*3
        max_score = max_score * 3
    else:
        raw = sum(sorted(t, reverse=True)[:2]) / 2  # fallback: best2of3

    test_marks = round((raw / max_score) * max_tm, 1) if max_score > 0 else 0.0

    # ── Other components ──────────────────────────────────────────────────────
    max_asn  = getattr(subject, 'max_assignment', 5.0) or 0.0
    max_sem  = getattr(subject, 'max_seminar', 0.0) or 0.0
    max_attm = getattr(subject, 'max_attendance_marks', 5.0) or 0.0

    assignment       = min(mark.assignment, max_asn)
    seminar          = min(mark.seminar, max_sem)
    attendance_marks = min(mark.attendance_marks, max_attm)

    final = round(test_marks + assignment + seminar + attendance_marks, 1)
    mark.calculated_marks = test_marks
    mark.final_marks = final
    mark.save()
    return mark




def calculate_practical_marks(mark):
    """
    Auto-calculate total for practical marks using the subject's scheme.
    total = record (≤ max_record) + viva (≤ max_viva) + internal_exam (≤ max_practical_exam)
    """
    subject = mark.subject
    max_rec  = getattr(subject, 'max_record', 10.0) or 10.0
    max_viva = getattr(subject, 'max_viva', 10.0) or 10.0
    max_exam = getattr(subject, 'max_practical_exam', 10.0) or 10.0

    total = round(
        min(mark.record, max_rec) +
        min(mark.viva, max_viva) +
        min(mark.internal_exam, max_exam),
        1
    )
    mark.total = total
    mark.save()
    return mark


def get_attendance_marks(student, subject):
    """
    Calculate attendance marks based on attendance percentage.
    Uses subject.max_attendance_marks as the ceiling (default 5).
    Thresholds: ≥90→full, ≥80→80%, ≥75→60%, ≥65→40%, ≥60→20%, else→0
    """
    att = Attendance.objects.filter(student=student, subject=subject).first()
    if not att or not att.total_classes:
        return 0
    pct = att.percentage
    max_m = getattr(subject, 'max_attendance_marks', 5.0) or 5.0
    if pct >= 90:   return max_m
    elif pct >= 80: return round(max_m * 0.80, 1)
    elif pct >= 75: return round(max_m * 0.60, 1)
    elif pct >= 65: return round(max_m * 0.40, 1)
    elif pct >= 60: return round(max_m * 0.20, 1)
    return 0


class InternalMarkViewSet(viewsets.ModelViewSet):
    queryset = InternalMark.objects.all()
    serializer_class = InternalMarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset.all()
        subject_id = self.request.query_params.get('subject_id')
        student_id = self.request.query_params.get('student_id')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def create(self, request, *args, **kwargs):
        student_id = request.data.get('student_id')
        subject_id = request.data.get('subject_id')
        # ── Access guard: only admin or assigned staff may enter marks ──────
        if not is_staff_assigned_to_subject(request.user, subject_id):
            return Response(
                {'detail': 'You are not assigned to this subject and cannot enter marks for it.'},
                status=status.HTTP_403_FORBIDDEN
            )
        instance = InternalMark.objects.filter(
            student_id=student_id, subject_id=subject_id
        ).first()
        serializer = (
            self.get_serializer(instance, data=request.data)
            if instance
            else self.get_serializer(data=request.data)
        )
        serializer.is_valid(raise_exception=True)
        mark = serializer.save()
        # Auto-calculate final marks
        try:
            student = Student.objects.get(id=student_id)
            subject = Subject.objects.get(id=subject_id)
            mark.attendance_marks = get_attendance_marks(student, subject)
            calculate_internal_marks(mark)
        except Exception:
            pass
        return Response(
            self.get_serializer(mark).data,
            status=status.HTTP_200_OK if instance else status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        mark = serializer.save()
        # Auto-calculate
        try:
            mark.attendance_marks = get_attendance_marks(mark.student, mark.subject)
            calculate_internal_marks(mark)
        except Exception:
            pass
        return Response(self.get_serializer(mark).data)


class PracticalMarkViewSet(viewsets.ModelViewSet):
    queryset = PracticalMark.objects.all()
    serializer_class = PracticalMarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset.all()
        subject_id = self.request.query_params.get('subject_id')
        student_id = self.request.query_params.get('student_id')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def create(self, request, *args, **kwargs):
        student_id = request.data.get('student_id')
        subject_id = request.data.get('subject_id')
        # ── Access guard: only admin or assigned staff may enter marks ──────
        if not is_staff_assigned_to_subject(request.user, subject_id):
            return Response(
                {'detail': 'You are not assigned to this subject and cannot enter marks for it.'},
                status=status.HTTP_403_FORBIDDEN
            )
        instance = PracticalMark.objects.filter(
            student_id=student_id, subject_id=subject_id
        ).first()
        serializer = (
            self.get_serializer(instance, data=request.data)
            if instance
            else self.get_serializer(data=request.data)
        )
        serializer.is_valid(raise_exception=True)
        mark = serializer.save()
        # Auto-calculate total
        try:
            calculate_practical_marks(mark)
        except Exception:
            pass
        return Response(
            self.get_serializer(mark).data,
            status=status.HTTP_200_OK if instance else status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        mark = serializer.save()
        try:
            calculate_practical_marks(mark)
        except Exception:
            pass
        return Response(self.get_serializer(mark).data)


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset.all()
        subject_id = self.request.query_params.get('subject_id')
        student_id = self.request.query_params.get('student_id')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def create(self, request, *args, **kwargs):
        student_id = request.data.get('student_id')
        subject_id = request.data.get('subject_id')
        # ── Access guard: only admin or assigned staff may update attendance ─
        if not is_staff_assigned_to_subject(request.user, subject_id):
            return Response(
                {'detail': 'You are not assigned to this subject and cannot update attendance for it.'},
                status=status.HTTP_403_FORBIDDEN
            )
        total = int(request.data.get('total_classes', 0))
        attended = int(request.data.get('attended_classes', 0))
        # Clamp attended to total
        if attended > total:
            attended = total
        pct = round((attended / total * 100), 1) if total > 0 else 0.0

        instance = Attendance.objects.filter(
            student_id=student_id, subject_id=subject_id
        ).first()

        if instance:
            instance.total_classes = total
            instance.attended_classes = attended
            instance.percentage = pct
            instance.save()
            # Recalculate any related internal marks
            self._recalculate_internal(student_id, subject_id)
            return Response(AttendanceSerializer(instance).data, status=200)
        else:
            data = {
                **request.data,
                'percentage': pct,
            }
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            att = serializer.save(percentage=pct)
            self._recalculate_internal(student_id, subject_id)
            return Response(AttendanceSerializer(att).data, status=201)

    def _recalculate_internal(self, student_id, subject_id):
        """After updating attendance, recalculate internal marks if they exist."""
        try:
            subject = Subject.objects.get(id=subject_id)
            student = Student.objects.get(id=student_id)
            if subject.subject_type == 'theory':
                mark = InternalMark.objects.filter(
                    student_id=student_id, subject_id=subject_id
                ).first()
                if mark:
                    mark.attendance_marks = get_attendance_marks(student, subject)
                    calculate_internal_marks(mark)
        except Exception:
            pass


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_student_me(request):
    """Get the student profile for the currently logged-in student user.
    Enriched with semester_number and course_name for the dashboard.
    """
    try:
        student = Student.objects.select_related('user', 'course', 'semester').get(user=request.user)
        data = StudentSerializer(student).data
        # Enrich with human-readable fields
        data['semester_number'] = student.semester.number
        data['course_name'] = student.course.name
        data['course_code'] = student.course.code
        # Count enrolled subjects in this semester
        data['subjects_count'] = Subject.objects.filter(semester=student.semester).count()
        # Count marks entries for this student
        data['marks_count'] = InternalMark.objects.filter(student=student).count()
        data['practical_marks_count'] = PracticalMark.objects.filter(student=student).count()
        return Response(data)
    except Student.DoesNotExist:
        return Response({'detail': 'Student profile not found'}, status=404)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_staff_stats(request):
    """Get staff-relevant stats for the staff dashboard."""
    try:
        staff = Staff.objects.select_related('user', 'department').get(user=request.user)
        # Subjects assigned to this staff member
        assigned_subjects = SubjectAssignment.objects.filter(staff=staff).select_related('subject__semester__course')
        assigned_subject_ids = assigned_subjects.values_list('subject_id', flat=True)

        # Semesters covered by assigned subjects
        semester_ids = Subject.objects.filter(id__in=assigned_subject_ids).values_list('semester_id', flat=True).distinct()

        # Students in those semesters
        student_count = Student.objects.filter(semester_id__in=semester_ids).count()

        return Response({
            'staff_name': staff.user.full_name,
            'department': staff.department.name if staff.department else '—',
            'designation': staff.designation or '—',
            'employee_id': staff.employee_id,
            'assigned_subjects': assigned_subjects.count(),
            'students_under_me': student_count,
            'total_subjects': Subject.objects.count(),
            'total_students': Student.objects.count(),
            'total_staff': Staff.objects.count(),
            'total_departments': Staff.objects.values('department').distinct().count(),
        })
    except Staff.DoesNotExist:
        # Fallback for admin viewing staff dashboard
        return Response({
            'staff_name': request.user.full_name,
            'department': '—',
            'designation': '—',
            'employee_id': '—',
            'assigned_subjects': 0,
            'students_under_me': 0,
            'total_subjects': Subject.objects.count(),
            'total_students': Student.objects.count(),
            'total_staff': Staff.objects.count(),
            'total_departments': Department.objects.count(),
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def preview_promotion(request):
    """
    Dry-run: show what will happen if we promote all students in a course.
    GET /api/promote-semester/preview/?course_id=1
    Returns per-semester student counts and the list of students who will graduate.
    """
    course_id = request.query_params.get('course_id')
    if not course_id:
        return Response({'detail': 'course_id is required.'}, status=400)

    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response({'detail': 'Course not found.'}, status=404)

    # All semesters for this course ordered by number
    semesters = list(Semester.objects.filter(course=course).order_by('number'))
    if not semesters:
        return Response({'detail': 'This course has no semesters configured.'}, status=400)

    max_sem_number = semesters[-1].number
    movements = []
    graduating = []

    for sem in semesters:
        active_students = Student.objects.filter(semester=sem, is_graduated=False).select_related('user')
        count = active_students.count()
        if count == 0:
            continue

        if sem.number == max_sem_number:
            # These students will graduate
            for s in active_students:
                graduating.append({
                    'id': s.id,
                    'full_name': s.user.full_name,
                    'roll_number': s.roll_number,
                })
            movements.append({
                'from_semester': sem.number,
                'to_semester': None,
                'action': 'graduate',
                'count': count,
            })
        else:
            # Find next semester
            next_sem = next((s for s in semesters if s.number == sem.number + 1), None)
            if next_sem:
                movements.append({
                    'from_semester': sem.number,
                    'to_semester': next_sem.number,
                    'action': 'promote',
                    'count': count,
                })

    total_promoting = sum(m['count'] for m in movements if m['action'] == 'promote')
    total_graduating = len(graduating)

    return Response({
        'course_id': course.id,
        'course_name': course.name,
        'movements': movements,
        'graduating': graduating,
        'total_promoting': total_promoting,
        'total_graduating': total_graduating,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def promote_semester(request):
    """
    Cascade-promote all active students in a course by one semester.
    POST /api/promote-semester/
    Body: { "course_id": 1 }

    Algorithm (processes from LAST semester to FIRST to avoid collision):
    - Students in final sem → is_graduated=True, graduated_at=now
    - Students in other sems → semester = next semester
    All historical marks and attendance are preserved (linked to student+subject, not semester).
    """
    from django.utils import timezone
    from django.db import transaction

    course_id = request.data.get('course_id')
    if not course_id:
        return Response({'detail': 'course_id is required.'}, status=400)

    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response({'detail': 'Course not found.'}, status=404)

    semesters = list(Semester.objects.filter(course=course).order_by('number'))
    if not semesters:
        return Response({'detail': 'This course has no semesters configured.'}, status=400)

    max_sem_number = semesters[-1].number
    # Build a lookup: semester_number → Semester object
    sem_by_number = {s.number: s for s in semesters}

    promoted_count = 0
    graduated_count = 0

    # Process in REVERSE order (last semester first) to avoid moving a student twice
    with transaction.atomic():
        for sem in reversed(semesters):
            active_students = Student.objects.filter(semester=sem, is_graduated=False)

            if sem.number == max_sem_number:
                # Graduate these students
                now = timezone.now()
                graduated_count += active_students.count()
                active_students.update(is_graduated=True, graduated_at=now)
            else:
                next_sem = sem_by_number.get(sem.number + 1)
                if next_sem:
                    promoted_count += active_students.count()
                    active_students.update(semester=next_sem)

    return Response({
        'success': True,
        'course_name': course.name,
        'promoted': promoted_count,
        'graduated': graduated_count,
        'message': (
            f'Successfully promoted {promoted_count} student(s) and '
            f'graduated {graduated_count} student(s) in {course.name}.'
        ),
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_dashboard_stats(request):
    total_depts = Department.objects.count()
    total_courses = Course.objects.count()
    total_students = Student.objects.filter(is_graduated=False).count()
    total_staff = Staff.objects.count()
    total_subjects = Subject.objects.count()

    # 1. Student enrollment per course (Logical Bar Chart data)
    course_enrollment = []
    for course in Course.objects.all():
        count = Student.objects.filter(course=course, is_graduated=False).count()
        course_enrollment.append({
            'name': course.code,
            'value': count
        })

    # 2. Performance Distribution: Pass vs Fail across all subjects (Logical Pie Chart data)
    pass_internals = InternalMark.objects.filter(final_marks__gte=12).count()
    fail_internals = InternalMark.objects.filter(final_marks__lt=12).count()

    pass_practicals = PracticalMark.objects.filter(total__gte=12).count()
    fail_practicals = PracticalMark.objects.filter(total__lt=12).count()

    total_pass = pass_internals + pass_practicals
    total_fail = fail_internals + fail_practicals

    performance_distribution = [
        { 'name': 'Passing', 'value': total_pass },
        { 'name': 'Failing', 'value': total_fail }
    ]

    # 3. Tutor distribution per department (Logical third chart data)
    tutor_distribution = []
    for dept in Department.objects.all():
        count = Staff.objects.filter(department=dept).count()
        tutor_distribution.append({
            'name': dept.code,
            'value': count
        })

    return Response({
        'total_departments': total_depts,
        'total_courses': total_courses,
        'total_students': Student.objects.count(), # all-time total
        'active_students': total_students,
        'total_staff': total_staff,
        'total_subjects': total_subjects,
        'course_enrollment': course_enrollment,
        'performance_distribution': performance_distribution,
        'tutor_distribution': tutor_distribution
    })




@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def marks_bulk_update(request):
    return Response({"message": "Not implemented yet"})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_semester_report(request, semester_id):
    semester = get_object_or_404(Semester, id=semester_id)
    subjects = Subject.objects.filter(semester=semester)
    students = Student.objects.filter(semester=semester).select_related('user')

    student_data = []
    for student in students:
        marks_dict = {}
        for subject in subjects:
            if subject.subject_type == 'theory':
                mark = InternalMark.objects.filter(
                    student=student, subject=subject
                ).first()
                marks_dict[subject.code] = {'final': mark.final_marks if mark else 0}
            else:
                mark = PracticalMark.objects.filter(
                    student=student, subject=subject
                ).first()
                marks_dict[subject.code] = {'final': mark.total if mark else 0}

        student_data.append({
            'student_id': student.id,
            'roll_number': student.roll_number,
            'full_name': student.user.full_name,
            'marks': marks_dict
        })

    return Response({
        'semester': {
            'id': semester.id,
            'number': semester.number,
            'course_name': semester.course.name,
            'course_code': semester.course.code,
            'academic_year': semester.academic_year or f'{semester.course.name}'
        },
        'subjects': [
            {'id': s.id, 'code': s.code, 'name': s.name, 'type': s.subject_type}
            for s in subjects
        ],
        'students': student_data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_subject_report(request, subject_id):
    subject = get_object_or_404(Subject, id=subject_id)
    students = Student.objects.filter(semester=subject.semester).select_related('user')

    student_data = []
    for student in students:
        att = Attendance.objects.filter(student=student, subject=subject).first()
        att_pct = att.percentage if att else 0

        if subject.subject_type == 'theory':
            mark = InternalMark.objects.filter(student=student, subject=subject).first()
            student_data.append({
                'student_id': student.id,
                'roll_number': student.roll_number,
                'full_name': student.user.full_name,
                'test1': mark.test1 if mark else 0,
                'test2': mark.test2 if mark else 0,
                'test3': mark.test3 if mark else 0,
                'assignment': mark.assignment if mark else 0,
                'attendance_marks': mark.attendance_marks if mark else 0,
                'final_marks': mark.final_marks if mark else 0,
                'attendance_pct': att_pct
            })
        else:
            mark = PracticalMark.objects.filter(student=student, subject=subject).first()
            student_data.append({
                'student_id': student.id,
                'roll_number': student.roll_number,
                'full_name': student.user.full_name,
                'record': mark.record if mark else 0,
                'viva': mark.viva if mark else 0,
                'internal_exam': mark.internal_exam if mark else 0,
                'total': mark.total if mark else 0,
                'attendance_pct': att_pct
            })

    return Response({
        'subject': {
            'id': subject.id,
            'code': subject.code,
            'name': subject.name,
            'type': subject.subject_type,
            'semester_number': subject.semester.number,
            'course_name': subject.semester.course.name,
        },
        'students': student_data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_student_report(request, student_id):
    student = get_object_or_404(Student, id=student_id)
    # Fetch all subjects for the student's course (current & historical)
    subjects = Subject.objects.filter(semester__course=student.course).order_by('semester__number', 'code')

    subject_data = []
    for subject in subjects:
        att = Attendance.objects.filter(student=student, subject=subject).first()
        att_data = {
            'percentage': att.percentage,
            'total_classes': att.total_classes,
            'attended_classes': att.attended_classes,
        } if att else None

        if subject.subject_type == 'theory':
            mark = InternalMark.objects.filter(student=student, subject=subject).first()
            im_data = None
            if mark:
                im_data = {
                    'test1': mark.test1,
                    'test2': mark.test2,
                    'test3': mark.test3,
                    'assignment': mark.assignment,
                    'seminar': mark.seminar,
                    'attendance_marks': mark.attendance_marks,
                    'final_marks': mark.final_marks
                }
            subject_data.append({
                'subject_id': subject.id,
                'subject_name': subject.name,
                'subject_code': subject.code,
                'subject_type': 'theory',
                'semester_number': subject.semester.number,
                'semester_id': subject.semester.id,
                'internal_marks': im_data,
                'attendance': att_data
            })
        else:
            mark = PracticalMark.objects.filter(student=student, subject=subject).first()
            pm_data = None
            if mark:
                pm_data = {
                    'record': mark.record,
                    'viva': mark.viva,
                    'internal_exam': mark.internal_exam,
                    'total': mark.total
                }
            subject_data.append({
                'subject_id': subject.id,
                'subject_name': subject.name,
                'subject_code': subject.code,
                'subject_type': 'practical',
                'semester_number': subject.semester.number,
                'semester_id': subject.semester.id,
                'practical_marks': pm_data,
                'attendance': att_data
            })

    inst_name_obj = Setting.objects.filter(key='institution_name').first()
    inst_name = inst_name_obj.value if inst_name_obj else 'Academic Institution'

    return Response({
        'student': {
            'full_name': student.user.full_name,
            'roll_number': student.roll_number,
            'course': student.course.name,
            'course_code': student.course.code,
            'semester': student.semester.number,
            'batch_year': student.batch_year,
            'email': student.user.email,
            'is_graduated': student.is_graduated
        },
        'subjects': subject_data,
        'institution_name': inst_name
    })


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def admin_profile_view(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Only administrators can access settings.'}, status=403)

    if request.method == 'GET':
        inst_name_obj = Setting.objects.filter(key='institution_name').first()
        inst_name = inst_name_obj.value if inst_name_obj else 'Academic Institution'
        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'full_name': request.user.full_name,
            'institution_name': inst_name
        })

    elif request.method == 'PUT':
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        institution_name = request.data.get('institution_name')

        user = request.user
        if username:
            if User.objects.filter(username=username).exclude(pk=user.pk).exists():
                return Response({'detail': f'Username "{username}" is already taken.'}, status=400)
            user.username = username
        if email:
            user.email = email
        if password:
            user.set_password(password)
        user.save()

        if institution_name is not None:
            setting, created = Setting.objects.get_or_create(key='institution_name')
            setting.value = institution_name.strip() or 'Academic Institution'
            setting.save()

        return Response({
            'message': 'Profile settings updated successfully!',
            'username': user.username,
            'email': user.email,
            'institution_name': Setting.objects.filter(key='institution_name').first().value if Setting.objects.filter(key='institution_name').exists() else 'Academic Institution'
        })


import requests
import random
from django.utils import timezone
from datetime import timedelta
import os

def send_otp_via_brevo(recipient_email, otp_code, username):
    api_key = os.getenv('BREVO_API_KEY')
    sender_email = os.getenv('SENDER_EMAIL')

    if not api_key or not sender_email or "your_brevo_api_key" in api_key or "your_sender_email" in sender_email:
        print(f"WARNING: Brevo credentials not configured. OTP for {username} is: {otp_code}")
        return True

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }
    
    subject_text = f"Verify your Account: Code {otp_code} for Assessment Manager"
    plain_text = (
        f"Hello {username},\n\n"
        f"We received a request to reset your password. Use the following One-Time Password (OTP) "
        f"to verify your identity: {otp_code}\n\n"
        f"This code is valid for 10 minutes. If you did not request this reset, please ignore this email.\n\n"
        f"Regards,\n"
        f"Internal Assessment Manager Portal"
    )

    payload = {
        "sender": {
            "name": "Assessment Manager System",
            "email": sender_email
        },
        "to": [
            {
                "email": recipient_email,
                "name": username
            }
        ],
        "replyTo": {
            "email": sender_email,
            "name": "Portal Support"
        },
        "headers": {
            "List-Unsubscribe": f"<mailto:{sender_email}?subject=unsubscribe>",
            "X-Mailin-Tag": "otp-verification"
        },
        "subject": subject_text,
        "textContent": plain_text,
        "htmlContent": f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 20px; background-color: #f8fafc;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 20px; font-weight: 800; color: #10B981; letter-spacing: -0.5px;">Assessment Manager</span>
                </div>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
                    <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Hello <strong>{username}</strong>,</p>
                    <p style="font-size: 14px; color: #475569;">We received a request to reset your password. Please verify your identity using the One-Time Password (OTP) below:</p>
                    
                    <div style="font-size: 28px; font-weight: 800; text-align: center; background: #f8fafc; color: #0f172a; padding: 20px; border-radius: 8px; letter-spacing: 6px; margin: 24px 0; border: 1px solid #e2e8f0;">
                        {otp_code}
                    </div>
                    
                    <p style="font-size: 12px; color: #64748b; margin-bottom: 0; line-height: 1.5;">This verification code is valid for 10 minutes and can only be used once. If you did not request a password reset, please discard this message safely.</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;">
                <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 0;">This is an automated system notification. Please do not reply directly.</p>
            </div>
        </body>
        </html>
        """
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code in [200, 201, 202]:
            return True
        else:
            print(f"Brevo API error response: {response.text}")
            return False
    except Exception as e:
        print(f"Brevo API error exception: {str(e)}")
        return False


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password_view(request):
    username = request.data.get('username', '').strip()
    if not username:
        return Response({'detail': 'Username is required.'}, status=400)

    user = User.objects.filter(username=username).first()
    if not user:
        return Response({'detail': 'User account not found.'}, status=404)

    if not user.email or '@' not in user.email:
        return Response({'detail': 'This user account does not have a registered recovery email address.'}, status=400)

    # Generate OTP
    otp_code = str(random.randint(100000, 999999))

    # Invalidate existing unused OTPs
    OTPVerification.objects.filter(user=user, is_used=False).update(is_used=True)

    # Save verification entry
    OTPVerification.objects.create(user=user, otp=otp_code)

    # Send via Brevo
    sent = send_otp_via_brevo(user.email, otp_code, user.username)
    if not sent:
        return Response({'detail': 'Failed to send OTP email. Please verify settings.'}, status=500)

    # Obfuscate email for privacy in display
    email_parts = user.email.split('@')
    masked_email = email_parts[0][0] + "xxx" + email_parts[0][-1] + "@" + email_parts[1] if len(email_parts[0]) > 2 else "xxx@" + email_parts[1]

    return Response({
        'message': f'A verification OTP has been sent to your registered email address ({masked_email}).',
        'email': masked_email
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password_otp_view(request):
    username = request.data.get('username', '').strip()
    otp_code = request.data.get('otp', '').strip()
    new_password = request.data.get('new_password', '').strip()

    if not username or not otp_code or not new_password:
        return Response({'detail': 'Username, OTP, and new password are required.'}, status=400)

    user = User.objects.filter(username=username).first()
    if not user:
        return Response({'detail': 'User account not found.'}, status=404)

    # Find the latest unexpired and unused OTP
    time_limit = timezone.now() - timedelta(minutes=10)
    otp_entry = OTPVerification.objects.filter(
        user=user, 
        otp=otp_code, 
        is_used=False,
        created_at__gte=time_limit
    ).first()

    if not otp_entry:
        return Response({'detail': 'Invalid or expired OTP verification code.'}, status=400)

    # Update password and mark OTP as used
    user.set_password(new_password)
    user.save()

    otp_entry.is_used = True
    otp_entry.save()

    return Response({'message': 'Password has been reset successfully. You can now sign in.'})


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def tutor_profile_view(request):
    if request.user.role != 'staff':
        return Response({'detail': 'Only tutors can access this view.'}, status=403)

    profile = getattr(request.user, 'staff_profile', None)
    if not profile:
        return Response({'detail': 'Tutor profile not found.'}, status=404)

    if request.method == 'GET':
        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'full_name': request.user.full_name,
            'employee_id': profile.employee_id,
            'department_name': profile.department.name if profile.department else '',
            'designation': profile.designation or '',
            'phone': profile.phone or ''
        })

    elif request.method == 'PUT':
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        phone = request.data.get('phone')
        designation = request.data.get('designation')

        user = request.user
        if username:
            if User.objects.filter(username=username).exclude(pk=user.pk).exists():
                return Response({'detail': f'Username "{username}" is already taken.'}, status=400)
            user.username = username
        if email:
            user.email = email
        if password:
            user.set_password(password)
        user.save()

        if phone is not None:
            profile.phone = phone
        if designation is not None:
            profile.designation = designation
        profile.save()

        return Response({
            'message': 'Profile settings updated successfully!',
            'username': user.username,
            'email': user.email,
            'phone': profile.phone,
            'designation': profile.designation
        })


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def student_profile_view(request):
    if request.user.role != 'student':
        return Response({'detail': 'Only students can access this view.'}, status=403)

    profile = getattr(request.user, 'student_profile', None)
    if not profile:
        return Response({'detail': 'Student profile not found.'}, status=404)

    if request.method == 'GET':
        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'full_name': request.user.full_name,
            'roll_number': profile.roll_number,
            'course_name': profile.course.name if profile.course else '',
            'semester_number': profile.semester.number if profile.semester else '',
            'phone': profile.phone or '',
            'address': profile.address or ''
        })

    elif request.method == 'PUT':
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        phone = request.data.get('phone')
        address = request.data.get('address')

        user = request.user
        if username:
            if User.objects.filter(username=username).exclude(pk=user.pk).exists():
                return Response({'detail': f'Username "{username}" is already taken.'}, status=400)
            user.username = username
        if email:
            user.email = email
        if password:
            user.set_password(password)
        user.save()

        if phone is not None:
            profile.phone = phone
        if address is not None:
            profile.address = address
        profile.save()

        return Response({
            'message': 'Profile settings updated successfully!',
            'username': user.username,
            'email': user.email,
            'phone': profile.phone,
            'address': profile.address
        })


# ─────────────────────────────────────────────────────────────────────────────
# Subject Access: returns only subjects the current staff member is assigned to.
# Admin gets all subjects (unrestricted).
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_subjects(request):
    """
    GET /api/subjects/my/
    - Admin → returns all subjects (same as /api/subjects/)
    - Staff → returns only subjects assigned to them via SubjectAssignment
    - Student → returns subjects in their semester
    """
    user = request.user
    if user.role == 'admin':
        subjects = Subject.objects.all().order_by('semester__course__name', 'name')
    elif user.role == 'staff':
        try:
            staff = Staff.objects.get(user=user)
            assigned_ids = SubjectAssignment.objects.filter(staff=staff).values_list('subject_id', flat=True)
            subjects = Subject.objects.filter(id__in=assigned_ids).order_by('semester__course__name', 'name')
        except Staff.DoesNotExist:
            subjects = Subject.objects.none()
    elif user.role == 'student':
        try:
            student = Student.objects.get(user=user)
            subjects = Subject.objects.filter(semester=student.semester).order_by('name')
        except Student.DoesNotExist:
            subjects = Subject.objects.none()
    else:
        subjects = Subject.objects.none()

    serializer = SubjectSerializer(subjects, many=True)
    return Response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
# Staff Subject Assignments — Read
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_staff_assignments(request, staff_id):
    """
    GET /api/staff/{staff_id}/assignments/
    Returns the list of subject IDs assigned to this staff member.
    """
    try:
        staff = Staff.objects.get(id=staff_id)
    except Staff.DoesNotExist:
        return Response({'detail': 'Staff not found.'}, status=404)

    assignments = SubjectAssignment.objects.filter(staff=staff).select_related('subject')
    data = []
    for a in assignments:
        data.append({
            'id': a.id,
            'subject_id': a.subject.id,
            'subject_name': a.subject.name,
            'subject_code': a.subject.code,
            'semester_id': a.subject.semester_id,
        })
    return Response(data)


# ─────────────────────────────────────────────────────────────────────────────
# Staff Subject Assignments — Write (replaces entire list atomically)
# ─────────────────────────────────────────────────────────────────────────────
@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def set_staff_assignments(request, staff_id):
    """
    PUT /api/staff/{staff_id}/assignments/
    Body: { "subject_ids": [1, 2, 3] }
    Atomically replaces all assignments for this staff member.
    Only admins may call this endpoint.
    """
    if request.user.role != 'admin':
        return Response({'detail': 'Only admins can manage subject assignments.'}, status=403)

    try:
        staff = Staff.objects.get(id=staff_id)
    except Staff.DoesNotExist:
        return Response({'detail': 'Staff not found.'}, status=404)

    subject_ids = request.data.get('subject_ids', [])
    if not isinstance(subject_ids, list):
        return Response({'detail': 'subject_ids must be a list.'}, status=400)

    if len(subject_ids) == 0:
        return Response({'detail': 'At least one subject must be assigned to the tutor.'}, status=400)

    # Validate all subject IDs exist
    valid_subjects = Subject.objects.filter(id__in=subject_ids)
    if len(valid_subjects) != len(subject_ids):
        found_ids = set(valid_subjects.values_list('id', flat=True))
        bad = [sid for sid in subject_ids if sid not in found_ids]
        return Response({'detail': f'Unknown subject IDs: {bad}'}, status=400)

    from django.db import transaction
    with transaction.atomic():
        # Delete removed assignments
        SubjectAssignment.objects.filter(staff=staff).exclude(subject_id__in=subject_ids).delete()
        # Add new assignments (skip duplicates)
        for sid in subject_ids:
            SubjectAssignment.objects.get_or_create(staff=staff, subject_id=sid)

    # Return updated list
    assignments = SubjectAssignment.objects.filter(staff=staff).select_related('subject')
    data = [{'subject_id': a.subject.id, 'subject_name': a.subject.name, 'subject_code': a.subject.code} for a in assignments]
    return Response({'assigned': data, 'count': len(data)})


# ── Mark Scheme Templates ────────────────────────────────────────────────────
import json

DEFAULT_MARK_TEMPLATES = {
    '4credit_combined': {
        'label': '4 Credit Course (3T + 1P)',
        'subject_type': 'combined',
        'credits': 4,
        'max_test_score': 100, 'max_test_marks': 12, 'test_formula': 'best2of3',
        'max_assignment': 5, 'max_seminar': 8, 'max_attendance_marks': 0,
        'max_record': 2, 'max_viva': 3, 'max_practical_exam': 5,
        'theory_cca': 25, 'practical_cca': 10,
    },
    '3credit_combined': {
        'label': '3 Credit Course (2T + 1P)',
        'subject_type': 'combined',
        'credits': 3,
        'max_test_score': 100, 'max_test_marks': 8, 'test_formula': 'best2of3',
        'max_assignment': 2, 'max_seminar': 5, 'max_attendance_marks': 0,
        'max_record': 2, 'max_viva': 3, 'max_practical_exam': 5,
        'theory_cca': 15, 'practical_cca': 10,
    },
    '4credit_theory': {
        'label': '4 Credit Course (Theory Only)',
        'subject_type': 'theory',
        'credits': 4,
        'max_test_score': 100, 'max_test_marks': 15, 'test_formula': 'best2of3',
        'max_assignment': 10, 'max_seminar': 5, 'max_attendance_marks': 0,
        'max_record': 0, 'max_viva': 0, 'max_practical_exam': 0,
        'theory_cca': 30, 'practical_cca': 0,
    },
    '3credit_theory': {
        'label': '3 Credit Course (Theory Only)',
        'subject_type': 'theory',
        'credits': 3,
        'max_test_score': 100, 'max_test_marks': 12, 'test_formula': 'best2of3',
        'max_assignment': 5, 'max_seminar': 8, 'max_attendance_marks': 0,
        'max_record': 0, 'max_viva': 0, 'max_practical_exam': 0,
        'theory_cca': 25, 'practical_cca': 0,
    },
}

SETTING_KEY = 'mark_scheme_templates'


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_mark_scheme_templates(request):
    """Return the current mark scheme templates (custom or defaults)."""
    try:
        obj = Setting.objects.get(key=SETTING_KEY)
        templates = json.loads(obj.value)
    except Setting.DoesNotExist:
        templates = DEFAULT_MARK_TEMPLATES
    return Response(templates)


@api_view(['PUT'])
@permission_classes([IsAdmin])
def set_mark_scheme_templates(request):
    """Admin-only: overwrite the mark scheme templates."""
    data = request.data
    if not isinstance(data, dict):
        return Response({'detail': 'Expected a JSON object.'}, status=400)
    obj, _ = Setting.objects.get_or_create(key=SETTING_KEY)
    obj.value = json.dumps(data)
    obj.save()
    return Response({'detail': 'Templates saved.', 'templates': data})
