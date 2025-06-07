import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login attempt:', formData);
    const dashboardRoutes = {
      student: '/student-dashboard',
      admin: '/admin-dashboard',
      hr: '/hr-dashboard'
    };
    navigate(dashboardRoutes[formData.role] || '/dashboard');
  };

  return (
    // their full Tailwind return block...
  );
};

export default Login;
