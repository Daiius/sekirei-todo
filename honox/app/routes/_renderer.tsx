import { jsxRenderer } from 'hono/jsx-renderer'
import { Script } from 'honox/server'
import { Link } from 'honox/server'

export default jsxRenderer(({ children, title }, c) => {
  return (
    <html lang='jp'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <Link href='/app/style.css' rel='stylesheet' />
        {title && <title>{title}</title>}
        <Script src='/app/client.ts' async nonce={c.get('secureHeadersNonce')} />
      </head>
      <body>{children}</body>
    </html>
  )
})
