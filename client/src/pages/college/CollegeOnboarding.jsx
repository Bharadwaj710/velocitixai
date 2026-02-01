import React, { useState } from "react";
import apiClient from "../../api/apiClient";
import { useNavigate } from "react-router-dom";

const CollegeOnboarding = () => {
  const [form, setForm] = useState({
    name: "",
    address: { street: "", city: "", state: "", country: "", pinCode: "" },
    establishedYear: "",
    accreditation: "",
    contact: { email: "", phone: "", website: "" },
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      setForm({
        ...form,
        address: { ...form.address, [name.split(".")[1]]: value },
      });
    } else if (name.startsWith("contact.")) {
      setForm({
        ...form,
        contact: { ...form.contact, [name.split(".")[1]]: value },
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user._id) {
      alert("User not found or invalid. Please log in again.");
      setLoading(false);
      return;
    }

    // Validate ObjectId format
    if (!/^[a-fA-F0-9]{24}$/.test(user._id)) {
      alert("Invalid user ID format.");
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.post("/api/college/onboard", {
        userId: user._id,
        ...form,
      });

      if (res.data.success && res.data.slug) {
        // ✅ Now fetch updated user from backend instead of mutating localStorage manually
        const updatedUser = await apiClient.get(`/api/users/${user._id}`);
        if (updatedUser.data && updatedUser.data.user) {
          localStorage.setItem("user", JSON.stringify(updatedUser.data.user));
          navigate(`/college-dashboard/${res.data.slug}`);
        } else {
          alert(
            "College onboarded but failed to refresh user. Try logging in again."
          );
        }
      } else {
        alert("Onboarding failed: " + res.data.message);
      }
    } catch (err) {
      console.error("Onboarding error:", err.response?.data || err.message);
      alert("Failed to onboard college");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        className="bg-white p-8 rounded shadow-md w-full max-w-lg"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6">College Profile Setup</h2>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="College Name"
          className="input mb-3 w-full"
          required
        />
        <input
          name="address.street"
          value={form.address.street}
          onChange={handleChange}
          placeholder="Street"
          className="input mb-3 w-full"
        />
        <input
          name="address.city"
          value={form.address.city}
          onChange={handleChange}
          placeholder="City"
          className="input mb-3 w-full"
        />
        <input
          name="address.state"
          value={form.address.state}
          onChange={handleChange}
          placeholder="State"
          className="input mb-3 w-full"
        />
        <input
          name="address.country"
          value={form.address.country}
          onChange={handleChange}
          placeholder="Country"
          className="input mb-3 w-full"
        />
        <input
          name="address.pinCode"
          value={form.address.pinCode}
          onChange={handleChange}
          placeholder="Pin Code"
          className="input mb-3 w-full"
        />
        <input
          name="establishedYear"
          value={form.establishedYear}
          onChange={handleChange}
          placeholder="Established Year"
          className="input mb-3 w-full"
        />
        <input
          name="accreditation"
          value={form.accreditation}
          onChange={handleChange}
          placeholder="Accreditation"
          className="input mb-3 w-full"
        />
        <input
          name="contact.email"
          value={form.contact.email}
          onChange={handleChange}
          placeholder="Contact Email"
          className="input mb-3 w-full"
        />
        <input
          name="contact.phone"
          value={form.contact.phone}
          onChange={handleChange}
          placeholder="Contact Phone"
          className="input mb-3 w-full"
        />
        <input
          name="contact.website"
          value={form.contact.website}
          onChange={handleChange}
          placeholder="Website"
          className="input mb-3 w-full"
        />
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </form>
    </div>
  );
};

export default CollegeOnboarding;
