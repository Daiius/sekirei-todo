import { jsxRenderer } from 'hono/jsx-renderer'
import { Script } from 'honox/server'
import { Link } from 'honox/server'
import { Header } from '../components/Header'

export default jsxRenderer(({ children, title }, _c) => {
  return (
    <html lang='jp'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        {title && <title>{title}</title>}
        <Script src='/app/client.ts' /*async nonce={c.get('secureHeadersNonce')}*/ />
        <Link href='/app/style.css' rel='stylesheet' />
      </head>
      <body className='flex flex-col w-full min-h-dvh'>
        <Header />
        <main className='p-4 flex-1'>
          {children}
        </main>
        <footer className='bg-base-300 px-4 py-2'>
          footer test
        </footer>
      </body>
    </html>
  )
})
