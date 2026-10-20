/**
 * El seguimiento del pedido (19/10/2026): que despues de comprar el cliente
 * quede en una pantalla que no se pierde.
 *
 *   node _tools/verificar-seguimiento.js          ← 390px
 *   node _tools/verificar-seguimiento.js 1440     ← escritorio
 *
 * POR QUE EXISTE. El 19/10/2026 se acabo el cupo de WATI y la confirmacion por
 * WhatsApp dejo de llegar. La pantalla de "Pedido confirmado" paso a ser el
 * seguimiento: linea de tiempo, mail para avisos y una URL propia
 * (/?seguimiento=<clientOrderId>). Lo que mide:
 *   · al confirmar, la URL cambia y la linea de tiempo aparece con las etapas del ERP;
 *   · REFRESCAR deja al cliente en el mismo pedido, con el comprobante;
 *   · ATRAS no vuelve al formulario: cierra y deja la franja "Tu pedido #N";
 *   · la franja vuelve a abrir el seguimiento;
 *   · el mail: rechaza uno mal escrito, manda el bueno con el codigo, y dice a donde avisa;
 *   · entregado: se apaga el mail y la franja desaparece;
 *   · nada se desborda a lo ancho.
 *
 * El backend es SIMULADO (mismo esquema que verificar-envio.js): ningun POST
 * llega a la planilla, y Analytics y el pixel quedan cortados.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
/* El umbral del fallback, leido del app.js que se va a servir. Lo usan el
   simulador de backend (para contestar despues del cartel) y los chequeos. */
const FALLBACK_MS = (function () {
  try {
    const m = /var SEND_FALLBACK_MS = (\d+)/.exec(fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8'));
    return m ? Number(m[1]) : 45000;
  } catch (e) { return 45000; }
})();
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
  /* CONFIRMA CON EL CARTEL YA EN PANTALLA. Estaba fijado en 27 s porque el
     fallback salia a los 25; movido a 45, ese numero dejo de significar nada.

     Y con el umbral nuevo aparece algo que antes no pasaba: 45 s es MAS que
     el tope de 30 s por intento, asi que cuando sale el cartel la tienda ya
     abandono el primer POST y esta en el segundo. El escenario tiene que
     reflejarlo o no prueba lo que dice — por eso el primero cuelga y el
     segundo contesta 18 s despues de arrancar (t = 32 + 18 = 50 s), que cae
     despues del cartel. */
  tarde27: (n) => (n <= 1 ? { que: 'cuelga' } : { en: 18000, que: 'ok' }),
  cierre:  () => ({ en: 2000, que: 'ok' }),
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
    let gets = [], mails = [], etapaSeg = 'recibido', mailSeg = '';
    const PASOS = ['recibido', 'confirmado', 'armado', 'hoy', 'entregado'];
    const SEG = () => ({ ok: true, encontrado: true, n: '999', canal: 'Home', nombre: 'Prueba', fecha: '2026-12-31', horario: '19 a 21 h', total: 1,
      cancelado: etapaSeg === 'cancelado', etapa: etapaSeg, mail: mailSeg,
      etapas: PASOS.map((k, i) => ({ k: k, ok: etapaSeg !== 'cancelado' && i <= PASOS.indexOf(etapaSeg), cuando: i <= PASOS.indexOf(etapaSeg) ? '19/10 22:0' + i : '' })) });
    let modo = 'cierre', posts = [], navs = [], enVuelo = 0, maxEnVuelo = 0, nFetch = 0, t0 = 0, noBackend = 0;
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
      if (request.method !== 'POST') {
        if (/[?&]action=seguimiento&/.test(url)) { gets.push(url); fulfill(requestId, JSON.stringify(SEG())); return; }
        fulfill(requestId, '{"ok":true}'); return;
      }
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
      if (data.action === 'seguimientoMail') { mails.push(data); fulfill(requestId, JSON.stringify({ ok: true, mail: data.mail ? data.mail.slice(0, 2) + '***' + data.mail.slice(data.mail.indexOf('@')) : '' })); return; }
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
      /* El modal de zona es un buscador desde el 28/9/2026, y la tienda abre en
         el catalogo desde el 23/9: hay que abrirlo y escribir el barrio. */
      await ev(`(function(){ if (typeof showZoneModal === 'function') showZoneModal('test');
        var i = document.getElementById('dir-input');
        if (i) { i.value = 'Estancias del Pilar'; if (typeof dirBuscar === 'function') dirBuscar(); } })()`);
      await dormir(300);
      await ev(`(function(){ var b = document.querySelector('#dir-lista .dir-op'); if (b) b.click(); })()`);
      await dormir(600);
      await ev(`(function(){var b=[].slice.call(document.querySelectorAll('button,[onclick]'))
        .filter(function(e){return /cualquier d|sin preferencia/i.test(e.innerText||'');}); if(b.length)b[0].click();})()`);
      await dormir(1000);
      await ev(`(function(){ var b = [].slice.call(document.querySelectorAll('.add-btn')).filter(function(x){ return !x.disabled && x.offsetParent; });
        if (b[0]) b[0].click(); if (b[1]) b[1].click();
        if (typeof cartCount === 'function' && !cartCount() && typeof getActiveProducts === 'function') {
          try { _sinPrecios = function () { return false; }; } catch (e) {} var ps = getActiveProducts(); for (var i = 0; i < ps.length && cartCount() < 2; i++) { try { addToCart(ps[i].id); } catch (e) {} } } })()`);
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

    const estado = async () => JSON.parse(await ev(`(function(){
      var ov = document.getElementById('send-overlay'), seg = document.getElementById('seg');
      var pasos = [].slice.call(document.querySelectorAll('#seg-pasos .seg-paso'));
      var ban = document.getElementById('seg-banner');
      var g = null; try { g = JSON.parse(localStorage.getItem('maleu_seguimiento_v1') || 'null'); } catch (e) {}
      return JSON.stringify({
        url: location.pathname + location.search,
        pantalla: !!(ov && ov.classList.contains('pantalla') && ov.classList.contains('active')),
        seg: !!(seg && !seg.hidden),
        tit: (document.getElementById('send-title') || {}).textContent || '',
        llega: (document.getElementById('seg-llega') || {}).textContent || '',
        pasos: pasos.length, ok: pasos.filter(function (p) { return p.classList.contains('ok'); }).length,
        actual: (document.querySelector('#seg-pasos .seg-paso.actual .seg-paso-nom') || {}).textContent || '',
        items: document.querySelectorAll('#send-done-items li').length,
        form: !!(document.getElementById('seg-mail') && !document.getElementById('seg-mail').hidden),
        mailOk: (function () { var m = document.getElementById('seg-mail-ok'); return m && !m.hidden ? m.textContent : ''; })(),
        msg: (document.getElementById('seg-mail-msg') || {}).textContent || '',
        franja: !!(ban && !ban.hidden), franjaTxt: ban ? ban.textContent.replace(/\\s+/g, ' ').trim() : '',
        guardado: g ? g.t : '',
        anchoOk: document.documentElement.scrollWidth <= window.innerWidth + 1
          && (!ov || ov.scrollWidth <= ov.clientWidth + 1)
      }); })()`));
    const esperar = async (cond, ms) => { const t = Date.now(); let s; while (Date.now() - t < (ms || 8000)) { s = await estado(); if (cond(s)) return s; await dormir(200); } return s; };

    console.log('\n' + DIM + '== el seguimiento del pedido (' + ANCHO + 'px) ==' + RST);
    await prepararPedido();
    etapaSeg = 'recibido';
    t0 = Date.now();
    await ev('enviarPedido();');
    let s = await esperar((x) => x.seg && x.pasos === 5, 12000);
    const coid = (posts.find((p) => p.coid) || {}).coid || '';
    chk(/^co_\d+_[a-z0-9]{16}$/.test(coid), 'el codigo del pedido tiene 16 caracteres al azar: ' + coid);
    chk(s.pantalla && s.seg, 'al confirmar aparece la linea de tiempo en la pantalla del pedido');
    chk(s.url === '/?seguimiento=' + coid, 'la URL pasa a ser la del seguimiento: ' + s.url);
    chk(s.guardado === coid, 'el pedido queda guardado en este navegador');
    chk(/Pedido #999 confirmado/.test(s.tit), 'el titulo sigue diciendo el numero: "' + s.tit + '"');
    chk(s.pasos === 5 && s.ok === 1 && /Recibimos/.test(s.actual), 'cinco pasos, el primero prendido (' + s.ok + '/' + s.pasos + ', actual «' + s.actual + '»)');
    chk(/Te llega el jueves 31\/12, 19 a 21 h/.test(s.llega), 'arriba dice cuando llega: "' + s.llega + '"');
    chk(gets.some((u) => u.indexOf('t=' + encodeURIComponent(coid)) > 0), 'le pregunto al ERP por ESE codigo (' + gets.length + ' consultas)');
    chk(s.anchoOk, 'nada se desborda a lo ancho');
    try {
      const shot = await cli.enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const f = path.join(os.tmpdir(), 'seguimiento-' + ANCHO + '.png'); fs.writeFileSync(f, Buffer.from(shot.data, 'base64'));
      console.log('  ' + DIM + 'captura: ' + f + RST);
    } catch (e) {}

    console.log('\n' + DIM + '-- refrescar --' + RST);
    etapaSeg = 'armado';
    await cli.enviar('Page.reload', { ignoreCache: true });
    s = await esperar((x) => x.seg && x.ok === 3, 12000);
    chk(s.pantalla && s.url === '/?seguimiento=' + coid, 'refrescando sigue en el mismo pedido: ' + s.url);
    chk(s.ok === 3 && s.actual === 'Armado', 'y con la etapa nueva del ERP (' + s.ok + ' prendidos, «' + s.actual + '»)');
    chk(s.items > 0, 'con el comprobante: ' + s.items + ' productos');
    chk(/confirmado/.test(s.tit), 'y el numero: "' + s.tit + '"');

    console.log('\n' + DIM + '-- atras y la franja --' + RST);
    /* El historial de la recarga no tiene entrada anterior de la tienda: se arma
       como la tiene un cliente (tienda → pedido) navegando a la tienda y abriendo
       desde la franja. */
    await cli.enviar('Page.navigate', { url: base + '/' });
    s = await esperar((x) => x.franja, 8000);
    chk(s.franja && /Tu pedido #999 llega el jueves 31\/12/.test(s.franjaTxt), 'en la tienda queda la franja: "' + s.franjaTxt + '"');
    chk(!s.pantalla, 'y la tienda se ve normal, sin la pantalla encima');
    await ev("document.getElementById('seg-banner').click()");
    s = await esperar((x) => x.pantalla && x.seg, 8000);
    chk(s.pantalla && s.url === '/?seguimiento=' + coid, 'la franja abre el seguimiento: ' + s.url);
    await ev('history.back()');
    s = await esperar((x) => !x.pantalla, 6000);
    chk(!s.pantalla && s.url === '/', 'ATRAS cierra el seguimiento y vuelve a la tienda: ' + s.url);
    chk(s.franja, 'con la franja para volver');
    const form = await ev("JSON.stringify({ visible: !!(document.getElementById('form-section') && !document.getElementById('form-section').hidden) })");
    chk(!JSON.parse(form).visible, 'y NO al formulario de un pedido que ya no existe');
    await ev("document.getElementById('seg-banner').click()");
    await esperar((x) => x.pantalla && x.seg, 8000);

    console.log('\n' + DIM + '-- el mail --' + RST);
    await ev("document.getElementById('seg-mail-in').value = 'no-es-un-mail'; document.getElementById('seg-mail-btn').click();");
    s = await esperar((x) => x.msg, 3000);
    chk(/Revisá el mail/.test(s.msg) && mails.length === 0, 'un mail mal escrito no se manda: "' + s.msg + '"');
    await ev("document.getElementById('seg-mail-in').value = 'cliente.prueba@gmail.com'; document.getElementById('seg-mail-btn').click();");
    s = await esperar((x) => x.mailOk, 6000);
    chk(mails.length === 1 && mails[0].t === coid && mails[0].mail === 'cliente.prueba@gmail.com', 'el bueno va al ERP con el codigo (' + mails.length + ' envios)');
    chk(/cl\*\*\*@gmail\.com/.test(s.mailOk) && !s.form, 'y dice a donde avisa: "' + s.mailOk + '"');

    console.log('\n' + DIM + '-- entregado --' + RST);
    etapaSeg = 'entregado'; mailSeg = 'cl***@gmail.com';
    await ev("segPreguntar(_segT, false)");
    s = await esperar((x) => x.ok === 5, 6000);
    chk(s.ok === 5 && /Entregado/.test(s.llega), 'las cinco etapas y "' + s.llega + '"');
    chk(!s.form && !s.mailOk, 'entregado: ya no ofrece el mail');
    await ev("document.getElementById('send-done-btn').click()");
    s = await esperar((x) => !x.pantalla, 4000);
    chk(!s.pantalla && !s.franja, '"Volver a la tienda" cierra y, entregado, la franja ya no sale');

    console.log('\n' + DIM + '-- baja desde el mail --' + RST);
    const antes = mails.length;
    etapaSeg = 'armado'; mailSeg = 'cl***@gmail.com';
    await cli.enviar('Page.navigate', { url: base + '/?seguimiento=' + coid + '&baja=1' });
    await esperar((x) => x.pantalla && x.seg, 10000);
    await dormir(1200);
    chk(mails.length === antes + 1 && mails[mails.length - 1].mail === '', 'el link de baja le pide al ERP borrar el mail');
    s = await estado();
    chk(s.url === '/?seguimiento=' + coid, 'y la URL queda sin el &baja (si refresca no se vuelve a dar de baja)');

    chk(noBackend > 0, 'todos los POST los contesto el simulador (' + noBackend + '): ninguno llego a la planilla');
  } finally {
    try { proc.kill(); } catch (e) {}
    try { srv.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  console.log('\n' + (mal ? RED + mal + ' mal' : VER + 'el seguimiento no se pierde') + RST + '\n');
  process.exit(mal ? 1 : 0);
}

main().catch((e) => { console.error('ROTO: ' + e.message); process.exit(1); });
