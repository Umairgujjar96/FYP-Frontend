import { useState, useRef } from "react";

export default function VoiceRecorder({ onTranscribe }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
      audioChunks.current = []; // Clear chunks after stopping

      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.wav");

      // Send to Whisper API (Update with your Hugging Face Space URL)
      const response = await fetch(
        "https://umairhssn254-whisper-realtime.hf.space/api/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      onTranscribe(data.text); // Send transcribed text to parent
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div>
      <button onClick={startRecording} disabled={recording}>
        🎤 Start
      </button>
      <button onClick={stopRecording} disabled={!recording}>
        🛑 Stop
      </button>
    </div>
  );
}
