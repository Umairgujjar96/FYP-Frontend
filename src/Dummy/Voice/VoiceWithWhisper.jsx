import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Modal,
  Typography,
  Spin,
  Alert,
  Button,
  Progress,
  Space,
  Tag,
} from "antd";
import {
  AudioOutlined,
  SettingOutlined,
  LoadingOutlined,
  SoundOutlined,
} from "@ant-design/icons";
const { Text, Title, Paragraph } = Typography;

// You would store this in an environment variable in a real application
const HUGGING_FACE_TOKEN = "tokenHere";
//   process.env.NEXT_PUBLIC_HUGGING_FACE_TOKEN || "YOUR_HF_TOKEN";

export default function PassiveVoiceListener() {
  // State management
  const [status, setStatus] = useState("Initializing...");
  const [transcript, setTranscript] = useState("");
  const [processingCommand, setProcessingCommand] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [maxRecordingTime] = useState(5); // 5 seconds max for commands
  const [wakeWord, setWakeWord] = useState("hey assistant");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [listeningActive, setListeningActive] = useState(false);
  const [volume, setVolume] = useState(0);

  // Refs
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneStreamRef = useRef(null);

  // Initialize audio context for visualizations
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    } catch (err) {
      console.error("Audio context initialization failed:", err);
      setError("Audio visualization not supported in this browser");
    }

    return () => {
      stopMicrophoneStream();
      audioContextRef.current?.close();
    };
  }, []);

  // Audio visualization logic
  const setupAudioVisualization = async (stream) => {
    if (!audioContextRef.current || !analyserRef.current) return;

    try {
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const updateVolume = () => {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate volume level (0-100)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setVolume(Math.min(100, average * 2)); // Scale to 0-100

        if (listeningActive) {
          requestAnimationFrame(updateVolume);
        }
      };

      updateVolume();
    } catch (err) {
      console.error("Audio visualization failed:", err);
    }
  };

  // Stop the microphone stream
  const stopMicrophoneStream = () => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
    }
  };

  // 1. Web Speech Wake Word Listener with error handling
  const startWakeWordListener = async () => {
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser");
      }

      // Stop any existing recognition instances
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log("Recognition was not running");
        }
      }

      // Create and configure a new recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListeningActive(true);
        setStatus(`Listening for wake word: "${wakeWord}"`);
        setError(null);

        // Set up microphone access for visualization
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            microphoneStreamRef.current = stream;
            setupAudioVisualization(stream);
          })
          .catch((err) => {
            console.error("Microphone access error:", err);
          });
      };

      recognition.onresult = (event) => {
        const lastTranscript =
          event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("Heard:", lastTranscript);

        if (lastTranscript.includes(wakeWord.toLowerCase())) {
          recognition.stop();
          setWakeWordDetected(true);
          setStatus("Wake word detected! Listening for command...");
          recordCommand();
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        if (event.error === "not-allowed") {
          setError(
            "Microphone access denied. Please allow microphone access to use this feature."
          );
        } else if (event.error === "network") {
          setError("Network error. Please check your connection.");
        } else {
          setError(`Recognition error: ${event.error}`);
        }

        // Try to restart if it's not a permission issue
        if (event.error !== "not-allowed") {
          setTimeout(() => {
            try {
              startWakeWordListener();
            } catch (e) {
              console.error("Failed to restart after error:", e);
            }
          }, 3000);
        }
      };

      recognition.onend = () => {
        // Only restart if we're not recording a command
        if (!wakeWordDetected) {
          try {
            recognition.start();
          } catch (error) {
            console.error("Error restarting recognition:", error);
            setStatus("Voice recognition error. Trying to restart...");
            setTimeout(() => startWakeWordListener(), 2000);
          }
        }
      };

      // Start the recognition
      recognition.start();
      recognitionRef.current = recognition;
      setStatus(`Listening for wake word: "${wakeWord}"`);
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setError(error.message);
      setStatus("Speech recognition failed to start");
    }
  };

  // 2. Enhanced command recording with feedback and progress
  const recordCommand = async () => {
    try {
      // Stop any ongoing recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      setupAudioVisualization(stream);

      // Configure media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup recording timer
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxRecordingTime) {
            clearInterval(recordingTimerRef.current);
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "recording"
            ) {
              mediaRecorderRef.current.stop();
            }
            return maxRecordingTime;
          }
          return prev + 1;
        });
      }, 1000);

      // Handle recording data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording completion
      mediaRecorder.onstop = async () => {
        clearInterval(recordingTimerRef.current);

        if (audioChunksRef.current.length === 0) {
          resetListener("No audio recorded. Please try again.");
          return;
        }

        setStatus("Processing your command...");
        setProcessingCommand(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          // Send to Whisper API
          const response = await axios.post(
            "https://api-inference.huggingface.co/models/openai/whisper-small",
            audioBlob,
            {
              headers: {
                Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
                "Content-Type": "audio/webm",
              },
              timeout: 10000, // 10 second timeout
            }
          );

          const text =
            response.data.text || "Sorry, I couldn't understand that.";
          setTranscript(text);

          // Generate a response (in a real app, you'd call a chatbot API here)
          const simulatedResponse = generateResponse(text);
          setResponseText(simulatedResponse);

          setModalOpen(true);
          setStatus("Command processed successfully");
        } catch (error) {
          console.error("Error processing audio:", error);
          setError(`Error processing command: ${error.message}`);
        } finally {
          setProcessingCommand(false);
          resetListener();
        }
      };

      // Start recording
      mediaRecorder.start();
      setStatus("Listening for your command...");

      // Auto stop after max recording time
      setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
        }
      }, maxRecordingTime * 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setError(`Microphone error: ${error.message}`);
      resetListener();
    }
  };

  // Reset to wake word listening state
  const resetListener = (errorMsg = null) => {
    setWakeWordDetected(false);
    if (errorMsg) setError(errorMsg);

    // Clean up timers
    clearInterval(recordingTimerRef.current);

    // Restart wake word detection after a short delay
    setTimeout(() => {
      startWakeWordListener();
    }, 1000);
  };

  // Simulate response generation (in a real app, you'd call an API)
  const generateResponse = (input) => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return "Hello! How can I assist you today?";
    } else if (lowerInput.includes("time")) {
      return `The current time is ${new Date().toLocaleTimeString()}.`;
    } else if (lowerInput.includes("weather")) {
      return "I'm sorry, I don't have access to weather data yet.";
    } else if (lowerInput.includes("name")) {
      return "I'm Audica, your voice assistant.";
    } else if (lowerInput.includes("thank")) {
      return "You're welcome! Is there anything else I can help with?";
    } else {
      return "I heard you, but I'm still learning how to respond to that. Is there something else I can help with?";
    }
  };

  // Initialize on component mount
  useEffect(() => {
    startWakeWordListener();

    // Cleanup on component unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log("Recognition wasn't running");
        }
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }

      clearInterval(recordingTimerRef.current);
      stopMicrophoneStream();
    };
  }, []);

  // Restart recognition when wake word changes
  useEffect(() => {
    if (listeningActive) {
      startWakeWordListener();
    }
  }, [wakeWord]);

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <div className="flex justify-between items-center">
        <Title level={3} className="m-0">
          <SoundOutlined className="mr-2" /> Audica Voice Assistant
        </Title>
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
        />
      </div>

      {/* Status display */}
      <div className="bg-gray-50 p-4 rounded-lg text-center">
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {error ? (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          ) : (
            <div className="flex flex-col items-center">
              <Tag
                color={listeningActive ? "processing" : "default"}
                className="mb-2"
              >
                {listeningActive ? "Active" : "Inactive"}
              </Tag>
              <Text strong>{status}</Text>
            </div>
          )}

          {/* Audio visualization */}
          {listeningActive && (
            <div className="w-full mt-2">
              <Progress
                percent={volume}
                status="active"
                showInfo={false}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                className="mb-0"
              />
            </div>
          )}

          {wakeWordDetected && (
            <div className="mt-2">
              <Text type="secondary">
                Recording command: {recordingTime}s / {maxRecordingTime}s
              </Text>
              <Progress
                percent={(recordingTime / maxRecordingTime) * 100}
                status="active"
                strokeColor="#f5222d"
              />
            </div>
          )}

          {processingCommand && (
            <div className="text-center">
              <Spin
                indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
              />
              <Text className="block mt-2">Processing your command...</Text>
            </div>
          )}
        </Space>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          type={listeningActive ? "primary" : "default"}
          icon={<AudioOutlined />}
          onClick={() => {
            if (listeningActive) {
              recognitionRef.current?.stop();
              stopMicrophoneStream();
              setListeningActive(false);
              setStatus("Listening paused");
            } else {
              startWakeWordListener();
            }
          }}
        >
          {listeningActive ? "Pause Listening" : "Start Listening"}
        </Button>

        <Button
          onClick={() => {
            setTranscript("How can I help you today?");
            setResponseText(
              "I'm listening for your commands. Try saying your wake word followed by a question!"
            );
            setModalOpen(true);
          }}
        >
          Show Example
        </Button>
      </div>

      {/* Settings Modal */}
      <Modal
        title="Voice Assistant Settings"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        footer={[
          <Button key="close" onClick={() => setSettingsOpen(false)}>
            Close
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <Text strong>Change Wake Word</Text>
            <div className="flex mt-2">
              <select
                className="border p-2 rounded flex-grow"
                value={wakeWord}
                onChange={(e) => setWakeWord(e.target.value)}
              >
                <option value="hey assistant">Hey Assistant</option>
                <option value="ok computer">OK Computer</option>
                <option value="audica">Audica</option>
                <option value="hey siri">Hey Siri</option>
                <option value="computer">Computer</option>
              </select>
            </div>
          </div>

          <div>
            <Text strong>Instructions</Text>
            <Paragraph className="mt-2">
              1. Say your selected wake word to activate the assistant
              <br />
              2. After the activation sound, speak your command
              <br />
              3. Wait for a response
            </Paragraph>
          </div>

          <Alert
            message="Note"
            description="This is a demo application. In a production environment, wake word detection should be handled with specialized libraries or dedicated wake word models for better accuracy."
            type="info"
            showIcon
          />
        </div>
      </Modal>

      {/* Response Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <SoundOutlined className="mr-2 text-blue-500" />
            <span>Voice Assistant</span>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={500}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <Text strong>I heard:</Text>
            <Paragraph className="mt-1 italic">{transcript}</Paragraph>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <Text strong>Response:</Text>
            <Paragraph className="mt-1">{responseText}</Paragraph>
          </div>
        </div>
      </Modal>
    </div>
  );
}
