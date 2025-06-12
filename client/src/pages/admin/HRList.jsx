import { useEffect, useState } from 'react';
import { fetchHRs } from '../../services/api';

const HRList = () => {
  const [hrs, setHRs] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedHR, setSelectedHR] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchHRs();
        setHRs(data);
      } catch (err) {
        console.error("Failed to fetch HRs:", err);
      }
    };
    load();
  }, []);

  const filtered = hrs.filter(hr =>
    hr.name?.toLowerCase().includes(filter.toLowerCase()) ||
    hr.email?.toLowerCase().includes(filter.toLowerCase()) ||
    hr.company?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Active HRs</h2>

      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search HRs..."
        className="border p-2 mb-4 w-full sm:w-1/3"
      />

      <table className="w-full border text-left">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Company</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan="4" className="text-center p-4 text-gray-400">No HRs found</td></tr>
          ) : (
            filtered.map((hr) => (
              <tr key={hr._id} className="border-t">
                <td className="p-2">{hr.name}</td>
                <td className="p-2">{hr.email}</td>
                <td className="p-2">{hr.company || 'Not updated'}</td>
                <td className="p-2">
                  <button onClick={() => setSelectedHR(hr)} className="text-blue-600">View More</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedHR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-md relative">
            <button onClick={() => setSelectedHR(null)} className="absolute top-2 right-4">&times;</button>
            <h3 className="text-lg font-semibold mb-3">HR Info</h3>
            <p><strong>Name:</strong> {selectedHR.name}</p>
            <p><strong>Email:</strong> {selectedHR.email}</p>
            <p><strong>Company:</strong> {selectedHR.company || 'Not updated'}</p>
            <p><strong>Phone:</strong> {selectedHR.phoneNumber || 'Not provided'}</p>
            <p><strong>Designation:</strong> {selectedHR.designation || 'Not updated'}</p>
            <p><strong>Experience:</strong> {selectedHR.experience || 'Not updated'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRList;
