# ⚡ UniPulse (Campus Event & Club Management Platform)

> A high-performance, professional-grade full-stack campus event platform featuring AI-driven OCR poster automation, decoupled microservices, role-based access control, and a polished responsive UI.

---

## 🌟 Key Features

* **🤖 AI-Powered Poster OCR Ingestion:** Organizers can upload promotional event posters. An isolated Python/FastAPI microservice leverages OCR (`EasyOCR`) to automatically extract metadata like titles, dates, and venues.
* **🛡️ Role-Based Access Control (RBAC):** Secure authentication workflows separating **Students**, **Club Organizers**, and **Faculty** with dedicated approval dashboards.
* **📅 Interactive Student Feed & Bookmarks:** Responsive 3-column event grid with instant bookmarking, detailed event modal views, club attribution, and contact details.
* **🔌 Decoupled Microservices Architecture:** Modern separation of concerns utilizing a React frontend, a Node.js/Prisma core backend, and a Python/FastAPI AI service.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, Custom CSS Grid & Flexbox
* **Core Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL / SQLite, JWT, bcrypt
* **AI / ML Microservice:** Python, FastAPI, EasyOCR / Computer Vision
* **Version Control & Workflow:** Git & GitHub (Feature branch workflow with PR merges)

---

## 📁 Setup Instructions

### 1. Clone the Repository
```bash
git clone [https://github.com/Pooja-6666/campus_club_web.git](https://github.com/Pooja-6666/campus_club_web.git)
cd campus_club_web
