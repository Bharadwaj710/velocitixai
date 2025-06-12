import { useEffect, useState } from 'react';
import { fetchStudents } from '../../services/api';

const Student = () => {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchStudents();
        console.log('Students:', data); // 🔍 Debug log
        setStudents(data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    load();
  }, []);

  const filtered = students.filter(std =>
    std.name?.toLowerCase().includes(filter.toLowerCase()) ||
    std.college?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Student Details</h2>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search by name or college"
        className="border p-2 mb-4 w-full md:w-1/3"
      />
      <table className="w-full border text-left">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Course</th>
            <th className="p-2">College</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="4" className="text-center text-gray-400 p-4">No students found</td></tr>
          ) : (
            filtered.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.email}</td>
                <td className="p-2">{s.course || 'Not Updated'}</td>
                <td className="p-2">{s.college || 'Not Updated'}</td>
                <td className="p-2">
                  <button onClick={() => setSelectedStudent(s)} className="text-blue-600">View More</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-md relative">
            <button onClick={() => setSelectedStudent(null)} className="absolute top-2 right-4">&times;</button>
            <h3 className="text-lg font-semibold mb-3">Student Info</h3>
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
      )}
    </div>
  );
};

export default Student;
