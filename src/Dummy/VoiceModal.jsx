import { useEffect, useState } from "react";
import { Modal, Input, Typography } from "antd";
import Fuse from "fuse.js";

const { Text } = Typography;

const medicines = ["xaradol", "panadol", "paracetamol", "ibuprofen"];

const fuse = new Fuse(medicines, {
  includeScore: true,
  threshold: 0.4,
});

const detectIntent = (text) => {
  const lowered = text.toLowerCase();
  if (lowered.includes("search")) return "search";
  if (lowered.includes("add to cart")) return "add_to_cart";
  if (lowered.includes("clear cart")) return "clear_cart";
  return "unknown";
};

const extractMedicineName = (text) => {
  const cleaned = text
    .toLowerCase()
    .replace(/search|add to cart|clear cart/g, "")
    .trim();
  const result = fuse.search(cleaned);
  return result[0]?.item || "Not Found";
};

export default function VoiceCommandModal({ open, onClose, voiceInput }) {
  const [intent, setIntent] = useState("");
  const [matchedMedicine, setMatchedMedicine] = useState("");

  useEffect(() => {
    if (voiceInput) {
      const detectedIntent = detectIntent(voiceInput);
      const medicine = extractMedicineName(voiceInput);
      setIntent(detectedIntent);
      setMatchedMedicine(medicine);
    }
  }, [voiceInput]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      title="Voice Command Result"
      centered
    >
      <div className="space-y-4">
        <div>
          <Text className="block text-base text-gray-500">
            Original Voice Input:
          </Text>
          <Input value={voiceInput} readOnly />
        </div>
        <div>
          <Text className="block text-base text-gray-500">
            Detected Intent:
          </Text>
          <Text className="text-lg font-semibold capitalize">{intent}</Text>
        </div>
        <div>
          <Text className="block text-base text-gray-500">
            Matched Medicine:
          </Text>
          <Text className="text-lg font-semibold capitalize">
            {matchedMedicine}
          </Text>
        </div>
      </div>
    </Modal>
  );
}
