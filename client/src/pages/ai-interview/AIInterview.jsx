import React, { useEffect, useRef, useState } from 'react';
import StudentNavbar from '../../components/StudentNavbar';

const QUESTIONS = [
  'Tell us about yourself.',
  'Why are you interested in this field?',
  'Describe a challenge you overcame during your course.',
  'How would you apply what you learned in a real job?',
  'Where do you see yourself in 5 years?'
];

const QUESTION_TIME = 120; // seconds per question

const AIInterview = ({ onSubmit }) => {
  const [step, setStep] = useState('intro'); // intro | interview | complete
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [videoBlobs, setVideoBlobs] = useState([]);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Request webcam on mount (DISABLED for now)
  /*
  useEffect(() => {
    async function getWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Could not access webcam. Please allow camera access.');
      }
    }
    getWebcam();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      clearInterval(timerRef.current);
    };
  }, []);
  */

  // Timer logic
  useEffect(() => {
    if (recording && step === 'interview') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleNext();
            return QUESTION_TIME;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [recording, step]);

  // Start recording for a question
  const startRecording = () => {
    if (!streamRef.current) return;
    const mr = new window.MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    setMediaRecorder(mr);
    chunksRef.current = [];
    mr.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      setVideoBlobs(prev => [...prev, new Blob(chunksRef.current, { type: 'video/webm' })]);
      chunksRef.current = [];
    };
    mr.start();
    setRecording(true);
    setTimeLeft(QUESTION_TIME);
  };

  // Stop recording for a question
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setRecording(false);
  };

  // Handle next question
  const handleNext = () => {
    stopRecording();
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(q => q + 1);
      setTimeout(() => {
        startRecording();
      }, 500);
    } else {
      setStep('complete');
      if (onSubmit) onSubmit(videoBlobs);
    }
    setTimeLeft(QUESTION_TIME);
  };

  // Start interview
  const handleStart = () => {
    setStep('interview');
    setCurrentQuestion(0);
    setVideoBlobs([]);
    setTimeout(() => {
      startRecording();
    }, 500);
  };

  // UI
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <StudentNavbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-blue-700">AI Interview</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {step === 'intro' && (
          <>
            <p className="mb-8 text-lg text-gray-700 text-center">You will answer {QUESTIONS.length} interview questions on camera. Each question has a 2-minute timer. Click start when ready!</p>
            <div className="aiinterview-video-frame rounded-xl w-full max-w-3xl mb-6 bg-black aspect-video shadow-lg flex items-center justify-center text-gray-400 text-2xl min-h-[320px]">
              Camera is disabled for now
            </div>
            <button onClick={handleStart} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-lg">Start Interview</button>
          </>
        )}
        {step === 'interview' && (
          <div className="w-full flex flex-col items-center">
            <div className="bg-blue-50 rounded-lg p-6 w-full mb-6 text-xl text-blue-900 font-medium text-center shadow">
              {QUESTIONS[currentQuestion]}
            </div>
            <div className="relative w-full max-w-3xl mb-6">
              <div className="aiinterview-video-frame rounded-xl w-full bg-black aspect-video shadow-lg flex items-center justify-center text-gray-400 text-2xl min-h-[320px]">
                Camera is disabled for now
              </div>
            </div>
            <div className="w-full flex items-center justify-between mb-3">
              <span className="text-base text-gray-500">Question {currentQuestion + 1} of {QUESTIONS.length}</span>
              <span className="text-base text-gray-500">Time left: <span className="font-bold text-blue-700">{timeLeft}s</span></span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-3 bg-gray-200 rounded-full mb-6">
              <div className="h-3 bg-blue-500 rounded-full transition-all" style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}></div>
            </div>
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-lg"
              disabled={false}
            >
              {currentQuestion === QUESTIONS.length - 1 ? 'Finish Interview' : 'Next Question'}
            </button>
          </div>
        )}
        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="text-5xl mb-6">🎉</div>
            <h3 className="text-2xl font-bold mb-3 text-blue-700">Interview submitted!</h3>
            <p className="text-lg text-gray-700 mb-4">Thank you for completing your AI interview. Your responses have been recorded.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInterview;
