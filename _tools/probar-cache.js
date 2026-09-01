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
      modo: (typeof MODO_AUTOPEDIDO !== 'undefined') ? MODO_AUTOPEDIDO : 'NO EXISTE',
      zonaPermite: typeof _zonaPermite === 'function',
      versionScript: (document.querySelector('script[src*="app.js"]')||{}).getAttribute
        ? document.querySelector('script[src*="app.js"]').getAttribute('src') : '?'
    })`, returnByValue: true });
  return JSON.parse(r.result.value);
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
    const b = await visitar(cli, BASE + '?autopedido=1');
    console.log('  2a visita  ' + b.versionScript + DIM + '  (sin limpiar nada)' + RST);

    const chequeo = (t, ok) => { if (!ok) fallas++; console.log('  ' + (ok ? VER + 'ok  ' : RED + 'MAL ') + RST + t); };
    console.log();
    chequeo('el script lleva un ?v= que no es el fijo viejo',
      /\?v=/.test(b.versionScript) && !/v=20260819-1/.test(b.versionScript));
    chequeo('MODO_AUTOPEDIDO llega al navegador (no "NO EXISTE")', b.modo !== 'NO EXISTE');
    chequeo('_zonaPermite() llega al navegador', b.zonaPermite === true);
    chequeo('con el parametro, el modo prende', b.modo === true);
    chequeo('sin el parametro, el modo queda apagado', a.modo === false);

    limpiar();
    console.log('\n  ' + (fallas ? RED + fallas + ' FALLAN' + RST : VER + 'un navegador con cache recibe el codigo de ahora' + RST) + '\n');
    process.exit(fallas ? 1 : 0);
  } catch (e) {
    console.error(RED + 'X ' + e.message + RST); limpiar(); process.exit(1);
  }
}
main();
