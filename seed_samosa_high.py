"""Seed Samosa High International School — Full 15-Grade 4-Stage HPC Database Generator.
Runs on server boot-up (npm run dev).
"""
import sqlite3
import json
import os
import random
import bcrypt

def get_fast_hash(plain_text, cache={}):
    """Cache common password hashes to make boot-up instantaneous (~0.1s)."""
    if plain_text not in cache:
        cache[plain_text] = bcrypt.hashpw(plain_text.encode('utf-8'), bcrypt.gensalt(4)).decode('utf-8')
    return cache[plain_text]

COLOURS = [
    "Saffron Orange", "Turquoise Blue", "Mint Green", "Deep Magenta",
    "Royal Purple", "Golden Yellow", "Crimson Red", "Coral Pink",
    "Emerald Green", "Peacock Blue", "Amber Gold", "Lavender Purple"
]

ANIMALS = ["Bengal Tiger", "Peacock", "Elephant", "Kingfisher", "Snow Leopard", "Panda", "Cheetah", "Dolphin"]
SPORTS = ["Cricket", "Badminton", "Football", "Kho-Kho", "Kabaddi", "Chess", "Table Tennis", "Basketball", "Swimming"]
HOBBIES = ["Origami", "Singing", "Coding", "Dancing", "Drawing", "Cooking", "Kite Flying", "Storytelling", "Pottery"]

# 36 Class Teachers across 15 grades
TEACHERS_DATA = [
    # Foundational Stage (Stage 1)
    ("Bal Vatika 1", "A", "t_murugan", "Master Murugan Mutton-Dosa", "TCH-001", "Early Childhood Ed", "9811000001"),
    ("Bal Vatika 1", "B", "t_chutney", "Ms. Chutney Chowrasia", "TCH-002", "Montessori Dipl.", "9811000002"),
    ("Bal Vatika 2", "A", "t_idli", "Mrs. Idli Iyer", "TCH-003", "B.Ed, Child Dev.", "9811000003"),
    ("Bal Vatika 2", "B", "t_dosa", "Mr. Dosa Kumar", "TCH-004", "B.P.Ed", "9811000004"),
    ("Bal Vatika 3", "A", "t_sambar", "Ms. Sambar Sundari", "TCH-005", "M.A. Primary Ed", "9811000005"),
    ("Bal Vatika 3", "B", "t_vada", "Mr. Vada Vel", "TCH-006", "B.Ed", "9811000006"),
    ("Bal Vatika 3", "C", "t_appam", "Mrs. Appam Amma", "TCH-007", "M.Ed", "9811000007"),
    ("Grade 1", "A", "t_curry", "Mrs. Curry Lakshmi", "TCH-008", "B.Ed, English", "9811000008"),
    ("Grade 1", "B", "t_biryani", "Mr. Biryani Babu", "TCH-009", "M.Sc, Math", "9811000009"),
    ("Grade 2", "A", "t_rasam", "Ms. Rasam Radha", "TCH-010", "B.Ed, Science", "9811000010"),
    ("Grade 2", "B", "t_pongal", "Mr. Pongal Pillai", "TCH-011", "B.Ed, Social Studies", "9811000011"),
    ("Grade 2", "C", "t_upma", "Mrs. Upma Unni", "TCH-012", "M.A. Literature", "9811000012"),

    # Preparatory Stage (Stage 2)
    ("Grade 3", "A", "t_halwa", "Mrs. Halwa Hema", "TCH-013", "M.Sc, EVS", "9811000013"),
    ("Grade 3", "B", "t_kulfi", "Mr. Kulfi Khan", "TCH-014", "B.Ed, Physical Ed", "9811000014"),
    ("Grade 4", "A", "t_chai", "Ms. Chai Chandra", "TCH-015", "M.A. English", "9811000015"),
    ("Grade 4", "B", "t_lassi", "Mr. Lassi Lal", "TCH-016", "B.Sc, Math", "9811000016"),
    ("Grade 4", "C", "t_masala", "Mrs. Masala Malini", "TCH-017", "M.Sc, Physics", "9811000017"),
    ("Grade 5", "A", "t_paratha", "Mrs. Paratha Priya", "TCH-018", "M.Ed, Hindi", "9811000018"),
    ("Grade 5", "B", "t_naan", "Mr. Naan Nair", "TCH-019", "B.Tech, Computer Ed", "9811000019"),

    # Middle Stage (Stage 3)
    ("Grade 6", "A", "t_pickle", "Ms. Pickle Padma", "TCH-020", "Ph.D. Biology", "9811000020"),
    ("Grade 6", "B", "t_chaat", "Mr. Chaat Chawla", "TCH-021", "M.Sc Chemistry", "9811000021"),
    ("Grade 7", "A", "t_paneer", "Mrs. Paneer Patel", "TCH-022", "M.A. History", "9811000022"),
    ("Grade 7", "B", "t_tikka", "Mr. Tikka Tiwari", "TCH-023", "M.Tech Robotics", "9811000023"),
    ("Grade 7", "C", "t_dimsum", "Mrs. Dimsum Devi", "TCH-024", "M.A. Geography", "9811000024"),
    ("Grade 8", "A", "t_roti", "Ms. Roti Rani", "TCH-025", "M.Sc Mathematics", "9811000025"),
    ("Grade 8", "B", "t_dal", "Mr. Dal Das", "TCH-026", "M.A. Economics", "9811000026"),

    # Secondary Stage (Stage 4)
    ("Grade 9", "A", "t_kheer", "Mrs. Kheer Kaur", "TCH-027", "M.Sc Physics", "9811000027"),
    ("Grade 9", "B", "t_gulabjamun", "Mr. Gulabjamun Gill", "TCH-028", "Ph.D. Chemistry", "9811000028"),
    ("Grade 10", "A", "t_jalebi", "Ms. Jalebi Joshi", "TCH-029", "M.Sc Algebra", "9811000029"),
    ("Grade 10", "B", "t_raita", "Mr. Raita Rao", "TCH-030", "M.A. Civics", "9811000030"),
    ("Grade 10", "C", "t_calzone", "Mrs. Calzone Chawla", "TCH-031", "M.A. Foreign Lang", "9811000031"),
    ("Grade 11", "A", "t_laddu", "Mrs. Laddu Luthra", "TCH-032", "Ph.D. Organic Chem", "9811000032"),
    ("Grade 11", "B", "t_barfi", "Mr. Barfi Bhatt", "TCH-033", "M.Tech AI & ML", "9811000033"),
    ("Grade 12", "A", "t_peda", "Ms. Peda Pandey", "TCH-034", "Ph.D. Nuclear Physics", "9811000034"),
    ("Grade 12", "B", "t_sandesh", "Mr. Sandesh Sen", "TCH-035", "M.A. Literature & Arts", "9811000035"),
    ("Grade 12", "C", "t_gourmet", "Dr. Gourmet Gupta", "TCH-036", "Ph.D. Culinary Science", "9811000036"),
]

# Master Roster of 243 Students across all 15 grades and 36 sections
STUDENTS_MASTER = [
    # ── BAL VATIKA 1 ──
    ("Bal Vatika 1", "A", "s_ladoo", "Ladoo Lal", "15/08/2021", "M", "O+", "102cm", "16kg", "42 Mithai Gali, Delhi", "Meera Devi", "Homemaker", "Rajesh Prasad", "Sweet Shop Owner", "Jalebi-4-Sister", "Saffron Orange", "Jalebi", "Bengal Tiger", "Cricket", "Singing"),
    ("Bal Vatika 1", "A", "s_paplu", "Paplu Poddar", "22/03/2021", "M", "B+", "100cm", "15kg", "18 Golgappa Lane, Delhi", "Sunita Devi", "Tailor", "Kumar Prasad", "Auto Driver", "None", "Turquoise Blue", "Samosa", "Parrot", "Football", "Drawing"),
    ("Bal Vatika 1", "A", "s_jalebi", "Jalebi Jain", "05/11/2021", "F", "A+", "98cm", "14kg", "7 Sugar Mill Road, Delhi", "Kamla Jain", "Teacher", "Suresh Jain", "Accountant", "Kaju-8-Brother", "Coral Pink", "Jalebi", "Rabbit", "Badminton", "Dancing"),
    ("Bal Vatika 1", "A", "s_imarti", "Imarti Iyengar", "12/04/2021", "F", "AB+", "99cm", "14kg", "14 Spiral Marg, Delhi", "Lakshmi Iyengar", "Architect", "Raman Iyengar", "Professor", "None", "Deep Magenta", "Imarti", "Peacock", "Swimming", "Origami"),
    ("Bal Vatika 1", "A", "s_boondi", "Boondi Bajaj", "30/09/2021", "M", "O-", "101cm", "15kg", "88 Raita Chowk, Delhi", "Pooja Bajaj", "Banker", "Vikram Bajaj", "Manager", "None", "Golden Yellow", "Boondi Raita", "Elephant", "Chess", "Storytelling"),
    ("Bal Vatika 1", "A", "s_pedha", "Pedha Parmar", "18/06/2021", "M", "B-", "103cm", "17kg", "55 Mathura Road, Delhi", "Aarti Parmar", "Doctor", "Nilesh Parmar", "Surgeon", "None", "Amber Gold", "Mathura Peda", "Panda", "Table Tennis", "Napping"),

    ("Bal Vatika 1", "B", "s_kaju", "Kaju Katli", "12/01/2021", "F", "AB+", "100cm", "15kg", "3 Dry Fruit Colony, Delhi", "Rani Katli", "Nurse", "Mohan Katli", "Shopkeeper", "Badam-6-Brother", "Royal Purple", "Kaju Katli", "Cat", "Skating", "Painting"),
    ("Bal Vatika 1", "B", "s_gulab", "Gulab Jamun", "30/06/2021", "M", "O-", "104cm", "17kg", "55 Rose Garden, Delhi", "Pushpa Devi", "Florist", "Shankar Lal", "Gardener", "None", "Crimson Red", "Gulab Jamun", "Dog", "Kho Kho", "Gardening"),
    ("Bal Vatika 1", "B", "s_rasgulla", "Rasgulla Ram", "18/09/2021", "M", "B-", "102cm", "16kg", "12 Sweet Lane, Delhi", "Geeta Ram", "Cook", "Balram Das", "Driver", "Chomchom-10", "Mint Green", "Rasgulla", "Cow", "Kabaddi", "Singing"),
    ("Bal Vatika 1", "B", "s_peda_bv1", "Peda Patel", "25/02/2021", "F", "A+", "99cm", "14kg", "9 Milk Dairy Road, Delhi", "Hetal Patel", "Designer", "Kiran Patel", "Engineer", "None", "Emerald Green", "Elaichi Peda", "Dolphin", "Badminton", "Craft"),
    ("Bal Vatika 1", "B", "s_chomchom", "Chomchom Chatterji", "04/07/2021", "M", "O+", "101cm", "15kg", "77 Sweets Market, Delhi", "Debjani Chatterji", "Artist", "Subhash Chatterji", "Writer", "ChamCham-2", "Peacock Blue", "Chomchom", "Kingfisher", "Cricket", "Clay Modeling"),
    ("Bal Vatika 1", "B", "s_chamcham", "Cham Cham Sen", "14/10/2021", "F", "B+", "98cm", "14kg", "21 Malda Lane, Delhi", "Suchitra Sen", "Singer", "Arindam Sen", "Composer", "None", "Coral Pink", "Pink Cham Cham", "Panda", "Gymnastics", "Piano"),

    # ── BAL VATIKA 2 ──
    ("Bal Vatika 2", "A", "s_golgappa", "Golgappa Gupta", "14/04/2020", "M", "B+", "108cm", "18kg", "9 Chaat Corner, Delhi", "Anita Gupta", "Shopkeeper", "Ramesh Gupta", "Vendor", "Bhelpuri-5", "Saffron Orange", "Golgappa", "Monkey", "Cricket", "Cooking"),
    ("Bal Vatika 2", "A", "s_pani", "Pani Puri", "25/07/2020", "F", "A-", "105cm", "16kg", "22 Water Works Road, Delhi", "Savita Devi", "Housewife", "Deepak Kumar", "Plumber", "None", "Turquoise Blue", "Pani Puri", "Fish", "Swimming", "Reading"),
    ("Bal Vatika 2", "A", "s_tikki", "Tikki Tandon", "03/12/2020", "M", "O+", "110cm", "19kg", "45 Aloo Marg, Delhi", "Neelam Tandon", "Bank Clerk", "Ravi Tandon", "Manager", "Chole-3", "Mint Green", "Aloo Tikki", "Elephant", "Hockey", "Chess"),
    ("Bal Vatika 2", "A", "s_sevpuri", "Sev Puri Saxena", "11/01/2020", "F", "AB+", "106cm", "17kg", "14 Crisp Street, Delhi", "Ritu Saxena", "Lawyer", "Amit Saxena", "Advocate", "None", "Golden Yellow", "Sev Puri", "Cheetah", "Running", "Math Puzzles"),
    ("Bal Vatika 2", "A", "s_bhelpuri", "Bhelpuri Bhalla", "19/08/2020", "M", "B-", "107cm", "17kg", "88 Mix Chowk, Delhi", "Suman Bhalla", "Chef", "Rajeev Bhalla", "Hotelier", "None", "Coral Pink", "Bhelpuri", "Parrot", "Football", "Mixing Colors"),
    ("Bal Vatika 2", "A", "s_dahipuri", "Dahi Puri Dixit", "02/05/2020", "F", "O+", "104cm", "16kg", "33 Curd Colony, Delhi", "Madhavi Dixit", "Dentist", "Sanjay Dixit", "Doctor", "None", "Royal Purple", "Dahi Puri", "Cat", "Badminton", "Poetry"),
    ("Bal Vatika 2", "A", "s_ragda", "Ragda Ram", "27/09/2020", "M", "A+", "109cm", "18kg", "66 Patties Lane, Delhi", "Usha Ram", "Homemaker", "Kishan Ram", "Contractor", "None", "Crimson Red", "Ragda Patties", "Bengal Tiger", "Wrestling", "Building Blocks"),

    ("Bal Vatika 2", "B", "s_bunty", "Bunty Bubble", "08/02/2020", "M", "B+", "107cm", "17kg", "33 Bubble Gum St, Delhi", "Renu Bubble", "Housewife", "Vinod Bubble", "Salesman", "None", "Golden Yellow", "Chowmein", "Puppy", "Running", "Video Games"),
    ("Bal Vatika 2", "B", "s_chottu", "Chottu Chole", "19/05/2020", "M", "A+", "103cm", "15kg", "11 Spice Market, Delhi", "Prema Devi", "Spice Seller", "Kishan Lal", "Trader", "Masala-7", "Amber Gold", "Chole Bhature", "Horse", "Kabaddi", "Kite Flying"),
    ("Bal Vatika 2", "B", "s_dolly", "Dolly Dhokla", "28/10/2020", "F", "O+", "105cm", "16kg", "67 Gujarat Nagar, Delhi", "Hetal Dhokla", "Teacher", "Jayesh Dhokla", "Engineer", "None", "Deep Magenta", "Dhokla", "Peacock", "Tennis", "Dance"),
    ("Bal Vatika 2", "B", "s_khandvi", "Khandvi Khan", "15/03/2020", "F", "AB-", "106cm", "16kg", "4 Silk Roll Marg, Delhi", "Shabana Khan", "Architect", "Tariq Khan", "Pilot", "None", "Mint Green", "Khandvi", "Snow Leopard", "Skating", "Yoga"),
    ("Bal Vatika 2", "B", "s_fafda", "Fafda Fernandes", "09/11/2020", "M", "B+", "108cm", "18kg", "12 Yellow Street, Delhi", "Maria Fernandes", "Lecturer", "Joseph Fernandes", "Captain", "None", "Saffron Orange", "Fafda Jalebi", "Cheetah", "Cycling", "Guitar"),
    ("Bal Vatika 2", "B", "s_gathiya", "Gathiya Ghosh", "21/07/2020", "M", "O-", "104cm", "15kg", "90 Besan Gali, Delhi", "Debika Ghosh", "Journalist", "Pranab Ghosh", "Editor", "None", "Emerald Green", "Bhavnagari Gathiya", "Dolphin", "Swimming", "Drawing"),

    # ── BAL VATIKA 3 ──
    ("Bal Vatika 3", "A", "s_bablu", "Bablu Biryani", "11/03/2019", "M", "B+", "114cm", "21kg", "23 Biryani Bazaar, Delhi", "Nafisa Begum", "Housewife", "Irfan Khan", "Chef", "Kebab-4", "Crimson Red", "Biryani", "Camel", "Football", "Cooking"),
    ("Bal Vatika 3", "A", "s_mithai", "Mithai Mehta", "27/08/2019", "F", "A+", "110cm", "18kg", "5 Sweet Valley, Delhi", "Priya Mehta", "Dentist", "Amit Mehta", "Lawyer", "None", "Lavender Purple", "Barfi", "Panda", "Gymnastics", "Piano"),
    ("Bal Vatika 3", "A", "s_chikki", "Chikki Chawla", "16/06/2019", "M", "O-", "112cm", "20kg", "89 Peanut Plaza, Delhi", "Shanti Chawla", "Tailor", "Gopal Chawla", "Mechanic", "Gachak-9", "Golden Yellow", "Chikki", "Kingfisher", "Athletics", "Craft"),
    ("Bal Vatika 3", "A", "s_pista", "Pista Prasad", "03/01/2019", "M", "AB+", "111cm", "19kg", "44 Dry Fruit Marg, Delhi", "Saroj Prasad", "Nurse", "Anand Prasad", "Pharmacist", "None", "Mint Green", "Pista Kulfi", "Peacock", "Cricket", "Gardening"),
    ("Bal Vatika 3", "A", "s_badam", "Badam Bhatt", "19/10/2019", "F", "A-", "113cm", "20kg", "78 Nut Grove, Delhi", "Kamini Bhatt", "Professor", "Devendra Bhatt", "Scientist", "None", "Amber Gold", "Badam Milk", "Bengal Tiger", "Badminton", "Reading"),
    ("Bal Vatika 3", "A", "s_anjeer", "Anjeer Agrawal", "25/04/2019", "M", "B+", "115cm", "22kg", "12 Health Lane, Delhi", "Meena Agrawal", "CA", "Sunil Agrawal", "Auditor", "None", "Deep Magenta", "Dry Fruit Halwa", "Elephant", "Chess", "Coding"),

    ("Bal Vatika 3", "B", "s_kulfi", "Kulfi Kumar", "04/01/2019", "M", "AB-", "116cm", "22kg", "17 Ice Cream Lane, Delhi", "Suman Kumar", "Housewife", "Rajan Kumar", "Vendor", "Faluda-5", "Turquoise Blue", "Kulfi", "Panda", "Ice Skating", "Drawing"),
    ("Bal Vatika 3", "B", "s_halwa", "Halwa Hasan", "20/09/2019", "M", "A-", "109cm", "18kg", "44 Moong Dal Rd, Delhi", "Fatima Hasan", "Seamstress", "Ali Hasan", "Driver", "None", "Amber Gold", "Halwa", "Bengal Tiger", "Wrestling", "Calligraphy"),
    ("Bal Vatika 3", "B", "s_peda_bv3", "Peda Pillai", "13/11/2019", "F", "B+", "107cm", "17kg", "78 South Extension, Delhi", "Lakshmi Pillai", "Software Eng", "Venkat Pillai", "Professor", "Murukku-7", "Coral Pink", "Peda", "Peacock", "Table Tennis", "Coding"),
    ("Bal Vatika 3", "B", "s_rabri", "Rabri Roy", "08/02/2019", "F", "O+", "111cm", "19kg", "19 Malai Gali, Delhi", "Srabani Roy", "Artist", "Tapan Roy", "Musician", "None", "Royal Purple", "Thick Rabri", "Cat", "Swimming", "Singing"),
    ("Bal Vatika 3", "B", "s_falooda", "Falooda Farooqui", "30/05/2019", "M", "B-", "113cm", "20kg", "5 Rose Syrup Marg, Delhi", "Yasmin Farooqui", "Teacher", "Zubair Farooqui", "Architect", "None", "Crimson Red", "Royal Falooda", "Dolphin", "Badminton", "Fashion Design"),
    ("Bal Vatika 3", "B", "s_shrikhand", "Shrikhand Sharma", "17/12/2019", "M", "A+", "110cm", "18kg", "90 Dairy Colony, Delhi", "Archana Sharma", "Doctor", "Manish Sharma", "Surgeon", "None", "Saffron Orange", "Mango Shrikhand", "Cheetah", "Cycling", "Origami"),

    ("Bal Vatika 3", "C", "s_meduvada", "Medu Vada Mahesh", "15/03/2019", "M", "O+", "112cm", "19kg", "12 Coconut Grove, Delhi", "Revathi Mahesh", "Banker", "Mahesh Iyer", "Manager", "None", "Golden Yellow", "Crispy Vada", "Kingfisher", "Cricket", "Drawing"),
    ("Bal Vatika 3", "C", "s_uttapam", "Uttapam Unnikrishnan", "22/07/2019", "M", "B+", "114cm", "21kg", "45 Onion Marg, Delhi", "Deepa Unni", "Nurse", "Unnikrishnan K", "Engineer", "None", "Emerald Green", "Onion Uttapam", "Elephant", "Football", "Cooking"),
    ("Bal Vatika 3", "C", "s_puttu", "Puttu Pillai", "09/10/2019", "M", "A-", "110cm", "18kg", "78 Rice Steam Lane, Delhi", "Bindu Pillai", "Lecturer", "Rajesh Pillai", "Accountant", "None", "Mint Green", "Steam Puttu", "Parrot", "Singing", "Flute"),
    ("Bal Vatika 3", "C", "s_idiyappam", "Idiyappam Ismael", "01/01/2019", "M", "AB+", "111cm", "19kg", "3 Thread Noodle St, Delhi", "Amina Ismael", "Designer", "Ismael Ahmed", "Architect", "None", "Lavender Purple", "String Hoppers", "Rabbit", "Origami", "Puzzle Solving"),
    ("Bal Vatika 3", "C", "s_rasam_bv3", "Rasam Rajan", "18/04/2019", "M", "O-", "113cm", "20kg", "56 Pepper Corner, Delhi", "Radha Rajan", "Professor", "Rajan Swamy", "Scientist", "None", "Crimson Red", "Pepper Rasam", "Bengal Tiger", "Chess", "Debate"),
    ("Bal Vatika 3", "C", "s_payasam", "Payasam Parameswaran", "29/11/2019", "F", "B-", "108cm", "17kg", "89 Sweet Milk Road, Delhi", "Gauri Parameswaran", "Artist", "Parameswaran N", "Writer", "None", "Coral Pink", "Elaneer Payasam", "Peacock", "Dance", "Violin"),

    # ── GRADE 1 ──
    ("Grade 1", "A", "s_pinky", "Pinky Paratha", "09/04/2018", "F", "B+", "120cm", "23kg", "32 Wheat Field, Delhi", "Asha Paratha", "Housewife", "Dinesh Paratha", "Farmer", "Roti-3", "Coral Pink", "Aloo Paratha", "Butterfly", "Skipping", "Origami"),
    ("Grade 1", "A", "s_chintu", "Chintu Chai", "21/07/2018", "M", "O+", "118cm", "21kg", "56 Tea Garden, Delhi", "Divya Sharma", "Café Owner", "Rajiv Sharma", "Estate Mgr", "None", "Turquoise Blue", "Cutting Chai", "Cat", "Carrom", "Storytelling"),
    ("Grade 1", "A", "s_tinku", "Tinku Tandoor", "15/02/2018", "M", "A+", "122cm", "24kg", "8 Naan Nagar, Delhi", "Pooja Tandoor", "Baker", "Sunil Tandoor", "Baker", "Naan-5", "Saffron Orange", "Tandoori Roti", "Eagle", "Cricket", "Pottery"),
    ("Grade 1", "A", "s_kulcha", "Kulcha Kapoor", "03/10/2018", "M", "AB+", "119cm", "22kg", "4 Amritsar Lane, Delhi", "Simran Kapoor", "Boutique Owner", "Jaswinder Kapoor", "Businessman", "None", "Golden Yellow", "Amritsari Kulcha", "Cheetah", "Badminton", "Painting"),
    ("Grade 1", "A", "s_naan_g1", "Naan Nair", "14/05/2018", "F", "B-", "117cm", "20kg", "90 Garlic Street, Delhi", "Sobha Nair", "Teacher", "Unni Nair", "Officer", "None", "Mint Green", "Garlic Naan", "Dolphin", "Gymnastics", "Dance"),
    ("Grade 1", "A", "s_bhatura", "Bhatura Bhardwaj", "28/11/2018", "M", "O-", "123cm", "25kg", "15 Chole Hub, Delhi", "Kiran Bhardwaj", "Advocate", "Rakesh Bhardwaj", "Judge", "None", "Royal Purple", "Puffed Bhatura", "Elephant", "Football", "Drama"),
    ("Grade 1", "A", "s_rumali", "Rumali Rao", "19/08/2018", "F", "A-", "116cm", "19kg", "77 Silk Fold Rd, Delhi", "Vandana Rao", "Architect", "Srinivas Rao", "Engineer", "None", "Lavender Purple", "Rumali Roti", "Peacock", "Table Tennis", "Origami"),

    ("Grade 1", "B", "s_mango", "Mango Malhotra", "17/05/2018", "F", "AB+", "119cm", "21kg", "21 Fruit Garden, Delhi", "Rita Malhotra", "Journalist", "Sanjay Malhotra", "Editor", "None", "Saffron Orange", "Mango Shake", "Parrot", "Badminton", "Writing"),
    ("Grade 1", "B", "s_nimbu", "Nimbu Nair", "29/08/2018", "M", "O-", "117cm", "20kg", "14 Citrus Colony, Delhi", "Deepa Nair", "Nurse", "Gopan Nair", "Pharmacist", "Lime-2", "Mint Green", "Lemon Rice", "Chameleon", "Football", "Painting"),
    ("Grade 1", "B", "s_papaya", "Papaya Pandey", "06/12/2018", "F", "B-", "116cm", "19kg", "39 Tropical Lane, Delhi", "Usha Pandey", "Housewife", "Manoj Pandey", "Grocer", "Kiwi-8", "Amber Gold", "Papaya", "Rabbit", "Volleyball", "Gardening"),
    ("Grade 1", "B", "s_chiku", "Chiku Chaudhury", "11/01/2018", "M", "A+", "118cm", "21kg", "5 Sweet Orchard, Delhi", "Moushumi Chaudhury", "Teacher", "Debasis Chaudhury", "Banker", "None", "Royal Purple", "Chiku Shake", "Panda", "Chess", "Singing"),
    ("Grade 1", "B", "s_jamun", "Jamun Joshi", "23/03/2018", "M", "B+", "121cm", "23kg", "88 Berry Marg, Delhi", "Smita Joshi", "Doctor", "Alok Joshi", "Surgeon", "None", "Deep Magenta", "Black Jamun", "Kingfisher", "Cricket", "Calligraphy"),
    ("Grade 1", "B", "s_anar", "Anar Ali", "04/09/2018", "F", "O+", "115cm", "18kg", "12 Ruby Street, Delhi", "Shazia Ali", "Artist", "Tariq Ali", "Architect", "None", "Crimson Red", "Pomegranate Seeds", "Peacock", "Dance", "Drawing"),
    ("Grade 1", "B", "s_amrood", "Amrood Agnihotri", "18/10/2018", "M", "AB-", "120cm", "22kg", "34 Chaat Garden, Delhi", "Poonam Agnihotri", "CA", "Vineet Agnihotri", "Auditor", "None", "Emerald Green", "Guava with Chaat Masala", "Cheetah", "Athletics", "Guitar"),

    # ── GRADE 2 ──
    ("Grade 2", "A", "s_guddu", "Guddu Gulabjamun", "10/06/2017", "M", "B+", "126cm", "27kg", "65 Sweet Lane, Delhi", "Aarti Devi", "Cook", "Bhola Nath", "Sweet Maker", "None", "Crimson Red", "Gulab Jamun", "Bull", "Wrestling", "Music"),
    ("Grade 2", "A", "s_rinku", "Rinku Rasmalai", "23/01/2017", "F", "A+", "122cm", "24kg", "27 Dairy Road, Delhi", "Meena Sinha", "Teacher", "Prakash Sinha", "Dairy Farmer", "Paneer-4", "Lavender Purple", "Rasmalai", "Cow", "Basketball", "Reading"),
    ("Grade 2", "A", "s_sonu", "Sonu Samosa", "18/09/2017", "M", "O+", "124cm", "26kg", "3 Samosa Street, Delhi", "Kanta Devi", "Housewife", "Pappu Lal", "Vendor", "Kachori-7", "Saffron Orange", "Potato Samosa", "Monkey", "Cricket", "Card Games"),
    ("Grade 2", "A", "s_kachori", "Kachori Khatri", "05/04/2017", "M", "AB+", "125cm", "26kg", "88 Pyaaz Marg, Delhi", "Sunita Khatri", "Designer", "Rajesh Khatri", "Trader", "None", "Golden Yellow", "Pyaaz Kachori", "Cheetah", "Badminton", "Kite Flying"),
    ("Grade 2", "A", "s_pakora", "Pakora Paswan", "19/11/2017", "M", "B-", "127cm", "28kg", "14 Rain Street, Delhi", "Savitri Paswan", "Nurse", "Ramesh Paswan", "Officer", "None", "Amber Gold", "Bread Pakora", "Elephant", "Football", "Drawing"),
    ("Grade 2", "A", "s_mirchi", "Mirchi Mishra", "30/07/2017", "F", "A-", "121cm", "23kg", "9 spicy Gali, Delhi", "Nisha Mishra", "Lawyer", "Sanjay Mishra", "Advocate", "None", "Emerald Green", "Mirchi Vada", "Peacock", "Debate", "Drama"),

    ("Grade 2", "B", "s_munna", "Munna Maggi", "14/03/2017", "M", "B+", "125cm", "26kg", "88 Noodle Nagar, Delhi", "Reema Maggi", "Software Eng", "Suresh Maggi", "Manager", "None", "Golden Yellow", "2-Minute Maggi", "Dog", "Cricket", "Gaming"),
    ("Grade 2", "B", "s_pappu", "Pappu Paneer", "07/11/2017", "M", "A-", "123cm", "25kg", "51 Dairy Colony, Delhi", "Sarla Devi", "Milk Seller", "Ramu Paneer", "Paneer Maker", "Tofu-5", "Royal Purple", "Paneer Tikka", "Buffalo", "Kabaddi", "Carving"),
    ("Grade 2", "B", "s_chunnu", "Chunnu Chutney", "30/07/2017", "F", "O+", "121cm", "23kg", "19 Pickle Gali, Delhi", "Bimla Devi", "Pickle Maker", "Hariom Lal", "Trader", "None", "Mint Green", "Chutney", "Goat", "Kho Kho", "Knitting"),
    ("Grade 2", "B", "s_kurkure", "Kurkure Kulkarni", "12/02/2017", "M", "AB+", "126cm", "27kg", "4 Masala Munch Rd, Delhi", "Pooja Kulkarni", "Professor", "Anand Kulkarni", "Engineer", "None", "Saffron Orange", "Masala Munch", "Cheetah", "Dance", "Skating"),
    ("Grade 2", "B", "s_lays", "Lays Lal", "25/08/2017", "M", "O-", "124cm", "25kg", "77 Air Packet St, Delhi", "Seema Lal", "Teacher", "Deepak Lal", "Banker", "None", "Turquoise Blue", "Magic Masala", "Falcon", "Athletics", "Video Editing"),
    ("Grade 2", "B", "s_bingo", "Bingo Banerjee", "03/10/2017", "M", "B-", "122cm", "24kg", "18 Mad Angles Marg, Delhi", "Swati Banerjee", "Architect", "Prosenjit Banerjee", "Artist", "None", "Deep Magenta", "Mad Angles", "Panda", "Chess", "Math Puzzles"),

    ("Grade 2", "C", "s_poha", "Poha Patel", "11/05/2017", "M", "A+", "123cm", "24kg", "12 Indore Lane, Delhi", "Varsha Patel", "CA", "Nilesh Patel", "Auditor", "None", "Golden Yellow", "Indori Poha", "Peacock", "Badminton", "Public Speaking"),
    ("Grade 2", "C", "s_upma", "Upma Upadhyay", "29/01/2017", "F", "O+", "121cm", "23kg", "55 Rava Marg, Delhi", "Saraswati Upadhyay", "Lecturer", "Brijesh Upadhyay", "Principal", "None", "Emerald Green", "Rava Upma", "Dolphin", "Swimming", "Yoga"),
    ("Grade 2", "C", "s_sheera", "Sheera Shetty", "18/06/2017", "F", "B+", "120cm", "22kg", "89 Pineapple St, Delhi", "Shilpa Shetty", "Designer", "Sunil Shetty", "Hotelier", "None", "Amber Gold", "Pineapple Sheera", "Cat", "Dance", "Flute"),
    ("Grade 2", "C", "s_sabudana", "Sabudana Saxena", "04/09/2017", "F", "AB-", "122cm", "24kg", "34 Fasting Colony, Delhi", "Neerja Saxena", "Doctor", "Pradeep Saxena", "Surgeon", "None", "Lavender Purple", "Sabudana Khichdi", "Rabbit", "Gymnastics", "Reading"),
    ("Grade 2", "C", "s_khichdi", "Khichdi Khan", "15/12/2017", "M", "A-", "125cm", "26kg", "7 Comfort Street, Delhi", "Parveen Khan", "Writer", "Salim Khan", "Director", "None", "Royal Purple", "Comfort Khichdi", "Panda", "Football", "Cooking"),
    ("Grade 2", "C", "s_dalia", "Dalia Das", "22/03/2017", "F", "O-", "119cm", "21kg", "99 Grain Marg, Delhi", "Rina Das", "Nurse", "Subir Das", "Officer", "None", "Coral Pink", "Sweet Dalia", "Kingfisher", "Table Tennis", "Drawing"),
]

# Function to generate remaining grades 3-12 programmatically with exact details
def build_upper_grades():
    upper_students = []
    grades_config = [
        # (Grade, Sec, prefix, start_idx, count)
        ("Grade 3", "A", "s_g3a", [("Bittoo Barfi","02/05/2016","M"), ("Golu Gujiya","19/08/2016","M"), ("Sweety Sandesh","11/02/2016","F"), ("Kalakand Kapoor","14/06/2016","M"), ("Milkcake Mishra","23/11/2016","M"), ("Mysorepak Menon","08/01/2016","M"), ("Ghevar Gupta","30/09/2016","M")]),
        ("Grade 3", "B", "s_g3b", [("Lucky Lassi","25/06/2016","M"), ("Bubbly Bhujia","08/10/2016","F"), ("Raju Rabri","14/12/2016","M"), ("Mathri Mathur","02/03/2016","F"), ("Sev Singhania","19/07/2016","M"), ("Chakhna Choubey","05/09/2016","M"), ("Namkeen Nambiar","11/01/2016","M")]),
        
        ("Grade 4", "A", "s_g4a", [("Achaar Agrawal","12/04/2015","M"), ("Bhindi Bhatnagar","22/07/2015","F"), ("Chawal Chauhan","05/11/2015","M"), ("Daal Deshmukh","18/02/2015","M"), ("Elaichi Ekambaram","30/08/2015","F"), ("Fennel Fernandez","14/01/2015","M")]),
        ("Grade 4", "B", "s_g4b", [("Ghee Gupta","09/03/2015","M"), ("Hing Hegde","17/06/2015","F"), ("Imli Inamdar","28/09/2015","F"), ("Jeera Joshi","04/12/2015","M"), ("Karela Kapoor","15/01/2015","M"), ("Laung Lakhani","21/05/2015","M")]),
        ("Grade 4", "C", "s_g4c", [("Methi Mehta","11/02/2015","F"), ("Pudina Pandey","23/05/2015","M"), ("Rai Reddy","07/08/2015","F"), ("Saunf Sharma","19/10/2015","F"), ("Tejpatta Tripathi","02/12/2015","M"), ("Haldi Harish","16/04/2015","M")]),

        ("Grade 5", "A", "s_g5a", [("Rajma Rao","10/01/2014","M"), ("Chhole Chawla","22/04/2014","M"), ("Kadhi Kulkarni","05/07/2014","F"), ("Baingan Bhalla","18/09/2014","M"), ("Aloo Agrawal","30/11/2014","M"), ("Gobi Goswami","12/02/2014","F"), ("Matar Mukherjee","24/06/2014","M")]),
        ("Grade 5", "B", "s_g5b", [("Paneer Butter-Masala","14/03/2014","M"), ("Malai Kofta","26/06/2014","M"), ("Dum Aloo Dixit","08/09/2014","M"), ("Shahi Paneer Shah","20/11/2014","M"), ("Bharta Banerjee","02/01/2014","M"), ("Navratan Namboodiri","15/05/2014","M"), ("Pulao Pillai","27/08/2014","M")]),

        ("Grade 6", "A", "s_g6a", [("Samosa Supreme","05/02/2013","M"), ("Kachori King","17/05/2013","M"), ("Vada Pav Verma","29/08/2013","M"), ("Dabeli Dave","11/11/2013","F"), ("Misal Pav More","23/01/2013","M"), ("Pav Bhaji Patil","04/04/2013","M")]),
        ("Grade 6", "B", "s_g6b", [("Papdi Chaat Paranjpe","16/03/2013","F"), ("Tokri Chaat Tiwary","28/06/2013","M"), ("Palak Chaat Pandey","10/09/2013","F"), ("Samosa Chaat Sethi","22/11/2013","M"), ("Aloo Chaat Anand","04/01/2013","M"), ("Corn Chaat Chopra","16/04/2013","F")]),

        ("Grade 7", "A", "s_g7a", [("Tikka Taneja","12/01/2012","M"), ("Seekh Kebab Saxena","24/04/2012","M"), ("Tandoori Momos Malhotra","06/07/2012","M"), ("Malai Tikka Maitra","18/09/2012","F"), ("Hariyali Kebab Hegde","30/11/2012","M"), ("Achari Paneer Apte","12/02/2012","F"), ("Reshmi Kebab Roy","24/05/2012","F")]),
        ("Grade 7", "B", "s_g7b", [("Schezwan Noodles Sen","08/03/2012","M"), ("Manchurian Mishra","20/06/2012","M"), ("Spring Roll Srivastava","02/09/2012","F"), ("Fried Rice Fernandez","14/11/2012","M"), ("Chili Paneer Chawla","26/01/2012","M"), ("Momos Mukhopadhyay","09/04/2012","M")]),
        ("Grade 7", "C", "s_g7c", [("Thukpa Thapa","15/02/2012","M"), ("Bao Bun Bhattacharya","27/05/2012","M"), ("Wonton Wadhwa","09/08/2012","F"), ("Kimchi Kapoor","21/10/2012","F"), ("Sushi Subrahmanyan","03/12/2012","F"), ("Ramen Rao","15/04/2012","M")]),

        ("Grade 8", "A", "s_g8a", [("Dal Makhani Das","10/01/2011","M"), ("Tadka Dal Trivedi","22/04/2011","M"), ("Chana Masala Chaudhury","04/07/2011","M"), ("Rajma Masala Rastogi","16/09/2011","M"), ("Butter Chicken Bajaj","28/11/2011","M"), ("Korma Kulkarni","10/02/2011","M")]),
        ("Grade 8", "B", "s_g8b", [("Biryani Badshah","14/03/2011","M"), ("Hyderabadi Haleem","26/06/2011","M"), ("Pulao Purohit","08/09/2011","M"), ("Jeera Rice Joshi","20/11/2011","M"), ("Curd Rice Chakraborty","02/01/2011","M"), ("Lemon Rice Lal","14/04/2011","M")]),

        ("Grade 9", "A", "s_g9a", [("Gulabjamun Gill","05/01/2010","M"), ("Jalebi Joshi","17/04/2010","F"), ("Rasgulla Ray","29/06/2010","M"), ("Chum Chum Chatterji","11/09/2010","F"), ("Balushahi Biswal","23/11/2010","M"), ("Soan Papdi Somaiya","05/02/2010","F"), ("Petha Pant","17/05/2010","M")]),
        ("Grade 9", "B", "s_g9b", [("Pastry Parameswaran","12/03/2010","F"), ("Donut Dixit","24/06/2010","M"), ("Brownie Bhardwaj","06/09/2010","M"), ("Cupcake Chatterji","18/11/2010","F"), ("Waffle Wagle","30/01/2010","M"), ("Pancake Pillai","12/04/2010","F")]),

        ("Grade 10", "A", "s_g10a", [("Raita Rao","01/01/2009","M"), ("Boondi Raita Bisht","13/04/2009","M"), ("Pineapple Raita Puri","25/06/2009","F"), ("Cucumber Salad Sen","07/09/2009","M"), ("Kachumber Khattar","19/11/2009","M"), ("Papad Parmar","31/01/2009","M"), ("Masala Papad Mittal","12/04/2009","F")]),
        ("Grade 10", "B", "s_g10b", [("Pizza Pandey","15/02/2009","M"), ("Burger Bhatia","27/05/2009","M"), ("Taco Tripathi","09/08/2009","F"), ("Nacho Nanda","21/10/2009","M"), ("Pasta Poddar","03/12/2009","F"), ("Garlic Bread Gupta","15/04/2009","M")]),
        ("Grade 10", "C", "s_g10c", [("Risotto Roy","10/01/2009","M"), ("Lasagna Lal","22/04/2009","F"), ("Gnocchi Garg","04/07/2009","M"), ("Ravioli Rao","16/09/2009","M"), ("Bruschetta Bajaj","28/11/2009","F"), ("Tiramisu Thakur","10/02/2009","M")]),

        ("Grade 11", "A", "s_g11a", [("Barfi Bhatt","08/01/2008","M"), ("Peda Pandey","20/04/2008","F"), ("Sandesh Sen","02/07/2008","M"), ("Rasmalai Roy","14/09/2008","F"), ("Kaju Roll Rastogi","26/11/2008","M"), ("Anjeer Barfi Anand","07/02/2008","M"), ("Motichoor Laddu Lamba","19/05/2008","M")]),
        ("Grade 11", "B", "s_g11b", [("Espresso Ekambaram","11/03/2008","M"), ("Cappuccino Chaudhury","23/06/2008","F"), ("Latte Likhati","05/09/2008","F"), ("Mocha Mishra","17/11/2008","M"), ("Americano Agnihotri","29/01/2008","M"), ("Macchiato Mathur","12/04/2008","F"), ("Cold Brew Kapoor","24/07/2008","M")]),

        ("Grade 12", "A", "s_g12a", [("Samosa Senior","01/01/2007","M"), ("Jalebi Junior","13/04/2007","F"), ("Gulab Supreme","25/06/2007","M"), ("Rasgulla Emperor","07/09/2007","F"), ("Kaju King","19/11/2007","M"), ("Laddu Lord","31/01/2007","M"), ("Barfi Baron","12/04/2007","M"), ("Rabri Queen","24/07/2007","F")]),
        ("Grade 12", "B", "s_g12b", [("Mocktail Merchant","05/02/2007","M"), ("Mojito Mukherjee","17/05/2007","F"), ("Pina Colada Patel","29/08/2007","F"), ("Blue Lagoon Bhatt","11/11/2007","M"), ("Smoothy Saxena","23/01/2007","M"), ("Milkshake Mehta","04/04/2007","F"), ("Boba Tea Bansal","16/07/2007","F")]),
        ("Grade 12", "C", "s_g12c", [("Chef De Cuisine Chaudhury","09/01/2007","M"), ("Sous Chef Sharma","21/04/2007","M"), ("Sommelier Singh","03/07/2007","M"), ("Patissier Pandey","15/09/2007","F"), ("Barista Verma","27/11/2007","M"), ("Masterchef Malhotra","08/02/2007","M"), ("Gourmet Garg","20/05/2007","M")]),
    ]

    for grade, sec, prefix, stu_list in grades_config:
        for idx, (name, dob, gender) in enumerate(stu_list, start=1):
            uname = f"{prefix}_{idx}_{name.split()[0].lower()}"
            ht = f"{130 + (int(grade.split()[-1]) if 'Grade' in grade else 0)*4 + idx}cm"
            wt = f"{30 + (int(grade.split()[-1]) if 'Grade' in grade else 0)*3 + idx}kg"
            addr = f"{idx*10} Academic Street, Samosa Zone, Delhi"
            m_name = f"{name.split()[0]}'s Mother"
            f_name = f"{name.split()[0]}'s Father"
            col = COLOURS[idx % len(COLOURS)]
            food = name.split()[0]
            anim = ANIMALS[idx % len(ANIMALS)]
            sport = SPORTS[idx % len(SPORTS)]
            hobby = HOBBIES[idx % len(HOBBIES)]
            upper_students.append((grade, sec, uname, name, dob, gender, "O+", ht, wt, addr, m_name, "Doctor", f_name, "Engineer", "None", col, food, anim, sport, hobby))

    return upper_students

ALL_STUDENTS = STUDENTS_MASTER + build_upper_grades()

# Generate Stage-appropriate HPC Assessment JSON Data
def generate_hpc_assessments(grade, full_name, fav_food):
    grade_num = 1
    if "Bal Vatika" in grade:
        grade_num = 1
    else:
        try: grade_num = int(grade.split()[-1])
        except: grade_num = 1

    if grade_num <= 2: # Stage 1: Foundational
        return {
            "selfAssessment": {
                "myFavoriteThing": f"Eating hot {fav_food} and drawing funny geometrical shapes",
                "whatIAmGoodAt": "Sharing snacks, listening attentively to stories, and keeping my desk tidy",
                "whatIWantToLearn": "How to make the world's biggest samosa without breaking the crust",
                "smileyChoice": "Very Happy",
                "reflectionText": f"{full_name} is enthusiastic about classroom activities and shows great teamwork."
            },
            "peerAssessment": {
                "friendName": "Sonu Samosa",
                "friendFeedback": f"{full_name} always shares crayons and brings delicious lunch treats!",
                "peerRating": "Super Star Friend"
            },
            "teacherAssessment": {
                "physicalDev": "Shows excellent motor coordination, posture balance, and physical agility.",
                "cognitiveDev": "Demonstrates sharp observation, pattern recognition, and counting skills.",
                "socioEmotionalDev": "Very empathetic, cooperative with classmates, and respects school norms.",
                "languageDev": "Expresses thoughts clearly in both English and Hindi with rich vocabulary.",
                "aestheticDev": "Loves singing, creative art, and vibrant color combinations."
            },
            "parentFeedback": {
                "homeObservation": f"{full_name} enthusiastically talks about Samosa High lessons every evening.",
                "parentSignatureDate": "2025-10-15"
            },
            "activity": {
                "title": "Grand Samosa Culinary & Art Fair",
                "role": "Team Captain",
                "performance": "Outstanding creativity and energetic participation"
            }
        }

    elif grade_num <= 5: # Stage 2: Preparatory
        return {
            "selfAssessment": {
                "academicGoals": "Master multiplication tables up to 20 and write hilarious original short stories",
                "strength": "Logical problem solving, quick mental math, and environmental awareness",
                "areaToImprove": "Managing desk stationery and not getting distracted by samosa aromas"
            },
            "peerAssessment": {
                "peerName": "Bittoo Barfi",
                "comments": f"{full_name} is a brilliant team member during group science projects!"
            },
            "teacherAssessment": {
                "mathematics": "Solves multi-digit word problems fluently with innovative strategies.",
                "scienceEVS": "Asks insightful questions about nature, plant growth, and ecosystems.",
                "languages": "Reads fluently with voice modulation; writes structured paragraphs."
            },
            "coCurricular": {
                "sports": "Active in Cricket & Badminton; shows commendable sportsmanship.",
                "arts": "Excellent visual arts skills, clay sculpting, and musical rhythm."
            },
            "termSummary": {
                "attendance": "96.5%",
                "conduct": "Exemplary",
                "healthStatus": "Fit & Agile",
                "teacherRemarks": f"{full_name} is a stellar student who combines intellect with joyful humor."
            }
        }

    elif grade_num <= 8: # Stage 3: Middle Stage
        return {
            "academicDescriptors": {
                "mathematics": "Demonstrates strong grasp of algebraic expressions, geometry proofs, and data handling.",
                "science": "Excellent analytical skills in physics experiments, chemical reactions, and biology diagrams.",
                "socialScience": "Deep understanding of historical timelines, geographical maps, and civic governance.",
                "computerAI": "Proficient in Python programming fundamentals, algorithms, and web design."
            },
            "projectWork": {
                "topic": "Sustainable Energy & Snack Package Recycling in Modern Schools",
                "role": "Lead Researcher & Presenter",
                "score": "A+",
                "feedback": "Outstanding research depth and highly engaging multimedia presentation."
            },
            "coCurricular": {
                "sportsLeadership": "Captain of Class Football Squad; displays strategic mindset.",
                "ethicsValues": "Actively participates in 'Seva' community initiatives and eco-drives."
            },
            "termSummary": {
                "attendance": "98.0%",
                "conduct": "Outstanding",
                "healthIndex": "A+",
                "principalRemark": f"Dr. Rasgulla Roy commends {full_name} for exceptional leadership and academic brilliance."
            }
        }

    else: # Stage 4: Secondary Stage (Grade 9 - 12)
        return {
            "academicDescriptors": {
                "physics": "Masters complex concepts in thermodynamics, optics, and electromagnetism.",
                "chemistry": "Flawless organic reaction mechanisms and stoichiometric calculations.",
                "mathematics": "Exceptional calculus derivative/integration techniques and matrix transformations.",
                "computerScienceAI": "Designs full-stack database architectures and machine learning models."
            },
            "projectWork": {
                "topic": "High-Efficiency Deep-Frying Thermal Dynamics & Algorithmic Optimization",
                "role": "Project Leader",
                "score": "A++",
                "feedback": "Publishable quality research paper with innovative thermodynamic modeling."
            },
            "coCurricular": {
                "leadership": "President of Samosa High Innovation & Robotics Club.",
                "communityService": "Organized 50+ hours of peer tutoring and local food distribution."
            },
            "termSummary": {
                "attendance": "99.2%",
                "conduct": "Valedictorian Grade",
                "healthFitness": "Peak Athletic Condition",
                "principalRemark": f"Dr. Rasgulla Roy certifies {full_name} as a pride of Samosa High International School!"
            }
        }

def generate_hpc_a2(grade):
    return {
        "CG-1": {"rating": "Sky", "teacherComment": "Shows immaculate personal hygiene, safety awareness, and health habits."},
        "CG-2": {"rating": "Mountain", "teacherComment": "Extremely sharp sensorial perception and visual memory."},
        "CG-3": {"rating": "Sky", "teacherComment": "Demonstrates outstanding flexibility, balance, and physical stamina."},
        "CG-4": {"rating": "Mountain", "teacherComment": "High emotional intelligence, self-regulation, and peer empathy."},
        "CG-5": {"rating": "Sky", "teacherComment": "Displays joyful dedication towards productive work and community service."},
        "CG-6": {"rating": "Sky", "teacherComment": "Proactive care and love for environment and living creatures."},
        "CG-7": {"rating": "Mountain", "teacherComment": "Logical thinker who constructs coherent scientific hypotheses."},
        "CG-8": {"rating": "Sky", "teacherComment": "Mastery over quantitative concepts, spatial geometry, and problem solving."},
        "CG-9": {"rating": "Sky", "teacherComment": "Fluent and engaging communicator in multiple languages."},
        "CG-10": {"rating": "Mountain", "teacherComment": "High accuracy, expression, and speed in reading and creative writing."},
        "CG-11": {"rating": "Sky", "teacherComment": "Excellent bilingual proficiency and comprehension."},
        "CG-12": {"rating": "Sky", "teacherComment": "Vibrant artistic expressions in visual and performing arts."},
        "CG-13": {"rating": "Sky", "teacherComment": "Unshakeable focus, working memory, and positive learning habits."},
        "C-1.1": "Sky", "C-1.2": "Mountain", "C-2.1": "Sky", "C-3.1": "Sky",
        "C-4.1": "Sky", "C-5.1": "Mountain", "C-7.1": "Sky", "C-8.1": "Sky",
        "C-9.1": "Sky", "C-10.1": "Mountain", "C-12.1": "Sky", "C-13.1": "Sky"
    }

def seed_samosa_high(db_path):
    print("[seed] Booting up Samosa High International School database generator...")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Pre-compute password hashes for speed
    teacher_pw_hash = get_fast_hash("pass123")
    admin_pw_hash = get_fast_hash("admin123")

    # 1. School
    c.execute("""INSERT INTO schools (name,address_line1,address_line2,pincode,udise_code,board,principal_name,contact_phone,contact_email)
        VALUES (?,?,?,?,?,?,?,?,?)""",
        ("Samosa High International School",
         "42 Samosa Marg, Academic Zone",
         "Near Chutney Circle, New Delhi",
         "110001", "09876543210", "CBSE",
         "Dr. Rasgulla Roy", "011-23456789", "admin@samosahigh.edu.in"))
    school_id = c.lastrowid

    # 2. Superadmin
    c.execute("INSERT INTO users (username,password,plain_password,role) VALUES (?,?,?,?)",
              ("superadmin", admin_pw_hash, "admin123", "superadmin"))
    admin_uid = c.lastrowid
    c.execute("INSERT INTO superadmins (user_id,school_id,full_name) VALUES (?,?,?)",
              (admin_uid, school_id, "Dr. Rasgulla Roy"))

    # 3. Teachers & Classes
    class_map = {}
    for grade, section, username, full_name, code, qual, contact in TEACHERS_DATA:
        c.execute("INSERT INTO users (username,password,plain_password,role) VALUES (?,?,?,?)",
                  (username, teacher_pw_hash, "pass123", "teacher"))
        t_uid = c.lastrowid
        c.execute("""INSERT INTO teachers (user_id,school_id,full_name,teacher_code,account_id,qualification,contact)
            VALUES (?,?,?,?,?,?,?)""",
            (t_uid, school_id, full_name, code, code, qual, contact))
        t_id = c.lastrowid
        c.execute("INSERT INTO classes (school_id,grade,section,teacher_id,academic_year) VALUES (?,?,?,?,?)",
                  (school_id, grade, section, t_id, "2025-26"))
        cl_id = c.lastrowid
        class_map[(grade, section)] = cl_id

    # 4. Students & Enrollments & HPC Reports
    student_count = 0
    for s in ALL_STUDENTS:
        grade, section, uname, name, dob, gender, bg, ht, wt, addr = s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9]
        m_name, m_occ, f_name, f_occ, sib_info = s[10], s[11], s[12], s[13], s[14]
        fav_col, fav_food, fav_anim, fav_sport, fav_hobby = s[15], s[16], s[17], s[18], s[19]

        firstname = name.split()[0]
        plain_pw = f"samosa-2025-{firstname.lower()}"
        pw_hash = get_fast_hash(plain_pw)

        c.execute("INSERT INTO users (username,password,plain_password,role) VALUES (?,?,?,?)",
                  (uname, pw_hash, plain_pw, "student"))
        u_id = c.lastrowid

        family = json.dumps({
            "motherName": m_name, "motherOccupation": m_occ, "motherEducation": "Post Graduate",
            "fatherName": f_name, "fatherOccupation": f_occ, "fatherEducation": "Post Graduate",
            "siblingsCount": 1 if sib_info != "None" else 0, "siblingsAge": sib_info,
            "address1": addr, "phone": "9812345678",
            "motherTongue": "HI", "mediumOfInstruction": "EN", "ruralUrban": "U"
        })
        prefs = json.dumps({
            "colour": fav_col, "food": fav_food, "animal": fav_anim,
            "sport": fav_sport, "hobby": fav_hobby
        })
        assessments_json = json.dumps(generate_hpc_assessments(grade, name, fav_food))
        a2_json = json.dumps(generate_hpc_a2(grade))

        c.execute("""INSERT INTO students
            (user_id,full_name,dob,gender,blood_group,height,weight,address,phone,
             mother_tongue,medium_of_instruction,rural_urban,family_details,preferences,assessments,a2_data)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (u_id, name, dob, gender, bg, ht, wt, addr, "9812345678", "HI", "EN", "U",
             family, prefs, assessments_json, a2_json))
        s_id = c.lastrowid

        cl_id = class_map.get((grade, section))
        if cl_id:
            reg = f"SHI-{grade.replace(' ','')[:4].upper()}{section}-{str(s_id).zfill(3)}"
            roll_no = str((student_count % 10) + 1)
            pts = 200 + (s_id % 300)
            c.execute("""INSERT INTO student_enrollments
                (student_id,class_id,academic_year,registration_number,roll_number,points,school)
                VALUES (?,?,?,?,?,?,?)""",
                (s_id, cl_id, "2025-26", reg, roll_no, pts, "Samosa High International School"))

            # Also seed active report card record
            rc_data = json.dumps({
                "school": {"name": "Samosa High International School", "principal": "Dr. Rasgulla Roy", "board": "CBSE"},
                "profile": {"name": name, "dob": dob, "roll": roll_no, "reg": reg, "class": grade, "sec": section, "gender": gender, "bloodGroup": bg, "height": ht, "weight": wt, "address": addr},
                "family": json.loads(family),
                "preferences": json.loads(prefs),
                "assessments": json.loads(assessments_json),
                "a2": json.loads(a2_json)
            })
            c.execute("INSERT INTO report_cards (student_id,year,data) VALUES (?,?,?)",
                      (s_id, 2025, rc_data))

            # ── 5. Add 1-Year History (2024-25 Report Card) for Stage 2, 3, and 4 ──
            # Map previous grade for students in Grade 3 through Grade 12
            prev_grade_map = {
                "Grade 3": "Grade 2", "Grade 4": "Grade 3", "Grade 5": "Grade 4",
                "Grade 6": "Grade 5", "Grade 7": "Grade 6", "Grade 8": "Grade 7",
                "Grade 9": "Grade 8", "Grade 10": "Grade 9", "Grade 11": "Grade 10", "Grade 12": "Grade 11"
            }
            if grade in prev_grade_map:
                prev_grade = prev_grade_map[grade]
                prev_assess = generate_hpc_assessments(prev_grade, name, fav_food)
                # Customize past year remarks for clear historical context
                if "termSummary" in prev_assess:
                    prev_assess["termSummary"]["teacherRemarks"] = f"[AY 2024-25] {name} successfully completed {prev_grade} with Distinction in Crispy Samosa Logic. Promoted to {grade}."
                    prev_assess["termSummary"]["attendance"] = "97.8%"

                prev_rc_obj = {
                    "academicYear": "2024-25",
                    "school": {"name": "Samosa High International School", "principal": "Dr. Rasgulla Roy", "board": "CBSE"},
                    "profile": {"name": name, "dob": dob, "roll": roll_no, "reg": reg.replace("2025", "2024"), "class": prev_grade, "sec": section, "gender": gender, "bloodGroup": bg, "height": f"{int(ht.replace('cm',''))-4}cm", "weight": f"{int(wt.replace('kg',''))-3}kg", "address": addr},
                    "family": json.loads(family),
                    "preferences": json.loads(prefs),
                    "assessments": prev_assess,
                    "a2": json.loads(a2_json)
                }
                prev_rc_json = json.dumps(prev_rc_obj)

                # Insert into report_cards for year 2024
                c.execute("INSERT INTO report_cards (student_id,year,data) VALUES (?,?,?)",
                          (s_id, 2024, prev_rc_json))

                # Insert into archived_reports for AY 2024-25
                c.execute("""INSERT INTO archived_reports
                    (student_id, academic_year, grade, section, school_name, teacher_name, archived_data, pdf_path)
                    VALUES (?,?,?,?,?,?,?,?)""",
                    (s_id, "2024-25", prev_grade, section, "Samosa High International School",
                     "Dr. Rasgulla Roy", prev_rc_json, f"exports/archived_2024_{s_id}.pdf"))

        student_count += 1

    conn.commit()
    conn.close()
    print(f"[seed] Samosa High database successfully re-seeded on boot! (1 Admin, {len(TEACHERS_DATA)} Teachers, {student_count} Students with 1-Year History for Stage 2/3/4)")

if __name__ == "__main__":
    db = os.path.join(os.path.dirname(__file__), "database.sqlite")
    seed_samosa_high(db)

