/**
 * Que el formulario no deje mandar un pedido incompleto — y que lo diga.
 *
 *   node _tools/verificar-formulario.js
 *   node _tools/verificar-formulario.js 1440      ← escritorio
 *
 * POR QUE EXISTE. Es el ultimo paso de la compra y falla CALLADO en las dos
 * direcciones: si valida de mas, un cliente que quiere comprar no puede; si
 * valida de menos, entra un pedido sin nombre, sin lote o sin dia y no hay a
 * quien entregarselo. Ninguna otra red mira esto — `verificar-pedido.js`
 * comprueba que el pedido ARMADO llegue bien al backend, no que la tienda
 * frene el que esta a medias.
 *
 * Chequea los tres estados:
 *   1. carrito vacio            → no manda, y lo dice
 *   2. con productos, sin datos → no manda, marca los campos y va al primero
 *   3. todo completo            → manda
 *
 * TRES TRAMPAS DE MEDICION, las tres las pise al escribirlo (11/9/2026):
 *
 *   · El pedido sale por DOS vias: `navigator.sendBeacon` (defensa #1, que
 *     sobrevive al redirect) y `fetch` (defensa #2, que lee la respuesta).
 *     Mirar solo fetch dice "no manda" sobre un pedido que si salio.
 *
 *   · Al enviar, la pagina NAVEGA a WhatsApp — y se lleva puesto cualquier
 *     `window.__loQueSea` donde uno haya ido anotando. Por eso los POST se
 *     capturan por CDP (Network.requestWillBeSent), que vive fuera de la
 *     pagina. Es la razon de fondo por la que el codigo usa sendBeacon.
 *
 *   · El dia NO es un <select>: `f-dia` es un input hidden y la fecha se
 *     elige clickeando una celda del calendario. Y las celdas se marcan
 *     `.available` / `.past` / `.unavailable` — NO existe `.disabled`, asi
 *     que un `:not(.disabled)` agarra un dia pasado, el click no hace nada y
 *     el test culpa al formulario.
 *
 * Sale con codigo 1 si algo no frena lo que tiene que frenar.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = Number(process.env.PUERTO || 8186);
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
  return {
    listo: new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('no conecta'))); }),
    on: (f) => oyentes.push(f),
    enviar: (m, p) => new Promise((ok, mal) => { const i = ++id; pend.set(i, { ok, mal });
      ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }),
  };
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

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-form-'));
  const puertoCdp = 9480 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'], { stdio: 'ignore' });

  let mal = 0;
  const chk = (ok, t) => { if (!ok) mal++; console.log('  ' + (ok ? VER + 'ok   ' : RED + 'MAL  ') + RST + t); };

  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');
    await cli.enviar('Network.enable');
    await cli.enviar('Emulation.setDeviceMetricsOverride',
      { width: ANCHO, height: ALTO, deviceScaleFactor: ANCHO < 700 ? 3 : 1, mobile: ANCHO < 700 });

    /* Los POST se anotan ACA, fuera de la pagina: al enviar, la tienda navega
       a WhatsApp y cualquier variable de la pagina se pierde. */
    let posts = [];
    let navegaciones = [];
    cli.on((m) => {
      if (m.method === 'Network.requestWillBeSent') {
        const r = m.params.request;
        if (r.method === 'POST') posts.push(r.url);
        if (m.params.type === 'Document' && /whatsapp|wa\.me/.test(r.url)) navegaciones.push(r.url);
      }
    });

    /* El POST del pedido NO puede llegar a la planilla: se responde con un ok
       falso. Y se corta la navegacion a WhatsApp para poder seguir midiendo. */
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*script.google.com*' }, { urlPattern: '*whatsapp*' }, { urlPattern: '*wa.me*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      try {
        await cli.enviar('Fetch.fulfillRequest', {
          requestId: m.params.requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' },
                            { name: 'Access-Control-Allow-Origin', value: '*' }],
          body: Buffer.from('{"ok":true,"interceptado":true}').toString('base64'),
        });
      } catch (e) { /* la pagina ya se fue */ }
    });

    const ev = async (e) => {
      const r = await cli.enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error(String((d.exception && (d.exception.description || d.exception.value)) || d.text).slice(0, 160));
      }
      return r.result.value;
    };

    const base = 'http://127.0.0.1:' + PUERTO;
    await cli.enviar('Page.navigate', { url: base + '/index.html?form=' + Date.now() });
    for (let i = 0; i < 150; i++) { if (await ev("typeof PRODUCTOS !== 'undefined'")) break; await dormir(100); }
    await dormir(1000);
    await ev(`(function(){var b=[].slice.call(document.querySelectorAll('button,[onclick]'))
      .filter(function(e){return /estancias/i.test(e.innerText||'');}); if(b.length)b[0].click();})()`);
    await dormir(600);
    await ev(`(function(){var b=[].slice.call(document.querySelectorAll('button,[onclick]'))
      .filter(function(e){return /cualquier d|sin preferencia/i.test(e.innerText||'');}); if(b.length)b[0].click();})()`);
    await dormir(1200);

    console.log('\n' + DIM + '== EL FORMULARIO FRENA LO QUE TIENE QUE FRENAR (' + ANCHO + 'px) ==' + RST + '\n');

    // ── 1. Carrito vacio ────────────────────────────────────────────
    posts = [];
    await ev("enviarPedido();");
    await dormir(700);
    const t1 = await ev(`(function(){ var t = document.querySelector('.toast, #toast');
      return t ? (t.innerText || '').trim().slice(0, 70) : ''; })()`);
    chk(posts.length === 0, 'con el carrito vacio no manda nada');
    chk(/product/i.test(t1), 'y lo dice: "' + t1 + '"');

    // ── 2. Con productos, sin datos ─────────────────────────────────
    await ev(`(function(){ var b = document.querySelectorAll('.add-btn'); if (b[0]) b[0].click(); if (b[2]) b[2].click(); })()`);
    await dormir(700);
    await ev("typeof goToForm === 'function' ? goToForm() : null");
    await dormir(900);
    posts = [];
    await ev("enviarPedido();");
    await dormir(900);
    const t2 = JSON.parse(await ev(`JSON.stringify({
      errores: [].slice.call(document.querySelectorAll('[id^="err-"].visible')).map(function(e){ return e.id; }),
      marcados: document.querySelectorAll('input.error, select.error').length,
      enfocado: (document.activeElement && (document.activeElement.id || document.activeElement.tagName)) || ''
    })`));
    chk(posts.length === 0, 'con productos pero sin datos, tampoco manda');
    chk(t2.errores.length >= 3, t2.errores.length + ' campos avisan que faltan (' + t2.errores.slice(0, 4).join(', ') + ')');
    /* Que el foco vaya al primer campo que falta: sin eso, en el celular hay
       que buscarlo y tocarlo a mano despues de que la pagina scrollea sola. */
    chk(/^f-|^pago/.test(t2.enfocado), 'y el foco queda en el primero que falta: ' + (t2.enfocado || '(en ninguno)'));

    // ── 3. Todo completo ────────────────────────────────────────────
    await ev(`(function(){
      var set = function(id, v){ var e = document.getElementById(id); if (!e) return;
        e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); };
      set('f-nombre', 'Prueba Formulario'); set('f-telefono', '1122334455');
      var bp = document.getElementById('f-barrio-privado');
      if (bp) { for (var i = 0; i < bp.options.length; i++) { if (bp.options[i].value) { bp.selectedIndex = i; break; } }
                bp.dispatchEvent(new Event('change', {bubbles:true})); }
    })()`);
    await dormir(700);
    await ev(`(function(){
      var ba = document.getElementById('f-barrio');
      if (ba) { for (var i = 0; i < ba.options.length; i++) { if (ba.options[i].value) { ba.selectedIndex = i; break; } }
                ba.dispatchEvent(new Event('change', {bubbles:true})); }
      var lo = document.getElementById('f-lote'); if (lo) { lo.value = '123'; lo.dispatchEvent(new Event('input', {bubbles:true})); }
      var c = document.querySelector('#day-picker .dp-cell.available'); if (c) c.click();
      var pg = document.querySelector('input[name="pago"]'); if (pg) { pg.checked = true; pg.dispatchEvent(new Event('change', {bubbles:true})); }
    })()`);
    await dormir(900);

    const listo = JSON.parse(await ev(`JSON.stringify({
      nombre: (document.getElementById('f-nombre')||{}).value || '',
      dia: (document.getElementById('f-dia')||{}).value || '',
      pago: (document.querySelector('input[name=pago]:checked')||{}).value || ''
    })`));
    chk(!!(listo.nombre && listo.dia && listo.pago),
        'el formulario quedo completo para la prueba (dia: ' + (listo.dia || 'NINGUNO') + ')');

    posts = [];
    await ev("enviarPedido();");
    await dormir(3000);
    chk(posts.length > 0, 'con todo completo SI sale el pedido (' + posts.length + ' POST al backend)');
    chk(navegaciones.length > 0, 'y lleva al cliente a WhatsApp con el pedido armado');

  } finally {
    try { proc.kill(); } catch (e) {}
    try { srv.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\n' + (mal ? RED + mal + ' mal' : VER + 'el formulario frena lo incompleto y deja pasar lo completo') + RST + '\n');
  process.exit(mal ? 1 : 0);
}

main().catch((e) => { console.error('ROTO: ' + e.message); process.exit(1); });
