import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
const courseOptions = [
  "Bachelor of Technology (B.Tech)",
  "Bachelor of Engineering (B.E)",
  "Bachelor of Computer Applications (BCA)",
  "Bachelor of Medicine and Bachelor of Surgery (MBBS)",
  "Bachelor of Fine Arts (BFA)",
  "Bachelor of Commerce (B.Com)",
  "Bachelor of Pharmacy (B.Pharm)",
  "Bachelor of Business Administration (BBA)",
  "Bachelor of Science (B.Sc)",
  "Bachelor of Education (B.Ed)"
];

const StudentDetails = () => {
  const student = JSON.parse(localStorage.getItem("student")) || {};
  const [form, setForm] = useState({
    rollNumber: "",
    collegecourse: "",
    branch: "",
    yearOfStudy: "",
    college: "",
    phoneNumber: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id && !user?._id) return setLoading(false);
        const res = await axios.get(
          `/api/students/details/${user.id || user._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (res.data && Object.keys(res.data).length > 0) {
          setForm({
            rollNumber: res.data.rollNumber || "",
            collegecourse: res.data.collegecourse || "",
            branch: res.data.branch || "",
            yearOfStudy: res.data.yearOfStudy || "",
            college: res.data.college || "",
            phoneNumber: res.data.phoneNumber || "",
            address: res.data.address || "",
            skills: (res.data.skills || []).join(", ") || "",
          });
        }
      } catch (err) {
        // Optionally show error
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
    const payload = {
  ...form,
  user: user?.id || user?._id,
};
   await axios.post("/api/students/details", payload, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
toast.success("Details saved successfully");
setTimeout(() => navigate("/student/dashboard"), 1000);

    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-2xl space-y-6"
      >
        <h2 className="text-2xl font-bold text-blue-600 mb-4 text-center">
          Student Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Name</label>
            <input
              type="text"
              value={student.name || ""}
              readOnly
              className="w-full border rounded-lg p-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              value={student.email || ""}
              readOnly
              className="w-full border rounded-lg p-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Roll Number *
            </label>
            <input
              type="text"
              name="rollNumber"
              value={form.rollNumber}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              College Course *
            </label>
            <input
              type="text"
              name="collegecourse"
              value={form.collegecourse}
              onChange={handleChange}
              required
              placeholder="Enter your course (e.g., B.Tech CSE)"
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Branch
            </label>
            <input
              type="text"
              name="branch"
              value={form.branch}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Year of Study
            </label>
            <input
              type="number"
              name="yearOfStudy"
              value={form.yearOfStudy}
              onChange={handleChange}
              min="1"
              max="6"
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              College
            </label>
            <input
              type="text"
              name="college"
              value={form.college}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Phone Number
            </label>
            <input
              type="text"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md mt-4"
        >
          {submitting ? "Submitting..." : "Save Details"}
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default StudentDetails;
