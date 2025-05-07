// src/components/Auth.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Loader from './Loader'

export default function Auth() {
  const [usuarios, setUsuarios] = useState([])
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')

  useEffect(() => {
    let ignore = false
    async function fetchUsuarios() {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('usuarios_app')
        .select('email, rol, activo')
        .eq('activo', true)
        .order('email', { ascending: true })
      if (!ignore) {
        if (error) setError('Error al cargar usuarios: ' + error.message)
        setUsuarios(data || [])
        setLoading(false)
      }
    }
    fetchUsuarios()
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    const user = usuarios.find(u => u.email === email)
    setRol(user?.rol || '')
  }, [email, usuarios])

  // Paso 1: Enviar OTP al email
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    if (!email) {
      setError('Debe seleccionar un email')
      setSending(false)
      return
    }
    localStorage.setItem('tempRol', rol)
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { rol }
      }
    })
    if (authError) setError('Error: ' + authError.message)
    else setOtpSent(true)
    setSending(false)
  }

  // Paso 2: Verificar OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    })
    if (verifyError) setError('Código inválido o expirado')
    setSending(false)
  }

  if (loading) return <Loader text="Cargando usuarios..." />

  return (
    <div className="auth-container" style={{
      maxWidth: 340,
      margin: '0 auto',
      padding: 32,
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 12px #6c63ff22'
    }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 24 }}>🔐 Acceso Usuario</h1>
      {!otpSent ? (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label>
            Email autorizado:
            <select
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                padding: 12,
                borderRadius: 8,
                border: '1px solid #d1c4e9',
                fontSize: 16,
                backgroundColor: '#fff',
                marginTop: 6
              }}
            >
              <option value="">Seleccione su email...</option>
              {usuarios.map(u => (
                <option key={u.email} value={u.email}>{u.email}</option>
              ))}
            </select>
          </label>
          <label>
            Rol:
            <input
              type="text"
              value={rol}
              disabled
              style={{
                padding: 12,
                borderRadius: 8,
                border: '1px solid #d1c4e9',
                fontSize: 16,
                backgroundColor: '#f5f5f5',
                marginTop: 6
              }}
            />
          </label>
          <button
            disabled={sending || !email}
            style={{
              padding: '12px 0',
              borderRadius: 8,
              background: 'linear-gradient(90deg, #6c63ff 60%, #ff6f91 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              border: 'none',
              cursor: sending ? 'wait' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {sending ? 'Enviando...' : '📩 Enviar código'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label>
            Ingrese el código recibido en su email:
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              maxLength={6}
              style={{
                padding: 12,
                borderRadius: 8,
                border: '1px solid #d1c4e9',
                fontSize: 16,
                backgroundColor: '#fff',
                marginTop: 6,
                letterSpacing: 3,
                textAlign: 'center'
              }}
            />
          </label>
          <button
            disabled={sending || !otp}
            style={{
              padding: '12px 0',
              borderRadius: 8,
              background: 'linear-gradient(90deg, #6c63ff 60%, #ff6f91 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              border: 'none',
              cursor: sending ? 'wait' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {sending ? 'Verificando...' : '🔓 Ingresar'}
          </button>
          <button
            type="button"
            onClick={() => { setOtpSent(false); setOtp('') }}
            style={{
              background: 'none',
              color: '#6c63ff',
              border: 'none',
              marginTop: 8,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Volver a enviar código
          </button>
        </form>
      )}
      {error && (
        <div style={{ color: 'red', marginTop: 10, fontWeight: 600 }}>
          {error}
        </div>
      )}
      <div style={{ fontSize: 13, color: '#888', marginTop: 18 }}>
        Solo emails autorizados y activos pueden ingresar.
      </div>
      <div
        style={{
          marginTop: 14,
          background: '#fffbe6',
          color: '#b26d00',
          border: '1px solid #ffe58f',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 14,
          fontWeight: 600
        }}
      >
        ⚠️ Para agregar un usuario, primero debe ingresar con un usuario <b>administrador</b>.
      </div>
    </div>
  )
}
