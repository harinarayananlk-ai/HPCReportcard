const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function overlayData() {
    try {
        const inputPath = path.join(__dirname, 'assets/images/hpcpdfog.pdf');
        const outputPath = path.join(__dirname, 'Backend/exports/Fully_Mapped_Report_Card.pdf');

        const existingPdfBytes = fs.readFileSync(inputPath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const pages = pdfDoc.getPages();
        const page = pages[0];
        const { height } = page.getSize();

        // Sample Data (representing "every data point collected in our app")
        const data = {
            studentName: "Ladoo Lal",
            registrationNumber: "REG-MITHAI-101",
            className: "Bal Vatika 1",
            section: "A",
            teacherName: "Mr. Sharma",
            domain: "Physical Development",
            goals: ["Motor Skills", "Coordination"],
            competencies: ["Running", "Jumping", "Balance"],
            activities: "Participated in the annual sports day and demonstrated great coordination in the relay race.",
            rubric: {
                "0-0": "Aware of space", "0-1": "Focused", "0-2": "Observant",
                "1-0": "Kind to peers", "1-1": "Helpful", "1-2": "Expressive",
                "2-0": "New ideas", "2-1": "Unique", "2-2": "Solution-oriented"
            },
            teacherFeedback: "Ladoo has shown remarkable progress in physical coordination and social interaction.",
            selfAssessment: "I enjoyed learning new games and making new friends this month."
        };

        const draw = (text, x, y, size = 10, isBold = false) => {
            page.drawText(String(text), {
                x,
                y: height - y,
                size,
                font: isBold ? fontBold : font,
                color: rgb(0, 0, 0),
            });
        };

        // --- Header Section ---
        draw(data.studentName, 120, 85, 14, true);
        draw(`ID: ${data.registrationNumber}`, 120, 105, 9);
        draw(`CLASS: ${data.className} | SEC: ${data.section}`, 120, 118, 9);
        draw(`TEACHER: ${data.teacherName}`, 120, 135, 10, true);

        // --- Domain & Goals ---
        draw("DOMAIN:", 50, 175, 10, true);
        draw(data.domain, 120, 175, 10);
        
        draw("GOALS:", 50, 195, 10, true);
        draw(data.goals.join(", "), 120, 195, 9);

        draw("COMPETENCIES:", 50, 215, 10, true);
        draw(data.competencies.join(", "), 150, 215, 9);

        // --- Activities ---
        draw("ACTIVITIES:", 50, 245, 10, true);
        // Multiline activity handling (primitive)
        const activityLines = data.activities.match(/.{1,80}/g) || [];
        activityLines.forEach((line, i) => draw(line, 50, 260 + (i * 12), 9));

        // --- Rubric Matrix (3x3) ---
        // Awareness Row (0-X)
        draw(data.rubric["0-0"], 180, 360, 8);
        draw(data.rubric["0-1"], 320, 360, 8);
        draw(data.rubric["0-2"], 460, 360, 8);

        // Sensitivity Row (1-X)
        draw(data.rubric["1-0"], 180, 435, 8);
        draw(data.rubric["1-1"], 320, 435, 8);
        draw(data.rubric["1-2"], 460, 435, 8);

        // Creativity Row (2-X)
        draw(data.rubric["2-0"], 180, 510, 8);
        draw(data.rubric["2-1"], 320, 510, 8);
        draw(data.rubric["2-2"], 460, 510, 8);

        // --- Feedback ---
        draw("TEACHER FEEDBACK:", 50, 580, 11, true);
        const feedbackLines = data.teacherFeedback.match(/.{1,90}/g) || [];
        feedbackLines.forEach((line, i) => draw(line, 50, 595 + (i * 12), 9));

        draw("SELF ASSESSMENT:", 50, 650, 11, true);
        const selfLines = data.selfAssessment.match(/.{1,90}/g) || [];
        selfLines.forEach((line, i) => draw(line, 50, 665 + (i * 12), 9));

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPath, pdfBytes);

        console.log(`SUCCESS: ${outputPath}`);
    } catch (err) {
        console.error('FAILURE:', err);
        process.exit(1);
    }
}

overlayData();
