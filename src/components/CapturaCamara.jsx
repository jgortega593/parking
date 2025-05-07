// src/components/CapturaCamara.jsx
import React, { useState, useEffect, useRef } from 'react'
import Emoji from './Emoji'

export default function CapturaCamara({ onCaptura }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)
  const [foto, setFoto] = useState(null)
  const [modoCamara, setModoCamara] = useState('environment')
  const [stream, setStream] = useState(null)

  // Iniciar cámara
  const iniciarCamara = async () => {
    try {
      const constraints = {
        video: {
          facingMode: modoCamara,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError(`Error de cámara: ${err.message}`)
    }
  }

  // Capturar foto
  const capturarFoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(blob => {
      const file = new File([blob], 'foto-capturada.jpg', { type: 'image/jpeg' })
      setFoto(URL.createObjectURL(file))
      onCaptura(file)
    }, 'image/jpeg', 0.9)
  }

  // Cambiar cámara frontal/trasera
  const cambiarCamara = () => {
    setModoCamara(prev => prev === 'user' ? 'environment' : 'user')
  }

  useEffect(() => {
    iniciarCamara()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
    // eslint-disable-next-line
  }, [modoCamara])

  if (error) return (
    <div className="error-camara">
      <Emoji symbol="📷" /> {error}
      <div style={{ fontSize: 14, marginTop: 8 }}>
        Asegúrate de permitir el acceso a la cámara
      </div>
    </div>
  )

  return (
    <div className="contenedor-camara">
      {!foto ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              maxWidth: '400px',
              borderRadius: '12px',
              transform: modoCamara === 'user' ? 'scaleX(-1)' : 'none'
            }}
          />

          <div className="controles-camara">
            <button
              type="button"
              onClick={capturarFoto}
              className="btn-capturar"
            >
              <Emoji symbol="📸" /> Capturar
            </button>

            <button
              type="button"
              onClick={cambiarCamara}
              className="btn-cambiar-camara"
            >
              <Emoji symbol="🔄" /> Cambiar
            </button>
          </div>
        </>
      ) : (
        <>
          <img
            src={foto}
            alt="Previsualización"
            style={{
              width: '100%',
              maxWidth: '400px',
              borderRadius: '12px',
              border: '2px solid #e0e0e0'
            }}
          />

          <div className="acciones-foto">
            <button
              type="button"
              onClick={() => setFoto(null)}
              className="btn-reintentar"
            >
              <Emoji symbol="🔄" /> Volver a tomar
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
