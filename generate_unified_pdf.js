const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { buildHpcHtml } = require('./Backend/controllers/hpcTemplate');

// Baseline Student Data Structure
let studentData = {
    school: {
        name: "Samosa High International School",
        address1: "NA",
        address2: "NA",
        pincode: "NA",
        udiseCode: "NA",
        principal: "NA",
        board: "NA"
    },
    profile: {
        name: "NA",
        dob: "NA",
        roll: "NA",
        reg: "NA",
        class: "NA",
        sec: "NA",
        teacherName: "NA",
        teacherCode: "NA",
        gender: "NA",
        bloodGroup: "NA",
        height: "NA",
        weight: "NA",
        address: "NA",
        phone: "NA"
    },
    family: {},
    a2: {},
    assessments: {}
};

// Check for incoming arguments, filtering out flags
const isHtmlOnly = process.argv.includes('--html');
const args = process.argv.filter(arg => arg !== '--html');
const inputPath = args[2];
const outputPath = args[3];

if (inputPath && fs.existsSync(inputPath)) {
    try {
        const fileContent = fs.readFileSync(inputPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        
        // Deep merge helper
        if (parsed.school) studentData.school = { ...studentData.school, ...parsed.school };
        if (parsed.profile) studentData.profile = { ...studentData.profile, ...parsed.profile };
        if (parsed.family) studentData.family = { ...studentData.family, ...parsed.family };
        
        // Handle database specific string column parsing
        if (parsed.family_details) {
            let fd = parsed.family_details;
            if (typeof fd === 'string') {
                try { fd = JSON.parse(fd); } catch(e) {}
            }
            if (typeof fd === 'object') {
                studentData.family = { ...studentData.family, ...fd };
            }
        }

        if (parsed.a2_data) {
            let a2 = parsed.a2_data;
            if (typeof a2 === 'string') {
                try { a2 = JSON.parse(a2); } catch(e) {}
            }
            if (typeof a2 === 'object') {
                studentData.a2 = { ...studentData.a2, ...a2 };
            }
        }

        if (parsed.preferences) {
            let prefs = parsed.preferences;
            if (typeof prefs === 'string') {
                try { prefs = JSON.parse(prefs); } catch(e) {}
            }
            if (typeof prefs === 'object') {
                studentData.preferences = prefs;
            }
        }

        if (parsed.assessments) {
            let assess = parsed.assessments;
            if (typeof assess === 'string') {
                try { assess = JSON.parse(assess); } catch(e) {}
            }
            if (typeof assess === 'object') {
                studentData.assessments = assess;
            }
        }
        
        // Map top-level columns if they exist in the root of parsed object
        const rootKeys = [
            { k: 'gender', cols: ['gender'] },
            { k: 'bloodGroup', cols: ['blood_group', 'bloodGroup'] },
            { k: 'height', cols: ['height'] },
            { k: 'weight', cols: ['weight'] },
            { k: 'address', cols: ['address'] },
            { k: 'phone', cols: ['phone'] },
            { k: 'motherTongue', cols: ['mother_tongue', 'motherTongue'] },
            { k: 'mediumOfInstruction', cols: ['medium_of_instruction', 'mediumOfInstruction'] },
            { k: 'ruralUrban', cols: ['rural_urban', 'ruralUrban'] },
            { k: 'dob', cols: ['dob'] }
        ];
        rootKeys.forEach(item => {
            const val = item.cols.map(c => parsed[c]).find(v => v !== undefined && v !== null);
            if (val !== undefined && val !== null) {
                studentData.profile[item.k] = val;
            }
        });

        // Apply fail-safe family fallback values
        const family = studentData.family || {};
        if (!studentData.profile.dob || studentData.profile.dob === 'NA') studentData.profile.dob = family.dob || 'NA';
        if (!studentData.profile.roll || studentData.profile.roll === 'NA') studentData.profile.roll = family.rollNumber || 'NA';
        if (!studentData.profile.reg || studentData.profile.reg === 'NA') studentData.profile.reg = family.registrationNumber || 'NA';
        if (!studentData.profile.teacherCode || studentData.profile.teacherCode === 'NA') studentData.profile.teacherCode = family.teacherCode || 'NA';
        if (!studentData.profile.address || studentData.profile.address === 'NA') studentData.profile.address = family.location || 'NA';
        if (!studentData.profile.phone || studentData.profile.phone === 'NA') studentData.profile.phone = family.phoneNumber || 'NA';
        if (!studentData.profile.motherTongue || studentData.profile.motherTongue === 'NA') studentData.profile.motherTongue = family.motherTongue || 'NA';
        if (!studentData.profile.mediumOfInstruction || studentData.profile.mediumOfInstruction === 'NA') studentData.profile.mediumOfInstruction = family.mediumOfInstruction || 'NA';
        if (!studentData.profile.ruralUrban || studentData.profile.ruralUrban === 'NA') studentData.profile.ruralUrban = family.ruralUrban || 'NA';
        
        console.log("Unified PDF script: Data loaded successfully.");
    } catch(err) {
        console.error("Unified PDF script error parsing input JSON:", err.message);
    }
}

// Compile HTML content using the unified hpcTemplate
const htmlContent = buildHpcHtml(studentData);

// Launch Puppeteer to generate A4 PDF or write raw HTML
async function run() {
    try {
        if (isHtmlOnly) {
            console.log('Unified PDF script: Writing raw HTML...');
            const finalHtmlPath = outputPath || path.join(__dirname, 'Backend/exports/Holistic_Progress_Card_Unified.html');
            fs.writeFileSync(finalHtmlPath, htmlContent, 'utf8');
            console.log('SUCCESS: Generated HTML at ' + finalHtmlPath);
            process.exit(0);
        }
        
        console.log('Unified PDF script: Launching browser...');
        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        console.log('Unified PDF script: Injecting HTML content...');
        await page.setContent(htmlContent, { waitUntil: 'load', timeout: 10000 });
        
        // Wait briefly for style loading
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalOutputPath = outputPath || path.join(__dirname, 'Backend/exports/Holistic_Progress_Card_Unified.pdf');
        
        console.log('Unified PDF script: Rendering print-to-PDF page...');
        await page.pdf({
            path: finalOutputPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
        });

        console.log('SUCCESS: Generated PDF at ' + finalOutputPath);
        await browser.close();
        process.exit(0);
    } catch (err) {
        console.error('FAILURE during PDF rendering: ', err.message);
        process.exit(1);
    }
}

run();
