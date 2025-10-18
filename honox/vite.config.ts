import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import honox from 'honox/vite'

export default defineConfig({
  plugins: [
    honox({
      client: {
        input: [
          '/app/client.ts', 
          '/app/style.css', 
        ],
      }
    }),
    tailwindcss(),
  ],
})
