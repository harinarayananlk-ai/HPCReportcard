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
           // THE WALL: Student/Parent can ONLY update specific assessments
           if (assessments.selfAssessment !== undefined) {
               finalAssess.selfAssessment = assessments.selfAssessment;
           }
           if (assessments.a3_s2 !== undefined) {
               finalAssess.a3_s2 = assessments.a3_s2;
           }
           if (assessments.a4_s3 !== undefined) {
               finalAssess.a4_s3 = assessments.a4_s3;
           }
           if (assessments.a4_s2 !== undefined) {
               finalAssess.a4_s2 = assessments.a4_s2;
           }
           if (assessments.a4_s1 !== undefined) {
               finalAssess.a4_s1 = assessments.a4_s1;
           }
           if (assessments.domainMatricesV2 !== undefined) {
               finalAssess.domainMatricesV2 = assessments.domainMatricesV2;
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
  const { buildHpcHtml } = require('./hpcTemplate');
  
  db.get(`
    SELECT s.*, u.username, t.full_name as teacher_name, t.teacher_code,
           c.grade as class_name, c.section, c.academic_year,
           sch.name as school_name, sch.address_line1 as school_address1,
           sch.address_line2 as school_address2, sch.pincode as school_pincode,
           sch.udise_code, sch.board, sch.principal_name,
           se.registration_number, se.roll_number
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN student_enrollments se ON s.id = se.student_id
    LEFT JOIN classes c ON se.class_id = c.id
    LEFT JOIN teachers t ON c.teacher_id = t.id
    LEFT JOIN schools sch ON c.school_id = sch.id
    WHERE s.user_id = ?
    ORDER BY se.academic_year DESC LIMIT 1
  `, [userId], (err, profile) => {
    if (err || !profile) return res.status(404).send("Profile not found");

    let family = {};
    let a2 = {};
    let preferences = {};
    let assessments = {};
    
    try {
      family = typeof profile.family_details === 'string' ? JSON.parse(profile.family_details || '{}') : (profile.family_details || {});
    } catch(e) {}
    try {
      a2 = typeof profile.a2_data === 'string' ? JSON.parse(profile.a2_data || '{}') : (profile.a2_data || {});
    } catch(e) {}
    try {
      preferences = typeof profile.preferences === 'string' ? JSON.parse(profile.preferences || '{}') : (profile.preferences || {});
    } catch(e) {}
    try {
      assessments = typeof profile.assessments === 'string' ? JSON.parse(profile.assessments || '{}') : (profile.assessments || {});
    } catch(e) {}

    const studentData = {
      school: {
        name: profile.school_name || "Samosa High International School",
        address1: profile.school_address1 || "NA",
        address2: profile.school_address2 || "NA",
        pincode: profile.school_pincode || "NA",
        udiseCode: profile.udise_code || "NA",
        principal: profile.principal_name || "NA",
        board: profile.board || "NA"
      },
      profile: {
        name: profile.full_name || "NA",
        dob: profile.dob || family.dob || "NA",
        roll: profile.roll_number || family.rollNumber || "NA",
        reg: profile.registration_number || family.registrationNumber || "NA",
        class: profile.class_name || "NA",
        sec: profile.section || "NA",
        teacherName: profile.teacher_name || "NA",
        teacherCode: profile.teacher_code || family.teacherCode || "NA",
        gender: profile.gender || "NA",
        bloodGroup: profile.blood_group || "NA",
        height: profile.height || "NA",
        weight: profile.weight || "NA",
        address: profile.address || family.location || "NA",
        phone: profile.phone || family.phoneNumber || "NA",
        motherTongue: profile.mother_tongue || family.motherTongue || "NA",
        mediumOfInstruction: profile.medium_of_instruction || family.mediumOfInstruction || "NA",
        ruralUrban: profile.rural_urban || family.ruralUrban || "NA"
      },
      family,
      a2,
      preferences,
      assessments
    };

    try {
      const htmlContent = buildHpcHtml(studentData);
      res.send(htmlContent);
    } catch (err) {
      console.error("HTML Render Failed:", err);
      res.status(500).send("HTML Render Failed: " + err.message);
    }
  });
};

module.exports = { getProfile, updateProfile, getReports, renderPartB };
