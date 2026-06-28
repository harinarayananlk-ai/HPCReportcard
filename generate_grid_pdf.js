const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function getBase64(file) {
    const filePath = path.join(__dirname, 'assets/images', file);
    if (!fs.existsSync(filePath)) return '';
    const bitmap = fs.readFileSync(filePath);
    return `data:image/png;base64,${bitmap.toString('base64')}`;
}

const images = {
    sky: getBase64('1.png'),
    stream: getBase64('2.png'),
    mountain: getBase64('3.png'),
    certBorder: getBase64('—Pngtree—stationery decoration golden school border_6782234.png'),
    pencil: getBase64('—Pngtree—cute animated pencil with a_20310028.png'),
    cheerful: getBase64('—Pngtree—how to draw a cheerful_20790045.png'),
    schoolItems: getBase64('—Pngtree—vibrant back to school items_18746577.png'),
    tree: getBase64('tree.png')
};

// Load data from file if provided, otherwise use sample
let studentData = {
    school: { name: "Holistic Academy", addr1: "123 Education St", addr2: "Vidya Nagar", pin: "110001", udise: "afa12", tCode: "T-99" },
    profile: { name: "Ladoo Lal", roll: "42", reg: "REG-M101", class: "Bal Vatika 1", sec: "A", dob: "15/08/2018", addr1: "House 42", addr2: "Mithai Gali", phone: "9812345678" },
    family: { mName: "Meera Devi", mEdu: "BA", mOcc: "Home", fName: "Rajesh", fEdu: "MA", fOcc: "Biz", sibs: "1", sibAge: "4", lang: "Hindi", med: "English", type: "Urban" },
    att: { work: Array(12).fill(22), attd: Array(12).fill(20), reas: "N/A" },
    domains: [
        { id: "D1", name: "Physical Development", goal: "Gross Motor Skills", comp: "Running, Jumping, Balancing", activities: "Active participation in sports..." },
        { id: "D2", name: "Socio-Emotional", goal: "Self-Awareness", comp: "Expressing needs, empathy", activities: "Very helpful to peers..." },
        { id: "D3", name: "Language & Literacy", goal: "Vocabulary", comp: "Storytelling, Rhymes", activities: "Recites poems with expression..." },
        { id: "D4", name: "Cognitive", goal: "Problem Solving", comp: "Puzzles, Logic", activities: "Great at block building..." },
        { id: "D5", name: "Aesthetic", goal: "Artistic Expression", comp: "Drawing, Color sense", activities: "Creative use of colors..." },
        { id: "D6", name: "Positive Habits", goal: "Health & Hygiene", comp: "Handwashing, Eating", activities: "Maintains good hygiene..." }
    ],
    reflection: { liked: "Yes", easy: "Yes", needed: "A little", fliked: "Yes", feasy: "Yes", fneeded: "No", home: "Story books", remarks: "Ladoo is a joy to have in class!" }
};

if (process.argv[2]) {
    try {
        const dataPath = path.resolve(process.argv[2]);
        if (fs.existsSync(dataPath)) {
            const fileData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            studentData = { ...studentData, ...fileData };
            console.log("Using dynamic data from: " + dataPath);
        }
    } catch (e) {
        console.error("Error loading dynamic data: " + e.message);
    }
}

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;600&family=Outfit:wght@300;400;600&display=swap');
        
        * { box-sizing: border-box; }
        body { font-family: 'Jost', sans-serif; margin: 0; padding: 0; background: #fff; color: #1a1a1a; }
        
        .page { 
            width: 210mm; height: 297mm; padding: 15mm; position: relative; overflow: hidden; 
            page-break-after: always; background: #fff; border: 1px solid #eee;
        }

        .grid-bg {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-image: linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px);
            background-size: 20px 20px; opacity: 0.3; pointer-events: none; z-index: 0;
        }

        .content { position: relative; z-index: 1; }

        .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #e0e0e0; padding-bottom: 15px; position: relative; }
        .header::after { content: ''; position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%); width: 40px; height: 3px; background: #D4AF37; }
        .header h1 { font-family: 'Jost', sans-serif; font-size: 28px; font-weight: 300; margin: 0; color: #1a1a1a; text-transform: uppercase; letter-spacing: 4px; }

        .form-grid { 
            display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;
        }
        .form-box { 
            border: 1px solid #eee; border-radius: 4px; padding: 10px; background: #fff; min-height: 45px;
            display: flex; flex-direction: column; justify-content: center;
        }
        .label { font-size: 8px; font-weight: 600; color: #999; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 1px; }
        .value { font-size: 14px; font-weight: 600; color: #000; }

        .section-title { 
            background: #fafafa; color: #444; padding: 10px 15px; font-weight: 600; 
            text-transform: uppercase; font-size: 11px; margin: 25px 0 10px 0; border-left: 3px solid #D4AF37;
            letter-spacing: 1.5px;
        }

        .full-box { border: 2px solid #333; padding: 15px; font-size: 14px; min-height: 100px; background: #fff; margin-bottom: 15px; position: relative; }
        
        .rubric-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .rubric-table th, .rubric-table td { border: 2px solid #333; padding: 15px; text-align: center; }
        .rubric-table th { background: #f4f4f4; }
        .rubric-icon { width: 60px; height: 60px; object-fit: contain; }

        .scan-box { 
            width: 180px; height: 100px; border: 1px solid #eee; background: #fdfdfd; 
            display: flex; align-items: center; justify-content: center; font-size: 9px; color: #bbb; font-weight: 400;
            text-transform: uppercase; letter-spacing: 1px;
        }

        .certificate-page {
            background-image: url('${images.certBorder}');
            background-size: 100% 100%;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            text-align: center; padding: 40mm;
        }
        
        .page-num { position: absolute; bottom: 8mm; right: 8mm; font-size: 10px; font-weight: bold; color: #b2bec3; }
    </style>
</head>
<body>
    <!-- PAGE 1: COVER -->
    <div class="page">
        <div class="grid-bg"></div>
        <div class="content" style="text-align: center; margin-top: 60mm;">
            <img src="${images.cheerful}" style="width: 180px; opacity: 0.8;" />
            <h1 style="font-family: 'Jost', sans-serif; font-size: 56px; font-weight: 300; color: #1a1a1a; margin: 20px 0; letter-spacing: 10px;">HOLISTIC</h1>
            <h2 style="font-size: 14px; letter-spacing: 8px; color: #D4AF37; font-weight: 600; text-transform: uppercase;">PROGRESS CARD</h2>
            <div style="margin-top: 40mm; font-size: 18px; font-weight: 300; letter-spacing: 4px; color: #666;">SESSION 2025 - 2026</div>
        </div>
        <div class="page-num">Page 1</div>
    </div>

    <!-- PAGE 2: STUDENT PROFILE (GRID STYLE) -->
    <div class="page">
        <div class="grid-bg"></div>
        <div class="content">
            <div class="header"><h1>Student Profile</h1></div>
            <div class="form-grid">
                <div class="form-box"><span class="label">Name of Student</span><div class="value">${studentData.profile.name}</div></div>
                <div class="form-box"><span class="label">Roll Number</span><div class="value">${studentData.profile.roll}</div></div>
                <div class="form-box"><span class="label">Registration ID</span><div class="value">${studentData.profile.reg}</div></div>
                <div class="form-box"><span class="label">Class & Section</span><div class="value">${studentData.profile.class} - ${studentData.profile.sec}</div></div>
                <div class="form-box"><span class="label">Date of Birth</span><div class="value">${studentData.profile.dob}</div></div>
                <div class="form-box"><span class="label">Phone</span><div class="value">${studentData.profile.phone}</div></div>
            </div>
            <div class="section-title">Residential Address</div>
            <div class="full-box">${studentData.profile.addr1}, ${studentData.profile.addr2}</div>

            <div class="section-title">Attendance Summary (Apr - Mar)</div>
            <table class="rubric-table" style="font-size: 10px; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f4f4f4;">
                        <th style="padding: 5px;">Month</th>
                        ${(studentData.attendance?.months || ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"]).map(m => `<th style="padding: 5px; border: 1px solid #333;">${m}</th>`).join('')}
                        <th style="padding: 5px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 5px; border: 1px solid #333; font-weight: bold;">Work</td>
                        ${(studentData.attendance?.workingDays || Array(12).fill(0)).map(d => `<td style="padding: 5px; border: 1px solid #333;">${d}</td>`).join('')}
                        <td style="padding: 5px; border: 1px solid #333; font-weight: bold;">${(studentData.attendance?.workingDays || []).reduce((a, b) => (parseFloat(a)||0) + (parseFloat(b)||0), 0)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border: 1px solid #333; font-weight: bold;">Attd</td>
                        ${(studentData.attendance?.attendedDays || Array(12).fill(0)).map(d => `<td style="padding: 5px; border: 1px solid #333;">${d}</td>`).join('')}
                        <td style="padding: 5px; border: 1px solid #333; font-weight: bold;">${(studentData.attendance?.attendedDays || []).reduce((a, b) => (parseFloat(a)||0) + (parseFloat(b)||0), 0)}</td>
                    </tr>
                    <tr style="background: #f9f9f9;">
                        <td style="padding: 5px; border: 1px solid #333; font-weight: bold;">%</td>
                        ${(studentData.attendance?.attendedDays || Array(12).fill(0)).map((d, i) => {
                            const w = (studentData.attendance?.workingDays || [])[i] || 0;
                            const p = w > 0 ? ((d / w) * 100).toFixed(0) : 0;
                            return `<td style="padding: 5px; border: 1px solid #333;">${p}%</td>`;
                        }).join('')}
                        <td style="padding: 5px; border: 1px solid #333; font-weight: bold;">
                            ${(() => {
                                const tw = (studentData.attendance?.workingDays || []).reduce((a, b) => (parseFloat(a)||0) + (parseFloat(b)||0), 0);
                                const ta = (studentData.attendance?.attendedDays || []).reduce((a, b) => (parseFloat(a)||0) + (parseFloat(b)||0), 0);
                                return tw > 0 ? ((ta / tw) * 100).toFixed(0) : 0;
                            })()}%
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="page-num">Page 2</div>
    </div>

    <!-- PAGE 3: FAMILY PROFILE -->
    <div class="page">
        <div class="grid-bg"></div>
        <div class="content">
            <div class="header"><h1>Family Background</h1></div>
            <div class="form-grid">
                <div class="form-box"><span class="label">Mother's Name</span><div class="value">${studentData.family.mName}</div></div>
                <div class="form-box"><span class="label">Father's Name</span><div class="value">${studentData.family.fName}</div></div>
                <div class="form-box"><span class="label">Mother's Education</span><div class="value">${studentData.family.mEdu}</div></div>
                <div class="form-box"><span class="label">Father's Education</span><div class="value">${studentData.family.fEdu}</div></div>
                <div class="form-box"><span class="label">Mother's Occupation</span><div class="value">${studentData.family.mOcc}</div></div>
                <div class="form-box"><span class="label">Father's Occupation</span><div class="value">${studentData.family.fOcc}</div></div>
            </div>
        </div>
        <div class="page-num">Page 3</div>
    </div>

    <!-- DOMAIN PAGES (5-10) -->
    ${studentData.domains.map((d, i) => `
        <div class="page">
            <div class="grid-bg"></div>
            <div class="content">
                <div class="header"><h1>${d.name}</h1></div>
                <div class="section-title">Goal & Competencies</div>
                <div class="full-box" style="min-height: 80px;">
                    <strong>Goal:</strong> ${d.goal}<br><br>
                    <strong>Competencies:</strong> ${d.comp}
                </div>
                
                <div class="section-title">Activities & Evidence</div>
                <div class="full-box" style="min-height: 200px;">${d.activities}</div>

                <div class="section-title">Progress Rubric</div>
                <table class="rubric-table">
                    <thead>
                        <tr>
                            <th>Level</th>
                            <th>Stream</th>
                            <th>Mountain</th>
                            <th>Sky</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Visual</strong></td>
                            <td><img src="${images.stream}" class="rubric-icon" /></td>
                            <td><img src="${images.mountain}" class="rubric-icon" /></td>
                            <td><img src="${images.sky}" class="rubric-icon" /></td>
                        </tr>
                        <tr>
                            <td><strong>Achievement</strong></td>
                            <td>-</td>
                            <td>✔</td>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="page-num">Page ${i + 5}</div>
        </div>
    `).join('')}

    <!-- PAGE 15: FINAL CERTIFICATE & SCANS -->
    <div class="page certificate-page">
        <div style="z-index: 1;">
            <h1 style="font-family: 'Jost', sans-serif; font-size: 42px; font-weight: 300; color: #D4AF37; letter-spacing: 5px;">Mastery Completion</h1>
            <p style="font-size: 18px; margin: 20px 0;">This certifies that</p>
            <h2 style="font-size: 32px; border-bottom: 2px solid #333; display: inline-block; padding: 0 40px;">${studentData.profile.name}</h2>
            <p style="font-size: 18px; margin: 20px 0;">has successfully completed the developmental milestones for</p>
            <h3 style="font-size: 24px;">Academic Session 2025-26</h3>
            
            <div style="margin-top: 30mm; display: flex; justify-content: space-around; width: 100%;">
                <div>
                    <div class="scan-box">PLACE SCAN HERE</div>
                    <p style="margin-top: 10px; font-weight: bold;">Class Teacher</p>
                </div>
                <div>
                    <div class="scan-box">PLACE SCAN HERE</div>
                    <p style="margin-top: 10px; font-weight: bold;">Principal</p>
                </div>
                <div>
                    <div class="scan-box">PLACE SCAN HERE</div>
                    <p style="margin-top: 10px; font-weight: bold;">Parent Voice</p>
                </div>
            </div>
        </div>
        <div class="page-num">Page 15</div>
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
        
        const finalOutputPath = outputPath || path.join(__dirname, 'Backend/exports/Grid_15Page_HPC.pdf');
        await page.pdf({
            path: finalOutputPath, format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });
        console.log('SUCCESS: ' + finalOutputPath);
        await browser.close();
    } catch (err) { console.error('FAILURE: ', err); process.exit(1); }
}
run();
