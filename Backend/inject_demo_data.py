import sqlite3
import json

conn = sqlite3.connect('Backend/database.sqlite')
c = conn.cursor()

# 1. Create Murugan User
c.execute("INSERT INTO users (username, password, role, plain_password) VALUES ('s_murugan', '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgNI9RPfudUn1y6X/qG9xL66/WnS', 'student', 'pass123')")
uid = c.lastrowid

# 2. Add Murugan Student Data
murugan_fd = {
    'motherName': 'Idli Amma', 
    'fatherName': 'Sambar Sir', 
    'motherTongue': 'Tamil', 
    'studentAddress': 'Filter Coffee Lane, Chennai', 
    'age': '9', 
    'dob': '01.01.2015', 
    'targetRole': 'Space Coffee Brewer', 
    'connections': ['Vada', 'Chutney', 'Podi']
}
murugan_assess = {
    'domain': 'Cognitive development', 
    'goal': ['CG-7'], 
    'competency': ['7.1', '7.2'], 
    'activities': 'Experimenting with the viscosity of sambar vs rasam.', 
    'rubricTable': {
        '0-0': 'Can identify 10 types of spices by smell', 
        '1-1': 'Very sensitive to coffee roasting temperature', 
        '2-2': 'Created a new type of dosa shaped like a rocket'
    }, 
    'teacherFeedback': 'Murugan is very logical, especially when calculating the shortest path to the canteen.', 
    'selfAssessment': 'I will invent a teleportation device for hot idlis.'
}

c.execute('''
    INSERT INTO students (user_id, registration_number, full_name, class_name, section, points, family_details, assessments) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', (uid, 'REG-SOUTH-102', 'Murugan South', 'Bal Vatika 1', 'A', 350, json.dumps(murugan_fd), json.dumps(murugan_assess)))

# 3. Double check Ladoo Lal
ladoo_fd = {
    'motherName': 'Jalebi Devi', 
    'fatherName': 'Gulab Jamun Lal', 
    'motherTongue': 'Bhojpuri', 
    'studentAddress': 'Mithai Gali, Kanpur', 
    'age': '8', 
    'dob': '15.08.2015', 
    'targetRole': 'Master Chef', 
    'connections': ['Motichoor', 'Besan', 'Boondi'],
    'photo': 'https://placehold.co/400x400/orange/white?text=Ladoo+Lal',
    'groupPhoto': 'https://placehold.co/600x400/orange/white?text=Mithai+Family'
}
ladoo_assess = {
    'domain': 'Aesthetic and cultural development', 
    'goal': ['CG-12'], 
    'competency': ['12.1', '12.2'], 
    'activities': 'Eating and describing various Indian sweets with poetic precision.', 
    'rubricTable': {
        '0-0': 'Excellent taste awareness', 
        '0-1': 'Sensitive to sugar levels', 
        '0-2': 'Creative plating of samosas'
    }, 
    'teacherFeedback': 'Ladoo is a delight in class, although he often confuses the globe with a giant rasgulla.', 
    'selfAssessment': 'I want to be the first student to open a canteen in space.'
}

c.execute('''
    UPDATE students SET family_details = ?, assessments = ? WHERE full_name = 'Ladoo Lal'
''', (json.dumps(ladoo_fd), json.dumps(ladoo_assess)))

conn.commit()
conn.close()
print("Murugan created and Ladoo updated successfully!")
