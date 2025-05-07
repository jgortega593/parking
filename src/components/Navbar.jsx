// src/components/Navbar.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import MenuDesplegable from './MenuDesplegable'

export default function Navbar() {
  return (
    <nav className="navbar flex items-center justify-between px-6 py-4 bg-blue-700 text-white shadow-lg">
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-2xl font-bold hover:text-blue-200 transition-colors flex items-center gap-2">
          <span role="img" aria-label="Casa">🏠</span>
          Conjunto Habitacional
        </Link>
      </div>
      <MenuDesplegable />
    </nav>
  )
}
