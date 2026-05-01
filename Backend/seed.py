import sqlite3
import os
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_db(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if empty
    cursor.execute("SELECT count(*) FROM users")
    if cursor.fetchone()[0] > 0:
        print("Database already seeded.")
        conn.close()
        return

    print("Seeding database...")
    default_pw = pwd_context.hash("pass123"[:72])
    admin_pw = pwd_context.hash("admin123"[:72])

    # Seed Superadmin
    cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, 'superadmin')", ("superadmin", admin_pw))

    # Seed Teachers
    teachers = [
        ('t_murugan', 'Master Murugan', 'TCH-001', 'Bal Vatika 1', 'A'),
        ('t_chutney', 'Ms. Chutney', 'TCH-002', 'Bal Vatika 2', 'B'),
    ]
    for username, name, acc, grade, section in teachers:
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, 'teacher')", (username, default_pw))
        user_id = cursor.lastrowid
        cursor.execute("INSERT INTO teachers (user_id, full_name, account_id) VALUES (?, ?, ?)", (user_id, name, acc))
        teacher_id = cursor.lastrowid
        cursor.execute("INSERT INTO classes (grade, section, teacher_id) VALUES (?, ?, ?)", (grade, section, teacher_id))

    # Seed Students
    students = [
        ('s_ladoo', 'Ladoo Lal', 'REG-101', 'Bal Vatika 1', 'A'),
        ('s_paplu', 'Paplu Poddar', 'REG-102', 'Bal Vatika 1', 'A'),
    ]
    for username, name, reg, grade, section in students:
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, 'student')", (username, default_pw))
        user_id = cursor.lastrowid
        cursor.execute("INSERT INTO students (user_id, registration_number, full_name, class_name, section, points) VALUES (?, ?, ?, ?, ?, ?)", 
                       (user_id, reg, name, grade, section, 200))

    conn.commit()
    conn.close()
    print("Seeding complete.")

if __name__ == "__main__":
    DB_PATH = os.path.join(os.path.dirname(__file__), "database.sqlite")
    seed_db(DB_PATH)
