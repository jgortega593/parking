// src/components/SelectorDeFoto.jsx
import React, { useState } from 'react'
import CapturaCamara from './CapturaCamara'

export default function SelectorDeFoto({ onFileSelected }) {
  const [modo, setModo] = useState('camara') // 'camara' o 'galeria'

  const handleFile = file => {
    onFileSelected(file)
  }

  return (
    <div className="selector-foto">
      <div className="modos-seleccion">
        <button
          type="button"
          onClick={() => setModo('camara')}
          className={modo === 'camara' ? 'active' : ''}
        >
          📸 Usar Cámara
        </button>
        <button
          type="button"
          onClick={() => setModo('galeria')}
          className={modo === 'galeria' ? 'active' : ''}
        >
          🖼️ Subir Archivo
        </button>
      </div>

      {modo === 'camara' ? (
        <CapturaCamara onCaptura={handleFile} />
      ) : (
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0])
            }
          }}
        />
      )}
    </div>
  )
}
