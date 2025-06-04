// src/pages/Home.jsx
import React from 'react';
import '../App.css'; // to apply the same styles

const Home = () => {
  return (
    <main className="main-content">
      <div className="hero-section">
        <div className="container">
          <h1 className="welcome-title">Welcome to VelocitX AI</h1>
          <p className="welcome-subtitle">
            Experience the future of artificial intelligence with our cutting-edge platform
          </p>
          <div className="cta-buttons">
            <button className="btn btn-primary">Get Started</button>
            <button className="btn btn-secondary">Learn More</button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
