const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initDb } = require('./database');

// Import Controllers
const authController = require('./controllers/authController');
const studentController = require('./controllers/studentController');
const adminController = require('./controllers/adminController');
const pdfController = require('./controllers/pdfController');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/exports', express.static(path.join(__dirname, 'exports')));
app.use('/templates', express.static(path.join(__dirname, '../pdf_generation_archive')));

// Initialize DB
initDb();

// ── AUTO-SEEDING ──
// If no students exist, run the seed script to provide a pre-populated environment
const { db } = require('./database');
db.get("SELECT COUNT(*) as count FROM students", (err, row) => {
  if (!err && row && row.count === 0) {
    console.log("🌱 Fresh database detected. Triggering auto-seed for preset accounts...");
    try {
      require('./seed');
    } catch (e) {
      console.error("Seeding failed", e);
    }
  }
});

// ── AUTH ROUTES ──
app.post('/api/login', authController.login);

// ── STUDENT ROUTES ──
app.get('/api/students/profile/:userId', studentController.getProfile);
app.post('/api/students/profile', studentController.updateProfile);
app.get('/api/students/reports/:studentId', studentController.getReports);

// ── ADMIN ROUTES (Superadmin) ──
app.get('/api/admin/students', adminController.getAllStudents);
app.post('/api/admin/create-student', adminController.createStudent);
app.post('/api/admin/shuffle-student', adminController.shuffleStudent);

// ── PDF EXPORT ROUTES ──
app.get('/api/render/part_b/:userId', studentController.renderPartB);
app.post('/api/export/pdf', pdfController.exportReport);

// Start Server with small delay for OneDrive reliability
setTimeout(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log("------------------------------------------");
    console.log(`🚀 BACKEND SYSTEM READY!`);
    console.log(`📡 URL: http://0.0.0.0:${PORT}`);
    console.log("------------------------------------------");
  });
}, 1500); 