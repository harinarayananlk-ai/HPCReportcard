"""
Schema V2 — Normalized data architecture for HPC Report Card
Tables: users, schools, superadmins, teachers, students, classes, student_enrollments, archived_reports, report_cards
"""
import sqlite3

def create_schema(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # ── USERS ─────────────────────────────────────────────
    c.execute("""CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        plain_password TEXT,
        role TEXT CHECK(role IN ('superadmin','teacher','student')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    # ── SCHOOLS ───────────────────────────────────────────
    c.execute("""CREATE TABLE IF NOT EXISTS schools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address_line1 TEXT,
        address_line2 TEXT,
        pincode TEXT,
        udise_code TEXT,
        board TEXT DEFAULT 'CBSE',
        principal_name TEXT,
        contact_phone TEXT,
        contact_email TEXT
    )""")

    # ── SUPERADMINS ───────────────────────────────────────
    c.execute("""CREATE TABLE IF NOT EXISTS superadmins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        school_id INTEGER NOT NULL,
        full_name TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (school_id) REFERENCES schools(id)
    )""")

    # ── TEACHERS ──────────────────────────────────────────
    c.execute("""CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        school_id INTEGER,
        full_name TEXT,
        teacher_code TEXT,
        account_id TEXT,
        qualification TEXT,
        contact TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (school_id) REFERENCES schools(id)
    )""")

    # ── CLASSES ───────────────────────────────────────────
    c.execute("""CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER,
        grade TEXT NOT NULL,
        section TEXT DEFAULT 'A',
        teacher_id INTEGER,
        academic_year TEXT DEFAULT '2025-26',
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    )""")

    # ── STUDENTS ──────────────────────────────────────────
    # Explicit columns for common fields; JSON blobs for extensible data
    c.execute("""CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        full_name TEXT,
        dob TEXT,
        gender TEXT,
        blood_group TEXT,
        aadhaar_masked TEXT,
        height TEXT,
        weight TEXT,
        address TEXT,
        phone TEXT,
        mother_tongue TEXT,
        medium_of_instruction TEXT,
        rural_urban TEXT,
        family_details TEXT,
        preferences TEXT,
        assessments TEXT,
        a2_data TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )""")

    # ── STUDENT ENROLLMENTS ───────────────────────────────
    # Links a student to a class for a given academic year
    c.execute("""CREATE TABLE IF NOT EXISTS student_enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        class_id INTEGER NOT NULL,
        academic_year TEXT DEFAULT '2025-26',
        registration_number TEXT,
        roll_number TEXT,
        points INTEGER DEFAULT 0,
        school TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classes(id)
    )""")

    c.execute("CREATE INDEX IF NOT EXISTS idx_enrollment_student ON student_enrollments(student_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_enrollment_class ON student_enrollments(class_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_enrollment_year ON student_enrollments(academic_year)")

    # ── ARCHIVED REPORTS ──────────────────────────────────
    # Finalized year-end snapshots (read-only for students)
    c.execute("""CREATE TABLE IF NOT EXISTS archived_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        academic_year TEXT,
        grade TEXT,
        section TEXT,
        school_name TEXT,
        teacher_name TEXT,
        archived_data TEXT,
        pdf_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )""")

    # ── REPORT CARDS (active, in-progress) ────────────────
    c.execute("""CREATE TABLE IF NOT EXISTS report_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        year INTEGER,
        data TEXT,
        pdf_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )""")

    conn.commit()
    conn.close()
    print("[schema_v2] All tables created successfully.")

if __name__ == "__main__":
    import os
    db = os.path.join(os.path.dirname(__file__), "database.sqlite")
    create_schema(db)
