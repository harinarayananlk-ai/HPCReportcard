const { db } = require('../database');
const fs = require('fs');
const path = require('path');

// Fetch student profile for autofill
const getProfile = (req, res) => {
  const { userId } = req.params;

  // Search by user_id, with a fallback check on username in case IDs shifted
  db.get(`
    SELECT s.*, u.username, t.full_name as teacher_name, t.account_id as teacher_account_id
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN classes c ON (s.class_name = c.grade AND s.section = c.section)
    LEFT JOIN teachers t ON c.teacher_id = t.id
    WHERE s.user_id = ?
  `, [userId], (err, row) => {
    if (err) return res.status(500).json({ message: "Database error" });
    
    // If not found by ID, try finding based on the username of the user asking (if possible)
    // But usually userId is reliable if the user is authenticated.
    
    if (row) {
      try {
        if (row.family_details && typeof row.family_details === 'string') {
          row.family_details = JSON.parse(row.family_details);
        }
        if (row.preferences && typeof row.preferences === 'string') {
          row.preferences = JSON.parse(row.preferences);
        }
        if (row.assessments && typeof row.assessments === 'string') {
          row.assessments = JSON.parse(row.assessments);
        }
      } catch (e) {
        console.error("JSON Parse Error in getProfile", e);
      }
      return res.json(row);
    } else {
      // Row not found
      return res.status(200).json({}); // Still return 200 but empty object
    }
  });
};

// Create or Update student profile (Persistence)
const updateProfile = (req, res) => {
  const { 
    userId, registrationNumber, fullName, className, section, dob, school, points = 0,
    familyDetails, preferences, assessments, role = 'student'
  } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required to identify the target profile." });
  }

  // 1. Fetch existing data first by user_id to perform a safe merge
  db.get(`SELECT * FROM students WHERE user_id = ?`, [userId], (err, existing) => {
    if (err) return res.status(500).json({ message: "Database error during fetch" });

    // Enforce registration number boundary
    const finalRegNo = registrationNumber || (existing ? existing.registration_number : null);
    if (!finalRegNo) {
      return res.status(400).json({ message: "Registration number is required to save profiles." });
    }

    // 2. Prepare Merged Objects (Deep Spread Merge)
    let finalFd = existing ? (typeof existing.family_details === 'string' ? JSON.parse(existing.family_details) : (existing.family_details || {})) : {};
    let finalPref = existing ? (typeof existing.preferences === 'string' ? JSON.parse(existing.preferences) : (existing.preferences || {})) : {};
    let finalAssess = existing ? (typeof existing.assessments === 'string' ? JSON.parse(existing.assessments) : (existing.assessments || {})) : {};

    try {
      if (familyDetails) finalFd = { ...finalFd, ...familyDetails };
      if (preferences) finalPref = { ...finalPref, ...preferences };
      
      if (assessments && typeof assessments === 'object') {
        if (role === 'student') {
           // THE WALL: Student can ONLY update `selfAssessment`, everything else is ignored.
           if (assessments.selfAssessment !== undefined) {
               finalAssess.selfAssessment = assessments.selfAssessment;
           }
        } else {
           // Teachers (or superadmins) override everything passed in the payload
           finalAssess = { ...finalAssess, ...assessments };
        }
      }
    } catch (e) {
      console.error("Deep merge error", e);
    }

    const fdStr = JSON.stringify(finalFd);
    const prefStr = JSON.stringify(finalPref);
    const assessStr = JSON.stringify(finalAssess);

    const finalPoints = points || 0;
    const finalDob = (existing ? existing.dob : null) || dob;

    // 3. Deterministic Insert or Update
    if (existing) {
       db.run(`
          UPDATE students SET 
            registration_number = COALESCE(?, registration_number),
            full_name = COALESCE(?, full_name),
            class_name = COALESCE(?, class_name),
            section = COALESCE(?, section),
            dob = COALESCE(?, dob),
            school = COALESCE(?, school),
            points = points + ?,
            family_details = ?,
            preferences = ?,
            assessments = ?
          WHERE user_id = ?
       `, [finalRegNo, fullName, className, section, finalDob, school, finalPoints, fdStr, prefStr, assessStr, userId], function(err) {
           if (err) return res.status(500).json({ message: "Error updating profile", error: err.message });
           res.json({ message: "Profile updated safely (UPDATE)", awardedPoints: finalPoints });
       });
    } else {
       db.run(`
          INSERT INTO students (user_id, registration_number, full_name, class_name, section, dob, school, points, family_details, preferences, assessments)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `, [userId, finalRegNo, fullName, className, section, finalDob, school, finalPoints, fdStr, prefStr, assessStr], function(err) {
           if (err) return res.status(500).json({ message: "Error inserting profile", error: err.message });
           res.json({ message: "Profile updated safely (INSERT)", awardedPoints: finalPoints });
       });
    }
  });
};

// Fetch report history for a student (using userId)
const getReports = (req, res) => {
  const { studentId: userId } = req.params; // It's actually userId from frontend

  db.all(`
    SELECT r.* FROM report_cards r
    JOIN students s ON r.student_id = s.id
    WHERE s.user_id = ?
    ORDER BY r.year DESC
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(rows);
  });
};

// Dynamic HTML Renderer for Part B
const renderPartB = (req, res) => {
  const { userId } = req.params;
  
  db.get(`
    SELECT s.*, u.username, t.full_name as teacher_name, t.account_id as teacher_account_id
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN classes c ON (s.class_name = c.grade AND s.section = c.section)
    LEFT JOIN teachers t ON c.teacher_id = t.id
    WHERE s.user_id = ?
  `, [userId], (err, profile) => {
    if (err || !profile) return res.status(404).send("Profile not found");

    const templatePath = path.join(__dirname, '../templates/part_b.html');
    if (!fs.existsSync(templatePath)) return res.status(500).send("Template missing");

    let html = fs.readFileSync(templatePath, 'utf8');

    const assessments = typeof profile.assessments === 'string' ? JSON.parse(profile.assessments) : (profile.assessments || {});
    
    // Merge rubricTable into cellTexts for compatibility
    const cellTexts = { ...(assessments.cellTexts || {}), ...(assessments.rubricTable || {}) };
    const domain = assessments.domain || '';

    const assessStr = JSON.stringify(assessments);

    // INJECTION: Dynamic Header + State Patch
    const injection = `
      <script>
        window.INJECTED_PROFILE = ${JSON.stringify(profile)};
        window.INJECTED_DOMAIN = ${JSON.stringify(domain)};
        (function() {
            const profile = window.INJECTED_PROFILE;
            const assess = ${assessStr};
            const cellTexts = ${JSON.stringify(cellTexts)};
            const domain = window.INJECTED_DOMAIN;
            const goals = Array.isArray(assess.goal) ? assess.goal.join(", ") : (assess.goal || "");
            const competencyList = Array.isArray(assess.competency) ? assess.competency.join(", ") : (assess.competency || "");
          const headerHtml = \`
            <div id="debug-data-tag" data-user="\${profile.user_id}" data-cells="\${Object.keys(cellTexts).length}" style="display:none;"></div>
            <div style="background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1); padding: 25px; margin-bottom: 20px; border-radius: 15px; color: white; display: flex; align-items: center; gap: 20px; font-family: sans-serif;">
              <div style="width: 70px; height: 70px; border-radius: 35px; background: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 800; text-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                \${(profile.full_name || 'S').charAt(0)}
              </div>
              <div style="flex: 1;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">\${profile.full_name || 'STUDENT PROFILE'}</h2>
                <div style="display: flex; gap: 15px; font-size: 11px; opacity: 0.7; font-weight: 600; margin-top: 5px;">
                  <span>ID: \${profile.registration_number || 'REG-ID'}</span>
                  <span>CLASS: \${profile.class_name || 'BAL VATIKA'}</span>
                  <span>SEC: \${profile.section || 'A'}</span>
                </div>
                <div style="margin-top: 8px; font-size: 13px; font-weight: 700; color: #4ade80;">
                  TEACHER: \${profile.teacher_name || 'UNASSIGNED'}
                </div>
              </div>
            </div>
          \`;

          const inject = setInterval(() => {
            const body = document.querySelector('.app-content-scaler') || document.querySelector('#root');
            if (body) {
              clearInterval(inject);
              if (document.getElementById('injected-header')) return;
              const div = document.createElement('div');
              div.id = 'injected-header';
              div.style.zIndex = '9999';
              div.style.position = 'relative';
              div.innerHTML = headerHtml;
              body.insertBefore(div, body.firstChild);
            }
          }, 10);

          // State Hook Hijack
          const waitForReact = setInterval(() => {
            if (!window.React) return;
            clearInterval(waitForReact);
            const _useState = window.React.useState;
            let patchedCells = false;
            let patchedDomain = false;

            window.React.useState = function(init) {
              // Patch cellTexts state ({}) -> inject rubric matrix
              if (!patchedCells && init && typeof init === 'object' && !Array.isArray(init) && Object.keys(init).length === 0) {
                patchedCells = true;
                return _useState.call(this, { ...cellTexts, ...(assess.rubricTable || {}) });
              }
              // Patch domain state ('')
              if (!patchedDomain && typeof init === 'string' && init === '' && domain) {
                patchedDomain = true;
                return _useState.call(this, domain);
              }
              return _useState.apply(this, arguments);
            };
          }, 10);
        })();
      </script>
    `;

    // Insert injection right after the opening <body> tag (regex handles attributes/case)
    html = html.replace(/<body[^>]*>/i, '$&' + injection);
    res.send(html);
  });
};

module.exports = { getProfile, updateProfile, getReports, renderPartB };
