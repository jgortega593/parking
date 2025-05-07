import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Loader from "./components/Loader"
import Emoji from './components/Emoji'

export default function GestionUsuarios({ usuarioActual }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState({ open: false, usuario: null })
  const [form, setForm] = useState({ email: '', nombre: '', rol: 'registrador', activo: true })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Leer usuarios
  const fetchUsuarios = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('usuarios_app')
      .select('id, email, nombre, rol, activo')
      .order('email', { ascending: true })
    if (error) setError(error.message)
    else setUsuarios(data)
    setLoading(false)
  }

  useEffect(() => { fetchUsuarios() }, [])

  // Abrir modal para editar
  const handleEdit = (usuario) => {
    setForm({
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      activo: usuario.activo
    })
    setModal({ open: true, usuario })
  }

  // Abrir modal para crear
  const handleNew = () => {
    setForm({ email: '', nombre: '', rol: 'registrador', activo: true })
    setModal({ open: true, usuario: null })
  }

  // Guardar usuario (crear o editar)
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    if (!form.email || !form.nombre || !form.rol) {
      setError('Todos los campos son obligatorios')
      setSaving(false)
      return
    }
    try {
      if (modal.usuario) {
        // Editar
        const { error } = await supabase
          .from('usuarios_app')
          .update({
            email: form.email.trim().toLowerCase(),
            nombre: form.nombre,
            rol: form.rol,
            activo: form.activo
          })
          .eq('id', modal.usuario.id)
        if (error) throw error
      } else {
        // Crear
        const { error } = await supabase
          .from('usuarios_app')
          .insert([{ ...form, email: form.email.trim().toLowerCase() }])
        if (error) throw error
      }
      setModal({ open: false, usuario: null })
      fetchUsuarios()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Eliminar usuario
  const handleDelete = async (usuario) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return
    setDeleting(true)
    setError(null)
    try {
      if (usuario.id === usuarioActual.id) {
        setError('No puedes eliminar tu propio usuario.')
        setDeleting(false)
        return
      }
      const { error } = await supabase
        .from('usuarios_app')
        .delete()
        .eq('id', usuario.id)
      if (error) throw error
      fetchUsuarios()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loader text="Cargando usuarios..." />

  return (
    <div className="gestion-usuarios-container">
      <h2>
        <Emoji symbol="👥" label="Usuarios" /> Gestión de Usuarios
      </h2>
      <button className="edit-btn" onClick={handleNew} style={{ marginBottom: 18 }}>
        <Emoji symbol="➕" /> Nuevo usuario
      </button>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
        <Emoji symbol="⚠️" /> Solo usuarios <b>administrador</b> pueden agregar, editar o eliminar usuarios.
      </div>
      <table className="resultados-table" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th><Emoji symbol="✉️" label="Email" /> Email</th>
            <th><Emoji symbol="🧑" label="Nombre" /> Nombre</th>
            <th><Emoji symbol="🎖️" label="Rol" /> Rol</th>
            <th><Emoji symbol="✔" label="Activo" /> Activo</th>
            <th><Emoji symbol="⚙️" label="Acciones" /> Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.nombre}</td>
              <td>
                {u.rol === 'admin' ? <><Emoji symbol="👑" /> Administrador</> : <><Emoji symbol="📋" /> Registrador</>}
              </td>
              <td>{u.activo ? <Emoji symbol="✔" /> : <Emoji symbol="❌" />}</td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(u)} title="Editar">
                  <Emoji symbol="✏️" label="Editar" />
                </button>
                <button className="delete-btn" onClick={() => handleDelete(u)} title="Eliminar" disabled={deleting || u.id === usuarioActual.id}>
                  <Emoji symbol="🗑️" label="Eliminar" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <div className="error-message">{error}</div>}

      {/* Modal para crear/editar */}
      {modal.open && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>
              <Emoji symbol={modal.usuario ? "✏️" : "➕"} label={modal.usuario ? "Editar" : "Nuevo"} />{' '}
              {modal.usuario ? 'Editar' : 'Nuevo'} Usuario
            </h3>
            <form className="modal-form" onSubmit={handleSave}>
              <label>
                <Emoji symbol="✉️" /> Email:
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={!!modal.usuario}
                />
              </label>
              <label>
                <Emoji symbol="🧑" /> Nombre:
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </label>
              <label>
                <Emoji symbol="🎖️" /> Rol:
                <select
                  value={form.rol}
                  onChange={e => setForm({ ...form, rol: e.target.value })}
                  required
                >
                  <option value="admin">Administrador</option>
                  <option value="registrador">Registrador</option>
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => setForm({ ...form, activo: e.target.checked })}
                /> <Emoji symbol="✔" /> Usuario activo
              </label>
              <div style={{ marginTop: 14 }}>
                <button type="submit" className="save-btn" disabled={saving}>
                  <Emoji symbol="💾" /> Guardar
                </button>
                <button type="button" className="cancel-btn" onClick={() => setModal({ open: false, usuario: null })}>
                  <Emoji symbol="❌" /> Cancelar
                </button>
              </div>
              {error && <div className="error-message">{error}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
