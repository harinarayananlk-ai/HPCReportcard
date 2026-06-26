const path = require('path');
const fs = require('fs');

// Helper to get base64 representation of local images
function getBase64(file) {
    const filePath = path.join(__dirname, '../../assets/images', file);
    if (!fs.existsSync(filePath)) {
        console.warn(`Asset missing: ${filePath}`);
        return '';
    }
    const bitmap = fs.readFileSync(filePath);
    const ext = path.extname(file).replace('.', '');
    return `data:image/${ext === 'svg' ? 'svg+xml' : ext};base64,${bitmap.toString('base64')}`;
}

// Load static assets once at module initialization
const assets = {
    border: getBase64('luxury_gold_border.png'),
    divider: getBase64('luxury_gold_divider.png'),
    bg1: getBase64('Background images/smooth_silver_gold_folds.jpg'),
    bg2: getBase64('Background images/ultra_monochrome_silver_gold_folds.jpg'),
    bg3: getBase64('Background images/1.jpg'),
    bg4: getBase64('Background images/2.jpg'),
    bg5: getBase64('Background images/premium_login_background.jpg'),
    bg6: getBase64('Background images/Gemini_Generated_Image_xe9q6kxe9q6kxe9q.jpg'),
    badgeStream: getBase64('badge-stream.png'),
    badgeRiver: getBase64('badge-river.png'),
    badgeMountain: getBase64('badge-mountain.png'),
    badgeSky: getBase64('badge-sky.png')
};

// Helper to escape HTML characters
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Get the correct mastery level badge based on value text
function getBadgeIcon(levelName) {
    if (!levelName) return '';
    const lvl = levelName.toString().toLowerCase().trim();
    if (lvl.includes('sky')) return assets.badgeSky;
    if (lvl.includes('mountain')) return assets.badgeMountain;
    if (lvl.includes('river')) return assets.badgeRiver;
    if (lvl.includes('stream') || lvl.includes('initial')) return assets.badgeStream;
    return '';
}

/**
 * Builds the complete multi-page HPC HTML document string.
 * @param {Object} studentData 
 * @returns {String} HTML Content
 */
function buildHpcHtml(studentData) {
    const className = (studentData.profile?.class || '').toLowerCase().trim();
    let stage = 1; // Default to Stage 1: Foundational
    if (className.includes('grade 3') || className.includes('grade 4') || className.includes('grade 5') || className.includes('class 3') || className.includes('class 4') || className.includes('class 5')) {
        stage = 2; // Preparatory
    } else if (className.includes('grade 6') || className.includes('grade 7') || className.includes('grade 8') || className.includes('class 6') || className.includes('class 7') || className.includes('class 8') || className.includes('middle')) {
        stage = 3; // Middle Stage
    }

    // Set up background list cycle (returns CSS class names to minimize duplicate base64 string overhead)
    let bgIndex = 0;
    const getBg = () => {
        const cls = `bg-style-${bgIndex}`;
        bgIndex = (bgIndex + 1) % 6;
        return cls;
    };

    let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Holistic Progress Card - ${escapeHtml(studentData.profile?.name || 'Student')}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Caveat:wght@400;700&display=swap');
        
        * { box-sizing: border-box; }
        
        @page {
            size: A4;
            margin: 0;
        }

        body { 
            font-family: 'Jost', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: #0E1015; 
            color: #333333; 
            -webkit-print-color-adjust: exact; 
        }
        
        .page { 
            width: 210mm; 
            height: 297mm; 
            margin: 0;
            padding: 22mm; 
            position: relative; 
            overflow: hidden; 
            page-break-after: always;
            page-break-inside: avoid;
            background-color: transparent;
        }

        .page-bg {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-size: 100% 100%;
            background-repeat: no-repeat;
            background-position: center;
            z-index: 1;
        }

        .bg-style-0 { background-image: url('${assets.bg1}'); }
        .bg-style-1 { background-image: url('${assets.bg2}'); }
        .bg-style-2 { background-image: url('${assets.bg3}'); }
        .bg-style-3 { background-image: url('${assets.bg4}'); }
        .bg-style-4 { background-image: url('${assets.bg5}'); }
        .bg-style-5 { background-image: url('${assets.bg6}'); }

        .badge-stream {
            display: inline-block;
            background-image: url('${assets.badgeStream}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        }
        .badge-river {
            display: inline-block;
            background-image: url('${assets.badgeRiver}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        }
        .badge-mountain {
            display: inline-block;
            background-image: url('${assets.badgeMountain}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        }
        .badge-sky {
            display: inline-block;
            background-image: url('${assets.badgeSky}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        }

        /* Ambient glow overlays */
        .glow-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 10% 15%, rgba(46, 88, 148, 0.09) 0%, transparent 45%),
                        radial-gradient(circle at 85% 85%, rgba(46, 163, 108, 0.07) 0%, transparent 40%),
                        radial-gradient(circle at 80% 20%, rgba(184, 151, 46, 0.08) 0%, transparent 45%);
            z-index: 2;
            pointer-events: none;
        }

        .matte-shield {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(255, 255, 255, 0.52);
            z-index: 3;
            pointer-events: none;
        }

        .page-border {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('${assets.border}');
            background-size: 100% 100%;
            background-repeat: no-repeat;
            pointer-events: none;
            z-index: 99;
        }

        .content-container {
            position: relative;
            z-index: 10;
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        /* Translucent Crystal Card styles */
        .glass-card {
            background: rgba(255, 255, 255, 0.65);
            border: 1.5px solid rgba(184, 151, 46, 0.35);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.04);
            margin-bottom: 20px;
            page-break-inside: avoid;
        }

        .cover-title {
            font-family: 'Outfit', sans-serif;
            font-size: 44px;
            font-weight: 300;
            letter-spacing: 6px;
            color: #2E5894;
            text-transform: uppercase;
            margin: 0;
            text-align: center;
        }

        .cover-subtitle {
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 4px;
            color: #B8972E;
            text-transform: uppercase;
            text-align: center;
            margin-top: 8px;
            margin-bottom: 24px;
        }

        .flourish-divider {
            width: 120px;
            height: 20px;
            background-image: url('${assets.divider}');
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            margin: 15px auto;
        }

        /* Section Headings */
        .section-title {
            font-family: 'Outfit', sans-serif;
            font-size: 12px;
            font-weight: 700;
            color: #2E5894;
            text-transform: uppercase;
            letter-spacing: 2px;
            border-left: 3px solid #B8972E;
            padding-left: 10px;
            margin: 20px 0 12px 0;
        }

        /* Grid Data lists */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .info-item {
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            padding-bottom: 4px;
        }

        .info-label {
            font-size: 9px;
            font-weight: 700;
            color: #777;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 2px;
        }

        .info-value {
            font-size: 13px;
            font-weight: 500;
            color: #222;
        }

        /* Polaroid style frames for photos */
        .polaroid-box {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 15px 0;
        }

        .polaroid-card {
            background: #ffffff;
            padding: 8px 8px 16px 8px;
            border: 1px solid rgba(184, 151, 46, 0.35);
            box-shadow: 0 8px 20px rgba(0,0,0,0.05);
            transform: rotate(-1.5deg);
            text-align: center;
            width: 140px;
        }
        
        .polaroid-card.right {
            transform: rotate(2deg);
        }

        .polaroid-img {
            width: 122px;
            height: 122px;
            object-fit: cover;
            border-radius: 2px;
            background: #f0f0f2;
        }

        .polaroid-caption {
            font-family: 'Caveat', cursive;
            font-size: 15px;
            color: #555;
            margin-top: 8px;
        }

        /* Tables styling */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 8px;
            overflow: hidden;
            page-break-inside: avoid;
        }

        th, td {
            border: 1px solid rgba(184, 151, 46, 0.25);
            padding: 8px 10px;
            text-align: center;
            font-size: 11px;
        }

        th {
            background: #2E5894;
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            font-weight: 500;
            font-size: 9px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .month-header {
            font-size: 8px;
            padding: 4px;
        }

        /* Rating Rubrics styling */
        .rubric-table th {
            background: #B8972E;
        }

        .rubric-row-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
            font-size: 9px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            text-align: left;
            background: rgba(46, 88, 148, 0.05);
        }

        .gem-rating-icon {
            width: 24px;
            height: 24px;
            object-fit: contain;
            display: inline-block;
            vertical-align: middle;
            margin-right: 6px;
        }

        .matrix-cell-content {
            font-size: 10px;
            color: #333;
            text-align: left;
            padding: 6px;
        }

        .matrix-cell-content.active {
            background: rgba(184, 151, 46, 0.09);
            border: 1px solid rgba(184, 151, 46, 0.35);
            border-radius: 6px;
            font-weight: 500;
        }

        /* Mini pill badges */
        .chip {
            display: inline-block;
            padding: 4px 10px;
            background: rgba(46, 88, 148, 0.08);
            border: 1px solid rgba(46, 88, 148, 0.2);
            border-radius: 20px;
            font-size: 10px;
            color: #2E5894;
            margin-right: 6px;
            margin-bottom: 6px;
            font-weight: 500;
        }

        .chip.gold-chip {
            background: rgba(184, 151, 46, 0.08);
            border: 1px solid rgba(184, 151, 46, 0.2);
            color: #8C733E;
        }

        /* Cyberpunk styled tag chips */
        .cyber-chip {
            background: rgba(0, 229, 255, 0.08);
            border: 1px solid rgba(0, 229, 255, 0.25);
            color: #008899;
        }

        /* Metallic grid cells */
        .metallic-cell {
            background: rgba(220, 225, 235, 0.6);
            border: 1px solid rgba(184, 151, 46, 0.25);
            border-radius: 8px;
            padding: 10px;
            font-size: 11px;
            text-align: center;
            font-weight: 500;
            color: #2E5894;
        }

        /* Progress bullet list mapping Stream badge as a bullet */
        .progress-list {
            padding: 0;
            margin: 8px 0;
        }
        .progress-item {
            list-style-type: none;
            position: relative;
            padding-left: 24px;
            margin-bottom: 8px;
            font-size: 11px;
            color: #333;
            line-height: 1.4;
        }
        .progress-item::before {
            content: "";
            position: absolute;
            left: 2px;
            top: 2px;
            width: 14px;
            height: 14px;
            background-image: url('${assets.badgeStream}');
            background-size: contain;
            background-repeat: no-repeat;
        }

        /* Signatures blocks */
        .sigs-row {
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            padding: 20px 10px 0 10px;
            page-break-inside: avoid;
        }

        .sig-box {
            text-align: center;
            width: 30%;
        }

        .sig-line {
            border-top: 1.5px solid rgba(184, 151, 46, 0.5);
            margin-bottom: 8px;
            width: 100%;
        }

        .sig-label {
            font-size: 10px;
            font-weight: 600;
            color: #777;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .ref-question {
            font-weight: 600;
            font-size: 11px;
            color: #444;
            margin-bottom: 3px;
        }
        .ref-answer {
            font-weight: 600;
            font-size: 12px;
            color: #2E5894;
            margin-bottom: 12px;
        }

        blockquote {
            margin: 8px 0;
            padding: 10px 15px;
            background: rgba(46, 88, 148, 0.05);
            border-left: 3px solid #2E5894;
            font-style: italic;
            font-size: 12px;
            color: #444;
            border-radius: 4px;
        }
    </style>
</head>
<body>
`;

    // ───────────────────────────────────────────────────────────
    // PAGE 1: COVER PAGE & ADMINISTRATIVE PROFILE (COMMON)
    // ───────────────────────────────────────────────────────────
    
    // Attendance calculations
    let attDaysTotal = 0;
    let workDaysTotal = 0;
    if (Array.isArray(studentData.family?.attendance)) {
        studentData.family.attendance.forEach(row => {
            attDaysTotal += parseFloat(row.attended) || 0;
            workDaysTotal += parseFloat(row.working) || 0;
        });
    }
    const totalAttendancePct = workDaysTotal > 0 ? ((attDaysTotal / workDaysTotal) * 100).toFixed(0) : "0";

    htmlContent += `
    <div class="page">
        <div class="page-bg ${getBg()}"></div>
        <div class="glow-overlay"></div>
        <div class="matte-shield"></div>
        <div class="page-border"></div>
        <div class="content-container">
            <div style="margin-top: 15mm; text-align: center;">
                <h1 class="cover-title">Holistic</h1>
                <h2 class="cover-subtitle">Progress Card</h2>
                <div class="flourish-divider"></div>
                <div style="font-family: 'Outfit', sans-serif; font-size: 14px; letter-spacing: 5px; color: #555; margin-top: 10px; text-transform: uppercase;">
                    Session 2025 - 2026
                </div>
            </div>

            <div class="glass-card" style="margin-top: 12mm;">
                <div class="info-grid">
                    <div class="info-item" style="grid-column: span 2;">
                        <div class="info-label">Institution Name</div>
                        <div class="info-value" style="font-size: 15px; font-weight: 700; color: #2E5894;">${escapeHtml(studentData.school?.name)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Institution Address</div>
                        <div class="info-value">${escapeHtml(studentData.school?.address1)}, ${escapeHtml(studentData.school?.address2)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Institution PIN Code</div>
                        <div class="info-value">${escapeHtml(studentData.school?.pincode)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Board Affiliation [E]</div>
                        <div class="info-value">${escapeHtml(studentData.school?.board)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">School UDISE Code</div>
                        <div class="info-value">${escapeHtml(studentData.school?.udiseCode)}</div>
                    </div>
                </div>
            </div>

            <div class="glass-card" style="margin-bottom: 10mm;">
                <div style="font-size: 11px; font-weight:700; color:#2E5894; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">STUDENT PROFILE & ADMINISTRATIVE DOSSIER</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Student Name</div>
                        <div class="info-value" style="font-weight:700; font-size: 14px; color:#2E5894;">${escapeHtml(studentData.profile?.name)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Class & Section</div>
                        <div class="info-value" style="font-weight: 600;">${escapeHtml(studentData.profile?.class)} - ${escapeHtml(studentData.profile?.sec)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date of Birth</div>
                        <div class="info-value">${escapeHtml(studentData.profile?.dob)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Registration Number</div>
                        <div class="info-value">${escapeHtml(studentData.profile?.reg)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Roll Number</div>
                        <div class="info-value">${escapeHtml(studentData.profile?.roll)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Teacher Code</div>
                        <div class="info-value" style="font-weight: 600;">${escapeHtml(studentData.profile?.teacherCode)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Gender</div>
                        <div class="info-value">${escapeHtml(studentData.profile?.gender)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Blood Group</div>
                        <div class="info-value">${escapeHtml(studentData.profile?.bloodGroup)}</div>
                    </div>
                    <div class="info-item" style="grid-column: span 2;">
                        <div class="info-label">Student Aadhaar Number</div>
                        <div class="info-value" style="color: #c0392b; font-weight: bold;">[Aadhaar Redacted]</div>
                    </div>
                    <div class="info-item" style="grid-column: span 2;">
                        <div class="info-label">Residential Address</div>
                        <div class="info-value">${escapeHtml(studentData.profile?.address)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Student PIN Code</div>
                        <div class="info-value">${escapeHtml(studentData.family?.pinCode || "NA")}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Contact Phone Number</div>
                        <div class="info-value">${escapeHtml(studentData.profile?.phone)}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    // ───────────────────────────────────────────────────────────
    // PAGE 2: PERSONAL DOSSIER & FAMILY & ATTENDANCE (COMMON)
    // ───────────────────────────────────────────────────────────
    const studentPhotoBase64 = studentData.a2?.photo ? (studentData.a2.photo.startsWith('data:') ? studentData.a2.photo : `data:image/png;base64,${studentData.a2.photo}`) : '';
    const familyPhotoBase64 = studentData.a2?.familyPhoto ? (studentData.a2.familyPhoto.startsWith('data:') ? studentData.a2.familyPhoto : `data:image/png;base64,${studentData.a2.familyPhoto}`) : '';

    htmlContent += `
    <div class="page">
        <div class="page-bg ${getBg()}"></div>
        <div class="glow-overlay"></div>
        <div class="matte-shield"></div>
        <div class="page-border"></div>
        <div class="content-container">
            <div class="section-title">Personal Portrait & Family Profiles</div>
            
            <div class="polaroid-box">
                <div class="polaroid-card">
                    ${studentPhotoBase64 ? `<img src="${studentPhotoBase64}" class="polaroid-img" />` : `<div class="polaroid-img" style="display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;">No Photo</div>`}
                    <div class="polaroid-caption">${escapeHtml(studentData.profile?.name)}</div>
                </div>
                <div class="polaroid-card right">
                    ${familyPhotoBase64 ? `<img src="${familyPhotoBase64}" class="polaroid-img" />` : `<div class="polaroid-img" style="display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;">No Photo</div>`}
                    <div class="polaroid-caption">My Loving Family</div>
                </div>
            </div>

            <div class="glass-card" style="margin-bottom: 12px;">
                <div style="font-size: 11px; font-weight:700; color:#2E5894; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Family Demographics & Socio-Language Indicators</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Mother's Name</div>
                        <div class="info-value" style="font-weight:600;">${escapeHtml(studentData.family?.motherName || "NA")}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Mother's Education</div>
                        <div class="info-value">${escapeHtml(studentData.family?.motherEducation || "NA")}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Father's Name</div>
                        <div class="info-value" style="font-weight:600;">${escapeHtml(studentData.family?.fatherName || "NA")}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Father's Education</div>
                        <div class="info-value">${escapeHtml(studentData.family?.fatherEducation || "NA")}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Mother Tongue</div>
                        <div class="info-value">${escapeHtml(studentData.profile?.motherTongue)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Medium of Instruction</div>
                        <div class="info-value">${escapeHtml(studentData.profile?.mediumOfInstruction)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Rural / Urban Indicator</div>
                        <div class="info-value" style="text-transform: capitalize;">${escapeHtml(studentData.profile?.ruralUrban === 'U' || studentData.profile?.ruralUrban === 'urban' ? 'Urban' : studentData.profile?.ruralUrban === 'R' || studentData.profile?.ruralUrban === 'rural' ? 'Rural' : studentData.profile?.ruralUrban)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Siblings Information</div>
                        <div class="info-value">${studentData.family?.siblingsCount || "0"} Sibling(s) ${studentData.family?.siblingsAge ? `(Ages: ${escapeHtml(studentData.family.siblingsAge)})` : ""}</div>
                    </div>
                </div>
            </div>

            <div class="section-title" style="margin-top: 8px;">Session Attendance Breakdown (Percentage: ${totalAttendancePct}%)</div>
            <table class="att-table">
                <thead>
                    <tr>
                        <th class="month-header">Metric</th>
                        ${(studentData.family?.attendance || []).map(row => `<th class="month-header">${escapeHtml(row.month)}</th>`).join('')}
                        <th class="month-header">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight: bold; font-size: 9px;">Working</td>
                        ${(studentData.family?.attendance || []).map(row => `<td>${escapeHtml(row.working)}</td>`).join('')}
                        <td style="font-weight: bold;">${workDaysTotal}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; font-size: 9px;">Attended</td>
                        ${(studentData.family?.attendance || []).map(row => `<td>${escapeHtml(row.attended)}</td>`).join('')}
                        <td style="font-weight: bold;">${attDaysTotal}</td>
                    </tr>
                </tbody>
            </table>
            
            ${studentData.family?.lowAttendanceReason ? `
                <div class="glass-card" style="margin-top: 10px; padding: 12px; border: 1px dashed rgba(184, 151, 46, 0.4);">
                    <div class="info-label" style="color:#c0392b;">Low Attendance Explanation Remarks</div>
                    <div style="font-size: 11px; color:#555; line-height: 1.4; font-style: italic;">
                        "${escapeHtml(studentData.family.lowAttendanceReason)}"
                    </div>
                </div>
            ` : ""}
        </div>
    </div>
    `;

    // ───────────────────────────────────────────────────────────
    // STAGE 1: FOUNDATIONAL ROUTE
    // ───────────────────────────────────────────────────────────
    if (stage === 1) {
        // Page 3: About Me Details
        const parentObs = studentData.assessments?.parentObservation || {};
        const parentResourcesList = parentObs.resources || studentData.assessments?.parentResources || [];
        const parentRemarksText = parentObs.remarks || studentData.assessments?.parentRemarks || "No parent remarks submitted yet.";

        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">About Me (Student Voice)</div>
                <div class="glass-card" style="margin-bottom: 12px;">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Age</div>
                            <div class="info-value">${escapeHtml(studentData.a2?.age || "NA")} Years Old</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Birthday</div>
                            <div class="info-value">${escapeHtml(studentData.a2?.birthday || "NA")} (DOB: ${escapeHtml(studentData.profile?.dob)})</div>
                        </div>
                        <div class="info-item" style="grid-column: span 2;">
                            <div class="info-label">Residential Town</div>
                            <div class="info-value">${escapeHtml(studentData.a2?.liveIn || "NA")}</div>
                        </div>
                        <div class="info-item" style="grid-column: span 2;">
                            <div class="info-label">Future Aspiration</div>
                            <div class="info-value" style="font-family:'Caveat', cursive; font-size:18px; color:#2E5894;">💎 When I grow up, I want to be a: ${escapeHtml(studentData.a2?.aspiration || "NA")}</div>
                        </div>
                        <div class="info-item" style="grid-column: span 2;">
                            <div class="info-label">My Best Friends</div>
                            <div class="info-value">🔮 ${escapeHtml(Array.isArray(studentData.a2?.friends) ? studentData.a2.friends.filter(f => f).join(', ') : studentData.a2?.friends || "NA")}</div>
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="margin-bottom: 12px;">
                    <div class="info-label" style="margin-bottom: 10px; color: #2E5894; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">My 6 Absolute Favorites</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        <div class="metallic-cell" style="padding: 8px; background: rgba(255,255,255,0.7); border: 1.5px solid rgba(184, 151, 46, 0.35);">
                            <div style="font-size: 7.5px; font-weight:700; color:#8C733E; text-transform: uppercase; letter-spacing: 0.5px;">🎨 Colour</div>
                            <div style="font-size: 10.5px; font-weight:600; color:#222; margin-top: 3px;">${escapeHtml(studentData.preferences?.colour || studentData.preferences?.color || studentData.a2?.favourites?.colour || "NA")}</div>
                        </div>
                        <div class="metallic-cell" style="padding: 8px; background: rgba(255,255,255,0.7); border: 1.5px solid rgba(184, 151, 46, 0.35);">
                            <div style="font-size: 7.5px; font-weight:700; color:#8C733E; text-transform: uppercase; letter-spacing: 0.5px;">🌸 Flower</div>
                            <div style="font-size: 10.5px; font-weight:600; color:#222; margin-top: 3px;">${escapeHtml(studentData.preferences?.flower || studentData.a2?.favourites?.flower || "NA")}</div>
                        </div>
                        <div class="metallic-cell" style="padding: 8px; background: rgba(255,255,255,0.7); border: 1.5px solid rgba(184, 151, 46, 0.35);">
                            <div style="font-size: 7.5px; font-weight:700; color:#8C733E; text-transform: uppercase; letter-spacing: 0.5px;">🍕 Food</div>
                            <div style="font-size: 10.5px; font-weight:600; color:#222; margin-top: 3px;">${escapeHtml(studentData.preferences?.food || studentData.a2?.favourites?.food || "NA")}</div>
                        </div>
                        <div class="metallic-cell" style="padding: 8px; background: rgba(255,255,255,0.7); border: 1.5px solid rgba(184, 151, 46, 0.35);">
                            <div style="font-size: 7.5px; font-weight:700; color:#8C733E; text-transform: uppercase; letter-spacing: 0.5px;">⚽ Sport</div>
                            <div style="font-size: 10.5px; font-weight:600; color:#222; margin-top: 3px;">${escapeHtml(studentData.preferences?.sport || studentData.a2?.favourites?.sport || "NA")}</div>
                        </div>
                        <div class="metallic-cell" style="padding: 8px; background: rgba(255,255,255,0.7); border: 1.5px solid rgba(184, 151, 46, 0.35);">
                            <div style="font-size: 7.5px; font-weight:700; color:#8C733E; text-transform: uppercase; letter-spacing: 0.5px;">🐯 Animal</div>
                            <div style="font-size: 10.5px; font-weight:600; color:#222; margin-top: 3px;">${escapeHtml(studentData.preferences?.animal || studentData.a2?.favourites?.animal || "NA")}</div>
                        </div>
                        <div class="metallic-cell" style="padding: 8px; background: rgba(255,255,255,0.7); border: 1.5px solid rgba(184, 151, 46, 0.35);">
                            <div style="font-size: 7.5px; font-weight:700; color:#8C733E; text-transform: uppercase; letter-spacing: 0.5px;">📚 Subject</div>
                            <div style="font-size: 10.5px; font-weight:600; color:#222; margin-top: 3px;">${escapeHtml(studentData.preferences?.subject || studentData.preferences?.hobby || studentData.a2?.favourites?.subject || "NA")}</div>
                        </div>
                    </div>
                </div>

                <div class="section-title" style="margin-top: 8px;">Parent Survey & Partnership</div>
                <div class="glass-card" style="margin-bottom: 5px;">
                    <div class="info-label">Learning Resources Available at Home</div>
                    <div style="margin-top: 4px; margin-bottom: 10px;">
                        ${parentResourcesList.map(r => `<span class="chip gold-chip">${escapeHtml(r)}</span>`).join('') || "<span style='font-size:11px;color:#aaa;'>No standard resources specified.</span>"}
                    </div>
                    <div class="info-label">Parent Observation & Reflections</div>
                    <blockquote style="font-size: 11px; margin-top: 4px; padding: 8px 12px;">
                        "${escapeHtml(parentRemarksText)}"
                    </blockquote>
                </div>
            </div>
        </div>
        `;

        const foundationalDomains = [
            "Physical Development",
            "Socio-Emotional & Ethical Development",
            "Language & Literacy Development",
            "Cognitive Development",
            "Aesthetic & Cultural Development",
            "Positive Habits"
        ];

        const dsData = studentData.assessments?.domainsData || {};

        foundationalDomains.forEach((domainName, idx) => {
            const activeDetails = dsData[domainName] || {};
            const goals = activeDetails.goals || [];
            const competencies = activeDetails.competencies || [];
            const activitiesDesc = activeDetails.activities || "";
            const m1 = activeDetails.matrix1 || {};
            const feedback = activeDetails.teacherFeedback || "";

            // Self-assessment details specific to this domain
            const selfLikedVal = activeDetails.selfLiked || "";
            const selfEasyVal = activeDetails.selfEasy || "";
            const selfNeededList = activeDetails.selfNeeded || [];

            // Peer-assessment details specific to this domain
            const peerLikedVal = activeDetails.peerLiked || "";
            const peerEasyVal = activeDetails.peerEasy || "";
            const peerNeededList = activeDetails.peerNeeded || [];

            // Parent comments specific to this domain
            const parentRemText = activeDetails.parentRemarks || "";

            // Page A: Curricular Framework & Developmental Rubric Matrix
            htmlContent += `
            <div class="page">
                <div class="page-bg ${getBg()}"></div>
                <div class="glow-overlay"></div>
                <div class="matte-shield"></div>
                <div class="page-border"></div>
                <div class="content-container">
                    <div class="section-title">Domain D${idx + 1}: ${domainName} (Part A)</div>
                    
                    <div class="glass-card" style="margin-bottom: 12px;">
                        <div class="info-grid">
                            <div class="info-item" style="grid-column: span 2;">
                                <div class="info-label">Curricular Goals</div>
                                <div style="margin-top: 4px;">
                                    ${goals.length > 0 ? goals.map(g => `<span class="chip cyber-chip">${escapeHtml(g)}</span>`).join('') : "No goals mapped"}
                                </div>
                            </div>
                            <div class="info-item" style="grid-column: span 2;">
                                <div class="info-label">Target Competencies</div>
                                <div style="margin-top: 4px;">
                                    ${competencies.length > 0 ? competencies.map(c => `<span class="chip gold-chip">${escapeHtml(c)}</span>`).join('') : "No competencies mapped"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="glass-card" style="margin-bottom: 12px;">
                        <div class="info-label">Supporting Classroom Activities & Process</div>
                        <blockquote style="font-size: 11px; padding: 10px 15px; margin: 4px 0;">
                            ${escapeHtml(activitiesDesc) || "Activities not specified."}
                        </blockquote>
                    </div>

                    <div class="section-title" style="margin-top: 8px;">Developmental Rubric Matrix</div>
                    <table class="rubric-table">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Criteria</th>
                                <th style="width: 25%;"><span class="badge-stream" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></span> Stream (Initial)</th>
                                <th style="width: 25%;"><span class="badge-mountain" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></span> Mountain (Growing)</th>
                                <th style="width: 25%;"><span class="badge-sky" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></span> Sky (Advanced)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${["Awareness", "Sensitivity", "Creativity"].map((ability, r) => `
                                <tr>
                                    <td class="rubric-row-title">${ability}</td>
                                    ${[0, 1, 2].map(c => {
                                        const val = m1[`${r}-${c}`] || '';
                                        const isActive = val.trim().length > 0;
                                        let gemIcon = '';
                                        if (isActive) {
                                            if (c === 0) gemIcon = `<span class="badge-stream gem-rating-icon"></span>`;
                                            if (c === 1) gemIcon = `<span class="badge-mountain gem-rating-icon"></span>`;
                                            if (c === 2) gemIcon = `<span class="badge-sky gem-rating-icon"></span>`;
                                        }
                                        return `<td class="matrix-cell-content ${isActive ? 'active' : ''}">${gemIcon} ${escapeHtml(val) || '-'}</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            `;

            // Helper to get styled vibe check emoji
            const getVibeIcon = (v) => {
                if (!v) return "<span style='color:#aaa;'>NA</span>";
                const val = v.toString().toLowerCase().trim();
                if (val === 'yes') return "😊 <span style='color: #27ae60; font-weight: bold;'>Yes</span>";
                if (val === 'no') return "😟 <span style='color: #c0392b; font-weight: bold;'>No</span>";
                return "🤔 <span style='color: #d35400; font-weight: bold;'>Don't Know</span>";
            };

            // Page B: Domain Co-Scholastic Reflections & qualitative remarks
            htmlContent += `
            <div class="page">
                <div class="page-bg ${getBg()}"></div>
                <div class="glow-overlay"></div>
                <div class="matte-shield"></div>
                <div class="page-border"></div>
                <div class="content-container">
                    <div class="section-title">Domain D${idx + 1}: ${domainName} (Part B)</div>

                    <div class="glass-card" style="margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <div style="font-size: 10px; font-weight:700; color:#2E5894; margin-bottom: 6px; text-transform: uppercase;">Student Self-Reflection</div>
                            <div style="font-size:11px; margin-bottom: 4px;">I liked doing this work: ${getVibeIcon(selfLikedVal)}</div>
                            <div style="font-size:11px; margin-bottom: 6px;">I found this work easy: ${getVibeIcon(selfEasyVal)}</div>
                            <div style="font-size:9px; font-weight:700; color:#777;">Support needed:</div>
                            <div style="margin-top: 4px;">
                                ${selfNeededList.length > 0 ? selfNeededList.map(n => `<span class="chip" style="padding: 2px 6px; font-size: 8px;">${escapeHtml(n)}</span>`).join('') : "<span style='font-size:10px;color:#aaa;'>None needed</span>"}
                            </div>
                        </div>
                        <div style="border-left: 1px solid rgba(0,0,0,0.05); padding-left: 12px;">
                            <div style="font-size: 10px; font-weight:700; color:#2E5894; margin-bottom: 6px; text-transform: uppercase;">Peer Reflection</div>
                            <div style="font-size:11px; margin-bottom: 4px;">Friend liked this work: ${getVibeIcon(peerLikedVal)}</div>
                            <div style="font-size:11px; margin-bottom: 6px;">Friend found it easy: ${getVibeIcon(peerEasyVal)}</div>
                            <div style="font-size:9px; font-weight:700; color:#777;">Support friend needed:</div>
                            <div style="margin-top: 4px;">
                                ${peerNeededList.length > 0 ? peerNeededList.map(n => `<span class="chip" style="padding: 2px 6px; font-size: 8px;">${escapeHtml(n)}</span>`).join('') : "<span style='font-size:10px;color:#aaa;'>None needed</span>"}
                            </div>
                        </div>
                    </div>

                    ${parentRemText ? `
                    <div class="glass-card" style="margin-bottom: 12px;">
                        <div class="info-label">Parent / Caregiver Observation Remarks</div>
                        <blockquote style="font-size: 11px; margin-top: 4px; padding: 8px 12px;">
                            "${escapeHtml(parentRemText)}"
                        </blockquote>
                    </div>
                    ` : ""}

                    <div class="glass-card" style="margin-top: 8px;">
                        <div class="info-label">Teacher's consolidated Domain Remarks</div>
                        <blockquote style="font-size:12px; line-height:1.4; margin-top: 6px; color:#2E5894; border-left-color: #B8972E;">
                            "${escapeHtml(feedback) || "Domain feedback and observations not yet submitted by teacher."}"
                        </blockquote>
                    </div>
                </div>
            </div>
            `;
        });

        // Stage 1 Summary Reflections
        const selfPeer = studentData.assessments?.selfPeer || {};
        const selfL = selfPeer.selfLiked || studentData.assessments?.selfLiked || "NA";
        const selfE = selfPeer.selfEasy || studentData.assessments?.selfEasy || "NA";
        const selfN = selfPeer.selfNeeded || [];

        const peerL = selfPeer.peerLiked || "NA";
        const peerE = selfPeer.peerEasy || "NA";
        const peerN = selfPeer.peerNeeded || [];

        const teacherRemarks = studentData.assessments?.teacherFeedback || studentData.assessments?.remarks || "NA";
        const rubTable = studentData.assessments?.rubricTable || {};

        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Co-Scholastic Self & Peer Reflections</div>
                
                <div class="glass-card" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 11px; font-weight:700; color:#2E5894; margin-bottom: 6px; text-transform: uppercase;">Self Reflection Summary</div>
                        <div class="ref-question">Did I enjoy playing the learning activities?</div>
                        <div class="ref-answer">😊 ${escapeHtml(selfL)}</div>
                        <div class="ref-question">Did I find the learning games easy?</div>
                        <div class="ref-answer">🎲 ${escapeHtml(selfE)}</div>
                    </div>
                    <div style="border-left: 1px solid rgba(0,0,0,0.05); padding-left: 12px;">
                        <div style="font-size: 11px; font-weight:700; color:#2E5894; margin-bottom: 6px; text-transform: uppercase;">Peer Reflection Summary</div>
                        <div class="ref-question">Did my friend enjoy the activities?</div>
                        <div class="ref-answer">😊 ${escapeHtml(peerL)}</div>
                        <div class="ref-question">Did my friend find them easy?</div>
                        <div class="ref-answer">🎲 ${escapeHtml(peerE)}</div>
                    </div>
                </div>

                <div class="section-title">Teacher's Consolidated Rubric Evaluation</div>
                <table class="rubric-table" style="margin-bottom: 15px;">
                    <thead>
                        <tr>
                            <th style="width: 25%;">Mastery Level</th>
                            <th style="width: 25%;"><span class="badge-stream" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Stream (Initial)</th>
                            <th style="width: 25%;"><span class="badge-mountain" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Mountain (Growing)</th>
                            <th style="width: 25%;"><span class="badge-sky" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Sky (Advanced)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${["Awareness", "Sensitivity", "Creativity"].map((ability, r) => `
                            <tr>
                                <td class="rubric-row-title">${ability}</td>
                                ${[0, 1, 2].map(c => {
                                    const val = rubTable[`${r}-${c}`] || '';
                                    const isActive = val.trim().length > 0;
                                    let gemIcon = '';
                                    if (isActive) {
                                        if (c === 0) gemIcon = `<span class="badge-stream gem-rating-icon"></span>`;
                                        if (c === 1) gemIcon = `<span class="badge-mountain gem-rating-icon"></span>`;
                                        if (c === 2) gemIcon = `<span class="badge-sky gem-rating-icon"></span>`;
                                    }
                                    return `<td class="matrix-cell-content ${isActive ? 'active' : ''}">${gemIcon} ${escapeHtml(val) || '-'}</td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="glass-card" style="margin-bottom: 5px;">
                    <div class="info-label" style="font-weight:700;">Teacher Consolidated Observations</div>
                    <blockquote style="font-size: 12px; line-height: 1.5; color:#2E5894; margin-top: 6px; padding: 10px 15px; border-left-color: #B8972E;">
                        "${escapeHtml(teacherRemarks)}"
                    </blockquote>
                </div>

                <div class="sigs-row" style="margin-top: auto;">
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div class="sig-label">Class Teacher</div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div class="sig-label">Principal</div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div class="sig-label">Parent Signature</div>
                    </div>
                </div>
            </div>
        </div>
        `;

        // ───────────────────────────────────────────────────────────
        // PART C: YEAR-END EVALUATION / SCHOOL READINESS SUMMARY (STAGE 1)
        // ───────────────────────────────────────────────────────────
        const dmV2 = studentData.assessments?.domainMatricesV2 || {};
        const partCDomains = [
            { key: 'd1', title: 'Physical Development', icon: '🏃', color: '#2E5894' },
            { key: 'd2', title: 'Socio-Emotional', icon: '💛', color: '#B8972E' },
            { key: 'd3', title: 'Cognitive', icon: '🧠', color: '#2E8B57' },
            { key: 'd4', title: 'Language & Literacy', icon: '📖', color: '#2E5894' },
            { key: 'd5', title: 'Aesthetic & Cultural', icon: '🎨', color: '#8C1B1B' },
            { key: 'd6', title: 'Positive Learning Habits', icon: '🌟', color: '#B8972E' }
        ];

        // Page C1: Domains 1 to 3
        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Part C: Year-End Summary & School Readiness (Page 1)</div>
                
                ${partCDomains.slice(0, 3).map((dom, di) => {
                    const cMatrix = dmV2[dom.key] || {};
                    return `
                    <div class="glass-card" style="margin-bottom: 12px; padding: 12px;">
                        <div style="font-size: 11px; font-weight:700; color:${dom.color}; margin-bottom: 6px; text-transform: uppercase;">
                            ${dom.icon} ${dom.title} Assessment Matrix
                        </div>
                        <table class="rubric-table" style="margin-top: 5px;">
                            <thead>
                                <tr>
                                    <th style="width: 25%; background:${dom.color};">Criteria</th>
                                    <th style="width: 25%; background:${dom.color};"><span class="badge-stream" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Stream</th>
                                    <th style="width: 25%; background:${dom.color};"><span class="badge-mountain" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Mountain</th>
                                    <th style="width: 25%; background:${dom.color};"><span class="badge-sky" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Sky</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${["Awareness", "Sensitivity", "Creativity"].map((ability, r) => `
                                    <tr>
                                        <td class="rubric-row-title" style="font-size:8px;">${ability}</td>
                                        ${[0, 1, 2].map(c => {
                                            const val = cMatrix[`${r}-${c}`] || '';
                                            const isActive = val.trim().length > 0;
                                            let gemIcon = '';
                                            if (isActive) {
                                                if (c === 0) gemIcon = `<span class="badge-stream gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                                if (c === 1) gemIcon = `<span class="badge-mountain gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                                if (c === 2) gemIcon = `<span class="badge-sky gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                            }
                                            return `<td class="matrix-cell-content ${isActive ? 'active' : ''}" style="font-size: 8.5px; padding: 4px;">${gemIcon} ${escapeHtml(val) || '-'}</td>`;
                                        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;

        // Page C2: Domains 4 to 6
        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Part C: Year-End Summary & School Readiness (Page 2)</div>
                
                ${partCDomains.slice(3, 6).map((dom, di) => {
                    const cMatrix = dmV2[dom.key] || {};
                    return `
                    <div class="glass-card" style="margin-bottom: 12px; padding: 12px;">
                        <div style="font-size: 11px; font-weight:700; color:${dom.color}; margin-bottom: 6px; text-transform: uppercase;">
                            ${dom.icon} ${dom.title} Assessment Matrix
                        </div>
                        <table class="rubric-table" style="margin-top: 5px;">
                            <thead>
                                <tr>
                                    <th style="width: 25%; background:${dom.color};">Criteria</th>
                                    <th style="width: 25%; background:${dom.color};"><span class="badge-stream" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Stream</th>
                                    <th style="width: 25%; background:${dom.color};"><span class="badge-mountain" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Mountain</th>
                                    <th style="width: 25%; background:${dom.color};"><span class="badge-sky" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Sky</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${["Awareness", "Sensitivity", "Creativity"].map((ability, r) => `
                                    <tr>
                                        <td class="rubric-row-title" style="font-size:8px;">${ability}</td>
                                        ${[0, 1, 2].map(c => {
                                            const val = cMatrix[`${r}-${c}`] || '';
                                            const isActive = val.trim().length > 0;
                                            let gemIcon = '';
                                            if (isActive) {
                                                if (c === 0) gemIcon = `<span class="badge-stream gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                                if (c === 1) gemIcon = `<span class="badge-mountain gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                                if (c === 2) gemIcon = `<span class="badge-sky gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                            }
                                            return `<td class="matrix-cell-content ${isActive ? 'active' : ''}" style="font-size: 8.5px; padding: 4px;">${gemIcon} ${escapeHtml(val) || '-'}</td>`;
                                        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;
    }

    // ───────────────────────────────────────────────────────────
    // STAGE 2: PREPARATORY ROUTE
    // ───────────────────────────────────────────────────────────
    if (stage === 2) {
        // Preparatory About Me
        const goodAt = studentData.a2?.goodAt || "NA";
        const improveSkill = studentData.a2?.improveSkill || "NA";
        const likeTo = studentData.a2?.likeTo || "NA";
        const dontLikeTo = studentData.a2?.dontLikeTo || "NA";
        const heroName = studentData.a2?.heroName || "NA";
        const heroPhotoBase64 = studentData.a2?.heroPhoto ? (studentData.a2.heroPhoto.startsWith('data:') ? studentData.a2.heroPhoto : `data:image/png;base64,${studentData.a2.heroPhoto}`) : '';

        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Personal Portraits (Student & Hero)</div>
                <div class="polaroid-box">
                    <div class="polaroid-card">
                        ${studentPhotoBase64 ? `<img src="${studentPhotoBase64}" class="polaroid-img" />` : `<div class="polaroid-img" style="display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;">No Photo</div>`}
                        <div class="polaroid-caption">${escapeHtml(studentData.profile?.name)}</div>
                    </div>
                    <div class="polaroid-card">
                        ${familyPhotoBase64 ? `<img src="${familyPhotoBase64}" class="polaroid-img" />` : `<div class="polaroid-img" style="display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;">No Photo</div>`}
                        <div class="polaroid-caption">My Family</div>
                    </div>
                    <div class="polaroid-card right">
                        ${heroPhotoBase64 ? `<img src="${heroPhotoBase64}" class="polaroid-img" />` : `<div class="polaroid-img" style="display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;">No Photo</div>`}
                        <div class="polaroid-caption">My Hero: ${escapeHtml(heroName)}</div>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="info-grid">
                        <div class="info-item" style="grid-column: span 2;">
                            <div class="info-label">What I'm Good At</div>
                            <div class="info-value">${escapeHtml(goodAt)}</div>
                        </div>
                        <div class="info-item" style="grid-column: span 2;">
                            <div class="info-label">Skills I Want to Improve</div>
                            <div class="info-value">${escapeHtml(improveSkill)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Activities I Enjoy</div>
                            <div class="info-value">${escapeHtml(likeTo)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Things I Dislike</div>
                            <div class="info-value">${escapeHtml(dontLikeTo)}</div>
                        </div>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="info-label" style="margin-bottom: 10px;">My Key Strengths & Favorites (Grid Mapping)</div>
                    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                        <div class="metallic-cell">
                            <div style="font-size: 8px; font-weight:700; color:#777;">FAVORITE FOOD</div>
                            <div style="margin-top: 4px;">${(studentData.a2?.favFood || []).join(', ') || 'NA'}</div>
                        </div>
                        <div class="metallic-cell">
                            <div style="font-size: 8px; font-weight:700; color:#777;">GAMES PLAYED</div>
                            <div style="margin-top: 4px;">${(studentData.a2?.favGames || []).join(', ') || 'NA'}</div>
                        </div>
                        <div class="metallic-cell">
                            <div style="font-size: 8px; font-weight:700; color:#777;">FESTIVALS</div>
                            <div style="margin-top: 4px;">${(studentData.a2?.favFestivals || []).join(', ') || 'NA'}</div>
                        </div>
                        <div class="metallic-cell">
                            <div style="font-size: 8px; font-weight:700; color:#777;">THINGS TO LEARN</div>
                            <div style="margin-top: 4px;">${(studentData.a2?.favThingsToLearn || []).join(', ') || 'NA'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        const prepDomains = [
            "Language 1 (Mother Tongue)",
            "Language 2 (English/Second Language)",
            "Mathematics",
            "Environmental Studies",
            "Art & Aesthetic Education",
            "Physical Education & Play"
        ];

        const dsData = studentData.assessments?.domainsData || {};

        prepDomains.forEach((domainName, idx) => {
            const activeDetails = dsData[domainName] || {};
            const goals = activeDetails.goals || [];
            const competencies = activeDetails.competencies || [];
            const activitiesDesc = activeDetails.activities || "";
            const m1 = activeDetails.matrix1 || {};
            const m2 = activeDetails.matrix2 || {};
            
            const level1 = activeDetails.matrix1Level || "None";
            const level2 = activeDetails.matrix2Level || "None";

            const feedback = activeDetails.teacherFeedback || "";
            const challenges = activeDetails.teacherChallenges || "";
            const solutions = activeDetails.teacherSolutions || "";

            // Self-assessment details specific to this domain
            const selfLikedVal = activeDetails.selfLiked || "";
            const selfEasyVal = activeDetails.selfEasy || "";
            const selfNeededList = activeDetails.selfNeeded || [];

            // Peer-assessment details specific to this domain
            const peerLikedVal = activeDetails.peerLiked || "";
            const peerEasyVal = activeDetails.peerEasy || "";
            const peerNeededList = activeDetails.peerNeeded || [];

            // Parent remarks specific to this domain
            const parentRemText = activeDetails.parentRemarks || "";

            // Page A: Preparatory Goals, Competencies, and Term 1 & 2 Rubric Tables
            htmlContent += `
            <div class="page">
                <div class="page-bg ${getBg()}"></div>
                <div class="glow-overlay"></div>
                <div class="matte-shield"></div>
                <div class="page-border"></div>
                <div class="content-container">
                    <div class="section-title">Domain D${idx + 1}: ${domainName} (Part A)</div>
                    
                    <div class="glass-card" style="margin-bottom: 10px;">
                        <div class="info-grid">
                            <div class="info-item" style="grid-column: span 2;">
                                <div class="info-label">Curricular Goals</div>
                                <div style="margin-top: 2px;">
                                    ${goals.length > 0 ? goals.map(g => `<span class="chip cyber-chip">${escapeHtml(g)}</span>`).join('') : "No goals specified"}
                                </div>
                            </div>
                            <div class="info-item" style="grid-column: span 2;">
                                <div class="info-label">Target Competencies</div>
                                <div style="margin-top: 2px;">
                                    ${competencies.length > 0 ? competencies.map(c => `<span class="chip gold-chip">${escapeHtml(c)}</span>`).join('') : "No competencies specified"}
                                </div>
                            </div>
                            <div class="info-item" style="grid-column: span 2; border-bottom:0; padding-bottom:0;">
                                <div class="info-label">Supporting Classroom Activities</div>
                                <blockquote style="margin: 4px 0 0 0; font-size:11px; padding: 6px 12px;">
                                    ${escapeHtml(activitiesDesc) || "No activity observations logged yet."}
                                </blockquote>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 3px;">
                        <span class="section-title" style="margin:0; font-size:11px;">Progress Rubric Matrices</span>
                        <div>
                            ${getBadgeIcon(level1) ? `<span class="chip cyber-chip" style="font-size: 7px; padding: 2px 6px;"><img src="${getBadgeIcon(level1)}" style="width:10px;height:10px;vertical-align:middle;margin-right:3px;" /> T1 Level: ${escapeHtml(level1)}</span>` : ""}
                            ${getBadgeIcon(level2) ? `<span class="chip gold-chip" style="font-size: 7px; padding: 2px 6px;"><img src="${getBadgeIcon(level2)}" style="width:10px;height:10px;vertical-align:middle;margin-right:3px;" /> T2 Level: ${escapeHtml(level2)}</span>` : ""}
                        </div>
                    </div>

                    <div style="font-size: 8.5px; font-weight: 700; color: #8C733E; text-transform: uppercase; margin-bottom: 3px;">Term 1 Assessment Matrix</div>
                    <table class="rubric-table" style="margin-bottom: 10px;">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Criteria</th>
                                <th style="width: 25%;"><span class="badge-stream" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Stream</th>
                                <th style="width: 25%;"><span class="badge-mountain" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Mountain</th>
                                <th style="width: 25%;"><span class="badge-sky" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Sky</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${["Awareness", "Sensitivity", "Creativity"].map((ability, r) => `
                                <tr>
                                    <td class="rubric-row-title">${ability}</td>
                                    ${[0, 1, 2].map(c => {
                                        const val = m1[`${r}-${c}`] || '';
                                        const isActive = val.trim().length > 0;
                                        let gemIcon = '';
                                        if (isActive) {
                                            if (c === 0) gemIcon = `<span class="badge-stream gem-rating-icon"></span>`;
                                            if (c === 1) gemIcon = `<span class="badge-mountain gem-rating-icon"></span>`;
                                            if (c === 2) gemIcon = `<span class="badge-sky gem-rating-icon"></span>`;
                                        }
                                        return `<td class="matrix-cell-content ${isActive ? 'active' : ''}">${gemIcon} ${escapeHtml(val) || '-'}</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div style="font-size: 8.5px; font-weight: 700; color: #8C733E; text-transform: uppercase; margin-bottom: 3px;">Term 2 Assessment Matrix</div>
                    <table class="rubric-table">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Criteria</th>
                                <th style="width: 25%;"><span class="badge-stream" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Stream</th>
                                <th style="width: 25%;"><span class="badge-mountain" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Mountain</th>
                                <th style="width: 25%;"><span class="badge-sky" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Sky</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${["Awareness", "Sensitivity", "Creativity"].map((ability, r) => `
                                <tr>
                                    <td class="rubric-row-title">${ability}</td>
                                    ${[0, 1, 2].map(c => {
                                        const val = m2[`${r}-${c}`] || '';
                                        const isActive = val.trim().length > 0;
                                        let gemIcon = '';
                                        if (isActive) {
                                            if (c === 0) gemIcon = `<span class="badge-stream gem-rating-icon"></span>`;
                                            if (c === 1) gemIcon = `<span class="badge-mountain gem-rating-icon"></span>`;
                                            if (c === 2) gemIcon = `<span class="badge-sky gem-rating-icon"></span>`;
                                        }
                                        return `<td class="matrix-cell-content ${isActive ? 'active' : ''}">${gemIcon} ${escapeHtml(val) || '-'}</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            `;

            // Helper to get styled vibe check emoji
            const getVibeIcon = (v) => {
                if (!v) return "<span style='color:#aaa;'>NA</span>";
                const val = v.toString().toLowerCase().trim();
                if (val === 'yes') return "😊 <span style='color: #27ae60; font-weight: bold;'>Yes</span>";
                if (val === 'no') return "😟 <span style='color: #c0392b; font-weight: bold;'>No</span>";
                return "🤔 <span style='color: #d35400; font-weight: bold;'>Don't Know</span>";
            };

            // Page B: Preparatory Co-Scholastic Reflections & qualitative teacher comments + challenges & supports
            htmlContent += `
            <div class="page">
                <div class="page-bg ${getBg()}"></div>
                <div class="glow-overlay"></div>
                <div class="matte-shield"></div>
                <div class="page-border"></div>
                <div class="content-container">
                    <div class="section-title">Domain D${idx + 1}: ${domainName} (Part B)</div>

                    <div class="glass-card" style="margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <div style="font-size: 10px; font-weight:700; color:#2E5894; margin-bottom: 6px; text-transform: uppercase;">Student Self-Reflection</div>
                            <div style="font-size:11px; margin-bottom: 4px;">I liked doing this work: ${getVibeIcon(selfLikedVal)}</div>
                            <div style="font-size:11px; margin-bottom: 6px;">I found this work easy: ${getVibeIcon(selfEasyVal)}</div>
                            <div style="font-size:9px; font-weight:700; color:#777;">Support needed:</div>
                            <div style="margin-top: 4px;">
                                ${selfNeededList.length > 0 ? selfNeededList.map(n => `<span class="chip" style="padding: 2px 6px; font-size: 8px;">${escapeHtml(n)}</span>`).join('') : "<span style='font-size:10px;color:#aaa;'>None needed</span>"}
                            </div>
                        </div>
                        <div style="border-left: 1px solid rgba(0,0,0,0.05); padding-left: 12px;">
                            <div style="font-size: 10px; font-weight:700; color:#2E5894; margin-bottom: 6px; text-transform: uppercase;">Peer Reflection</div>
                            <div style="font-size:11px; margin-bottom: 4px;">Friend liked this work: ${getVibeIcon(peerLikedVal)}</div>
                            <div style="font-size:11px; margin-bottom: 6px;">Friend found it easy: ${getVibeIcon(peerEasyVal)}</div>
                            <div style="font-size:9px; font-weight:700; color:#777;">Support friend needed:</div>
                            <div style="margin-top: 4px;">
                                ${peerNeededList.length > 0 ? peerNeededList.map(n => `<span class="chip" style="padding: 2px 6px; font-size: 8px;">${escapeHtml(n)}</span>`).join('') : "<span style='font-size:10px;color:#aaa;'>None needed</span>"}
                            </div>
                        </div>
                    </div>

                    ${parentRemText ? `
                    <div class="glass-card" style="margin-bottom: 12px;">
                        <div class="info-label">Parent / Caregiver Observation Remarks</div>
                        <blockquote style="font-size: 11px; margin-top: 4px; padding: 8px 12px;">
                            "${escapeHtml(parentRemText)}"
                        </blockquote>
                    </div>
                    ` : ""}

                    <div class="glass-card" style="margin-bottom: 12px;">
                        <div style="font-size: 10px; font-weight: 700; color: #2E5894; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Teacher Diagnostic Assessments</div>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Challenges Identified</div>
                                <div class="info-value" style="font-size:11px; color:#c0392b;">${escapeHtml(challenges) || "None observed"}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Supports & Interventions Provided</div>
                                <div class="info-value" style="font-size:11px; color:#27ae60;">${escapeHtml(solutions) || "Regular classroom support"}</div>
                            </div>
                        </div>
                    </div>

                    <div class="glass-card">
                        <div class="info-label">Domain Teacher Consolidated Observations</div>
                        <blockquote style="font-size:12px; line-height:1.4; margin-top: 6px; color:#2E5894; border-left-color: #B8972E;">
                            "${escapeHtml(feedback) || "Domain feedback and qualitative remarks not yet submitted."}"
                        </blockquote>
                    </div>
                </div>
            </div>
            `;
        });

        // Stage 2 Reflections & Parent/Peer Surveys
        const seCard = studentData.assessments?.a3_s2 || {};
        const selfAnswers = seCard.selfAnswers || {};
        const p1 = seCard.peer1 || {};
        const p2 = seCard.peer2 || {};
        const parentAnswers = seCard.parent?.answers || {};
        const parentRes = seCard.parent?.resources || [];
        const parentSupp = seCard.parent?.supportAreas || [];
        const specSupport = seCard.parent?.otherSupportSpecify || "";

        // Standard emoji helper mapping values to visual badges
        const getEmojiStr = (val) => {
            if (!val) return '🟢';
            const v = val.toString().toLowerCase().trim();
            if (v === 'yes' || v === 'always') return '✅ 🟢';
            if (v === 'no' || v === 'never') return '❌ 🔴';
            return '⚠️ 🟡';
        };

        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Co-Scholastic Self & Peer Reflections</div>
                
                <div class="glass-card">
                    <div style="font-size: 11px; font-weight:700; color:#2E5894; margin-bottom: 8px;">STUDENT SELF-REFLECTIONS (EMOJI VALUES)</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">I like to share things with friends</div>
                            <div class="info-value">${getEmojiStr(selfAnswers.q1)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">I complete my work on time</div>
                            <div class="info-value">${getEmojiStr(selfAnswers.q2)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">I keep my desk and books clean</div>
                            <div class="info-value">${getEmojiStr(selfAnswers.q3)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">I speak politely to teachers</div>
                            <div class="info-value">${getEmojiStr(selfAnswers.q4)}</div>
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <div style="font-size: 10px; font-weight:700; color:#2E5894; margin-bottom: 4px;">PEER EVALUATION 1 (By: ${escapeHtml(p1.friendName || "Peer 1")})</div>
                        <div class="info-label">Is helpful & friendly</div>
                        <div class="info-value" style="font-size:12px; margin-bottom: 4px;">${getEmojiStr(p1.answers?.q1)}</div>
                        <div class="info-label">Speaks nicely in classroom</div>
                        <div class="info-value" style="font-size:12px;">${getEmojiStr(p1.answers?.q2)}</div>
                    </div>
                    <div>
                        <div style="font-size: 10px; font-weight:700; color:#2E5894; margin-bottom: 4px;">PEER EVALUATION 2 (By: ${escapeHtml(p2.friendName || "Peer 2")})</div>
                        <div class="info-label">Is helpful & friendly</div>
                        <div class="info-value" style="font-size:12px; margin-bottom: 4px;">${getEmojiStr(p2.answers?.q1)}</div>
                        <div class="info-label">Speaks nicely in classroom</div>
                        <div class="info-value" style="font-size:12px;">${getEmojiStr(p2.answers?.q2)}</div>
                    </div>
                </div>

                <div class="section-title">Parent Voice & Home Support</div>
                <div class="glass-card">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Child discusses school events at home</div>
                            <div class="info-value">${getEmojiStr(parentAnswers.q1)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Child respects family elders and friends</div>
                            <div class="info-value">${getEmojiStr(parentAnswers.q2)}</div>
                        </div>
                        <div class="info-item" style="grid-column: span 2;">
                            <div class="info-label">Parent resources available at home</div>
                            <div style="margin-top:4px;">
                                ${parentRes.map(r => `<span class="chip gold-chip">${escapeHtml(r)}</span>`).join('') || "None listed"}
                            </div>
                        </div>
                        <div class="info-item" style="grid-column: span 2;">
                            <div class="info-label">Target Support areas needed</div>
                            <div style="margin-top:4px;">
                                ${parentSupp.map(sa => `<span class="chip">${escapeHtml(sa)}</span>`).join('') || "None specified"}
                                ${specSupport ? `<br/><span style="font-size:11px; font-style:italic;">Other support: ${escapeHtml(specSupport)}</span>` : ""}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="sigs-row" style="margin-top: 20mm;">
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div class="sig-label">Class Teacher</div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div class="sig-label">Principal</div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div class="sig-label">Parent Signature</div>
                    </div>
                </div>
            </div>
        </div>
        `;

        // ───────────────────────────────────────────────────────────
        // PART C: YEAR-END EVALUATION / SCHOOL READINESS SUMMARY (STAGE 2)
        // ───────────────────────────────────────────────────────────
        const dmV2 = studentData.assessments?.domainMatricesV2 || {};
        const partCDomainsS2 = [
            { key: 's2_lang1', title: 'Language Education (Language 1 - R1)', icon: '📖', color: '#2E5894' },
            { key: 's2_lang2', title: 'Language Education (Language 2 - R2)', icon: '💬', color: '#B8972E' },
            { key: 's2_math', title: 'Mathematics', icon: '🧮', color: '#2E8B57' },
            { key: 's2_world', title: 'The World Around Us', icon: '🌍', color: '#2E5894' },
            { key: 's2_art_visual', title: 'Art Education (Visual Arts)', icon: '🎨', color: '#8C1B1B' },
            { key: 's2_art_theatre', title: 'Art Education (Theatre)', icon: '🎭', color: '#B8972E' },
            { key: 's2_art_music', title: 'Art Education (Music)', icon: '🎵', color: '#2E8B57' },
            { key: 's2_art_dance', title: 'Art Education (Dance & Movement)', icon: '💃', color: '#8C1B1B' },
            { key: 's2_phys_ls1', title: 'Physical Education (Learning Standard 1)', icon: '🏃', color: '#2E5894' },
            { key: 's2_phys_ls2', title: 'Physical Education (Learning Standard 2)', icon: '🤸', color: '#B8972E' }
        ];

        const s2Chunks = [];
        for (let i = 0; i < partCDomainsS2.length; i += 3) {
            s2Chunks.push(partCDomainsS2.slice(i, i + 3));
        }

        s2Chunks.forEach((chunk, pageIndex) => {
            htmlContent += `
            <div class="page">
                <div class="page-bg ${getBg()}"></div>
                <div class="glow-overlay"></div>
                <div class="matte-shield"></div>
                <div class="page-border"></div>
                <div class="content-container">
                    <div class="section-title">Part C: Year-End Summary & School Readiness (Page ${pageIndex + 1})</div>
                    
                    ${chunk.map((dom) => {
                        const cMatrix = dmV2[dom.key] || {};
                        return `
                        <div class="glass-card" style="margin-bottom: 12px; padding: 12px;">
                            <div style="font-size: 11px; font-weight:700; color:${dom.color}; margin-bottom: 6px; text-transform: uppercase;">
                                ${dom.icon} ${dom.title} Assessment Matrix
                            </div>
                            <table class="rubric-table" style="margin-top: 5px;">
                                <thead>
                                    <tr>
                                        <th style="width: 25%; background:${dom.color};">Criteria</th>
                                        <th style="width: 25%; background:${dom.color};"><span class="badge-stream" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Stream</th>
                                        <th style="width: 25%; background:${dom.color};"><span class="badge-mountain" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Mountain</th>
                                        <th style="width: 25%; background:${dom.color};"><span class="badge-sky" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Sky</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${["Awareness", "Sensitivity", "Creativity"].map((ability, r) => `
                                        <tr>
                                            <td class="rubric-row-title" style="font-size:8px;">${ability}</td>
                                            ${[0, 1, 2].map(c => {
                                                const val = cMatrix[`${r}-${c}`] || '';
                                                const isActive = val.trim().length > 0;
                                                let gemIcon = '';
                                                if (isActive) {
                                                    if (c === 0) gemIcon = `<span class="badge-stream gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                                    if (c === 1) gemIcon = `<span class="badge-mountain gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                                    if (c === 2) gemIcon = `<span class="badge-sky gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                                }
                                                return `<td class="matrix-cell-content ${isActive ? 'active' : ''}" style="font-size: 8.5px; padding: 4px;">${gemIcon} ${escapeHtml(val) || '-'}</td>`;
                                            }).join('')}
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            `;
        });
    }

    // ───────────────────────────────────────────────────────────
    // STAGE 3: MIDDLE ROUTE
    // ───────────────────────────────────────────────────────────
    if (stage === 3) {
        // Stage 3 Parent observations A4 page first
        const parentObs = studentData.assessments?.a4_s3 || {};
        const pResources = parentObs.resources || [];
        const pFocus = parentObs.focusAreas || [];
        const pSurvey = parentObs.surveyAnswers || {};
        const otherSupp = parentObs.otherSupportText || "";
        const suppText = parentObs.supportText || "";

        const getEmojiStr = (val) => {
            if (!val) return '🟢';
            const v = val.toString().toLowerCase().trim();
            if (v === 'yes' || v === 'always') return '✅ 🟢';
            if (v === 'no' || v === 'never') return '❌ 🔴';
            return '⚠️ 🟡';
        };

        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Middle Stage Parent Observations (A4)</div>
                
                <div class="glass-card">
                    <div style="font-size: 11px; font-weight:700; color:#2E5894; margin-bottom: 12px;">PARENT SURVEY & SURVEY RESPONSES</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Child manages school pressure well</div>
                            <div class="info-value">${getEmojiStr(pSurvey.q1)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Child spends time on homework tasks</div>
                            <div class="info-value">${getEmojiStr(pSurvey.q2)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Child maintains good sleep schedule</div>
                            <div class="info-value">${getEmojiStr(pSurvey.q3)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Parent visits school during PTM events</div>
                            <div class="info-value">${getEmojiStr(pSurvey.q4)}</div>
                        </div>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="info-grid">
                        <div class="info-item" style="grid-column: span 2;">
                            <div class="info-label">Learning resources available at home</div>
                            <div style="margin-top: 4px;">
                                ${pResources.map(r => `<span class="chip gold-chip">${escapeHtml(r)}</span>`).join('') || "None listed"}
                            </div>
                        </div>
                        <div class="info-item" style="grid-column: span 2;">
                            <div class="info-label">Identified Focus / Support Areas</div>
                            <div style="margin-top: 4px;">
                                ${pFocus.map(f => `<span class="chip">${escapeHtml(f)}</span>`).join('') || "No standard focus mapped"}
                                ${otherSupp ? `<br/><span style="font-size: 11px; font-style:italic;">Other support specified: ${escapeHtml(otherSupp)}</span>` : ""}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="info-label">How parents support children at home</div>
                    <blockquote style="margin: 4px 0 0 0;">
                        "${escapeHtml(suppText || "No general home support comments submitted.")}"
                    </blockquote>
                </div>
            </div>
        </div>
        `;

        const dsData = studentData.assessments?.domainsData || {};
        let subjectKeys = Object.keys(dsData);

        // If domainsData is empty, use the standard list of 14 Middle Stage Subjects
        if (subjectKeys.length === 0) {
            subjectKeys = [
                "Language 1", "Language 2", "Language 3",
                "Mathematics", "Science", "Social Science",
                "Art Education (Visual Arts)", "Art Education (Music)", "Art Education (Dance)",
                "Art Education (Drama)", "Art Education (Puppetry)",
                "Physical Education & Health (Yoga)", "Physical Education (Games)",
                "Vocational Education"
            ];
        }

        subjectKeys.forEach((subjName) => {
            const activeSubj = dsData[subjName] || {};
            const goals = activeSubj.goals || [];
            const competencies = activeSubj.competencies || [];
            const activityApproach = activeSubj.activityApproach || [];
            const durationHours = activeSubj.activityHours || "0";
            const durationMins = activeSubj.activityMinutes || "0";
            const materials = activeSubj.materialsRequired || "";
            const activityDesc = activeSubj.activityDescription || "";
            const m1 = activeSubj.rubricMatrix || {};
            
            // Reflections
            const learningsLearnt = activeSubj.studentLearnings?.learnt || "";
            const learningsPractice = activeSubj.studentLearnings?.practice || "";
            const peerPractice = activeSubj.peerLearnings?.practice || "";
            const learningsHelp = activeSubj.studentLearnings?.help || "";
            const peerHelp = activeSubj.peerLearnings?.help || "";
            
            // Vibe Checks
            const sVibe = activeSubj.studentVibe || {};
            const pVibe = activeSubj.peerVibe || {};

            // Progress statement lists
            const sProgress = activeSubj.studentProgress || {};
            const pProgress = activeSubj.peerProgress || {};

            // Subject level observations
            const sObs = activeSubj.teacherObservations || "";
            const sHelp = activeSubj.helpProgress || "NA";
            const sSteps = activeSubj.furtherSteps || "";

            htmlContent += `
            <div class="page">
                <div class="page-bg ${getBg()}"></div>
                <div class="glow-overlay"></div>
                <div class="matte-shield"></div>
                <div class="page-border"></div>
                <div class="content-container">
                    <div class="section-title">Subject Portfolio: ${subjName}</div>
                    
                    <div class="glass-card">
                        <div class="info-grid">
                            <div class="info-item" style="grid-column: span 2;">
                                <div class="info-label">Curricular Goals</div>
                                <div style="margin-top: 2px;">
                                    ${goals.length > 0 ? goals.map(g => `<span class="chip cyber-chip">${escapeHtml(g)}</span>`).join('') : "No goals specified"}
                                </div>
                            </div>
                            <div class="info-item" style="grid-column: span 2;">
                                <div class="info-label">Target Competencies</div>
                                <div style="margin-top: 2px;">
                                    ${competencies.length > 0 ? competencies.map(c => `<span class="chip gold-chip">${escapeHtml(c)}</span>`).join('') : "No competencies specified"}
                                </div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Activity Approach & Pedagogies</div>
                                <div style="margin-top: 2px;">
                                    ${activityApproach.map(a => `<span class="chip gold-chip">${escapeHtml(a)}</span>`).join('') || "Experiential learning"}
                                    ${activeSubj.anyOtherApproach ? `<br/><span style="font-size:10px; color:#555;">Other: ${escapeHtml(activeSubj.anyOtherApproach)}</span>` : ""}
                                </div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Duration & Materials</div>
                                <div class="info-value" style="font-size: 11px;">${durationHours} hrs ${durationMins} mins | Materials: ${escapeHtml(materials) || "N/A"}</div>
                            </div>
                            <div class="info-item" style="grid-column: span 2; border-bottom:0; padding-bottom:0;">
                                <div class="info-label">Project / Activity Description</div>
                                <div class="info-value" style="font-size:11px; line-height:1.3; max-height: 48px; overflow:hidden;">${escapeHtml(activityDesc) || "No activity observations logged."}</div>
                            </div>
                        </div>
                    </div>

                    <div class="section-title" style="margin: 10px 0 6px 0;">Subject Competency Rubric</div>
                    <table class="rubric-table">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Dimensions</th>
                                <th style="width: 25%;"><span class="badge-stream" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Stream</th>
                                <th style="width: 25%;"><span class="badge-mountain" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Mountain</th>
                                <th style="width: 25%;"><span class="badge-sky" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></span> Sky</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${["Awareness", "Sensitivity", "Creativity"].map((dim, r) => `
                                <tr>
                                    <td class="rubric-row-title">${dim}</td>
                                    ${[0, 1, 2].map(c => {
                                        const val = m1[`${r}-${c}`] || '';
                                        const isActive = val.trim().length > 0;
                                        let gemIcon = '';
                                        if (isActive) {
                                            if (c === 0) gemIcon = `<span class="badge-stream gem-rating-icon"></span>`;
                                            if (c === 1) gemIcon = `<span class="badge-mountain gem-rating-icon"></span>`;
                                            if (c === 2) gemIcon = `<span class="badge-sky gem-rating-icon"></span>`;
                                        }
                                        return `<td class="matrix-cell-content ${isActive ? 'active' : ''}">${gemIcon} ${escapeHtml(val) || '-'}</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:10px;">
                        <!-- Student Voice -->
                        <div class="glass-card" style="margin-bottom:0; padding:10px;">
                            <div style="font-size:9px; font-weight:700; color:#2E5894; border-bottom:1px solid #ddd; padding-bottom:3px; margin-bottom:5px;">STUDENT REFLECTION & VIBE: ${getEmojiStr(sVibe.q1)}</div>
                            <div class="info-label">What I learnt</div>
                            <div class="info-value" style="font-size:10px; line-height:1.2; margin-bottom:4px;">"${escapeHtml(learningsLearnt || "Learnt activity concepts.")}"</div>
                            <div class="info-label">I need practice / help on</div>
                            <div class="info-value" style="font-size:10px; line-height:1.2;">Practice: ${escapeHtml(learningsPractice || "NA")} | Help: ${escapeHtml(learningsHelp || "NA")}</div>
                            
                            <!-- Custom list progress statements with badgeStream bullet -->
                            <div style="margin-top:6px;">
                                <div class="info-label">Progress check statements</div>
                                <ul class="progress-list">
                                    ${(sProgress.awareness || []).slice(0, 1).map(s => `<li class="progress-item">${escapeHtml(s)}</li>`).join('')}
                                    ${(sProgress.sensitivity || []).slice(0, 1).map(s => `<li class="progress-item">${escapeHtml(s)}</li>`).join('')}
                                    ${(sProgress.creativity || []).slice(0, 1).map(s => `<li class="progress-item">${escapeHtml(s)}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        <!-- Peer Voice -->
                        <div class="glass-card" style="margin-bottom:0; padding:10px;">
                            <div style="font-size:9px; font-weight:700; color:#8C733E; border-bottom:1px solid #ddd; padding-bottom:3px; margin-bottom:5px;">PEER REFLECTION & VIBE: ${getEmojiStr(pVibe.q1)}</div>
                            <div class="info-label">What my peer observed</div>
                            <div class="info-value" style="font-size:10px; line-height:1.2; margin-bottom:4px;">"${escapeHtml(activeSubj.peerObservations || "Peer helped with group project.")}"</div>
                            <div class="info-label">My peer needs practice / help on</div>
                            <div class="info-value" style="font-size:10px; line-height:1.2;">Practice: ${escapeHtml(peerPractice || "NA")} | Help: ${escapeHtml(peerHelp || "NA")}</div>
                            
                            <!-- Custom list progress statements with badgeStream bullet -->
                            <div style="margin-top:6px;">
                                <div class="info-label">Peer progress check statements</div>
                                <ul class="progress-list">
                                    ${(pProgress.awareness || []).slice(0, 1).map(s => `<li class="progress-item">${escapeHtml(s)}</li>`).join('')}
                                    ${(pProgress.sensitivity || []).slice(0, 1).map(s => `<li class="progress-item">${escapeHtml(s)}</li>`).join('')}
                                    ${(pProgress.creativity || []).slice(0, 1).map(s => `<li class="progress-item">${escapeHtml(s)}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>

                    ${sObs ? `
                        <div class="glass-card" style="margin-top:10px; padding:10px; border:1px dashed rgba(184,151,46,0.35);">
                            <div class="info-label" style="color:#8C733E;">Subject recommendation steps (Can I help: ${escapeHtml(sHelp)})</div>
                            <div style="font-size:10px; line-height:1.3; color:#555;">
                                <strong>Observation:</strong> ${escapeHtml(sObs)} ${sSteps ? `<br/><strong>Further steps:</strong> ${escapeHtml(sSteps)}` : ""}
                            </div>
                        </div>
                    ` : ""}
                </div>
            </div>
            `;
        });

        // Stage 3 Grand consolidated Teacher Summary
        const sAssess = studentData.assessments || {};
        const strengths = sAssess.strengths || [];
        const barriers = sAssess.barriers || [];
        const remarks = sAssess.remarks || "";

        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Grand Consolidated Progress Portfolio</div>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="glass-card">
                        <div style="font-size: 11px; font-weight:700; color:#2E5894; margin-bottom: 8px;">DEMONSTRATED STRENGTHS</div>
                        <div style="margin-top:6px;">
                            ${strengths.map(s => `<span class="chip gold-chip">⭐ ${escapeHtml(s)}</span>`).join('') || "No standard strengths selected."}
                            ${sAssess.anyOtherStrength ? `<br/><span style="font-size:11px; font-style:italic;">Other: ${escapeHtml(sAssess.anyOtherStrength)}</span>` : ""}
                        </div>
                    </div>
                    <div class="glass-card">
                        <div style="font-size: 11px; font-weight:700; color:#c0392b; margin-bottom: 8px;">IDENTIFIED BARRIERS TO PROGRESS</div>
                        <div style="margin-top:6px;">
                            ${barriers.map(b => `<span class="chip" style="background:rgba(192,57,43,0.08); border-color:rgba(192,57,43,0.2); color:#c0392b;">⚠️ ${escapeHtml(b)}</span>`).join('') || "No standard barriers checked."}
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 10px;">
                    <div class="info-label" style="font-size: 11px; color:#2E5894;">CONSOLIDATED REMARKS & OBSERVATIONS FROM CLASS TEACHER</div>
                    <blockquote style="margin: 8px 0 0 0; font-size: 12px; line-height: 1.5;">
                        "${escapeHtml(remarks || "Student exhibits good subject knowledge and collaborative classroom participation.")}"
                    </blockquote>
                </div>

                <div class="sigs-row" style="margin-top: 60mm;">
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div class="sig-label">Class Teacher</div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div class="sig-label">Principal</div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <div class="sig-label">Parent Signature</div>
                    </div>
                </div>
            </div>
        </div>
        `;

        // ───────────────────────────────────────────────────────────
        // PART C: YEAR-END EVALUATION / SCHOOL READINESS SUMMARY (STAGE 3)
        // ───────────────────────────────────────────────────────────
        const dmV2 = studentData.assessments?.domainMatricesV2 || {};
        const partCDomainsS3 = [
            { key: 's3_lang1', title: 'Language Education (Language 1 - R1)', icon: '📖', color: '#2E5894' },
            { key: 's3_lang2', title: 'Language Education (Language 2 - R2)', icon: '💬', color: '#B8972E' },
            { key: 's3_lang3', title: 'Language Education (Language 3 - R3)', icon: '🗣️', color: '#2E8B57' },
            { key: 's3_math', title: 'Mathematics', icon: '🧮', color: '#2E5894' },
            { key: 's3_science', title: 'Science', icon: '🧪', color: '#8C1B1B' },
            { key: 's3_social', title: 'Social Science', icon: '🌍', color: '#B8972E' },
            { key: 's3_art_visual', title: 'Art Education (Visual Arts)', icon: '🎨', color: '#2E8B57' },
            { key: 's3_art_theatre', title: 'Art Education (Theatre)', icon: '🎭', color: '#8C1B1B' },
            { key: 's3_art_music', title: 'Art Education (Music)', icon: '🎵', color: '#2E5894' },
            { key: 's3_art_dance', title: 'Art Education (Dance & Movement)', icon: '💃', color: '#B8972E' },
            { key: 's3_art_ls2', title: 'Art Education (Learning Standard 2)', icon: '🎨', color: '#2E8B57' },
            { key: 's3_phys_ls1', title: 'Physical Education (Learning Standard 1)', icon: '🏃', color: '#8C1B1B' },
            { key: 's3_phys_ls2', title: 'Physical Education (Learning Standard 2)', icon: '🤸', color: '#2E5894' },
            { key: 's3_vocational', title: 'Vocational/Skill Education', icon: '🛠️', color: '#B8972E' }
        ];

        const s3Chunks = [];
        for (let i = 0; i < partCDomainsS3.length; i += 3) {
            s3Chunks.push(partCDomainsS3.slice(i, i + 3));
        }

        s3Chunks.forEach((chunk, pageIndex) => {
            htmlContent += `
            <div class="page">
                <div class="page-bg ${getBg()}"></div>
                <div class="glow-overlay"></div>
                <div class="matte-shield"></div>
                <div class="page-border"></div>
                <div class="content-container">
                    <div class="section-title">Part C: Year-End Summary & School Readiness (Page ${pageIndex + 1})</div>
                    
                    ${chunk.map((dom) => {
                        const cMatrix = dmV2[dom.key] || {};
                        return `
                        <div class="glass-card" style="margin-bottom: 12px; padding: 12px;">
                            <div style="font-size: 11px; font-weight:700; color:${dom.color}; margin-bottom: 6px; text-transform: uppercase;">
                                ${dom.icon} ${dom.title} Assessment Matrix
                            </div>
                            <table class="rubric-table" style="margin-top: 5px;">
                                <thead>
                                    <tr>
                                        <th style="width: 25%; background:${dom.color};">Criteria</th>
                                        <th style="width: 25%; background:${dom.color};"><span class="badge-stream" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Stream</th>
                                        <th style="width: 25%; background:${dom.color};"><span class="badge-mountain" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Mountain</th>
                                        <th style="width: 25%; background:${dom.color};"><span class="badge-sky" style="width:10px;height:10px;vertical-align:middle;margin-right:4px;"></span> Sky</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${["Awareness", "Sensitivity", "Creativity"].map((ability, r) => `
                                        <tr>
                                            <td class="rubric-row-title" style="font-size:8px;">${ability}</td>
                                            ${[0, 1, 2].map(c => {
                                                const val = cMatrix[`${r}-${c}`] || '';
                                                const isActive = val.trim().length > 0;
                                                let gemIcon = '';
                                                if (isActive) {
                                                    if (c === 0) gemIcon = `<span class="badge-stream gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                                    if (c === 1) gemIcon = `<span class="badge-mountain gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                                    if (c === 2) gemIcon = `<span class="badge-sky gem-rating-icon" style="width:14px;height:14px;"></span>`;
                                                }
                                                return `<td class="matrix-cell-content ${isActive ? 'active' : ''}" style="font-size: 8.5px; padding: 4px;">${gemIcon} ${escapeHtml(val) || '-'}</td>`;
                                            }).join('')}
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            `;
        });
    }

    htmlContent += `
</body>
</html>
`;
    return htmlContent;
}

module.exports = { buildHpcHtml };
