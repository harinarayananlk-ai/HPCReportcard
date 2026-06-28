const { db } = require('./database');
const fs = require('fs');
const path = require('path');

db.all("SELECT * FROM students", (err, students) => {
  if (err) return console.error(err);
  
  db.all("SELECT * FROM users", (err, users) => {
    if (err) return console.error(err);
    
    const dump = {
      users,
      students: students.map(s => ({
        ...s,
        family_details: s.family_details ? JSON.parse(s.family_details) : null,
        preferences: s.preferences ? JSON.parse(s.preferences) : null,
        assessments: s.assessments ? JSON.parse(s.assessments) : null
      }))
    };
    
    fs.writeFileSync(path.join(__dirname, 'database_dump.json'), JSON.stringify(dump, null, 2));
    console.log("Database dump created at Backend/database_dump.json");
    
    const ladoo = dump.students.find(s => s.registration_number === 'REG-MITHAI-101');
    if (ladoo) {
      console.log("------------------------------------------");
      console.log("LADOO LAL VERIFICATION:");
      console.log("Full Name:", ladoo.full_name);
      console.log("Points:", ladoo.points);
      console.log("Attendance Data Size:", ladoo.family_details?.attendance?.length || 0);
      console.log("Family Tree Exists:", !!ladoo.family_details?.familyTree);
      console.log("------------------------------------------");
    } else {
      console.log("Ladoo Lal not found in database!");
    }
  });
});
