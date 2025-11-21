/**
 * QUICK START GUIDE: Using apiClient.js
 * 
 * Location: src/api/apiClient.js
 * 
 * The centralized apiClient is ready to use. It handles:
 * ✓ Automatic JWT token injection from localStorage
 * ✓ Multipart/form-data support for file uploads
 * ✓ Consistent error responses
 * ✓ Base URL from environment variables
 * 
 * NO refactoring of existing calls has been done yet.
 * Migrate components one by one using this guide.
 */

// ============================================================
// BASIC USAGE
// ============================================================

import apiClient from '@/api/apiClient';

// GET request
const data = await apiClient.get('/api/courses');

// POST request
const result = await apiClient.post('/api/students/enroll', {
  courseId: 'abc123',
  studentId: 'def456'
});

// PUT request
const updated = await apiClient.put('/api/users/123', {
  name: 'John Doe'
});

// DELETE request
await apiClient.delete('/api/notifications/456');

// ============================================================
// QUERY PARAMETERS
// ============================================================

// Method 1: Using params object
apiClient.get('/api/progress', {
  params: { userId: '123', courseId: '456' }
});

// Method 2: In URL (also works)
apiClient.get(`/api/progress?userId=123&courseId=456`);

// ============================================================
// MULTIPART/FORM-DATA (File Uploads)
// ============================================================

// Example: Upload profile with avatar
const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('email', 'john@example.com');
formData.append('avatar', fileInputElement.files[0]);

// Just pass FormData - apiClient automatically removes Content-Type header
const response = await apiClient.post('/api/users/profile', formData);

// Interview video upload (multipart)
const interviewData = new FormData();
interviewData.append('sessionId', sessionId);
interviewData.append('video', videoBlob);
interviewData.append('studentId', studentId);
interviewData.append('courseId', courseId);

await apiClient.post('/api/aiInterview/complete-interview', interviewData);

// ============================================================
// CUSTOM HEADERS & CONFIG
// ============================================================

// Add custom headers
apiClient.get('/api/data', {
  headers: {
    'X-Custom-Header': 'value'
  }
});

// Override timeout for specific request
apiClient.post('/api/long-operation', data, {
  timeout: 60000 // 60 seconds
});

// ============================================================
// ERROR HANDLING
// ============================================================

// apiClient returns consistent error objects:
// { message: string, status: number, data: any }

try {
  const response = await apiClient.get('/api/courses');
  // Handle success
} catch (error) {
  console.error(error.message);  // "Unauthorized"
  console.error(error.status);   // 401
  console.error(error.data);     // { error: "Invalid token" }
  
  // Handle specific errors
  if (error.status === 401) {
    // Token expired - user is already logged out by interceptor
    // Redirect to login if needed
  } else if (error.status === 404) {
    // Resource not found
  } else if (error.status >= 500) {
    // Server error
  }
}

// ============================================================
// DIFFERENCES FROM CURRENT CODE
// ============================================================

// BEFORE (current scattered implementation):
const response = await axios.get(
  `${process.env.REACT_APP_API_BASE_URL}/api/courses`,
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }
);

// AFTER (using apiClient):
const response = await apiClient.get('/api/courses');
// Token is automatically added by interceptor!
// Base URL is already set!

// ============================================================
// SPECIFIC USE CASES IN VELOTEXAI
// ============================================================

// 1. Interview Report Polling (AIInterview.jsx)
// BEFORE:
const res = await axios.get(
  `${process.env.REACT_APP_API_BASE_URL}/api/aiInterview/report/${sessionId}`,
  { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
);

// AFTER:
const res = await apiClient.get(`/api/aiInterview/report/${sessionId}`);

// 2. Video Upload (AIInterview.jsx)
// BEFORE:
const formData = new FormData();
formData.append('sessionId', sessionId);
formData.append('video', videoBlob);
formData.append('studentId', studentId);
const res = await axios.post(
  `${process.env.REACT_APP_API_BASE_URL}/api/aiInterview/complete-interview`,
  formData,
  { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
);

// AFTER (exactly the same, but shorter):
const formData = new FormData();
formData.append('sessionId', sessionId);
formData.append('video', videoBlob);
formData.append('studentId', studentId);
const res = await apiClient.post('/api/aiInterview/complete-interview', formData);

// 3. Get all reports (HR Dashboard.jsx)
// BEFORE:
const repRes = await axios.get(
  `${process.env.REACT_APP_API_BASE_URL}/api/aiInterview/all-reports`,
  { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
);

// AFTER:
const repRes = await apiClient.get('/api/aiInterview/all-reports');

// 4. File upload (CourseEditModal.jsx)
// BEFORE:
const formData = new FormData();
formData.append('file', pdfFile);
const uploadRes = await axios.post(
  `${process.env.REACT_APP_API_BASE_URL}/api/upload/pdf`,
  formData,
  { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
);

// AFTER:
const formData = new FormData();
formData.append('file', pdfFile);
const uploadRes = await apiClient.post('/api/upload/pdf', formData);

// ============================================================
// NEXT STEPS: MIGRATION PLAN
// ============================================================

// Phase 1 (Critical - Interview Flow):
// - AIInterview.jsx (12 calls) → Highest priority
// - InterviewAnalysis.jsx (1 call)
// - HR Dashboard.jsx (6 calls)

// Phase 2 (Core Features):
// - CourseEditModal.jsx (13 calls)
// - CoursePlayer.jsx (5 calls)
// - StudentDetails.jsx (3 calls)

// Phase 3 (General Pages):
// - All remaining component pages

// Phase 4 (Utility & Auth):
// - Auth pages (migrate from fetch to apiClient)
// - StudentNavbar.jsx (migrate fetch to apiClient)
// - Deprecate src/utils/api.js
// - Deprecate src/services/api.js

// ============================================================
// IMPORTANT NOTES
// ============================================================

// 1. Token is AUTOMATICALLY added - don't add it manually
// 2. Base URL is ALREADY included - don't add process.env prefix
// 3. Multipart uploads just need FormData - Content-Type is auto-handled
// 4. Error handling is CONSISTENT - always check error.status & error.message
// 5. On 401 token is cleared - component should handle redirect to login
// 6. All original axios patterns still work (params, headers, etc.)

// ============================================================
