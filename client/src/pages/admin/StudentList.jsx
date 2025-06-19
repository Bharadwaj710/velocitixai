import { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchStudents } from '../../services/api';

const Student = () => {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filters, setFilters] = useState({ courses: [], colleges: [] });
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const studentRes = await fetchStudents();
        setStudents(studentRes.data);

        const filterRes = await axios.get('/admin/students/filters');
        setFilters(filterRes.data);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    load();
  }, []);

  const filtered = students.filter(std =>
    (std.name?.toLowerCase().includes(filter.toLowerCase()) ||
      std.college?.toLowerCase().includes(filter.toLowerCase())) &&
    (!selectedCourse || std.courseId?.toString() === selectedCourse) &&
    (!selectedCollege || std.college === selectedCollege)
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Student Details</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by name or college"
          className="border p-2 rounded w-full md:w-1/3"
        />
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="border p-2 rounded">
          <option value="">All Courses</option>
          {filters.courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
        <select value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value)} className="border p-2 rounded">
          <option value="">All Colleges</option>
          {filters.colleges.map((c, i) => <option key={i} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-sm border">
        <table className="min-w-full table-auto text-sm text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium">Email</th>
              <th className="p-3 text-left font-medium">Course</th>
              <th className="p-3 text-left font-medium">Scorecard</th>
              <th className="p-3 text-left font-medium">Student Info</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-gray-400 p-4">No students found</td>
              </tr>
            ) : (
              filtered.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 border-t">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">{s.course || 'Not updated'}</td>
                  <td className="p-3">{s.scorecard || 'Not updated'}</td>
                  <td className="p-3">
                    <button onClick={() => setSelectedStudent(s)} className="text-blue-600 hover:underline">View More</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg relative shadow-xl border">
            <button onClick={() => setSelectedStudent(null)} className="absolute top-3 right-5 text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            <h3 className="text-xl font-semibold mb-4">Student Info</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {selectedStudent.name}</p>
              <p><strong>Email:</strong> {selectedStudent.email}</p>
              <p><strong>Course:</strong> {selectedStudent.course || 'Not updated'}</p>
              <p><strong>Branch:</strong> {selectedStudent.branch || 'Not updated'}</p>
              <p><strong>Year:</strong> {selectedStudent.yearOfStudy || 'Not updated'}</p>
              <p><strong>College:</strong> {selectedStudent.college || 'Not updated'}</p>
              <p><strong>Phone:</strong> {selectedStudent.phoneNumber || 'Not provided'}</p>
              <p><strong>Skills:</strong> {selectedStudent.skills?.join(', ') || 'Not added'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Student;
