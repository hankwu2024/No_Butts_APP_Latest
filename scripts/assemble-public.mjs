// 組出 PocketBase 要對外提供的網站資料夾：
//   /            → 個人網站（GitHub 上 No_Butts_APP_Latest 的 gh-pages 分支）
//   /screening/  → 這個 repo 剛建置好的菸蒂快篩前端（cigarette-screening-app/dist）
// 用法：node scripts/assemble-public.mjs <前端 dist 資料夾> <輸出資料夾>
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [distArg, outArg] = process.argv.slice(2);
if (!distArg || !outArg) {
  console.error('用法：node scripts/assemble-public.mjs <dist> <out>');
  process.exit(1);
}
const dist = resolve(distArg);
const out = resolve(outArg);
const siteUrl = process.env.SITE_TARBALL_URL
  || 'https://github.com/hankwu2024/No_Butts_APP_Latest/archive/refs/heads/gh-pages.tar.gz';

if (!existsSync(join(dist, 'index.html'))) throw new Error(`找不到前端建置結果：${dist}/index.html`);

console.log(`[site] 下載個人網站 ${siteUrl}`);
const res = await fetch(siteUrl);
if (!res.ok) throw new Error(`下載個人網站失敗：HTTP ${res.status}`);
const tarball = Buffer.from(await res.arrayBuffer());

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
// GitHub 的壓縮檔最外層多一層「repo-分支」資料夾，用 --strip-components=1 拿掉
// 從 stdin 解壓（Windows 的 tar 會把「C:」路徑誤當成遠端主機）
execFileSync('tar', ['-xzf', '-', '--strip-components=1'], { cwd: out, input: tarball });
if (!existsSync(join(out, 'index.html'))) throw new Error('個人網站壓縮檔裡沒有 index.html');

// gh-pages 上的 screening/ 是舊版，換成這次建置的
const screening = join(out, 'screening');
rmSync(screening, { recursive: true, force: true });
cpSync(dist, screening, { recursive: true });
console.log(`[site] 完成：${out}（個人網站在 /，快篩平台在 /screening/）`);
