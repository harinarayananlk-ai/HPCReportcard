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
    } else if (className.includes('grade 9') || className.includes('grade 10') || className.includes('grade 11') || className.includes('grade 12') || className.includes('class 9') || className.includes('class 10') || className.includes('class 11') || className.includes('class 12') || className.includes('secondary')) {
        stage = 4; // Secondary Stage
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
            "Language 1",
            "Language 2",
            "Mathematics",
            "The World Around Us",
            "Art Education (Visual Arts)",
            "Art Education (Theatre)",
            "Art Education (Music)",
            "Art Education (Dance & Movement)",
            "Physical Education (Learning Standard 1)",
            "Physical Education (Learning Standard 2)"
        ];

        const prepDomainTitles = {
            "Language 1": "Language Education (Language 1 - Mother Tongue)",
            "Language 2": "Language Education (Language 2 - English/Second)",
            "Mathematics": "Mathematics",
            "The World Around Us": "The World Around Us / Environmental Studies",
            "Art Education (Visual Arts)": "Art Education (Visual Arts)",
            "Art Education (Theatre)": "Art Education (Theatre)",
            "Art Education (Music)": "Art Education (Music)",
            "Art Education (Dance & Movement)": "Art Education (Dance & Movement)",
            "Physical Education (Learning Standard 1)": "Physical Education (Learning Standard 1)",
            "Physical Education (Learning Standard 2)": "Physical Education (Learning Standard 2)"
        };

        const dsData = studentData.assessments?.domainsData || {};

        prepDomains.forEach((domainKey, idx) => {
            const domainName = prepDomainTitles[domainKey] || domainKey;
            const activeDetails = dsData[domainKey] || {};
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
                if (val === 'sometimes') return "🤔 <span style='color: #d35400; font-weight: bold;'>Sometimes</span>";
                if (val === 'no') return "😟 <span style='color: #c0392b; font-weight: bold;'>No</span>";
                return "❓ <span style='color: #777; font-weight: bold;'>Not Sure</span>";
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

                    <div class="glass-card" style="margin-bottom: 12px;">
                        <div style="font-size: 10px; font-weight:700; color:#2E5894; margin-bottom: 8px; text-transform: uppercase;">Student Self-Reflection Checklist</div>
                        <div class="info-grid">
                            ${[
                                { id: "q1", text: "I followed my teacher’s instructions." },
                                { id: "q2", text: "I liked doing this work." },
                                { id: "q3", text: "I asked for help if I didn’t understand." },
                                { id: "q4", text: "I tried my best in this task." },
                                { id: "q5", text: "I am proud of my work." },
                                { id: "q6", text: "I want to do this task again." },
                                { id: "q7", text: "I liked working with my classmate/s." },
                                { id: "q8", text: "I could ask my classmates for help, and they helped me." }
                            ].map(item => {
                                const val = (activeDetails.selfAssessments || {})[item.id] || "";
                                return `
                                <div class="info-item" style="border-bottom: 1px solid rgba(0,0,0,0.03); padding-bottom: 2px;">
                                    <div class="info-label" style="font-size: 9px; line-height: 1.2;">${item.text}</div>
                                    <div class="info-value" style="font-size: 11px;">${getVibeIcon(val)}</div>
                                </div>
                                `;
                            }).join('')}
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
        const a2Data = studentData.a2 || {};
        const academicGoal = a2Data.academicGoal || {};
        const personalGoal = a2Data.personalGoal || {};
        const schoolLearnings = a2Data.schoolLearnings || [];
        const outsideLearnings = a2Data.outsideLearnings || [];

        const a3Data = studentData.assessments?.a3_s3 || {};
        const skillsList = a3Data.skills || [];
        const subjectsList = a3Data.subjects || [];
        const habitsList = a3Data.habits || [];

        // Part A2: Student Voice (Page 3)
        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Part A2: Student Voice - About Me</div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 10px; align-items: stretch;">
                    <div class="polaroid-card" style="transform: none; margin: 0; width: 140px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; height: 175px;">
                        ${studentPhotoBase64 ? `<img src="${studentPhotoBase64}" class="polaroid-img" style="width: 122px; height: 122px;" />` : `<div class="polaroid-img" style="display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;width: 122px; height: 122px;">No Photo</div>`}
                        <div class="polaroid-caption" style="font-size: 13px; margin-top: 4px;">${escapeHtml(studentData.profile?.name)}</div>
                    </div>
                    
                    <div class="glass-card" style="flex-grow: 1; margin-bottom: 0; padding: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px;">
                        <div class="info-item" style="border-bottom:none; padding-bottom:0;">
                            <div class="info-label">I live with</div>
                            <div class="info-value" style="font-size: 11px;">${escapeHtml(a2Data.liveWith || "NA")}</div>
                        </div>
                        <div class="info-item" style="border-bottom:none; padding-bottom:0;">
                            <div class="info-label">I stay at</div>
                            <div class="info-value" style="font-size: 11px;">${escapeHtml(a2Data.stayAt || "NA")}</div>
                        </div>
                        <div class="info-item" style="border-bottom:none; padding-bottom:0;">
                            <div class="info-label">In my free time, I like to</div>
                            <div class="info-value" style="font-size: 11px;">${escapeHtml(a2Data.freeTime || "NA")}</div>
                        </div>
                        <div class="info-item" style="border-bottom:none; padding-bottom:0;">
                            <div class="info-label">I do well in</div>
                            <div class="info-value" style="font-size: 11px;">${escapeHtml(a2Data.doWell || "NA")}</div>
                        </div>
                        <div class="info-item" style="border-bottom:none; padding-bottom:0;">
                            <div class="info-label">I am responsible</div>
                            <div class="info-value" style="font-size: 11px; text-transform: capitalize;">${escapeHtml(a2Data.responsible || "sometimes")}</div>
                        </div>
                        <div class="info-item" style="border-bottom:none; padding-bottom:0;">
                            <div class="info-label">I want to do better in</div>
                            <div class="info-value" style="font-size: 11px;">${escapeHtml(a2Data.doBetter || "NA")}</div>
                        </div>
                        <div class="info-item" style="grid-column: span 2; border-bottom:none; padding-bottom:0;">
                            <div class="info-label">I show care for others by</div>
                            <div class="info-value" style="font-size: 11px;">${escapeHtml(a2Data.careOthers || "NA")}</div>
                        </div>
                        <div class="info-item" style="grid-column: span 2; border-bottom:none; padding-bottom:0;">
                            <div class="info-label">I feel proud of myself when</div>
                            <div class="info-value" style="font-size: 11px;">${escapeHtml(a2Data.proudOf || "NA")}</div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
                    <div class="glass-card" style="margin-bottom: 0; padding: 12px; border: 1.5px solid rgba(46, 88, 148, 0.35);">
                        <div style="font-size: 10px; font-weight:700; color:#2E5894; margin-bottom: 6px; text-transform: uppercase;">🎯 My Academic Goal</div>
                        <div class="info-label">Goal</div>
                        <div class="info-value" style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">${escapeHtml(academicGoal.goal || "NA")}</div>
                        <div class="info-label">Why it matters</div>
                        <div class="info-value" style="font-size: 11px; margin-bottom: 4px;">${escapeHtml(academicGoal.why || "NA")}</div>
                        <div class="info-label">Steps I will take</div>
                        <div style="font-size: 10.5px; color:#555;">
                            1. ${escapeHtml(academicGoal.step1 || "NA")}<br/>
                            2. ${escapeHtml(academicGoal.step2 || "NA")}
                        </div>
                    </div>
                    <div class="glass-card" style="margin-bottom: 0; padding: 12px; border: 1.5px solid rgba(184, 151, 46, 0.35);">
                        <div style="font-size: 10px; font-weight:700; color:#B8972E; margin-bottom: 6px; text-transform: uppercase;">🌟 My Personal Goal</div>
                        <div class="info-label">Goal</div>
                        <div class="info-value" style="font-size: 11px; font-weight: 600; margin-bottom: 4px;">${escapeHtml(personalGoal.goal || "NA")}</div>
                        <div class="info-label">Why it matters</div>
                        <div class="info-value" style="font-size: 11px; margin-bottom: 4px;">${escapeHtml(personalGoal.why || "NA")}</div>
                        <div class="info-label">Steps I will take</div>
                        <div style="font-size: 10.5px; color:#555;">
                            1. ${escapeHtml(personalGoal.step1 || "NA")}<br/>
                            2. ${escapeHtml(personalGoal.step2 || "NA")}
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
                    <div class="glass-card" style="margin-bottom: 0; padding: 12px;">
                        <div style="font-size: 10px; font-weight:700; color:#2E5894; margin-bottom: 6px; text-transform: uppercase;">📖 My Learnings in School</div>
                        <ul class="progress-list" style="margin: 0;">
                            ${schoolLearnings.filter(l => l && l.trim()).map(l => `<li class="progress-item" style="font-size:10.5px; margin-bottom: 4px;">${escapeHtml(l)}</li>`).join('') || '<span style="font-size:10.5px; color:#aaa;">No school learnings logged.</span>'}
                        </ul>
                    </div>
                    <div class="glass-card" style="margin-bottom: 0; padding: 12px;">
                        <div style="font-size: 10px; font-weight:700; color:#B8972E; margin-bottom: 6px; text-transform: uppercase;">🍀 My Learnings Outside School</div>
                        <ul class="progress-list" style="margin: 0;">
                            ${outsideLearnings.filter(l => l && l.trim()).map(l => `<li class="progress-item" style="font-size:10.5px; margin-bottom: 4px;">${escapeHtml(l)}</li>`).join('') || '<span style="font-size:10.5px; color:#aaa;">No outside learnings logged.</span>'}
                        </ul>
                    </div>
                </div>

                <div class="glass-card" style="margin-bottom: 0; padding: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <div class="info-label" style="color: #2E5894;">What I would like my teacher to help me with</div>
                        <blockquote style="font-size: 11px; padding: 6px 12px; margin-top: 4px; height: 50px; overflow: hidden; margin-bottom: 0;">
                            "${escapeHtml(a2Data.teacherHelp || "No specific request logged.")}"
                        </blockquote>
                    </div>
                    <div>
                        <div class="info-label" style="color: #B8972E;">What I would like my teacher to know about me</div>
                        <blockquote style="font-size: 11px; padding: 6px 12px; margin-top: 4px; height: 50px; overflow: hidden; margin-bottom: 0;">
                            "${escapeHtml(a2Data.teacherKnow || "No specific notes logged.")}"
                        </blockquote>
                    </div>
                </div>
            </div>
        </div>
        `;

        // Part A3: Ambition Timeline (Page 4)
        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Part A3: Student Ambition Timeline</div>

                <div class="glass-card" style="border: 2px solid rgba(184, 151, 46, 0.45); padding: 15px; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 28px;">🏆</span>
                        <div>
                            <div class="info-label" style="font-size: 10px; color: #B8972E;">My Ambition</div>
                            <div class="info-value" style="font-size: 18px; font-weight: 700; color: #2E5894;">${escapeHtml(a3Data.ambition || "To be defined")}</div>
                        </div>
                    </div>
                    <div class="flourish-divider" style="margin: 8px 0; width: 80px; height: 10px;"></div>
                    <div class="info-label" style="font-size: 9px;">How I plan to achieve this ambition & why</div>
                    <div style="font-size: 12px; color: #444; line-height: 1.4; font-style: italic;">
                        "${escapeHtml(a3Data.achieveAmbition || "No details submitted yet.")}"
                    </div>
                </div>

                <!-- Timeline Nodes Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                    <div class="glass-card" style="margin-bottom: 0; padding: 12px;">
                        <div style="font-size: 10px; font-weight: 700; color: #2E5894; margin-bottom: 6px; text-transform: uppercase;">🛠️ Skills I Need to Build</div>
                        <ul class="progress-list" style="margin: 0;">
                            ${skillsList.filter(s => s && s.trim()).map(s => `<li class="progress-item" style="font-size: 11px; margin-bottom: 4px;">${escapeHtml(s)}</li>`).join('') || '<span style="font-size:11px; color:#aaa;">No skills specified.</span>'}
                        </ul>
                    </div>
                    <div class="glass-card" style="margin-bottom: 0; padding: 12px;">
                        <div style="font-size: 10px; font-weight: 700; color: #B8972E; margin-bottom: 6px; text-transform: uppercase;">📖 Subjects I Need to Study</div>
                        <ul class="progress-list" style="margin: 0;">
                            ${subjectsList.filter(s => s && s.trim()).map(s => `<li class="progress-item" style="font-size: 11px; margin-bottom: 4px;">${escapeHtml(s)}</li>`).join('') || '<span style="font-size:11px; color:#aaa;">No subjects specified.</span>'}
                        </ul>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                    <div class="glass-card" style="margin-bottom: 0; padding: 12px;">
                        <div style="font-size: 10px; font-weight: 700; color: #B8972E; margin-bottom: 6px; text-transform: uppercase;">⚡ Habits I Need to Form</div>
                        <ul class="progress-list" style="margin: 0;">
                            ${habitsList.filter(h => h && h.trim()).map(h => `<li class="progress-item" style="font-size: 11px; margin-bottom: 4px;">${escapeHtml(h)}</li>`).join('') || '<span style="font-size:11px; color:#aaa;">No habits specified.</span>'}
                        </ul>
                    </div>
                    <div class="glass-card" style="margin-bottom: 0; padding: 12px; border: 1.5px solid rgba(46, 88, 148, 0.25);">
                        <div style="font-size: 10px; font-weight: 700; color: #2E5894; margin-bottom: 6px; text-transform: uppercase;">👥 Guidance & Help Needed</div>
                        <div class="info-label">Guidance type</div>
                        <div class="info-value" style="font-size: 11px; margin-bottom: 4px;">${escapeHtml(a3Data.guidance || "NA")}</div>
                        <div class="info-label">Who can help me</div>
                        <div class="info-value" style="font-size: 11px; margin-bottom: 4px;">${escapeHtml(a3Data.guidanceHelp || "NA")}</div>
                        <div class="info-label">What I will learn from them</div>
                        <div class="info-value" style="font-size: 11px;">${escapeHtml(a3Data.guidanceLearn || "NA")}</div>
                    </div>
                </div>

                <!-- Feelings / Emotional Outlook -->
                <div class="glass-card" style="margin-bottom: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <div class="info-label" style="color: #2E5894; font-weight: 700;">How I will feel when I achieve my ambition</div>
                        <blockquote style="font-size: 11.5px; padding: 8px 12px; margin-top: 4px; height: 55px; overflow: hidden; border-left-color: #2E5894; margin-bottom: 0;">
                            "${escapeHtml(a3Data.feelingsAchieve || "No remarks logged.")}"
                        </blockquote>
                    </div>
                    <div>
                        <div class="info-label" style="color: #B8972E; font-weight: 700;">How my parents / family will feel</div>
                        <blockquote style="font-size: 11.5px; padding: 8px 12px; margin-top: 4px; height: 55px; overflow: hidden; border-left-color: #B8972E; margin-bottom: 0;">
                            "${escapeHtml(a3Data.feelingsParents || "No remarks logged.")}"
                        </blockquote>
                    </div>
                </div>
            </div>
        </div>
        `;

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
                "Language 1",
                "Language 2",
                "Language 3",
                "Mathematics",
                "Science",
                "Social Science",
                "Art Education (Visual Arts)",
                "Art Education (Theatre)",
                "Art Education (Music)",
                "Art Education (Dance & Movement)",
                "Art Education (LS2)",
                "Physical Education (Learning Standard 1)",
                "Physical Education (Learning Standard 2)",
                "Vocational/Skill Education"
            ];
        }

        const s3DomainTitles = {
            "Language 1": "Language Education (Language 1 - R1)",
            "Language 2": "Language Education (Language 2 - R2)",
            "Language 3": "Language Education (Language 3 - R3)",
            "Mathematics": "Mathematics",
            "Science": "Science",
            "Social Science": "Social Science",
            "Art Education (Visual Arts)": "Art Education (Visual Arts)",
            "Art Education (Theatre)": "Art Education (Theatre)",
            "Art Education (Music)": "Art Education (Music)",
            "Art Education (Dance & Movement)": "Art Education (Dance & Movement)",
            "Art Education (LS2)": "Art Education (Learning Standard 2)",
            "Physical Education (Learning Standard 1)": "Physical Education (Learning Standard 1)",
            "Physical Education (Learning Standard 2)": "Physical Education (Learning Standard 2)",
            "Vocational/Skill Education": "Vocational/Skill Education"
        };

        subjectKeys.forEach((subjKey) => {
            const subjName = s3DomainTitles[subjKey] || subjKey;
            const activeSubj = dsData[subjKey] || {};
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
        let strengths = sAssess.strengths || [];
        let barriers = sAssess.barriers || [];
        const remarks = sAssess.remarks || "";

        // Aggregate strengths and barriers across all subjects dynamically
        let consolidatedStrengths = [];
        let consolidatedBarriers = [];
        if (sAssess.domainsData) {
            Object.keys(sAssess.domainsData).forEach(subjKey => {
                const subjObj = sAssess.domainsData[subjKey] || {};
                if (Array.isArray(subjObj.strengths)) {
                    subjObj.strengths.forEach(s => {
                        if (s && !consolidatedStrengths.includes(s)) {
                            consolidatedStrengths.push(s);
                        }
                    });
                }
                if (Array.isArray(subjObj.barriers)) {
                    subjObj.barriers.forEach(b => {
                        if (b && !consolidatedBarriers.includes(b)) {
                            consolidatedBarriers.push(b);
                        }
                    });
                }
            });
        }
        // Fallback to top-level if consolidated arrays are empty
        if (consolidatedStrengths.length > 0) {
            strengths = consolidatedStrengths;
        }
        if (consolidatedBarriers.length > 0) {
            barriers = consolidatedBarriers;
        }

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

    // ───────────────────────────────────────────────────────────
    // STAGE 4: SECONDARY STAGE (GRADES 9-12)
    // ───────────────────────────────────────────────────────────
    if (stage === 4) {
        const stage4 = studentData.assessments?.stage4 || {};
        const partB = stage4.partB || {};
        const partC = stage4.partC || {};
        const partD = stage4.partD || {};
        const timeInventories = stage4.timeInventories || {};
        const competencyProfile = stage4.competencyProfile || {};

        const a2 = studentData.a2 || {};
        const academicGoal = a2.academicGoal || {};
        const personalGoal = a2.personalGoal || {};
        const schoolLearnings = a2.schoolLearnings || [];
        const outsideLearnings = a2.outsideLearnings || [];

        const renderChips = (list) => {
            if (!list || list.length === 0) return '<span style="color:#aaa;font-size:10px;">None entered</span>';
            return list.map(item => `<span class="chip gold-chip" style="margin: 2px;">${escapeHtml(item)}</span>`).join('');
        };

        const renderPedagogies = (p) => {
            if (!p) return '<span style="color:#aaa;font-size:10px;">None selected</span>';
            const list = [];
            if (p.art) list.push('Art-integrated');
            if (p.toy) list.push('Toy-based');
            if (p.skill) list.push('Skill-based learning');
            if (p.iks) list.push('Indian Knowledge Systems');
            if (p.sports) list.push('Sports-integrated');
            if (p.tech) list.push('Technology-integrated');
            if (p.drama) list.push('Drama/Theatre-integrated');
            if (p.other && p.otherSpecify) list.push(`Other: ${p.otherSpecify}`);
            return list.map(item => `<span class="chip gold-chip" style="background:rgba(46,88,148,0.06);color:#2E5894;border-color:rgba(46,88,148,0.15);margin: 2px;">&#x2713; ${escapeHtml(item)}</span>`).join('');
        };

        const getCpBadge = (skillId, grade) => {
            const lvl = competencyProfile[`${skillId}_g${grade}_level`] || competencyProfile[`${skillId}_g${grade}`] || '';
            const desc = competencyProfile[`${skillId}_g${grade}_desc`] || '';
            let badge = '';
            if (lvl === 'B') badge = `<span style="background: rgba(100,116,139,0.08); border: 1px solid rgba(100,116,139,0.25); color:#475569; padding: 2px 6px; border-radius: 4px; font-weight:700; font-size:9px; display:inline-block;">B</span>`;
            else if (lvl === 'P') badge = `<span style="background: rgba(184,151,46,0.08); border: 1px solid rgba(184,151,46,0.25); color:#8a6d1a; padding: 2px 6px; border-radius: 4px; font-weight:700; font-size:9px; display:inline-block;">P</span>`;
            else if (lvl === 'A') badge = `<span style="background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); color:#15803d; padding: 2px 6px; border-radius: 4px; font-weight:700; font-size:9px; display:inline-block;">A</span>`;
            
            if (desc) {
                return `<div>${badge} <div style="font-size:8px; color:#555; margin-top:2px;">${escapeHtml(desc)}</div></div>`;
            }
            return badge || `<span style="color:#aaa;">-</span>`;
        };

        // --- PAGE 3: PART A SELF-REFLECTION ---
        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Part A: Student voice - Self-Reflection & Planning</div>
                
                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">1. ABOUT ME</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; font-size: 11px;">
                        <div><strong>I live with:</strong> ${escapeHtml(a2.liveWith || '-')}</div>
                        <div><strong>I stay at:</strong> ${escapeHtml(a2.stayAt || '-')}</div>
                        <div><strong>In my free time, I like:</strong> ${escapeHtml(a2.freeTime || '-')}</div>
                        <div><strong>Things I do well:</strong> ${escapeHtml(a2.doWell || '-')}</div>
                        <div><strong>My responsibilities are:</strong> ${escapeHtml(a2.responsibility || '-')}</div>
                        <div><strong>Things I want to do better:</strong> ${escapeHtml(a2.doBetter || '-')}</div>
                        <div><strong>I care for others by:</strong> ${escapeHtml(a2.careOthers || '-')}</div>
                        <div><strong>Things I am proud of:</strong> ${escapeHtml(a2.proudOf || '-')}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">2. ACADEMIC GOAL</div>
                        <div style="font-size: 11.5px; line-height: 1.4;">
                            <strong>Goal:</strong> ${escapeHtml(academicGoal.goal || '-')}<br/>
                            <strong>Importance:</strong> ${escapeHtml(academicGoal.importance || '-')}<br/>
                            <strong>Steps:</strong> ${escapeHtml(Array.isArray(academicGoal.steps) ? academicGoal.steps.join(', ') : (academicGoal.steps || '-'))}
                        </div>
                    </div>
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">3. PERSONAL GOAL</div>
                        <div style="font-size: 11.5px; line-height: 1.4;">
                            <strong>Goal:</strong> ${escapeHtml(personalGoal.goal || '-')}<br/>
                            <strong>Importance:</strong> ${escapeHtml(personalGoal.importance || '-')}<br/>
                            <strong>Steps:</strong> ${escapeHtml(Array.isArray(personalGoal.steps) ? personalGoal.steps.join(', ') : (personalGoal.steps || '-'))}
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">4. LEARNING DETAILS</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <div style="font-weight: 600; font-size: 10px; color:#555; text-transform: uppercase;">Learnt at school</div>
                            <ul style="margin: 4px 0; padding-left: 16px; font-size: 11px;">
                                ${(schoolLearnings || []).map(l => `<li>${escapeHtml(l)}</li>`).join('') || '<li>None recorded</li>'}
                            </ul>
                        </div>
                        <div>
                            <div style="font-weight: 600; font-size: 10px; color:#555; text-transform: uppercase;">Learnt outside school</div>
                            <ul style="margin: 4px 0; padding-left: 16px; font-size: 11px;">
                                ${(outsideLearnings || []).map(l => `<li>${escapeHtml(l)}</li>`).join('') || '<li>None recorded</li>'}
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">5. HELP & CONCERNS FROM TEACHER</div>
                    <div style="font-size: 11.5px; line-height: 1.4;">
                        <strong>What I would like my teacher to help with:</strong> ${escapeHtml(a2.whatTeacherHelp || '-')}<br/>
                        <strong>What I would like my teacher to know:</strong> ${escapeHtml(a2.whatTeacherKnow || '-')}
                    </div>
                </div>
            </div>
        </div>
        `;

        // --- PAGE 4: PART B GROUP PROJECT SETUP & SCHEDULE ---
        const bSch = partB.schedule || {};
        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Part B: Group Project Work - Setup & Schedule</div>
                
                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">1. PROJECT DOSSIER</div>
                    <div style="font-size: 11.5px; line-height: 1.4;">
                        <strong>Subjects Involved:</strong> ${renderChips(partB.subjects)}<br/><br/>
                        <strong>Curricular Goals:</strong> ${renderChips(partB.goals)}<br/><br/>
                        <strong>Competencies:</strong> ${renderChips(partB.competencies)}<br/><br/>
                        <strong>Pedagogies:</strong> ${renderPedagogies(partB.pedagogies)}
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">2. PROMPT & CHALLENGE</div>
                        <div style="font-size: 11.5px; line-height: 1.4;">
                            <strong>Challenge Prompt:</strong> ${escapeHtml(partB.projectPrompt || '-')}<br/>
                            <strong>Guiding Questions:</strong> ${escapeHtml(partB.guidingQuestions || '-')}
                        </div>
                    </div>
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">3. INITIAL IDEATION</div>
                        <div style="font-size: 11.5px; line-height: 1.4;">
                            <strong>What do I know?</strong> ${escapeHtml(partB.whatIKnow || '-')}<br/>
                            <strong>What do I need to find out?</strong> ${escapeHtml(partB.whatINeedToFind || '-')}
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">4. PROJECT SCHEDULE (DAY 1 - DAY 10)</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 11px;">
                        ${[1,2,3,4,5,6,7,8,9,10].map(day => `
                            <div><strong>Day ${day}:</strong> ${escapeHtml(bSch[`day${day}`] || '-')}</div>
                        `).join('')}
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">5. LOGISTICS PLANNING</div>
                    <div style="font-size: 11.5px; line-height: 1.4;">
                        <strong>Resources Needed:</strong> ${escapeHtml(partB.resourcesNeeded || '-')}<br/>
                        <strong>Roles of Members:</strong> ${escapeHtml(partB.rolesMembers || '-')}<br/>
                        <strong>Possible Barriers:</strong> ${escapeHtml(partB.barriersProject || '-')}
                    </div>
                </div>
            </div>
        </div>
        `;

        // --- PAGE 5: PART B EVALUATION & REFLECTIONS ---
        const bS1L = partB.s1Learner || {};
        const bS1T = partB.s1Teacher || {};
        const bS2T = partB.s2Teacher || {};
        const bS3L = partB.s3Learner || {};
        const bS3P = partB.s3Peer || {};
        const bRub = partB.s3RubricGrid || {};
        const bSel = partB.s3TeacherSelection || {};
        const bLvT = partB.levelOverviewTeacher || {};
        const bLvL = partB.levelOverviewLearner || {};
        const bLvP = partB.levelOverviewPeer || {};
        const bRefT = partB.postReflectionsTeacher || {};
        const bRefL = partB.postReflectionsLearner || {};

        // Helper calculations
        const bS1LSum = Object.values(bS1L).slice(0, 15).filter(Boolean).length;
        const bS1TSum = Object.values(bS1T).slice(0, 15).filter(Boolean).length;
        const bS2TSum = Object.values(bS2T).slice(0, 18).filter(Boolean).length;
        const bS3LSum = Object.values(bS3L).slice(0, 9).filter(Boolean).length;
        const bS3PSum = Object.values(bS3P).slice(0, 9).filter(Boolean).length;

        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Part B: Group Project Work - Evaluation & Reflections</div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">1. SUMMARY CHECKLIST TICKS</div>
                        <div style="font-size: 11.5px; line-height: 1.4;">
                            <strong>Stage 1 (Brainstorming) Ticks:</strong> Student (${bS1LSum}/15), Teacher (${bS1TSum}/15)<br/>
                            <strong>Stage 2 (Drafting) Ticks:</strong> Teacher (${bS2TSum}/18)<br/>
                            <strong>Stage 3 (Submission) Ticks:</strong> Student (${bS3LSum}/9), Peer (${bS3PSum}/9)
                        </div>
                    </div>
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">2. PERFORMANCE LEVELS OVERVIEW</div>
                        <div style="font-size: 11px; line-height: 1.4;">
                            <strong>Teacher Evaluated:</strong> Awr (${escapeHtml(bLvT.awr || '-')}), Sen (${escapeHtml(bLvT.sen || '-')}), Cre (${escapeHtml(bLvT.cre || '-')})<br/>
                            <strong>Learner Reflection:</strong> Awr (${escapeHtml(bLvL.awr || '-')}), Sen (${escapeHtml(bLvL.sen || '-')}), Cre (${escapeHtml(bLvL.cre || '-')})<br/>
                            <strong>Peer Assessed:</strong> Awr (${escapeHtml(bLvP.awr || '-')}), Sen (${escapeHtml(bLvP.sen || '-')}), Cre (${escapeHtml(bLvP.cre || '-')})
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">3. TEACHER CUSTOM RUBRIC MATRIX</div>
                    <table class="rubric-table" style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
                        <thead>
                            <tr style="background:#2E5894; color:#FFF;">
                                <th style="padding:4px; width:20%;">Ability</th>
                                <th style="padding:4px; width:26%;">Beginner</th>
                                <th style="padding:4px; width:27%;">Proficient</th>
                                <th style="padding:4px; width:27%;">Advanced</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-weight:700; background:rgba(0,0,0,0.02); padding:4px;">Awareness</td>
                                <td style="padding:4px; border: ${bSel.awr === 'Beginner' ? '1.5px solid #d4af37' : '1px solid #ddd'}; background: ${bSel.awr === 'Beginner' ? 'rgba(212,175,55,0.05)' : 'none'};">${escapeHtml(bRub.awrBeg || '-')}</td>
                                <td style="padding:4px; border: ${bSel.awr === 'Proficient' ? '1.5px solid #d4af37' : '1px solid #ddd'}; background: ${bSel.awr === 'Proficient' ? 'rgba(212,175,55,0.05)' : 'none'};">${escapeHtml(bRub.awrProf || '-')}</td>
                                <td style="padding:4px; border: ${bSel.awr === 'Advanced' ? '1.5px solid #d4af37' : '1px solid #ddd'}; background: ${bSel.awr === 'Advanced' ? 'rgba(212,175,55,0.05)' : 'none'};">${escapeHtml(bRub.awrAdv || '-')}</td>
                            </tr>
                            <tr>
                                <td style="font-weight:700; background:rgba(0,0,0,0.02); padding:4px;">Sensitivity</td>
                                <td style="padding:4px; border: ${bSel.sen === 'Beginner' ? '1.5px solid #d4af37' : '1px solid #ddd'}; background: ${bSel.sen === 'Beginner' ? 'rgba(212,175,55,0.05)' : 'none'};">${escapeHtml(bRub.senBeg || '-')}</td>
                                <td style="padding:4px; border: ${bSel.sen === 'Proficient' ? '1.5px solid #d4af37' : '1px solid #ddd'}; background: ${bSel.sen === 'Proficient' ? 'rgba(212,175,55,0.05)' : 'none'};">${escapeHtml(bRub.senProf || '-')}</td>
                                <td style="padding:4px; border: ${bSel.sen === 'Advanced' ? '1.5px solid #d4af37' : '1px solid #ddd'}; background: ${bSel.sen === 'Advanced' ? 'rgba(212,175,55,0.05)' : 'none'};">${escapeHtml(bRub.senAdv || '-')}</td>
                            </tr>
                            <tr>
                                <td style="font-weight:700; background:rgba(0,0,0,0.02); padding:4px;">Creativity</td>
                                <td style="padding:4px; border: ${bSel.cre === 'Beginner' ? '1.5px solid #d4af37' : '1px solid #ddd'}; background: ${bSel.cre === 'Beginner' ? 'rgba(212,175,55,0.05)' : 'none'};">${escapeHtml(bRub.creBeg || '-')}</td>
                                <td style="padding:4px; border: ${bSel.cre === 'Proficient' ? '1.5px solid #d4af37' : '1px solid #ddd'}; background: ${bSel.cre === 'Proficient' ? 'rgba(212,175,55,0.05)' : 'none'};">${escapeHtml(bRub.creProf || '-')}</td>
                                <td style="padding:4px; border: ${bSel.cre === 'Advanced' ? '1.5px solid #d4af37' : '1px solid #ddd'}; background: ${bSel.cre === 'Advanced' ? 'rgba(212,175,55,0.05)' : 'none'};">${escapeHtml(bRub.creAdv || '-')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">4. POST-PROJECT REFLECTIONS</div>
                    <div style="font-size: 11px; line-height: 1.45;">
                        <strong>What I learned from this project:</strong> ${escapeHtml(bRefL.learnt || '-')}<br/>
                        <strong>Most enjoyable part:</strong> ${escapeHtml(bRefL.enjoyed || '-')}<br/>
                        <strong>My 3 main strengths:</strong> ${escapeHtml(bRefL.strengths || '-')}<br/>
                        <strong>Roadblocks faced:</strong> ${escapeHtml(bRefL.challenges || '-')}<br/>
                        <strong>2 areas to improve:</strong> ${escapeHtml(bRefL.improvements || '-')}<br/>
                        <strong>Questions remaining:</strong> ${escapeHtml(bRefL.questions || '-')}<br/>
                        <strong>Suggestions for teacher modifications:</strong> ${escapeHtml(bRefL.teacherModify || '-')}
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">5. APPRECIATION & FEEDBACK LOG</div>
                    <div style="font-size: 11.5px; line-height: 1.45;">
                        <strong>Peer Encouragement Appreciation note:</strong> "${escapeHtml(bS3P.appreciation || '-')}"<br/>
                        <strong>Teacher pedagogical remarks:</strong> "${escapeHtml(bRefT.finalComments || '-')}"<br/>
                        <strong>Teacher points to work on in future:</strong> "${escapeHtml(bRefT.workOn || '-')}"
                    </div>
                </div>
            </div>
        </div>
        `;

        // --- PAGE 6: PART C PROBLEM-BASED INQUIRY SETUP & WORKFLOW ---
        const cSch = partC.schedule || {};
        const cWf = partC.workflow || {};
        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Part C: Problem-Based Inquiry (Solo Mission) - Setup & Plan</div>
                
                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">1. INQUIRY DOSSIER</div>
                    <div style="font-size: 11.5px; line-height: 1.4;">
                        <strong>Subjects:</strong> ${renderChips(partC.subjects)} | 
                        <strong>Goals:</strong> ${renderChips(partC.goals)} | 
                        <strong>Competencies:</strong> ${renderChips(partC.competencies)}<br/><br/>
                        <strong>Pedagogies:</strong> ${renderPedagogies(partC.pedagogies)}
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">2. HYPOTHESIS & PROMPT</div>
                        <div style="font-size: 11.5px; line-height: 1.4;">
                            <strong>Research Prompt:</strong> ${escapeHtml(partC.researchPrompt || '-')}<br/>
                            <strong>Hypothesis / Planned Output:</strong> ${escapeHtml(partC.hypothesis || '-')}<br/>
                            <strong>Guiding Questions:</strong> ${escapeHtml(partC.guidingQuestions || '-')}
                        </div>
                    </div>
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">3. INQUIRY TASK TIMELINE</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px;">
                            ${[1,2,3,4,5,6,7,8,9,10].map(day => `
                                <div><strong>Day ${day}:</strong> ${escapeHtml(cSch[`day${day}`] || '-')}</div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">4. INQUIRY WORKFLOW LOGS</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; font-size: 10.5px; line-height: 1.4;">
                        <div><strong>What do I know?</strong><br/> ${escapeHtml(cWf.know || '-')}</div>
                        <div><strong>What do I need to find out?</strong><br/> ${escapeHtml(cWf.findOut || '-')}</div>
                        <div><strong>Evidence Collection log:</strong><br/> ${escapeHtml(cWf.evidence || '-')}</div>
                        <div><strong>Analysis & Synthesis:</strong><br/> ${escapeHtml(cWf.analysis || '-')}</div>
                        <div><strong>Conclusion drawn:</strong><br/> ${escapeHtml(cWf.conclusion || '-')}</div>
                        <div><strong>Discussions & Drawbacks:</strong><br/> ${escapeHtml(cWf.discussions || '-')}</div>
                    </div>
                </div>
            </div>
        </div>
        `;

        // --- PAGE 7: PART C INQUIRY ASSESSMENTS & REFLECTIONS ---
        const cS1L = partC.s1Learner || {};
        const cS1T = partC.s1Teacher || {};
        const cS1TC = partC.s1TeacherCustom || {};
        const cS2L = partC.s2Learner || {};
        const cS2T = partC.s2Teacher || {};
        const cS2TC = partC.s2TeacherCustom || {};
        const cS3P = partC.s3Peer || {};
        const cS3T = partC.s3Teacher || {};
        const cS3TC = partC.s3TeacherCustom || {};
        const cLvT = partC.levelOverviewTeacher || {};
        const cLvL = partC.levelOverviewLearner || {};
        const cLvP = partC.levelOverviewPeer || {};
        const cRefT = partC.postReflectionsTeacher || {};
        const cRefL = partC.postReflectionsLearner || {};

        const cS1LSum = [cS1L.awr1, cS1L.awr2, cS1L.awr3, cS1L.sen1, cS1L.sen2, cS1L.sen3, cS1L.cre1, cS1L.cre2, cS1L.cre3].filter(Boolean).length;
        const cS2LSum = [cS2L.awr1, cS2L.awr2, cS2L.awr3, cS2L.sen1, cS2L.sen2, cS2L.sen3, cS2L.cre1, cS2L.cre2, cS2L.cre3].filter(Boolean).length;
        const cS3PSum = [cS3P.awr1, cS3P.awr2, cS3P.awr3, cS3P.sen1, cS3P.sen2, cS3P.sen3, cS3P.cre1, cS3P.cre2, cS3P.cre3].filter(Boolean).length;

        const getTeacherStageSumC = (stageData) => {
            return Object.keys(stageData).filter(k => k !== 'comments' && stageData[k] === true).length;
        };
        const cS1TSum = getTeacherStageSumC(cS1T);
        const cS2TSum = getTeacherStageSumC(cS2T);
        const cS3TSum = getTeacherStageSumC(cS3T);

        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Part C: Problem-Based Inquiry - Assessments & Reflections</div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">1. INQUIRY TICKS OVERVIEW</div>
                        <div style="font-size: 11.5px; line-height: 1.4;">
                            <strong>Stage 1 (Planning) Ticks:</strong> Student (${cS1LSum}/9), Teacher (${cS1TSum} / ${9 + (cS1TC.awrCustom1 ? 1 : 0) + (cS1TC.awrCustom2 ? 1 : 0) + (cS1TC.senCustom1 ? 1 : 0) + (cS1TC.senCustom2 ? 1 : 0) + (cS1TC.creCustom1 ? 1 : 0) + (cS1TC.creCustom2 ? 1 : 0)})<br/>
                            <strong>Stage 2 (Execution) Ticks:</strong> Student (${cS2LSum}/9), Teacher (${cS2TSum} / ${9 + (cS2TC.awrCustom1 ? 1 : 0) + (cS2TC.awrCustom2 ? 1 : 0) + (cS2TC.senCustom1 ? 1 : 0) + (cS2TC.senCustom2 ? 1 : 0) + (cS2TC.creCustom1 ? 1 : 0) + (cS2TC.creCustom2 ? 1 : 0)})<br/>
                            <strong>Stage 3 (Review) Ticks:</strong> Peer (${cS3PSum}/9), Teacher (${cS3TSum} / ${10 + (cS3TC.awrCustom1 ? 1 : 0) + (cS3TC.awrCustom2 ? 1 : 0) + (cS3TC.senCustom1 ? 1 : 0) + (cS3TC.senCustom2 ? 1 : 0) + (cS3TC.creCustom1 ? 1 : 0) + (cS3TC.creCustom2 ? 1 : 0)})
                        </div>
                    </div>
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">2. PERFORMANCE LEVELS OVERVIEW</div>
                        <div style="font-size: 11px; line-height: 1.4;">
                            <strong>Teacher Evaluated:</strong> Awr (${escapeHtml(cLvT.awr || '-')}), Sen (${escapeHtml(cLvT.sen || '-')}), Cre (${escapeHtml(cLvT.cre || '-')})<br/>
                            <strong>Learner Self Level:</strong> Awr (${escapeHtml(cLvL.awr || '-')}), Sen (${escapeHtml(cLvL.sen || '-')}), Cre (${escapeHtml(cLvL.cre || '-')})<br/>
                            <strong>Peer Review Level:</strong> Awr (${escapeHtml(cLvP.awr || '-')}), Sen (${escapeHtml(cLvP.sen || '-')}), Cre (${escapeHtml(cLvP.cre || '-')})
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">3. DYNAMIC TEACHER PARAMETERS ADDITIONS</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 12px; font-size: 10px; line-height: 1.45;">
                        <div>
                            <strong>Stage 1 Custom:</strong><br/>
                            Awr: ${escapeHtml(cS1TC.awrCustom1 || '-')}, ${escapeHtml(cS1TC.awrCustom2 || '-')}<br/>
                            Sen: ${escapeHtml(cS1TC.senCustom1 || '-')}, ${escapeHtml(cS1TC.senCustom2 || '-')}<br/>
                            Cre: ${escapeHtml(cS1TC.creCustom1 || '-')}, ${escapeHtml(cS1TC.creCustom2 || '-')}
                        </div>
                        <div>
                            <strong>Stage 2 Custom:</strong><br/>
                            Awr: ${escapeHtml(cS2TC.awrCustom1 || '-')}, ${escapeHtml(cS2TC.awrCustom2 || '-')}<br/>
                            Sen: ${escapeHtml(cS2TC.senCustom1 || '-')}, ${escapeHtml(cS2TC.senCustom2 || '-')}<br/>
                            Cre: ${escapeHtml(cS2TC.creCustom1 || '-')}, ${escapeHtml(cS2TC.creCustom2 || '-')}
                        </div>
                        <div>
                            <strong>Stage 3 Custom:</strong><br/>
                            Awr: ${escapeHtml(cS3TC.awrCustom1 || '-')}, ${escapeHtml(cS3TC.awrCustom2 || '-')}<br/>
                            Sen: ${escapeHtml(cS3TC.senCustom1 || '-')}, ${escapeHtml(cS3TC.senCustom2 || '-')}<br/>
                            Cre: ${escapeHtml(cS3TC.creCustom1 || '-')}, ${escapeHtml(cS3TC.creCustom2 || '-')}
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">4. INQUIRY PROBLEM SOLVING LOG</div>
                    <div style="font-size: 11.5px; line-height: 1.45;">
                        <strong>Problems Faced (Stage 1):</strong> ${escapeHtml(cS1L.problemFace || '-')}<br/>
                        <strong>Solutions applied / help needed:</strong> ${escapeHtml(cS1L.problemSolve || '-')}
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">5. POST-INQUIRY REFLECTIONS</div>
                    <div style="font-size: 11px; line-height: 1.45;">
                        <strong>What I learned from this solo mission:</strong> ${escapeHtml(cRefL.learnt || '-')}<br/>
                        <strong>Most enjoyable part:</strong> ${escapeHtml(cRefL.enjoyed || '-')}<br/>
                        <strong>My 3 main strengths:</strong> ${escapeHtml(cRefL.strengths || '-')}<br/>
                        <strong>Roadblocks faced:</strong> ${escapeHtml(cRefL.challenges || '-')}<br/>
                        <strong>2 areas to improve:</strong> ${escapeHtml(cRefL.improvements || '-')}<br/>
                        <strong>Questions remaining:</strong> ${escapeHtml(cRefL.questions || '-')}
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">6. COMMENTS & DIALOGUE LOG</div>
                    <div style="font-size: 11.5px; line-height: 1.45;">
                        <strong>Self-Appreciation Dialogue:</strong> "${escapeHtml(cS2L.appreciation || '-')}"<br/>
                        <strong>Peer Encouragement Appreciation note:</strong> "${escapeHtml(cS3P.appreciation || '-')}"<br/>
                        <strong>Teacher comments:</strong> "${escapeHtml(cRefT.finalComments || '-')}"<br/>
                        <strong>Teacher future suggestions:</strong> "${escapeHtml(cRefT.workOn || '-')}"
                    </div>
                </div>
            </div>
        </div>
        `;

        // --- PAGE 8: PART D CLASSROOM INTERACTIONS ---
        const dType = partD.interactionType || {};
        const dPed = partD.pedagogies || {};
        const dCust = partD.teacherCustomParams || {};
        const dAss = partD.teacherAssessments || {};
        const dLvT = partD.levelOverviewTeacher || {};
        const dRefL = partD.learnerReflection || {};
        const dLvL = partD.levelOverviewLearner || {};
        const dRefP = partD.peerReflection || {};
        const dLvP = partD.levelOverviewPeer || {};

        const renderInteractionType = (dt) => {
            const types = [];
            if (dt.discussion) types.push('Classroom discussion');
            if (dt.debate) types.push('Organised debate');
            if (dt.roleplay) types.push('Simulation/role play');
            if (dt.experiment) types.push('Lab experiment');
            if (dt.digital) types.push('Digital learning');
            if (dt.other && dt.otherSpecify) types.push(`Other: ${dt.otherSpecify}`);
            return types.map(item => `<span class="chip gold-chip" style="background:#2E5894;color:#FFF;border-color:#2E5894;margin: 2px;">&#x2713; ${escapeHtml(item)}</span>`).join('');
        };

        const renderCheckbox = (val) => {
            return val ? '<span style="color:#22c55e;font-weight:700;font-size:12px;">&#x2713; Ticked</span>' : '<span style="color:#aaa;font-size:10px;">[ ] Unticked</span>';
        };

        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Part D: Observation Template (Classroom Interactions)</div>
                
                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">1. DOSSIER & ACTIVITY CONFIG</div>
                    <div style="font-size: 11px; line-height: 1.4;">
                        <strong>Interaction Type:</strong> ${renderInteractionType(dType)}<br/><br/>
                        <strong>Subjects Involved:</strong> ${renderChips(partD.subjects)} | 
                        <strong>Goals:</strong> ${renderChips(partD.goals)}<br/><br/>
                        <strong>Pedagogies:</strong> ${renderPedagogies(dPed)}<br/><br/>
                        <strong>Topic/theme details:</strong> ${escapeHtml(partD.topic || '-')} | 
                        <strong>Duration:</strong> ${escapeHtml(partD.duration || 'NA')} | 
                        <strong>Competencies:</strong> ${renderChips(partD.competencies)}
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">2. TEACHER ASSESSMENT CHECKLIST (15 PARAMETERS)</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 15px; font-size: 9.5px; line-height: 1.4;">
                        <div>
                            <div style="font-weight:700;color:#2E5894;border-bottom:1px solid #eee;padding-bottom:2px;margin-bottom:4px;">AWARENESS (Level: ${escapeHtml(dLvT.awr || '-')})</div>
                            ${[1,2,3,4,5].map(n => dCust[`awr${n}`] ? `<div>- ${escapeHtml(dCust[`awr${n}`])}: ${renderCheckbox(dAss[`awr${n}`])}</div>` : '').join('')}
                        </div>
                        <div>
                            <div style="font-weight:700;color:#2E5894;border-bottom:1px solid #eee;padding-bottom:2px;margin-bottom:4px;">SENSITIVITY (Level: ${escapeHtml(dLvT.sen || '-')})</div>
                            ${[1,2,3,4,5].map(n => dCust[`sen${n}`] ? `<div>- ${escapeHtml(dCust[`sen${n}`])}: ${renderCheckbox(dAss[`sen${n}`])}</div>` : '').join('')}
                        </div>
                        <div style="grid-column: span 2; margin-top: 4px;">
                            <div style="font-weight:700;color:#2E5894;border-bottom:1px solid #eee;padding-bottom:2px;margin-bottom:4px;">CREATIVITY (Level: ${escapeHtml(dLvT.cre || '-')})</div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px 15px;">
                                ${[1,2,3,4,5].map(n => dCust[`cre${n}`] ? `<div>- ${escapeHtml(dCust[`cre${n}`])}: ${renderCheckbox(dAss[`cre${n}`])}</div>` : '').join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">3. LEARNER REFLECTION</div>
                        <div style="font-size: 11px; line-height: 1.45;">
                            <strong>Awr Level:</strong> ${escapeHtml(dLvL.awr || '-')} | 
                            <strong>Sen Level:</strong> ${escapeHtml(dLvL.sen || '-')} | 
                            <strong>Cre Level:</strong> ${escapeHtml(dLvL.cre || '-')}<br/>
                            <strong>Self-reflection comments:</strong> "${escapeHtml(dRefL.comments || '-')}"
                        </div>
                    </div>
                    <div class="glass-card" style="padding: 12px; margin-bottom: 0;">
                        <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">4. PEER FEEDBACK</div>
                        <div style="font-size: 11px; line-height: 1.45;">
                            <strong>Awr Level:</strong> ${escapeHtml(dLvP.awr || '-')} | 
                            <strong>Sen Level:</strong> ${escapeHtml(dLvP.sen || '-')} | 
                            <strong>Cre Level:</strong> ${escapeHtml(dLvP.cre || '-')}<br/>
                            <strong>Peer encouragement notes:</strong> "${escapeHtml(dRefP.appreciation || '-')}"
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #2E5894; margin-bottom: 6px;">5. TEACHER FINAL COMMENTS</div>
                    <div style="font-size: 11.5px; line-height: 1.4; font-style: italic;">
                        "${escapeHtml(dAss.comments || 'The learner collaborated very well during the debate, expressing points clearly.')}"
                    </div>
                </div>
            </div>
        </div>
        `;

        // --- PAGE 9: PART E & F TIME INVENTORIES ---
        const gHours = timeInventories.groupProjectHours || {};
        const pHours = timeInventories.problemInquiryHours || {};
        const cHours = timeInventories.classroomHours || {};
        const sSkills = timeInventories.skillTraining || [];
        const oCourses = timeInventories.onlineCourses || [];

        const getTimeStr = (obj, key) => {
            if (!obj || !obj[key]) return '00:00';
            const hh = String(obj[key].hh || '00').padStart(2, '0');
            const mm = String(obj[key].mm || '00').padStart(2, '0');
            return `${hh}:${mm}`;
        };

        const calcTotalMinutesObj = (obj) => {
            let total = 0;
            if (!obj) return '00:00';
            Object.values(obj).forEach(t => {
                const h = parseInt(t.hh, 10) || 0;
                const m = parseInt(t.mm, 10) || 0;
                total += h * 60 + m;
            });
            const hh = String(Math.floor(total / 60)).padStart(2, '0');
            const mm = String(total % 60).padStart(2, '0');
            return `${hh}:${mm}`;
        };

        const calcTotalMinutesArray = (arr) => {
            let total = 0;
            if (!arr) return '00:00';
            arr.forEach(t => {
                const h = parseInt(t.hh, 10) || 0;
                const m = parseInt(t.mm, 10) || 0;
                total += h * 60 + m;
            });
            const hh = String(Math.floor(total / 60)).padStart(2, '0');
            const mm = String(total % 60).padStart(2, '0');
            return `${hh}:${mm}`;
        };

        htmlContent += `
        <div class="page">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Part E & F: Time Inventories (Hours Spent)</div>
                
                <div class="glass-card" style="padding: 10px; margin-bottom: 10px;">
                    <div style="font-size: 10.5px; font-weight: 700; color: #2E5894; margin-bottom: 4px;">1. GROUP PROJECT WORK</div>
                    <table class="rubric-table" style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
                        <thead><tr style="background:#2E5894; color:#FFF;"><th style="padding:3px; width:75%;">Steps</th><th style="padding:3px; width:25%; text-align:center;">Hours Spent</th></tr></thead>
                        <tbody>
                            <tr><td style="padding:3px;">1. Research prompt/question/ problem/challenge/ planned final output</td><td style="text-align:center;padding:3px;">${getTimeStr(gHours, 'step1')}</td></tr>
                            <tr><td style="padding:3px;">2. Guiding questions</td><td style="text-align:center;padding:3px;">${getTimeStr(gHours, 'step2')}</td></tr>
                            <tr><td style="padding:3px;">3. Stage 1 (Brainstorming and ideation)</td><td style="text-align:center;padding:3px;">${getTimeStr(gHours, 'step3')}</td></tr>
                            <tr><td style="padding:3px;">4. Stage 2 (Drafting, feedback, and revision)</td><td style="text-align:center;padding:3px;">${getTimeStr(gHours, 'step4')}</td></tr>
                            <tr><td style="padding:3px;">5. Stage 3 (Final submission)</td><td style="text-align:center;padding:3px;">${getTimeStr(gHours, 'step5')}</td></tr>
                            <tr style="font-weight:700; background:rgba(0,0,0,0.02);"><td style="padding:3px;">Total</td><td style="text-align:center;padding:3px;color:#2E5894;">${calcTotalMinutesObj(gHours)}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="glass-card" style="padding: 10px; margin-bottom: 10px;">
                    <div style="font-size: 10.5px; font-weight: 700; color: #2E5894; margin-bottom: 4px;">2. PROBLEM-BASED INQUIRY (INDIVIDUAL WORK)</div>
                    <table class="rubric-table" style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
                        <thead><tr style="background:#2E5894; color:#FFF;"><th style="padding:3px; width:75%;">Steps</th><th style="padding:3px; width:25%; text-align:center;">Hours Spent</th></tr></thead>
                        <tbody>
                            <tr><td style="padding:3px;">1. Project prompt/question/problem/challenge/planned final output</td><td style="text-align:center;padding:3px;">${getTimeStr(pHours, 'step1')}</td></tr>
                            <tr><td style="padding:3px;">2. Hypothesis</td><td style="text-align:center;padding:3px;">${getTimeStr(pHours, 'step2')}</td></tr>
                            <tr><td style="padding:3px;">3. Guiding questions</td><td style="text-align:center;padding:3px;">${getTimeStr(pHours, 'step3')}</td></tr>
                            <tr><td style="padding:3px;">4. Evidence collection to support/negate hypothesis</td><td style="text-align:center;padding:3px;">${getTimeStr(pHours, 'step4')}</td></tr>
                            <tr><td style="padding:3px;">5. Analysis and synthesis</td><td style="text-align:center;padding:3px;">${getTimeStr(pHours, 'step5')}</td></tr>
                            <tr><td style="padding:3px;">6. Discussions</td><td style="text-align:center;padding:3px;">${getTimeStr(pHours, 'step6')}</td></tr>
                            <tr><td style="padding:3px;">7. Conclusion</td><td style="text-align:center;padding:3px;">${getTimeStr(pHours, 'step7')}</td></tr>
                            <tr style="font-weight:700; background:rgba(0,0,0,0.02);"><td style="padding:3px;">Total</td><td style="text-align:center;padding:3px;color:#2E5894;">${calcTotalMinutesObj(pHours)}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="glass-card" style="padding: 10px; margin-bottom: 10px;">
                    <div style="font-size: 10.5px; font-weight: 700; color: #2E5894; margin-bottom: 4px;">3. CLASSROOM INTERACTIONS</div>
                    <table class="rubric-table" style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
                        <thead><tr style="background:#2E5894; color:#FFF;"><th style="padding:3px; width:75%;">Steps</th><th style="padding:3px; width:25%; text-align:center;">Hours Spent</th></tr></thead>
                        <tbody>
                            <tr><td style="padding:3px;">1. Classroom discussion</td><td style="text-align:center;padding:3px;">${getTimeStr(cHours, 'step1')}</td></tr>
                            <tr><td style="padding:3px;">2. Organised debate</td><td style="text-align:center;padding:3px;">${getTimeStr(cHours, 'step2')}</td></tr>
                            <tr><td style="padding:3px;">3. Simulation/roleplay</td><td style="text-align:center;padding:3px;">${getTimeStr(cHours, 'step3')}</td></tr>
                            <tr><td style="padding:3px;">4. Lab experiment</td><td style="text-align:center;padding:3px;">${getTimeStr(cHours, 'step4')}</td></tr>
                            <tr><td style="padding:3px;">5. Digital Learning</td><td style="text-align:center;padding:3px;">${getTimeStr(cHours, 'step5')}</td></tr>
                            <tr style="font-weight:700; background:rgba(0,0,0,0.02);"><td style="padding:3px;">Total</td><td style="text-align:center;padding:3px;color:#2E5894;">${calcTotalMinutesObj(cHours)}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="glass-card" style="padding: 10px;">
                        <div style="font-size: 10px; font-weight: 700; color: #2E5894; margin-bottom: 4px;">4. SKILL TRAINING</div>
                        <table class="rubric-table" style="width: 100%; border-collapse: collapse; font-size: 8px;">
                            <thead><tr style="background:#2E5894; color:#FFF;"><th style="padding:2px; width:50%;">Skill</th><th style="padding:2px; width:25%; text-align:center;">Hours</th><th style="padding:2px; width:25%; text-align:center;">Status</th></tr></thead>
                            <tbody>
                                ${sSkills.map(s => `
                                    <tr>
                                        <td style="padding:2px;">${escapeHtml(s.name || 'Write here...')}</td>
                                        <td style="text-align:center;padding:2px;">${String(s.hh || '00').padStart(2,'0')}:${String(s.mm || '00').padStart(2,'0')}</td>
                                        <td style="text-align:center;padding:2px;">${escapeHtml(s.status || '-')}</td>
                                    </tr>
                                `).join('')}
                                <tr style="font-weight:700;"><td style="padding:2px;">Total</td><td style="text-align:center;padding:2px;color:#2E5894;">${calcTotalMinutesArray(sSkills)}</td><td></td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="glass-card" style="padding: 10px;">
                        <div style="font-size: 10px; font-weight: 700; color: #2E5894; margin-bottom: 4px;">5. ONLINE COURSE</div>
                        <table class="rubric-table" style="width: 100%; border-collapse: collapse; font-size: 8px;">
                            <thead><tr style="background:#2E5894; color:#FFF;"><th style="padding:2px; width:50%;">Course</th><th style="padding:2px; width:25%; text-align:center;">Hours</th><th style="padding:2px; width:25%; text-align:center;">Status</th></tr></thead>
                            <tbody>
                                ${oCourses.map(c => `
                                    <tr>
                                        <td style="padding:2px;">${escapeHtml(c.name || 'Write here...')}</td>
                                        <td style="text-align:center;padding:2px;">${String(c.hh || '00').padStart(2,'0')}:${String(c.mm || '00').padStart(2,'0')}</td>
                                        <td style="text-align:center;padding:2px;">${escapeHtml(c.status || '-')}</td>
                                    </tr>
                                `).join('')}
                                <tr style="font-weight:700;"><td style="padding:2px;">Total</td><td style="text-align:center;padding:2px;color:#2E5894;">${calcTotalMinutesArray(oCourses)}</td><td></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        `;
        // --- PAGE 10: COMPETENCY PROFILE MATRIX ---
        htmlContent += `
        <div class="page" style="page-break-after: avoid;">
            <div class="page-bg ${getBg()}"></div>
            <div class="glow-overlay"></div>
            <div class="matte-shield"></div>
            <div class="page-border"></div>
            <div class="content-container">
                <div class="section-title">Student’s Competency Profile (Secondary Stage)</div>
                
                <table class="rubric-table" style="width: 100%; border-collapse: collapse; font-size: 8px; margin-top: 4px;">
                    <thead>
                        <tr style="background:#2E5894; color:#FFF; font-size: 8.5px;">
                            <th style="padding:4px; width:48%;">ABILITIES & PERFORMANCE DESCRIPTORS</th>
                            <th style="padding:4px; width:13%; text-align:center;">GRADE 9</th>
                            <th style="padding:4px; width:13%; text-align:center;">GRADE 10</th>
                            <th style="padding:4px; width:13%; text-align:center;">GRADE 11</th>
                            <th style="padding:4px; width:13%; text-align:center;">GRADE 12</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- 1. AWARENESS -->
                        <tr style="background:rgba(46,88,148,0.06);"><td colspan="5" style="font-weight:700; padding:4px; font-size:9px; color:#2E5894;">1. AWARENESS SKILLS</td></tr>
                        <tr><td style="padding:3px;">a. Proficiency in language R1, R2, R3</td><td style="text-align:center;">${getCpBadge('awr_a', 9)}</td><td style="text-align:center;">${getCpBadge('awr_a', 10)}</td><td style="text-align:center;">${getCpBadge('awr_a', 11)}</td><td style="text-align:center;">${getCpBadge('awr_a', 12)}</td></tr>
                        <tr><td style="padding:3px;">b. Oral communication</td><td style="text-align:center;">${getCpBadge('awr_b', 9)}</td><td style="text-align:center;">${getCpBadge('awr_b', 10)}</td><td style="text-align:center;">${getCpBadge('awr_b', 11)}</td><td style="text-align:center;">${getCpBadge('awr_b', 12)}</td></tr>
                        <tr><td style="padding:3px;">c. Written communication</td><td style="text-align:center;">${getCpBadge('awr_c', 9)}</td><td style="text-align:center;">${getCpBadge('awr_c', 10)}</td><td style="text-align:center;">${getCpBadge('awr_c', 11)}</td><td style="text-align:center;">${getCpBadge('awr_c', 12)}</td></tr>
                        <tr><td style="padding:3px;">d. Health and nutrition literacy</td><td style="text-align:center;">${getCpBadge('awr_d', 9)}</td><td style="text-align:center;">${getCpBadge('awr_d', 10)}</td><td style="text-align:center;">${getCpBadge('awr_d', 11)}</td><td style="text-align:center;">${getCpBadge('awr_d', 12)}</td></tr>
                        <tr><td style="padding:3px;">e. Physical education, fitness, wellness, and sports</td><td style="text-align:center;">${getCpBadge('awr_e', 9)}</td><td style="text-align:center;">${getCpBadge('awr_e', 10)}</td><td style="text-align:center;">${getCpBadge('awr_e', 11)}</td><td style="text-align:center;">${getCpBadge('awr_e', 12)}</td></tr>
                        <tr><td style="padding:3px;">f. Digital literacy</td><td style="text-align:center;">${getCpBadge('awr_f', 9)}</td><td style="text-align:center;">${getCpBadge('awr_f', 10)}</td><td style="text-align:center;">${getCpBadge('awr_f', 11)}</td><td style="text-align:center;">${getCpBadge('awr_f', 12)}</td></tr>
                        <tr><td style="padding:3px;">g. Knowledge of India</td><td style="text-align:center;">${getCpBadge('awr_g', 9)}</td><td style="text-align:center;">${getCpBadge('awr_g', 10)}</td><td style="text-align:center;">${getCpBadge('awr_g', 11)}</td><td style="text-align:center;">${getCpBadge('awr_g', 12)}</td></tr>
                        <tr><td style="padding:3px;">h. Environmental literacy (conservation, sanitation)</td><td style="text-align:center;">${getCpBadge('awr_h', 9)}</td><td style="text-align:center;">${getCpBadge('awr_h', 10)}</td><td style="text-align:center;">${getCpBadge('awr_h', 11)}</td><td style="text-align:center;">${getCpBadge('awr_h', 12)}</td></tr>
                        <tr><td style="padding:3px;">i. Knowledge of critical issues (current affairs, global)</td><td style="text-align:center;">${getCpBadge('awr_i', 9)}</td><td style="text-align:center;">${getCpBadge('awr_i', 10)}</td><td style="text-align:center;">${getCpBadge('awr_i', 11)}</td><td style="text-align:center;">${getCpBadge('awr_i', 12)}</td></tr>

                        <!-- 2. SENSITIVITY -->
                        <tr style="background:rgba(46,88,148,0.06);"><td colspan="5" style="font-weight:700; padding:4px; font-size:9px; color:#2E5894;">2. SENSITIVITY SKILLS</td></tr>
                        <tr><td style="padding:3px;">a. Collaboration and teamwork</td><td style="text-align:center;">${getCpBadge('sen_a', 9)}</td><td style="text-align:center;">${getCpBadge('sen_a', 10)}</td><td style="text-align:center;">${getCpBadge('sen_a', 11)}</td><td style="text-align:center;">${getCpBadge('sen_a', 12)}</td></tr>
                        <tr><td style="padding:3px;">b. Ethical and moral reasoning</td><td style="text-align:center;">${getCpBadge('sen_b', 9)}</td><td style="text-align:center;">${getCpBadge('sen_b', 10)}</td><td style="text-align:center;">${getCpBadge('sen_b', 11)}</td><td style="text-align:center;">${getCpBadge('sen_b', 12)}</td></tr>
                        <tr><td style="padding:3px;">c. Practice of Constitutional values</td><td style="text-align:center;">${getCpBadge('sen_c', 9)}</td><td style="text-align:center;">${getCpBadge('sen_c', 10)}</td><td style="text-align:center;">${getCpBadge('sen_c', 11)}</td><td style="text-align:center;">${getCpBadge('sen_c', 12)}</td></tr>
                        <tr><td style="padding:3px;">d. Gender sensitivity</td><td style="text-align:center;">${getCpBadge('sen_d', 9)}</td><td style="text-align:center;">${getCpBadge('sen_d', 10)}</td><td style="text-align:center;">${getCpBadge('sen_d', 11)}</td><td style="text-align:center;">${getCpBadge('sen_d', 12)}</td></tr>
                        <tr><td style="padding:3px;">e. Citizenship skills and values</td><td style="text-align:center;">${getCpBadge('sen_e', 9)}</td><td style="text-align:center;">${getCpBadge('sen_e', 10)}</td><td style="text-align:center;">${getCpBadge('sen_e', 11)}</td><td style="text-align:center;">${getCpBadge('sen_e', 12)}</td></tr>
                        <tr><td style="padding:3px;">f. Fundamental duties</td><td style="text-align:center;">${getCpBadge('sen_f', 9)}</td><td style="text-align:center;">${getCpBadge('sen_f', 10)}</td><td style="text-align:center;">${getCpBadge('sen_f', 11)}</td><td style="text-align:center;">${getCpBadge('sen_f', 12)}</td></tr>

                        <!-- 3. CREATIVITY -->
                        <tr style="background:rgba(46,88,148,0.06);"><td colspan="5" style="font-weight:700; padding:4px; font-size:9px; color:#2E5894;">3. CREATIVITY SKILLS</td></tr>
                        <tr><td style="padding:3px;">a. Scientific temper and evidence-based thinking</td><td style="text-align:center;">${getCpBadge('cre_a', 9)}</td><td style="text-align:center;">${getCpBadge('cre_a', 10)}</td><td style="text-align:center;">${getCpBadge('cre_a', 11)}</td><td style="text-align:center;">${getCpBadge('cre_a', 12)}</td></tr>
                        <tr><td style="padding:3px;">b. Creativity and innovativeness</td><td style="text-align:center;">${getCpBadge('cre_b', 9)}</td><td style="text-align:center;">${getCpBadge('cre_b', 10)}</td><td style="text-align:center;">${getCpBadge('cre_b', 11)}</td><td style="text-align:center;">${getCpBadge('cre_b', 12)}</td></tr>
                        <tr><td style="padding:3px;">c. Sense of aesthetics and art</td><td style="text-align:center;">${getCpBadge('cre_c', 9)}</td><td style="text-align:center;">${getCpBadge('cre_c', 10)}</td><td style="text-align:center;">${getCpBadge('cre_c', 11)}</td><td style="text-align:center;">${getCpBadge('cre_c', 12)}</td></tr>
                        <tr><td style="padding:3px;">d. Critical thinking</td><td style="text-align:center;">${getCpBadge('cre_d', 9)}</td><td style="text-align:center;">${getCpBadge('cre_d', 10)}</td><td style="text-align:center;">${getCpBadge('cre_d', 11)}</td><td style="text-align:center;">${getCpBadge('cre_d', 12)}</td></tr>
                        <tr><td style="padding:3px;">e. Problem-solving</td><td style="text-align:center;">${getCpBadge('cre_e', 9)}</td><td style="text-align:center;">${getCpBadge('cre_e', 10)}</td><td style="text-align:center;">${getCpBadge('cre_e', 11)}</td><td style="text-align:center;">${getCpBadge('cre_e', 12)}</td></tr>
                        <tr><td style="padding:3px;">f. Skills training (Vocational)</td><td style="text-align:center;">${getCpBadge('cre_f', 9)}</td><td style="text-align:center;">${getCpBadge('cre_f', 10)}</td><td style="text-align:center;">${getCpBadge('cre_f', 11)}</td><td style="text-align:center;">${getCpBadge('cre_f', 12)}</td></tr>
                        <tr><td style="padding:3px;">g. Coding and computational thinking</td><td style="text-align:center;">${getCpBadge('cre_g', 9)}</td><td style="text-align:center;">${getCpBadge('cre_g', 10)}</td><td style="text-align:center;">${getCpBadge('cre_g', 11)}</td><td style="text-align:center;">${getCpBadge('cre_g', 12)}</td></tr>
                    </tbody>
                </table>

                <div class="sigs-row" style="margin-top: 30px;">
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
    }

    htmlContent += `
</body>
</html>
`;
    return htmlContent;
}

module.exports = { buildHpcHtml };
