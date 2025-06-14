import { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchHRs } from '../../services/api';

const HRList = () => {
  const [hrs, setHRs] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedHR, setSelectedHR] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const hrRes = await fetchHRs();
        setHRs(hrRes.data);

        const companyRes = await axios.get('admin/hrs/filters');
        setCompanies(companyRes.data.companies);
      } catch (err) {
        console.error("HR or filter fetch failed:", err);
      }
    };
    load();
  }, []);

  const filtered = hrs.filter(hr =>
    (hr.name?.toLowerCase().includes(filter.toLowerCase()) ||
      hr.email?.toLowerCase().includes(filter.toLowerCase()) ||
      hr.company?.toLowerCase().includes(filter.toLowerCase())) &&
    (!selectedCompany || hr.company === selectedCompany)
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Active HRs</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search HR by name, email, or company"
          className="border p-2 rounded w-full sm:w-1/3"
        />
        <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="border p-2 rounded">
          <option value="">All Companies</option>
          {companies.map((c, i) => <option key={i} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-sm border">
        <table className="min-w-full table-auto text-sm text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium">Email</th>
              <th className="p-3 text-left font-medium">Company</th>
              <th className="p-3 text-left font-medium">HR Info</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center p-4 text-gray-400">No HRs found</td>
              </tr>
            ) : (
              filtered.map((hr) => (
                <tr key={hr._id} className="hover:bg-gray-50 border-t">
                  <td className="p-3">{hr.name}</td>
                  <td className="p-3">{hr.email}</td>
                  <td className="p-3">{hr.company || 'Not updated'}</td>
                  <td className="p-3">
                    <button onClick={() => setSelectedHR(hr)} className="text-blue-600 hover:underline">View More</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedHR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg relative shadow-xl border">
            <button onClick={() => setSelectedHR(null)} className="absolute top-3 right-5 text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            <h3 className="text-xl font-semibold mb-4">HR Info</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {selectedHR.name}</p>
              <p><strong>Email:</strong> {selectedHR.email}</p>
              <p><strong>Company:</strong> {selectedHR.company || 'Not updated'}</p>
              <p><strong>Phone:</strong> {selectedHR.phoneNumber || 'Not provided'}</p>
              <p><strong>Designation:</strong> {selectedHR.designation || 'Not updated'}</p>
              <p><strong>Experience:</strong> {selectedHR.experience || 'Not updated'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRList;
