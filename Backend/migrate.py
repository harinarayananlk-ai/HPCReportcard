import sqlite3
import json
import os

def migrate_from_json(json_path, db_path):
    if not os.path.exists(json_path):
        print(f"No dump found at {json_path}")
        return

    print(f"Migrating data from {json_path} to {db_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Clean existing data to avoid conflicts if re-migrating
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM students")
    cursor.execute("DELETE FROM teachers")
    cursor.execute("DELETE FROM classes")
    cursor.execute("DELETE FROM report_cards")

    # Migrate Users
    for user in data.get('users', []):
        cursor.execute("INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, ?, ?)",
                       (user['id'], user['username'], user['password'], user['role'], user['created_at']))

    # Migrate Students
    for student in data.get('students', []):
        # Handle complex objects
        fd = json.dumps(student['family_details']) if student['family_details'] else None
        pref = json.dumps(student['preferences']) if student['preferences'] else None
        assess = json.dumps(student['assessments']) if student['assessments'] else None
        
        cursor.execute("""
            INSERT INTO students (id, user_id, registration_number, full_name, class_name, section, dob, school, family_details, preferences, assessments, points, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (student['id'], student['user_id'], student['registration_number'], student['full_name'], 
              student['class_name'], student['section'], student['dob'], student['school'], 
              fd, pref, assess, student['points'], student['last_updated']))

    # Migrate Teachers & Classes (if in dump, if not they might be lost or need manual re-entry)
    # The dump I see only has users and students. I'll add logic for others if present.
    if 'teachers' in data:
        for t in data['teachers']:
            cursor.execute("INSERT INTO teachers (id, user_id, full_name, account_id, contact) VALUES (?, ?, ?, ?, ?)",
                           (t['id'], t['user_id'], t['full_name'], t['account_id'], t.get('contact')))
    
    if 'classes' in data:
        for c in data['classes']:
            cursor.execute("INSERT INTO classes (id, grade, section, teacher_id) VALUES (?, ?, ?, ?)",
                           (c['id'], c['grade'], c['section'], c['teacher_id']))

    if 'report_cards' in data:
        for r in data['report_cards']:
            cursor.execute("INSERT INTO report_cards (id, student_id, year, term, data, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                           (r['id'], r['student_id'], r['year'], r.get('term'), r.get('data'), r['created_at']))

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    BASE_DIR = os.path.dirname(__file__)
    migrate_from_json(os.path.join(BASE_DIR, 'database_dump.json'), os.path.join(BASE_DIR, 'database.sqlite'))
