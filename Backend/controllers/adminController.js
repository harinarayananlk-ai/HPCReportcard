const { db } = require('../database');
const bcrypt = require('bcrypt');

// Fetch all students for management dashboard
const getAllStudents = (req, res) => {
  const query = `
    SELECT 
      u.id as user_id, u.username, 
      s.id as student_id, s.registration_number, s.class_name, s.section, s.school, s.last_updated,
      t.full_name as teacher_name, t.account_id as teacher_account_id
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN classes c ON (s.class_name = c.grade AND s.section = c.section)
    LEFT JOIN teachers t ON c.teacher_id = t.id
    WHERE u.role = 'student'
    ORDER BY s.class_name, s.section, u.username
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    res.json(rows);
  });
};

// Create a new student (Superadmin/Teacher only)
const createStudent = (req, res) => {
  const { username, password, registrationNumber, className, section, school } = req.body;

  if (!username || !password || !registrationNumber || !className) {
    return res.status(400).json({ message: "Missing required registration fields" });
  }

  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  db.serialize(() => {
    db.run(`BEGIN TRANSACTION`);

    db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, 'student')`, [username, hashedPassword], function(err) {
      if (err) {
        db.run(`ROLLBACK`);
        return res.status(409).json({ message: "Username already exists" });
      }

      const userId = this.lastID;
      db.run(`INSERT INTO students (user_id, registration_number, class_name, section, school) VALUES (?, ?, ?, ?, ?)`, 
        [userId, registrationNumber, className, section, school], function(err) {
          if (err) {
            db.run(`ROLLBACK`);
            return res.status(400).json({ message: "Registration number already exists" });
          }
          
          db.run(`COMMIT`);
          res.status(201).json({ message: "Student account successfully created", userId });
      });
    });
  });
};

// Shuffle student (Update Grade/Section while retaining account)
const shuffleStudent = (req, res) => {
  const { studentId, newClassName, newSection } = req.body;

  if (!studentId || !newClassName) {
    return res.status(400).json({ message: "StudentId and New Grade are required" });
  }

  db.run(`UPDATE students SET class_name = ?, section = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?`, 
    [newClassName, newSection, studentId], function(err) {
      if (err) return res.status(500).json({ message: "Error shuffling student", error: err.message });
      res.json({ message: `Student advanced to ${newClassName} ${newSection || ''} successfully` });
  });
};

module.exports = { getAllStudents, createStudent, shuffleStudent };
