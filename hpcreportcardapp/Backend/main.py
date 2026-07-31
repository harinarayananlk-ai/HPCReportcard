import sqlite3, json, os, asyncio, mimetypes, datetime, time, subprocess, tempfile
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Any
import bcrypt

mimetypes.add_type('application/pdf', '.pdf')

DB_PATH = os.path.join(os.path.dirname(__file__), "database.sqlite")

@asynccontextmanager
async def lifespan(app: FastAPI):
    from seed import seed_db
    seed_db(DB_PATH)
    print("Database ready.")
    yield

app = FastAPI(title="MyApp Python Backend", lifespan=lifespan)

# Security handled by native bcrypt

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static routes
os.makedirs(os.path.join(os.path.dirname(__file__), "exports"), exist_ok=True)
app.mount("/exports", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "exports")), name="exports")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try: yield conn
    finally: conn.close()

def verify_password(plain_password, hashed_password):
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def _get_school_info(cursor, school_id):
    cursor.execute("SELECT * FROM schools WHERE id = ?", (school_id,))
    row = cursor.fetchone()
    return dict(row) if row else None

def _get_enrollment_info(cursor, student_id):
    """Get current enrollment with class + teacher + school info."""
    cursor.execute("""
        SELECT se.registration_number, se.roll_number, se.points, se.school,
               c.grade as class_name, c.section, c.academic_year,
               t.full_name as teacher_name, t.teacher_code, t.account_id as teacher_account_id,
               s.id as school_id, s.name as school_name, s.address_line1 as school_address1,
               s.address_line2 as school_address2, s.pincode as school_pincode,
               s.udise_code, s.board, s.principal_name
        FROM student_enrollments se
        JOIN classes c ON se.class_id = c.id
        LEFT JOIN teachers t ON c.teacher_id = t.id
        LEFT JOIN schools s ON c.school_id = s.id
        WHERE se.student_id = ?
        ORDER BY se.academic_year DESC LIMIT 1
    """, (student_id,))
    row = cursor.fetchone()
    return dict(row) if row else {}

# ─── LOGIN ────────────────────────────────────────────────
@app.post("/api/login")
async def login(req: dict, db: sqlite3.Connection = Depends(get_db)):
    username = req.get("username","")
    password = req.get("password","")
    role = req.get("role","")

    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    result = {
        "status": "success",
        "user": {"id": user["id"], "username": user["username"], "role": user["role"]},
        "profile": None,
        "schoolInfo": None,
        "teacherInfo": None,
    }

    if user["role"] == "student":
        cursor.execute("SELECT * FROM students WHERE user_id = ?", (user["id"],))
        stu = cursor.fetchone()
        if stu:
            p = dict(stu)
            for f in ["family_details","preferences","assessments","a2_data"]:
                if p.get(f) and isinstance(p[f], str):
                    try: p[f] = json.loads(p[f])
                    except: p[f] = {}
            enroll = _get_enrollment_info(cursor, stu["id"])
            p.update(enroll)
            result["profile"] = p
            if enroll.get("school_id"):
                result["schoolInfo"] = _get_school_info(cursor, enroll["school_id"])

    elif user["role"] == "teacher":
        cursor.execute("SELECT * FROM teachers WHERE user_id = ?", (user["id"],))
        teacher = cursor.fetchone()
        if teacher:
            t = dict(teacher)
            result["teacherInfo"] = t
            result["user"]["full_name"] = t.get("full_name")
            if t.get("school_id"):
                result["schoolInfo"] = _get_school_info(cursor, t["school_id"])

    elif user["role"] == "superadmin":
        cursor.execute("SELECT * FROM superadmins WHERE user_id = ?", (user["id"],))
        sa = cursor.fetchone()
        if sa:
            result["user"]["full_name"] = sa["full_name"]
            result["schoolInfo"] = _get_school_info(cursor, sa["school_id"])

    return result

# ─── STUDENT PROFILE ──────────────────────────────────────
@app.get("/api/students/profile/{user_id}")
async def get_profile(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM students WHERE user_id = ?", (user_id,))
    stu = cursor.fetchone()
    if not stu:
        return {}
    p = dict(stu)
    for f in ["family_details","preferences","assessments","a2_data"]:
        if p.get(f) and isinstance(p[f], str):
            try: p[f] = json.loads(p[f])
            except: p[f] = {}
    enroll = _get_enrollment_info(cursor, stu["id"])
    p.update(enroll)
    return p

@app.post("/api/students/profile")
async def update_profile(req: dict, db: sqlite3.Connection = Depends(get_db)):
    user_id = req.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="userId is required")

    cursor = db.cursor()
    cursor.execute("SELECT * FROM students WHERE user_id = ?", (user_id,))
    existing = cursor.fetchone()

    def safe(new_val, old_val):
        """Empty never overwrites filled."""
        if new_val is None or (isinstance(new_val, str) and new_val.strip() == ""):
            return old_val
        return new_val

    def merge_json(field_name, new_data):
        old = {}
        if existing and existing[field_name]:
            try: old = json.loads(existing[field_name])
            except: old = {}
        if new_data and isinstance(new_data, dict):
            for k, v in new_data.items():
                if v is not None:
                    if isinstance(old.get(k), dict) and isinstance(v, dict):
                        old[k].update(v)
                    elif not isinstance(v, str) or v.strip() != "":
                        old[k] = v
        return json.dumps(old)

    fd_str = merge_json("family_details", req.get("familyDetails"))
    pref_str = merge_json("preferences", req.get("preferences"))
    assess_str = merge_json("assessments", req.get("assessments"))
    a2_str = merge_json("a2_data", req.get("a2Data"))

    e = dict(existing) if existing else {}
    full_name = safe(req.get("fullName"), e.get("full_name"))
    dob = safe(req.get("dob"), e.get("dob"))
    gender = safe(req.get("gender"), e.get("gender"))
    blood_group = safe(req.get("bloodGroup"), e.get("blood_group"))
    height = safe(req.get("height"), e.get("height"))
    weight = safe(req.get("weight"), e.get("weight"))
    address = safe(req.get("address"), e.get("address"))
    phone = safe(req.get("phone"), e.get("phone"))
    mother_tongue = safe(req.get("motherTongue"), e.get("mother_tongue"))
    medium = safe(req.get("medium"), e.get("medium_of_instruction"))
    rural_urban = safe(req.get("ruralUrban"), e.get("rural_urban"))

    if existing:
        cursor.execute("""UPDATE students SET
            full_name=?, dob=?, gender=?, blood_group=?, height=?, weight=?,
            address=?, phone=?, mother_tongue=?, medium_of_instruction=?, rural_urban=?,
            family_details=?, preferences=?, assessments=?, a2_data=?,
            last_updated=CURRENT_TIMESTAMP
            WHERE user_id=?""",
            (full_name, dob, gender, blood_group, height, weight,
             address, phone, mother_tongue, medium, rural_urban,
             fd_str, pref_str, assess_str, a2_str, user_id))
    else:
        cursor.execute("""INSERT INTO students
            (user_id,full_name,dob,gender,blood_group,height,weight,
             address,phone,mother_tongue,medium_of_instruction,rural_urban,
             family_details,preferences,assessments,a2_data)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (user_id, full_name, dob, gender, blood_group, height, weight,
             address, phone, mother_tongue, medium, rural_urban,
             fd_str, pref_str, assess_str, a2_str))

    # Update enrollment fields if provided
    if req.get("registrationNumber") or req.get("className") or req.get("section") or req.get("school"):
        cursor.execute("SELECT id FROM students WHERE user_id = ?", (user_id,))
        stu = cursor.fetchone()
        if stu:
            cursor.execute("""SELECT se.id, se.class_id FROM student_enrollments se
                WHERE se.student_id = ? ORDER BY se.academic_year DESC LIMIT 1""", (stu["id"],))
            enroll = cursor.fetchone()
            if enroll:
                updates = []
                params = []
                if req.get("registrationNumber"):
                    updates.append("registration_number=?")
                    params.append(req["registrationNumber"])
                if req.get("school"):
                    updates.append("school=?")
                    params.append(req["school"])
                if req.get("points"):
                    updates.append("points=points+?")
                    params.append(int(req["points"]))
                if updates:
                    params.append(enroll["id"])
                    cursor.execute(f"UPDATE student_enrollments SET {','.join(updates)} WHERE id=?", params)

    db.commit()
    return {"status": "success", "message": "Profile updated safely"}

# ─── AUTOSAVE (lightweight) ──────────────────────────────
@app.post("/api/students/autosave")
async def autosave(req: dict, db: sqlite3.Connection = Depends(get_db)):
    """Same as profile update but designed for auto-save on page exit."""
    return await update_profile(req, db)

# ─── SCHOOL INFO ──────────────────────────────────────────
@app.get("/api/school/{school_id}")
async def get_school(school_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    info = _get_school_info(cursor, school_id)
    if not info:
        raise HTTPException(status_code=404, detail="School not found")
    return info

# ─── TEACHER PROFILE ──────────────────────────────────────
@app.get("/api/teacher/profile/{user_id}")
async def get_teacher_profile(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""SELECT t.*, s.name as school_name, s.udise_code, s.address_line1, s.pincode
        FROM teachers t LEFT JOIN schools s ON t.school_id = s.id
        WHERE t.user_id = ?""", (user_id,))
    row = cursor.fetchone()
    if not row:
        return {}
    return dict(row)

# ─── TEACHER'S STUDENTS (filtered to their class only) ───
@app.get("/api/teacher/students/{user_id}")
async def get_teacher_students(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM teachers WHERE user_id = ?", (user_id,))
    teacher = cursor.fetchone()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    cursor.execute("""
        SELECT u.id as user_id, u.username, u.plain_password,
               st.id as student_id, st.full_name, st.dob, st.gender,
               se.registration_number, se.roll_number, se.points,
               c.grade as class_name, c.section,
               t.full_name as teacher_name, t.teacher_code
        FROM classes c
        JOIN student_enrollments se ON se.class_id = c.id
        JOIN students st ON se.student_id = st.id
        JOIN users u ON st.user_id = u.id
        LEFT JOIN teachers t ON c.teacher_id = t.id
        WHERE c.teacher_id = ?
        ORDER BY c.grade, c.section, st.full_name
    """, (teacher["id"],))
    return [dict(r) for r in cursor.fetchall()]

# ─── ADMIN: ALL STUDENTS ─────────────────────────────────
@app.get("/api/admin/students")
async def get_all_students(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT u.id as user_id, u.username, u.plain_password,
               st.id as student_id, st.full_name,
               se.registration_number, se.points,
               c.grade as class_name, c.section,
               t.full_name as teacher_name, t.account_id as teacher_account_id
        FROM users u
        JOIN students st ON u.id = st.user_id
        LEFT JOIN student_enrollments se ON se.student_id = st.id
        LEFT JOIN classes c ON se.class_id = c.id
        LEFT JOIN teachers t ON c.teacher_id = t.id
        WHERE u.role = 'student'
        ORDER BY c.grade, c.section, st.full_name
    """)
    return [dict(r) for r in cursor.fetchall()]

# ─── ADMIN: ALL TEACHERS ─────────────────────────────────
@app.get("/api/admin/teachers")
async def get_all_teachers(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT t.*, u.username, c.grade, c.section
        FROM teachers t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN classes c ON c.teacher_id = t.id
        ORDER BY c.grade, c.section
    """)
    return [dict(r) for r in cursor.fetchall()]

# ─── ADMIN: CREATE STUDENT ───────────────────────────────
@app.post("/api/admin/create-student")
async def create_student(data: dict, db: sqlite3.Connection = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")
    reg_number = data.get("registrationNumber")
    class_name = data.get("className")
    section = data.get("section", "A")
    school = data.get("school")

    if not all([username, password, reg_number, class_name]):
        raise HTTPException(status_code=400, detail="Missing required fields")

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    try:
        cursor = db.cursor()
        cursor.execute("INSERT INTO users (username,password,plain_password,role) VALUES (?,?,?,?)",
                      (username, hashed, password, "student"))
        u_id = cursor.lastrowid
        cursor.execute("INSERT INTO students (user_id,full_name) VALUES (?,?)", (u_id, username))
        s_id = cursor.lastrowid

        # Find matching class
        cursor.execute("SELECT id FROM classes WHERE grade=? AND section=? LIMIT 1", (class_name, section))
        cls = cursor.fetchone()
        cl_id = cls["id"] if cls else None

        if cl_id:
            cursor.execute("""INSERT INTO student_enrollments
                (student_id,class_id,academic_year,registration_number,school)
                VALUES (?,?,?,?,?)""", (s_id, cl_id, "2025-26", reg_number, school))

        db.commit()
        return {"message": "Student created", "userId": u_id, "username": username, "password": password}
    except sqlite3.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username already exists")

# ─── ADMIN: SHUFFLE STUDENT ──────────────────────────────
@app.post("/api/admin/shuffle-student")
async def shuffle_student(data: dict, db: sqlite3.Connection = Depends(get_db)):
    student_id = data.get("studentId")
    new_class = data.get("newClassName")
    new_section = data.get("newSection", "A")
    if not student_id or not new_class:
        raise HTTPException(status_code=400, detail="Missing fields")

    cursor = db.cursor()
    cursor.execute("SELECT id FROM classes WHERE grade=? AND section=? LIMIT 1", (new_class, new_section))
    cls = cursor.fetchone()
    if cls:
        cursor.execute("UPDATE student_enrollments SET class_id=? WHERE student_id=?", (cls["id"], student_id))
    db.commit()
    return {"message": f"Student moved to {new_class} {new_section}"}

# ─── REPORTS ──────────────────────────────────────────────
@app.get("/api/students/reports/{user_id}")
async def get_reports(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""SELECT r.* FROM report_cards r
        JOIN students s ON r.student_id = s.id
        WHERE s.user_id = ? ORDER BY r.year DESC""", (user_id,))
    return [dict(row) for row in cursor.fetchall()]

@app.get("/api/student/archived-reports/{user_id}")
async def get_archived(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""SELECT ar.* FROM archived_reports ar
        JOIN students s ON ar.student_id = s.id
        WHERE s.user_id = ? ORDER BY ar.academic_year DESC""", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    for r in rows:
        if r.get("archived_data") and isinstance(r["archived_data"], str):
            try: r["archived_data"] = json.loads(r["archived_data"])
            except: pass
    return rows

# ─── PDF EXPORT ───────────────────────────────────────────
@app.get("/api/render/part_b/{user_id}")
async def render_part_b(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM students WHERE user_id = ?", (user_id,))
    student = cursor.fetchone()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    sd = dict(student)
    enroll = _get_enrollment_info(cursor, student["id"])
    sd.update(enroll)

    try:
        family = json.loads(sd.get("family_details") or "{}")
    except Exception:
        family = {}

    try:
        a2 = json.loads(sd.get("a2_data") or "{}")
        if not a2:
            a2 = family.get("a2_middle") or family.get("a2_preparatory") or family.get("a2_foundational") or {}
    except Exception:
        a2 = {}

    try:
        preferences = json.loads(sd.get("preferences") or "{}")
    except Exception:
        preferences = {}

    try:
        assessments = json.loads(sd.get("assessments") or "{}")
    except Exception:
        assessments = {}

    node_data = {
        "school": {
            "name": sd.get("school_name") or "NA",
            "address1": sd.get("school_address1") or "NA",
            "address2": sd.get("school_address2") or "NA",
            "pincode": sd.get("school_pincode") or "NA",
            "udiseCode": sd.get("udise_code") or "NA",
            "principal": sd.get("principal_name") or "NA",
            "board": sd.get("board") or "NA"
        },
        "profile": {
            "name": sd.get("full_name") or "NA",
            "dob": sd.get("dob") or "NA",
            "roll": enroll.get("roll_number") or "NA",
            "reg": enroll.get("registration_number") or sd.get("registration_number") or "NA",
            "class": enroll.get("class_name") or sd.get("class_name") or "NA",
            "sec": enroll.get("section") or sd.get("section") or "NA",
            "teacherName": enroll.get("teacher_name") or "NA",
            "teacherCode": enroll.get("teacher_code") or "NA",
            "gender": sd.get("gender") or "NA",
            "bloodGroup": sd.get("blood_group") or "NA",
            "height": sd.get("height") or "NA",
            "weight": sd.get("weight") or "NA",
            "address": sd.get("address") or "NA",
            "phone": sd.get("phone") or "NA",
            "motherTongue": sd.get("mother_tongue") or "NA",
            "mediumOfInstruction": sd.get("medium_of_instruction") or "NA",
            "ruralUrban": sd.get("rural_urban") or "NA"
        },
        "family": family,
        "a2": a2,
        "preferences": preferences,
        "assessments": assessments
    }

    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tf:
        json.dump(node_data, tf)
        temp_json_path = tf.name

    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as tf_html:
        temp_html_path = tf_html.name

    script_path = os.path.join(os.path.dirname(__file__), "..", "generate_unified_pdf.js")
    process = subprocess.run(["node", script_path, temp_json_path, temp_html_path, "--html"], capture_output=True, text=True)
    
    os.unlink(temp_json_path)

    if process.returncode != 0:
        if os.path.exists(temp_html_path):
            os.unlink(temp_html_path)
        raise HTTPException(status_code=500, detail=f"HTML render failed: {process.stderr}")

    with open(temp_html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    os.unlink(temp_html_path)

    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html_content)

@app.post("/api/export/pdf")
async def export_pdf(data: dict, db: sqlite3.Connection = Depends(get_db)):
    user_id = data.get("userId") or (data.get("profileData") or {}).get("user_id")
    design = data.get("design", "cloned")
    if not user_id:
        raise HTTPException(status_code=400, detail="userId required")

    cursor = db.cursor()
    cursor.execute("SELECT * FROM students WHERE user_id = ?", (user_id,))
    student = cursor.fetchone()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    sd = dict(student)
    enroll = _get_enrollment_info(cursor, student["id"])
    sd.update(enroll)

    try:
        family = json.loads(sd.get("family_details") or "{}")
    except Exception:
        family = {}

    try:
        a2 = json.loads(sd.get("a2_data") or "{}")
        if not a2:
            a2 = family.get("a2_middle") or family.get("a2_preparatory") or family.get("a2_foundational") or {}
    except Exception:
        a2 = {}

    try:
        preferences = json.loads(sd.get("preferences") or "{}")
    except Exception:
        preferences = {}

    try:
        assessments = json.loads(sd.get("assessments") or "{}")
    except Exception:
        assessments = {}

    node_data = {
        "school": {
            "name": sd.get("school_name") or "NA",
            "address1": sd.get("school_address1") or "NA",
            "address2": sd.get("school_address2") or "NA",
            "pincode": sd.get("school_pincode") or "NA",
            "udiseCode": sd.get("udise_code") or "NA",
            "principal": sd.get("principal_name") or "NA",
            "board": sd.get("board") or "NA"
        },
        "profile": {
            "name": sd.get("full_name") or "NA",
            "dob": sd.get("dob") or "NA",
            "roll": enroll.get("roll_number") or "NA",
            "reg": enroll.get("registration_number") or sd.get("registration_number") or "NA",
            "class": enroll.get("class_name") or sd.get("class_name") or "NA",
            "sec": enroll.get("section") or sd.get("section") or "NA",
            "teacherName": enroll.get("teacher_name") or "NA",
            "teacherCode": enroll.get("teacher_code") or "NA",
            "gender": sd.get("gender") or "NA",
            "bloodGroup": sd.get("blood_group") or "NA",
            "height": sd.get("height") or "NA",
            "weight": sd.get("weight") or "NA",
            "address": sd.get("address") or "NA",
            "phone": sd.get("phone") or "NA",
            "motherTongue": sd.get("mother_tongue") or "NA",
            "mediumOfInstruction": sd.get("medium_of_instruction") or "NA",
            "ruralUrban": sd.get("rural_urban") or "NA"
        },
        "family": family,
        "a2": a2,
        "preferences": preferences,
        "assessments": assessments
    }

    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tf:
        json.dump(node_data, tf)
        temp_path = tf.name

    exports_dir = os.path.join(os.path.dirname(__file__), "exports")
    os.makedirs(exports_dir, exist_ok=True)
    file_name = f"Report_Card_{design}_{user_id}_{int(time.time())}.pdf"
    file_path = os.path.join(exports_dir, file_name)

    script_path = os.path.join(os.path.dirname(__file__), "..", "generate_unified_pdf.js")
    process = subprocess.run(["node", script_path, temp_path, file_path], capture_output=True, text=True)
    os.unlink(temp_path)

    if process.returncode != 0:
        raise HTTPException(status_code=500, detail=f"PDF failed: {process.stderr}")

    try:
        cursor.execute("INSERT INTO report_cards (student_id,year,data,pdf_path) VALUES (?,?,?,?)",
            (student["id"], datetime.datetime.now().year, json.dumps(node_data), f"/exports/{file_name}"))
        db.commit()
    except Exception as e:
        print(f"DB error saving report: {e}")

    return {"status": "success", "message": f"{design.capitalize()} Report Card generated.", "fileName": file_name, "url": f"/exports/{file_name}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
