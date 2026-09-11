/**
 * Que Google Analytics siga midiendo.
 *
 *   node _tools/verificar-analytics.js
 *
 * POR QUE EXISTE. El 10/9/2026 el script de GA se paso a carga diferida: pesa
 * 172 KB transferidos —el archivo mas pesado de la tienda, mas del doble que
 * app.js— y en 4G competia por la red y la CPU justo en el arranque.
 *
 * Es un cambio seguro por como esta hecho GA4 (el `gtag()` inline empuja a
 * `dataLayer`, que es una cola, y el script la procesa cuando llega), pero si
 * se rompe **no lo avisa nadie**: la tienda funciona igual, no hay error en
 * consola, y el sintoma es que dentro de un mes faltan datos. Para entonces ya
 * no hay forma de recuperarlos ni de saber desde cuando.
 *
 * Chequea las dos ramas:
 *   1. sin tocar nada — el script llega solo despues del load, y el pageview sale
 *   2. tocando la pantalla enseguida — se trae en el acto, sin esperar
 *
 * Y que el evento de compra siga llegando, que es el que le importa a la pauta.
 *
 * Sale con codigo 1 si algo no mide.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.env.PUERTO || 8199);
const RED = '\x1b[31m', VER = '\x1b[32m', DIM = '\x1b[2m', RST = '\x1b[0m';

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

function servir() {
  return new Promise((listo, fallo) => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const abs = path.join(RAIZ, rel);
      if (!abs.startsWith(RAIZ) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
        res.writeHead(404); res.end('no esta'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream',
                           'Cache-Control': 'no-store' });
      fs.createReadStream(abs).pipe(res);
    });
    srv.on('error', fallo);
    srv.listen(PUERTO, '127.0.0.1', () => listo(srv));
  });
}

function cdp(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map(); const oyentes = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      m.error ? mal(new Error(m.error.message)) : ok(m.result);
    } else if (m.method) oyentes.forEach((f) => f(m));
  });
  return { listo: new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('no conecta'))); }),
    on: (f) => oyentes.push(f),
    enviar: (m, p) => new Promise((ok, mal) => { const i = ++id; pend.set(i, { ok, mal });
      ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }) };
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

const dormir = (ms) => new Promise((s) => setTimeout(s, ms));

const ES_HIT = /google-analytics.com\/[a-z]?\/?collect|analytics.google.com/;

/* Esperar AL HIT, no un tiempo fijo.

   Medido el 11/9/2026: desde el toque, el pageview tarda ~5,2 s — y lo que
   manda no es la tienda sino la descarga de gtag/js, 172 KB, desde Google.
   El test dormia 1500 ms en esa rama y 5000 en la otra: la primera fallaba
   SIEMPRE y la segunda estaba a un mal dia de red de volverse intermitente.
   Un numero fijo aca mide la conexion del dia, no si Analytics anda. */
async function esperarHit(urls, tope) {
  const t0 = Date.now();
  for (let i = 0; i < tope * 10; i++) {
    if (urls.some((u) => ES_HIT.test(u))) return Date.now() - t0;
    await dormir(100);
  }
  return -1;
}

async function correr(cli, urls, tocar) {
  urls.length = 0;
  await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?ga=' + Date.now() });
  for (let i = 0; i < 120; i++) {
    const r = await cli.enviar('Runtime.evaluate', { returnByValue: true,
      expression: "typeof PRODUCTOS !== 'undefined'" });
    if (r.result && r.result.value === true) break;
    await dormir(100);
  }
  const tGtagAntes = urls.filter((u) => u.indexOf('gtag/js') >= 0).length;
  let tardo = -1;
  if (tocar) {
    /* Un toque de verdad: el listener es `pointerdown` con {once:true}. */
    await cli.enviar('Input.dispatchMouseEvent', { type: 'mousePressed', x: 30, y: 300, button: 'left', clickCount: 1 });
    await cli.enviar('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 30, y: 300, button: 'left', clickCount: 1 });
    tardo = await esperarHit(urls, 20);
  } else {
    tardo = await esperarHit(urls, 25);   // load + los 800 ms del diferido + la descarga
  }
  await dormir(300);   // que entre el hit si salio justo en el ultimo sondeo
  return {
    antesDelToque: tGtagAntes,
    tardo: tardo,
    script: urls.some((u) => u.indexOf('googletagmanager.com/gtag/js') >= 0),
    hits: urls.filter((u) => ES_HIT.test(u)),
  };
}

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-ga-'));
  const puertoCdp = 9600 + Math.floor(Math.random() * 200);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });

  let fallas = 0;
  const chequeo = (t, ok) => { if (!ok) fallas++; console.log('  ' + (ok ? VER + 'ok  ' : RED + 'MAL ') + RST + t); };

  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');
    await cli.enviar('Network.enable');
    const urls = [];
    cli.on((m) => { if (m.method === 'Network.requestWillBeSent') urls.push(m.params.request.url); });

    console.log('\n== ANALYTICS: ¿sigue midiendo con la carga diferida? ==\n');

    const a = await correr(cli, urls, false);
    chequeo('el script de Google llega solo, sin tocar nada', a.script === true);
    chequeo('el pageview sale solo (' + a.hits.length + ' hit, ' + a.tardo + ' ms)', a.hits.length > 0);

    const b = await correr(cli, urls, true);
    chequeo('no se pide antes de tiempo', b.antesDelToque === 0);
    chequeo('al tocar la pantalla se trae en el acto', b.script === true);
    chequeo('y el pageview sale igual (' + b.hits.length + ' hit, ' + b.tardo + ' ms)', b.hits.length > 0);

    /* Que el ID sea el de Maleu y no haya quedado el de ejemplo. */
    const idOk = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8').indexOf('G-H3W8C74PQP') >= 0;
    chequeo('el ID de medicion es el de Maleu', idOk);
  } finally {
    try { proc.kill(); } catch (e) {}
    try { srv.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }

  console.log();
  if (fallas) { console.log(RED + fallas + ' fallan — Analytics NO esta midiendo bien' + RST); process.exit(1); }
  console.log(DIM + 'Analytics mide igual, y sin pesar en el arranque' + RST);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
