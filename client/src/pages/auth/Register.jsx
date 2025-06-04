import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // TODO: Implement actual registration logic
    console.log('Registration attempt:', formData);
    navigate('/login');
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
      maxWidth: '450px',
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
      backgroundColor: '#fff',
      boxSizing: 'border-box'
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
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
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
    },
    roleSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    roleGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px'
    },
    roleOption: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'white'
    },
    roleOptionSelected: {
      borderColor: '#667eea',
      backgroundColor: '#f0f4ff'
    },
    roleRadio: {
      marginRight: '8px',
      accentColor: '#667eea'
    },
    roleLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <div>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Join us today and get started</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              id="email"
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
              id="password"
              name="password"
              type="password"
              required
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <div style={styles.roleSection}>
            <label style={styles.label}>Select Role</label>
            <div style={styles.roleGrid}>
              {[
                { value: 'student', label: 'Student' },
                { value: 'admin', label: 'Admin' },
                { value: 'hr', label: 'HR' }
              ].map((role) => (
                <label
                  key={role.value}
                  style={{
                    ...styles.roleOption,
                    ...(formData.role === role.value ? styles.roleOptionSelected : {})
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={handleChange}
                    style={styles.roleRadio}
                  />
                  <span style={styles.roleLabel}>{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            style={styles.button}
            onMouseEnter={(e) => Object.assign(e.target.style, {...styles.button, ...styles.buttonHover})}
            onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
          >
            Create Account
          </button>
        </form>

        <div style={styles.linkContainer}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={styles.link}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.linkHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, styles.link)}
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;