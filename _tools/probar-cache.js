/**
 * probar-cache.js — ¿un navegador que YA visito la tienda recibe el cambio nuevo?
 *
 * Esta es la pregunta que ni `curl` ni un navegador con el cache desactivado
 * contestan, y por no hacerla se publico un cambio que Tadeo no veia (1/9/2026):
 * index.html cargaba `app.js?v=20260819-1`, fijo desde el 19/8, y Pages sirve
 * app.js con max-age=14400. El navegador cachea por URL EXACTA: misma URL,
 * misma copia vieja, durante 4 horas.
 *
 * El test simula el caso real:
 *   1. visita la tienda y deja el cache poblado (como cualquier cliente),
 *   2. vuelve a visitarla SIN limpiar nada,
 *   3. y verifica que igual ve el codigo de ahora.
 *
 * El cache queda activado a proposito. Desactivarlo hace pasar el test siempre
 * y no prueba nada.
 *
 *   node _tools/probar-cache.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = 'https://maleu.com.ar/';
const RED = '\x1b[31m', VER = '\x1b[32m', DIM = '\x1b[2m', RST = '\x1b[0m';
const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

function conectar(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      m.error ? mal(new Error(m.error.message)) : ok(m.result);
    }
  });
  const listo = new Promise((r, j) => {
    ws.addEventListener('open', r);
    ws.addEventListener('error', () => j(new Error('no conecta')));
  });
  return { listo,
    enviar: (m, p) => new Promise((ok, mal) => { const i = ++id; pend.set(i, { ok, mal }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }),
    cerrar() { try { ws.close(); } catch (e) { /* ya */ } } };
}

async function esperarPagina(puerto) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + puerto + '/json/list');
      const p = (await r.json()).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch (e) { /* todavia no */ }
    await new Promise((s) => setTimeout(s, 250));
  }
  throw new Error('Chrome no abrio');
}

async function visitar(cli, url) {
  await cli.enviar('Page.navigate', { url });
  for (let i = 0; i < 100; i++) {
    const r = await cli.enviar('Runtime.evaluate', {
      expression: "typeof PRODUCTOS !== 'undefined'", returnByValue: true });
    if (r.result && r.result.value === true) break;
    await new Promise((s) => setTimeout(s, 250));
  }
  const r = await cli.enviar('Runtime.evaluate', {
    expression: `JSON.stringify({
      corrio: typeof _zonaPermite === 'function' && typeof PRODUCTOS !== 'undefined',
      productos: (typeof PRODUCTOS !== 'undefined') ? PRODUCTOS.length : 0,
      versionScript: (document.querySelector('script[src*="app.js"]')||{}).getAttribute
        ? document.querySelector('script[src*="app.js"]').getAttribute('src') : '?'
    })`, returnByValue: true });
  return JSON.parse(r.result.value);
}

/* El mismo md5 que calcula `_tools/cachebuster.py`: normalizado a LF, 8 hex.
   Sin normalizar, el MISMO archivo da distinto en Windows y en el runner. */
function hashDe(buf) {
  return require('crypto').createHash('md5')
    .update(Buffer.from(buf).toString('binary').replace(/\r\n/g, '\n'), 'binary')
    .digest('hex').slice(0, 8);
}

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error(RED + 'X no encontre Chrome' + RST); process.exit(1); }
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-cache-'));
  const puerto = 9700 + Math.floor(Math.random() * 200);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puerto, '--user-data-dir=' + perfil, 'about:blank'], { stdio: 'ignore' });

  let cli, fallas = 0;
  const limpiar = () => { if (cli) cli.cerrar(); try { proc.kill(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {} };

  try {
    cli = conectar(await esperarPagina(puerto));
    await cli.listo;
    await cli.enviar('Runtime.enable');
    await cli.enviar('Page.enable');
    await cli.enviar('Network.enable');
    // EL CACHE QUEDA PRENDIDO. Desactivarlo hace pasar el test siempre.
    await cli.enviar('Network.setCacheDisabled', { cacheDisabled: false });

    console.log('\n== CACHE: ¿un navegador que ya visito la tienda ve lo nuevo? ==');
    console.log(DIM + '  (cache del navegador ACTIVADO a proposito)\n' + RST);

    const a = await visitar(cli, BASE);
    console.log('  1a visita  ' + a.versionScript);
    const b = await visitar(cli, BASE + '?r=' + Date.now());
    console.log('  2a visita  ' + b.versionScript + DIM + '  (sin limpiar nada)' + RST);

    /* El marcador es el PROPIO ?v=, no una funcion del momento. La version
       anterior de este test miraba `MODO_AUTOPEDIDO`, y cuando ese modo se
       elimino (8/9/2026) el test quedo en rojo midiendo algo que ya no existe:
       un test atado a una feature envejece con ella. El ?v= dice "esto es el
       contenido de ahora" y esa afirmacion se puede comprobar sola. */
    const vVivo = (String(b.versionScript).match(/\?v=([a-f0-9]+)/) || [])[1] || '';
    const servido = Buffer.from(await (await fetch(BASE + 'app.js?v=' + vVivo)).arrayBuffer());
    const hServido = hashDe(servido);
    const hLocal = hashDe(fs.readFileSync(path.resolve(__dirname, '..', 'app.js')));
    console.log(DIM + '  ?v= vivo ' + vVivo + ' · md5 del app.js servido ' + hServido +
                ' · md5 del local ' + hLocal + RST);

    const chequeo = (t, ok) => { if (!ok) fallas++; console.log('  ' + (ok ? VER + 'ok  ' : RED + 'MAL ') + RST + t); };
    console.log();
    chequeo('el script lleva un ?v= que no es el fijo viejo',
      /\?v=/.test(b.versionScript) && !/v=20260819-1/.test(b.versionScript));
    chequeo('el ?v= describe el contenido que el server esta sirviendo', vVivo === hServido);
    chequeo('lo publicado es el app.js de este repo', hServido === hLocal);
    chequeo('la 2a visita, sin limpiar, carga esa misma version', b.versionScript === a.versionScript);
    chequeo('el JS corrio en el navegador (' + b.productos + ' productos)', b.corrio === true);

    limpiar();
    console.log('\n  ' + (fallas ? RED + fallas + ' FALLAN' + RST : VER + 'un navegador con cache recibe el codigo de ahora' + RST) + '\n');
    process.exit(fallas ? 1 : 0);
  } catch (e) {
    console.error(RED + 'X ' + e.message + RST); limpiar(); process.exit(1);
  }
}
main();
