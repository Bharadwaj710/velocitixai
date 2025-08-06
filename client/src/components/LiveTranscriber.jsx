import React, { useState, useEffect, useRef } from 'react';

const LiveTranscriber = () => {
  const [transcript, setTranscript] = useState('');
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    const startWebSocketAndRecording = async () => {
      // 1. Connect to WebSocket server
      wsRef.current = new WebSocket('ws://localhost:8765');

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
      };

      wsRef.current.onmessage = async (event) => {
        const newText = event.data;
        console.log('Transcript received:', newText);

        // Update UI
        setTranscript((prev) => prev + '\n' + newText);

        // Save to backend
        try {
          const res = await fetch('/api/save-transcript', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: newText }),
          });

          if (!res.ok) {
            console.error('Failed to save transcript:', await res.text());
          }
        } catch (err) {
          console.error('Error saving transcript:', err);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocket error:', err);
      };

      // 2. Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 3. Start recording in small chunks
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0 && wsRef.current.readyState === WebSocket.OPEN) {
          e.data.arrayBuffer().then((buffer) => {
            wsRef.current.send(buffer);
          });
        }
      };

      mediaRecorderRef.current.start(2000); // Every 2 seconds
    };

    startWebSocketAndRecording();

    // Clean up on unmount
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="p-4 rounded-lg bg-black text-white font-mono">
      <h2 className="text-xl font-bold mb-2">Live Transcript</h2>
      <div className="whitespace-pre-line bg-gray-800 p-3 rounded-md max-h-96 overflow-y-auto">
        {transcript || 'Waiting for speech...'}
      </div>
    </div>
  );
};

export default LiveTranscriber;
