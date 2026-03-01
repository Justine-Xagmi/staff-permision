# 🏫 Staff Permission System

A full-stack web application for managing staff permission/leave requests in a college setting.

## 📁 Project Structure

```
StaffPermissionSystem/
├── backend/
│   ├── config/
│   │   ├── db.js              # MySQL database connection
│   │   └── database.sql       # SQL setup script
│   ├── controllers/
│   │   ├── authController.js  # Register, Login, Profile
│   │   └── permissionController.js  # Full CRUD + review logic
│   ├── middleware/
│   │   └── auth.js            # JWT verification + role guard
│   ├── routes/
│   │   ├── auth.js            # /api/auth/*
│   │   └── permissions.js     # /api/permissions/*
│   ├── server.js              # Express entry point
│   ├── package.json
│   └── .env                   # Environment variables
└── frontend/
    ├── index.html             # Login / Register page
    ├── pages/
    │   ├── staff-dashboard.html
    │   ├── hod-dashboard.html
    │   └── hoc-dashboard.html
    ├── css/
    │   └── style.css
    └── js/
        ├── api.js             # Shared API utilities
        ├── auth.js            # Login/register logic
        ├── staff.js
        ├── hod.js
        └── hoc.js
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14+)
- MySQL Server

### Step 1: Database Setup
1. Open MySQL Workbench or terminal
2. Run the file: `backend/config/database.sql`
3. This creates the database, tables, and default admin accounts

### Step 2: Configure Environment
1. Open `backend/.env`
2. Update with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=staff_permission_db
JWT_SECRET=change_this_to_a_long_random_string
PORT=5000
```

### Step 3: Install Dependencies
Open terminal in VS Code, navigate to backend folder:
```bash
cd backend
npm install
```

### Step 4: Start the Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

### Step 5: Open the Application
Visit: **http://localhost:5000**

---

## 👥 User Accounts

### Default Admin Accounts (pre-created):
| Role | Email | Password |
|------|-------|----------|
| Head of Department | hod@college.edu | password |
| Head of College | hoc@college.edu | password |

### Staff Accounts:
Staff members **register themselves** via the Register form.

---

## 🔄 Workflow

1. **Staff** registers and logs in
2. **Staff** submits a permission request (type, dates, reason)
3. **Head of Department** reviews → Approve (forward to HOC) or Reject
4. **Head of College** gives final decision → Approve or Reject
5. **Staff** can see real-time status with HOD + HOC progress steps

---

## 🛠️ Technologies Used

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT (JSON Web Tokens) |
| Security | bcryptjs (password hashing) |

---

## 📋 API Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register staff |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/profile | Any | Get profile |
| POST | /api/permissions | Staff | Submit request |
| GET | /api/permissions/my | Staff | My requests |
| PUT | /api/permissions/:id | Staff | Edit request |
| DELETE | /api/permissions/:id | Staff | Delete request |
| GET | /api/permissions/hod/all | HOD | All requests |
| PUT | /api/permissions/hod/review/:id | HOD | HOD review |
| GET | /api/permissions/hoc/all | HOC | HOD-approved list |
| PUT | /api/permissions/hoc/review/:id | HOC | Final review |
