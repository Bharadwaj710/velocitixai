import { useState, useEffect } from 'react';
  import axios from 'axios';
  import { ToastContainer, toast } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css';

  const ProfileSettings = () => {
    const [profile, setProfile] = useState({});
    const [imagePreview, setImagePreview] = useState(null);
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [passwords, setPasswords] = useState({
      newPassword: '',
      confirmPassword: ''
    });

    useEffect(() => {
      const fetchProfile = async () => {
        try {
          const res = await axios.get('http://localhost:8080/admin/profile', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });

          setProfile(res.data);
          // ✅ Cloudinary URL is public and stored directly
          if (res.data.imageUrl) {
            setImagePreview(res.data.imageUrl);
          }
        } catch (err) {
          toast.error('Failed to load profile');
        }
      };
      fetchProfile();
    }, []);

    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setImagePreview(URL.createObjectURL(file)); // for preview
      setProfile({ ...profile, newImage: file });
    };

    const handleSave = async () => {
      try {
        const formData = new FormData();
        formData.append('name', profile.name);
        formData.append('email', profile.email);
        formData.append('phone', profile.phone || '');
        formData.append('bio', profile.bio || '');

        if (profile.newImage) {
          formData.append('image', profile.newImage);
        }

        if (showPasswordFields) {
          if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Passwords do not match');
            return;
          }
          formData.append('password', passwords.newPassword);
        }

        const res = await axios.put(
          'http://localhost:8080/admin/profile',
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        toast.success('Profile updated!');

        // ✅ Update localStorage (Cloudinary URL)
        localStorage.setItem(
          'admin',
          JSON.stringify({
            name: res.data.name,
            email: res.data.email,
            id: res.data._id,
            imageUrl: res.data.imageUrl || null
          })
        );

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (err) {
        console.error(err);
        toast.error('Failed to update profile');
      }
    };

    const handleDeleteAccount = async () => {
      if (
        !window.confirm(
          'Are you sure you want to delete your account? This action is irreversible.'
        )
      )
        return;

      try {
        await axios.delete('http://localhost:8080/admin/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        toast.success('Account deleted');
        localStorage.clear();
        window.location.href = '/login';
      } catch (err) {
        toast.error('Failed to delete account');
      }
    };

    return (
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <ToastContainer position="top-right" autoClose={3000} />
        <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>

        <div className="flex flex-col items-center space-y-4 mb-6">
          <img
            src={imagePreview || '/default-avatar.png'}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover shadow"
          />
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <input
            type="text"
            value={profile.name || ''}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Full Name"
            className="p-2 border rounded"
          />
          <input
            type="email"
            value={profile.email || ''}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="Email"
            className="p-2 border rounded"
          />

          <button
            className="text-blue-600 underline text-sm w-fit"
            onClick={() => setShowPasswordFields(!showPasswordFields)}
          >
            {showPasswordFields ? 'Cancel Password Change' : 'Change Password'}
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
                  setPasswords({
                    ...passwords,
                    confirmPassword: e.target.value
                  })
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
// This code defines a ProfileSettings component for an admin user to manage their profile settings.
// It allows the admin to update their profile picture, name, email, and password.