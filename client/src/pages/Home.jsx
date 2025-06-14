import React, { useState } from 'react';
import { ChevronRight, Users, Target, BarChart3, Star, Menu, X, Play, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: <Target className="w-8 h-8 text-blue-600" />,
      title: "Personalized Career Guidance",
      description: "AI-driven recommendations for career paths, skill development, and job applications."
    },
    {
      icon: <Users className="w-8 h-8 text-green-600" />,
      title: "Job Matching and Placement",
      description: "Intelligent matching of students with relevant job opportunities and streamlined application process."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
      title: "Analytics and Reporting",
      description: "Detailed insights into student performance, placement rates, and recruiter engagement."
    }
  ];

  const testimonials = [
    {
      name: "Uday Vamsi",
      role: "Recent Graduate",
      quote: "Velocitix AI helped me land my dream job in tech. The personalized guidance was incredible!",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612c5cc?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Bharadwaj",
      role: "Computer Science Student",
      quote: "The job matching feature connected me with opportunities I never would have found on my own.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Emily Rodriguez",
      role: "Career Counselor",
      quote: "As a counselor, Velocitix AI has transformed how we support our students' career journeys.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const partnerColleges = [
  {
    name: "Harvard University",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&h=100&fit=crop"
  },
  {
    name: "Yale University",
    image: "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=200&h=100&fit=crop"
  },
  {
    name: "Stanford University",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&h=100&fit=crop"
  },
  {
    name: "University of Oxford",
    image: "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=200&h=100&fit=crop"
  },
  {
    name: "MIT",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&h=100&fit=crop"
  },
  {
    name: "Cambridge University",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&h=100&fit=crop"
  }
];


  const navigate = useNavigate();

const handleNavigation = (path) => {
  navigate(path);
};


  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">
                Velocitix AI
              </h1>
            </div>

            {/* Desktop Navigation */}
            
            {/* Desktop Buttons */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-4"> 
                <button 
                  onClick={() => handleNavigation('/login')}
                  className="border border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 px-6 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('/login')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  Sign Up 
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#" className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">For Students</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">For Colleges</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">For Recruiters</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">Resources</a>
              <div className="pt-4 pb-2 space-y-2">
                
                <button 
                  onClick={() => handleNavigation('/login')}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'blur(2px) brightness(0.7)' }}
          >
            <source src="/public/assets/landing.mp4" type="video/mp4" />
            {/* Fallback background */}
            <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-gray-50"></div>
          </video>
          {/* Light overlay */}
          <div className="absolute inset-0 bg-white/60"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Empowering Students
            </span>
            <br />
            <span className="text-gray-900">with AI Career Success</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Velocitix AI is an AI-powered career readiness and placement tool for students, colleges, and recruiters.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => handleNavigation('/login')}
              className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-gray-600 rotate-90" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Velocitix AI offers a comprehensive suite of features designed to enhance career readiness and placement for students, colleges, and recruiters.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-white p-8 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 group-hover:text-purple-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              What Our Users Say
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl border border-gray-200 hover:border-yellow-400 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full mr-4 border-2 border-purple-400"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">{testimonial.name}</h4>
                    <p className="text-purple-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic leading-relaxed">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
              Add Testimonial
            </button>
          </div>
        </div>
      </section>

      {/* Partner Colleges Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Partner Colleges
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by leading educational institutions worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
  {partnerColleges.map((college, index) => (
    <div 
      key={index} 
      className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105 flex flex-col items-center justify-center text-center"
    >
      <h3 className="text-gray-800 font-semibold mb-3 group-hover:text-purple-600 transition-colors">
        {college.name}
      </h3>
      <img 
        src={college.image} 
        alt={college.name}
        className="max-w-full h-16 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
      />
    </div>
  ))}
</div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold text-blue-600">
                Velocitix AI
              </h3>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 mb-4 md:mb-0">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">About Us</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Terms of Service</a>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-600">
              © {new Date().getFullYear()} Velocitix AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;