const { db } = require('./database');

db.get("SELECT * FROM users WHERE username = 's_ladoo'", (err, user) => {
  if (err) return console.error(err);
  console.log("User:", user);
  if (user) {
    db.get("SELECT * FROM students WHERE user_id = ?", [user.id], (err, student) => {
      if (err) return console.error(err);
      console.log("Student Profile:", student);
    });
  }
});
