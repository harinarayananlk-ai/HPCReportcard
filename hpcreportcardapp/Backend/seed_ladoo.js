/**
 * One-shot seed: Populate Ladoo Lal's profile for PDF export testing
 * Run: node Backend/seed_ladoo.js
 */
const http = require('http');

const attendanceTable = [
  { month: 'Apr', working: '22', attended: '22' },
  { month: 'May', working: '20', attended: '19' },
  { month: 'Jun', working: '18', attended: '18' },
  { month: 'Jul', working: '22', attended: '21' },
  { month: 'Aug', working: '22', attended: '22' },
  { month: 'Sep', working: '20', attended: '19' },
  { month: 'Oct', working: '18', attended: '17' },
  { month: 'Nov', working: '21', attended: '20' },
  { month: 'Dec', working: '20', attended: '19' },
  { month: 'Jan', working: '22', attended: '21' },
  { month: 'Feb', working: '19', attended: '18' },
  { month: 'Mar', working: '22', attended: '21' },
];

// Part B matrix: 6 domains (rows) x 3 criteria (cols: Observation, Evidence, Remarks)
const cellTexts = {
  '0-0': 'Child demonstrates curiosity and asks meaningful questions during circle time.',
  '0-1': 'Regularly raises hand to share observations about nature and surroundings.',
  '0-2': 'Encourage deeper exploration by providing hands-on inquiry activities.',
  '1-0': 'Expresses ideas clearly in Hindi and is developing English vocabulary.',
  '1-1': 'Participated in storytelling session; narrated a folk tale with confidence.',
  '1-2': 'Continue to build bilingual reading habits with illustrated storybooks.',
  '2-0': 'Shows strong number sense and can count backwards from 20 independently.',
  '2-1': 'Completed number pattern worksheet with minimal assistance.',
  '2-2': 'Introduce real-life math activities such as measuring and sorting.',
  '3-0': 'Engages positively with peers and resolves minor conflicts amicably.',
  '3-1': 'Observed sharing art supplies and helping a peer complete an activity.',
  '3-2': 'Continue fostering collaborative learning through group art projects.',
  '4-0': 'Demonstrates fine motor control through detailed drawings and craft work.',
  '4-1': 'Created a detailed clay model of a village market for the cultural fair.',
  '4-2': 'Provide more structured drawing activities to build pencil grip strength.',
  '5-0': 'Participates enthusiastically in yoga and outdoor movement sessions.',
  '5-1': 'Completed full obstacle course during sports day without assistance.',
  '5-2': 'Maintain regular physical activity; encourage healthy eating habits at home.',
};

const profilePayload = {
  userId: 168,
  registrationNumber: 'REG-MITHAI-101',
  fullName: 'Ladoo Lal',
  className: 'Bal Vatika 1',
  section: 'A',
  school: 'Heritage International School',
  familyDetails: JSON.stringify({
    fatherName: 'Ram Prasad Mithaiwala',
    motherName: 'Sunita Devi Mithaiwala',
    fatherJob: 'Civil Engineer (PWD)',
    fatherEducation: 'B.Tech',
    motherJob: 'Journalist (Local News)',
    motherEducation: 'M.A. Journalism',
    dob: '15/08/2018',
    location: 'House No. 42, Mithai Gali, Halwai Chowk, Delhi - 110001',
    schoolAddress: '12-A Heritage Campus, Knowledge Park, New Delhi',
    pinCode: '110044',
    udiseCode: '07140100101',
    teacherCode: 'M01',
    phoneNumber: '9812345678',
    rollNumber: 'BV1-001',
    ruralUrban: 'urban',
    studentName: 'Ladoo Lal',
    siblings: [{ name: 'Jalebi Kumari', age: '4' }],
    connections: ['', '', ''],
    attendanceData: attendanceTable,
  }),
  preferences: JSON.stringify({
    color: 'Saffron Orange',
    food: 'Ladoo & Samosa',
    animal: 'Bengal Tiger',
    sport: 'Cricket',
    hobby: 'Singing Folk Songs',
  }),
  assessments: JSON.stringify({
    rubricLevel: 'Developing',
    teacherFeedback:
      'Ladoo Lal is a highly inquisitive and disciplined student. He demonstrates exceptional grasp of cultural values and foundational literacy. His steady progress in social-emotional development is commendable.',
    selfAssessment:
      'I enjoy exploring new concepts in the Heritage campus and love collaborating with my peers.',
    attendanceTable,
    cellTexts,
  }),
};

const body = JSON.stringify(profilePayload);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/students/profile',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Ladoo Lal profile fully seeded! Ready to export PDF.');
    } else {
      console.error('❌ Seed failed:', res.statusCode, data);
    }
  });
});

req.on('error', (e) => console.error('❌ Request error:', e.message));
req.write(body);
req.end();
