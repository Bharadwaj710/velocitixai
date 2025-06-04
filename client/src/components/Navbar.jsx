import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <>
      <style>{`
        .navbar {
          background-color: #ffffff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 0;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
        }

        .nav-logo h2 {
          color: #2c3e50;
          margin: 0;
          font-size: 1.8rem;
          font-weight: 600;
          letter-spacing: -0.5px;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-link {
          color: #555;
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          color: #3498db;
          background-color: #f8f9fa;
        }

        .auth-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-auth {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn-login {
          background-color: transparent;
          color: #555;
          border: 1px solid #ddd;
        }

        .btn-login:hover {
          background-color: #f8f9fa;
          border-color: #3498db;
          color: #3498db;
        }

        .btn-signup {
          background-color: #3498db;
          color: white;
          border: 1px solid #3498db;
        }

        .btn-signup:hover {
          background-color: #2980b9;
          border-color: #2980b9;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 0 15px;
            height: 60px;
          }

          .nav-logo h2 {
            font-size: 1.5rem;
          }

          .nav-links {
            display: none;
          }

          .nav-menu {
            gap: 1rem;
          }

          .btn-auth {
            padding: 8px 16px;
            font-size: 13px;
          }
        }
      `}</style>

      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h2>VelocitX AI</h2>
          </div>
          <div className="nav-menu">
            <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
              <a href="#about" className="nav-link">About</a>
              <a href="#services" className="nav-link">Services</a>
              <a href="#contact" className="nav-link">Contact</a>
            </div>
            <div className="auth-buttons">
              <Link to="/login" className="btn-auth btn-login">Login</Link>
              <Link to="/register" className="btn-auth btn-signup">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
