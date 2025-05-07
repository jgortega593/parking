// src/components/RegistroParqueo.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import SelectorDeFoto from './SelectorDeFoto';
import { ReactMediaRecorder } from 'react-media-recorder';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Emoji from './Emoji';
import dayjs from 'dayjs';

function addToSyncQueue(operation) {
  const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
  queue.push({ ...operation, timestamp: new Date() });
  localStorage.setItem('syncQueue', JSON.stringify(queue));
}

const getToday = () => new Date();

const getPropiedadEmoji = (prop) => {
  if (/^(D|Depto|Depa)/i.test(prop)) return '🏢';
  if (/^(C|Casa)/i.test(prop)) return '🏠';
  return '🏘️';
};

export default function RegistroParqueo({ usuarioApp, onRegistroExitoso }) {
  const [placa, setPlaca] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState('carro');
  const [propiedad, setPropiedad] = useState('');
  const [unidadAsignada, setUnidadAsignada] = useState('');
  const [copropietarios, setCopropietarios] = useState([]);
  const [observaciones, setObservaciones] = useState('');
  const [fecha, setFecha] = useState(getToday());
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [foto, setFoto] = useState(null);
  const [gratis, setGratis] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [registrosUsuario, setRegistrosUsuario] = useState([]);
  const [editModal, setEditModal] = useState({ open: false, registro: null });
  const [editData, setEditData] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const inputPlacaRef = useRef(null);

  // Online status listener
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load copropietarios
  useEffect(() => {
    supabase
      .from('copropietarios')
      .select('id, nombre, propiedad, unidad_asignada')
      .then(({ data, error }) => {
        if (!error) setCopropietarios(data);
      });
  }, []);

  // Load last 10 registros by user
  useEffect(() => {
    if (!usuarioApp) return;
    supabase
      .from('registros_parqueadero')
      .select('*')
      .eq('usuario_id', usuarioApp.id)
      .order('fecha_hora_ingreso', { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (!error) setRegistrosUsuario(data);
      });
  }, [usuarioApp, loading]);

  const propiedades = [...new Set(copropietarios.map(c => c.propiedad))].sort();
  const unidadesFiltradas = propiedad
    ? [...new Set(copropietarios.filter(c => c.propiedad === propiedad).map(c => c.unidad_asignada))].sort((a, b) =>
        !isNaN(a) && !isNaN(b) ? Number(a) - Number(b) : a.localeCompare(b, undefined, { numeric: true }),
      )
    : [];

  const copropietarioSeleccionado = copropietarios.find(
    c => c.propiedad === propiedad && c.unidad_asignada === unidadAsignada,
  );

  // Handlers for photo and audio
  const handleFoto = (file) => setFoto(file);

  const handleAudioStop = async (blobUrl) => {
    setAudioUrl(blobUrl);
    const resp = await fetch(blobUrl);
    const blob = await resp.blob();
    setAudioBlob(blob);
  };

  // Submit new registro
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setLoading(true);

    const placaFormateada = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!placaFormateada) {
      setMensaje('La placa es obligatoria');
      setLoading(false);
      return;
    }
    if (!copropietarioSeleccionado) {
      setMensaje('Debe seleccionar propiedad y unidad asignada válidas.');
      setLoading(false);
      return;
    }

    let fotoUrl = null;
    let audioUrlFinal = null;

    if (foto) {
      const ext = foto.name.split('.').pop();
      const fileName = `${placaFormateada}_${Date.now()}.${ext}`;
      if (isOnline) {
        const { error: uploadError } = await supabase.storage.from('evidencias-parqueadero').upload(fileName, foto);
        if (uploadError) {
          setMensaje('Error al subir la foto: ' + uploadError.message);
          setLoading(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from('evidencias-parqueadero').getPublicUrl(fileName);
        fotoUrl = publicUrlData.publicUrl;
      } else {
        fotoUrl = 'pendiente-sync';
      }
    }

    if (audioBlob) {
      const fileName = `audio_obs_${placaFormateada}_${Date.now()}.webm`;
      if (isOnline) {
        const { error: uploadError } = await supabase.storage
          .from('evidencias-parqueadero')
          .upload(fileName, audioBlob, { contentType: 'audio/webm' });
        if (uploadError) {
          setMensaje('Error al subir el audio: ' + uploadError.message);
          setLoading(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from('evidencias-parqueadero').getPublicUrl(fileName);
        audioUrlFinal = publicUrlData.publicUrl;
      } else {
        audioUrlFinal = 'pendiente-sync';
      }
    }

    const monto = gratis ? 0 : tipoVehiculo === 'carro' ? 1.0 : 0.5;

    const registro = {
      placa_vehiculo: placaFormateada,
      tipo_vehiculo: tipoVehiculo,
      dependencia_id: copropietarioSeleccionado.id,
      usuario_id: usuarioApp.id,
      observaciones: observaciones || null,
      fecha_hora_ingreso: fecha instanceof Date ? fecha.toISOString() : fecha,
      foto_url: fotoUrl,
      gratis,
      monto,
      observacion_audio_url: audioUrlFinal,
    };

    if (isOnline) {
      const { error } = await supabase.from('registros_parqueadero').insert([registro]);
      if (error) setMensaje('Error al registrar: ' + error.message);
      else {
        setMensaje('¡Registro exitoso!');
        onRegistroExitoso?.();
      }
    } else {
      addToSyncQueue({ table: 'registros_parqueadero', method: 'insert', params: [[registro]] });
      const localData = JSON.parse(localStorage.getItem('registros_offline') || '[]');
      localStorage.setItem('registros_offline', JSON.stringify([...localData, registro]));
      setMensaje('Registro guardado offline. Se sincronizará cuando vuelvas a tener internet.');
    }

    setPlaca('');
    setTipoVehiculo('carro');
    setPropiedad('');
    setUnidadAsignada('');
    setObservaciones('');
    setFecha(getToday());
    setFoto(null);
    setGratis(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setLoading(false);
  };

  // Edit modal handlers
  const handleEdit = (registro) => {
    setEditModal({ open: true, registro });
    setEditData({
      placa_vehiculo: registro.placa_vehiculo,
      tipo_vehiculo: registro.tipo_vehiculo,
      fecha_hora_ingreso: registro.fecha_hora_ingreso?.slice(0, 10) || '',
      observaciones: registro.observaciones || '',
      dependencia_id: registro.dependencia_id,
      gratis: !!registro.gratis,
      monto: registro.monto || 0,
      observacion_audio_url: registro.observacion_audio_url || '',
      nuevoAudio: null,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'nuevoAudio' && files && files.length > 0) {
      setEditData((prev) => ({ ...prev, nuevoAudio: files[0] }));
    } else {
      setEditData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
        ...(name === 'gratis' && checked ? { monto: 0 } : {}),
      }));
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setMensaje('');
    const id = editModal.registro.id;
    let audioUrlFinal = editData.observacion_audio_url;

    if (editData.nuevoAudio) {
      const fileName = `audio_obs_edit_${editData.placa_vehiculo}_${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('evidencias-parqueadero')
        .upload(fileName, editData.nuevoAudio, { contentType: 'audio/webm' });
      if (uploadError) {
        setMensaje('Error al subir el audio: ' + uploadError.message);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('evidencias-parqueadero').getPublicUrl(fileName);
      audioUrlFinal = publicUrlData.publicUrl;
    }

    const montoCalc = editData.gratis ? 0 : editData.tipo_vehiculo === 'carro' ? 1.0 : 0.5;

    try {
      const { error } = await supabase
        .from('registros_parqueadero')
        .update({
          placa_vehiculo: editData.placa_vehiculo,
          tipo_vehiculo: editData.tipo_vehiculo,
          fecha_hora_ingreso: editData.fecha_hora_ingreso,
          observaciones: editData.observaciones,
          dependencia_id: editData.dependencia_id,
          gratis: editData.gratis,
          monto: montoCalc,
          observacion_audio_url: audioUrlFinal,
        })
        .eq('id', id);
      if (error) throw error;

      setRegistrosUsuario((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...editData, monto: montoCalc, observacion_audio_url: audioUrlFinal } : r)),
      );
      setEditModal({ open: false, registro: null });
      setEditData({});
      setMensaje('Registro actualizado correctamente');
    } catch (err) {
      setMensaje('Error al actualizar: ' + err.message);
    }
  };

  const handleDelete = async (registro) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
      if (isOnline) {
        const { error } = await supabase.from('registros_parqueadero').delete().eq('id', registro.id);
        if (error) throw error;
      }
      setRegistrosUsuario((prev) => prev.filter((r) => r.id !== registro.id));
      setMensaje('Registro eliminado correctamente');
    } catch (err) {
      setMensaje('Error eliminando registro: ' + err.message);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ maxWidth: 700, margin: 'auto' }}>
        <h2>
          <Emoji symbol="📝" /> Registro de Parqueo
        </h2>

        <input
          type="text"
          placeholder="Placa"
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          maxLength={10}
          required
          ref={inputPlacaRef}
        />

        <div style={{ margin: '12px 0' }}>
          <label>
            <Emoji symbol="🚦" /> Tipo vehículo:
          </label>
          <button type="button" className={tipoVehiculo === 'carro' ? 'selected' : ''} onClick={() => setTipoVehiculo('carro')}>
            <Emoji symbol="🚗" /> Carro
          </button>
          <button type="button" className={tipoVehiculo === 'moto' ? 'selected' : ''} onClick={() => setTipoVehiculo('moto')}>
            <Emoji symbol="🏍️" /> Moto
          </button>
        </div>

        <div>
          <label>
            <Emoji symbol="🏠" /> Propiedad:
          </label>
          <select
            value={propiedad}
            onChange={(e) => {
              setPropiedad(e.target.value);
              setUnidadAsignada('');
            }}
            required
          >
            <option value="">Seleccione propiedad</option>
            {propiedades.map((prop) => (
              <option key={prop} value={prop}>
                {getPropiedadEmoji(prop)} {prop}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>
            <Emoji symbol="🔢" /> Unidad asignada:
          </label>
          <select value={unidadAsignada} onChange={(e) => setUnidadAsignada(e.target.value)} required disabled={!propiedad}>
            <option value="">Seleccione unidad</option>
            {unidadesFiltradas.map((unidad) => (
              <option key={unidad} value={unidad}>
                {unidad}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>
            <Emoji symbol="📝" /> Observaciones:
          </label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: Vehículo de visita, entrega, etc."
          />
        </div>

        <div>
          <label>
            <Emoji symbol="📅" /> Fecha y hora:
          </label>
          <DatePicker
            selected={fecha}
            onChange={setFecha}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            timeFormat="HH:mm"
            timeIntervals={15}
            required
          />
        </div>

        <div>
          <label>
            <Emoji symbol="🆓" /> Gratis:
          </label>
          <input type="checkbox" checked={gratis} onChange={(e) => setGratis(e.target.checked)} />
        </div>

        <SelectorDeFoto onFileSelected={handleFoto} />

        <div>
          <label>
            <Emoji symbol="🎤" /> Audio:
          </label>
          <ReactMediaRecorder
            audio
            render={({ status, startRecording, stopRecording, mediaBlobUrl }) => (
              <div>
                <button type="button" onClick={startRecording} disabled={status === 'recording'}>
                  🎤 Grabar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopRecording();
                    setTimeout(() => {
                      if (mediaBlobUrl) handleAudioStop(mediaBlobUrl);
                    }, 400);
                  }}
                  disabled={status !== 'recording'}
                >
                  ⏹️ Detener
                </button>
                {audioUrl && <audio controls src={audioUrl} />}
              </div>
            )}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Ingreso'}
        </button>

        {mensaje && <p>{mensaje}</p>}
      </form>

      <section style={{ marginTop: 40, maxWidth: 900, margin: 'auto' }}>
        <h3>
          <Emoji symbol="📋" /> Últimos registros agregados por ti
        </h3>
        <div className="resultados-table-container">
          <table className="resultados-table">
            <thead>
              <tr>
                <th>
                  <Emoji symbol="📅" /> Fecha
                </th>
                <th>
                  <Emoji symbol="🚗" /> Placa
                </th>
                <th>
                  <Emoji symbol="🚦" /> Tipo
                </th>
                <th>
                  <Emoji symbol="👥" /> Copropietario
                </th>
                <th>
                  <Emoji symbol="💵" /> Monto
                </th>
                <th>
                  <Emoji symbol="🆓" /> Gratis
                </th>
                <th>
                  <Emoji symbol="📷" /> Foto
                </th>
                <th>
                  <Emoji symbol="⚙️" /> Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {registrosUsuario.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center' }}>
                    No hay registros
                  </td>
                </tr>
              ) : (
                registrosUsuario.map((reg) => {
                  const copropietario = copropietarios.find((c) => c.id === reg.dependencia_id);
                  return (
                    <tr key={reg.id} className={reg.gratis ? 'registro-gratis' : ''}>
                      <td>{dayjs(reg.fecha_hora_ingreso).format('DD/MM/YYYY')}</td>
                      <td>{reg.placa_vehiculo}</td>
                      <td>
                        {reg.tipo_vehiculo?.toLowerCase() === 'carro' && <Emoji symbol="🚗" />}
                        {reg.tipo_vehiculo?.toLowerCase() === 'moto' && <Emoji symbol="🏍️" />}
                        <span style={{ marginLeft: 6 }}></span>
                      </td>
                      <td>
                        {copropietario?.nombre || '-'}
                        <br />
                        <small>
                          {copropietario?.propiedad || 'Sin propiedad'} - {copropietario?.unidad_asignada || 'Sin unidad'}
                        </small>
                      </td>
                      <td>${Number(reg.monto).toFixed(2)}</td>
                      <td>{reg.gratis ? <Emoji symbol="🆓" /> : '-'}</td>
                      <td>
                        {reg.foto_url && (
                          <a href={reg.foto_url} target="_blank" rel="noopener noreferrer">
                            <img src={reg.foto_url} alt="Evidencia" className="thumbnail" />
                          </a>
                        )}
                      </td>
                      <td>
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(reg)}
                          title="Editar"
                          disabled={!isOnline}
                          style={{ marginRight: 6 }}
                        >
                          <Emoji symbol="✏️" label="Editar" />
                        </button>
                        <button className="delete-btn" onClick={() => handleDelete(reg)} title="Eliminar">
                          <Emoji symbol="🗑️" label="Eliminar" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal edición */}
      {editModal.open && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <h3>
              <Emoji symbol="✏️" /> Editar Registro
            </h3>
            <form onSubmit={handleEditSave} className="modal-form">
              <label>
                Placa:
                <input
                  name="placa_vehiculo"
                  value={editData.placa_vehiculo}
                  onChange={handleEditChange}
                  required
                  disabled={!isOnline}
                />
              </label>
              <label>
                Tipo vehículo:
                <select
                  name="tipo_vehiculo"
                  value={editData.tipo_vehiculo}
                  onChange={handleEditChange}
                  required
                  disabled={!isOnline}
                >
                  <option value="carro">Carro 🚗</option>
                  <option value="moto">Moto 🏍️</option>
                </select>
              </label>
              <label>
                Fecha ingreso:
                <input
                  type="date"
                  name="fecha_hora_ingreso"
                  value={editData.fecha_hora_ingreso}
                  onChange={handleEditChange}
                  required
                  disabled={!isOnline}
                />
              </label>
              <label>
                Observaciones:
                <input
                  name="observaciones"
                  value={editData.observaciones}
                  onChange={handleEditChange}
                  disabled={!isOnline}
                />
              </label>
              <label>
                Copropietario:
                <select
                  name="dependencia_id"
                  value={editData.dependencia_id || ''}
                  onChange={handleEditChange}
                  required
                  disabled={!isOnline}
                >
                  <option value="">Seleccione...</option>
                  {copropietarios.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.nombre} ({dep.propiedad} - {dep.unidad_asignada})
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="gratis"
                  checked={!!editData.gratis}
                  onChange={handleEditChange}
                  disabled={!isOnline}
                />
                <Emoji symbol="🆓" label="Gratis" /> Gratis
              </label>
              <label>
                Evidencia auditiva:
                {editData.observacion_audio_url && editData.observacion_audio_url !== 'pendiente-sync' ? (
                  <>
                    <audio controls style={{ width: '100%', margin: '8px 0' }}>
                      <source src={editData.observacion_audio_url} type="audio/webm" />
                      Tu navegador no soporta audio.
                    </audio>
                    <button
                      type="button"
                      onClick={() => setEditData((prev) => ({ ...prev, observacion_audio_url: '', nuevoAudio: null }))}
                      className="delete-btn"
                      style={{ marginTop: 8 }}
                      disabled={!isOnline}
                    >
                      <Emoji symbol="🗑️" /> Eliminar audio
                    </button>
                  </>
                ) : (
                  <span style={{ color: '#aaa', fontSize: 14 }}>No hay audio guardado.</span>
                )}
                <input
                  type="file"
                  accept="audio/*"
                  name="nuevoAudio"
                  onChange={handleEditChange}
                  disabled={!isOnline}
                  style={{ marginTop: 8 }}
                />
                <small style={{ fontSize: 12, color: '#888' }}>
                  Puedes subir un nuevo archivo de audio para reemplazar el actual.
                </small>
              </label>
              <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="submit" className="save-btn" disabled={!isOnline}>
                  Guardar
                </button>
                <button type="button" className="cancel-btn" onClick={() => setEditModal({ open: false, registro: null })}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
