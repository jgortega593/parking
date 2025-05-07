// src/components/Loader.jsx
import React from 'react'

export default function Loader({ fullScreen = false, text = "⏳ Cargando..." }) {
  const loaderStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: fullScreen ? '100vh' : '120px',
    width: '100%',
    background: fullScreen ? '#f5f6fa' : 'transparent',
    position: fullScreen ? 'fixed' : 'static',
    top: 0,
    left: 0,
    zIndex: 9999,
  }

  const spinnerStyle = {
    width: '48px',
    height: '48px',
    border: '6px solid #e0e0e0',
    borderTop: '6px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem'
  }

  return (
    <div style={loaderStyle}>
      <div style={spinnerStyle}>
        <span role="img" aria-label="reloj de arena" style={{ position: 'absolute', fontSize: '2.2rem', marginTop: 2 }}>
          ⏳
        </span>
      </div>
      <span style={{ color: '#2c3e50', fontWeight: 'bold', fontSize: '1.1rem' }}>{text}</span>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </div>
  )
}
