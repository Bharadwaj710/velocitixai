import React, { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";

const HRProfile = () => {
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [designation, setDesignation] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchHRDetails = async () => {
      try {
        const loggedUser = JSON.parse(localStorage.getItem("user"));
        const res = await apiClient.get(`/api/hr/${loggedUser._id}/details`);
        const hr = res.data.hr;
        setCompanyName(hr.company || "");
        setPhoneNumber(hr.phoneNumber || "");
        setAddress(hr.address || "");
        setDesignation(hr.designation || "");
      } catch (error) {
        console.error("Error fetching HR profile:", error);
      }
    };
    fetchHRDetails();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Send updated profile to backend
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">
        Edit Company Profile
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Company Name
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Designation
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Address
          </label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
        >
          Save Changes
        </button>
        {success && (
          <div className="text-green-600 font-medium mt-2">
            Profile updated!
          </div>
        )}
      </form>
    </div>
  );
};

export default HRProfile;
