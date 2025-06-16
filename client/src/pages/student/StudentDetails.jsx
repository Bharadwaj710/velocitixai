import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const courseOptions = ["B.Tech", "BBA", "BCA", "MBA", "MCA", "B.Sc", "M.Tech"];
const domainOptions = [
  "Technology and Innovation",
  "Healthcare and Wellness",
  "Business and Finance",
  "Arts and Creativity",
  "Education and Social Services",
];

const StudentDetails = () => {
  const student = JSON.parse(localStorage.getItem("student")) || {};
  const [form, setForm] = useState({
    enrollmentNumber: "",
    course: "",
    branch: "",
    yearOfStudy: "",
    college: "",
    phoneNumber: "",
    domain: "",
    address: "",
    skills: "",
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
            enrollmentNumber: res.data.enrollmentNumber || "",
            course: res.data.course?.title || res.data.course || "",
            branch: res.data.branch || "",
            yearOfStudy: res.data.yearOfStudy || "",
            college: res.data.college || "",
            phoneNumber: res.data.phoneNumber || "",
            domain: res.data.domain || "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const payload = {
        ...form,
        user: user?.id || user?._id,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await axios.post("/api/students/details", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Details saved successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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
              Enrollment Number *
            </label>
            <input
              type="text"
              name="enrollmentNumber"
              value={form.enrollmentNumber}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Course *
            </label>
            <select
              name="course"
              value={form.course}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-2"
            >
              <option value="">Select Course</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Domain
            </label>
            <select
              name="domain"
              value={form.domain}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            >
              <option value="">Select Domain</option>
              {domainOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
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
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-1">
              Skills (comma separated)
            </label>
            <input
              type="text"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="e.g. JavaScript, React, MongoDB"
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
