/\*\*

- API PATTERNS DISCOVERED IN VELOTEXAI PROJECT
-
- This document catalogs all API calls, existing axios instances,
- and patterns discovered during the centralized apiClient.js creation.
- Use this as reference when migrating components to use the new apiClient.
  \*/

// ============================================================
// EXISTING AXIOS INSTANCES (CONFLICTING / REDUNDANT)
// ============================================================

// 1. src/utils/api.js (INSTANCE WITH INTERCEPTORS)
// - Has request interceptor for Bearer token
// - Has response interceptor for error handling
// - baseURL: `${REACT_APP_API_BASE_URL}/api`
// - Only used sparingly in the app currently
// This should be DEPRECATED in favor of apiClient.js

// 2. src/services/api.js (UTILITY FUNCTIONS)
// - Has axios.defaults.withCredentials = true
// - Exports wrapped API functions (fetchUsers, updateUser, etc.)
// - Uses `BASE = process.env.REACT_APP_API_BASE_URL`
// - Adds Authorization header manually in many functions
// This should be DEPRECATED - its functions should be moved to apiClient-based modules

// 3. src/api/notes.js (HARDCODED LOCALHOST)
// - Uses hardcoded 'http://localhost:8080'
// - Should use environment variable
// - Functions: fetchNotes, saveNote, deleteNote, updateNote
// This should be MIGRATED to use apiClient.js

// ============================================================
// API CALL DISTRIBUTION BY COMPONENT/PAGE
// ============================================================

// AIInterview.jsx (12 axios calls) - CRITICAL
// - GET /api/aiInterview/report/:sessionId (polling for report)
// - GET /api/aiInterview/report/course/:courseId
// - POST /api/aiInterview/save-answer
// - GET /api/aiInterview/next-question (with courseId query param)
// - POST /api/aiInterview/terminate (multipart video upload)
// - POST /api/aiInterview/check-frame (sends frame + response)
// - POST /api/aiInterview/start-interview (with courseId query param)
// - POST /api/aiInterview/complete-interview (multipart video upload)
// All use: `${REACT_APP_API_BASE_URL}/api/...` with Bearer token

// Dashboard.jsx - HR (6 axios calls)
// - GET /api/aiInterview/all-reports (with Bearer token)
// - GET /api/hr/students
// - GET /api/hr/student-details/:studentId
// - GET /api/hr/invited
// - GET /api/hr/:userId/details
// - POST /api/hr/send-invite

// Dashboard.jsx - Admin (1 axios call)
// - GET /admin/recent-activity

// StudentList.jsx - Admin (3 axios calls)
// - GET /admin/students
// - GET /admin/students/filters
// - GET /admin/students/:studentId (inside loop)

// CourseEditModal.jsx (13 axios calls)
// - GET /api/upload/pdf
// - GET /api/quiz/:lessonId
// - DELETE /api/lessons/:id
// - DELETE /api/transcripts/by-lesson/:id
// - DELETE /api/quiz/by-lesson/:id
// - POST /api/transcripts/generate-module
// - POST /api/transcripts/generate-course
// - POST /api/upload (multipart file)
// - PUT /api/lessons/:id (update)
// - GET /api/courses/:courseId
// - GET /api/lessons/:lessonId
// - POST http://localhost:5001/generate-transcript (EXTERNAL PYTHON SERVICE!)
// - GET /api/transcripts/by-lesson/:id
// - POST /api/quiz/generate

// CoursePlayer.jsx (5 axios calls)
// - GET /api/courses/:courseId
// - GET /api/progress/:userId/:courseId (parallel with courses)
// - POST /api/progress/complete
// - GET /api/transcripts/by-lesson/:id
// - POST /api/recommendations/:studentId

// QuizSection.jsx (3 axios calls)
// - GET /api/quiz/:lessonId (parallel with progress)
// - POST /api/quiz/score
// - POST /api/progress/submit-quiz

// StudentDetails.jsx (3 axios calls)
// - GET /api/students/:studentId
// - POST /api/students/details (multipart upload)
// - GET /api/students/details/:id (refetch)

// StudentDashboard.jsx (4 axios calls)
// - GET /api/assessments/:userId
// - GET /api/students/details/:userId
// - GET /api/progress/:userId/:courseId
// - GET /api/courses/:courseId

// StudentCourses.jsx (6 axios calls)
// - DELETE /api/notifications/remove/:studentId/:courseId
// - GET /api/recommendations/quiz/:studentId
// - GET /api/enrollment-status/:courseId/:studentId
// - POST /api/notifications
// - GET /api/students/details/:studentId
// - POST /api/students/enroll
// - POST /api/students/unenroll

// ProfileSettings.jsx (Student) (4 axios calls)
// - GET /api/users/:userId (with Bearer token)
// - PUT /api/users/:userId
// - PUT /api/users/profile/:userId (multipart)
// - DELETE /api/users/:userId

// ProfileSettings.jsx (Admin) (3 axios calls)
// - GET /api/users/:userId (with Bearer token)
// - PUT /admin/profile
// - DELETE /admin/profile

// RecentActivityPage.jsx (2 axios calls)
// - DELETE /admin/notifications/clear
// - DELETE /api/notifications/:id

// HRList.jsx (1 axios call)
// - GET admin/hrs/filters

// CourseManager.jsx (3 axios calls)
// - POST /api/notifications
// - POST /api/upload (multipart)
// - POST SUGGEST_API_URL (external API)

// CareerAssessment.jsx (1 axios call)
// - POST /api/career-assessment (multipart form data)

// CourseRecommendations.jsx (1 axios call)
// - GET /api/recommendations/:studentId

// InterviewAnalysis.jsx (1 axios call)
// - GET /api/aiInterview/report/:courseId

// StudentNavbar.jsx (4 fetch() calls - SHOULD BE MIGRATED TO AXIOS)
// - DELETE /api/notifications/:id
// - DELETE /api/notifications/clear/:studentId
// - GET /api/notifications/user/:studentId
// - GET /api/students/details/:userId

// MyLearning.jsx (3 axios calls)
// - GET /api/students/details/:userId
// - GET /api/progress/:userId/:courseId
// - GET /api/courses/:courseId

// LearningPath.jsx (2 axios calls in Promise.all)
// - GET /api/courses/:courseId
// - GET /api/progress/:userId/:courseId

// Profile.jsx (HR) (1 axios call)
// - GET /api/hr/:userId/details

// College Dashboard.jsx (3 axios calls)
// - GET /college/students/:collegeSlug
// - GET /api/career-assessment/filters
// - GET /college/career-assessment/:assessmentId

// CollegeOnboarding.jsx (2 axios calls)
// - POST /api/college/onboard
// - GET /api/users/:id

// Auth Pages - Login, Register, ForgotPassword, ResetPassword (ALL USE fetch(), NOT axios)
// - fetch POST /auth/login
// - fetch GET /admin/profile (in login)
// - fetch POST /auth/google
// - fetch POST /auth/signup
// - fetch POST /auth/google-signup
// - fetch POST /auth/forgot-password
// - fetch POST /auth/reset-password/:token

// useChatBot.js Hook (1 axios call)
// - POST /api/chat/message

// ============================================================
// API PATTERNS & FEATURES REQUIRED
// ============================================================

// MULTIPART/FORM-DATA ENDPOINTS
// - POST /api/upload (files)
// - POST /api/students/details (profile + avatar)
// - PUT /api/users/profile/:id (profile + avatar)
// - PUT /admin/profile (profile + avatar)
// - POST /api/career-assessment (assessment + file)
// - POST /api/aiInterview/terminate (video recording)
// - POST /api/aiInterview/complete-interview (video recording)

// RELATIVE VS ABSOLUTE URLS
// - Most use relative URLs (e.g., /api/courses)
// - Some use ${REACT_APP_API_BASE_URL}/api/... (hardcoded)
// - notes.js uses absolute http://localhost:8080
// - CourseEditModal.jsx has http://localhost:5001 (Python AI service)

// BEARER TOKEN REQUIRED ENDPOINTS
// - All /admin/_ endpoints
// - All /api/aiInterview/_ endpoints
// - Notification endpoints
// - Student profile endpoints
// - Some user endpoints

// QUERY PARAMETERS
// - /api/aiInterview/next-question?courseId=:courseId
// - /api/aiInterview/start-interview?courseId=:courseId
// - /api/enrollment-status/:courseId/:studentId
// - /api/notifications/user/:studentId
// - /api/recommendations/quiz/:studentId

// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================

// .env file location: client/.env
// REACT_APP_API_BASE_URL=https://velocitixai.onrender.com
// (or http://localhost:8080 for local development)

// ============================================================
// MIGRATION PRIORITY
// ============================================================

// HIGH PRIORITY (Critical interview flow & reporting):
// 1. AIInterview.jsx (12 calls)
// 2. HR Dashboard.jsx (6 calls)
// 3. InterviewAnalysis.jsx (1 call)

// MEDIUM PRIORITY (Course & student management):
// 4. CourseEditModal.jsx (13 calls)
// 5. CoursePlayer.jsx (5 calls)
// 6. StudentDetails.jsx (3 calls)
// 7. StudentCourses.jsx (6 calls)

// LOWER PRIORITY (Auth & UI):
// 8. Auth pages (should migrate from fetch to apiClient)
// 9. StudentNavbar.jsx (4 fetch calls)
// 10. NotificationCenter & other UI components

// ============================================================
// NOTES FOR IMPLEMENTATION
// ============================================================

// 1. NEW apiClient.js FEATURES:
// - Automatic JWT Bearer token injection via interceptor
// - Multipart/form-data support (removes Content-Type header)
// - Consistent error handling (returns error object with message, status, data)
// - Base URL from environment with fallback to localhost
// - 30s timeout

// 2. BACKWARD COMPATIBILITY:
// - apiClient.js maintains same interface as axios
// - All existing patterns (params, headers, data) work unchanged
// - Multipart uploads just need FormData object
// - Authorization header AUTOMATIC (no manual Bearer token needed)

// 3. MIGRATION STEPS (per component):
// a) Import apiClient from '@/api/apiClient'
// b) Replace axios.get/post/etc with apiClient.get/post/etc
// c) Remove manual Authorization header assignment (handled by interceptor)
// d) Remove manual `${REACT_APP_API_BASE_URL}` prefixes (handled by baseURL)
// e) Keep FormData and multipart patterns unchanged
// f) Update error handling if needed (apiClient returns {message, status, data})

// 4. EXTERNAL SERVICE NOTE:
// - CourseEditModal.jsx calls http://localhost:5001 (Python service)
// - This requires special handling or separate axios instance
// - Consider whether this should be proxied through main API

// 5. FETCH VS AXIOS:
// - Auth pages use fetch() - should be migrated to apiClient for consistency
// - StudentNavbar uses fetch() - should be migrated to apiClient
// - No breaking change expected

// ============================================================
