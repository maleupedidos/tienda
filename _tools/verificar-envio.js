/**
 * Que un pedido NUNCA parezca registrado si el backend no lo confirmo.
 *
 *   node _tools/verificar-envio.js            ← 390px
 *   node _tools/verificar-envio.js 1440       ← escritorio
 *   SOLO=cuelga node _tools/verificar-envio.js
 *
 * POR QUE EXISTE (11/9/2026). Un pedido de $84.600 del 10/9 le
 * llego a Maleu por WhatsApp y nunca llego a la planilla. La tienda mandaba al
 * cliente a WhatsApp a los 3,8 s si `navigator.sendBeacon` devolvia true — y
 * true solo quiere decir "el navegador lo puso en la cola". Como Apps Script
 * tarda ~5 s en contestar, la confirmacion real no llegaba nunca a tiempo: el
 * 100% de los pedidos salia sin confirmar, y el que no llegaba se perdia sin
 * ningun error.
 *
 * Seis escenarios, con el backend SIMULADO:
 *   ok6      contesta ok a los 6 s   → WhatsApp recien despues, mensaje normal, 1 solo POST
 *   lento12  contesta a los 12 s     → dice "conexion lenta" y espera
 *   cuelga   no contesta nunca       → a los 25 s ofrece WhatsApp; el mensaje dice que NO se registro
 *   error2   2 {ok:false} y despues ok → reintenta de a uno, nunca dos POST a la vez
 *   red2     2 fallas de red y despues ok
 *   tarde27  contesta a los 27 s     → ya mostro el fallback, pero sigue solo por el camino normal
 *
 * NINGUN POST PUEDE LLEGAR A LA PLANILLA. Se cortan por CDP (Fetch), fuera de
 * la pagina, desde antes de la primera navegacion: asi quedan cortados tambien
 * los reintentos y los beacons que la tienda dispara al recargar o al irse.
 * El 11/9/2026 un script que los cortaba ADENTRO de la pagina dejo pasar uno:
 * la pagina recargo, la tienda reintento el pedido guardado en localStorage y
 * entro "Prueba Escaneo" a la hoja Home. Aca eso no puede pasar.
 *
 * Tambien se cortan Analytics y el pixel de Meta: una compra de prueba no
 * puede contarse como venta.
 *
 * Sale con codigo 1 si algo falla.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = Number(process.env.PUERTO || (8280 + Math.floor(Math.random() * 60)));
const SOLO = process.env.SOLO || '';
const RED = '\x1b[31m', VER = '\x1b[32m', DIM = '\x1b[2m', RST = '\x1b[0m';

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

function servir() {
  return new Promise((listo, fallo) => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      /* Una pagina del MISMO origen que no carga app.js: para leer el
         localStorage despues de que la tienda se fue a WhatsApp, sin que
         arranque y reintente lo pendiente. */
      if (rel === '/__vacio') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<p>vacio</p>'); return; }
      const abs = path.join(RAIZ, rel);
      if (!abs.startsWith(RAIZ) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
        res.writeHead(404); res.end('no esta'); return;
      }
      /* SEGUNDO SEGURO: app.js se sirve con el backend real cambiado por uno
         que NO EXISTE. Si algun POST se escapara de la intercepcion de abajo,
         Google contesta 404 y no escribe nada. */
      if (rel === '/app.js') {
        const src = fs.readFileSync(abs, 'utf8');
        const falso = src.replace(/\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec/g, '/macros/s/PRUEBA-verificar-envio-NO-EXISTE/exec');
        if (falso === src) { res.writeHead(500); res.end('no encontre la URL del backend para neutralizarla'); return; }
        res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-store' });
        res.end(falso); return;
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

/* Como contesta el backend simulado a cada POST de fetch (n = 1, 2, 3...). */
const MODOS = {
  ok6:     () => ({ en: 6000, que: 'ok' }),
  lento12: () => ({ en: 12000, que: 'ok' }),
  cuelga:  () => ({ que: 'cuelga' }),
  error2:  (n) => (n <= 2 ? { en: 800, que: 'noOk' } : { en: 1500, que: 'ok' }),
  red2:    (n) => (n <= 2 ? { en: 300, que: 'falla' } : { en: 1500, que: 'ok' }),
  tarde27: () => ({ en: 27000, que: 'ok' }),
};

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const base = 'http://127.0.0.1:' + PUERTO;
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-envio-'));
  const puertoCdp = 9560 + Math.floor(Math.random() * 90);
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

    /* ── El backend simulado. Se engancha ANTES de la primera navegacion. ── */
    let modo = 'ok6', posts = [], navs = [], enVuelo = 0, maxEnVuelo = 0, nFetch = 0, t0 = 0, noBackend = 0;
    await cli.enviar('Fetch.enable', { patterns: [
      { urlPattern: '*script.google.com*' }, { urlPattern: '*wa.me*' }, { urlPattern: '*whatsapp*' },
      { urlPattern: '*google-analytics.com*' }, { urlPattern: '*googletagmanager.com*' },
      { urlPattern: '*facebook.com*' }, { urlPattern: '*facebook.net*' }, { urlPattern: '*doubleclick.net*' },
    ] });
    const fulfill = (requestId, body, tipo) => cli.enviar('Fetch.fulfillRequest', {
      requestId, responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: tipo || 'application/json' },
                        { name: 'Access-Control-Allow-Origin', value: '*' }],
      body: Buffer.from(body).toString('base64'),
    }).catch(() => {});
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const { requestId, request, resourceType, networkId } = m.params;
      const url = request.url;
      if (/wa\.me|whatsapp/.test(url)) {
        if (/^https:\/\/wa\.me\/\d/.test(url)) navs.push({ t: Date.now() - t0, url });   // no el favicon
        fulfill(requestId, '<p>whatsapp simulado</p>', 'text/html');
        return;
      }
      if (!/script\.google\.com/.test(url)) {          // analytics / pixel: cortados
        cli.enviar('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }).catch(() => {});
        return;
      }
      if (request.method !== 'POST') { fulfill(requestId, '{"ok":true}'); return; }
      noBackend++;   // un POST al backend: lo contesta el simulador, jamas la planilla
      let body = request.postData || '';
      if (!body && request.hasPostData && networkId) {
        try { body = (await cli.enviar('Network.getRequestPostData', { requestId: networkId })).postData || ''; } catch (e) {}
      }
      let data = {};
      try { data = JSON.parse(body); } catch (e) {}
      const ev = { t: Date.now() - t0, tipo: resourceType, coid: data.clientOrderId || '', accion: data.action || '' };
      posts.push(ev);
      if (resourceType !== 'Fetch' && resourceType !== 'XHR') { fulfill(requestId, '{"ok":true}'); return; }
      if (data.action) { fulfill(requestId, '{"ok":true}'); return; }   // usarCupon, guardarCumple...
      nFetch++;
      const plan = MODOS[modo](nFetch);
      enVuelo++; maxEnVuelo = Math.max(maxEnVuelo, enVuelo);
      if (plan.que === 'cuelga') return;                 // queda colgado: el navegador lo aborta a los 30 s
      setTimeout(() => {
        enVuelo--;
        if (plan.que === 'falla') { cli.enviar('Fetch.failRequest', { requestId, errorReason: 'ConnectionFailed' }).catch(() => {}); return; }
        fulfill(requestId, plan.que === 'ok' ? '{"ok":true,"n":"999","oc":"no-corresponde"}' : '{"ok":false,"error":"LockTimeout","retry":true}');
      }, plan.en);
    });

    const ev = async (e) => {
      const r = await cli.enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error(String((d.exception && (d.exception.description || d.exception.value)) || d.text).slice(0, 160));
      }
      return r.result.value;
    };
    const evSeguro = async (e) => { try { return await ev(e); } catch (x) { return null; } };

    /* Deja un pedido completo listo en el formulario. */
    async function prepararPedido() {
      await cli.enviar('Page.navigate', { url: 'about:blank' });
      await dormir(300);
      await cli.enviar('Storage.clearDataForOrigin', { origin: base, storageTypes: 'local_storage' });
      await cli.enviar('Page.navigate', { url: base + '/index.html?envio=' + Date.now() });
      for (let i = 0; i < 150; i++) { if (await evSeguro("typeof enviarPedido === 'function' && typeof PRODUCTOS !== 'undefined'")) break; await dormir(100); }
      await dormir(900);
      await ev(`(function(){var b=[].slice.call(document.querySelectorAll('button,[onclick]'))
        .filter(function(e){return /estancias/i.test(e.innerText||'');}); if(b.length)b[0].click();})()`);
      await dormir(600);
      await ev(`(function(){var b=[].slice.call(document.querySelectorAll('button,[onclick]'))
        .filter(function(e){return /cualquier d|sin preferencia/i.test(e.innerText||'');}); if(b.length)b[0].click();})()`);
      await dormir(1000);
      await ev(`(function(){ var b = [].slice.call(document.querySelectorAll('.add-btn')).filter(function(x){ return !x.disabled && x.offsetParent; });
        if (b[0]) b[0].click(); if (b[1]) b[1].click(); })()`);
      await dormir(600);
      await ev("typeof goToForm === 'function' ? goToForm() : null");
      await dormir(800);
      await ev(`(function(){
        var set = function(id, v){ var e = document.getElementById(id); if (!e) return;
          e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); };
        set('f-nombre', 'Prueba Envio'); set('f-telefono', '1122334455');
        var bp = document.getElementById('f-barrio-privado');
        if (bp) { for (var i = 0; i < bp.options.length; i++) { if (bp.options[i].value === 'Estancias del Pilar') { bp.selectedIndex = i; break; } }
                  bp.dispatchEvent(new Event('change', {bubbles:true})); }
      })()`);
      await dormir(600);
      await ev(`(function(){
        var ba = document.getElementById('f-barrio');
        if (ba) { for (var i = 0; i < ba.options.length; i++) { if (ba.options[i].value) { ba.selectedIndex = i; break; } }
                  ba.dispatchEvent(new Event('change', {bubbles:true})); }
        var lo = document.getElementById('f-lote'); if (lo) { lo.value = '123'; lo.dispatchEvent(new Event('input', {bubbles:true})); }
        var c = document.querySelector('#day-picker .dp-cell.available'); if (c) c.click();
        var pg = document.querySelector('input[name="pago"][value="Efectivo"]') || document.querySelector('input[name="pago"]');
        if (pg) { pg.checked = true; pg.dispatchEvent(new Event('change', {bubbles:true})); }
      })()`);
      await dormir(700);
      const listo = JSON.parse(await ev(`JSON.stringify({ n: typeof cartCount === 'function' ? cartCount() : 0,
        nombre: (document.getElementById('f-nombre')||{}).value || '', dia: (document.getElementById('f-dia')||{}).value || '',
        pago: (document.querySelector('input[name=pago]:checked')||{}).value || '' })`));
      if (!(listo.n > 0 && listo.nombre && listo.dia && listo.pago)) throw new Error('no pude armar el pedido de prueba: ' + JSON.stringify(listo));
    }

    /* Manda el pedido y anota, cada 200 ms, en que estado esta el cartel. */
    async function enviarYMirar(hastaMs, alMirar) {
      posts = []; navs = []; enVuelo = 0; maxEnVuelo = 0; nFetch = 0;
      const estados = [];
      t0 = Date.now();
      await ev('enviarPedido();');
      while (Date.now() - t0 < hastaMs) {
        const s = await evSeguro(`(function(){ var c = document.querySelector('#send-overlay .send-card'); var ov = document.getElementById('send-overlay');
          var b = document.getElementById('send-wa-btn'); var r = b ? b.getBoundingClientRect() : null;
          return JSON.stringify({ activo: !!(ov && ov.classList.contains('active')), cls: c ? c.className : '',
            tit: (document.getElementById('send-title')||{}).textContent || '', sub: (document.getElementById('send-sub')||{}).textContent || '',
            btn: r && r.height > 0 ? { h: Math.round(r.height), w: Math.round(r.width), top: Math.round(r.top), bottom: Math.round(r.bottom) } : null,
            vh: window.innerHeight, vw: window.innerWidth, scrollW: document.documentElement.scrollWidth }); })()`);
        if (s) { const o = JSON.parse(s); o.t = Date.now() - t0; estados.push(o); if (alMirar && await alMirar(o)) break; }
        if (navs.length && Date.now() - t0 > navs[0].t + 400) break;
        await dormir(200);
      }
      return estados;
    }
    /* searchParams ya decodifica: decodificar otra vez rompe con el '%' de "10% OFF". */
    const textoWA = (u) => { try { return new URL(u).searchParams.get('text') || ''; } catch (e) { return ''; } };
    /* Los caracteres fuera del plano basico (codepoint > U+FFFF): son los emoji
       que en algunos celulares llegan a WhatsApp como U+FFFD. */
    const sinEmoji4 = (s) => Array.from(String(s)).filter((c) => c.codePointAt(0) > 0xFFFF).map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase());
    const refDe = (coid) => { const m = String(coid).match(/_([a-z0-9]{3,})$/i); return m ? m[1].slice(0, 5).toUpperCase() : '??'; };
    async function pendientes() {
      await cli.enviar('Page.navigate', { url: base + '/__vacio' });
      await dormir(400);
      return JSON.parse(await ev("localStorage.getItem('maleu_pending_orders') || '{}'"));
    }
    /* Chrome reporta un fetch() como 'XHR' o 'Fetch' segun la version; un beacon, como 'Ping'. */
    const esFetch = (p) => p.tipo === 'Fetch' || p.tipo === 'XHR';
    const fetches = () => posts.filter((p) => esFetch(p) && !p.accion);
    const beacons = () => posts.filter((p) => !esFetch(p) && !p.accion);

    const correr = (n) => !SOLO || SOLO.split(',').indexOf(n) >= 0;

    // ── ok6 ──────────────────────────────────────────────────────────────
    if (correr('ok6')) {
      console.log('\n' + DIM + '== el backend confirma a los 6 s (' + ANCHO + 'px) ==' + RST);
      modo = 'ok6'; await prepararPedido();
      const est = await enviarYMirar(12000);
      const nav = navs[0];
      const antes = est.filter((e) => e.t < 5500);
      chk(antes.length > 3 && antes.every((e) => e.activo && /Registrando/.test(e.tit)), 'mientras espera dice "Registrando tu pedido" (' + (antes[0] ? antes[0].tit : '-') + ')');
      chk(!!nav && nav.t >= 6000, 'a WhatsApp recien DESPUES de la confirmacion: ' + (nav ? nav.t + ' ms' : 'no fue') + ' (antes: 3.800 ms sin confirmar)');
      chk(!!nav && nav.t <= 9500, 'y sin demora de mas despues de confirmar (' + (nav ? nav.t : '-') + ' ms)');
      chk(est.some((e) => /success/.test(e.cls) && /registrado/i.test(e.tit)), 'antes de irse muestra "¡Pedido registrado!"');
      chk(fetches().length === 1 && beacons().length === 0, 'un solo POST al backend (' + fetches().length + ' fetch, ' + beacons().length + ' beacon) — antes eran 3 y hasta 18');
      const txt = nav ? textoWA(nav.url) : '';
      const coid = (fetches()[0] || {}).coid || '';
      chk(/^Hola! Quiero hacer un pedido:/.test(txt), 'la primera linea del mensaje no cambio');
      chk(/\nEntrega: [^\n]*\d\d\/\d\d/.test(txt), 'el mensaje dice el dia de entrega: ' + ((txt.match(/Entrega:[^\n]*/) || [''])[0]));
      /* 12/9/2026: la referencia ("_Pedido web · G4ZDJ_") salio del mensaje
         normal — un normal solo sale con el pedido confirmado, no hay que cruzar nada. */
      chk(txt.indexOf(refDe(coid)) < 0 && txt.indexOf('Pedido web') < 0, 'sin la referencia del pedido: confirmado no hace falta cruzar nada');
      chk(!sinEmoji4(txt).length, 'sin emoji de 4 bytes: en algunos celulares llegan como "�" (' + (sinEmoji4(txt).join(' ') || 'ninguno') + ')');
      chk(txt.indexOf('no llegó a confirmar') < 0 && txt.indexOf('Prueba Envio') < 0, 'confirmado: sin aviso y sin repetir los datos del cliente');
      const pend = await pendientes();
      chk(!pend[coid], 'confirmado, sale de la cola de pendientes');
    }

    // ── lento12 ──────────────────────────────────────────────────────────
    if (correr('lento12')) {
      console.log('\n' + DIM + '== el backend tarda 12 s ==' + RST);
      modo = 'lento12'; await prepararPedido();
      const est = await enviarYMirar(16000);
      const nav = navs[0];
      chk(est.some((e) => e.t > 8000 && e.t < 12000 && /lenta/.test(e.sub)), 'a los 8 s avisa: "' + ((est.find((e) => /lenta/.test(e.sub)) || {}).sub || '-') + '"');
      chk(!!nav && nav.t >= 12000, 'espera la confirmacion: a WhatsApp a los ' + (nav ? nav.t : '-') + ' ms');
      chk(!!nav && textoWA(nav.url).indexOf('no llegó a confirmar') < 0, 'con el mensaje normal');
      chk(fetches().length === 1, 'y sin reintentar mientras espera (' + fetches().length + ' POST)');
    }

    // ── cuelga ───────────────────────────────────────────────────────────
    if (correr('cuelga')) {
      console.log('\n' + DIM + '== el backend no contesta nunca ==' + RST);
      modo = 'cuelga'; await prepararPedido();
      let clic = 0;
      const est = await enviarYMirar(30000, async (o) => {
        if (/fallback/.test(o.cls) && o.btn && !clic) {
          /* FOTO=carpeta guarda como se ve el cartel antes de tocarlo. */
          if (process.env.FOTO) {
            await dormir(500);
            const s = await cli.enviar('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync(path.join(process.env.FOTO, 'envio-fallback-' + ANCHO + '.png'), Buffer.from(s.data, 'base64'));
          }
          clic = Date.now() - t0; await evSeguro("document.getElementById('send-wa-btn').click()"); return false;
        }
        return false;
      });
      const nav = navs[0];
      const fb = est.find((e) => /fallback/.test(e.cls));
      chk(!navs.some((n) => n.t < 24000), 'NO lo manda a WhatsApp como si estuviera registrado (antes: a los 3.800 ms)');
      chk(!!fb && fb.t >= 24500 && fb.t <= 27000, 'a los 25 s ofrece mandarlo igual: ' + (fb ? fb.t + ' ms · "' + fb.tit + '"' : 'no aparecio'));
      chk(!!fb && fb.btn && fb.btn.h >= 44, 'el boton de WhatsApp se puede tocar (' + (fb && fb.btn ? fb.btn.h + 'px de alto' : '-') + ')');
      chk(!!fb && fb.btn && fb.btn.top >= 0 && fb.btn.bottom <= fb.vh, 'y entra en la pantalla');
      chk(!!fb && fb.scrollW <= fb.vw, 'sin desbordar a lo ancho');
      chk(!!nav && clic && nav.t - clic < 1500, 'al tocarlo va a WhatsApp enseguida (' + (nav && clic ? (nav.t - clic) + ' ms' : '-') + ')');
      const txt = nav ? textoWA(nav.url) : '';
      const coid = (fetches()[0] || {}).coid || '';
      chk(txt.indexOf('⚠️') >= 0 && txt.indexOf('no llegó a confirmar') >= 0, 'y el mensaje DICE que la web no lo confirmo');
      chk(txt.indexOf('Prueba Envio') >= 0 && txt.indexOf('1122334455') >= 0 && txt.indexOf('Dirección: ') >= 0 && txt.indexOf('Lote 123') >= 0 && txt.indexOf('Pago: Efectivo') >= 0,
          'con los datos para cargarlo a mano: nombre, telefono, direccion y pago');
      chk(txt.indexOf('(ref. ' + refDe(coid) + ')') >= 0, 'y la referencia (' + refDe(coid) + '), la que cruza con Log Pedidos');
      chk(!sinEmoji4(txt).length, 'tambien sin emoji de 4 bytes (' + (sinEmoji4(txt).join(' ') || 'ninguno') + ')');
      chk(beacons().some((b) => b.coid === coid && b.t >= clic), 'antes de irse dispara un ultimo beacon con ese pedido');
      chk(maxEnVuelo <= 1, 'nunca dos POST del pedido esperando a la vez (' + maxEnVuelo + ')');
      const pend = await pendientes();
      chk(!!pend[coid], 'sin confirmar, queda en la cola para reintentar cuando vuelva la señal');
    }

    // ── error2 ───────────────────────────────────────────────────────────
    if (correr('error2')) {
      console.log('\n' + DIM + '== el backend contesta {ok:false} dos veces ==' + RST);
      modo = 'error2'; await prepararPedido();
      await enviarYMirar(15000);
      const nav = navs[0], f = fetches();
      chk(f.length === 3, 'reintenta hasta que confirma (' + f.length + ' POST)');
      chk(f.length >= 3 && f[1].t - f[0].t >= 2500 && f[2].t - f[1].t >= 4500, 'con espera entre intentos (' + f.map((x) => x.t).join(' / ') + ' ms)');
      chk(new Set(f.map((x) => x.coid)).size === 1, 'siempre el mismo clientOrderId: el backend no puede duplicarlo');
      chk(maxEnVuelo <= 1, 'y nunca dos a la vez (' + maxEnVuelo + ')');
      chk(!!nav && textoWA(nav.url).indexOf('no llegó a confirmar') < 0, 'confirmado al tercero: mensaje normal a los ' + (nav ? nav.t : '-') + ' ms');
    }

    // ── red2 ─────────────────────────────────────────────────────────────
    if (correr('red2')) {
      console.log('\n' + DIM + '== dos fallas de red y despues anda ==' + RST);
      modo = 'red2'; await prepararPedido();
      await enviarYMirar(15000);
      const nav = navs[0], f = fetches();
      chk(f.length === 3 && maxEnVuelo <= 1, 'reintenta de a uno (' + f.length + ' POST, maximo ' + maxEnVuelo + ' a la vez)');
      chk(!!nav && textoWA(nav.url).indexOf('no llegó a confirmar') < 0, 'y cuando anda, mensaje normal (' + (nav ? nav.t : '-') + ' ms)');
    }

    // ── tarde27 ──────────────────────────────────────────────────────────
    if (correr('tarde27')) {
      console.log('\n' + DIM + '== confirma a los 27 s, con el fallback ya en pantalla ==' + RST);
      modo = 'tarde27'; await prepararPedido();
      const est = await enviarYMirar(31000);
      const nav = navs[0];
      chk(est.some((e) => /fallback/.test(e.cls)), 'a los 25 s ofrecio mandarlo por WhatsApp');
      chk(!!nav && nav.t >= 27000, 'no se fue sin que nadie tocara nada antes de la confirmacion (' + (nav ? nav.t : '-') + ' ms)');
      chk(!!nav && textoWA(nav.url).indexOf('no llegó a confirmar') < 0, 'y al confirmar sigue solo, con el mensaje NORMAL');
    }

    chk(noBackend > 0, 'todos los POST al backend los contesto el simulador (' + noBackend + '): ninguno llego a la planilla');
  } finally {
    try { proc.kill(); } catch (e) {}
    try { srv.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\n' + (mal ? RED + mal + ' mal' : VER + 'ningun pedido parece registrado sin que el backend lo confirme') + RST + '\n');
  process.exit(mal ? 1 : 0);
}

main().catch((e) => { console.error('ROTO: ' + e.message); process.exit(1); });
