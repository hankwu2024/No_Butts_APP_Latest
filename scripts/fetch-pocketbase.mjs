// 下載 PocketBase 執行檔到專案根目錄（給 Nixpacks 部署用）
import AdmZip from 'adm-zip';
import { chmodSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const version = process.env.PB_VERSION || '0.39.10';
const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
const target = fileURLToPath(new URL('../pocketbase', import.meta.url));

if (process.platform !== 'linux') {
  console.log(`[pocketbase] 非 Linux 環境（${process.platform}），略過下載`);
  process.exit(0);
}
if (existsSync(target)) {
  console.log('[pocketbase] 已存在，略過下載');
  process.exit(0);
}

const url = `https://github.com/pocketbase/pocketbase/releases/download/v${version}/pocketbase_${version}_linux_${arch}.zip`;
console.log(`[pocketbase] 下載 ${url}`);
const res = await fetch(url);
if (!res.ok) throw new Error(`下載 PocketBase 失敗：HTTP ${res.status}`);
const zip = new AdmZip(Buffer.from(await res.arrayBuffer()));
const entry = zip.getEntry('pocketbase');
if (!entry) throw new Error('壓縮檔裡找不到 pocketbase 執行檔');
writeFileSync(target, entry.getData());
chmodSync(target, 0o755);
console.log(`[pocketbase] 已安裝到 ${target}`);
