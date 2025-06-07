const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('students.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
    // Create tables
    db.serialize(() => {
      // Create students table
      db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL
      )`, (err) => {
        if (err) {
          console.error('Table creation error:', err);
        } else {
          console.log('Tables created successfully');
          // Insert test data if table is empty
          db.get('SELECT COUNT(*) as count FROM students', [], (err, row) => {
            if (row.count === 0) {
              db.run(`INSERT INTO students (name, email) VALUES (?, ?)`, 
                ['Test Student', 'test@example.com']);
            }
          });
        }
      });
      // Create grades table
      db.run(`CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        subject TEXT,
        activity_score INTEGER,
        quiz_score INTEGER,
        exam_score INTEGER,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
      )`);
    });
  }
});

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Server is running', status: 'OK' });
});

// Get all students with error handling
app.get('/api/students', (req, res) => {
  console.log('Fetching students...');
  db.all('SELECT * FROM students', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    console.log('Found students:', rows);
    res.json(rows || []);
  });
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
  db.run('DELETE FROM students WHERE id = ?', req.params.id, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Student deleted' });
  });
});

// Update student
app.put('/api/students/:id', (req, res) => {
  const { name, email } = req.body;
  db.run('UPDATE students SET name = ?, email = ? WHERE id = ?',
    [name, email, req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Student updated' });
    });
});

// Add student
app.post('/api/students', (req, res) => {
  const { name, email } = req.body;
  db.run('INSERT INTO students (name, email) VALUES (?, ?)',
    [name, email],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, email });
    }
  );
});

// Get grades endpoint with better error handling
app.get('/api/grades/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  console.log('Fetching grades for student:', studentId);

  db.all(
    `SELECT g.*, s.name as student_name 
     FROM grades g 
     JOIN students s ON g.student_id = s.id 
     WHERE g.student_id = ?`,
    [studentId],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch grades' });
      }
      console.log('Found grades:', rows);
      res.json(rows || []);
    }
  );
});

// Add grade endpoint with validation
app.post('/api/grades', (req, res) => {
  const { student_id, subject, activity_score, quiz_score, exam_score } = req.body;
  console.log('Adding grade:', req.body);

  // Validate scores
  if (activity_score < 0 || activity_score > 100 ||
      quiz_score < 0 || quiz_score > 100 ||
      exam_score < 0 || exam_score > 100) {
    return res.status(400).json({ error: 'Scores must be between 0 and 100' });
  }

  db.run(
    'INSERT INTO grades (student_id, subject, activity_score, quiz_score, exam_score) VALUES (?, ?, ?, ?, ?)',
    [student_id, subject, activity_score, quiz_score, exam_score],
    function(err) {
      if (err) {
        console.error('Error adding grade:', err);
        return res.status(500).json({ error: 'Failed to add grade' });
      }
      res.json({
        id: this.lastID,
        student_id,
        subject,
        activity_score,
        quiz_score,
        exam_score
      });
    }
  );
});

// Add input validation middleware
const validateStudent = (req, res, next) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  next();
};

// Replace existing export endpoint with this simplified version
app.get('/api/export/grades/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  
  db.all(`
    SELECT 
      s.name as student_name,
      g.subject,
      g.activity_score,
      g.quiz_score,
      g.exam_score
    FROM grades g
    JOIN students s ON g.student_id = s.id
    WHERE g.student_id = ?
  `, [studentId], (err, grades) => {
    if (err) {
      console.error('Export error:', err);
      return res.status(500).json({ error: 'Failed to export grades' });
    }

    if (!grades || grades.length === 0) {
      return res.status(404).json({ error: 'No grades found' });
    }

    const csvHeader = ['Student', 'Subject', 'Activity Score', 'Quiz Score', 'Exam Score', 'Average'].join(',');
    const csvRows = grades.map(g => {
      const avg = ((g.activity_score + g.quiz_score + g.exam_score) / 3).toFixed(2);
      return `${g.student_name},${g.subject},${g.activity_score},${g.quiz_score},${g.exam_score},${avg}`;
    });

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=student_${studentId}_grades.csv`,
      'Cache-Control': 'no-cache'
    });
    res.send([csvHeader, ...csvRows].join('\n'));
  });
});

// Update the PUT endpoint for grades
app.put('/api/grades/:id', (req, res) => {
  const { subject, activity_score, quiz_score, exam_score } = req.body;
  const gradeId = req.params.id;

  // Validate input
  if (!subject || !activity_score || !quiz_score || !exam_score) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate scores
  if (activity_score < 0 || activity_score > 100 ||
      quiz_score < 0 || quiz_score > 100 ||
      exam_score < 0 || exam_score > 100) {
    return res.status(400).json({ error: 'Scores must be between 0 and 100' });
  }

  db.run(
    'UPDATE grades SET subject = ?, activity_score = ?, quiz_score = ?, exam_score = ? WHERE id = ?',
    [subject, activity_score, quiz_score, exam_score, gradeId],
    function(err) {
      if (err) {
        console.error('Update error:', err);
        return res.status(500).json({ error: 'Failed to update grade' });
      }
      res.json({ 
        id: gradeId,
        subject,
        activity_score,
        quiz_score,
        exam_score,
        message: 'Grade updated successfully' 
      });
    }
  );
});

// Update delete grade endpoint with transaction
app.delete('/api/grades/:id', async (req, res) => {
  const gradeId = req.params.id;
  console.log('Attempting to delete grade:', gradeId);

  try {
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM grades WHERE id = ?', [gradeId], function(err) {
        if (err) reject(err);
        if (this.changes === 0) reject(new Error('Grade not found'));
        resolve();
      });
    });
    
    console.log('Grade deleted successfully');
    res.json({ success: true, message: 'Grade deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(err.message === 'Grade not found' ? 404 : 500)
       .json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop the server');
});
