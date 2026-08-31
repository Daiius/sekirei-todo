import { NextConfig } from 'next';

// 同一オリジン配信。ブラウザは常に自分と同じオリジンの /api を叩き、Next.js が
// server-ts へ素通しで転送する (server-ts 側は /api/auth/* をそのままの path で
// 受けるので書き換えない)。
// - compose 上では API_URL=http://server-ts:4000 (compose 網内の service 名)
// - ホストで `next dev` を直接動かす場合は .env.local の API_URL がそのまま使われる
const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

// リモート公開 (Cloudflare Tunnel 等の前段プロキシ越し) でのみ必要な差分を env で切替。
// DEV_ALLOWED_HOST 未設定 / localhost = ローカル dev (差分なし)。
const allowedHost = process.env.DEV_ALLOWED_HOST;
const isRemote = !!allowedHost && allowedHost !== 'localhost';

const nextConfig = {
  cacheComponents: true,

  // リモートのみ: 別オリジン (公開ホスト名) からの dev リクエストを許可する。
  // HMR は同一オリジンの WebSocket なので、前段が wss を通せば追加設定は不要。
  ...(isRemote ? { allowedDevOrigins: [allowedHost] } : {}),

  async rewrites() {
    if (!apiUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
