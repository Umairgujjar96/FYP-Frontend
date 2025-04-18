import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaMicrophone } from "react-icons/fa";

const VoiceButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      className="group relative flex items-center bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-semibold rounded-full shadow-lg px-3 py-2 overflow-visible"
      whileHover={{
        scale: 1.05,
        boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-blue-600 blur-md -z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isHovered ? 0.6 : 0,
          scale: isHovered ? 1.2 : 0.8,
        }}
        transition={{ duration: 0.4 }}
      />

      <motion.div className="relative w-8 h-8 flex items-center justify-center">
        {/* Enhanced 7-color gradient ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(
              from 0deg,
              #f43f5e, /* Red */
              #f97316, /* Orange */
              #facc15, /* Yellow */
              #22c55e, /* Green */
              #3b82f6, /* Blue */
              #6366f1, /* Indigo */
              #a855f7, /* Purple */
              #f43f5e  /* Back to Red */
            )`,
            backgroundSize: "200% 200%",
            boxShadow: isHovered
              ? "0 0 10px rgba(59, 130, 246, 0.7), inset 0 0 6px rgba(255, 255, 255, 0.7)"
              : "0 0 5px rgba(59, 130, 246, 0.5), inset 0 0 3px rgba(255, 255, 255, 0.5)",
            border: "2px solid transparent",
            padding: "2px",
          }}
          initial={{ opacity: 0.8 }}
          animate={{
            opacity: isHovered ? 1 : 0.8,
            rotate: 360,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{
            rotate: {
              repeat: Infinity,
              duration: isHovered ? 8 : 12,
              ease: "linear",
            },
            opacity: { duration: 0.3 },
            scale: { duration: 0.4, type: "spring" },
          }}
        />

        {/* Inner circle backdrop - now with gradient */}
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: "4px",
            background: "linear-gradient(145deg, #3b82f6, #1e40af)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
          }}
          animate={{
            scale: isHovered ? 0.85 : 0.9,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Highlight effect on circle */}
        <motion.div
          className="absolute rounded-full bg-white opacity-20"
          style={{
            width: "50%",
            height: "20%",
            top: "20%",
            left: "25%",
            filter: "blur(2px)",
          }}
          animate={{
            opacity: isHovered ? 0.3 : 0.2,
          }}
        />

        {/* Icon with enhanced animation */}
        <motion.div
          className="relative z-10 text-white"
          initial={{ scale: 1 }}
          animate={{
            scale: isHovered ? [1, 1.2, 1.15] : 1,
            rotate: isHovered ? [0, -10, 10, -5, 0] : 0,
          }}
          transition={{
            scale: { duration: 0.5, times: [0, 0.6, 1] },
            rotate: { duration: 0.5, ease: "easeInOut" },
          }}
        >
          <FaMicrophone />
        </motion.div>
      </motion.div>

      {/* Enhanced text container with motion */}
      <motion.div
        className="overflow-hidden ml-2"
        initial={{ width: "0px" }}
        animate={{ width: isHovered ? "auto" : "0px" }}
        transition={{
          duration: 0.6,
          ease: [0.16, 1.0, 0.3, 1.0], // Enhanced custom easing
        }}
      >
        <motion.span
          className="whitespace-nowrap block font-medium tracking-wide"
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            x: isHovered ? 0 : -20,
          }}
          transition={{
            duration: 0.4,
            delay: isHovered ? 0.15 : 0,
          }}
        >
          Open Voice Modal
        </motion.span>
      </motion.div>

      {/* Enhanced animated particles with variation */}
      {isHovered && (
        <>
          {[...Array(5)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                background: i % 2 === 0 ? "white" : "#a5f3fc",
                width: 2 + (i % 3) * 2,
                height: 2 + (i % 3) * 2,
                left: `${48 + (i - 2) * 5}%`,
                top: "25%",
              }}
              initial={{ y: 0, opacity: 0.7 }}
              animate={{
                y: -20 - i * 5,
                opacity: [0.7, 0.5, 0],
                x: (i % 2 === 0 ? 5 : -5) * (i % 3),
              }}
              transition={{
                duration: 0.8 + i * 0.2,
                repeat: Infinity,
                repeatDelay: 0.2 * i,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      {/* Ripple effect when button is tapped */}
      <motion.span
        className="absolute inset-0 rounded-full bg-white"
        initial={{ opacity: 0, scale: 0 }}
        whileTap={{ opacity: [0, 0.15, 0], scale: 1.5 }}
        transition={{ duration: 0.5 }}
      />
    </motion.button>
  );
};

export default VoiceButton;
