const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');
const { buildHpcHtml } = require('./hpcTemplate');

const getProfileData = (targetId) => {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT s.*, u.username, t.full_name as teacher_name, t.teacher_code,
             COALESCE(c.grade, s.class_name) as class_name,
             COALESCE(c.section, s.section) as section,
             c.academic_year,
             sch.name as school_name, sch.address_line1 as school_address1,
             sch.address_line2 as school_address2, sch.pincode as school_pincode,
             sch.udise_code, sch.board, sch.principal_name,
             COALESCE(se.registration_number, s.registration_number) as registration_number,
             se.roll_number
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN student_enrollments se ON s.id = se.student_id
      LEFT JOIN classes c ON (COALESCE(se.class_id, (SELECT id FROM classes WHERE grade = s.class_name AND section = s.section LIMIT 1)) = c.id)
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN schools sch ON c.school_id = sch.id
      WHERE s.user_id = ?
      ORDER BY se.academic_year DESC LIMIT 1
    `, [targetId], (err, profile) => {
      if (err) reject(err);
      else resolve(profile);
    });
  });
};

const exportReport = async (req, res) => {
  const { userId, profileData } = req.body;

  if (!userId && !profileData?.user_id) {
    return res.status(400).json({ message: "Student User ID is required for export" });
  }

  const targetId = userId || profileData.user_id;

  try {
    const profile = await getProfileData(targetId);
    if (!profile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    let family = {};
    let a2 = {};
    let preferences = {};
    let assessments = {};
    
    try {
      family = typeof profile.family_details === 'string' ? JSON.parse(profile.family_details || '{}') : (profile.family_details || {});
    } catch(e) {}
    try {
      a2 = typeof profile.a2_data === 'string' ? JSON.parse(profile.a2_data || '{}') : (profile.a2_data || {});
      if (!a2 || Object.keys(a2).length === 0) {
        a2 = family.a2_middle || family.a2_preparatory || family.a2_foundational || {};
      }
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

    const htmlContent = buildHpcHtml(studentData);

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set viewport to A4 aspect ratio approximately
    await page.setViewport({ width: 1240, height: 1754 });

    // 1. Inject HTML content directly
    await page.setContent(htmlContent, { waitUntil: 'load', timeout: 10000 });
    
    // 2. Extra wait for any resources to fully load/render
    await new Promise(resolve => setTimeout(resolve, 2500));

    const fileName = `Report_Card_Original_${targetId}_${Date.now()}.pdf`;
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    const filePath = path.join(exportsDir, fileName);
    
    // 3. Generate PDF (All pages generated dynamically)
    await page.pdf({ 
      path: filePath, 
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });

    await browser.close();

    res.json({ 
      status: "success",
      message: "Original 15-page Report Card generated with full data.", 
      fileName, 
      url: `/exports/${fileName}` 
    });
  } catch (err) {
    console.error("PDF Export Error:", err);
    res.status(500).json({ status: "error", message: "PDF Generation failed", error: err.message });
  }
};

module.exports = { exportReport };
