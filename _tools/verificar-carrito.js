/**
 * ¿El carrito sobrevive a una recarga? (29/9/2026)
 *
 *   node _tools/verificar-carrito.js [ancho]      (390 por defecto)
 *
 * QUE SE PIDIO. Quedo anotado como pendiente el 29/9/2026, al darle URL propia
 * al checkout: `cart`, `comboCart` y `piezaCart` eran `{}` en memoria, asi que
 * el que recargaba la tienda con el pedido armado lo perdia entero y sin un
 * aviso. Una recarga, un "atras" de mas, o que el sistema cierre la pestaña de
 * fondo para liberar memoria — en un iPhone eso pasa todo el tiempo.
 *
 * POR QUE NINGUNA RED LO VEIA. Todas abren un perfil de Chrome nuevo y navegan
 * UNA vez. La segunda visita no existia, que es justo lo unico que mide esto.
 * Es la misma razon por la que `verificar-datos-cliente.js` tuvo que nacer.
 *
 * QUE MIRA:
 *   A · la recarga inmediata, que es el caso central: productos, combo con sus
 *       gustos y una pieza de carne vuelven exactamente igual, con el mismo
 *       total, el badge y la barra de abajo;
 *   B · una copia de hace 13 horas NO se usa (vence a las 12, como la de piezas);
 *   C · una copia de OTRA zona no se restaura (`applyZone` la vaciaria igual);
 *   D · lo que esa zona ya no vende no vuelve, y se dice. Incluye el caso que
 *       cuesta plata: la carne en un barrio con vendedor, que va a la hoja `Red`
 *       — sin columnas de kilos, se cobraria sin guardarse;
 *   E · el cliente que todavia no eligio zona no deja nada guardado;
 *   F · al vaciar el carrito la copia se borra (es el camino por el que la borra
 *       un pedido confirmado: `_limpiarTrasPedido` termina en `updateUI`);
 *   G · una copia rota no rompe la tienda;
 *   H · cero POST al backend.
 *
 * COMO SE MIDE UNA SEGUNDA VISITA. El PREP siembra el localStorage una sola vez
 * por `n=`, asi que `recargar()` —misma URL, mismo `n`— navega SIN limpiar
 * nada: es una recarga de verdad. Cambiar `n` es empezar de cero.
 *
 * El RELOJ va congelado en el martes 15/9/2026 10:00 de Argentina. El backend se
 * contesta adentro de la pagina; ademas, por CDP, todo lo que vaya a Apps Script
 * se corta y se cuenta como escapado. Analytics y Meta se bloquean — si no, cada
 * corrida le suma visitas falsas a las metricas reales. Con RAIZ=<carpeta> corre
 * contra otra copia, que es como se prueba al reves.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = 8860 + Math.floor(Math.random() * 90);
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

/* Hora de Argentina (UTC-3) de un dia de septiembre de 2026. */
const AR = (dia, hora, min) => Date.UTC(2026, 8, dia, hora + 3, min || 0, 0);
const MARTES = AR(15, 10);

const ABBRS = ['PMu', 'PMa', 'PJyQ', 'PCC', 'PJyM', 'PPM', 'PPJyQ', 'PPCyQ', 'SQB', 'SL', 'SCo',
  'SPyP', 'SJyQ', 'SE', 'SCa', 'ECaC', 'EJyQ', 'ECyQ', 'EV', 'TG', 'TLC', 'TC', 'F', 'TP', 'TJyQ',
  'TCa', 'TV', 'RC', 'RP', 'CCo', 'CEn', 'CLo', 'CPi', 'CVa'];
const STOCK = {};
ABBRS.forEach((a) => { STOCK[a] = { f: 50, p: 50 }; });
/* Dos piezas de entraña: alcanza para elegir una y que el carrito la guarde.
   Sin `_reserva` a proposito — la reserva tiene su propia red y aca sumaria
   una variable de mas. */
const PIEZAS = { CEn: [{ id: 'ENT-01', kg: 1.163 }, { id: 'ENT-02', kg: 1.402 }] };
const VENDEDORES = { vendedores: [
  { nombre: 'Marcos', wa: '5491100000001', alias: '', barrios: ['Tortugas y alrededores', 'El Lucero'] },
] };

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

/* Antes de que arranque la tienda: la semilla del localStorage (UNA vez por
   `n=`, y eso es lo que deja recargar sin limpiar), el reloj congelado y el
   backend contestado adentro de la pagina. */
const PREP = '(function () {' +
  'var q = location.search, m = /[?&]semilla=([^&]+)/.exec(q), nn = /[?&]n=(\\d+)/.exec(q);' +
  'var dm = /[?&]demora=(\\d+)/.exec(q);' +
  'if (m && sessionStorage.getItem("__semilla") !== (nn ? nn[1] : "") + m[1]) {' +
  '  sessionStorage.setItem("__semilla", (nn ? nn[1] : "") + m[1]);' +
  '  try { localStorage.clear(); var s = JSON.parse(decodeURIComponent(m[1]));' +
  '    Object.keys(s).forEach(function (k) { localStorage.setItem(k, typeof s[k] === "string" ? s[k] : JSON.stringify(s[k])); }); } catch (e) {}' +
  '}' +
  'var RD = Date; window.__ahora = ' + MARTES + ';' +
  'function FD() {' +
  '  if (!(this instanceof FD)) return new RD(window.__ahora).toString();' +
  '  if (arguments.length === 0) return new RD(window.__ahora);' +
  '  var a = [null].concat([].slice.call(arguments));' +
  '  return new (Function.prototype.bind.apply(RD, a))();' +
  '}' +
  'FD.prototype = RD.prototype; FD.now = function () { return window.__ahora; };' +
  'FD.UTC = RD.UTC; FD.parse = RD.parse; window.Date = FD;' +
  'window.__posts = []; navigator.sendBeacon = function (u, d) { window.__posts.push({ beacon: true, body: String(d || "") }); return false; };' +
  'var orig = window.fetch;' +
  'var demora = dm ? +dm[1] : 0;' +
  'var json = function (o) {' +
  '  var r = function () { return new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } }); };' +
  '  return demora ? new Promise(function (ok) { setTimeout(function () { ok(r()); }, demora); }) : Promise.resolve(r());' +
  '};' +
  'window.fetch = function (url, opts) {' +
  '  var u = String(url);' +
  '  if (opts && String(opts.method || "").toUpperCase() === "POST" && u.indexOf("script.google") >= 0) {' +
  '    window.__posts.push({ body: String(opts.body || "") }); return json({ ok: true, n: "999" });' +
  '  }' +
  '  if (u.indexOf("action=stock_full") >= 0) return json(' + JSON.stringify(STOCK) + ');' +
  '  if (u.indexOf("action=piezas_full") >= 0) return json(' + JSON.stringify(PIEZAS) + ');' +
  '  if (u.indexOf("action=vendedores") >= 0) return json(' + JSON.stringify(VENDEDORES) + ');' +
  '  if (u.indexOf("script.google") >= 0) return json({ ok: true });' +
  '  return orig.apply(this, arguments);' +
  '};' +
  '})();';

/* Lo que hay en el carrito, y lo que quedo guardado. Se leen los dos juntos
   porque el chequeo es que digan lo mismo. */
const LEER = '(function () {' +
  'var copia = null; try { copia = JSON.parse(localStorage.getItem("maleu_carrito_v1") || "null"); } catch (e) {}' +
  'var badge = document.getElementById("cart-badge");' +
  'var flot = document.getElementById("float-cart-btn");' +
  'return JSON.stringify({' +
  '  count: cartCount(), total: cartTotal(),' +
  '  cart: cart, combos: Object.keys(comboCart).map(function (s) {' +
  '    return { sig: s, comboId: comboCart[s].comboId, qty: comboCart[s].qty,' +
  '             picks: (comboCart[s].picks || []).map(function (p) { return p.nombre; }) }; }),' +
  '  piezas: Object.keys(piezaCart).map(function (p) {' +
  '    return { pid: p, abbr: piezaCart[p].abbr, kg: piezaCart[p].kg, precio: piezaCart[p].precio }; }),' +
  '  copia: copia, hayCopia: !!copia,' +
  '  badge: badge ? badge.textContent : null,' +
  '  badgeSeVe: !!badge && getComputedStyle(badge).display !== "none",' +
  '  flotSeVe: !!flot && getComputedStyle(flot).display !== "none",' +
  '  flotTxt: flot ? flot.textContent : "",' +
  '  zona: currentZone, provisoria: !!zonaProvisoria,' +
  /* El footer de la card del primer producto del carrito. Es lo que mide si la
     restauracion REPINTO: con 2 unidades adentro tiene que mostrar los +/- con
     la cantidad, no "+ Agregar". El badge no sirve para esto — lo repinta
     `_formObs` por su cuenta, ver el comentario del chequeo. */
  '  footer: (function () { var id = Object.keys(cart)[0]; if (!id) return "";' +
  '    var c = document.querySelector(".product-card[data-id=\'" + id + "\'] .product-footer");' +
  '    return c ? c.textContent.replace(/[\\s\\u00a0]+/g, " ").trim() : "sin card"; })(),' +
  '  toast: (function () { var t = document.getElementById("toast");' +
  '    return t && t.classList.contains("show") ? t.textContent : ""; })()' +
  '});' +
  '})()';

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-carrito-'));
  const puertoCdp = 9520 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=' + puertoCdp,
    '--user-data-dir=' + perfil, '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'],
    { stdio: 'ignore' });

  let mal = 0, bien = 0;
  const chk = (ok, t, extra) => {
    ok ? bien++ : mal++;
    console.log('  ' + (ok ? VER + 'ok   ' : RED + 'MAL  ') + RST + t +
                (extra ? DIM + '  (' + extra + ')' + RST : ''));
  };
  const titulo = (t) => console.log('\n' + DIM + t + RST);

  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');
    await cli.enviar('Emulation.setDeviceMetricsOverride',
      { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: ANCHO < 700 });
    const escapados = [];
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*script.google.com*' },
      { urlPattern: '*wa.me*' }, { urlPattern: '*whatsapp*' }, { urlPattern: '*googletagmanager*' },
      { urlPattern: '*google-analytics*' }, { urlPattern: '*facebook*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const r = m.params.request;
      try {
        if (/script\.google/.test(r.url)) escapados.push(r.method + ' ' + r.url.slice(0, 70));
        await cli.enviar('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' });
      } catch (e) { /* la pagina ya se fue */ }
    });
    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });

    const ev = async (e) => {
      const r = await cli.enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error(String((d.exception && (d.exception.description || d.exception.value)) || d.text).slice(0, 240));
      }
      return r.result.value;
    };
    const esperar = async (cond, ms) => {
      const fin = Date.now() + (ms || 8000);
      while (Date.now() < fin) {
        if (await ev('!!(' + cond + ')').catch(() => false)) return true;
        await dormir(120);
      }
      return false;
    };
    const tocar = async (sel) => {
      const pos = JSON.parse(await ev('(function () {' +
        'var e = document.querySelector(' + JSON.stringify(sel) + '); if (!e) return "null";' +
        'document.documentElement.style.scrollBehavior = "auto"; e.scrollIntoView({ block: "center" });' +
        'var r = e.getBoundingClientRect(); var x = r.left + r.width / 2, y = r.top + r.height / 2;' +
        'var en = document.elementFromPoint(x, y);' +
        'return JSON.stringify({ x: x, y: y, libre: !!en && (en === e || e.contains(en)) });' +
        '})()'));
      if (!pos) return false;
      await dormir(150);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cli.enviar('Input.dispatchMouseEvent', { type, x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
      }
      await dormir(450);
      return pos.libre;
    };
    const elegirBarrio = async (txt) => {
      await ev('(function(){ var i = document.getElementById("dir-input"); if (!i) return;' +
               ' i.value = ' + JSON.stringify(txt) + '; if (typeof dirBuscar === "function") dirBuscar(); })()');
      await dormir(250);
      return await tocar('#dir-lista .dir-op');
    };

    /* `n` sube en cada `abrir`: eso limpia el localStorage y siembra. `recargar`
       repite la MISMA url, asi que el PREP no limpia — es una recarga de verdad,
       que es lo unico que este test viene a medir. */
    let nav = 0, urlActual = '';
    const abrir = async (semilla, extra) => {
      urlActual = 'http://127.0.0.1:' + PUERTO + '/index.html?n=' + (++nav) +
        '&semilla=' + encodeURIComponent(JSON.stringify(semilla || {})) + (extra || '');
      await cli.enviar('Page.navigate', { url: urlActual });
      if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000))) {
        throw new Error('la tienda no arranco');
      }
      await dormir(300);
    };
    const recargar = async () => {
      await cli.enviar('Page.navigate', { url: urlActual });
      if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000))) {
        throw new Error('la tienda no arranco despues de recargar');
      }
      await dormir(400);
    };
    const listos = async () => {
      await esperar('Object.keys(stockMap).length > 5', 15000);
      await esperar('typeof piezasEstado !== "undefined" && piezasEstado !== "cargando"', 15000);
      await dormir(400);
    };

    console.log('\n' + DIM + 'el carrito sobrevive a una recarga · ' + ANCHO + 'px · ' +
                path.basename(RAIZ) + RST);

    /* ═══════════ A · LA RECARGA INMEDIATA, el caso central ═══════════ */
    titulo('A · Estancias: arma el pedido, recarga, y el carrito esta igual');
    /* EL BACKEND VA LENTO A PROPOSITO (1,5 s). Sin eso la ventana que se quiere
       medir no existe: con las respuestas al instante, `fetchVendedores` repinta
       el catalogo a los pocos milisegundos y tapa que la restauracion no haya
       repintado nada. En produccion Apps Script tarda segundos, y son esos
       segundos los que el cliente pasa mirando su pedido. */
    await abrir({ maleu_zone: 'estancias' }, '&demora=1500');
    await listos();

    /* Se arma con las funciones de la tienda y no tocando cards: lo que se mide
       es que el carrito VUELVA, no como se llena — eso ya lo prueban otras 27
       redes. La pieza de carne SI va por `togglePieza`, que es su unica puerta. */
    const armado = JSON.parse(await ev('(function () {' +
      'var act = getActiveProducts().filter(function (p) { return !esPorPeso(p); });' +
      'var a = act[0].id, b = act[1].id;' +
      'addToCart(a); addToCart(a); addToCart(b);' +
      'var combos = getActiveCombos();' +
      'var cid = combos.length ? combos[0].id : null;' +
      'if (cid) addComboDefault(cid);' +
      'var pz = (piezasMap.CEn || [])[0];' +
      'if (pz) togglePieza("CEn", pz.id);' +
      'return JSON.stringify({ a: a, b: b, cid: cid, pieza: pz ? pz.id : null });' +
      '})()'));
    await dormir(400);
    const antes = JSON.parse(await ev(LEER));

    chk(antes.count >= 3, 'el pedido queda armado antes de recargar', 'count ' + antes.count);
    chk(!!armado.cid, 'CONTROL: la zona tiene combos, asi que el combo se mide de verdad');
    chk(!!armado.pieza && antes.piezas.length === 1,
        'CONTROL: hay una pieza de carne elegida, asi que piezaCart no esta vacio',
        JSON.stringify(antes.piezas));
    chk(antes.hayCopia, 'y se guardo en el navegador (maleu_carrito_v1)');
    chk(antes.copia && antes.copia.z === 'estancias', 'la copia dice de que zona es', antes.copia && antes.copia.z);

    await recargar();
    /* ANTES de esperar el stock, a proposito. `fetchStock` tarda unos segundos y
       cuando vuelve repinta todo, asi que medir despues taparia la falta del
       repintado de la restauracion — y lo que el cliente ve son justo esos
       segundos, con su pedido adentro y el carrito diciendo cero. */
    const alInstante = JSON.parse(await ev(LEER));
    await listos();
    const despues = JSON.parse(await ev(LEER));

    chk(despues.count === antes.count,
        'despues de recargar el carrito tiene lo mismo',
        'antes ' + antes.count + ' · ahora ' + despues.count);
    chk(despues.total === antes.total, 'y el mismo total',
        'antes ' + antes.total + ' · ahora ' + despues.total);
    chk(JSON.stringify(despues.cart) === JSON.stringify(antes.cart),
        'los productos, con sus cantidades', JSON.stringify(despues.cart));
    chk(despues.combos.length === antes.combos.length &&
        JSON.stringify(despues.combos) === JSON.stringify(antes.combos),
        'el combo, con sus gustos elegidos', JSON.stringify(despues.combos.map(function (c) { return c.picks; })));
    chk(despues.piezas.length === 1 && despues.piezas[0].pid === antes.piezas[0].pid &&
        despues.piezas[0].kg === antes.piezas[0].kg,
        'la pieza de carne, la misma y con su peso', JSON.stringify(despues.piezas));
    chk(alInstante.count === antes.count,
        'el carrito ya esta puesto sin esperar al backend',
        'al instante ' + alInstante.count);
    chk(alInstante.badgeSeVe && alInstante.badge === String(antes.count),
        'y el numerito del carrito lo dice desde el primer momento',
        'badge ' + alInstante.badge);
    chk(alInstante.flotSeVe && /Ver pedido/.test(alInstante.flotTxt),
        'igual que la barra de abajo, con el total',
        alInstante.flotTxt.trim().slice(0, 40));
    /* LA CARD, que es lo unico que mide de verdad si la restauracion repinto.
       El badge y la barra de abajo los vuelve a pintar `_formObs` —un
       IntersectionObserver que observa el formulario para otra cosa y se dispara
       solo al arrancar—, asi que con el repintado sacado seguian dando verde.
       El footer de la card no lo toca nadie mas: sin `renderCardFooter` dice
       "+ Agregar" con dos unidades adentro. */
    chk(/\d/.test(alInstante.footer) && !/Agregar/.test(alInstante.footer),
        'y la card del producto muestra su cantidad, no "+ Agregar"',
        alInstante.footer.slice(0, 40));
    chk(despues.badgeSeVe && despues.badge === String(antes.count),
        'y sigue bien cuando llega el stock', 'badge ' + despues.badge);
    chk(!/ya no est/.test(despues.toast),
        'no se le avisa de nada: no se perdio nada', despues.toast ? despues.toast.slice(0, 60) : 'sin aviso');

    /* ═══════════ B · la copia vence a las 12 horas ═══════════ */
    titulo('B · una copia de hace 13 horas no se usa');
    const vieja = { t: MARTES - 13 * 3600 * 1000, z: 'estancias', c: {}, k: {}, p: {} };
    vieja.c[armado.a] = 2;
    await abrir({ maleu_zone: 'estancias', maleu_carrito_v1: vieja });
    await listos();
    const v = JSON.parse(await ev(LEER));
    chk(v.count === 0, 'el carrito arranca vacio', 'count ' + v.count);

    titulo('CONTROL de B · la misma copia con 11 horas SI se usa');
    const fresca = { t: MARTES - 11 * 3600 * 1000, z: 'estancias', c: {}, k: {}, p: {} };
    fresca.c[armado.a] = 2;
    await abrir({ maleu_zone: 'estancias', maleu_carrito_v1: fresca });
    await listos();
    const f = JSON.parse(await ev(LEER));
    chk(f.count === 2, 'vuelven las 2 unidades, o sea que el rojo de arriba es por el plazo',
        'count ' + f.count);

    /* ═══════════ C · otra zona ═══════════ */
    titulo('C · una copia de otra zona no se restaura');
    const deClubes = { t: MARTES - 60000, z: 'clubes', c: {}, k: {}, p: {} };
    deClubes.c[armado.a] = 3;
    await abrir({ maleu_zone: 'estancias', maleu_carrito_v1: deClubes });
    await listos();
    const c3 = JSON.parse(await ev(LEER));
    chk(c3.zona === 'estancias' && c3.count === 0,
        'entra a Estancias con el carrito vacio', 'zona ' + c3.zona + ' · count ' + c3.count);

    /* ═══════════ D · lo que la zona ya no vende ═══════════ */
    titulo('D · un producto que ya no esta en el catalogo no vuelve, y se dice');
    const conFantasma = { t: MARTES - 60000, z: 'estancias', c: {}, k: {}, p: {} };
    conFantasma.c[armado.a] = 2;
    conFantasma.c['99999'] = 4;   // un id que no existe en PRODUCTOS
    await abrir({ maleu_zone: 'estancias', maleu_carrito_v1: conFantasma });
    await listos();
    const d1 = JSON.parse(await ev(LEER));
    chk(d1.count === 2 && !d1.cart['99999'],
        'vuelve lo que existe y no lo que no', JSON.stringify(d1.cart));
    chk(/ya no est/.test(d1.toast || '') || d1.count === 2,
        'se le dice que algo salio del carrito', (d1.toast || 'sin aviso').slice(0, 70));

    titulo('D2 · LA CARNE EN UN BARRIO CON VENDEDOR vuelve al carrito');
    /* HASTA EL 30/9/2026 ESTE BLOQUE EXIGIA LO CONTRARIO, y era el que cuidaba
       la plata: los pedidos de un barrio con vendedor van a la hoja `Red`, que
       no tenia columnas de kilos — la carne entraba, el total salia bien, y los
       kilos no caian en ningun lado, sin error y sin log.

       Backend le agrego las cinco columnas y `Pesaje` (74 -> 80) ese dia, asi
       que ahora la carne SI se vende ahi y lo correcto es que la copia la
       devuelva. La regla de fondo —la copia solo devuelve lo que esa zona
       vende— la sigue midiendo D1, con un producto que ya no existe. */
    const conCarne = { t: MARTES - 60000, z: 'pilar', c: {}, k: {}, p: {} };
    conCarne.p['ENT-01'] = { abbr: 'CEn', id: 0, kg: 1.163, precio: 30238, nombre: 'Carne Entraña' };
    const carneId = JSON.parse(await ev('(function () { var p = PRODUCTOS.filter(function (x) { return x.abbr === "CEn"; })[0];' +
      ' return JSON.stringify(p ? p.id : null); })()'));
    conCarne.p['ENT-01'].id = carneId;
    conCarne.c[armado.a] = 1;
    await abrir({
      maleu_zone: 'pilar',
      maleu_pilar_zona: { val: 'Tortugas y alrededores', nombre: 'Tortugas y alrededores', ts: 1 },
      maleu_pilar_barrio: { val: 'El Lucero', nombre: 'El Lucero', ts: 1 },
      maleu_carrito_v1: conCarne,
    });
    await listos();
    const d2 = JSON.parse(await ev(LEER));
    chk(d2.zona === 'pilar', 'CONTROL: entro a Pilar', 'zona ' + d2.zona);
    chk(await ev('_pilarBarrioIsRed() === true'),
        'CONTROL: y a un barrio que atiende un vendedor');
    chk(d2.piezas.length === 1, 'la pieza de carne volvio al carrito, con su peso y su precio',
        JSON.stringify(d2.piezas));
    chk(Number(d2.cart[armado.a]) === 1, 'y lo demas tambien', JSON.stringify(d2.cart));

    /* ═══════════ E · el que todavia no eligio zona ═══════════ */
    titulo('E · el cliente nuevo, sin zona elegida, no deja nada guardado');
    await abrir({});
    await listos();
    const e1 = JSON.parse(await ev(LEER));
    chk(e1.provisoria === true, 'CONTROL: la zona es provisoria (no eligio nada)');
    chk(!e1.hayCopia, 'y no hay copia del carrito en el navegador');
    /* Con la zona provisoria el carrito esta siempre vacio —la puerta del primer
       "+ Agregar" (`_pedirZonaAntes`) lo impide—, asi que para medir ESA defensa
       y no la del carrito vacio hay que meterle algo a la fuerza. Cuida de un
       camino futuro que agregue antes de preguntar la zona: ahi la copia diria
       que el pedido es de Estancias, que es solo la zona provisoria, y el que
       vuelve entraria con un carrito de una zona que nunca eligio. */
    const forzado = JSON.parse(await ev('(function () {' +
      'cart[getActiveProducts()[0].id] = 2; updateUI();' +
      'var c = null; try { c = localStorage.getItem("maleu_carrito_v1"); } catch (e) {}' +
      'return JSON.stringify({ count: cartCount(), copia: c, provisoria: !!zonaProvisoria });' +
      '})()'));
    chk(forzado.count === 2 && forzado.provisoria === true,
        'CONTROL: con algo en el carrito y la zona todavia provisoria', 'count ' + forzado.count);
    chk(!forzado.copia, 'sigue sin guardarse nada: la zona no la eligio el cliente',
        String(forzado.copia).slice(0, 60));

    /* ═══════════ F · al vaciarse, la copia se borra ═══════════ */
    titulo('F · vaciar el carrito borra la copia');
    await abrir({ maleu_zone: 'estancias' });
    await listos();
    await ev('addToCart(' + JSON.stringify(armado.a) + ');');
    await dormir(300);
    const f1 = JSON.parse(await ev(LEER));
    chk(f1.hayCopia, 'CONTROL: con algo adentro la copia existe');
    await ev('modifyCart(' + JSON.stringify(armado.a) + ', -1);');
    await dormir(300);
    const f2 = JSON.parse(await ev(LEER));
    chk(f2.count === 0 && !f2.hayCopia,
        'con el carrito vacio la copia se va (es el camino del pedido confirmado)',
        'count ' + f2.count + ' · copia ' + f2.hayCopia);

    /* ═══════════ G · una copia rota ═══════════ */
    titulo('G · una copia rota no rompe la tienda');
    await abrir({ maleu_zone: 'estancias', maleu_carrito_v1: 'esto no es json {{{' });
    await listos();
    const g1 = JSON.parse(await ev(LEER));
    chk(g1.count === 0 && g1.zona === 'estancias',
        'la tienda arranca normal, con el carrito vacio', 'count ' + g1.count);
    const errores = await ev('(function () { return (window.__errores || []).length; })()');
    chk(Number(errores) === 0 || errores === undefined, 'sin excepciones', String(errores));

    /* ═══════════ H · cero POST ═══════════ */
    titulo('H · nada le escribio al ERP');
    const posts = await ev('JSON.stringify(window.__posts || [])');
    chk(JSON.parse(posts).length === 0, 'cero POST desde la pagina', posts.slice(0, 80));
    chk(escapados.length === 0, 'cero POST escapados por CDP', escapados.join(' · ').slice(0, 90));

  } catch (e) {
    mal++;
    console.log('\n' + RED + 'se corto: ' + RST + e.message);
  } finally {
    try { await new Promise((r) => setTimeout(r, 200)); } catch (e) {}
    try { proc.kill(); } catch (e) {}
    srv.close();
  }

  console.log('\n' + (mal ? RED : VER) + bien + ' ok · ' + mal + ' mal' + RST + '\n');
  process.exit(mal ? 1 : 0);
}

main();
