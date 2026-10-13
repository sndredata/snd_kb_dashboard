// GitHub Actions에서 실행: KB 최신 주차를 받아 data.json에 덧붙인다. 새 주차가 없으면 아무것도 바꾸지 않는다.
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { updateData } from './kb-update.mjs';

const file = new URL('../data.json', import.meta.url);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' }, signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (attempt >= 3) throw new Error(`KB 서버 요청 실패: ${e.message}`);
      await sleep(5000 * (attempt + 1));
    }
  }
}

const D = JSON.parse(await readFile(file, 'utf8'));
const before = D.dates[D.dates.length - 1];
const res = await updateData(D, get);
const changed = res.weeks.length > 0 || res.sweeks.length > 0;
if (changed) {
  await writeFile(file, JSON.stringify(D));
  console.log(`업데이트: ${before} -> ${res.last} (추가 주차: ${res.weeks.join(', ') || '없음'} / 심리: ${res.sweeks.join(', ') || '없음'})`);
} else {
  console.log(`새 주차 없음 (현재 기준일 ${before})`);
}
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\nlast=${res.last}\n`);
