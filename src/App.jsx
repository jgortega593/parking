// src/App.jsx
import { useState, useEffect, Suspense, lazy } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import RegistroParqueo from './components/RegistroParqueo'
// import ResumenRegistros from './components/ResumenRegistros' // Ya no se usa aquí
import Loader from './components/Loader'
import parqueaderoImg from './images/parqueadero.jpg'
import MenuDesplegable from './components/MenuDesplegable'
import Emoji from './components/Emoji'
import './styles/global.css'

// Lazy loading para módulos secundarios
const Consultas = lazy(() => import('./components/Consultas'))
const ResumenRecaudo = lazy(() => import('./components/ResumenRecaudo'))
const GestionCopropietarios = lazy(() => import('./components/GestionCopropietarios'))
const DescargoGestion = lazy(() => import('./components/DescargoGestion'))
const AcercaDe = lazy(() => import('./components/AcercaDe'))
const GestionUsuarios = lazy(() => import('./GestionUsuarios'))

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return isOnline
}

export default function App() {
  const [session, setSession] = useState(null)
  const [usuarioApp, setUsuarioApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentView, setCurrentView] = useState('registro')
  const [registrosFiltrados, setRegistrosFiltrados] = useState([])

  // Tema (oscuro/claro)
  const getInitialTheme = () => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  const [theme, setTheme] = useState(getInitialTheme)

  const isOnline = useOnlineStatus()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    let ignore = false
    const getSessionAndUsuario = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        setSession(session)
        if (session?.user) {
          const { data: usuario, error: userError } = await supabase
            .from('usuarios_app')
            .select('*')
            .eq('email', session.user.email)
            .single()
          if (userError) throw userError
          if (!ignore) setUsuarioApp(usuario)
        }
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    getSessionAndUsuario()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      getSessionAndUsuario()
    })

    return () => {
      ignore = true
      subscription?.unsubscribe()
    }
  }, [])

  if (loading) return <Loader fullScreen text="⏳ Cargando la experiencia..." />

  return (
    <div className="app-root" style={{ minHeight: '100vh', transition: 'background 0.3s' }}>
      <header className="header-gradient">
        <div className="topbar-center">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: isOnline ? '#e6f9f3' : '#fff3cd',
              color: isOnline ? '#10b981' : '#856404',
              border: isOnline ? '1.5px solid #10b981' : '1.5px solid #f59e42',
              borderRadius: 8,
              padding: '3px 14px',
              fontWeight: 700,
              fontSize: '1em',
              marginRight: 18,
              minWidth: 110,
              boxShadow: isOnline ? '0 2px 6px #10b98122' : '0 2px 6px #f59e4222',
              transition: 'all 0.3s'
            }}
            aria-live="polite"
          >
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: isOnline ? '#10b981' : '#f59e42',
                marginRight: 7,
                border: '2px solid #fff'
              }}
            />
            {isOnline
              ? <><Emoji symbol="🟢" label="En línea" /> <b>En línea</b> <Emoji symbol="🔗" label="Conectado" /></>
              : <><Emoji symbol="🟠" label="Sin conexión" /> <b>Sin conexión</b> <Emoji symbol="⚡" label="Desconectado" /></>}
          </div>
          <button
            className="theme-toggle"
            aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Cambiar tema"
            type="button"
            style={{ marginLeft: 8 }}
          >
            {theme === 'dark'
              ? <><Emoji symbol="🌞" label="Modo claro" /> <span style={{ fontWeight: 600 }}>Claro</span></>
              : <><Emoji symbol="🌙" label="Modo oscuro" /> <span style={{ fontWeight: 600 }}>Oscuro</span></>}
          </button>
          <span className="barra-vertical" />
          {session && usuarioApp && (
            <>
              <span className="user-info">
                <Emoji symbol="👤" label="Usuario" /> <b>{usuarioApp.nombre}</b>
                <span className="rol-badge">({usuarioApp.rol === 'admin' ? <><Emoji symbol="👑" /> Admin</> : <><Emoji symbol="📝" /> Registrador</>})</span>
              </span>
              <span className="barra-vertical" />
              <button
                className="logout-btn"
                onClick={async () => {
                  await supabase.auth.signOut()
                  setUsuarioApp(null)
                  setSession(null)
                }}
              >
                <Emoji symbol="🚪" label="Cerrar sesión" /> Salir
              </button>
            </>
          )}
        </div>
        <div className="header-content">
          <h1 className="conjunto-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Emoji symbol="🏡" label="Conjunto" /> <span>CONJUNTO HABITACIONAL THOMAS II</span> <Emoji symbol="⭐" label="Estrella" />
          </h1>
          <div
            className="subtitle"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18
            }}
          >
            <img
              src={parqueaderoImg}
              alt="Parqueadero"
              style={{
                height: 152,
                width: 'auto',
                maxWidth: '100%',
                borderRadius: 16,
                marginRight: 12,
                boxShadow: '0 2px 12px #0002',
                objectFit: 'contain'
              }}
            />
            <span>
              <Emoji symbol="🚗" label="Parqueo" /> <b>Gestión de Parqueaderos Comunales</b> <Emoji symbol="🅿️" label="Parking" />
            </span>
          </div>
        </div>
      </header>

      {/* Menú principal */}
      <MenuDesplegable
        currentView={currentView}
        setCurrentView={setCurrentView}
        usuarioApp={usuarioApp}
      />

      {error && (
        <div className="error-banner">
          <Emoji symbol="❗" label="Error" /> <b>Error:</b> {error} <Emoji symbol="😢" label="Triste" />
          <button onClick={() => setError(null)} className="close-error">
            <Emoji symbol="✖️" label="Cerrar" />
          </button>
        </div>
      )}

      <main className="main-content">
        {!session ? (
          <Auth />
        ) : (
          <>
            {currentView === 'registro' ? (
              usuarioApp && usuarioApp.id ? (
                <>
                  <RegistroParqueo
                    usuarioApp={usuarioApp}
                    onRegistroExitoso={() => setRefreshKey(prev => prev + 1)}
                  />
                  {/* ResumenRegistros quitado aquí para no mostrar el resumen debajo del botón */}
                </>
              ) : (
                <Loader text="⏳ Cargando usuario..." />
              )
            ) : (
              <Suspense fallback={<Loader text="🚀 Cargando módulo..." />}>
                {currentView === 'consulta' ? (
                  <Consultas />
                ) : currentView === 'recaudo' ? (
                  <ResumenRecaudo refreshKey={refreshKey} />
                ) : currentView === 'descargo' ? (
                  <DescargoGestion />
                ) : currentView === 'acerca' ? (
                  <AcercaDe />
                ) : currentView === 'copropietarios' ? (
                  <GestionCopropietarios />
                ) : currentView === 'usuarios' && usuarioApp?.rol === 'admin' ? (
                  <GestionUsuarios usuarioActual={usuarioApp} />
                ) : null}
              </Suspense>
            )}
          </>
        )}
      </main>
      <footer className="footer" style={{
        fontSize: 16,
        padding: 18,
        background: 'linear-gradient(90deg,#6366f1 0%,#38bdf8 100%)',
        color: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: 40,
        boxShadow: '0 -2px 12px #6366f144'
      }}>
        <Emoji symbol="💡" label="Innovación" /> {new Date().getFullYear()} &mdash; <b>CONJUNTO HABITACIONAL THOMAS II</b>
        <span style={{ marginLeft: 8 }}>
          <Emoji symbol="❤️" label="amor" /> Desarrollado con pasión y tecnología <Emoji symbol="🚀" label="Rocket" />
        </span>
      </footer>
    </div>
  )
}
