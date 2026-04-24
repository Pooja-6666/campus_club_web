# campus_club_web
Backend API for a Campus Events Management System featuring authentication, role-based access (Student, Organizer, Faculty), event approval workflow, and bookmarking using Node.js, Express, Prisma, and PostgreSQL.




# 🎓 Campus Events Backend System

A backend API for managing campus events with role-based access (Student, Organizer, Faculty). Built using Node.js, Express, Prisma, and PostgreSQL.

---

## 🚀 Features

- 🔐 JWT Authentication
- 👨‍🎓 Student: view & bookmark events
- 👨‍💼 Organizer: create events
- 👩‍🏫 Faculty: approve/reject events
- 🏫 Club-based event system
- 📅 Event workflow (PENDING → APPROVED/REJECTED)
- ⭐ Bookmark system
- 📢 Event promotion support

---

## 🛠️ Tech Stack

Node.js, Express, Prisma ORM, PostgreSQL, JWT, bcrypt

---

## 📁 Setup Instructions

### 1. Clone Repository  
git clone https://github.com/YOUR_USERNAME/campus_club_web.git  
cd campus_club_web  

### 2. Install Dependencies  
npm install  

### 3. Create Environment File (.env)  
DATABASE_URL="your_postgresql_url"  
JWT_SECRET="secret123"  

### 4. Run Database Migrations  
npx prisma migrate dev  

### 5. Start Server  
node server.js  

Server runs on:  
http://localhost:3000  

---

## 🌐 Deployment

Backend deployed on Render:  
https://your-backend-url.onrender.com  

---

## 🔐 Authentication

Send JWT token in headers:  
Authorization: <token>

---

## 👤 Roles

Student → view & bookmark events  
Organizer → create events  
Faculty → approve/reject events  

---

## 📌 API Endpoints

### Student
POST /student/signup  
POST /student/login  
GET /profile  

### Organizer
POST /organizer/signup  
POST /organizer/login  
POST /events  

### Faculty
POST /faculty/signup  
POST /faculty/login  
GET /events/pending  
PUT /events/:id/approve  
PUT /events/:id/reject  

### Events
GET /events  

### Bookmark
POST /bookmark  

### Clubs
GET /clubs  
POST /clubs  

---

## 🧪 Test Users

Student: pooja2@test.com / 1234  
Organizer: org@test.com / 1234  
Faculty: faculty@test.com / 1234  

---

## 🚀 Future Improvements

- React frontend integration  
- Notifications system  
- Event recommendation engine  
- Admin dashboard  

---

## 👨‍💻 Author

Campus Events Management System Backend
```

---

\
