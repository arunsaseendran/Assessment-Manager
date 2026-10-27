from rest_framework import serializers
from .models import (
    User, Department, Course, Semester, Subject,
    Staff, Student, SubjectAssignment,
    InternalMark, PracticalMark, Attendance
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'is_active']


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    department_id = serializers.PrimaryKeyRelatedField(
        source='department', queryset=Department.objects.all()
    )

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'department_id',
            'duration_years', 'num_semesters', 'description', 'created_at'
        ]


class SemesterSerializer(serializers.ModelSerializer):
    course_id = serializers.PrimaryKeyRelatedField(
        source='course', queryset=Course.objects.all()
    )

    class Meta:
        model = Semester
        fields = ['id', 'number', 'course_id', 'academic_year', 'created_at']


class SubjectSerializer(serializers.ModelSerializer):
    semester_id = serializers.PrimaryKeyRelatedField(
        source='semester', queryset=Semester.objects.all()
    )

    class Meta:
        model = Subject
        fields = [
            'id', 'name', 'code', 'semester_id',
            'subject_type', 'credit_type', 'credits', 'max_internal_marks', 'created_at',
            # Marks scheme — theory
            'max_test_score', 'max_test_marks', 'test_formula',
            'max_assignment', 'max_seminar', 'max_attendance_marks',
            # Marks scheme — practical
            'max_record', 'max_viva', 'max_practical_exam',
            # ESE informational
            'max_ese_theory', 'max_ese_practical',
        ]

    def validate(self, attrs):
        semester = attrs.get('semester')
        name = attrs.get('name')
        code = attrs.get('code')

        course = semester.course if semester else None
        if course:
            if name:
                qs_name = Subject.objects.filter(semester__course=course, name__iexact=name)
                if self.instance:
                    qs_name = qs_name.exclude(pk=self.instance.pk)
                if qs_name.exists():
                    raise serializers.ValidationError({
                        'name': f"Subject with name '{name}' already exists in course '{course.name}'."
                    })
            if code:
                qs_code = Subject.objects.filter(semester__course=course, code__iexact=code)
                if self.instance:
                    qs_code = qs_code.exclude(pk=self.instance.pk)
                if qs_code.exists():
                    raise serializers.ValidationError({
                        'code': f"Subject with code '{code}' already exists in course '{course.name}'."
                    })
        return attrs




class StaffSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        source='department',
        queryset=Department.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Staff
        fields = ['id', 'user', 'department_id', 'employee_id', 'designation', 'phone', 'created_at']


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        source='course', queryset=Course.objects.all()
    )
    semester_id = serializers.PrimaryKeyRelatedField(
        source='semester', queryset=Semester.objects.all()
    )

    class Meta:
        model = Student
        fields = [
            'id', 'user', 'roll_number', 'course_id', 'semester_id',
            'batch_year', 'phone', 'address', 'created_at'
        ]

    def validate(self, attrs):
        semester = attrs.get('semester')
        roll_number = attrs.get('roll_number')

        if semester and roll_number:
            qs = Student.objects.filter(semester=semester, roll_number=roll_number)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'roll_number': f"A student with roll number '{roll_number}' already exists in Semester {semester.number}."
                })
        return attrs



class SubjectAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectAssignment
        fields = '__all__'


class InternalMarkSerializer(serializers.ModelSerializer):
    student_id = serializers.PrimaryKeyRelatedField(
        source='student', queryset=Student.objects.all()
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        source='subject', queryset=Subject.objects.all()
    )

    class Meta:
        model = InternalMark
        fields = [
            'id', 'student_id', 'subject_id',
            'test1', 'test2', 'test3',
            'assignment', 'seminar',
            'attendance_marks', 'calculated_marks', 'final_marks',
            'updated_at'
        ]


class PracticalMarkSerializer(serializers.ModelSerializer):
    student_id = serializers.PrimaryKeyRelatedField(
        source='student', queryset=Student.objects.all()
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        source='subject', queryset=Subject.objects.all()
    )

    class Meta:
        model = PracticalMark
        fields = [
            'id', 'student_id', 'subject_id',
            'record', 'viva', 'internal_exam', 'total',
            'updated_at'
        ]


class AttendanceSerializer(serializers.ModelSerializer):
    student_id = serializers.PrimaryKeyRelatedField(
        source='student', queryset=Student.objects.all()
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        source='subject', queryset=Subject.objects.all()
    )

    class Meta:
        model = Attendance
        fields = [
            'id', 'student_id', 'subject_id',
            'total_classes', 'attended_classes', 'percentage',
            'updated_at'
        ]
