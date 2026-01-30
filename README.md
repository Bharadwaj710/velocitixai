# Velocitix AI — Career Assessment & Recommendation Platform

**Live demo:** https://velocitixai-sao9.vercel.app/  
**Status:** Production / Prototype

## What it does
Velocitix AI is a full-stack AI-powered career guidance and interview platform designed to help students discover the right career path through AI assessments, video analysis, adaptive interviews, and personalized course recommendations.
The platform combines modern web development, AI/ML, and real-time analysis to simulate real interview scenarios and generate actionable career insights.

## Architecture (high level)
Frontend (React + Vite)
       ↓
Node.js + Express API
       ↓
Python AI Services (Flask)
       ↓
Gemini AI | Whisper | MediaPipe
       ↓
MongoDB | Cloudinary


## Tech stack
Frontend:
-React,
-Vite,
-Tailwind CSS,
-Axios

Backend (Main API):
-Node.js,
-Express.js,
-MongoDB (Mongoose),
JWT Authentication

AI Services (Python):
-Flask,
-Google Gemini AI,
-Whisper (Speech-to-Text),
-MediaPipe (Face Analysis),
-OpenCV,
-MoviePy,
-yt-dlp,
-Cloudinary SDK

Deployment:
-Frontend: Vercel,
-Backend: Render,
-AI Services: Render (Python 3.10),
-Database: MongoDB Atlas,
-Media Storage: Cloudinary

## Key features:
**Career Assessment & Profiling**
AI-driven analysis of student responses,
Domain identification (Technology, Healthcare, Business, etc.),
Skill-level classification (Beginner / Intermediate / Proficient),
Role recommendations based on interests and challenges

**AI Video Analysis (Career & Interview)**
Cloudinary-based video uploads,
Audio extraction and transcription using Whisper,
Speech confidence, clarity, tone, and intent analysis using Gemini AI,
Facial analysis using MediaPipe + OpenCV,
Eye contact and face-visibility scoring,
Anti-cheating and attention monitoring logic

**AI Technical Interview System**
Adaptive 10-question AI interview,
Dynamic question generation based on:
-Course content,
-Student proficiency,
-Previous answers,
No question repetition,
Real-world, role-based follow-ups for strong answers,
Automatic scoring and feedback generation

**AI-Powered Course Recommendation Engine**
Course matching using:
-Domain alignment,
-Skill overlap,
-Role relevance,
-Learning challenges,
Scored recommendations with labels:
-Highly Recommended,
-Recommended,
-Useful,
Supports refresh & caching for performance

**Course-Aware AI Chatbot**
-Context-aware AI tutor per course,
-Answers only course-related queries,
-Adapts language based on student level,
-Smart starter question suggestions,
-Markdown-formatted, structured responses

**AI Cheating Detection System**
-Real-time face detection,
-Head movement (yaw & pitch) analysis,
-Multi-face detection,
-Grace period & debounce logic,
-Session-based calibration,
-Non-intrusive warning system

## How to run (local)
1. Clone repo  
2. Setup `.env` files for frontend/backend/processing (MONGO_URI, CLOUDINARY, API keys)  
3. Start backend and processing services (see `backend/README.md` and `processing_service/README.md`)  
4. Start frontend: `npm run dev`
