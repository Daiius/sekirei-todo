import { createRoute } from 'honox/factory'
import { secureHeaders, NONCE } from 'hono/secure-headers'

export default createRoute(
  secureHeaders({
    contentSecurityPolicy: {
      scriptSrc: [NONCE],
    },
  })
)
