// src/components/DescargoGestion.jsx
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from "../supabaseClient";
import Emoji from "./Emoji";
import Loader from "./Loader";
import dayjs from "dayjs";

export default function DescargoGestion() {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      descripcion: "",
      fecha: new Date(),
      esfuerzo: [],
      monto: "",
      horas: "",
      materiales: "",
      observaciones: "",
      archivos: [],
    },
  });

  const [mensaje, setMensaje] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [archivosPreview, setArchivosPreview] = useState([]);

  // Para mostrar registros en tabla
  const [registros, setRegistros] = useState([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);
  const [errorRegistros, setErrorRegistros] = useState(null);

  // Carga registros desde Supabase
  const fetchRegistros = async () => {
    setLoadingRegistros(true);
    setErrorRegistros(null);
    try {
      const { data, error } = await supabase
        .from("descargos_gestion")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      setRegistros(data);
    } catch (error) {
      setErrorRegistros(error.message);
    } finally {
      setLoadingRegistros(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  // Previsualización de archivos
  const handleArchivos = (e) => {
    const files = Array.from(e.target.files);
    setValue("archivos", files);
    setArchivosPreview(
      files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null))
    );
  };

  // Envío del formulario
  const onSubmit = async (data) => {
    setMensaje("");
    setSubiendo(true);
    let archivosUrls = [];

    try {
      // Subida de archivos
      if (data.archivos?.length > 0) {
        for (let file of data.archivos) {
          const ext = file.name.split(".").pop();
          const nombre = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("descargos-evidencias")
            .upload(nombre, file);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage
            .from("descargos-evidencias")
            .getPublicUrl(nombre);
          archivosUrls.push(urlData.publicUrl);
        }
      }

      // Crear registro
      const registro = {
        descripcion: data.descripcion,
        fecha: data.fecha.toISOString(),
        esfuerzo: data.esfuerzo,
        monto: data.monto ? Number(data.monto) : null,
        horas: data.horas ? Number(data.horas) : null,
        materiales: data.materiales || null,
        observaciones: data.observaciones || null,
        archivos: archivosUrls,
      };

      const { error } = await supabase.from("descargos_gestion").insert([registro]);

      if (error) throw error;

      setMensaje("✅ ¡Descargo registrado exitosamente!");
      reset();
      setArchivosPreview([]);
      fetchRegistros(); // refrescar tabla
    } catch (error) {
      setMensaje(`⚠️ Error: ${error.message}`);
    } finally {
      setSubiendo(false);
    }
  };

  const esfuerzoSeleccionado = watch("esfuerzo") || [];

  return (
    <div
      className="descargo-gestion-container"
      style={{
        background: "linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)",
        borderRadius: 24,
        boxShadow: "0 6px 32px #6366f133",
        padding: "2.5rem 1.5rem",
        maxWidth: 700,
        margin: "2.5rem auto",
        transition: "background 0.4s",
      }}
    >
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 700,
          fontSize: "1.6rem",
          marginBottom: 16,
        }}
      >
        <Emoji symbol="📝" /> Descargo de Gestión
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
        style={{ display: "flex", flexDirection: "column", gap: 20 }}
      >
        <label>
          <Emoji symbol="💡" /> <b>Descripción de la gestión</b>
          <input
            type="text"
            {...register("descripcion", {
              required: "Campo obligatorio",
              maxLength: { value: 120, message: "Máximo 120 caracteres" },
            })}
            placeholder="Ej: Reparación de luminarias"
            className={`input-modern ${errors.descripcion ? "input-error" : ""}`}
          />
          {errors.descripcion && <span className="error-message">{errors.descripcion.message}</span>}
        </label>

        <label>
          <Emoji symbol="📅" /> <b>Fecha de lo gestionado</b>
          <Controller
            control={control}
            name="fecha"
            rules={{ required: "Campo obligatorio" }}
            render={({ field }) => (
              <DatePicker
                placeholderText="Selecciona fecha y hora"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="yyyy-MM-dd HH:mm"
                timeCaption="Hora"
                selected={field.value}
                onChange={field.onChange}
                className="input-modern"
              />
            )}
          />
          {errors.fecha && <span className="error-message">{errors.fecha.message}</span>}
        </label>

        <label>
          <Emoji symbol="🗂️" /> <b>Tipo de esfuerzo</b>
          <select
            {...register("esfuerzo", { required: "Seleccione al menos uno" })}
            multiple
            className="input-modern"
            style={{ minHeight: 70 }}
          >
            <option value="económico">💲 Económico</option>
            <option value="participativo">🤝 Participativo</option>
            <option value="utilitarios">🛠️ Utilitarios</option>
          </select>
          {errors.esfuerzo && <span className="error-message">{errors.esfuerzo.message}</span>}
        </label>

        {esfuerzoSeleccionado.includes("económico") && (
          <label>
            <Emoji symbol="💵" /> <b>Monto económico ($)</b>
            <input
              type="number"
              step="0.01"
              {...register("monto", { min: 0 })}
              placeholder="Ej: 45.00"
              className="input-modern"
            />
          </label>
        )}

        {esfuerzoSeleccionado.includes("participativo") && (
          <label>
            <Emoji symbol="⏳" /> <b>Horas de mano de obra</b>
            <input
              type="number"
              step="0.5"
              {...register("horas", { min: 0 })}
              placeholder="Ej: 3.5"
              className="input-modern"
            />
          </label>
        )}

        {esfuerzoSeleccionado.includes("utilitarios") && (
          <label>
            <Emoji symbol="🧰" /> <b>Materiales/insumos utilizados</b>
            <input
              type="text"
              {...register("materiales")}
              placeholder="Ej: 2 focos, 1 galón pintura"
              className="input-modern"
            />
          </label>
        )}

        <label>
          <Emoji symbol="📎" /> <b>Evidencias (facturas, recibos, fotos)</b>
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={handleArchivos}
            className="input-modern"
          />
          <span style={{ fontSize: 13, color: "#888" }}>
            Puedes adjuntar imágenes (jpg, png), PDF, etc.
          </span>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            {archivosPreview.map((src, i) =>
              src ? (
                <img
                  key={i}
                  src={src}
                  alt={`Evidencia ${i + 1}`}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1.5px solid #a5b4fc",
                  }}
                />
              ) : null
            )}
          </div>
        </label>

        <label>
          <Emoji symbol="📝" /> <b>Observaciones adicionales</b>
          <textarea
            {...register("observaciones")}
            rows={2}
            placeholder="Detalles adicionales, responsables, etc."
            className="input-modern"
          />
        </label>

        <button
          type="submit"
          disabled={subiendo || isSubmitting}
          className="btn-disruptivo"
          style={{
            background: "linear-gradient(90deg, #6366f1 60%, #38bdf8 100%)",
            color: "#fff",
            padding: "14px 0",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 18,
            boxShadow: "0 2px 12px #6366f144",
            border: "none",
            cursor: subiendo ? "wait" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {subiendo ? (
            <>
              <Emoji symbol="⏳" /> Registrando...
            </>
          ) : (
            <>
              <Emoji symbol="📤" /> Registrar descargo
            </>
          )}
        </button>

        {mensaje && (
          <div
            className="info-message"
            style={{
              marginTop: 14,
              background: mensaje.startsWith("✅") ? "#e0ffe8" : "#fffbe6",
              color: mensaje.startsWith("✅") ? "#22c55e" : "#b26d00",
              border: mensaje.startsWith("✅")
                ? "1.5px solid #22c55e"
                : "1.5px solid #ffe58f",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {mensaje}
          </div>
        )}
      </form>

      <h3
        style={{
          marginTop: 40,
          marginBottom: 12,
          fontWeight: 700,
          fontSize: "1.4rem",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Emoji symbol="📋" label="Registros" /> Registros de Descargo de Gestión
      </h3>

      {loadingRegistros && <Loader text="Cargando registros..." />}

      {errorRegistros && (
        <div className="error-message" style={{ marginBottom: 16 }}>
          {errorRegistros}
        </div>
      )}

      {!loadingRegistros && registros.length === 0 && (
        <div>No hay registros disponibles.</div>
      )}

      {registros.length > 0 && (
        <div
          className="tabla-registros-descargo"
          style={{
            overflowX: "auto",
            maxHeight: 400,
            marginTop: 16,
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f4ff" }}>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  Fecha
                </th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  Descripción
                </th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  Esfuerzo
                </th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  Monto
                </th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  Horas
                </th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  Materiales
                </th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  Observaciones
                </th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  Evidencias
                </th>
              </tr>
            </thead>
            <tbody>
              {registros.map((reg) => (
                <tr key={reg.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    {reg.fecha ? dayjs(reg.fecha).format("DD/MM/YYYY HH:mm") : "-"}
                  </td>
                  <td style={{ padding: "6px 8px" }}>{reg.descripcion || "-"}</td>
                  <td style={{ padding: "6px 8px" }}>
                    {Array.isArray(reg.esfuerzo)
                      ? reg.esfuerzo
                          .map((e) => {
                            if (e === "económico") return "💲 Económico";
                            if (e === "participativo") return "🤝 Participativo";
                            if (e === "utilitarios") return "🛠️ Utilitarios";
                            return e;
                          })
                          .join(", ")
                      : "-"}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right" }}>
                    {reg.monto != null ? `$${Number(reg.monto).toFixed(2)}` : "-"}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    {reg.horas != null ? reg.horas : "-"}
                  </td>
                  <td style={{ padding: "6px 8px" }}>{reg.materiales || "-"}</td>
                  <td style={{ padding: "6px 8px" }}>{reg.observaciones || "-"}</td>
                  <td style={{ padding: "6px 8px" }}>
                    {reg.archivos && reg.archivos.length > 0 ? (
                      reg.archivos.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginRight: 8, display: "inline-block" }}
                        >
                          📎 Archivo {i + 1}
                        </a>
                      ))
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
