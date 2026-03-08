import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/GENERADOR-PDC-PRIMARIA/',
  plugins: [react(), viteSingleFile()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY)
  }
})
