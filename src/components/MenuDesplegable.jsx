// src/components/MenuDesplegable.jsx
import React, { useState, useEffect, useRef } from 'react'
import Emoji from './Emoji'

export default function MenuDesplegable({ currentView, setCurrentView, usuarioApp }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Opciones del menú
  const menuItems = [
    { emoji: '📝', label: 'Registro', key: 'registro' },
    { emoji: '🔎', label: 'Consultas', key: 'consulta' },
    { emoji: '💰', label: 'Recaudación', key: 'recaudo' },
    { emoji: '👥', label: 'Copropietarios', key: 'copropietarios' },
    { emoji: '📤', label: 'Descargo Gestión', key: 'descargo' },
    { emoji: 'ℹ️', label: 'Acerca de', key: 'acerca' },
    ...(usuarioApp?.rol === 'admin'
      ? [{ emoji: '👤', label: 'Usuarios', key: 'usuarios' }]
      : [])
  ]

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="menu-container relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="menu-button flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 shadow-lg"
      >
        <Emoji symbol="☰" label="Menú" className="mr-2" />
        <span className="font-semibold">Menú Principal</span>
      </button>

      {isOpen && (
        <div className="menu-dropdown absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50">
          <div className="p-2 space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentView(item.key)
                  setIsOpen(false)
                }}
                className={`flex items-center px-4 py-3 text-gray-800 hover:bg-blue-50 rounded-lg transition-colors duration-200 w-full text-left ${
                  currentView === item.key ? 'bg-blue-100 font-semibold' : ''
                }`}
                type="button"
              >
                <span className="text-xl mr-3"><Emoji symbol={item.emoji} /></span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
