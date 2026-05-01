const { db, initDb } = require('./database');
const bcrypt = require('bcrypt');

// Ensure tables exist
initDb();

const saltRounds = 10;
const defaultPw = bcrypt.hashSync('pass123', saltRounds);

const schools = ["Heritage International School", "St. Xavier's Academic Square", "Royal Global Foundation"];

const teachersData = [
  { username: 't_murugan', name: 'Master Murugan (The Sambar Specialist)', acc: 'TCH-DOSA-01', contact: '9876543210', grade: 'Bal Vatika 1', section: 'A' },
  { username: 't_chutney', name: 'Ms. Chutney Chatterjee', acc: 'TCH-SPICE-02', contact: '9123456789', grade: 'Bal Vatika 2', section: 'B' },
  { username: 't_curry', name: 'Captain Curry', acc: 'TCH-GRAVY-03', contact: '9988776655', grade: 'Bal Vatika 3', section: 'C' },
  { username: 't_idli', name: 'Inspector Idli', acc: 'TCH-STEAM-04', contact: '9000000001', grade: 'Grade 1', section: 'A' },
  { username: 't_dosa', name: 'Dr. Dosawala (PhD in Crispy Physics)', acc: 'TCH-CRISP-05', contact: '9000000002', grade: 'Grade 2', section: 'B' },
];

const studentsData = [
  { username: 's_ladoo', name: 'Ladoo Lal', reg: 'REG-MITHAI-101', grade: 'Bal Vatika 1', section: 'A' },
  { username: 's_paplu', name: 'Paplu Poddar', reg: 'REG-GOLU-102', grade: 'Bal Vatika 1', section: 'A' },
  { username: 's_golgappa', name: 'Golgappa Gupta', reg: 'REG-SNACK-103', grade: 'Bal Vatika 2', section: 'B' },
  { username: 's_bunty', name: 'Bunty Bubble', reg: 'REG-POP-104', grade: 'Bal Vatika 2', section: 'B' },
  { username: 's_bablu', name: 'Bablu Biryani', reg: 'REG-RICE-105', grade: 'Bal Vatika 3', section: 'C' },
  { username: 's_pinky', name: 'Pinky Paratha', reg: 'REG-FLAT-106', grade: 'Grade 1', section: 'A' },
  { username: 's_chintu', name: 'Chintu Chai', reg: 'REG-BREW-107', grade: 'Grade 1', section: 'A' },
  { username: 's_guddu', name: 'Guddu Gulabjamun', reg: 'REG-SWEET-108', grade: 'Grade 2', section: 'B' },
  { username: 's_munna', name: 'Munna Maggi', reg: 'REG-NOODLE-109', grade: 'Grade 2', section: 'B' },
  { username: 's_pappu', name: 'Pappu Paneer', reg: 'REG-DAIRY-110', grade: 'Grade 2', section: 'B' },
];

db.serialize(() => {
  console.log("Cleaning old data...");
  db.run("DELETE FROM users");
  db.run("DELETE FROM students");
  db.run("DELETE FROM teachers");
  db.run("DELETE FROM classes");
  db.run("DELETE FROM report_cards");

  console.log("Seeding started...");

  // Seed Teachers
  teachersData.forEach((t) => {
    db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [t.username, defaultPw, 'teacher'], function(err) {
      if (err) return console.error(err);
      const userId = this.lastID;
      
      db.run(`INSERT INTO teachers (user_id, full_name, account_id, contact) VALUES (?, ?, ?, ?)`, 
        [userId, t.name, t.acc, t.contact], function(err) {
          if (err) return;
          const teacherId = this.lastID;
          db.run(`INSERT INTO classes (grade, section, teacher_id) VALUES (?, ?, ?)`, [t.grade, t.section, teacherId]);
        });
    });
  });

  // Seed Students
  studentsData.forEach((s) => {
    db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [s.username, defaultPw, 'student'], function(err) {
      if (err) return;
      const userId = this.lastID;
      
      const isLadoo = s.username === 's_ladoo';
      
      const attendanceData = [
        { month: 'Apr', working: '22', attended: '21' },
        { month: 'May', working: '20', attended: '18' },
        { month: 'Jun', working: '15', attended: '15' },
        { month: 'Jul', working: '21', attended: '20' },
        { month: 'Aug', working: '22', attended: '22' },
        { month: 'Sep', working: '20', attended: '19' },
        { month: 'Oct', working: '18', attended: '17' },
        { month: 'Nov', working: '21', attended: '20' },
        { month: 'Dec', working: '20', attended: '19' },
        { month: 'Jan', working: '22', attended: '21' },
        { month: 'Feb', working: '19', attended: '18' },
        { month: 'Mar', working: '22', attended: '21' }
      ];

      const family = JSON.stringify({ 
        studentName: s.name, 
        studentAddress: isLadoo ? 'Mansion 420, Motichoor Gali, Halwai Headquarters, Delhi - 110001' : '123 Gali Number, Delhi',
        motherTongue: isLadoo ? 'Bhojpuri-Gibberish' : 'Hinglish',
        motherName: isLadoo ? 'Gulabjamun Devi' : 'Sunita Devi',
        fatherName: isLadoo ? 'Barfi Prasad' : 'Kumar Prasad',
        guardianContact: isLadoo ? '999-EAT-MORE' : '9000000000',
        bloodGroup: isLadoo ? 'Sugar+' : 'B+',
        weight: isLadoo ? '65kg' : '30kg',
        height: isLadoo ? '135cm' : '125cm',
        mediumOfInstruction: 'Food English',
        attendance: attendanceData,
        familyTree: {},
        photo: 'https://avatar.iran.liara.run/public/boy',
        schoolAddress: isLadoo ? 'The Wacky Kitchen Academy' : '',
        pinCode: '000000',
        udiseCode: 'SECRET-99',
        teacherCode: 'TCH-DOSA',
        phoneNumber: '1-800-MITHAI',
        rollNumber: 'ROLL-1',
        ruralUrban: 'Deeply Urban Foodie'
      });
      
      const prefs = isLadoo ? JSON.stringify({ 
        color: 'Saffron Orange (Like Jalebi)', 
        food: '14 Kg of Ladoo & Samosa', 
        animal: 'A Very Fat Panda', 
        sport: 'Competitive Eating',
        hobby: 'Singing to his snacks before devouring them'
      }) : JSON.stringify({ 
        color: 'Orange', 
        food: 'Samosa', 
        animal: 'Tiger', 
        sport: 'Cricket',
        hobby: 'General'
      });
      
      const assessments = isLadoo ? JSON.stringify({
        domain: "Digestive and Cognitive Development",
        goal: [
          "Makes sense of the world purely through tasting objects and illogical over-thinking.",
          "Develops mathematical understanding by independently counting hundreds of mini-samosas."
        ],
        competency: [
          "Observes and understands the structural integrity of a pani-puri before it collapses in hand.",
          "Sorts objects into groups of 'Edible', 'Very Edible', and 'Can be eaten if nobody is looking'."
        ],
        activities: "Successfully hid 4 tiffin boxes inside his uniform during the assembly. Extrapolated the exact trajectory of a flying chalk thrown by Master Murugan.",
        rubricTable: {
          "0-0": "Identifies completely spherical shapes in nature, interpreting them all as potential ladoos.",
          "0-1": "Matches sounds to visual symbols, specifically the crinkling of a chips packet from 50 meters away.",
          "0-2": "Creates original, absurd excuses for not doing homework using daily culinary vocabulary.",
          "1-0": "Expresses deep tragedy when a peer drops their lunch.",
          "1-1": "Responds correctly to the dinner bell faster than the speed of sound.",
          "1-2": "Shows unquestioned leadership in canteen line-cutting activities.",
          "2-0": "Uses waste materials to create a highly functional spoon.",
          "2-1": "Experiments with color mixing by dumping random curries onto the same plate.",
          "2-2": "Designs innovative solutions for sleeping in the back row without falling off the chair."
        },
        teacherFeedback: "Master Murugan notes: Ladoo Lal is an absolute menace to the school pantry, yet demonstrates an undeniable genius in chaotic survival skills. If he dedicated half the calories he consumes towards his studies, he would already have a PhD in Crispy Physics like Dr. Dosawala. A joyful nightmare.",
        selfAssessment: "I am the undisputed king of Bal Vatika 1. The teachers fear my appetite. Everything is good, I need more snacks for tomorrow's Hindi class.",
        attendanceTable: attendanceData
      }) : null;

      db.run(`INSERT INTO students (user_id, registration_number, full_name, class_name, section, dob, school, family_details, preferences, assessments, points) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [userId, s.reg, s.name, s.grade, s.section, isLadoo ? '15/08/2018' : '15/08/2018', schools[0], family, prefs, assessments, isLadoo ? 850 : 200]);
    });
  });

  // Seed Superadmin
  const adminPw = bcrypt.hashSync('admin123', saltRounds);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, ['superadmin', adminPw, 'superadmin']);

  console.log("Seeding complete! Try logging in as 'superadmin' / 'admin123' or any student like 's_ladoo' / 'pass123'");
});
