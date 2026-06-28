🎓 HPC Tracker: The Ultimate Glow-Up 💎

This full-stack app is built for school administrators, teachers, and students to track, manage, and generate Holistic Progress Cards (HPC) without losing their minds in paperwork. (Skip to the bottom of readme for a more professional explanation, in case you dont understand)

🎨 The Vibe Check (UI/UX Design)

We refused to build another mid, crusty school portal from 2008. The UI/UX is designed to look clean, aesthetic, and premium, fr. Here's how we did it:

Delhi-Fog Background: We used a blurred-out silver-gold background gradient that looks like a foggy winter morning, but fancy. It gives the app that premium glassmorphism finish.
Thanos's Gems: Rectangles are a crime against design, so the interactive boxes are literally gem-shaped. Gemstones (like Sapphire blue, Moonstone steel, and Ruby red) are used as highlights to draw focus to important badges and metrics.
Light & Dark Modes: High-contrast white (Light Mode) for when you need to pretend you're awake at 8 AM, and deep matte black (Dark Mode) for when you're coding at 3 AM listening to lofi beats.
📈 Why HPC Card Gen? (NCERT Compliance)
So basically, NCERT wants every kid to have a Holistic Progress Card (HPC). But writing detailed reports for 40+ kids by hand is a major L and a speedrun to carpal tunnel.

We automated the whole thing:

Teachers fill it in: Teachers navigate the slick UI to log cognitive, social, and aesthetic milestones.
One-click PDFs: FastAPI and Puppeteer cook up a pristine, 100% NCERT-compliant PDF report card ready to print or share.


🗺️ The Tour Guide (App Flow & Pages)

Here is where all the files are hanging out and what they actually do:

index.jsx (The Entrance Gate)
The login screen where you choose to be a Student, Teacher, or Superadmin. Features sound effects (because clicking buttons in absolute silence is lowkey sus) and a theme toggle.
StudentHomepage.jsx (The Flex Zone)
Where students/parents log in to see their points balance, view their reports, and check out unlocked gem badges. Excellent for showing off to your family that you aren't just sleeping in class.
Teacher.jsx (Teacher Dashboard)
The homepage for educators to view their assigned classes and see their student rosters.
TeacherTracking.jsx (The Grading Command Center)
Where teachers select a student and evaluate their progress. This is the launchpad for all the rating scales.
Assessment Subsections (part_a1 to part_c_s1 directories)
The actual forms where teachers fill out evaluation details (cognitive, socio-emotional, aesthetic development). It's a lot of questions, but our clean inputs make it feel like a breeze instead of homework.
superadmin/ (The Big Boss Suite)
Admin dashboard where the school principal or admins manage teachers, classes, and configure school metadata.
🛠️ The Tech Stack (What we cookin' with)
Frontend: React Native + Expo Router (file-based routing is a major W).
Backend: Python FastAPI (serving endpoints faster than you can write a WhatsApp status).
Database: SQLite (keeps all profiles, passwords, and points safe and sound).
PDF Engine: Puppeteer & Pyppeteer (converting HTML/CSS templates into beautiful PDFs).


🚀 How to Run
Install JS stuff:
bash


npm install
Fire up Python:
bash


cd Backend
python -m venv .venv
# Windows:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
cd ..
Seed the database (get the cool students like Ladoo Lal in there):
bash


python Backend/seed.py
python Backend/inject_demo_data.py
Run everything concurrently:
bash


npm run dev
(This starts the frontend and python backend together using a single terminal tab. Magic.)
(https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.


# 🎓 HPC Tracker: The Ultimate Glow-Up 💎

This full-stack app is built for school administrators, teachers, and students to track, manage, and generate Holistic Progress Cards (HPC) without losing their minds in paperwork.

---

## 👔 Professional Architecture Summary (For Reviewers & Devs)

**Project Overview:** 
An open-source, localized institutional ERP platform engineered to streamline multi-tier data entry and automate the generation of **NCERT / NEP 2020 compliant Holistic Progress Cards (HPC)** for Indian schools. 

**Core Engineering Implementations:**
- **Local Split-Database Modeling:** Designed using an isolated database approach (`SQLite`) to securely separate long-term student identity structures from seasonal/academic evaluation timelines.
- **Dynamic On-Demand PDF Pipeline:** Implements an asynchronous headless compiler pipeline (**Python FastAPI + Puppeteer**) that generates production-grade, print-ready A4 PDF layouts on the fly from dynamic HTML/CSS templates, minimizing physical storage footprint.
- **Role-Based Access Control (RBAC):** Three distinct authentication routing tiers restricting read/write scopes dynamically based on user identity (Student, Teacher, and Superadmin/Principal).

---
