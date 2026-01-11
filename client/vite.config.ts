import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_TARGET || 'http://localhost:4000';

  return {
    plugins: [react()],
    build: {
      // Optimize chunks
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
            'vendor-utils': ['zustand', 'axios', 'date-fns', 'fuse.js'],
            // Mermaid is huge - isolate it completely
            'vendor-mermaid': ['mermaid'],
          }
        }
      },
      // Increase limit since we're code-splitting properly now
      chunkSizeWarningLimit: 1000,
    },
    server: {
      host: true, 
      port: 5173,
      allowedHosts: true, // Allow ngrok and external hosts
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
})
