import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  
  <StrictMode>
<BrowserRouter>
    <App />
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        className: '',
        duration: 5000,
        style: {
          borderRadius: '10px',  // Rounded corners for a modern look
          padding: '12px 20px',
          fontSize: '16px',
          fontFamily: 'Inter, sans-serif',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          opacity: 0.95,
        },

        // Success Toast
        success: {
          duration: 3000,
          style: {
            background: 'linear-gradient(45deg, #4F46E5, #7C3AED)',  // Gradient from-indigo-500 to-purple-600
            color: '#fff',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
            padding: '12px 20px',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
          },
          icon: '✔️', // Success icon
        },

        // Error Toast
        error: {
          duration: 3000,
          style: {
            background: 'linear-gradient(45deg, #4F46E5, #7C3AED)',  // Gradient from-indigo-500 to-purple-600
            color: '#fff',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)',
            padding: '12px 20px',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
          },
          icon: '❌', // Error icon
        },

        // Loading Toast (optional)
        loading: {
          duration: 3000,
          style: {
            background: 'linear-gradient(45deg, #ffa500, #ffcc00)', // Loading gradient
            color: '#fff',
            borderRadius: '10px',
            padding: '12px 20px',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 12px rgba(255, 165, 0, 0.2)',
          },
          icon: '⏳', // Loading icon
        },
      }}
    />
    </BrowserRouter>
  </StrictMode>,
)
