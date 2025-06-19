import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HiredStudents = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8080/admin/hired-students')
      .then(res => setStudents(res.data))
      .catch(err => console.error("Failed to load hired students", err));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Hired Students</h2>
      <div className="overflow-x-auto rounded-lg shadow border">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">College</th>
              <th className="p-3 text-left">Course</th>
              <th className="p-3 text-left">Hired By</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td className="p-4 text-center text-gray-500" colSpan="6">No hired students</td></tr>
            ) : (
              students.map((s, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">{s.college}</td>
                  <td className="p-3">{s.course}</td>
                  <td className="p-3">{s.companyName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HiredStudents;
