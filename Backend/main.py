import sqlite3, json, os, asyncio, mimetypes, datetime, time, subprocess, tempfile
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Any
from passlib.context import CryptContext

mimetypes.add_type('application/pdf', '.pdf')

DB_PATH = os.path.join(os.path.dirname(__file__), "database.sqlite")

@asynccontextmanager
async def lifespan(app: FastAPI):
    from seed import seed_db
    seed_db(DB_PATH)
    
    # Plan 3: Ensure backup columns exist
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN backup_assessments TEXT")
    except: pass
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN backup_rubric TEXT")
    except: pass
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN backup_unified TEXT")
    except: pass
    conn.commit()
    conn.close()
    print("Backup columns verified.")
    yield

app = FastAPI(title="MyApp Python Backend", lifespan=lifespan)



# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static routes
app.mount("/exports", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "exports")), name="exports")


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try: yield conn
    finally: conn.close()

# Ensure required directories exist
os.makedirs(os.path.join(os.path.dirname(__file__), "exports"), exist_ok=True)

# --- Models ---
class LoginRequest(BaseModel):
    username: str
    password: str
    role: str

class ProfileUpdate(BaseModel):
    userId: int
    registrationNumber: Optional[str] = None
    preferences: Optional[Any] = None
    assessments: Optional[Any] = None
    familyDetails: Optional[Any] = None

# --- Helpers ---
def verify_password(plain_password, hashed_password):
    # Bcrypt has a 72-byte limit
    return pwd_context.verify(plain_password[:72], hashed_password)

# --- Routes ---

@app.post("/api/login")
async def login(req: LoginRequest, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (req.username,))
    user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # If student, fetch profile
    profile = None
    if user["role"] == "student":
        cursor.execute("SELECT * FROM students WHERE user_id = ?", (user["id"],))
        profile = cursor.fetchone()
        if profile:
            profile = dict(profile)
    
    return {
        "status": "success",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"]
        },
        "profile": profile
    }

@app.get("/api/students/profile/{user_id}")
async def get_profile(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    query = """
        SELECT s.*, u.username, t.full_name as teacher_name, t.account_id as teacher_account_id
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN classes c ON (s.class_name = c.grade AND s.section = c.section)
        LEFT JOIN teachers t ON c.teacher_id = t.id
        WHERE s.user_id = ?
    """
    cursor.execute(query, (user_id,))
    profile = cursor.fetchone()
    
    if not profile:
        return {} # Return empty object as per Node logic
        
    res = dict(profile)
    for field in ["family_details", "preferences", "assessments", "backup_assessments", "backup_rubric", "backup_unified"]:
        if res.get(field) and isinstance(res[field], str):
            try: res[field] = json.loads(res[field])
            except: res[field] = {}
    return res

@app.post("/api/students/profile")
async def update_profile(req: dict, db: sqlite3.Connection = Depends(get_db)):
    # Using dict for req to handle dynamic fields more easily
    user_id = req.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="userId is required")

    cursor = db.cursor()
    cursor.execute("SELECT * FROM students WHERE user_id = ?", (user_id,))
    existing = cursor.fetchone()

    # Merge logic
    def get_json_field(field):
        if existing and existing[field]:
            try:
                return json.loads(existing[field])
            except:
                return {}
        return {}

    final_fd = get_json_field("family_details")
    final_pref = get_json_field("preferences")
    final_assess = get_json_field("assessments")

    if req.get("familyDetails"):
        final_fd.update(req["familyDetails"])
    if req.get("preferences"):
        final_pref.update(req["preferences"])
    
    assessments = req.get("assessments")
    if assessments and isinstance(assessments, dict):
        if req.get("role") == "student":
            # The Wall: students only update selfAssessment
            if "selfAssessment" in assessments:
                final_assess["selfAssessment"] = assessments["selfAssessment"]
        else:
            final_assess.update(assessments)

    fd_str = json.dumps(final_fd)
    pref_str = json.dumps(final_pref)
    assess_str = json.dumps(final_assess)

    # Other fields
    full_name = req.get("fullName") or (existing["full_name"] if existing else None)
    class_name = req.get("className") or (existing["class_name"] if existing else None)
    section = req.get("section") or (existing["section"] if existing else None)
    dob = req.get("dob") or (existing["dob"] if existing else None)
    school = req.get("school") or (existing["school"] if existing else None)
    reg_no = req.get("registrationNumber") or (existing["registration_number"] if existing else None)
    points = int(req.get("points") or 0)

    # Backup fields (Explicitly mapped)
    backup_assess = json.dumps(req["backupAssessments"]) if req.get("backupAssessments") else (existing["backup_assessments"] if existing else None)
    backup_rubric = json.dumps(req["backupRubric"]) if req.get("backupRubric") else (existing["backup_rubric"] if existing else None)
    backup_unified = json.dumps(req["backupUnified"]) if req.get("backupUnified") else (existing["backup_unified"] if existing else None)

    if existing:
        cursor.execute("""
            UPDATE students 
            SET registration_number = COALESCE(?, registration_number),
                full_name = COALESCE(?, full_name),
                class_name = COALESCE(?, class_name),
                section = COALESCE(?, section),
                dob = COALESCE(?, dob),
                school = COALESCE(?, school),
                points = points + ?,
                family_details = ?,
                preferences = ?,
                assessments = ?,
                backup_assessments = COALESCE(?, backup_assessments),
                backup_rubric = COALESCE(?, backup_rubric),
                backup_unified = COALESCE(?, backup_unified),
                last_updated = CURRENT_TIMESTAMP
            WHERE user_id = ?
        """, (reg_no, full_name, class_name, section, dob, school, points, fd_str, pref_str, assess_str, backup_assess, backup_rubric, backup_unified, user_id))
    else:
        cursor.execute("""
            INSERT INTO students (user_id, registration_number, full_name, class_name, section, dob, school, points, family_details, preferences, assessments, backup_assessments, backup_rubric, backup_unified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, reg_no, full_name, class_name, section, dob, school, points, fd_str, pref_str, assess_str, backup_assess, backup_rubric, backup_unified))
    
    db.commit()
    return {"status": "success", "message": "Profile updated safely"}



@app.get("/api/students/reports/{user_id}")
async def get_reports(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    # Node logic joins with students to filter by user_id
    cursor.execute("""
        SELECT r.* FROM report_cards r
        JOIN students s ON r.student_id = s.id
        WHERE s.user_id = ?
        ORDER BY r.year DESC
    """, (user_id,))
    reports = [dict(row) for row in cursor.fetchall()]
    return reports

# --- ADMIN ROUTES ---

@app.get("/api/admin/students")
async def get_all_students(db: sqlite3.Connection = Depends(get_db)):
    try:
        cursor = db.cursor()
        query = """
            SELECT 
                u.id as user_id, u.username, u.plain_password,
                s.id as student_id, s.registration_number, s.class_name, s.section, s.school, s.last_updated,
                t.full_name as teacher_name, t.account_id as teacher_account_id
            FROM users u
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN classes c ON (s.class_name = c.grade AND s.section = c.section)
            LEFT JOIN teachers t ON c.teacher_id = t.id
            WHERE u.role = 'student'
            ORDER BY s.class_name, s.section, u.username
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/create-student")
async def create_student(data: dict, db: sqlite3.Connection = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")
    reg_number = data.get("registrationNumber")
    class_name = data.get("className")
    section = data.get("section")
    school = data.get("school")

    if not all([username, password, reg_number, class_name]):
        raise HTTPException(status_code=400, detail="Missing required fields")

    hashed_password = pwd_context.hash(password[:72])

    try:
        cursor = db.cursor()
        
        # Insert user
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, 'student')",
            (username, hashed_password)
        )
        user_id = cursor.lastrowid
        
        # Insert student
        cursor.execute(
            "INSERT INTO students (user_id, registration_number, class_name, section, school) VALUES (?, ?, ?, ?, ?)",
            (user_id, reg_number, class_name, section, school)
        )
        db.commit()
        return {"message": "Student account successfully created", "userId": user_id}
    except sqlite3.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username or registration number already exists")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/shuffle-student")
async def shuffle_student(data: dict, db: sqlite3.Connection = Depends(get_db)):
    student_id = data.get("studentId")
    new_class_name = data.get("newClassName")
    new_section = data.get("newSection")

    if not student_id or not new_class_name:
        raise HTTPException(status_code=400, detail="StudentId and New Grade are required")

    try:
        cursor = db.cursor()
        cursor.execute(
            "UPDATE students SET class_name = ?, section = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?",
            (new_class_name, new_section, student_id)
        )
        db.commit()
        return {"message": f"Student advanced to {new_class_name} {new_section or ''} successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- PDF EXPORT ROUTES (STUBS) ---

@app.get("/api/render/part_b/{user_id}")
async def render_part_b(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    query = """
        SELECT s.*, u.username, t.full_name as teacher_name, t.account_id as teacher_account_id
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN classes c ON (s.class_name = c.grade AND s.section = c.section)
        LEFT JOIN teachers t ON c.teacher_id = t.id
        WHERE s.user_id = ?
    """
    cursor.execute(query, (user_id,))
    profile = cursor.fetchone()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    template_path = os.path.join(os.path.dirname(__file__), '../pdf_generation_archive/part_b.html')
    # If not in archive, check local templates
    if not os.path.exists(template_path):
        template_path = os.path.join(os.path.dirname(__file__), 'templates/part_b.html')
    
    if not os.path.exists(template_path):
        raise HTTPException(status_code=500, detail="Template missing")

    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()

    profile_dict = dict(profile)
    assessments = json.loads(profile_dict.get("assessments") or "{}")
    
    cell_texts = {**(assessments.get("cellTexts") or {}), **(assessments.get("rubricTable") or {})}
    domain = assessments.get("domain") or ''
    assess_str = json.dumps(assessments)

    injection = f"""
      <style>
        @keyframes ambient-circle-draw {{
          0% {{ stroke-dashoffset: 251; opacity: 0; }}
          20% {{ opacity: 1; }}
          80% {{ opacity: 1; }}
          100% {{ stroke-dashoffset: 0; opacity: 0; }}
        }}
        .ambient-icon-wrapper {{
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }}
        .ambient-svg-circle {{
          position: absolute;
          top: -15%;
          left: -15%;
          width: 130%;
          height: 130%;
          pointer-events: none;
          z-index: 5;
        }}
        .ambient-circle-path {{
          fill: none;
          stroke: #6366f1;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-dasharray: 251;
          animation: ambient-circle-draw 4s ease-in-out infinite;
        }}
      </style>
      <script>
        window.INJECTED_PROFILE = {json.dumps(profile_dict)};
        window.INJECTED_DOMAIN = {json.dumps(domain)};
        (function() {{
            const profile = window.INJECTED_PROFILE;
            const assess = {assess_str};
            const cellTexts = {json.dumps(cell_texts)};
            const domain = window.INJECTED_DOMAIN;

            // Ambient Animation Logic for Matrix Icons
            function applyAmbientAnimations() {{
                // Target icons in the matrix (top row and left column)
                // We'll look for images or SVGs inside the first row/column of tables
                const tables = document.querySelectorAll('table');
                tables.forEach(table => {{
                    const rows = table.rows;
                    for (let i = 0; i < rows.length; i++) {{
                        const cells = rows[i].cells;
                        for (let j = 0; j < cells.length; j++) {{
                            // Only target top row (i=0) or left column (j=0)
                            if (i === 0 || j === 0) {{
                                const icons = cells[j].querySelectorAll('img, svg, .icon, [class*="icon"]');
                                icons.forEach(icon => {{
                                    if (icon.parentElement.classList.contains('ambient-icon-wrapper')) return;
                                    
                                    const wrapper = document.createElement('div');
                                    wrapper.className = 'ambient-icon-wrapper';
                                    icon.parentNode.insertBefore(wrapper, icon);
                                    wrapper.appendChild(icon);
                                    
                                    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                                    svg.setAttribute("viewBox", "0 0 100 100");
                                    svg.setAttribute("class", "ambient-svg-circle");
                                    svg.innerHTML = '<circle cx="50" cy="50" r="40" class="ambient-circle-path" />';
                                    wrapper.appendChild(svg);
                                }});
                            }}
                        }}
                    }}
                }});
            }}

            const headerHtml = `
              <div id="debug-data-tag" data-user="${{profile.user_id}}" data-cells="${{Object.keys(cell_texts).length}}" style="display:none;"></div>
              <div style="background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1); padding: 25px; margin-bottom: 20px; border-radius: 15px; color: white; display: flex; align-items: center; gap: 20px; font-family: sans-serif;">
                <div style="width: 70px; height: 70px; border-radius: 35px; background: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 800; text-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                  ${{(profile.full_name || 'S').charAt(0)}}
                </div>
                <div style="flex: 1;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${{profile.full_name || 'STUDENT PROFILE'}}</h2>
                  <div style="display: flex; gap: 15px; font-size: 11px; opacity: 0.7; font-weight: 600; margin-top: 5px;">
                    <span>ID: ${{profile.registration_number || 'REG-ID'}}</span>
                    <span>CLASS: ${{profile.class_name || 'BAL VATIKA'}}</span>
                    <span>SEC: ${{profile.section || 'A'}}</span>
                  </div>
                  <div style="margin-top: 8px; font-size: 13px; font-weight: 700; color: #4ade80;">
                    TEACHER: ${{profile.teacher_name || 'UNASSIGNED'}}
                  </div>
                </div>
              </div>
            `;

            const inject = setInterval(() => {{
              const body = document.querySelector('.app-content-scaler') || document.querySelector('#root');
              if (body) {{
                clearInterval(inject);
                if (!document.getElementById('injected-header')) {{
                    const div = document.createElement('div');
                    div.id = 'injected-header';
                    div.style.zIndex = '9999';
                    div.style.position = 'relative';
                    div.innerHTML = headerHtml;
                    body.insertBefore(div, body.firstChild);
                }}
                applyAmbientAnimations();
              }}
            }}, 100);

            const waitForReact = setInterval(() => {{
              if (!window.React) return;
              clearInterval(waitForReact);
              const _useState = window.React.useState;
              let patchedCells = false;
              let patchedDomain = false;

              window.React.useState = function(init) {{
                if (!patchedCells && init && typeof init === 'object' && !Array.isArray(init) && Object.keys(init).length === 0) {{
                  patchedCells = true;
                  return _useState.call(this, {{ ...cellTexts, ...(assess.rubricTable || {{}}) }});
                }}
                if (!patchedDomain && typeof init === 'string' && init === '' && domain) {{
                  patchedDomain = true;
                  return _useState.call(this, domain);
                }}
                return _useState.apply(this, arguments);
              }};
            }}, 10);
        }})();
      </script>
    """
    import re
    html = re.sub(r'<body[^>]*>', r'\g<0>' + injection, html, flags=re.IGNORECASE)
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html)

@app.post("/api/export/pdf")
async def export_pdf(data: dict, db: sqlite3.Connection = Depends(get_db)):
    user_id = data.get("userId") or (data.get("profileData") or {}).get("user_id")
    design = data.get("design", "cloned")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="Student User ID is required for export")

    try:
        # Fetch actual data from DB
        cursor = db.cursor()
        cursor.execute("SELECT * FROM students WHERE user_id = ?", (user_id,))
        student = cursor.fetchone()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        student_dict = dict(student)
        assessments = json.loads(student_dict.get("assessments") or "{}")
        family = json.loads(student_dict.get("family_details") or "{}")
        
        # Standardize data for Node scripts
        node_data = {
            "profile": {
                "name": student_dict.get("full_name") or "NA",
                "roll": "NA",
                "reg": student_dict.get("registration_number") or "NA",
                "class": student_dict.get("class_name") or "NA",
                "sec": student_dict.get("section") or "NA",
                "dob": student_dict.get("dob") or "NA"
            },
            "family": {
                "mName": family.get("motherName") or "NA",
                "fName": family.get("fatherName") or "NA",
                "lang": family.get("motherTongue") or "NA"
            },
            "attendance": {
                "months": ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"],
                "workingDays": [(r.get("working") if isinstance(r, dict) else 0) or 0 for r in (assessments.get("attendanceTable") if isinstance(assessments.get("attendanceTable"), list) else family.get("attendance") if isinstance(family.get("attendance"), list) else [{} for _ in range(12)])],
                "attendedDays": [(r.get("attended") if isinstance(r, dict) else 0) or 0 for r in (assessments.get("attendanceTable") if isinstance(assessments.get("attendanceTable"), list) else family.get("attendance") if isinstance(family.get("attendance"), list) else [{} for _ in range(12)])],
                "reasons": assessments.get("attendanceRemarks") or "N/A"
            },
            "assessment": {
                "domain": assessments.get("domain") or "NA",
                "activities": assessments.get("activities") or "NA",
                "remarks": assessments.get("remarks") or "NA"
            }
        }

        # Save to temp file
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tf:
            json.dump(node_data, tf)
            temp_path = tf.name

        # Ensure exports directory exists
        exports_dir = os.path.join(os.path.dirname(__file__), "exports")
        if not os.path.exists(exports_dir):
            os.makedirs(exports_dir)
            
        file_name = f"Report_Card_{design}_{user_id}_{int(time.time())}.pdf"
        file_path = os.path.join(exports_dir, file_name)

        # Select script
        script_map = {
            "cloned": "generate_grid_pdf.js",
            "premium": "generate_new_pdf.js",
            "comprehensive": "generate_comprehensive_pdf.js"
        }
        script_name = script_map.get(design, "generate_grid_pdf.js")
        script_path = os.path.join(os.path.dirname(__file__), "..", script_name)

        # Run Node.js script
        process = subprocess.run(
            ["node", script_path, temp_path, file_path],
            capture_output=True, text=True
        )

        # Cleanup temp file
        os.unlink(temp_path)

        if process.returncode != 0:
            print(f"Node script error: {process.stderr}")
            raise Exception(f"Node execution failed: {process.stderr}")

        # Save report card record so student/parents can view it
        try:
            cursor.execute(
                "INSERT INTO report_cards (student_id, year, data, pdf_path) VALUES (?, ?, ?, ?)",
                (student_dict["id"], datetime.datetime.now().year, json.dumps(node_data), f"/exports/{file_name}")
            )
            db.commit()
            print(f"Report card record created for student {student_dict['id']}")
        except Exception as db_err:
            print(f"Database error saving report card: {db_err}")
            # Don't fail the export if just the record saving fails, but log it

        return {
            "status": "success",
            "message": f"{design.capitalize()} Report Card generated successfully.",
            "fileName": file_name,
            "url": f"/exports/{file_name}"
        }
    except Exception as e:
        print(f"PDF Export Error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF Generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
