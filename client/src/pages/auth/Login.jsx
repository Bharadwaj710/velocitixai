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
    // TODO: Authenticate with backend
    console.log('Login attempt:', formData);

    // Temporary role-based navigation
    const dashboardRoutes = {
      student: '/student-dashboard',
      admin: '/admin-dashboard',
      hr: '/hr-dashboard'
    };
    navigate(dashboardRoutes[formData.role] || '/dashboard');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '48px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    formWrapper: {
      maxWidth: '400px',
      width: '100%',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    title: {
      textAlign: 'center',
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '8px'
    },
    subtitle: {
      textAlign: 'center',
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '16px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      outline: 'none',
      backgroundColor: '#fff'
    },
    inputFocus: {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '16px',
      backgroundColor: 'white',
      cursor: 'pointer',
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    button: {
      width: '100%',
      padding: '14px 16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      outline: 'none'
    },
    buttonHover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 10px 20px rgba(102, 126, 234, 0.2)'
    },
    linkContainer: {
      textAlign: 'center',
      fontSize: '14px',
      color: '#6b7280'
    },
    link: {
      color: '#667eea',
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'color 0.2s ease'
    },
    linkHover: {
      color: '#5a67d8',
      textDecoration: 'underline'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <div>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to your account to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              name="email"
              type="email"
              required
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              required
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.select}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.select)}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
            </select>
          </div>

          <button
            type="submit"
            style={styles.button}
            onMouseEnter={(e) => Object.assign(e.target.style, {...styles.button, ...styles.buttonHover})}
            onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
          >
            Sign In
          </button>
        </form>

        <div style={styles.linkContainer}>
          Don't have an account?{' '}
          <Link 
            to="/register" 
            style={styles.link}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.linkHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, styles.link)}
          >
            Register here
          </Link>
          
        </div>
      </div>
    </div>
  );
};

export default Login;