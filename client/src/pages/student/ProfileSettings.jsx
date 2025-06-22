import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProfileSettings = () => {
  const [profile, setProfile] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user.id || user._id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setProfile(res.data);
        // Use imageUrl if available, else fallback to profilePicture
        if (res.data.imageUrl) {
          setImagePreview(res.data.imageUrl);
        } else if (res.data.profilePicture) {
          setImagePreview(res.data.profilePicture);
        }
      } catch (err) {
        toast.error("Failed to load profile");
      }
    };
    fetchProfile();
  }, [userId]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    // Upload to backend immediately for preview and persistence
    const formData = new FormData();
    formData.append("profilePicture", file);
    try {
      const res = await axios.put(
        `/api/users/upload-profile/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setProfile({ ...profile, newImage: file, imageUrl: res.data.imageUrl });
      // Update localStorage with new imageUrl
      const userObj = JSON.parse(localStorage.getItem("user")) || {};
      userObj.imageUrl = res.data.imageUrl;
      localStorage.setItem("user", JSON.stringify(userObj));
      toast.success("Profile image updated!");
    } catch (err) {
      toast.error("Failed to upload image");
    }
  };

  const handleSave = async () => {
    if (!userId) return toast.error("User not found");

    try {
      const formData = new FormData();
      formData.append("name", profile.name || "");
      formData.append("email", profile.email || "");

      // No need to append image here, already uploaded

      if (showPasswordFields) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }
        formData.append("password", passwords.newPassword);
      }

      const res = await axios.put(`/api/users/profile/${userId}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Profile updated!");

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          imageUrl: res.data.imageUrl || res.data.profilePicture || null,
        })
      );

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm("Are you sure you want to delete your account?")
    ) return;

    try {
      await axios.delete(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Account deleted");
      localStorage.clear();
      window.location.href = "/login";
    } catch (err) {
      toast.error("Failed to delete account");
    }
  };

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
