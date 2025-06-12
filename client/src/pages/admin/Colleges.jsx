import { useEffect, useState } from 'react';
import { fetchColleges } from '../../services/api';

const Colleges = () => {
  const [colleges, setColleges] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchColleges();
        setColleges(data);
      } catch (err) {
        console.error("Failed to fetch colleges", err);
      }
    };
    load();
  }, []);

  const filtered = colleges.filter(clg =>
    clg.name?.toLowerCase().includes(filter.toLowerCase()) ||
    clg.email?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Partner Colleges</h2>

      <input
        type="text"
        placeholder="Search by college name or email"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="border p-2 mb-4 w-full md:w-1/3"
      />

      <table className="w-full text-left border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="4" className="text-center text-gray-400 p-4">No colleges found</td></tr>
          ) : (
            filtered.map((clg) => (
              <tr key={clg._id} className="border-t">
                <td className="p-2">{clg.name}</td>
                <td className="p-2">{clg.email}</td>
                <td className="p-2 capitalize">{clg.status || 'Not updated'}</td>
                <td className="p-2">
                  <button onClick={() => setSelectedCollege(clg)} className="text-blue-600">View More</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* View More Modal */}
      {selectedCollege && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-md relative">
            <button onClick={() => setSelectedCollege(null)} className="absolute top-2 right-4">&times;</button>
            <h3 className="text-lg font-semibold mb-3">College Info</h3>
            <p><strong>Name:</strong> {selectedCollege.name}</p>
            <p><strong>Email:</strong> {selectedCollege.email}</p>
            <p><strong>Status:</strong> {selectedCollege.status}</p>
            <p><strong>Established:</strong> {selectedCollege.establishedYear || 'N/A'}</p>
            <p><strong>Accreditation:</strong> {selectedCollege.accreditation || 'N/A'}</p>
            <p><strong>Courses:</strong></p>
            <ul className="list-disc list-inside ml-4 text-sm text-gray-700">
              {selectedCollege.courses?.map((c, i) => (
                <li key={i}>{c.name} ({c.type}, {c.duration} yrs)</li>
              )) || <li>No courses listed</li>}
            </ul>
            <p><strong>Contact:</strong> {selectedCollege.contact?.email || 'N/A'}, {selectedCollege.contact?.phone || ''}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Colleges;
