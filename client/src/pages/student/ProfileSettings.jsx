import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProfileSettings = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user.id || user._id;
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    profilePicture: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      toast.error("User not found in localStorage");
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setProfile(res.data);
        setImagePreview(
          res.data.profilePicture ? res.data.profilePicture : null
        );
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setProfile(prev => ({ ...prev, newImage: file }));
    setImagePreview(URL.createObjectURL(file));
  }
};

 const handleSave = async () => {
  if (!userId) return toast.error("User not found");

  const formData = new FormData();
  formData.append("name", profile.name);
  formData.append("email", profile.email);
  if (profile.newImage) {
    formData.append("profilePicture", profile.newImage);
  }

  try {
    const res = await axios.put(`/api/users/${userId}`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success("Profile updated!");
    setProfile(prev => ({ ...prev, newImage: null }));
    localStorage.setItem("user", JSON.stringify(res.data));
  } catch (err) {
    toast.error("Failed to update profile");
  }
};

  const handleChangePassword = async () => {
    if (!userId) return toast.error("User not found");
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await axios.put(
        `/api/users/change-password/${userId}`,
        {
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      toast.success("Password changed successfully");
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordFields(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return toast.error("User not found");
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action is irreversible."
      )
    )
      return;
    try {
      await axios.delete(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Account deleted");
      localStorage.clear();
      window.location.href = "/login";
    } catch (err) {
      toast.error("Failed to delete account");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
      <div className="flex flex-col items-center space-y-4 mb-6">
        <img
          src={imagePreview || "/default-avatar.png"}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover shadow"
        />
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>
      <div className="grid grid-cols-1 gap-4">
        <input
          type="text"
          value={profile.name || ""}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          placeholder="Full Name"
          className="p-2 border rounded"
        />
        <input
          type="email"
          value={profile.email || ""}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          placeholder="Email"
          className="p-2 border rounded"
        />
        <button
          className="text-blue-600 underline text-sm w-fit"
          onClick={() => setShowPasswordFields(!showPasswordFields)}
        >
          {showPasswordFields ? "Cancel Password Change" : "Change Password"}
        </button>
        {showPasswordFields && (
          <div className="grid gap-4">
            <input
              type="password"
              placeholder="Old Password"
              className="p-2 border rounded"
              value={passwords.oldPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, oldPassword: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="New Password"
              className="p-2 border rounded"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="p-2 border rounded"
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, confirmPassword: e.target.value })
              }
            />
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded"
              onClick={handleChangePassword}
              type="button"
            >
              Change Password
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
        <button
          onClick={handleDeleteAccount}
          className="text-red-600 hover:underline text-sm"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
