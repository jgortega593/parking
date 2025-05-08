import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
// Carga las variables de entorno según el modo (development, production, etc.)
const env = loadEnv(mode, process.cwd(), '')

return defineConfig({
plugins: [react()],
server: {
open: false, // evita que Vite intente abrir el navegador automáticamente
},
define: {
// Expone las variables de entorno para que puedan usarse en el código cliente
'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
},
resolve: {
alias: {
'@': '/src',
},
},
})
}
