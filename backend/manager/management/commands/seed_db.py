from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from manager.models import (
    User, Department, Course, Semester, Subject, Staff, Student, 
    SubjectAssignment, InternalMark, PracticalMark, Attendance
)
import random

class Command(BaseCommand):
    help = 'Seed database with initial data'

    def handle(self, *args, **kwargs):
        self.stdout.write('[*] Seeding database...')

        if User.objects.filter(username="admin").exists():
            self.stdout.write('[!] Database already seeded!')
            return

        admin = User.objects.create(
            username="admin",
            email="admin@college.edu",
            full_name="System Administrator",
            password=make_password("admin123"),
            role='admin'
        )

        dept = Department.objects.create(name="Computer Science", code="CS", description="Department of Computer Science")
        dept2 = Department.objects.create(name="Electronics & Communication", code="EC", description="Department of Electronics")

        course = Course.objects.create(name="Bachelor of Computer Applications", code="BCA", department=dept, duration_years=3)
        course2 = Course.objects.create(name="Bachelor of Science CS", code="BSC-CS", department=dept, duration_years=3)

        sem1 = Semester.objects.create(number=1, course=course, academic_year="2024-25")
        sem2 = Semester.objects.create(number=2, course=course, academic_year="2024-25")

        subj1 = Subject.objects.create(name="Programming in C", code="CS101", semester=sem1, subject_type='theory', credits=4)
        subj2 = Subject.objects.create(name="Mathematics I", code="MA101", semester=sem1, subject_type='theory', credits=4)
        subj3 = Subject.objects.create(name="C Lab", code="CS101P", semester=sem1, subject_type='practical', credits=2)
        subj4 = Subject.objects.create(name="Data Structures", code="CS201", semester=sem2, subject_type='theory', credits=4)
        subj5 = Subject.objects.create(name="DBMS", code="CS202", semester=sem2, subject_type='theory', credits=3)

        staff_user = User.objects.create(
            username="staff1", email="staff1@college.edu", full_name="Dr. Rajesh Kumar",
            password=make_password("staff123"), role='staff'
        )
        staff1 = Staff.objects.create(
            user=staff_user, department=dept, employee_id="EMP001", designation="Associate Professor", phone="9876543210"
        )

        staff_user2 = User.objects.create(
            username="staff2", email="staff2@college.edu", full_name="Ms. Priya Sharma",
            password=make_password("staff123"), role='staff'
        )
        staff2 = Staff.objects.create(
            user=staff_user2, department=dept, employee_id="EMP002", designation="Assistant Professor", phone="9876543211"
        )

        SubjectAssignment.objects.create(staff=staff1, subject=subj1, academic_year="2024-25")
        SubjectAssignment.objects.create(staff=staff1, subject=subj3, academic_year="2024-25")
        SubjectAssignment.objects.create(staff=staff2, subject=subj2, academic_year="2024-25")

        students_data = [
            ("student1", "stu1@college.edu", "Arjun Nair", "BCA001", sem1),
            ("student2", "stu2@college.edu", "Divya Menon", "BCA002", sem1),
            ("student3", "stu3@college.edu", "Kiran Raj", "BCA003", sem1),
            ("student4", "stu4@college.edu", "Sneha Pillai", "BCA004", sem1),
            ("student5", "stu5@college.edu", "Rahul Varma", "BCA005", sem1),
        ]

        student_objs = []
        for uname, email, fname, roll, sem in students_data:
            u = User.objects.create(username=uname, email=email, full_name=fname,
                                    password=make_password("student123"), role='student')
            s = Student.objects.create(user=u, roll_number=roll, course=course, semester=sem, batch_year=2024)
            student_objs.append(s)

        random.seed(42)
        for student in student_objs:
            for subject in [subj1, subj2]:
                total = random.randint(60, 90)
                attended = random.randint(int(total*0.7), total)
                pct = round(attended / total * 100, 2)
                Attendance.objects.create(student=student, subject=subject, total_classes=total, attended_classes=attended, percentage=pct)

                att_marks = 5.0 if pct >= 90 else (3.0 if pct >= 75 else (1.0 if pct >= 65 else 0.0))
                t1, t2, t3 = random.uniform(40, 90), random.uniform(40, 90), random.uniform(40, 90)
                assgn = random.uniform(2, 5)
                tests = sorted([t1, t2, t3], reverse=True)
                scaled = round((tests[0] + tests[1]) / 2 / 100 * 20, 2)
                final = round(min(scaled + assgn + att_marks, 30), 2)

                InternalMark.objects.create(
                    student=student, subject=subject, test1=round(t1,2), test2=round(t2,2), test3=round(t3,2),
                    assignment=round(assgn,2), attendance_marks=att_marks, calculated_marks=scaled, final_marks=final
                )

            for subject in [subj3]:
                rec = random.uniform(5, 10)
                viva = random.uniform(5, 10)
                intern = random.uniform(5, 10)
                total_pm = round(rec + viva + intern, 2)
                PracticalMark.objects.create(
                    student=student, subject=subject, record=round(rec,2), viva=round(viva,2),
                    internal_exam=round(intern,2), total=total_pm
                )

        self.stdout.write('[OK] Seeding complete!')
