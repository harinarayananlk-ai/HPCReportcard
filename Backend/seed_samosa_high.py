"""Seed Samosa High International School — programmatic generation."""
import sqlite3, json, os, random
import bcrypt

def hash_password(plain_text):
    return bcrypt.hashpw(plain_text.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

COLOURS = ["coral","azure","amber","jade","ruby","pearl","ivory","slate",
           "ochre","teal","plum","sage","rose","blush","mauve","cedar",
           "frost","olive","dusk","dawn","navy","moss","wine","flax",
           "mint","sand","silk","fern","lemon","opal"]

def gen_password(firstname):
    c = random.choice(COLOURS)
    d = random.randint(1000,9999)
    return f"{c}-{d}-{firstname.lower()}"

TEACHERS_DATA = [
    ("Bal Vatika 1","A","t_murugan","Master Murugan","TCH-001"),
    ("Bal Vatika 1","B","t_chutney","Ms. Chutney","TCH-002"),
    ("Bal Vatika 2","A","t_idli","Mrs. Idli Iyer","TCH-003"),
    ("Bal Vatika 2","B","t_dosa","Mr. Dosa Kumar","TCH-004"),
    ("Bal Vatika 3","A","t_sambar","Ms. Sambar Sundari","TCH-005"),
    ("Bal Vatika 3","B","t_vada","Mr. Vada Vel","TCH-006"),
    ("Grade 1","A","t_curry","Mrs. Curry Lakshmi","TCH-007"),
    ("Grade 1","B","t_biryani","Mr. Biryani Babu","TCH-008"),
    ("Grade 2","A","t_rasam","Ms. Rasam Radha","TCH-009"),
    ("Grade 2","B","t_pongal","Mr. Pongal Pillai","TCH-010"),
    ("Grade 3","A","t_halwa","Mrs. Halwa Hema","TCH-011"),
    ("Grade 3","B","t_kulfi","Mr. Kulfi Khan","TCH-012"),
    ("Grade 4","A","t_chai","Ms. Chai Chandra","TCH-013"),
    ("Grade 4","B","t_lassi","Mr. Lassi Lal","TCH-014"),
    ("Grade 5","A","t_paratha","Mrs. Paratha Priya","TCH-015"),
    ("Grade 5","B","t_naan","Mr. Naan Nair","TCH-016"),
    ("Grade 6","A","t_pickle","Ms. Pickle Padma","TCH-017"),
    ("Grade 6","B","t_chaat","Mr. Chaat Chawla","TCH-018"),
    ("Grade 7","A","t_paneer","Mrs. Paneer Patel","TCH-019"),
    ("Grade 7","B","t_tikka","Mr. Tikka Tiwari","TCH-020"),
    ("Grade 8","A","t_roti","Ms. Roti Rani","TCH-021"),
    ("Grade 8","B","t_dal","Mr. Dal Das","TCH-022"),
    ("Grade 9","A","t_kheer","Mrs. Kheer Kaur","TCH-023"),
    ("Grade 9","B","t_gulab","Mr. Gulabjamun Gill","TCH-024"),
    ("Grade 10","A","t_jalebi","Ms. Jalebi Joshi","TCH-025"),
    ("Grade 10","B","t_raita","Mr. Raita Rao","TCH-026"),
    ("Grade 11","A","t_laddu","Mrs. Laddu Luthra","TCH-027"),
    ("Grade 11","B","t_barfi","Mr. Barfi Bhatt","TCH-028"),
    ("Grade 12","A","t_peda","Ms. Peda Pandey","TCH-029"),
    ("Grade 12","B","t_sandesh","Mr. Sandesh Sen","TCH-030"),
]

# Full-detail students for BV1-Grade3 (3 per section)
DETAILED_STUDENTS = {
    ("Bal Vatika 1","A"): [
        ("s_ladoo","Ladoo Lal","15/08/2019","M","O+","128cm","32kg",
         "42 Mithai Gali, Halwai Chowk, Delhi","9812345678","HI",
         "Meera Devi","Homemaker","12th","Rajesh Prasad","Sweet Shop Owner","B.Com",
         "1","Jalebi-4-Sister","Saffron Orange","Ladoo","Bengal Tiger","Cricket","Singing"),
        ("s_paplu","Paplu Poddar","22/03/2019","M","B+","125cm","30kg",
         "18 Golgappa Lane, Chandni Chowk, Delhi","9876543210","HI",
         "Sunita Devi","Tailor","10th","Kumar Prasad","Auto Driver","8th",
         "0","","Blue","Samosa","Parrot","Football","Drawing"),
        ("s_jalebi","Jalebi Jain","05/11/2019","F","A+","122cm","28kg",
         "7 Sugar Mill Road, Karol Bagh, Delhi","9988776655","HI",
         "Kamla Jain","Teacher","M.A.","Suresh Jain","Accountant","B.Com",
         "2","Kaju-8-Brother,Peda-2-Sister","Pink","Jalebi","Rabbit","Badminton","Dancing"),
    ],
    ("Bal Vatika 1","B"): [
        ("s_kaju","Kaju Katli","12/01/2019","F","AB+","124cm","27kg",
         "3 Dry Fruit Colony, Lajpat Nagar, Delhi","9111222333","HI",
         "Rani Katli","Nurse","B.Sc","Mohan Katli","Shopkeeper","12th",
         "1","Badam-6-Brother","Purple","Kaju Katli","Cat","Skating","Painting"),
        ("s_gulab","Gulab Jamun","30/06/2019","M","O-","130cm","33kg",
         "55 Rose Garden, Saket, Delhi","9444555666","HI",
         "Pushpa Devi","Florist","8th","Shankar Lal","Gardener","10th",
         "0","","Red","Gulab Jamun","Dog","Kho Kho","Gardening"),
        ("s_rasgulla","Rasgulla Ram","18/09/2019","M","B-","126cm","29kg",
         "12 Sweet Lane, Paharganj, Delhi","9777888999","EN",
         "Geeta Ram","Cook","5th","Balram Das","Rickshaw Puller","7th",
         "3","Chomchom-10,Sandesh-7,Mishti-3","White","Rasgulla","Cow","Kabaddi","Singing"),
    ],
    ("Bal Vatika 2","A"): [
        ("s_golgappa","Golgappa Gupta","14/04/2018","M","B+","132cm","34kg",
         "9 Chaat Corner, Connaught Place, Delhi","9000000001","HI",
         "Anita Gupta","Shopkeeper","12th","Ramesh Gupta","Chaat Vendor","10th",
         "1","Bhelpuri-5-Sister","Orange","Golgappa","Monkey","Cricket","Cooking"),
        ("s_pani","Pani Puri","25/07/2018","F","A-","128cm","30kg",
         "22 Water Works Road, Dwarka, Delhi","9000000002","HI",
         "Savita Devi","Housewife","8th","Deepak Kumar","Plumber","10th",
         "0","","Turquoise","Pani Puri","Fish","Swimming","Reading"),
        ("s_tikki","Tikki Tandon","03/12/2018","M","O+","135cm","36kg",
         "45 Aloo Marg, Rohini, Delhi","9000000003","EN",
         "Neelam Tandon","Bank Clerk","B.Com","Ravi Tandon","Manager","MBA",
         "1","Chole-3-Brother","Green","Aloo Tikki","Elephant","Hockey","Chess"),
    ],
    ("Bal Vatika 2","B"): [
        ("s_bunty","Bunty Bubble","08/02/2018","M","B+","131cm","33kg",
         "33 Bubble Gum Street, Pitampura, Delhi","9000000004","HI",
         "Renu Bubble","Housewife","10th","Vinod Bubble","Salesman","12th",
         "0","","Yellow","Chowmein","Puppy","Running","Video Games"),
        ("s_chottu","Chottu Chole","19/05/2018","M","A+","127cm","29kg",
         "11 Spice Market, Khari Baoli, Delhi","9000000005","HI",
         "Prema Devi","Spice Seller","5th","Kishan Lal","Spice Trader","8th",
         "2","Masala-7,Mirchi-4","Brown","Chole Bhature","Horse","Kabaddi","Kite Flying"),
        ("s_dolly","Dolly Dhokla","28/10/2018","F","O+","129cm","31kg",
         "67 Gujarat Nagar, Janakpuri, Delhi","9000000006","EN",
         "Hetal Dhokla","Teacher","M.Ed","Jayesh Dhokla","Engineer","B.Tech",
         "0","","Magenta","Dhokla","Peacock","Tennis","Bharatnatyam"),
    ],
    ("Bal Vatika 3","A"): [
        ("s_bablu","Bablu Biryani","11/03/2017","M","B+","138cm","37kg",
         "23 Biryani Bazaar, Old Delhi","9000000007","HI",
         "Nafisa Begum","Housewife","8th","Irfan Khan","Chef","10th",
         "1","Kebab-4-Brother","Maroon","Biryani","Camel","Football","Cooking"),
        ("s_mithai","Mithai Mehta","27/08/2017","F","A+","134cm","33kg",
         "5 Sweet Valley, GK-1, Delhi","9000000008","EN",
         "Priya Mehta","Dentist","BDS","Amit Mehta","Lawyer","LLB",
         "0","","Lavender","Barfi","Panda","Gymnastics","Piano"),
        ("s_chikki","Chikki Chawla","16/06/2017","M","O-","136cm","35kg",
         "89 Peanut Plaza, Model Town, Delhi","9000000009","HI",
         "Shanti Chawla","Tailor","10th","Gopal Chawla","Mechanic","ITI",
         "2","Gachak-9,Revdi-6","Golden","Chikki","Squirrel","Athletics","Craft"),
    ],
    ("Bal Vatika 3","B"): [
        ("s_kulfi","Kulfi Kumar","04/01/2017","M","AB-","140cm","38kg",
         "17 Ice Cream Lane, Vasant Kunj, Delhi","9000000010","HI",
         "Suman Kumar","Housewife","12th","Rajan Kumar","Ice Cream Vendor","10th",
         "1","Faluda-5-Sister","Cream","Kulfi","Penguin","Ice Skating","Drawing"),
        ("s_halwa","Halwa Hasan","20/09/2017","M","A-","133cm","34kg",
         "44 Moong Dal Road, Okhla, Delhi","9000000011","HI",
         "Fatima Hasan","Seamstress","8th","Ali Hasan","Driver","10th",
         "0","","Amber","Halwa","Lion","Wrestling","Calligraphy"),
        ("s_peda","Peda Pillai","13/11/2017","F","B+","131cm","31kg",
         "78 South Extension, Delhi","9000000012","TA",
         "Lakshmi Pillai","Software Eng","B.Tech","Venkat Pillai","Professor","PhD",
         "1","Murukku-7-Brother","Coral","Peda","Deer","Table Tennis","Coding"),
    ],
    ("Grade 1","A"): [
        ("s_pinky","Pinky Paratha","09/04/2016","F","B+","142cm","38kg",
         "32 Wheat Field Colony, Noida","9000000013","HI",
         "Asha Paratha","Housewife","12th","Dinesh Paratha","Farmer","10th",
         "1","Roti-3-Brother","Hot Pink","Paratha","Butterfly","Skipping","Origami"),
        ("s_chintu","Chintu Chai","21/07/2016","M","O+","139cm","36kg",
         "56 Tea Garden Road, Gurgaon","9000000014","EN",
         "Divya Sharma","Café Owner","B.Com","Rajiv Sharma","Tea Estate Manager","MBA",
         "0","","Teal","Chai","Cat","Carrom","Storytelling"),
        ("s_tinku","Tinku Tandoor","15/02/2016","M","A+","141cm","37kg",
         "8 Naan Nagar, Greater Noida","9000000015","HI",
         "Pooja Tandoor","Baker","10th","Sunil Tandoor","Baker","12th",
         "1","Naan-5-Sister","Orange","Tandoori Roti","Eagle","Cricket","Pottery"),
    ],
    ("Grade 1","B"): [
        ("s_mango","Mango Malhotra","17/05/2016","F","AB+","140cm","35kg",
         "21 Fruit Garden, Faridabad","9000000016","EN",
         "Rita Malhotra","Journalist","MA","Sanjay Malhotra","Editor","MA",
         "0","","Mango Yellow","Mango Shake","Parrot","Badminton","Writing"),
        ("s_nimbu","Nimbu Nair","29/08/2016","M","O-","138cm","34kg",
         "14 Citrus Colony, Noida","9000000017","EN",
         "Deepa Nair","Nurse","B.Sc","Gopan Nair","Pharmacist","B.Pharm",
         "1","Lime-2-Sister","Lime Green","Lemon Rice","Chameleon","Football","Painting"),
        ("s_papaya","Papaya Pandey","06/12/2016","F","B-","137cm","33kg",
         "39 Tropical Lane, Ghaziabad","9000000018","HI",
         "Usha Pandey","Housewife","10th","Manoj Pandey","Grocer","12th",
         "2","Kiwi-8,Litchi-4","Peach","Papaya","Rabbit","Volleyball","Gardening"),
    ],
    ("Grade 2","A"): [
        ("s_guddu","Guddu Gulabjamun","10/06/2015","M","B+","148cm","42kg",
         "65 Sweet Lane, Gurgaon","9000000019","HI",
         "Aarti Devi","Cook","8th","Bhola Nath","Sweet Maker","10th",
         "0","","Burgundy","Gulab Jamun","Bull","Wrestling","Music"),
        ("s_rinku","Rinku Rasmalai","23/01/2015","F","A+","144cm","38kg",
         "27 Dairy Road, Faridabad","9000000020","EN",
         "Meena Sinha","Teacher","B.Ed","Prakash Sinha","Dairy Farmer","12th",
         "1","Paneer-4-Brother","Ivory","Rasmalai","Cow","Basketball","Reading"),
        ("s_sonu","Sonu Samosa","18/09/2015","M","O+","146cm","40kg",
         "3 Samosa Street, Old Delhi","9000000021","HI",
         "Kanta Devi","Housewife","5th","Pappu Lal","Samosa Vendor","8th",
         "2","Kachori-7,Pakora-3","Golden Brown","Samosa","Monkey","Gilli Danda","Card Games"),
    ],
    ("Grade 2","B"): [
        ("s_munna","Munna Maggi","14/03/2015","M","B+","147cm","41kg",
         "88 Noodle Nagar, Noida","9000000022","EN",
         "Reema Maggi","Software Eng","B.Tech","Suresh Maggi","Manager","MBA",
         "0","","Neon Yellow","Maggi","Dog","Cricket","Gaming"),
        ("s_pappu","Pappu Paneer","07/11/2015","M","A-","145cm","39kg",
         "51 Dairy Colony, Gurgaon","9000000023","HI",
         "Sarla Devi","Milk Seller","8th","Ramu Paneer","Paneer Maker","10th",
         "1","Tofu-5-Sister","White","Paneer Tikka","Buffalo","Kabaddi","Carving"),
        ("s_chunnu","Chunnu Chutney","30/07/2015","F","O+","143cm","37kg",
         "19 Pickle Gali, Old Delhi","9000000024","HI",
         "Bimla Devi","Pickle Maker","5th","Hariom Lal","Spice Trader","10th",
         "0","","Pickle Green","Chutney","Goat","Kho Kho","Knitting"),
    ],
    ("Grade 3","A"): [
        ("s_bittoo","Bittoo Barfi","02/05/2014","M","AB+","152cm","44kg",
         "36 Mithai Market, Chandni Chowk, Delhi","9000000025","HI",
         "Pushpa Barfi","Housewife","10th","Laxman Barfi","Sweet Shop Owner","12th",
         "1","Peda-6-Sister","Silver","Barfi","Horse","Cricket","Magic Tricks"),
        ("s_golu","Golu Gujiya","19/08/2014","M","B-","150cm","43kg",
         "72 Festival Road, Dwarka, Delhi","9000000026","HI",
         "Annapurna Devi","Cook","8th","Shyam Sundar","Halwai","10th",
         "0","","Deep Red","Gujiya","Elephant","Football","Origami"),
        ("s_sweety","Sweety Sandesh","11/02/2014","F","A+","148cm","40kg",
         "15 Bengali Market, Delhi","9000000027","EN",
         "Mitali Sen","Professor","PhD","Arnab Sen","Writer","MA",
         "1","Mishti-4-Sister","Rose Gold","Sandesh","Swan","Swimming","Poetry"),
    ],
    ("Grade 3","B"): [
        ("s_lucky","Lucky Lassi","25/06/2014","M","O+","151cm","42kg",
         "41 Lassi Corner, Paharganj, Delhi","9000000028","HI",
         "Guddi Devi","Housewife","8th","Banwari Lal","Lassi Vendor","10th",
         "2","Chaach-8,Dahi-5","Sky Blue","Lassi","Buffalo","Kushti","Dhol"),
        ("s_bubbly","Bubbly Bhujia","08/10/2014","F","B+","149cm","41kg",
         "63 Namkeen Nagar, Bikaner House, Delhi","9000000029","HI",
         "Kiran Bhujia","Shopkeeper","12th","Omprakash Bhujia","Snack Maker","10th",
         "0","","Turmeric","Bhujia","Camel","Archery","Embroidery"),
        ("s_raju","Raju Rabri","14/12/2014","M","A-","153cm","45kg",
         "28 Cream Lane, Mayur Vihar, Delhi","9000000030","EN",
         "Lata Devi","Nurse","ANM","Mahesh Prasad","Milkman","10th",
         "1","Malai-3-Brother","Cream","Rabri","Tiger","Athletics","Sketching"),
    ],
}

# Stub students for grades 4-12 (2 per section, minimal data)
STUB_NAMES = [
    "Achaar","Bhindi","Chawal","Daal","Elaichi","Fennel","Ghee","Hing",
    "Imli","Jeera","Karela","Laung","Methi","Nimbu","Oats","Pudina",
    "Quinoa","Rajma","Saffron","Tulsi","Urad","Vanilla","Wheat","Xylo",
    "Yam","Zafran","Ajwain","Basil","Cumin","Dhaniya","Haldi","Kesar",
    "Lavang","Mace","Nutmeg","Pepper","Rye","Sesame","Thyme","Anise",
]

def seed_samosa_high(db_path):
    random.seed(42)  # Reproducible passwords
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Check if already seeded
    c.execute("SELECT count(*) FROM users")
    if c.fetchone()[0] > 0:
        print("[seed] Database already has data. Skipping.")
        conn.close()
        return

    teacher_pw_hash = hash_password("pass123")
    admin_pw_hash = hash_password("admin123")

    # ── 1. School ─────────────────────────────────────
    c.execute("""INSERT INTO schools (name,address_line1,address_line2,pincode,udise_code,board,principal_name,contact_phone,contact_email)
        VALUES (?,?,?,?,?,?,?,?,?)""",
        ("Samosa High International School",
         "42 Samosa Marg, Academic Zone",
         "Near Chutney Circle, New Delhi",
         "110001","09876543210","CBSE",
         "Dr. Rasgulla Roy","011-23456789","admin@samosahigh.edu.in"))
    school_id = c.lastrowid

    # ── 2. Superadmin ─────────────────────────────────
    c.execute("INSERT INTO users (username,password,plain_password,role) VALUES (?,?,?,?)",
              ("superadmin",admin_pw_hash,"admin123","superadmin"))
    admin_uid = c.lastrowid
    c.execute("INSERT INTO superadmins (user_id,school_id,full_name) VALUES (?,?,?)",
              (admin_uid, school_id, "Dr. Rasgulla Roy"))

    # ── 3. Teachers ───────────────────────────────────
    teacher_map = {}  # (grade,section) -> teacher_id
    class_map = {}    # (grade,section) -> class_id
    for grade, section, username, full_name, code in TEACHERS_DATA:
        c.execute("INSERT INTO users (username,password,plain_password,role) VALUES (?,?,?,?)",
                  (username, teacher_pw_hash, "pass123", "teacher"))
        t_uid = c.lastrowid
        c.execute("INSERT INTO teachers (user_id,school_id,full_name,teacher_code,account_id) VALUES (?,?,?,?,?)",
                  (t_uid, school_id, full_name, code, code))
        t_id = c.lastrowid
        c.execute("INSERT INTO classes (school_id,grade,section,teacher_id,academic_year) VALUES (?,?,?,?,?)",
                  (school_id, grade, section, t_id, "2025-26"))
        cl_id = c.lastrowid
        teacher_map[(grade,section)] = t_id
        class_map[(grade,section)] = cl_id

    # ── 4. Detailed Students ──────────────────────────
    for (grade,section), students in DETAILED_STUDENTS.items():
        cl_id = class_map.get((grade,section))
        for s in students:
            uname,name,dob,gender,bg,ht,wt,addr,phone,mt = s[0],s[1],s[2],s[3],s[4],s[5],s[6],s[7],s[8],s[9]
            m_name,m_occ,m_edu,f_name,f_occ,f_edu = s[10],s[11],s[12],s[13],s[14],s[15]
            sib_count,sib_info = s[16],s[17]
            fav_col,fav_food,fav_animal,fav_sport,fav_hobby = s[18],s[19],s[20],s[21],s[22]

            firstname = name.split()[0]
            plain_pw = gen_password(firstname)
            pw_hash = hash_password(plain_pw)

            c.execute("INSERT INTO users (username,password,plain_password,role) VALUES (?,?,?,?)",
                      (uname, pw_hash, plain_pw, "student"))
            u_id = c.lastrowid

            mt_code = {"HI":"HI","EN":"EN","TA":"TA","TE":"TE","KA":"KA"}.get(mt, mt)

            family = json.dumps({
                "motherName": m_name, "motherOccupation": m_occ, "motherEducation": m_edu,
                "fatherName": f_name, "fatherOccupation": f_occ, "fatherEducation": f_edu,
                "siblingsCount": sib_count, "siblingsAge": sib_info,
                "address1": addr, "phone": phone,
                "motherTongue": mt_code, "mediumOfInstruction": "EN",
                "ruralUrban": "U",
            })
            prefs = json.dumps({
                "colour": fav_col, "food": fav_food, "animal": fav_animal,
                "sport": fav_sport, "hobby": fav_hobby
            })

            c.execute("""INSERT INTO students
                (user_id,full_name,dob,gender,blood_group,height,weight,address,phone,
                 mother_tongue,medium_of_instruction,rural_urban,family_details,preferences)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (u_id,name,dob,gender,bg,ht,wt,addr,phone,mt_code,"EN","U",family,prefs))
            s_id = c.lastrowid

            reg = f"SHI-{grade[:2].upper()}{section}-{str(s_id).zfill(3)}"
            c.execute("""INSERT INTO student_enrollments
                (student_id,class_id,academic_year,registration_number,roll_number,points,school)
                VALUES (?,?,?,?,?,?,?)""",
                (s_id, cl_id, "2025-26", reg, str(s_id % 100), 200,
                 "Samosa High International School"))

    # ── 5. Stub Students (Grade 4-12) ─────────────────
    stub_idx = 0
    for grade_num in range(4, 13):
        grade = f"Grade {grade_num}"
        for section in ["A","B"]:
            cl_id = class_map.get((grade,section))
            if not cl_id:
                continue
            for _ in range(2):
                if stub_idx >= len(STUB_NAMES):
                    stub_idx = 0
                sname = STUB_NAMES[stub_idx]
                stub_idx += 1
                full = f"{sname} Student"
                uname = f"s_{sname.lower()}_{grade_num}{section.lower()}"
                plain_pw = gen_password(sname)
                pw_hash = hash_password(plain_pw)

                c.execute("INSERT INTO users (username,password,plain_password,role) VALUES (?,?,?,?)",
                          (uname, pw_hash, plain_pw, "student"))
                u_id = c.lastrowid
                c.execute("INSERT INTO students (user_id,full_name,gender) VALUES (?,?,?)",
                          (u_id, full, "M"))
                s_id = c.lastrowid
                reg = f"SHI-G{grade_num}{section}-{str(s_id).zfill(3)}"
                c.execute("""INSERT INTO student_enrollments
                    (student_id,class_id,academic_year,registration_number,points,school)
                    VALUES (?,?,?,?,?,?)""",
                    (s_id, cl_id, "2025-26", reg, 0, "Samosa High International School"))

    conn.commit()
    conn.close()
    count_t = len(TEACHERS_DATA)
    count_s = sum(len(v) for v in DETAILED_STUDENTS.values()) + 36  # 36 stubs
    print(f"[seed] Samosa High seeded: 1 admin, {count_t} teachers, ~{count_s} students")

if __name__ == "__main__":
    db = os.path.join(os.path.dirname(__file__), "database.sqlite")
    seed_samosa_high(db)
