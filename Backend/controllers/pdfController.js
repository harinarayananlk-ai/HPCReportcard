const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const exportReport = async (req, res) => {
  const { userId, profileData } = req.body;

  if (!userId && !profileData?.user_id) {
    return res.status(400).json({ message: "Student User ID is required for export" });
  }

  const targetId = userId || profileData.user_id;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set viewport to A4 aspect ratio approximately
    await page.setViewport({ width: 1240, height: 1754 });

    // 1. Navigate to our dynamic renderer (guarantees perfect autofill)
    const renderUrl = `http://localhost:3000/api/render/part_b/${targetId}`;
    await page.goto(renderUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // 2. Extra wait for Babel and React to finish the grid boot
    await new Promise(resolve => setTimeout(resolve, 5000));

    const fileName = `Report_Card_Original_${targetId}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../exports', fileName);
    
    // 3. Generate PDF (Only Pages 1-15, page 16 cut out as requested)
    await page.pdf({ 
      path: filePath, 
      format: 'A4',
      printBackground: true,
      pageRanges: '1-15',
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
