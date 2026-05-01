const { db } = require('../database');
const bcrypt = require('bcrypt');

const login = (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "Username, password and role are required." });
  }

  db.get(`SELECT * FROM users WHERE username = ? AND role = ?`, [username, role], (err, user) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!user) return res.status(401).json({ message: "Invalid credentials or role" });

    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // For students, fetch their profile data too
    if (role === 'student') {
      db.get(`SELECT * FROM students WHERE user_id = ?`, [user.id], (err, student) => {
        let profile = student || {};
        if (student) {
          try {
            if (student.family_details) profile.family_details = JSON.parse(student.family_details);
            if (student.preferences) profile.preferences = JSON.parse(student.preferences);
            if (student.assessments) profile.assessments = JSON.parse(student.assessments);
          } catch (e) {
            console.error("JSON Parse Error in auth", e);
          }
        }
        return res.json({
          message: "Login successful",
          user: { id: user.id, username: user.username, role: user.role },
          profile
        });
      });
    } else {
      res.json({
        message: "Login successful",
        user: { id: user.id, username: user.username, role: user.role }
      });
    }
  });
};

module.exports = { login };
