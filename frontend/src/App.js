import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from 'axios';

const API_URL = 'https://student-management-backend-2kxs.onrender.com'; // Copy your Render URL here

function App() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('students'); // 'students' or 'dashboard'
  const [editingGrade, setEditingGrade] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // New state for search

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // Hide any previous error
      setError(null);
      document.getElementById('app-error').style.display = 'none';
      
      // Show loading
      setLoading(true);
      document.getElementById('loading').style.display = 'flex';

      // Test backend connection
      await axios.get(`${API_URL}`);
      
      // Fetch students
      const response = await axios.get(`${API_URL}/api/students`);
      console.log('Students data:', response.data);
      setStudents(response.data);
      
      // Hide loading
      document.getElementById('loading').style.display = 'none';
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
      document.getElementById('app-error').style.display = 'block';
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    
    setLoading(true);
    try {
      const formData = {
        name,
        email
      };
      await axios.post(`${API_URL}/api/students`, formData);
      fetchStudents();
      e.target.reset();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const fetchGrades = async (studentId) => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      console.log('Fetching grades for student:', studentId);
      const response = await axios.get(`${API_URL}/api/grades/${studentId}`);
      console.log('Grades received:', response.data);
      setGrades(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError('Unable to fetch grades. Please try again.');
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const addGrade = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      setError('Please select a student first');
      return;
    }

    setLoading(true);
    try {
      const gradeData = {
        student_id: selectedStudent,
        subject: e.target.subject.value,
        activity_score: Number(e.target.activity.value),
        quiz_score: Number(e.target.quiz.value),
        exam_score: Number(e.target.exam.value)
      };
      
      console.log('Sending grade data:', gradeData);
      const response = await axios.post(`${API_URL}/api/grades`, gradeData);
      console.log('Grade added:', response.data);
      
      await fetchGrades(selectedStudent);
      e.target.reset();
      setError(null);
    } catch (err) {
      console.error('Error adding grade:', err);
      setError(err.response?.data?.error || 'Failed to add grade');
    } finally {
      setLoading(false);
    }
  };

  const updateGrade = async (e) => {
    e.preventDefault();
    if (!editingGrade || !selectedStudent) return;

    try {
      setLoading(true);
      const updatedGrade = {
        subject: e.target.subject.value.trim(),
        activity_score: Number(e.target.activity.value),
        quiz_score: Number(e.target.quiz.value),
        exam_score: Number(e.target.exam.value)
      };

      await axios.put(`${API_URL}/api/grades/${editingGrade.id}`, updatedGrade);
      await fetchGrades(selectedStudent); // Refresh grades
      setEditingGrade(null); // Clear edit form
      setError(null);
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update grade');
    } finally {
      setLoading(false);
    }
  };

  const deleteGrade = async (gradeId) => {
    try {
      if (!window.confirm('Are you sure you want to delete this grade?')) {
        return;
      }

      setLoading(true);
      setError(null);

      await axios.delete(`${API_URL}/api/grades/${gradeId}`);
      
      // Refresh the grades list immediately
      if (selectedStudent) {
        await fetchGrades(selectedStudent);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete grade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverage = (grades) => {
    if (!grades.length) return 0;
    return grades.reduce((acc, grade) => 
      acc + (grade.activity_score + grade.quiz_score + grade.exam_score) / 3, 0
    ) / grades.length;
  };

  const handleExportGrades = async () => {
    if (!selectedStudent) {
      setError('Please select a student first');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/export/grades/${selectedStudent}`, {
        responseType: 'blob'
      });

      // Create download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `grades_${selectedStudent}.csv`;

      // Trigger download
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setError(null);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export grades');
    } finally {
      setLoading(false);
    }
  };

  const filteredGrades = grades.filter(grade =>
    grade.subject.toLowerCase().includes(subjectFilter.toLowerCase())
  );

  // New filtered students function
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid">
      <nav className="navbar navbar-dark bg-dark shadow mb-4">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">
            <i className="fas fa-graduation-cap me-2"></i>
            Student Management System
          </span>
          <div className="d-flex">
            <button 
              className={`btn ${view === 'students' ? 'btn-light' : 'btn-outline-light'} me-2`}
              onClick={() => setView('students')}
            >
              <i className="fas fa-users me-2"></i>Students
            </button>
            <button 
              className={`btn ${view === 'dashboard' ? 'btn-light' : 'btn-outline-light'}`}
              onClick={() => setView('dashboard')}
            >
              <i className="fas fa-chart-line me-2"></i>Dashboard
            </button>
          </div>
        </div>
      </nav>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>{error}
        </div>
      )}

      {view === 'dashboard' ? (
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-users me-2"></i>Total Students
                  </h5>
                  <p className="card-text display-4">{students.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-chart-bar me-2"></i>Average Grade
                  </h5>
                  <p className="card-text display-4">{calculateAverage(grades).toFixed(2)}%</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-book me-2"></i>Total Subjects
                  </h5>
                  <p className="card-text display-4">
                    {new Set(grades.map(g => g.subject)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container">
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Add New Student</h5>
                  <form onSubmit={addStudent}>
                    <div className="mb-3">
                      <input 
                        type="text" 
                        className="form-control" 
                        name="name" 
                        placeholder="Student Name"
                        required 
                      />
                    </div>
                    <div className="mb-3">
                      <input 
                        type="email" 
                        className="form-control" 
                        name="email" 
                        placeholder="Email"
                        required 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                      <i className="fas fa-plus me-2"></i>Add Student
                    </button>
                  </form>
                </div>
              </div>
              
              <div className="card mt-4">
                <div className="card-body">
                  <h5 className="card-title">Student List</h5>
                  {/* Search input for students */}
                  <input
                    type="search"
                    className="form-control mb-3"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="list-group">
                    {filteredStudents.map(student => (
                      <button
                        key={student.id}
                        className={`list-group-item list-group-item-action ${selectedStudent === student.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedStudent(student.id);
                          fetchGrades(student.id);
                        }}
                      >
                        <i className="fas fa-user me-2"></i>
                        <strong>{student.name}</strong>
                        <br />
                        <small>{student.email}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-8">
              {selectedStudent && (
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title">Grade Management</h5>
                      {grades.length > 0 && (
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={handleExportGrades}
                          disabled={loading}
                        >
                          <i className="fas fa-download me-2"></i>
                          {loading ? 'Exporting...' : 'Export Grades'}
                        </button>
                      )}
                    </div>
                    
                    <form onSubmit={addGrade} className="mb-4">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <input 
                            type="text" 
                            className="form-control" 
                            name="subject" 
                            placeholder="Subject"
                            required 
                          />
                        </div>
                        <div className="col-md-6">
                          <input 
                            type="number" 
                            className="form-control" 
                            name="activity" 
                            placeholder="Activity Score"
                            required 
                          />
                        </div>
                        <div className="col-md-6">
                          <input 
                            type="number" 
                            className="form-control" 
                            name="quiz" 
                            placeholder="Quiz Score"
                            required 
                          />
                        </div>
                        <div className="col-md-6">
                          <input 
                            type="number" 
                            className="form-control" 
                            name="exam" 
                            placeholder="Exam Score"
                            required 
                          />
                        </div>
                        <div className="col-12">
                          <button type="submit" className="btn btn-success w-100">
                            <i className="fas fa-plus-circle me-2"></i>Add Grade
                          </button>
                        </div>
                      </div>
                    </form>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6>Grade History</h6>
                      <input
                        type="text"
                        className="form-control form-control-sm w-auto"
                        placeholder="Filter by subject..."
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                      />
                    </div>
                    
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Activity</th>
                            <th>Quiz</th>
                            <th>Exam</th>
                            <th>Average</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredGrades.map(grade => (
                            <tr key={grade.id}>
                              <td>{grade.subject}</td>
                              <td>{grade.activity_score}%</td>
                              <td>{grade.quiz_score}%</td>
                              <td>{grade.exam_score}%</td>
                              <td>
                                {((grade.activity_score + grade.quiz_score + grade.exam_score) / 3).toFixed(2)}%
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-primary me-2"
                                  onClick={() => setEditingGrade(grade)}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteGrade(grade.id)}
                                  disabled={loading}
                                  title="Delete grade"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {editingGrade && (
                      <div className="mt-4">
                        <h6>Edit Grade</h6>
                        <form onSubmit={updateGrade}>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <input 
                                type="text" 
                                className="form-control" 
                                name="subject" 
                                placeholder="Subject"
                                defaultValue={editingGrade.subject}
                                required 
                              />
                            </div>
                            <div className="col-md-6">
                              <input 
                                type="number" 
                                className="form-control" 
                                name="activity" 
                                placeholder="Activity Score"
                                defaultValue={editingGrade.activity_score}
                                required 
                              />
                            </div>
                            <div className="col-md-6">
                              <input 
                                type="number" 
                                className="form-control" 
                                name="quiz" 
                                placeholder="Quiz Score"
                                defaultValue={editingGrade.quiz_score}
                                required 
                              />
                            </div>
                            <div className="col-md-6">
                              <input 
                                type="number" 
                                className="form-control" 
                                name="exam" 
                                placeholder="Exam Score"
                                defaultValue={editingGrade.exam_score}
                                required 
                              />
                            </div>
                            <div className="col-12">
                              <button type="submit" className="btn btn-warning w-100">
                                <i className="fas fa-save me-2"></i>Update Grade
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000}}>
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
