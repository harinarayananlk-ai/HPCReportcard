const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper to get base64 of image
function getBase64(file) {
    const filePath = path.join(__dirname, 'assets/images', file);
    if (!fs.existsSync(filePath)) return '';
    const bitmap = fs.readFileSync(filePath);
    return `data:image/png;base64,${bitmap.toString('base64')}`;
}

const images = {
    pencil: getBase64('—Pngtree—cute animated pencil with a_20310028.png'),
    cheerful: getBase64('—Pngtree—how to draw a cheerful_20790045.png'),
    schoolItems: getBase64('—Pngtree—vibrant back to school items_18746577.png'),
    tree: getBase64('tree.png')
};

// COMPREHENSIVE DATA MAPPING BASED ON USER LIST
const studentData = {
    school: {
        name: "Holistic Academy of Excellence",
        addressLine1: "123 Education Lane",
        addressLine2: "Knowledge Park",
        pincode: "110001",
        udiseCode: "afa12",
        teacherCode: "T-987"
    },
    profile: {
        name: "Ladoo Lal",
        rollNumber: "42",
        registrationNumber: "REG-MITHAI-101",
        class: "Bal Vatika 1",
        section: "A",
        dob: "15/08/2018",
        addressLine1: "House No. 42, Mithai Gali",
        addressLine2: "Halwai Chowk, Delhi",
        phone: "9812345678"
    },
    family: {
        motherName: "Meera Devi", motherEducation: "B.A.", motherOccupation: "Homemaker",
        fatherName: "Rajesh Prasad", fatherEducation: "M.Com", fatherOccupation: "Business",
        siblingsCount: 1, siblingAge: "4",
        motherTongue: "Hindi", mediumOfInstruction: "English", ruralUrban: "Urban"
    },
    attendance: {
        months: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
        workingDays: [22, 20, 15, 21, 22, 20, 18, 21, 20, 22, 19, 22],
        attendedDays: [21, 18, 15, 20, 22, 19, 17, 20, 19, 21, 18, 21],
        reasons: "N/A"
    },
    assessment: {
        domain: "Physical Development",
        domain2: "Socio-emotional Development",
        curriculumGoal: "Emotional Awareness & Coordination",
        competencies: "Expressing emotions clearly, Balance",
        activities: "Participated in the annual sports day...",
        arMatrix: { // Anecdotal Record
            awareness: { stream: "NA", mountain: "NA", sky: "NA" },
            sensitivity: { stream: "NA", mountain: "NA", sky: "NA" },
            creativity: { stream: "NA", mountain: "NA", sky: "NA" }
        },
        tfMatrix: { // Teacher Feedback
            awareness: { stream: "NA", mountain: "NA", sky: "NA" },
            sensitivity: { stream: "NA", mountain: "NA", sky: "NA" },
            creativity: { stream: "NA", mountain: "NA", sky: "NA" }
        },
        selfReflection: {
            likedWork: "YES", foundEasy: "YES", neededHelp: "A LITTLE",
            friendLiked: "YES", friendEasy: "YES", friendNeeded: "NO"
        },
        resourcesAtHome: "Drawing books, Building blocks",
        comments: "Ladoo is showing great promise in social activities."
    },
    domainMatrices: {
        d1: { awareness: "NA", sensitivity: "NA", creativity: "NA" },
        d2: { awareness: "NA", sensitivity: "NA", creativity: "NA" },
        d3: { awareness: "NA", sensitivity: "NA", creativity: "NA" },
        d4: { awareness: "NA", sensitivity: "NA", creativity: "NA" },
        d5: { awareness: "NA", sensitivity: "NA", creativity: "NA" },
        d6: { awareness: "NA", sensitivity: "NA", creativity: "NA" }
    }
};

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Playfair+Display:wght@700;900&display=swap');
        
        * { box-sizing: border-box; }
        body { font-family: 'Outfit', sans-serif; margin: 0; padding: 0; background: #fff; color: #2d3436; }
        .page { 
            width: 210mm; 
            height: 297mm; 
            padding: 15mm; 
            position: relative; 
            overflow: hidden; 
            page-break-after: always;
        }
        
        /* Decorative Background */
        .bg-decor { position: absolute; bottom: -50px; right: -50px; width: 400px; opacity: 0.1; z-index: 0; }
        .bg-top-left { position: absolute; top: -20px; left: -20px; width: 200px; opacity: 0.05; z-index: 0; transform: rotate(-15deg); }

        .header { 
            text-align: center; border-bottom: 4px solid #6c5ce7; padding-bottom: 10px; margin-bottom: 20px; position: relative; z-index: 1;
        }
        .header h1 { font-family: 'Playfair Display', serif; font-size: 28px; margin: 0; color: #6c5ce7; text-transform: uppercase; }
        .header p { margin: 2px 0; font-weight: 600; color: #636e72; font-size: 14px; }

        .section-title { 
            background: #f1f2f6; padding: 8px 15px; border-radius: 8px; font-weight: 800; 
            text-transform: uppercase; font-size: 14px; color: #2d3436; margin: 20px 0 10px 0;
            border-left: 6px solid #6c5ce7;
        }

        .data-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px; }
        .data-item { border-bottom: 1.5px solid #f1f2f6; padding: 4px 0; }
        .label { font-size: 9px; font-weight: 800; color: #b2bec3; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { font-size: 12px; font-weight: 600; color: #2d3436; }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1.5px solid #dfe6e9; border-radius: 8px; overflow: hidden; }
        th, td { border: 1px solid #dfe6e9; padding: 8px; font-size: 10px; text-align: center; }
        th { background: #6c5ce7; color: #fff; text-transform: uppercase; font-size: 9px; }
        .att-table td { font-size: 9px; font-weight: bold; }

        .matrix-table th { background: #a29bfe; font-size: 8px; }
        .matrix-table td { font-size: 10px; min-height: 30px; }

        .footer-decor { position: absolute; bottom: 10mm; left: 50%; transform: translateX(-50%); width: 60%; opacity: 0.5; }
    </style>
</head>
<body>
    <!-- PAGE 1: ADMINISTRATIVE & PROFILE -->
    <div class="page">
        <img src="${images.tree}" class="bg-top-left" />
        <div class="header">
            <h1>Holistic Progress Card</h1>
            <p>${studentData.school.name}</p>
            <p>${studentData.school.addressLine1}, ${studentData.school.addressLine2} - ${studentData.school.pincode}</p>
        </div>

        <div class="section-title">School Information</div>
        <div class="data-grid">
            <div class="data-item"><span class="label">UDISE Code</span><div class="value">${studentData.school.udiseCode}</div></div>
            <div class="data-item"><span class="label">Teacher Code</span><div class="value">${studentData.school.teacherCode}</div></div>
        </div>

        <div class="section-title">Student Profile</div>
        <div class="data-grid">
            <div class="data-item"><span class="label">Student Name</span><div class="value">${studentData.profile.name}</div></div>
            <div class="data-item"><span class="label">Roll Number</span><div class="value">${studentData.profile.rollNumber}</div></div>
            <div class="data-item"><span class="label">Registration ID</span><div class="value">${studentData.profile.registrationNumber}</div></div>
            <div class="data-item"><span class="label">Class & Section</span><div class="value">${studentData.profile.class} - ${studentData.profile.section}</div></div>
            <div class="data-item"><span class="label">Date of Birth</span><div class="value">${studentData.profile.dob}</div></div>
            <div class="data-item"><span class="label">Phone Number</span><div class="value">${studentData.profile.phone}</div></div>
            <div class="data-item" style="grid-column: span 2;"><span class="label">Residential Address</span><div class="value">${studentData.profile.addressLine1}, ${studentData.profile.addressLine2}</div></div>
        </div>

        <div class="section-title">Family Details</div>
        <div class="data-grid">
            <div class="data-item"><span class="label">Mother's Name</span><div class="value">${studentData.family.motherName} (${studentData.family.motherEducation})</div></div>
            <div class="data-item"><span class="label">Mother's Occupation</span><div class="value">${studentData.family.motherOccupation}</div></div>
            <div class="data-item"><span class="label">Father's Name</span><div class="value">${studentData.family.fatherName} (${studentData.family.fatherEducation})</div></div>
            <div class="data-item"><span class="label">Father's Occupation</span><div class="value">${studentData.family.fatherOccupation}</div></div>
            <div class="data-item"><span class="label">Number of Siblings</span><div class="value">${studentData.family.siblingsCount} (Age: ${studentData.family.siblingAge})</div></div>
            <div class="data-item"><span class="label">Mother Tongue</span><div class="value">${studentData.family.motherTongue}</div></div>
            <div class="data-item"><span class="label">Medium of Instruction</span><div class="value">${studentData.family.mediumOfInstruction}</div></div>
            <div class="data-item"><span class="label">Rural/Urban</span><div class="value">${studentData.family.ruralUrban}</div></div>
        </div>

        <div class="section-title">Attendance Summary (Apr - Mar)</div>
        <table class="att-table">
            <thead>
                <tr>
                    <th>Month</th>
                    ${studentData.attendance.months.map(m => `<th>${m}</th>`).join('')}
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="font-weight:bold">Working</td>
                    ${studentData.attendance.workingDays.map(d => `<td>${d}</td>`).join('')}
                    <td>${studentData.attendance.workingDays.reduce((a, b) => a + b, 0)}</td>
                </tr>
                <tr>
                    <td style="font-weight:bold">Attended</td>
                    ${studentData.attendance.attendedDays.map(d => `<td>${d}</td>`).join('')}
                    <td>${studentData.attendance.attendedDays.reduce((a, b) => a + b, 0)}</td>
                </tr>
                <tr>
                    <td style="font-weight:bold">%</td>
                    ${studentData.attendance.attendedDays.map((d, i) => `<td>${((d / studentData.attendance.workingDays[i]) * 100).toFixed(0)}%</td>`).join('')}
                    <td>${((studentData.attendance.attendedDays.reduce((a, b) => a + b, 0) / studentData.attendance.workingDays.reduce((a, b) => a + b, 0)) * 100).toFixed(0)}%</td>
                </tr>
            </tbody>
        </table>
        <div style="margin-top:10px;"><span class="label">Reasons for Low Attendance (if any)</span><div class="value">${studentData.attendance.reasons}</div></div>
    </div>

    <!-- PAGE 2: ASSESSMENT & RUBRICS -->
    <div class="page">
        <div class="section-title">Assessment Context</div>
        <div class="data-grid">
            <div class="data-item"><span class="label">Primary Domain</span><div class="value">${studentData.assessment.domain}</div></div>
            <div class="data-item"><span class="label">Secondary Domain</span><div class="value">${studentData.assessment.domain2}</div></div>
            <div class="data-item" style="grid-column: span 2;"><span class="label">Curriculum Goals</span><div class="value">${studentData.assessment.curriculumGoal}</div></div>
            <div class="data-item" style="grid-column: span 2;"><span class="label">Key Competencies</span><div class="value">${studentData.assessment.competencies}</div></div>
        </div>

        <div class="section-title">Activities Performed</div>
        <div style="border: 1px solid #dfe6e9; padding: 10px; border-radius: 8px; font-size: 12px; min-height: 80px;">
            ${studentData.assessment.activities}
        </div>

        <div class="section-title">AR Matrix (Anecdotal Record)</div>
        <table class="matrix-table">
            <thead>
                <tr>
                    <th>Criteria</th>
                    <th>Stream</th>
                    <th>Mountain</th>
                    <th>Sky</th>
                </tr>
            </thead>
            <tbody>
                <tr><td class="row-head">Awareness</td><td>${studentData.assessment.arMatrix.awareness.stream}</td><td>${studentData.assessment.arMatrix.awareness.mountain}</td><td>${studentData.assessment.arMatrix.awareness.sky}</td></tr>
                <tr><td class="row-head">Sensitivity</td><td>${studentData.assessment.arMatrix.sensitivity.stream}</td><td>${studentData.assessment.arMatrix.sensitivity.mountain}</td><td>${studentData.assessment.arMatrix.sensitivity.sky}</td></tr>
                <tr><td class="row-head">Creativity</td><td>${studentData.assessment.arMatrix.creativity.stream}</td><td>${studentData.assessment.arMatrix.creativity.mountain}</td><td>${studentData.assessment.arMatrix.creativity.sky}</td></tr>
            </tbody>
        </table>

        <div class="section-title">TF Matrix (Teacher Feedback)</div>
        <table class="matrix-table">
            <thead>
                <tr>
                    <th>Criteria</th>
                    <th>Stream</th>
                    <th>Mountain</th>
                    <th>Sky</th>
                </tr>
            </thead>
            <tbody>
                <tr><td class="row-head">Awareness</td><td>${studentData.assessment.tfMatrix.awareness.stream}</td><td>${studentData.assessment.tfMatrix.awareness.mountain}</td><td>${studentData.assessment.tfMatrix.awareness.sky}</td></tr>
                <tr><td class="row-head">Sensitivity</td><td>${studentData.assessment.tfMatrix.sensitivity.stream}</td><td>${studentData.assessment.tfMatrix.sensitivity.mountain}</td><td>${studentData.assessment.tfMatrix.sensitivity.sky}</td></tr>
                <tr><td class="row-head">Creativity</td><td>${studentData.assessment.tfMatrix.creativity.stream}</td><td>${studentData.assessment.tfMatrix.creativity.mountain}</td><td>${studentData.assessment.tfMatrix.creativity.sky}</td></tr>
            </tbody>
        </table>

        <div class="section-title">Self & Peer Reflection</div>
        <div class="data-grid">
            <div class="data-item"><span class="label">I liked doing this work</span><div class="value">${studentData.assessment.selfReflection.likedWork}</div></div>
            <div class="data-item"><span class="label">My friend liked doing this work</span><div class="value">${studentData.assessment.selfReflection.friendLiked}</div></div>
            <div class="data-item"><span class="label">I found this work easy</span><div class="value">${studentData.assessment.selfReflection.foundEasy}</div></div>
            <div class="data-item"><span class="label">My friend found this work easy</span><div class="value">${studentData.assessment.selfReflection.friendEasy}</div></div>
            <div class="data-item"><span class="label">I needed... to do this work</span><div class="value">${studentData.assessment.selfReflection.neededHelp}</div></div>
            <div class="data-item"><span class="label">My friend needed... to do this work</span><div class="value">${studentData.assessment.selfReflection.friendNeeded}</div></div>
        </div>

        <div class="section-title">Home Resources & Remarks</div>
        <div class="data-grid">
            <div class="data-item" style="grid-column: span 2;"><span class="label">Teaching Resources at Home</span><div class="value">${studentData.assessment.resourcesAtHome}</div></div>
            <div class="data-item" style="grid-column: span 2;"><span class="label">Final Comments / Remarks</span><div class="value">${studentData.assessment.comments}</div></div>
        </div>
    </div>

    <!-- PAGE 3: DOMAIN SPECIFIC MATRICES -->
    <div class="page">
        <div class="section-title">Detailed Domain Progress (D1 - D6)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            ${[1,2,3,4,5,6].map(n => `
                <div style="border: 1px solid #dfe6e9; padding: 10px; border-radius: 8px;">
                    <span class="label" style="color:#6c5ce7">Domain D${n} Progress</span>
                    <div class="data-grid" style="grid-template-columns: 1fr; margin-top:5px;">
                        <div class="data-item"><span class="label">Awareness</span><div class="value">${studentData.domainMatrices['d'+n].awareness}</div></div>
                        <div class="data-item"><span class="label">Sensitivity</span><div class="value">${studentData.domainMatrices['d'+n].sensitivity}</div></div>
                        <div class="data-item"><span class="label">Creativity</span><div class="value">${studentData.domainMatrices['d'+n].creativity}</div></div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <img src="${images.schoolItems}" class="footer-decor" />
    </div>
</body>
</html>
`;

async function run() {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        console.log('Setting content...');
        await page.setContent(htmlContent);
        
        const inputPath = process.argv[2];
        const outputPath = process.argv[3];
        const finalOutputPath = outputPath || path.join(__dirname, 'Backend/exports/Comprehensive_Report_Card.pdf');
        
        console.log('Generating PDF...');
        await page.pdf({
            path: finalOutputPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });

        console.log('SUCCESS: ' + finalOutputPath);
        await browser.close();
    } catch (err) {
        console.error('FAILURE: ', err);
        process.exit(1);
    }
}

run();
