import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

const StartScreen = () => {
  const navigate = useNavigate();
  const controls = useAnimation();
  const [animationComplete, setAnimationComplete] = useState(false);

  // Handler for login button click
  const handleLoginClick = () => {
    // Animate out before navigation
    controls
      .start({
        opacity: 0,
        y: -30,
        transition: { duration: 0.5 },
      })
      .then(() => {
        navigate("/login");
      });
  };

  // After initial animation completes, show login button
  const handleAnimationComplete = () => {
    setAnimationComplete(true);
  };

  // Custom loader animation with dots
  const LoaderDots = () => (
    <div className="flex space-x-4 justify-center items-center">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-4 h-4 rounded-full bg-gradient-to-br from-white to-blue-100"
          initial={{ scale: 0 }}
          animate={{
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: index * 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  );

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-700 via-purple-800 to-indigo-900 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      {/* Enhanced background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-transparent to-black opacity-30"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* Animated particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              boxShadow: "0 0 10px 2px rgba(255,255,255,0.3)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, Math.random() * 0.5 + 0.3, 0],
              scale: [0, 1, 0],
              y: [0, -Math.random() * 200 - 50],
            }}
            transition={{
              duration: Math.random() * 6 + 6,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Larger blurred circles for depth */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`blur-${i}`}
            className="absolute rounded-full bg-purple-500 blur-3xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              opacity: 0.07,
            }}
            animate={{
              x: [0, Math.random() * 40 - 20],
              y: [0, Math.random() * 40 - 20],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content with animations */}
      <AnimatePresence>
        <motion.div
          className="relative z-10 flex flex-col items-center"
          animate={controls}
        >
          {/* Logo with enhanced glow effect */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
            }}
            onAnimationComplete={handleAnimationComplete}
          >
            <motion.h1
              className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white"
              initial={{ scale: 0.8 }}
              animate={{
                scale: 1.2,
                transition: {
                  delay: 0.8,
                  duration: 1.2,
                  ease: [0.22, 1, 0.36, 1],
                },
              }}
              whileHover={{
                scale: 1.25,
                transition: { duration: 0.3 },
              }}
            >
              <motion.span
                animate={{
                  y: animationComplete ? -60 : 0,
                  transition: {
                    delay: 2.8,
                    duration: 1,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
              >
                Audica
              </motion.span>
            </motion.h1>

            {/* Shadow/glow effect under text */}
            <motion.div
              className="absolute top-1/2 left-1/2 w-full h-full -z-10"
              style={{
                transform: "translate(-50%, -50%)",
                filter: "blur(25px)",
                opacity: 0.6,
              }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.6, 0.4, 0.6],
                scale: [0.8, 1, 0.95, 1],
              }}
              transition={{
                opacity: {
                  delay: 1,
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
                scale: {
                  delay: 1,
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
            >
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
            </motion.div>
          </motion.div>

          {/* Tagline with staggered text reveal */}
          <motion.p
            className="mt-4 text-xl md:text-2xl font-semibold text-white overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              transition: {
                opacity: { delay: 1.5, duration: 0.8 },
                height: { delay: 1.5, duration: 0.5 },
              },
            }}
          >
            <motion.span
              className="inline-block"
              animate={{
                opacity: animationComplete ? 0 : 1,
                transition: { delay: 2.5, duration: 0.8 },
              }}
            >
              {"One Time Solution to Every Sales Problem"
                .split(" ")
                .map((word, i) => (
                  <motion.span
                    key={i}
                    className="inline-block mr-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        delay: 1.5 + i * 0.1,
                        duration: 0.4,
                      },
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
            </motion.span>
          </motion.p>

          {/* Animated rings around the logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute rounded-full border border-white"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "100%",
                  height: "100%",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 0.3, 0],
                  scale: [0.5, i * 1.2 + 0.8],
                  transition: {
                    duration: 3 + i,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut",
                  },
                }}
              />
            ))}
          </div>

          {/* Loader that transitions to button */}
          <AnimatePresence mode="wait">
            {!animationComplete ? (
              <motion.div
                key="loader"
                className="mt-20"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { delay: 1, duration: 0.5 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.3 },
                }}
              >
                <LoaderDots />
              </motion.div>
            ) : (
              <motion.div
                key="button"
                className="mt-32"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.6,
                    delay: 0.2,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
              >
                <motion.button
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 20px 5px rgba(129, 140, 248, 0.5)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLoginClick}
                >
                  Get Started
                </motion.button>

                {/* Button glow effect */}
                <motion.div
                  className="absolute -z-10 w-full h-full rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    filter: "blur(15px)",
                    opacity: 0.4,
                  }}
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                    scale: [0.8, 1.1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-full h-full bg-indigo-500 rounded-full" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default StartScreen;

// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // Import useNavigate from React Router
// import Loader from '../Loaders/Loader';

// const StartScreen = () => {
//   const [showText, setShowText] = useState(false);
//   const [fadeOutTagline, setFadeOutTagline] = useState(false);
//   const [moveToTop, setMoveToTop] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const textTimer = setTimeout(() => setShowText(true), 500); // Show text initially
//     const taglineFadeTimer = setTimeout(() => setFadeOutTagline(true), 2500); // Trigger fade-out for tagline
//     const moveTextTimer = setTimeout(() => setMoveToTop(true), 3500); // Move "Audica" up after tagline fades out

//     // Timer for loader display duration before navigation
//     const navigationTimer = setTimeout(() => {
//       navigate('/login'); // Change '/nextComponent' to your target route
//     }, 5500); // Adjust total duration if needed (e.g., 2 seconds after loader shows)

//     return () => {
//       clearTimeout(textTimer);
//       clearTimeout(taglineFadeTimer);
//       clearTimeout(moveTextTimer);
//       clearTimeout(navigationTimer);
//     };
//   }, [navigate]);

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 to-purple-600">
//       <h1
//         className={`text-6xl py-5 md:text-8xl font-extrabold text-white transform transition duration-1000 ${
//           showText ? 'opacity-100 scale-150' : 'opacity-0 scale-75'
//         } ${moveToTop ? 'translate-y-[-110px]' : ''}`}
//       >
//         Audica
//       </h1>
//       <p
//         className={`mt-4 text-xl md:text-2xl font-semibold text-white transition-opacity duration-1000 ${
//           showText ? 'opacity-100' : 'opacity-0'
//         } ${fadeOutTagline ? 'opacity-0 invisible' : ''}`}
//       >
//         One Time Solution to Every Sales Problem
//       </p>
//       <div className={`pt-40 transition-opacity duration-1000 ${moveToTop ? 'opacity-100' : 'opacity-0'}`}>
//         <Loader />
//       </div>
//     </div>
//   );
// };

// export default StartScreen;
