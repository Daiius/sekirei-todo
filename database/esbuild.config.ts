// 本番イメージ用のバンドル設定 (migrate / seed)。
// server-ts/esbuild.config.ts と同じ形だが、エントリが 2 つあるので outfile ではなく outdir。
//
// ⚠ **エントリは名前付きで渡す**。配列で渡すと出力先が入力の共通ベースからの相対になり、
// 将来エントリを別階層へ移したときに dist 直下から外れる。
//
// ⚠ **生成済み SQL (drizzle/) はバンドルに含まれない**。migrator が実行時に fs で読むため、
// server-ts/Dockerfile.prod で drizzle/ フォルダごと COPY している。
import { build } from 'esbuild'

await build({
  entryPoints: { migrate: './migrate.ts', seed: './seed.ts' },
  outdir: './dist',
  platform: 'node',
  format: 'esm',
  bundle: true,
  target: 'node22',
  resolveExtensions: ['.ts', '.js'],
  external: ['tty'],
  banner: {
    js: `
      import { createRequire } from "module";
      import __url from "url";
      const require = createRequire(import.meta.url);
      const __filename = __url.fileURLToPath(import.meta.url);
      const __dirname = __url.fileURLToPath(new URL(".", import.meta.url));
    `,
  }
})

console.log('[esbuild] dist/migrate.js, dist/seed.js を生成しました')
