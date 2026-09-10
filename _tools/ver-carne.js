/**
 * Ver la carne en la tienda ANTES de que exista el inventario de verdad.
 *
 *   node _tools/ver-carne.js
 *
 * Abre la tienda local en un Chrome de verdad, con piezas de EJEMPLO. Sirve
 * para mirarla y tocarla; no para decidir precios ni pesos.
 *
 * Por que existe esto y no un `?demo=1` adentro de la tienda: un parametro
 * asi es una segunda puerta que queda viva en produccion y termina mostrando
 * stock inventado a un cliente. Ya se elimino uno por eso (`?autopedido=1`,
 * el 8/9/2026). Aca las piezas se inyectan por CDP, del lado del navegador:
 * el codigo de la tienda no se entera y no hay nada que publicar.
 *
 * Lo que hace, en orden:
 *   1. sirve la carpeta del repo en 127.0.0.1:8090
 *   2. abre Chrome (visible) ahi
 *   3. contesta `action=piezas_full` con piezas de ejemplo
 *   4. BLOQUEA todo POST — ningun pedido llega al Sheets
 *   5. pinta una banda arriba que dice que es una vista previa
 *
 * Se cierra con Ctrl+C, o cerrando la ventana.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.env.PUERTO || 8090);
const VER = '\x1b[32m', AMA = '\x1b[33m', DIM = '\x1b[2m', RST = '\x1b[0m';

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

/* Pesos plausibles de piezas envasadas al vacio. Son INVENTADOS: los de
   verdad salen de pesar cada pieza al recibir la mercaderia. */
const PIEZAS = {
  CCo: [{ id: 'DEMO-01', kg: 1.240 }, { id: 'DEMO-02', kg: 0.983 }, { id: 'DEMO-03', kg: 1.412 }],
  CEn: [{ id: 'DEMO-04', kg: 0.612 }, { id: 'DEMO-05', kg: 0.735 }],
  CLo: [{ id: 'DEMO-06', kg: 1.805 }, { id: 'DEMO-07', kg: 2.010 }],
  CPi: [{ id: 'DEMO-08', kg: 1.120 }],
  CVa: [{ id: 'DEMO-09', kg: 1.640 }, { id: 'DEMO-10', kg: 2.230 }, { id: 'DEMO-11', kg: 1.955 }],
};

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

function servir() {
  return new Promise((listo) => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const abs = path.join(RAIZ, rel);
      /* Nada afuera del repo: el server solo existe para mirar la tienda. */
      if (!abs.startsWith(RAIZ) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
        res.writeHead(404); res.end('no esta'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream',
                           'Cache-Control': 'no-store' });
      fs.createReadStream(abs).pipe(res);
    });
    srv.listen(PUERTO, '127.0.0.1', () => listo(srv));
  });
}

/* El script se inyecta ANTES de que corra la tienda y en CADA carga, asi
   sobrevive a que recargues la pagina o navegues. */
function guion() {
  return `(function () {
  var PIEZAS = ${JSON.stringify(PIEZAS)};
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    var u = String(url);
    if (opts && String(opts.method || '').toUpperCase() === 'POST') {
      console.warn('[vista previa] POST bloqueado:', u);
      return Promise.resolve(new Response('{"ok":true}',
        { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    if (u.indexOf('action=piezas_full') >= 0) {
      return Promise.resolve(new Response(JSON.stringify(PIEZAS),
        { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return orig.apply(this, arguments);
  };
  /* Que se vea que NO es la tienda de verdad. Sin esto, una captura de esta
     pantalla se confunde con produccion. */
  function banda() {
    if (document.getElementById('vista-previa-carne')) return;
    var d = document.createElement('div');
    d.id = 'vista-previa-carne';
    d.textContent = 'VISTA PREVIA \\u00b7 los pesos de la carne son de ejemplo \\u00b7 ningun pedido se guarda';
    d.style.cssText = 'position:fixed;z-index:99999;left:0;right:0;bottom:0;background:#331C1C;' +
      'color:#F2E8C7;font:600 12px/1.5 system-ui,sans-serif;text-align:center;padding:7px 10px;' +
      'letter-spacing:.02em';
    document.body.appendChild(d);
  }
  if (document.body) banda();
  else document.addEventListener('DOMContentLoaded', banda);
})();`;
}

function cdp(url) {
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
    ws.addEventListener('error', () => j(new Error('no conecta con Chrome')));
  });
  return { listo, enviar: (m, p) => new Promise((ok, mal) => {
    const i = ++id; pend.set(i, { ok, mal });
    ws.send(JSON.stringify({ id: i, method: m, params: p || {} }));
  }) };
}

async function esperarPagina(puerto) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + puerto + '/json/list');
      const p = (await r.json()).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch (e) { /* todavia no levanto */ }
    await new Promise((s) => setTimeout(s, 250));
  }
  throw new Error('Chrome no abrio');
}

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }

  await servir();
  const url = 'http://127.0.0.1:' + PUERTO + '/index.html';
  console.log('\n' + VER + 'Tienda servida en ' + url + RST);

  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-vercarne-'));
  const puertoCdp = 9700 + Math.floor(Math.random() * 200);
  const proc = spawn(chrome, ['--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=430,900', 'about:blank'], { stdio: 'ignore' });

  const cli = cdp(await esperarPagina(puertoCdp));
  await cli.listo;
  await cli.enviar('Page.enable');
  await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: guion() });
  await cli.enviar('Page.navigate', { url });

  const cortes = Object.keys(PIEZAS).length;
  const piezas = Object.values(PIEZAS).reduce((a, b) => a + b.length, 0);
  console.log(AMA + 'Piezas de EJEMPLO inyectadas: ' + cortes + ' cortes, ' + piezas + ' piezas.' + RST);
  console.log(DIM + 'Los POST estan bloqueados: podes llegar hasta "Confirmar pedido" sin que se guarde nada.' + RST);
  console.log(DIM + 'Ctrl+C para cerrar.\n' + RST);

  const cerrar = () => { try { proc.kill(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {} process.exit(0); };
  process.on('SIGINT', cerrar);
  proc.on('exit', cerrar);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
