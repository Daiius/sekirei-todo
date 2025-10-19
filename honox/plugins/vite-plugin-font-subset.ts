import type { Plugin } from 'vite'
import { readdir, readFile } from 'fs/promises'
import path from 'path'
import subsetFont from 'subset-font'

type FontInput = {
  /** 入力フォント（TTF/OTF/WOFF/WOFF2 推奨：TTF/OTF） */
  input: string,
  /** @font-face の font-family 名 */
  family: string,
  /** CSS font-weight（例: 400 or '100 900' 可変フォント範囲） */
  weight?: number | string,
  /** CSS font-style */
  style?: 'normal' | 'italic',
  /** 出力ファイル名（例: 'noto-sans-jp-subset-400.woff2'） */
  outFile: string,
  /** unicode-range（任意。用途分割したいときに） */
  unicodeRange?: string,
}

export type FontSubsetPluginOptions = {
  /** 文字スキャンの対象ディレクトリ */
  sourceDirs: string[],
  /** 文字スキャン対象の拡張子 */
  exts: string[],
  /** 生成対象フォントの配列 */
  fonts: FontInput[],
  /** いつも含めたい“保険”の文字（例: 記号、矢印、℃、✓ など） */
  extraChars?: string,
  /** 基本ラテン（U+0020–007E）を常時含める（デフォルト: true） */
  includeBasicLatin?: boolean,
  /** Latin-1（U+00A0–00FF NBSP, ß, é など）も含める（デフォルト: false） */
  includeLatin1Supplement?: boolean,
  /** 生成CSSの出力先（バンドル内パス） */
  cssOutFile?: string, // 例: 'assets/font-subset.css'
  /** CSS のファイルパスを <head> に自動で挿入（インデックスHTMLがある場合） */
  injectLinkTag?: boolean,
}

const basicLatin = (): string => {
  // U+0020 (space) – U+007E (~)
  let s = ''
  for (let cp = 0x20; cp <= 0x7e; cp++) s += String.fromCharCode(cp)
  return s
}

const latin1Supplement = (): string => {
  // U+00A0 – U+00FF（NBSP含む）
  let s = ''
  for (let cp = 0xa0; cp <= 0xff; cp++) s += String.fromCharCode(cp)
  return s
}

const listFilesRecursive = async (
  dir: string,
  exts: string[] = ['.ts', '.tsx', '.js', '.jsx', 'json', '.md', 'mdx'],
): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(fullPath, exts)))
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }
  return files
}

export const fontSubsetPlugin = (opts: FontSubsetPluginOptions): Plugin => {
  const options: Required<Omit<FontSubsetPluginOptions,
  "extraChars" | "cssOutFile" | "injectLinkTag">> & {
    extraChars?: string,
    cssOutFile: string,
    injectLinkTag: boolean,
  } = {
    includeBasicLatin: opts.includeBasicLatin ?? true,
    includeLatin1Supplement: opts.includeLatin1Supplement ?? false,
    sourceDirs: opts.sourceDirs,
    exts: opts.exts ?? [ '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx', '.html', ],
    fonts: opts.fonts,
    extraChars: opts.extraChars,
    cssOutFile: opts.cssOutFile ?? "assets/font-subset.css",
    injectLinkTag: opts.injectLinkTag ?? false,
  }

  return {
    name: "vite-plugin-font-subset",
    apply: "build",

    async buildStart() {
      // 1) ソースから文字収集
      const seen = new Set<string>();

      const pick = (text: string) => {
        for (const ch of text) {
          // 制御文字など最低限フィルタ（必要に応じ調整）
          if (ch === "\r" || ch === "\n" || ch === "\t") continue;
          seen.add(ch);
        }
      };

      // ラテン系の常時カバー
      if (options.includeBasicLatin) pick(basicLatin());
      if (options.includeLatin1Supplement) pick(latin1Supplement());

      // 追加の“保険”文字
      if (options.extraChars) pick(options.extraChars);

      for (const dir of options.sourceDirs) {
        const files = await listFilesRecursive(dir, options.exts)
        for (const p of files) {
          try {
            const txt = await readFile(p, "utf8");
            pick(txt);
          } catch {
            /* ignore unreadable */
          }
        }
      }

      // ゼロ事故対策（もし何も無ければ最低限として）
      if (seen.size === 0) pick("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");

      // 2) subset-font で各フォントをサブセット化しつつ、3) CSS 生成
      const allChars = Array.from(seen).join("");
      const cssChunks: string[] = [];

      for (const f of options.fonts) {
        // 入力フォントの読み込み（プロジェクトルート基準）
        const inputBuf = await readFile(f.input);

        // サブセット化
        const woff2Buf = await subsetFont(inputBuf, allChars, { targetFormat: "woff2" });

        // 出力ファイル名をバンドルに emit（/assets/... に出る）
        const fileName = `assets/fonts/${f.outFile}`;
        this.emitFile({ type: "asset", fileName, source: woff2Buf });

        // CSS（@font-face）を構築
        cssChunks.push(
`@font-face{
  font-family:'${f.family}';
  src:url('/${fileName}') format('woff2');
  font-style:${f.style ?? "normal"};
  font-weight:${f.weight ?? 400};
  font-display:swap;${f.unicodeRange ? `\n  unicode-range:${f.unicodeRange};` : ""}
}`
        );
      }

      // まとめたCSSを 1 ファイルに
      this.emitFile({
        type: "asset",
        fileName: options.cssOutFile,
        source: cssChunks.join("\n\n"),
      });
    },
  // index.html がある構成向け（任意）：CSS を自動挿入
    transformIndexHtml: options.injectLinkTag
      ? (html) => {
          const href = "/" + options.cssOutFile.replace(/^\/+/, "");
          const tag = `<link rel="stylesheet" href="${href}">`;
          return html.includes(tag)
            ? html
            : html.replace("</head>", `  ${tag}\n</head>`);
        }
      : undefined,
  };
};
