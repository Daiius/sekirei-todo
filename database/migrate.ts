// マイグレーション適用エントリ。`drizzle-kit generate` が生成した
// drizzle/<timestamp>_<name>/migration.sql を順に適用する（未適用のものだけが走り、
// 適用済みの記録は drizzle 標準の __drizzle_migrations テーブルが持つ）。
//
// **生成は drizzle-kit（dev 専用の devDependency）、適用は drizzle-orm の migrator**。
// これで本番イメージに drizzle-kit を入れずに適用でき、dev と本番で適用経路が 1 本になる。
//
//   dev  … pnpm db:migrate   → docker compose exec server-ts pnpm --filter database migrate
//   本番 … docker compose run --rm --no-deps <server サービス> migrate.js
//
// ⚠ **このファイルはパッケージルート直下に置く**（db/ や src/ ではない）。migrationsFolder を
// このファイルからの相対 URL で解くため、`./drizzle` が dev では database/drizzle を、
// バンドル後は /app/drizzle を指す必要がある。下の階層に置くと両者がずれる。
// cwd 相対にしないのは、どこから叩くかで壊れるため。

import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/mysql2/migrator';

import { client, db } from './db/index';

const migrationsFolder = fileURLToPath(new URL('./drizzle', import.meta.url));

// db/index.ts の client は mysql2/promise の Pool なので end() をそのまま await できる。
try {
  await migrate(db, { migrationsFolder });
  console.log('migrations applied (up to date)');
  await client.end();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  await client.end();
  process.exitCode = 1;
}
