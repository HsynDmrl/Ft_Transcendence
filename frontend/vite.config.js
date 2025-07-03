import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        // Docker içinde çalışırken HMR (Hot Module Replacement) için bu ayar gerekebilir.
        hmr: {
            host: 'localhost',
        },
    },
})
