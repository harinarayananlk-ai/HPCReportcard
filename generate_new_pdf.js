const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const studentData = {
    schoolName: "Samosa High International",
    session: "2025-26",
    studentName: "Ladoo Lal",
    registrationNumber: "REG-MITHAI-101",
    className: "Bal Vatika 1",
    section: "A",
    teacherName: "Mr. Sharma",
    domain: "Physical Development",
    goals: ["Motor Skills", "Coordination", "Physical Awareness"],
    competencies: ["Running & Jumping", "Hand-Eye Coordination", "Balance"],
    activities: "Participated in the annual sports day. Showed great enthusiasm in the relay race and obstacle course. Demonstrated improved balance during yoga sessions.",
    rubric: {
        "0-0": "Highly aware of body space.", "0-1": "Focused on tasks.", "0-2": "Observant of peers.",
        "1-0": "Kind and helpful.", "1-1": "Shows empathy.", "1-2": "Expressive with feelings.",
        "2-0": "Creative in play.", "2-1": "Unique solutions.", "2-2": "Good imagination."
    },
    teacherFeedback: "Ladoo is a joy to have in class. His physical skills are developing rapidly, and he is becoming more social and cooperative during group activities.",
    selfAssessment: "I love playing with my friends and learning new games in the playground."
};

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
        .header p { margin: 5px 0; font-weight: bold; }
        
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; }
        .profile-item { border-bottom: 1px solid #eee; padding: 5px 0; }
        .label { font-weight: bold; font-size: 12px; color: #666; text-transform: uppercase; }
        .value { font-size: 14px; font-weight: bold; }

        .section-title { background: #f0f0f0; padding: 8px; font-weight: bold; margin-top: 20px; border-left: 5px solid #333; text-transform: uppercase; font-size: 14px; }
        .content-box { border: 1px solid #ddd; padding: 15px; margin-top: 5px; min-height: 60px; font-size: 13px; }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #333; padding: 12px; text-align: left; vertical-align: top; }
        th { background: #f9f9f9; font-size: 12px; text-transform: uppercase; }
        .matrix-cell { font-size: 12px; min-height: 50px; }
        
        .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; border-top: 1px solid #333; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Holistic Progress Card</h1>
        <p>${studentData.schoolName}</p>
        <p>Session: ${studentData.session}</p>
    </div>

    <div class="profile-grid">
        <div class="profile-item"><span class="label">Student Name:</span> <span class="value">${studentData.studentName}</span></div>
        <div class="profile-item"><span class="label">ID:</span> <span class="value">${studentData.registrationNumber}</span></div>
        <div class="profile-item"><span class="label">Class:</span> <span class="value">${studentData.className}</span></div>
        <div class="profile-item"><span class="label">Section:</span> <span class="value">${studentData.section}</span></div>
        <div class="profile-item"><span class="label">Teacher:</span> <span class="value">${studentData.teacherName}</span></div>
    </div>

    <div class="section-title">Assessment Context</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
            <span class="label">Domain</span>
            <div class="content-box">${studentData.domain}</div>
        </div>
        <div>
            <span class="label">Curricular Goals</span>
            <div class="content-box">${studentData.goals.join(', ')}</div>
        </div>
    </div>
    <div style="margin-top: 10px;">
        <span class="label">Competencies</span>
        <div class="content-box">${studentData.competencies.join(', ')}</div>
    </div>

    <div class="section-title">Activities Performed</div>
    <div class="content-box">${studentData.activities}</div>

    <div class="section-title">Attendance Record (Apr - Mar)</div>
    <table style="font-size: 10px; margin-top: 10px;">
        <thead>
            <tr style="background: #f0f0f0;">
                <th>Month</th>
                ${(studentData.attendance?.months || ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"]).map(m => `<th>${m}</th>`).join('')}
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Work</strong></td>
                ${(studentData.attendance?.workingDays || Array(12).fill(0)).map(d => `<td>${d}</td>`).join('')}
                <td>${(studentData.attendance?.workingDays || []).reduce((a, b) => (parseFloat(a)||0) + (parseFloat(b)||0), 0)}</td>
            </tr>
            <tr>
                <td><strong>Attd</strong></td>
                ${(studentData.attendance?.attendedDays || Array(12).fill(0)).map(d => `<td>${d}</td>`).join('')}
                <td>${(studentData.attendance?.attendedDays || []).reduce((a, b) => (parseFloat(a)||0) + (parseFloat(b)||0), 0)}</td>
            </tr>
        </tbody>
    </table>
    <table>
        <thead>
            <tr>
                <th>Focus Area</th>
                <th>Stream (Initial)</th>
                <th>Mountain (Moving)</th>
                <th>Sky (Beyond)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Awareness</strong></td>
                <td class="matrix-cell">${studentData.rubric["0-0"]}</td>
                <td class="matrix-cell">${studentData.rubric["0-1"]}</td>
                <td class="matrix-cell">${studentData.rubric["0-2"]}</td>
            </tr>
            <tr>
                <td><strong>Sensitivity</strong></td>
                <td class="matrix-cell">${studentData.rubric["1-0"]}</td>
                <td class="matrix-cell">${studentData.rubric["1-1"]}</td>
                <td class="matrix-cell">${studentData.rubric["1-2"]}</td>
            </tr>
            <tr>
                <td><strong>Creativity</strong></td>
                <td class="matrix-cell">${studentData.rubric["2-0"]}</td>
                <td class="matrix-cell">${studentData.rubric["2-1"]}</td>
                <td class="matrix-cell">${studentData.rubric["2-2"]}</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">Feedback & Observations</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
            <span class="label">Teacher Feedback</span>
            <div class="content-box">${studentData.teacherFeedback}</div>
        </div>
        <div>
            <span class="label">Student Self-Assessment</span>
            <div class="content-box">${studentData.selfAssessment}</div>
        </div>
    </div>

    <div class="footer">
        <div>Class Teacher Signature</div>
        <div>Principal Signature</div>
        <div>Parent Signature</div>
    </div>
</body>
</html>
`;

async function run() {
    try {
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        
        const inputPath = process.argv[2];
        const outputPath = process.argv[3];
        
        let dynamicData = {};
        if (inputPath && fs.existsSync(inputPath)) {
            dynamicData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        }

        // Merge dynamic data into studentData
        if (dynamicData.profile) Object.assign(studentData, dynamicData.profile);
        if (dynamicData.family) Object.assign(studentData, dynamicData.family);
        if (dynamicData.assessment) Object.assign(studentData, dynamicData.assessment);
        
        const finalOutputPath = outputPath || path.join(__dirname, 'Backend/exports/New_Generated_Report.pdf');
        await page.pdf({
            path: finalOutputPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });

        console.log('SUCCESS: ' + finalOutputPath);
        await browser.close();
    } catch (err) {
        console.error('FAILURE: ', err);
        process.exit(1);
    }
}

run();
