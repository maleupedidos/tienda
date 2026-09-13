/**
 * La franja del 10% se esconde al bajar, en el celular (13/9/2026).
 *
 *   node _tools/verificar-franja.js [ancho]      (390 por defecto)
 *
 * POR QUE EXISTE. La barra pegada arriba media 166px en el celular. La franja
 * (35px) se esconde mientras el cliente baja y vuelve cuando sube. Lo que se
 * puede romper sin ningun error:
 *   1. que al esconderla la PAGINA SALTE: achicar algo pegado arriba mueve todo
 *      lo de abajo, y en Safari no hay "scroll anchoring" que lo compense. Se
 *      mide que una card se mueva exactamente lo que se scrolleo;
 *   2. que con la barra quieta en su lugar la franja tape el titulo de la
 *      primera categoria (va superpuesta);
 *   3. que un temblor del dedo la haga parpadear;
 *   4. que ir a una categoria desde los botones deje el titulo abajo de la
 *      franja cuando esta a la vista;
 *   5. que en la compu cambie algo: ahi queda como estaba.
 *
 * El scroll es con la rueda del mouse por CDP, que dispara eventos de scroll de
 * verdad. Todo POST se corta y Analytics y Meta se bloquean. RAIZ=<carpeta>
 * corre contra otra copia (contra la tienda de antes tiene que fallar).
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = 844;
const PUERTO = 8600 + Math.floor(Math.random() * 90);
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
const DOMINGO = Date.UTC(2026, 8, 13, 8, 0, 0);
const dormir = (ms) => new Promise((s) => setTimeout(s, ms));

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
    listo: new Promise((r) => ws.addEventListener('open', r)),
    on: (f) => oyentes.push(f),
    enviar: (m, p) => new Promise((ok, mal) => {
      const i = ++id; pend.set(i, { ok, mal });
      ws.send(JSON.stringify({ id: i, method: m, params: p || {} }));
    }),
  };
}
async function esperarPagina(puerto) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + puerto + '/json/list');
      const p = (await r.json()).find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch (e) { /* todavia no */ }
    await dormir(250);
  }
  throw new Error('Chrome no abrio');
}

/* El reloj y el backend. Stock para todo: lo que se mide es la barra. */
const PREP = '(function () {' +
  'try { localStorage.clear(); } catch (e) {}' +
  'var RD = Date; window.__ahora = ' + DOMINGO + ';' +
  'function FD() { if (!(this instanceof FD)) return new RD(window.__ahora).toString(); if (arguments.length === 0) return new RD(window.__ahora);' +
  '  var a = [null].concat([].slice.call(arguments)); return new (Function.prototype.bind.apply(RD, a))(); }' +
  'FD.prototype = RD.prototype; FD.now = function () { return window.__ahora; }; FD.UTC = RD.UTC; FD.parse = RD.parse; window.Date = FD;' +
  'window.__post = 0; navigator.sendBeacon = function (u) { if (String(u).indexOf("script.google") >= 0) window.__post++; return false; };' +
  'var orig = window.fetch; var json = function (o) { return Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } })); };' +
  'window.fetch = function (url, opts) { var u = String(url);' +
  '  if (opts && String(opts.method || "").toUpperCase() === "POST" && u.indexOf("script.google") >= 0) { window.__post++; return new Promise(function () {}); }' +
  '  if (u.indexOf("action=piezas_full") >= 0) return json({});' +
  '  if (u.indexOf("script.google") >= 0) return json({ ok: true });' +
  '  return orig.apply(this, arguments); };' +
  '})();';

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-franja-'));
  const puertoCdp = 9400 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'], { stdio: 'ignore' });
  let mal = 0, bien = 0;
  const chk = (ok, t) => { ok ? bien++ : mal++; console.log('  ' + (ok ? VER + 'ok   ' : RED + 'MAL  ') + RST + t); };
  const CEL = ANCHO <= 768;

  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');
    await cli.enviar('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: ANCHO < 700 });
    const escapados = [];
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*script.google.com*' }, { urlPattern: '*wa.me*' },
      { urlPattern: '*googletagmanager*' }, { urlPattern: '*google-analytics*' }, { urlPattern: '*facebook*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const r = m.params.request;
      try {
        if (/googletagmanager|google-analytics|facebook/.test(r.url) || r.method === 'POST' || /wa\.me/.test(r.url)) {
          if (r.method === 'POST' || /wa\.me/.test(r.url)) escapados.push(r.method + ' ' + r.url.slice(0, 60));
          await cli.enviar('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' });
        } else await cli.enviar('Fetch.continueRequest', { requestId: m.params.requestId });
      } catch (e) { /* la pagina se fue */ }
    });
    const ev = async (e) => {
      const r = await cli.enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(String((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).slice(0, 200));
      return r.result.value;
    };
    const esperar = async (expr, ms) => { for (let i = 0; i < ms / 100; i++) { if (await ev(expr).catch(() => false)) return true; await dormir(100); } return false; };
    const rueda = async (dy) => { await cli.enviar('Input.dispatchMouseEvent', { type: 'mouseWheel', x: ANCHO / 2, y: 600, deltaX: 0, deltaY: dy }); await dormir(450); };
    const estado = async () => JSON.parse(await ev('(function () {' +
      'var sh = document.querySelector(".sticky-header"), p = document.getElementById("promo-bar");' +
      'var cs = getComputedStyle(p), rs = sh.getBoundingClientRect(), rp = p.getBoundingClientRect();' +
      'return JSON.stringify({ y: Math.round(pageYOffset), shTop: Math.round(rs.top), shAlto: Math.round(rs.height), shBottom: Math.round(rs.bottom),' +
      '  pos: cs.position, vis: cs.visibility, op: Number(cs.opacity), pe: cs.pointerEvents, pTop: Math.round(rp.top), pBottom: Math.round(rp.bottom), pAlto: Math.round(rp.height),' +
      '  oculta: sh.classList.contains("promo-oculta") }); })()'));
    /* Una card de referencia: si se mueve distinto que el scroll, la pagina salto. */
    const refTop = async () => ev('(function () { var c = document.querySelectorAll("#catalog-root .product-card")[6]; return c ? c.getBoundingClientRect().top : null; })()');

    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?t=' + Date.now() });
    if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000))) throw new Error('la tienda no arranco');
    await ev('(async function () { var d = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };' +
      'var z = [].slice.call(document.querySelectorAll("#loc-step-zone .loc-btn")).filter(function (b) { return (b.getAttribute("onclick") || "").indexOf("estancias") >= 0; })[0]; z.click(); await d(500);' +
      'var f = document.querySelector("#loc-dates-grid button[onclick*=\'2026-09-18\']"); if (f) f.click(); })()');
    await dormir(1200);
    /* Las fotos lazy cambian el alto de la pagina mientras se scrollea y eso
       ensucia la medicion del salto: se cargan todas antes. */
    await ev('document.querySelectorAll("img[loading=lazy]").forEach(function (i) { i.loading = "eager"; })');
    await dormir(2500);
    await ev('document.documentElement.style.scrollBehavior = "auto"');

    let e = await estado();
    chk(e.pAlto > 20, 'la franja del 10% existe en Estancias (' + e.pAlto + 'px; sin esto lo de abajo no mide nada)');

    if (CEL) {
      console.log(DIM + '== Celular ==' + RST);
      chk(e.pos === 'absolute', 'va superpuesta debajo de la barra (' + e.pos + ')');

      /* 2. Con la barra quieta en su lugar, no tapa el titulo de la primera categoria. */
      const quieta = JSON.parse(await ev('(function () { var sh = document.querySelector(".sticky-header"); window.scrollTo(0, sh.getBoundingClientRect().top + pageYOffset - 300);' +
        'var p = document.getElementById("promo-bar").getBoundingClientRect(); var t = document.querySelector("#catalog-root .cat-title").getBoundingClientRect();' +
        'return JSON.stringify({ promoBottom: Math.round(p.bottom), tituloTop: Math.round(t.top), shTop: Math.round(sh.getBoundingClientRect().top) }); })()'));
      chk(quieta.shTop > 0 && quieta.tituloTop >= quieta.promoBottom, 'con la barra en su lugar, el titulo de la primera categoria queda debajo de la franja (' + quieta.tituloTop + ' ≥ ' + quieta.promoBottom + ')');

      /* 1. Bajar: se esconde y la pagina no salta. */
      await ev('window.scrollTo(0, document.querySelector(".sticky-header").getBoundingClientRect().top + pageYOffset + 1500)');
      await dormir(300);
      await rueda(-40);                                    // arranca a la vista
      e = await estado();
      chk(e.shTop === 0 && !e.oculta && e.vis === 'visible', 'con la barra pegada y subiendo, la franja se ve');
      const alto0 = e.shAlto;
      const antes = await refTop(), y0 = e.y;
      await rueda(300);
      e = await estado();
      const despues = await refTop();
      chk(e.oculta && e.vis === 'hidden' && e.op === 0 && e.pe === 'none', 'al bajar se esconde (visibility ' + e.vis + ', opacity ' + e.op + ', no se puede tocar)');
      chk(e.shAlto === alto0, 'la barra ocupa lo mismo escondida o no (' + alto0 + ' → ' + e.shAlto + 'px)');
      chk(Math.abs((antes - despues) - (e.y - y0)) <= 1, 'la pagina no salta: la card se movio ' + Math.round(antes - despues) + 'px con un scroll de ' + (e.y - y0) + 'px');

      /* 3. Un temblor no la hace parpadear. */
      await rueda(-4);
      e = await estado();
      chk(e.oculta, 'un movimiento de 4px no la trae de vuelta');

      await rueda(-200);
      e = await estado();
      chk(!e.oculta && e.vis === 'visible' && e.op === 1 && e.pTop === e.shBottom, 'al subir vuelve, pegada abajo de la barra (' + e.pTop + ' = ' + e.shBottom + ')');

      /* 4. Ir a una categoria con la franja a la vista: el titulo no queda tapado. */
      await ev('scrollToCat(slugify("Wraps"))');
      await dormir(1500);
      const w = JSON.parse(await ev('(function () { var t = document.querySelector("#cat-wraps .cat-title").getBoundingClientRect(); var sh = document.querySelector(".sticky-header"); var p = document.getElementById("promo-bar");' +
        'var tapa = sh.getBoundingClientRect().bottom; if (getComputedStyle(p).visibility !== "hidden") tapa = Math.max(tapa, p.getBoundingClientRect().bottom);' +
        'return JSON.stringify({ titulo: Math.round(t.top), tapa: Math.round(tapa) }); })()'));
      chk(w.titulo >= w.tapa - 2 && w.titulo < ALTO / 2, 'ir a Wraps deja el titulo a la vista, debajo de lo que tapa (' + w.titulo + ' ≥ ' + w.tapa + ')');
      /* De Wraps a la primera categoria es SUBIR: la franja reaparece en el
         camino, y es el caso en que podria tapar el titulo. */
      await ev('scrollToCat(document.querySelector("#catalog-root .cat-section").id.replace("cat-", ""))');
      await dormir(1800);
      const pk = JSON.parse(await ev('(function () { var s = document.querySelector("#catalog-root .cat-section"); var t = s.querySelector(".cat-title").getBoundingClientRect(); var sh = document.querySelector(".sticky-header"); var p = document.getElementById("promo-bar");' +
        'var vis = getComputedStyle(p).visibility !== "hidden"; var tapa = sh.getBoundingClientRect().bottom; if (vis) tapa = Math.max(tapa, p.getBoundingClientRect().bottom);' +
        'return JSON.stringify({ titulo: Math.round(t.top), tapa: Math.round(tapa), vis: vis }); })()'));
      chk(pk.vis && pk.titulo >= pk.tapa - 2, 'subir hasta la primera categoria: la franja reaparece y no tapa el titulo (' + pk.titulo + ' ≥ ' + pk.tapa + ')');

      await ev('window.scrollTo(0, 0)');
      await dormir(500);
      e = await estado();
      chk(!e.oculta && e.vis === 'visible', 'arriba de todo, la franja se ve');

      const desborde = await ev('document.documentElement.scrollWidth - document.documentElement.clientWidth');
      chk(desborde <= 0, 'nada se sale a lo ancho (' + desborde + 'px)');
    } else {
      console.log(DIM + '== Compu: queda como estaba ==' + RST);
      chk(e.pos === 'static', 'la franja sigue adentro de la barra (' + e.pos + ')');
      await ev('window.scrollTo(0, document.querySelector(".sticky-header").getBoundingClientRect().top + pageYOffset + 1500)');
      await dormir(300);
      const a0 = (await estado()).shAlto;
      await rueda(300);
      e = await estado();
      chk(e.vis === 'visible' && e.op === 1 && e.shAlto === a0, 'al bajar no se esconde ni cambia de alto (' + a0 + ' → ' + e.shAlto + 'px)');
    }
    const posts = await ev('window.__post');
    chk(posts === 0 && escapados.length === 0, 'no salio ningun POST ni salto a WhatsApp (' + posts + '/' + escapados.length + ')');
  } catch (err) {
    mal++;
    console.log('  ' + RED + 'ROTO ' + RST + err.message);
  } finally {
    try { proc.kill(); } catch (e) {}
    srv.close();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  console.log('\n' + (mal ? RED : VER) + bien + ' ok · ' + mal + ' mal' + RST + '  (' + ANCHO + 'px)');
  process.exit(mal ? 1 : 0);
}

main();
