import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import honox from 'honox/vite'
import path from 'path'

const serverRoot = path.resolve(process.cwd(), 'app')

export default defineConfig({
  plugins: [
    honox({
      client: {
        input: [
          './app/client.ts', 
          './app/style.css', 
        ],
      },
    }),
    tailwindcss(),
    {
      name: 'full-reload-on-server-change',
      handleHotUpdate(ctx) {
        const relativePath = path.relative(serverRoot, ctx.file)
        console.log('relativePath: ', relativePath)
        const shouldReload = relativePath.startsWith('routes/')

        if (shouldReload) ctx.server.ws.send({ type: 'full-reload' })
      },
    }
  ],
})
