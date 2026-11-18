/**
 * Un alta que falla queda ANOTADA y el cliente tiene «Reintentar» sin perder el carrito (17/11/2026, 751).
 *
 *   node _tools/verificar-alta-fallida.js            ← 390px
 *   node _tools/verificar-alta-fallida.js 1440
 *   SOLO=error node _tools/verificar-alta-fallida.js
 *
 * Con `__altaBaseForzar` (el camino de maleu.com.ar) y la base SIMULADA por CDP —nada sale a escribir—:
 *   error   la base contesta con error → el cartel con «Reintentar» sale ENSEGUIDA (no a los 45 s), el carrito sigue
 *           entero, cada intento fallido se anota (`tienda_alta_fallida_anotar`: ref, nombre, teléfono, carrito,
 *           error, intento). «Reintentar» con la base todavía mal → vuelve el cartel; con la base bien → el pedido
 *           entra, con el MISMO clientOrderId, y recién ahí se vacía el carrito.
 *   cuelga  la base no contesta (8 s por intento) → NO sale enseguida: a los 45 s, con «Reintentar» y el error
 *           «tiempo-8s» anotado. «Reintentar» con la base bien → entra.
 * Las lecturas de la base (stock, catálogo, ¿entró?) van a la base de verdad, que solo lee; cualquier otra RPC se corta.
 * Apps Script, Analytics y Meta, cortados. Sale con código 1 si algo falla.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = Number(process.env.PUERTO || (8340 + Math.floor(Math.random() * 60)));
const SOLO = process.env.SOLO || '';
const RED = '\x1b[31m', VER = '\x1b[32m', DIM = '\x1b[2m', RST = '\x1b[0m';
const CHROMES = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const LEE = /\/rpc\/(tienda_piezas|tienda_saldo_cliente|tienda_seguimiento|tienda_stock|tienda_validar_cupon|tienda_vendedores|catalogo_tienda|tienda_cuentas|tienda_pedido_entro)\b/;
const umbral = (n, d) => { try { const m = new RegExp('var ' + n + ' = (\\d+)').exec(fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8')); return m ? Number(m[1]) : d; } catch (e) { return d; } };
const FALLBACK_MS = umbral('SEND_FALLBACK_MS', 45000);

function servir() {
  return new Promise((listo, fallo) => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const abs = path.join(RAIZ, rel);
      if (!abs.startsWith(RAIZ) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404); res.end('no esta'); return; }
      if (rel === '/app.js') {   // segundo seguro: Apps Script apunta a uno que no existe
        const src = fs.readFileSync(abs, 'utf8');
        const falso = src.replace(/\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec/g, '/macros/s/PRUEBA-alta-fallida-NO-EXISTE/exec');
        res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-store' }); res.end(falso); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
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
    if (m.id && pend.has(m.id)) { const { ok, mal } = pend.get(m.id); pend.delete(m.id); m.error ? mal(new Error(m.error.message)) : ok(m.result); }
    else if (m.method) oyentes.forEach((f) => f(m));
  });
  return {
    listo: new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('no conecta'))); }),
    on: (f) => oyentes.push(f),
    enviar: (m, p) => new Promise((ok, mal) => { const i = ++id; pend.set(i, { ok, mal }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }),
  };
}
async function esperarPagina(puerto) {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch('http://127.0.0.1:' + puerto + '/json/list'); const p = (await r.json()).find((t) => t.type === 'page' && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch (e) {}
    await new Promise((s) => setTimeout(s, 250));
  }
  throw new Error('Chrome no abrio');
}
const dormir = (ms) => new Promise((s) => setTimeout(s, ms));

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const base = 'http://127.0.0.1:' + PUERTO;
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-altaf-'));
  const puertoCdp = 9660 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=' + puertoCdp,
    '--user-data-dir=' + perfil, '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'], { stdio: 'ignore' });
  let mal = 0;
  const chk = (ok, t) => { if (!ok) mal++; console.log('  ' + (ok ? VER + 'ok   ' : RED + 'MAL  ') + RST + t); };
  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable'); await cli.enviar('Runtime.enable'); await cli.enviar('Network.enable');
    await cli.enviar('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: ANCHO < 700 ? 3 : 1, mobile: ANCHO < 700 });
    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__altaBaseForzar = true;' });

    /* La base simulada: `modo` dice qué contesta el alta. */
    let modo = 'error', altas = [], anotadas = [], cortadas = [], appsPost = 0;
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*supabase.co/rest/v1/rpc/*' }, { urlPattern: '*script.google.com*' },
      { urlPattern: '*google-analytics.com*' }, { urlPattern: '*googletagmanager.com*' }, { urlPattern: '*facebook.*' },
      { urlPattern: '*doubleclick.net*' }, { urlPattern: '*wa.me*' }] });
    const fulfill = (requestId, body, code) => cli.enviar('Fetch.fulfillRequest', { requestId, responseCode: code || 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Headers', value: '*' }], body: Buffer.from(body).toString('base64') }).catch(() => {});
    const corta = (requestId) => cli.enviar('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }).catch(() => {});
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const { requestId, request } = m.params, url = request.url;
      if (/script\.google\.com/.test(url)) {
        if (request.method === 'POST') { appsPost++; return corta(requestId); }   // el alta NO puede caer a Apps Script
        return fulfill(requestId, '{"ok":true}');
      }
      if (!/supabase\.co/.test(url)) return corta(requestId);
      if (request.method === 'OPTIONS') return fulfill(requestId, '');
      if (LEE.test(url)) return cli.enviar('Fetch.continueRequest', { requestId }).catch(() => {});
      let p = {}; try { p = (JSON.parse(request.postData || '{}').p) || {}; } catch (e) {}
      if (/\/rpc\/pedido_alta_directo/.test(url)) {
        altas.push({ t: Date.now(), coid: p.clientOrderId, modo });
        if (modo === 'cuelga') return;                                   // la tienda lo aborta a los 8 s
        if (modo === 'error') return fulfill(requestId, '{"ok":false,"err":"permission denied for table order_command"}');
        return fulfill(requestId, '{"ok":true,"directo":true,"n":"4321","aceptada":true}');
      }
      if (/\/rpc\/tienda_alta_fallida_anotar/.test(url)) { anotadas.push(p); return fulfill(requestId, '{"ok":true,"alerta":true}'); }
      if (/\/rpc\/directa_no_anotar/.test(url)) return fulfill(requestId, '{"ok":true}');
      cortadas.push(url.split('/rpc/')[1]); return corta(requestId);
    });
    const ev = async (e) => { const r = await cli.enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(String((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text).slice(0, 160)); return r.result.value; };
    const evS = async (e) => { try { return await ev(e); } catch (x) { return null; } };

    async function prepararPedido() {
      await cli.enviar('Page.navigate', { url: 'about:blank' }); await dormir(300);
      await cli.enviar('Storage.clearDataForOrigin', { origin: base, storageTypes: 'local_storage' });
      await cli.enviar('Page.navigate', { url: base + '/index.html?altaf=' + Date.now() });
      for (let i = 0; i < 150; i++) { if (await evS("typeof enviarPedido === 'function' && typeof PRODUCTOS !== 'undefined'")) break; await dormir(100); }
      await dormir(1500);
      await ev(`(function(){ if (typeof showZoneModal === 'function') showZoneModal('test'); var i = document.getElementById('dir-input');
        if (i) { i.value = 'Estancias del Pilar'; if (typeof dirBuscar === 'function') dirBuscar(); } })()`);
      await dormir(300);
      await ev(`(function(){ var b = document.querySelector('#dir-lista .dir-op'); if (b) b.click(); })()`);
      await dormir(600);
      await ev(`(function(){var b=[].slice.call(document.querySelectorAll('button,[onclick]')).filter(function(e){return /cualquier d|sin preferencia/i.test(e.innerText||'');}); if(b.length)b[0].click();})()`);
      await dormir(1000);
      await ev(`(function(){ var b = [].slice.call(document.querySelectorAll('.add-btn')).filter(function(x){ return !x.disabled && x.offsetParent; }); if (b[0]) b[0].click(); if (b[1]) b[1].click(); })()`);
      await dormir(600);
      await ev("typeof goToForm === 'function' ? goToForm() : null"); await dormir(800);
      await ev(`(function(){ var set = function(id, v){ var e = document.getElementById(id); if (!e) return; e.value = v;
          e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); };
        set('f-nombre', 'Prueba Alta Fallida'); set('f-telefono', '1122334455'); set('f-mail', 'prueba.alta@gmail.com');
        var bp = document.getElementById('f-barrio-privado');
        if (bp) { for (var i = 0; i < bp.options.length; i++) { if (bp.options[i].value === 'Estancias del Pilar') { bp.selectedIndex = i; break; } } bp.dispatchEvent(new Event('change', {bubbles:true})); } })()`);
      await dormir(600);
      await ev(`(function(){ var ba = document.getElementById('f-barrio');
        if (ba) { for (var i = 0; i < ba.options.length; i++) { if (ba.options[i].value) { ba.selectedIndex = i; break; } } ba.dispatchEvent(new Event('change', {bubbles:true})); }
        var lo = document.getElementById('f-lote'); if (lo) { lo.value = '123'; lo.dispatchEvent(new Event('input', {bubbles:true})); }
        var c = document.querySelector('#day-picker .dp-cell.available'); if (c) c.click();
        var pg = document.querySelector('input[name="pago"][value="Efectivo"]') || document.querySelector('input[name="pago"]');
        if (pg) { pg.checked = true; pg.dispatchEvent(new Event('change', {bubbles:true})); } })()`);
      await dormir(700);
      const listo = JSON.parse(await ev(`JSON.stringify({ n: cartCount(), nombre: document.getElementById('f-nombre').value, dia: (document.getElementById('f-dia')||{}).value || '',
        pago: (document.querySelector('input[name=pago]:checked')||{}).value || '' })`));
      if (!(listo.n > 0 && listo.nombre && listo.dia && listo.pago)) throw new Error('no pude armar el pedido de prueba: ' + JSON.stringify(listo));
      await ev(`window.__mails = []; _abrirMail = function (u) { window.__mails.push(String(u)); };`);
      return listo.n;
    }
    const estado = async () => JSON.parse(await ev(`(function(){ var c = document.querySelector('#send-overlay .send-card'), rb = document.getElementById('send-reintentar-btn'),
      fb = document.getElementById('send-wa-btn'), r = rb ? rb.getBoundingClientRect() : null;
      return JSON.stringify({ cls: c ? c.className : '', tit: (document.getElementById('send-title')||{}).textContent || '', sub: (document.getElementById('send-sub')||{}).textContent || '',
        reint: !!(rb && !rb.hidden && r && r.height > 0), reintH: r ? Math.round(r.height) : 0, reintArriba: !!(rb && fb && r && r.top < fb.getBoundingClientRect().top),
        carrito: cartCount(), mails: (window.__mails || []).length }); })()`));
    async function esperar(cond, hastaMs) { const t0 = Date.now(); while (Date.now() - t0 < hastaMs) { const s = await estado(); if (cond(s)) return Object.assign(s, { t: Date.now() - t0 }); await dormir(200); } return null; }
    const tocar = async (id) => { const r = JSON.parse(await ev(`(function(){var e=document.getElementById('${id}');e.scrollIntoView({block:'center'});var b=e.getBoundingClientRect();return JSON.stringify({x:b.left+b.width/2,y:b.top+b.height/2});})()`));
      for (const type of ['mousePressed', 'mouseReleased']) await cli.enviar('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 }); };
    const correr = (n) => !SOLO || SOLO.split(',').indexOf(n) >= 0;
    const fallback = (s) => /fallback/.test(s.cls);
    const cerro = (s) => /\bdone\b|success/.test(s.cls) && !/Registrando/.test(s.tit);

    if (correr('error')) {
      console.log('\n' + DIM + '== la base contesta con error (' + ANCHO + 'px) ==' + RST);
      modo = 'error'; altas = []; anotadas = [];
      const n0 = await prepararPedido();
      await ev('enviarPedido();');
      const f = await esperar(fallback, 15000);
      chk(!!f && f.t < 8000, 'el cartel sale ENSEGUIDA, no a los ' + FALLBACK_MS / 1000 + ' s: ' + (f ? f.t + ' ms' : 'no salió'));
      chk(!!f && f.reint && f.reintArriba, '«Reintentar» a la vista y arriba del mail');
      if (ANCHO < 700) chk(!!f && f.reintH >= 44, 'el botón mide ' + (f && f.reintH) + ' px (≥ 44)');
      chk(!!f && /carrito sigue/i.test(f.sub), 'dice que el carrito sigue: "' + (f && f.sub) + '"');
      chk(!!f && f.carrito === n0, 'y el carrito está entero (' + (f && f.carrito) + ' de ' + n0 + ')');
      await dormir(800);
      const a = anotadas[0] || {};
      chk(anotadas.length >= 1 && /^co_\d+_[a-z0-9]+$/.test(a.ref || '') && a.ref === (altas[0] || {}).coid, 'el intento fallido quedó anotado con su ref (' + anotadas.length + ' anotados)');
      chk(a.nombre === 'Prueba Alta Fallida' && a.telefono === '1122334455' && Array.isArray(a.items) && a.items.length > 0 && a.items.every((i) => i.nombre && i.qty > 0),
        'con nombre, teléfono y el carrito (' + (a.items || []).map((i) => i.qty + ' ' + i.nombre).join(', ') + ')');
      chk(/base:/.test(a.error || '') && a.intento >= 1, 'y el error: "' + a.error + '" (intento ' + a.intento + ')');
      // Reintentar con la base todavía mal: vuelve el cartel.
      const nAltas = altas.length;
      await tocar('send-reintentar-btn');
      const r1 = await esperar((s) => /Registrando/.test(s.tit), 3000);
      chk(!!r1 && /Probando de nuevo/.test(r1.sub), 'al tocar «Reintentar» vuelve a «Registrando…»');
      const f2 = await esperar(fallback, 10000);
      chk(!!f2 && f2.reint && altas.length > nAltas, 'sigue mal: vuelve el cartel con «Reintentar» (' + (altas.length - nAltas) + ' intento(s) más)');
      chk(altas.every((x) => x.coid === altas[0].coid), 'todos los intentos con el MISMO clientOrderId: no puede entrar dos veces');
      // Ahora la base contesta bien.
      modo = 'ok';
      await tocar('send-reintentar-btn');
      const c = await esperar(cerro, 12000);
      chk(!!c && /4321/.test(c.tit), 'con la base bien, el pedido entra: "' + (c && c.tit) + '"');
      chk(!!c && c.carrito === 0, 'y recién ahí se vacía el carrito');
      chk(!!c && c.mails === 0 && appsPost === 0, 'sin abrir el mail y sin caer a Apps Script (' + appsPost + ' POST)');
    }

    if (correr('cuelga')) {
      console.log('\n' + DIM + '== la base no contesta (' + ANCHO + 'px) ==' + RST);
      modo = 'cuelga'; altas = []; anotadas = []; appsPost = 0;
      const n0 = await prepararPedido();
      await ev('enviarPedido();');
      const temprano = await esperar(fallback, 25000);
      chk(!temprano, 'un tiempo agotado NO saca el cartel enseguida (puede estar entrando)');
      const f = await esperar(fallback, FALLBACK_MS + 15000);
      chk(!!f && f.reint && f.carrito === n0, 'a los ' + FALLBACK_MS / 1000 + ' s: «Reintentar», con el carrito entero');
      chk(anotadas.some((a) => /tiempo-8s/.test(a.error || '')), 'el intento quedó anotado con «tiempo-8s» (' + anotadas.map((a) => a.error).join(' | ').slice(0, 120) + ')');
      modo = 'ok';
      await tocar('send-reintentar-btn');
      const c = await esperar(cerro, 15000);
      chk(!!c && /4321/.test(c.tit) && c.carrito === 0, 'Reintentar con la base bien: entra y se vacía el carrito (' + (c && c.tit) + ')');
    }
    chk(cortadas.length === 0, 'ninguna otra RPC de escritura salió' + (cortadas.length ? ': ' + cortadas.join(', ') : ''));
  } finally {
    try { proc.kill(); } catch (e) {}
    try { srv.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  console.log('\n' + (mal ? RED + mal + ' mal' : VER + 'un alta que falla queda anotada y se puede reintentar') + RST + '\n');
  process.exit(mal ? 1 : 0);
}
main().catch((e) => { console.error('ROTO: ' + e.message); process.exit(1); });
