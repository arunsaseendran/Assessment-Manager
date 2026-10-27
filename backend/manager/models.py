from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('student', 'Student'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    full_name = models.CharField(max_length=255)

class Department(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Course(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    duration_years = models.IntegerField(default=3)
    num_semesters = models.IntegerField(default=6)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Semester(models.Model):
    number = models.IntegerField()
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='semesters')
    academic_year = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Subject(models.Model):
    TYPE_CHOICES = (
        ('theory',    'Theory'),
        ('practical', 'Practical'),
        ('combined',  'Combined (Theory + Practical)'),
    )
    CREDIT_TYPE_CHOICES = (
        ('4credit_combined', '4 Credit Course (3 Credit Theory + 1 Credit Practical)'),
        ('3credit_combined', '3 Credit Course (2 Credit Theory + 1 Credit Practical)'),
        ('4credit_theory',   '4 Credit Course (Theory Only)'),
        ('3credit_theory',   '3 Credit Course (Theory Only)'),
        ('custom',           'Custom'),
    )
    FORMULA_CHOICES = (
        ('best2of3', 'Average of Best 2 of 3 Tests'),
        ('average',  'Average of All 3 Tests'),
        ('best1of3', 'Best Single Test Score (highest of 3)'),
        ('all3',     'Sum of All 3 Tests'),
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='subjects')
    subject_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='theory')
    credit_type  = models.CharField(max_length=30, choices=CREDIT_TYPE_CHOICES, default='custom')
    credits = models.IntegerField(default=3)
    max_internal_marks = models.IntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)

    # ── Theory Marks Scheme ──────────────────────────────────────────────────
    # Each test is entered out of `max_test_score` (e.g. 100)
    max_test_score     = models.FloatField(default=100.0)
    # The combined test component contributes `max_test_marks` to the final total
    max_test_marks     = models.FloatField(default=20.0)
    test_formula       = models.CharField(max_length=20, choices=FORMULA_CHOICES, default='best2of3')
    max_assignment     = models.FloatField(default=5.0)
    max_seminar        = models.FloatField(default=0.0)
    max_attendance_marks = models.FloatField(default=5.0)
    # total = max_test_marks + max_assignment + max_seminar + max_attendance_marks

    # ── Practical Marks Scheme ───────────────────────────────────────────────
    max_record         = models.FloatField(default=10.0)
    max_viva           = models.FloatField(default=10.0)
    max_practical_exam = models.FloatField(default=10.0)
    # practical total = max_record + max_viva + max_practical_exam

    # ── ESE (End-Semester Exam) — informational only, not tracked internally ─
    max_ese_theory     = models.FloatField(default=0.0)
    max_ese_practical  = models.FloatField(default=0.0)


class Staff(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='staff')
    employee_id = models.CharField(max_length=50, unique=True)
    designation = models.CharField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    roll_number = models.CharField(max_length=50)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='students')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='students')
    batch_year = models.IntegerField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    is_graduated = models.BooleanField(default=False)
    graduated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('semester', 'roll_number')



class SubjectAssignment(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='subject_assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    academic_year = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class InternalMark(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='internal_marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='internal_marks')
    test1 = models.FloatField(default=0.0)
    test2 = models.FloatField(default=0.0)
    test3 = models.FloatField(default=0.0)
    assignment = models.FloatField(default=0.0)
    seminar = models.FloatField(default=0.0)
    attendance_marks = models.FloatField(default=0.0)
    calculated_marks = models.FloatField(default=0.0)
    final_marks = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)

class PracticalMark(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='practical_marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='practical_marks')
    record = models.FloatField(default=0.0)
    viva = models.FloatField(default=0.0)
    internal_exam = models.FloatField(default=0.0)
    total = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)

class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='attendance_records')
    total_classes = models.IntegerField(default=0)
    attended_classes = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)

class Setting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()

    def __str__(self):
        return f"{self.key}: {self.value}"

class OTPVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"OTP for {self.user.username} (Used: {self.is_used})"
