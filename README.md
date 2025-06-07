# Student Management System

## Project Overview
A full-stack web application for managing student records and grades, built with Node.js and React.

## Features Implemented
- Student Management (CRUD operations)
- Grade Management per student
- Subject tracking
- Grade calculations (Activities, Quizzes, Exams)
- Export grades to CSV
- Real-time grade calculations
- Search functionality
- Data validation

## Technologies Used
- Backend:
  - Node.js with Express
  - SQLite database
  - RESTful API
- Frontend:
  - React
  - Bootstrap 5
  - Axios
  - Font Awesome

## Setup Instructions
1. Backend Setup:
```bash
cd backend
npm install
npm run dev
```

2. Frontend Setup:
```bash
cd frontend
npm install
npm start
```

3. Access the application at http://localhost:3000

## Deployment Instructions

### Quick GitHub Setup
1. Create new repository at github.com/new

2. Run these commands in your project folder:
```bash
# Initialize repository
echo "# student-management-system" >> README.md
git init

# Add all files
git add .

# Make first commit
git commit -m "first commit"

# Set main branch and add remote
git branch -M main
git remote add origin https://github.com/RobinSaldo179/student-management-system.git
git push -u origin main
```

Note: Replace RobinSaldo179 with your GitHub username if different.

### Environment Setup
1. Create .env file in backend:
```
PORT=5000
DB_PATH=./students.db
```

2. Create .gitignore file:
```
# Dependencies
node_modules/
.env

# Database
*.db

# Build files
build/
dist/
```

### Deployment Steps
1. Backend (render.com):
   - Connect GitHub repository
   - Select main branch
   - Build command: `npm install`
   - Start command: `npm start`
   - Add environment variables

2. Frontend (netlify.com):
   - Connect GitHub repository
   - Build command: `npm run build`
   - Publish directory: `build`
   - Add environment variable: 
     REACT_APP_API_URL=https://your-backend-url.render.com

## Screenshots
N/a

## Partner Contributions
wala
