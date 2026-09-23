/**
 * Lo que se encontro recorriendo la tienda como un cliente el domingo 13/9/2026.
 *
 *   node _tools/verificar-sin-stock.js [ancho]      (390 por defecto)
 *
 * POR QUE EXISTE. Las 21 redes del repo daban verde y la tienda publicada tenia
 * seis cosas mal que ninguna miraba, porque ninguna rompe nada: todo parsea, los
 * botones existen, el pedido llega. Las encontro un recorrido real:
 *
 *   1. El ERP mando stock -1 para Empanadas Jamon y Queso. La card decia
 *      "Ultimas -1 unidades" con "+ Agregar" prendido, y al tocarlo decia
 *      "✓ agregado" SIN agregar nada — y le mandaba un AddToCart a Meta y a GA.
 *   2. "Ultimas 1 unidades".
 *   3. Un domingo a la manana, eligiendo "hoy", los cuatro "Lo mas pedido"
 *      estaban en gris sin salida, aunque para el viernes se podia pedir todo.
 *      Ahora el boton ofrece esa fecha ("Pedir para el vie 18").
 *   4. En Clubes (y en el paso de fecha de Pilar), sabado y domingo el cartel
 *      decia "los pedidos de este viernes ya cerraron" con el viernes abierto.
 *   5. La chapita "Tadeo" en "Otra zona de Pilar" y "El vendedor es Tadeo
 *      Ustariz": la tienda no nombra a Tadeo.
 *   6. "Copiar" el alias no hacia nada si el navegador no deja usar el
 *      portapapeles (el de Instagram/Facebook, donde cae la pauta).
 *   Y de paso: el subtitulo del formulario centrado por una regla de otra
 *   seccion, los +/- del carrito de 26px, y el catalogo a 900px en la compu.
 *
 * Y lo que se sumo esa tarde, cuando Tadeo pregunto: "elegi para hoy, puse
 * cosas que SI hay y toco 'Pedir para el vie 18' en un pack que hoy no hay:
 * ¿como sigue? ¿separa dos ventas?". No las separa — un pedido tiene una sola
 * fecha — y el boton pasaba TODO el carrito al viernes con un aviso de 4 s.
 * Ahora pregunta antes. Primero fue solo con algo en el carrito; un rato despues
 * Tadeo: "si quiero para hoy pero ARRANCO por un producto que no hay, se me
 * cambia la fecha solo" — y pregunta siempre, con un texto propio cuando el
 * carrito esta vacio. Y el chip de la barra de los barrios con vendedor, que
 * decia "Tiempo agotado esta semana" un domingo.
 *
 * El RELOJ va congelado (domingo 13/9/2026 05:00): sin eso el resultado
 * dependeria del dia en que se corre, y el caso del domingo no se podria
 * probar nunca un martes.
 *
 * Todo POST se corta DOS veces: adentro de la pagina y por CDP. Con RAIZ=<carpeta>
 * corre contra otra copia de la tienda (contra la de antes tiene que fallar).
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
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

/* Domingo 13/9/2026 05:00 en Argentina = 08:00 UTC. */
const DOMINGO = Date.UTC(2026, 8, 13, 8, 0, 0);
const HORA = (d, h) => Date.UTC(2026, 8, d, h + 3, 0, 0);

/* El stock que manda el ERP. Todo con 50, salvo los casos que se prueban. */
const ABBRS = ['PMu', 'PMa', 'PJyQ', 'PCC', 'PJyM', 'PPM', 'PPJyQ', 'PPCyQ', 'SQB', 'SL', 'SCo',
  'SPyP', 'SJyQ', 'SE', 'SCa', 'ECaC', 'EJyQ', 'ECyQ', 'EV', 'TG', 'TLC', 'TC', 'F', 'TP', 'TJyQ',
  'TCa', 'TV', 'RC', 'RP', 'CCo', 'CEn', 'CLo', 'CPi', 'CVa'];
const STOCK = {};
ABBRS.forEach((a) => { STOCK[a] = { f: 50, p: 50 }; });
STOCK.EJyQ = { f: -1, p: -1 };                    // el caso real del 13/9
STOCK.PMa = { f: 0, p: 0 };                       // "Lo mas pedido", agotado
STOCK.TP = { f: 1, p: 1 };                        // una sola unidad
/* Los tres packs de pizza en 0: el combo "Noche en Casa" (un pack a elegir)
   queda sin stock para hoy. */
STOCK.PPM = { f: 0, p: 0 }; STOCK.PPJyQ = { f: 0, p: 0 }; STOCK.PPCyQ = { f: 0, p: 0 };
STOCK.CLo = { f: 3.8900000000000006, p: 3.8900000000000006 };

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
    await new Promise((s) => setTimeout(s, 250));
  }
  throw new Error('Chrome no abrio');
}
const dormir = (ms) => new Promise((s) => setTimeout(s, ms));

/* Antes de que arranque la tienda: el reloj, el backend y los espias. */
const PREP = '(function () {' +
  'try { localStorage.clear(); } catch (e) {}' +
  'var RD = Date; window.__ahora = ' + DOMINGO + ';' +
  'function FD() {' +
  '  if (!(this instanceof FD)) return new RD(window.__ahora).toString();' +
  '  if (arguments.length === 0) return new RD(window.__ahora);' +
  '  var a = [null].concat([].slice.call(arguments));' +
  '  return new (Function.prototype.bind.apply(RD, a))();' +
  '}' +
  'FD.prototype = RD.prototype; FD.now = function () { return window.__ahora; };' +
  'FD.UTC = RD.UTC; FD.parse = RD.parse; window.Date = FD;' +
  'window.__post = 0; navigator.sendBeacon = function (u, d) { if (String(u).indexOf("script.google") < 0) return false; window.__post++; (window.__posts = window.__posts || []).push("beacon " + String(u).slice(0, 80)); return false; };' +
  'var orig = window.fetch;' +
  'var json = function (o) { return Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } })); };' +
  'window.fetch = function (url, opts) {' +
  '  var u = String(url);' +
  '  if (opts && String(opts.method || "").toUpperCase() === "POST" && u.indexOf("script.google") >= 0) { window.__post++; (window.__posts = window.__posts || []).push(u.slice(0, 80) + " " + String(opts.body || "").slice(0, 160)); return new Promise(function () {}); }' +
  '  if (u.indexOf("action=stock_full") >= 0) return json(' + JSON.stringify(STOCK) + ');' +
  '  if (u.indexOf("action=piezas_full") >= 0) return json({});' +
  '  if (u.indexOf("script.google") >= 0) return json({ ok: true });' +
  '  return orig.apply(this, arguments);' +
  '};' +
  '})();';

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-sinstock-'));
  const puertoCdp = 9400 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'], { stdio: 'ignore' });

  let mal = 0, bien = 0;
  const chk = (ok, t) => { ok ? bien++ : mal++; console.log('  ' + (ok ? VER + 'ok   ' : RED + 'MAL  ') + RST + t); };

  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');
    await cli.enviar('Emulation.setDeviceMetricsOverride',
      { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: ANCHO < 700 });
    const escapados = [];
    /* Analytics y Meta se bloquean: una corrida de prueba no puede sumar
       visitas ni AddToCart falsos a las metricas reales. Sin sus scripts,
       `gtag` y `fbq` quedan como colas y los eventos igual se pueden contar. */
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*script.google.com*' },
      { urlPattern: '*wa.me*' }, { urlPattern: '*whatsapp*' }, { urlPattern: '*googletagmanager*' },
      { urlPattern: '*google-analytics*' }, { urlPattern: '*facebook*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const r = m.params.request;
      try {
        if (/googletagmanager|google-analytics|facebook/.test(r.url)) {
          await cli.enviar('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' });
          return;
        }
        if (r.method !== 'POST' && !/wa\.me|whatsapp/.test(r.url)) {
          await cli.enviar('Fetch.continueRequest', { requestId: m.params.requestId });
          return;
        }
        escapados.push(r.method + ' ' + r.url.slice(0, 60));
        await cli.enviar('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' });
      } catch (e) { /* la pagina ya se fue */ }
    });
    const ev = async (e) => {
      const r = await cli.enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error(String((d.exception && (d.exception.description || d.exception.value)) || d.text).slice(0, 200));
      }
      return r.result.value;
    };
    const esperar = async (expr, ms) => {
      for (let i = 0; i < ms / 100; i++) { if (await ev(expr).catch(() => false)) return true; await dormir(100); }
      return false;
    };
    const tocar = async (sel) => {
      const pos = JSON.parse(await ev('(function () {' +
        'var e = document.querySelector(' + JSON.stringify(sel) + '); if (!e) return "null";' +
        'var r0 = document.documentElement.style.scrollBehavior; document.documentElement.style.scrollBehavior = "auto";' +
        'e.scrollIntoView({ block: "center" }); document.documentElement.style.scrollBehavior = r0;' +
        'var r = e.getBoundingClientRect(); var x = r.left + r.width / 2, y = r.top + r.height / 2;' +
        'var en = document.elementFromPoint(x, y);' +
        'return JSON.stringify({ x: x, y: y, libre: !!en && (en === e || e.contains(en)), alto: Math.round(r.height), texto: e.innerText });' +
        '})()'));
      if (!pos) return null;
      await dormir(200);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cli.enviar('Input.dispatchMouseEvent', { type, x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      }
      return pos;
    };

    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?d=' + Date.now() });
    if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000))) {
      throw new Error('la tienda no arranco');
    }

    /* ── 1. EL CARTEL DEL VIERNES, dia por dia ───────────────────────── */
    console.log(DIM + '== El cartel del recorrido del viernes (Clubes y Pilar) ==' + RST);
    const nota = async (ms) => {
      const h = await ev('(function () { window.__ahora = ' + ms + '; var n = _cutoffNote("clubes"); return n ? n.html : ""; })()');
      return h.replace(/<[^>]+>/g, '');
    };
    const dom = await nota(DOMINGO);
    chk(!/cerraron/.test(dom) && /jueves 17\/9 a las 12 hs/.test(dom) && /viernes 18\/9/.test(dom),
        'domingo 13/9: el viernes 18 esta abierto hasta el jueves 17 — "' + dom.slice(0, 90) + '…"');
    const sab = await nota(HORA(19, 10));
    chk(!/cerraron/.test(sab) && /jueves 24\/9/.test(sab) && /viernes 25\/9/.test(sab),
        'sabado 19/9: el que viene es el viernes 25 y cierra el jueves 24');
    const lun = await nota(HORA(14, 9));
    chk(/jueves 17\/9/.test(lun) && /viernes 18\/9/.test(lun) && !/cerraron/.test(lun), 'lunes 14/9: jueves 17 y viernes 18');
    const jueAm = await nota(HORA(17, 11));
    chk(/hoy a las 12 hs/.test(jueAm) && /viernes 18\/9/.test(jueAm), 'jueves 17/9 11:00: ultima chance, hoy a las 12');
    const juePm = await nota(HORA(17, 13));
    chk(/cerraron/.test(juePm) && /viernes 25\/9/.test(juePm), 'jueves 17/9 13:00: el de manana cerro, sale el viernes 25');
    const vie = await nota(HORA(18, 10));
    chk(/Hoy estamos entregando/.test(vie) && /viernes 25\/9/.test(vie), 'viernes 18/9: hoy se entrega, el proximo es el 25');

    /* El chip de la barra de promo en los barrios con vendedor tenia el mismo
       error: "Tiempo agotado esta semana" un domingo con el viernes abierto. */
    /* Contra la tienda de antes la funcion no existe: se lee el chip viejo
       forzando un barrio con vendedor, asi el test marca rojo en vez de romperse. */
    const chip = async (ms) => ev('(function () { window.__ahora = ' + ms + ';' +
      ' if (typeof _cutoffChipTexto === "function") return _cutoffChipTexto();' +
      ' var z = currentZone, r0 = window._pilarBarrioIsRed; currentZone = "pilar"; window._pilarBarrioIsRed = function () { return true; };' +
      ' try { return _pilarRedCutoffChip(); } finally { currentZone = z; window._pilarBarrioIsRed = r0; } })()');
    const cDom = await chip(DOMINGO);
    chk(!/agotado|cerraron/.test(cDom) && /jueves 17\/9/.test(cDom) && /viernes 18\/9/.test(cDom), 'chip de vendedor, domingo: "' + cDom + '"');
    const cJueAm = await chip(HORA(17, 11));
    chk(/hoy a las 12/.test(cJueAm) && /18\/9/.test(cJueAm), 'chip, jueves 11:00: "' + cJueAm + '"');
    const cJuePm = await chip(HORA(17, 13));
    chk(/cerraron/.test(cJuePm) && /25\/9/.test(cJuePm), 'chip, jueves 13:00: "' + cJuePm + '"');
    const cVie = await chip(HORA(18, 10));
    chk(/Hoy estamos entregando/.test(cVie) && /25\/9/.test(cVie) && /jueves 24\/9/.test(cVie), 'chip, viernes: "' + cVie + '"');
    await ev('window.__ahora = ' + DOMINGO);

    /* ── 2. LA VOZ DE LA MARCA ───────────────────────────────────────── */
    console.log('\n' + DIM + '== La tienda no nombra a Tadeo ==' + RST);
    const pilar = JSON.parse(await ev('(async function () {' +
      'var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };' +
      'var z = [].slice.call(document.querySelectorAll("#loc-step-zone .loc-btn")).filter(function (b) { return (b.getAttribute("onclick") || "").indexOf("pilar") >= 0; })[0];' +
      'z.click(); await dormir(500);' +
      'var paso = document.getElementById("loc-overlay").innerText;' +
      'return JSON.stringify({ paso: paso, otra: /Otra zona de Pilar/.test(paso) });' +
      '})()'));
    chk(pilar.otra, 'el paso de Pilar se dibujo (sin esto lo de abajo no mide nada)');
    chk(!/Tadeo|Ustariz/.test(pilar.paso), 'el paso "¿En que zona de Pilar?" no dice Tadeo');
    const etiqueta = await ev('(function () {' +
      'var sel = document.getElementById("f-pilar-barrio"); var o = document.createElement("option"); o.value = "__otro__"; sel.appendChild(o); sel.value = "__otro__";' +
      'document.getElementById("f-direccion").value = "Calle Falsa 123";' +
      'updatePilarVendedorLabel(); return document.getElementById("pilar-vendedor-label").textContent;' +
      '})()');
    chk(etiqueta && !/Tadeo|Ustariz/.test(etiqueta), 'el rotulo del vendedor en "Otra zona" no dice Tadeo ("' + etiqueta + '")');

    /* ── 3. VOLVER A ESTANCIAS, "HOY" ────────────────────────────────── */
    await ev('try { localStorage.clear(); } catch (e) {}');
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?e=' + Date.now() });
    await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000);
    const abierto = await ev('(async function () {' +
      'var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };' +
      'var z = [].slice.call(document.querySelectorAll("#loc-step-zone .loc-btn")).filter(function (b) { return (b.getAttribute("onclick") || "").indexOf("estancias") >= 0; })[0];' +
      'z.click(); await dormir(500);' +
      /* Desde el 23/9/2026 elegir la zona ya no lleva al paso de fecha: la
         tienda abre en el catalogo y el dia se elige despues. Este escenario es
         el del cliente que SI elige "hoy", asi que lo elige donde quedo: el
         chip 📅. */
      'showDateModal(); await dormir(300);' +
      'var f = document.querySelector("#loc-dates-grid button[onclick*=\'2026-09-13\']"); if (f) f.click();' +
      'await dormir(500); var ov = document.getElementById("loc-overlay"); return !!(ov && getComputedStyle(ov).display !== "none");' +
      '})()');
    if (abierto) throw new Error('no se pudo elegir Estancias para hoy domingo 13/9');
    const idDe = async (abbr) => ev('(function () { for (var k in PROD_ABBR) if (PROD_ABBR[k] === "' + abbr + '") return String(k); return null; })()');
    const idEJyQ = await idDe('EJyQ'), idPMa = await idDe('PMa'), idTP = await idDe('TP'), idPMu = await idDe('PMu');
    if (!(await esperar('stockMap[' + JSON.stringify(idEJyQ) + '] !== undefined', 8000))) throw new Error('no llego el stock');
    await dormir(400);

    console.log('\n' + DIM + '== Stock que manda el ERP (domingo, "hoy": tope al freezer) ==' + RST);
    const est = JSON.parse(await ev('(function () {' +
      'var card = function (id) { return document.querySelector("#catalogo .product-card[data-id=\'" + id + "\']") || document.querySelector(".product-card[data-id=\'" + id + "\']"); };' +
      'var info = function (id) { var c = card(id); var b = c && c.querySelector(".product-footer button"); var s = c && c.querySelector("[data-stock]"); return { badge: s ? s.textContent : "", boton: b ? b.textContent : "", deshab: !!(b && b.disabled), clase: b ? b.className : "" }; };' +
      'return JSON.stringify({ modo: getStockMode(), ej: info(' + JSON.stringify(idEJyQ) + '), pma: info(' + JSON.stringify(idPMa) + '), tp: info(' + JSON.stringify(idTP) + '),' +
      '  stockEj: stockMap[' + JSON.stringify(idEJyQ) + '], copias: document.querySelectorAll(".product-card[data-id=\'' + idPMa + '\'] .add-btn-otra-fecha").length });' +
      '})()'));
    chk(est.modo === 'real', 'el modo es "real" (' + est.modo + ')');
    chk(est.stockEj === 0, 'un stock negativo del ERP se lee como 0 (' + est.stockEj + ')');
    chk(!/-\d/.test(est.ej.badge) && /Sin stock/.test(est.ej.badge), 'la card no dice "-1 unidades": "' + est.ej.badge + '"');
    chk(/Última unidad/.test(est.tp.badge) && !/Últimas 1/.test(est.tp.badge), 'con 1 dice "Última unidad": "' + est.tp.badge + '"');
    chk(/Pedir para el vie 18/.test(est.pma.boton) && !est.pma.deshab,
        'sin stock para hoy, el boton ofrece el viernes: "' + est.pma.boton + '"');
    chk(est.copias === 2, 'y lo dice en las DOS copias de la card ("Lo mas pedido" y su categoria): ' + est.copias);

    console.log('\n' + DIM + '== Los combos sin stock para hoy ==' + RST);
    const combos = JSON.parse(await ev('(function () {' +
      'var cards = [].slice.call(document.querySelectorAll(".combo-card"));' +
      'var r = cards.map(function (c) { var b = c.querySelector(".product-footer button"); var s = c.querySelector(".stock-badge");' +
      '  return { nombre: (c.querySelector("h3,.product-name,.combo-name") || {}).textContent || c.getAttribute("data-id"), badge: s ? s.textContent : "", boton: b ? b.textContent : "", otra: !!(b && /add-btn-otra-fecha/.test(b.className)) }; });' +
      'return JSON.stringify(r);' +
      '})()'));
    const sinSalida = combos.filter((c) => /Sin stock/.test(c.badge) && !c.otra && !/Sin stock|Terminado/.test(c.boton));
    const ofrecen = combos.filter((c) => c.otra);
    chk(combos.length > 0, 'se dibujaron ' + combos.length + ' combos (sin esto lo de abajo no mide nada)');
    chk(ofrecen.length > 0 && ofrecen.every((c) => /(Armar|Pedir) para el vie 18/.test(c.boton)),
        'un combo sin stock para hoy ofrece el viernes: ' + ofrecen.map((c) => '"' + c.boton + '"').join(', '));
    chk(sinSalida.length === 0, 'ningun combo dice "Sin stock" con "Armar combo" en naranja abajo (' +
        sinSalida.map((c) => c.nombre).join(', ') + ')');

    console.log('\n' + DIM + '== "+ Agregar" no miente ==' + RST);
    const antes = JSON.parse(await ev('(function () {' +
      'window.__fbq = []; var f0 = window.fbq; window.fbq = function () { window.__fbq.push([].slice.call(arguments)); if (typeof f0 === "function") return f0.apply(this, arguments); };' +
      'var dl = (window.dataLayer || []).filter(function (x) { return x && x[0] === "event" && x[1] === "add_to_cart"; }).length;' +
      'var r = addToCart(' + JSON.stringify(idEJyQ) + ');' +
      'var dl2 = (window.dataLayer || []).filter(function (x) { return x && x[0] === "event" && x[1] === "add_to_cart"; }).length;' +
      'var t = document.getElementById("toast").textContent;' +
      'return JSON.stringify({ r: r, enCarrito: cart[' + JSON.stringify(idEJyQ) + '] || 0, toast: t, ga: dl2 - dl, meta: window.__fbq.filter(function (x) { return x[1] === "AddToCart"; }).length });' +
      '})()'));
    chk(antes.r === false && antes.enCarrito === 0, 'addToCart sobre algo sin stock devuelve false y no lo agrega');
    chk(!/agregado/.test(antes.toast), 'y no dice "agregado": "' + antes.toast + '"');
    chk(antes.ga === 0 && antes.meta === 0, 'ni le manda un add_to_cart a Google ni un AddToCart a Meta (' + antes.ga + '/' + antes.meta + ')');

    /* Hasta la tarde del 13/9 el carrito vacio seguia de un toque. Tadeo: "si
       quiero para hoy pero ARRANCO agregando un producto que no hay, se me
       cambia la fecha solo". Ahora pregunta tambien, hablando de la entrega. */
    console.log('\n' + DIM + '== Tocar "Pedir para el vie 18" con el carrito VACIO: tambien pregunta ==' + RST);
    const sel0 = (await ev('!!document.querySelector(' + JSON.stringify('#catalogo .product-card[data-id="' + idPMa + '"] .add-btn-otra-fecha') + ')'))
      ? '#catalogo .product-card[data-id="' + idPMa + '"] .add-btn-otra-fecha'
      : '.cat-section .product-card[data-id="' + idPMa + '"] .add-btn-otra-fecha';
    const evFecha = (n) => '(window.dataLayer || []).filter(function (x) { return x && x[0] === "event" && x[1] === "' + n + '"; }).length';
    const evSi0 = await ev(evFecha('fecha_por_stock'));
    const leerVacio = 'JSON.stringify((function () { var m = document.getElementById("fecha-modal"); var q = function (s) { var e = m && m.querySelector(s); return e ? e.textContent : ""; };' +
      ' return { modal: !!(m && m.style.display === "flex"), texto: m ? m.innerText : "", si: q(".fecha-modal-si"), no: q(".fecha-modal-no"),' +
      '  fecha: selectedDeliveryDate, pma: cart[' + JSON.stringify(idPMa) + '] || 0, items: cartCount(), combos: Object.keys(comboCart).length }; })())';
    chk((await ev('cartCount()')) === 0, 'el carrito arranca vacio (sin esto lo de abajo no prueba el caso)');
    await tocar(sel0);
    await dormir(500);
    let vacio = JSON.parse(await ev(leerVacio));
    if (process.env.CAPTURA) {
      const img = await cli.enviar('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(process.env.CAPTURA, 'pregunta-vacio-' + ANCHO + '.png'), Buffer.from(img.data, 'base64'));
    }
    chk(vacio.modal, 'con el carrito vacio TAMBIEN pregunta antes de mover la fecha');
    chk(vacio.fecha === '2026-09-13' && vacio.pma === 0, 'y mientras pregunta no mueve la fecha ni agrega nada (' + vacio.fecha + ', ' + vacio.pma + ')');
    chk(/Para hoy no hay/.test(vacio.texto) && /tu entrega pasa al viernes 18\/9/.test(vacio.texto) && /lo que sumes después también/.test(vacio.texto),
        'dice que la ENTREGA pasa al viernes y que lo que sume despues tambien');
    chk(!/ya tenés en el carrito/.test(vacio.texto), 'y no habla de un carrito que esta vacio');
    chk(/Pasar mi entrega al viernes 18\/9/.test(vacio.si) && /Ver lo que hay para hoy/.test(vacio.no),
        'las dos salidas: "' + vacio.si + '" / "' + vacio.no + '"');
    chk(/mandá primero el de hoy/.test(vacio.texto), 'y dice como tener las dos cosas');
    const evNoV = await ev(evFecha('fecha_por_stock_no'));
    await tocar('#fecha-modal .fecha-modal-no');
    await dormir(400);
    vacio = JSON.parse(await ev(leerVacio));
    chk(!vacio.modal && vacio.fecha === '2026-09-13' && vacio.items === 0, '"Ver lo que hay para hoy" deja la fecha en hoy y el carrito vacio (' + vacio.fecha + ')');
    chk((await ev(evFecha('fecha_por_stock_no'))) - evNoV === 1, 'y se mide como fecha_por_stock_no');
    /* El combo con el carrito vacio: la misma pregunta, y sin contestar no abre el armado. */
    const comboV = JSON.parse(await ev('(function () { var b = document.querySelector(".combo-card .add-btn-otra-fecha"); if (!b) return "null"; b.click();' +
      ' var m = document.getElementById("fecha-modal"); var r = { abierto: !!(m && m.style.display === "flex"), si: m && m.querySelector(".fecha-modal-si") ? m.querySelector(".fecha-modal-si").textContent : "",' +
      '  fecha: selectedDeliveryDate, combos: Object.keys(comboCart).length, config: !!(document.getElementById("combo-modal") && document.getElementById("combo-modal").style.display === "flex") };' +
      ' if (typeof otraFechaNo === "function") otraFechaNo(); r.despues = selectedDeliveryDate; return JSON.stringify(r); })()'));
    chk(comboV && comboV.abierto && /Pasar mi entrega/.test(comboV.si) && !comboV.config && comboV.combos === 0 && comboV.despues === '2026-09-13',
        'un combo con el carrito vacio tambien pregunta, y sin contestar no arma nada ni mueve la fecha');
    await tocar(sel0);
    await dormir(400);
    await tocar('#fecha-modal .fecha-modal-si');
    await dormir(600);
    vacio = JSON.parse(await ev(leerVacio));
    chk(!vacio.modal && vacio.fecha === '2026-09-18' && vacio.pma === 1,
        '"Pasar mi entrega al viernes 18/9" mueve la fecha y agrega la pizza (' + vacio.fecha + ', ' + vacio.pma + ')');
    /* Volver a "hoy" desde el calendario saca lo que hoy no hay, y lo dice. */
    const vuelta = JSON.parse(await ev('(function () { setDeliveryDate("2026-09-13", "Domingo", { sinScroll: true });' +
      ' return JSON.stringify({ pma: cart[' + JSON.stringify(idPMa) + '] || 0, toast: document.getElementById("toast").textContent }); })()'));
    chk(vuelta.pma === 0 && /ajustado/.test(vuelta.toast), 'y volver a hoy lo saca del carrito avisando: "' + vuelta.toast + '"');
    await dormir(400);

    console.log('\n' + DIM + '== Con algo ya elegido para HOY, pregunta antes de mover todo ==' + RST);
    await ev('addToCart(' + JSON.stringify(idPMu) + ')');   // lo que ya estaba en el carrito
    await dormir(300);
    const sel = sel0;
    chk(await ev('!!document.querySelector(' + JSON.stringify(sel) + ')'), 'el boton volvio a la card de su categoria');
    const modalAbierto = 'JSON.stringify((function () { var m = document.getElementById("fecha-modal"); var ab = !!(m && m.style.display === "flex");' +
      ' var q = function (s) { var e = m && m.querySelector(s); return e ? { t: e.textContent, h: Math.round(e.getBoundingClientRect().height), top: Math.round(e.getBoundingClientRect().top), bot: Math.round(e.getBoundingClientRect().bottom) } : null; };' +
      ' return { abierto: ab, texto: m ? m.innerText : "", si: q(".fecha-modal-si"), no: q(".fecha-modal-no"), foco: document.activeElement && document.activeElement.className,' +
      '  quieto: document.body.classList.contains("modal-open"), fecha: selectedDeliveryDate, pma: cart[' + JSON.stringify(idPMa) + '] || 0, pmu: cart[' + JSON.stringify(idPMu) + '] || 0, vh: window.innerHeight }; })())';
    let pos = await tocar(sel);
    chk(pos && pos.libre, 'nada tapa el boton: el toque le cae a el (' + (pos ? pos.texto : 'sin boton') + ')');
    chk(pos && (ANCHO >= 700 || pos.alto >= 44), 'mide ' + (pos ? pos.alto : 0) + 'px de alto');
    await dormir(400);
    let mo = JSON.parse(await ev(modalAbierto));
    if (process.env.CAPTURA) {
      const img = await cli.enviar('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(process.env.CAPTURA, 'pregunta-' + ANCHO + '.png'), Buffer.from(img.data, 'base64'));
    }
    chk(mo.abierto, 'se abre la pregunta');
    chk(mo.fecha === '2026-09-13' && mo.pma === 0 && mo.pmu === 1, 'y mientras pregunta no toca nada (fecha ' + mo.fecha + ', pizza ' + mo.pma + ', lo de antes ' + mo.pmu + ')');
    chk(/Para hoy no hay/.test(mo.texto) && /viernes 18\/9/.test(mo.texto), 'dice que para hoy no hay y que hay para el viernes 18/9');
    chk(/lo que ya tenés en el carrito también pasa al viernes 18\/9/.test(mo.texto), 'y dice que pasa con lo que ya eligio');
    chk(mo.si && /Pasar todo al viernes 18\/9/.test(mo.si.t) && mo.no && /Seguir con mi pedido para hoy/.test(mo.no.t),
        'las dos salidas dicen lo que hacen: "' + (mo.si ? mo.si.t : '') + '" / "' + (mo.no ? mo.no.t : '') + '"');
    chk(mo.si && mo.no && mo.si.h >= 44 && mo.no.h >= 44, 'los dos botones miden ' + (mo.si ? mo.si.h : 0) + ' y ' + (mo.no ? mo.no.h : 0) + 'px');
    chk(mo.no && mo.no.bot <= mo.vh && mo.si.top >= 0, 'y entran en la pantalla sin scrollear (' + (mo.si ? mo.si.top : 0) + ' a ' + (mo.no ? mo.no.bot : 0) + ' de ' + mo.vh + ')');
    chk(/armá otro para el viernes 18\/9/.test(mo.texto), 'y dice como tener las dos cosas: dos pedidos');
    chk(mo.quieto, 'el fondo queda quieto');
    chk(/fecha-modal-si/.test(mo.foco || ''), 'el foco queda en el boton principal (' + mo.foco + ')');

    const evNo0 = await ev(evFecha('fecha_por_stock_no'));
    await tocar('#fecha-modal .fecha-modal-no');
    await dormir(400);
    mo = JSON.parse(await ev(modalAbierto));
    chk(!mo.abierto && !mo.quieto, '"Seguir con mi pedido para hoy" cierra y devuelve el scroll');
    chk(mo.fecha === '2026-09-13' && mo.pma === 0 && mo.pmu === 1, 'y deja todo como estaba (fecha ' + mo.fecha + ', pizza ' + mo.pma + ', lo de antes ' + mo.pmu + ')');
    chk((await ev(evFecha('fecha_por_stock_no'))) - evNo0 === 1, 'se mide como fecha_por_stock_no');
    chk(await ev('!!document.querySelector(' + JSON.stringify(sel) + ')'), 'y el boton sigue ofreciendo el viernes');

    await tocar(sel); await dormir(400);
    await cli.enviar('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await cli.enviar('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await dormir(300);
    mo = JSON.parse(await ev(modalAbierto));
    chk(!mo.abierto && mo.fecha === '2026-09-13' && mo.pma === 0, 'Escape tambien cierra sin mover la fecha');
    await tocar(sel); await dormir(400);
    await ev('(function () { var m = document.getElementById("fecha-modal"); if (m) m.dispatchEvent(new MouseEvent("click", { bubbles: true })); })()');
    await dormir(300);
    mo = JSON.parse(await ev(modalAbierto));
    chk(!mo.abierto && mo.fecha === '2026-09-13' && mo.pma === 0, 'tocar afuera tambien cierra sin mover la fecha');

    console.log('\n' + DIM + '== Un combo con el carrito lleno: la misma pregunta ==' + RST);
    const combo = JSON.parse(await ev('(function () { var b = document.querySelector(".combo-card .add-btn-otra-fecha"); if (!b) return "null"; b.click();' +
      ' var m = document.getElementById("fecha-modal"); var r = { abierto: !!(m && m.style.display === "flex"), texto: m ? m.innerText : "", fecha: selectedDeliveryDate,' +
      '  combos: Object.keys(comboCart).length, config: !!(document.getElementById("combo-modal") && document.getElementById("combo-modal").style.display === "flex") };' +
      ' if (typeof otraFechaNo === "function") otraFechaNo(); r.despues = selectedDeliveryDate; return JSON.stringify(r); })()'));
    chk(combo && combo.abierto && /Combo|Noche|Mesa|Finde|Semana|Freezer/.test(combo.texto) && /armá otro/.test(combo.texto),
        'el combo tambien pregunta antes (' + (combo ? combo.texto.split('\n')[1] : 'sin boton') + ')');
    chk(combo && !combo.config && combo.combos === 0 && combo.fecha === '2026-09-13' && combo.despues === '2026-09-13',
        'y sin contestar no abre el armado, no agrega nada ni mueve la fecha');

    console.log('\n' + DIM + '== "Pasar todo al viernes 18/9" ==' + RST);
    pos = await tocar(sel); await dormir(400);
    const yAntes = pos ? Math.round(pos.y) : 0;
    const evSi1 = await ev(evFecha('fecha_por_stock'));
    await tocar('#fecha-modal .fecha-modal-si');
    await dormir(700);
    const desp = JSON.parse(await ev('(function () {' +
      'return JSON.stringify({ fecha: selectedDeliveryDate, pma: cart[' + JSON.stringify(idPMa) + '] || 0, pmu: cart[' + JSON.stringify(idPMu) + '] || 0,' +
      '  toast: document.getElementById("toast").textContent, chip: (document.getElementById("date-chip") || {}).textContent,' +
      '  tl: Math.round(document.getElementById("toast").getBoundingClientRect().left), tr: Math.round(document.getElementById("toast").getBoundingClientRect().right), vw: document.documentElement.clientWidth,' +
      '  y: Math.round(window.pageYOffset), modo: getStockMode(), guardada: localStorage.getItem("maleu_delivery_date") || "",' +
      '  modal: !!(document.getElementById("fecha-modal") && document.getElementById("fecha-modal").style.display === "flex"), quieto: document.body.classList.contains("modal-open"),' +
      '  otras: document.querySelectorAll(".add-btn-otra-fecha").length,' +
      '  ev: ' + evFecha('fecha_por_stock') + ' });' +
      '})()'));
    chk(!desp.modal && !desp.quieto, 'la pregunta se cierra y el fondo se libera');
    chk(desp.fecha === '2026-09-18' && desp.modo === 'ilimitado', 'la entrega paso al viernes 18 (' + desp.fecha + ', ' + desp.modo + ')');
    chk(desp.pma === 1, 'la pizza entro al carrito (' + desp.pma + ')');
    chk(desp.pmu === 1, 'lo que ya estaba en el carrito sigue ahi (' + desp.pmu + ')');
    chk(/pasó al viernes 18\/9/.test(desp.toast), 'el aviso dice que cambio la fecha: "' + desp.toast + '"');
    chk(desp.tl >= 0 && desp.tr <= desp.vw, 'el aviso entra entero en la pantalla (' + desp.tl + ' a ' + desp.tr + ' de ' + desp.vw + ')');
    chk(/Vie 18\/9/.test(desp.chip || ''), 'el chip de arriba dice la fecha nueva ("' + desp.chip + '")');
    chk(/2026-09-18/.test(desp.guardada), 'y queda guardada para la proxima visita');
    chk(desp.y > 300, 'no te sube arriba de todo: seguis mirando el producto (scroll ' + desp.y + ')');
    chk(desp.otras === 0, 'con el viernes elegido ya no queda ningun boton "Pedir para…" (' + desp.otras + ')');
    chk(evSi1 - evSi0 === 1 && desp.ev - evSi1 === 1, 'se mide en Analytics como fecha_por_stock, una vez por cada paso (' + (evSi1 - evSi0) + ' + ' + (desp.ev - evSi1) + ')');
    void yAntes;

    /* ── 4. COPIAR EL ALIAS ──────────────────────────────────────────── */
    console.log('\n' + DIM + '== Copiar el alias ==' + RST);
    const copia = JSON.parse(await ev('(async function () {' +
      'var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };' +
      'Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: function () { return Promise.reject(new Error("no")); } } });' +
      'var ex0 = document.execCommand; var llamo = 0; document.execCommand = function () { llamo++; return false; };' +
      'copyAlias("maleubru"); await dormir(150); var t1 = document.getElementById("toast").textContent;' +
      'document.execCommand = function () { llamo++; return true; };' +
      'copyAlias("maleubru"); await dormir(150); var t2 = document.getElementById("toast").textContent;' +
      'Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: function () { return Promise.resolve(); } } });' +
      'document.execCommand = ex0; copyAlias("maleump"); await dormir(150); var t3 = document.getElementById("toast").textContent;' +
      'return JSON.stringify({ t1: t1, t2: t2, t3: t3, llamo: llamo });' +
      '})()'));
    chk(/maleubru/.test(copia.t1) && /mantené apretado/.test(copia.t1), 'si no se puede copiar, lo dice con el alias escrito: "' + copia.t1 + '"');
    chk(/copiado: maleubru/.test(copia.t2), 'si el portapapeles falla, prueba el metodo viejo: "' + copia.t2 + '"');
    chk(/copiado: maleump/.test(copia.t3), 'con portapapeles, copia como siempre: "' + copia.t3 + '"');

    /* ── 5. EL FORMULARIO, EL PAGO Y LOS TAMAÑOS ─────────────────────── */
    console.log('\n' + DIM + '== Formulario y medidas ==' + RST);
    const med = JSON.parse(await ev('(function () {' +
      'var s = function (q) { return document.querySelector(q); };' +
      'var fs = s(".form-wrap .section-sub"), ts = s(".top-section .section-sub");' +
      'if (!document.getElementById("cart-sidebar").classList.contains("open")) toggleCart();' +
      'var qb = document.querySelector("#cart-sidebar .qty-btn");' +
      'var grid = [].slice.call(document.querySelectorAll(".cat-section .products-grid")).filter(function (g) { return g.offsetParent; })[0];' +
      'var cat = s(".cat-section"), top = s("#top-section .products-grid");' +
      'var lab = s("label[for=pago-tr]");' +
      'return JSON.stringify({' +
      '  formAlign: getComputedStyle(fs).textAlign, formMargen: parseFloat(getComputedStyle(fs).marginTop),' +
      '  topAlign: getComputedStyle(ts).textAlign,' +
      '  qty: qb ? Math.round(qb.getBoundingClientRect().height) : 0,' +
      '  cols: grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0,' +
      '  anchoCat: cat ? Math.round(cat.getBoundingClientRect().width) : 0, anchoTop: top ? Math.round(top.getBoundingClientRect().width) : 0,' +
      '  pago: lab ? lab.textContent.replace(/\\s+/g, " ").trim() : "",' +
      '  desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth });' +
      '})()'));
    chk(med.formAlign !== 'center' && med.formMargen >= 0, 'el subtitulo del formulario va alineado con su titulo (' + med.formAlign + ', margen ' + med.formMargen + ')');
    chk(med.topAlign === 'center', 'y el de "Lo mas pedido" sigue centrado');
    /* Lo que este chequeo vino a cuidar (13/9/2026) es que NO diga "Mercado
       Pago" con el alias de un vendedor. Pedia el 📲 de adelante, asi que se
       puso en rojo cuando el emoji se fue (23/9). El emoji no era el punto. */
    chk(/^Transferencia/.test(med.pago) && !/Mercado Pago/i.test(med.pago),
        'el pago se llama "Transferencia" y no "Mercado Pago": "' + med.pago.slice(0, 40) + '"');
    if (ANCHO < 560) {
      chk(med.qty >= 38, 'los +/- del carrito miden ' + med.qty + 'px');
    } else if (ANCHO >= 1024) {
      chk(med.cols === 4, 'el catalogo va a 4 columnas (' + med.cols + ')');
      chk(Math.abs(med.anchoCat - med.anchoTop) <= 2, 'y al mismo ancho que "Lo mas pedido" (' + med.anchoCat + ' / ' + med.anchoTop + ')');
    }
    chk(med.desborde <= 0, 'nada se sale a lo ancho (' + med.desborde + 'px)');
    /* El aviso mas largo que puede salir hoy: sin esto, el chequeo de arriba mide
       uno corto y daria verde con el nowrap puesto. */
    const largo = JSON.parse(await ev('(function () {' +
      'toast("✓ Sorrentinos Langostinos al Azafrán agregado · tu entrega pasó al miércoles 16/9", 3000);' +
      'var r = document.getElementById("toast").getBoundingClientRect();' +
      'return JSON.stringify({ l: Math.round(r.left), r: Math.round(r.right), vw: document.documentElement.clientWidth });' +
      '})()'));
    chk(largo.l >= 0 && largo.r <= largo.vw, 'un aviso largo entra entero (' + largo.l + ' a ' + largo.r + ' de ' + largo.vw + ')');

    const posts = await ev('window.__post');
    if (posts) console.log(DIM + '  POST: ' + (await ev('JSON.stringify(window.__posts || [])')) + RST);
    chk(posts === 0 && escapados.length === 0, 'no salio ningun POST ni salto a WhatsApp (' + posts + '/' + escapados.length + ')');
  } catch (e) {
    mal++;
    console.log('  ' + RED + 'ROTO ' + RST + e.message);
  } finally {
    try { proc.kill(); } catch (e) {}
    srv.close();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  console.log('\n' + (mal ? RED : VER) + bien + ' ok · ' + mal + ' mal' + RST + '  (' + ANCHO + 'px)');
  process.exit(mal ? 1 : 0);
}

main();
