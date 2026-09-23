/**
 * A quien se le asigna una venta: al que trajo al cliente, no al barrio.
 *
 *   node _tools/verificar-vendedor.js [ancho]      (390 por defecto)
 *
 * POR QUE EXISTE. Tadeo, el 24/9/2026, la noche anterior a la ruleta de Los
 * Robles: *"si una persona de Manzanares entra por la ruleta, le va a dirigir
 * el pedido a Rufino, y eso esta mal, porque Rufino no hizo nada para conseguir
 * este cliente. A los 3 vendedores les pagamos lo que les pagamos porque ellos
 * se mueven para conseguir clientes"*.
 *
 * Hasta ese dia la tienda ruteaba por GEOGRAFIA: barrio con vendedor -> hoja
 * Red, y el vendedor cobra su 17% mas los $3.000 del envio, sin importar quien
 * consiguio al cliente. Ahora rutea por QUIEN LO TRAJO.
 *
 * QUE MIRA:
 *   1. Sin marca no cambia NADA: el de Manzanares sigue siendo de Rufo, con su
 *      envio, sus viernes y sin carne. Es la mitad que protege al vendedor, y
 *      va primera a proposito.
 *   2. Con un link nuestro (`?r=lucas`) el mismo cliente, en el mismo barrio,
 *      pasa a la hoja Pilar sin vendedor, con los miercoles y la carne que
 *      entrega Maleu, y el pedido dice de donde salio.
 *   3. Con el cupon de la ruleta VALIDADO POR EL BACKEND, igual.
 *   4. Con un cupon inventado a mano, NO: un codigo tipeado no le puede sacar
 *      un cliente a un vendedor.
 *   5. La marca se queda: el que vuelve la semana siguiente sin el link sigue
 *      siendo nuestro, y un link de otro no le cambia el dueño.
 *
 * El RELOJ va congelado en el lunes 14/9/2026 10:00 AR: sin eso "el miercoles"
 * y "el viernes" cambian de significado segun el dia en que se corra.
 *
 * Todo POST se corta DOS veces, adentro de la pagina y por CDP. Analytics y
 * Meta se bloquean. Con RAIZ=<carpeta> corre contra otra copia de la tienda.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = 8900 + Math.floor(Math.random() * 90);
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

/* Lunes 14/9/2026 10:00 AR = 13:00 UTC. Miercoles 16, viernes 18. */
const LUNES = Date.UTC(2026, 8, 14, 13, 0, 0);

const ABBRS = ['PMu', 'PMa', 'PJyQ', 'PCC', 'PJyM', 'PPM', 'PPJyQ', 'PPCyQ', 'SQB', 'SL', 'SCo',
  'SPyP', 'SJyQ', 'SE', 'SCa', 'ECaC', 'EJyQ', 'ECyQ', 'EV', 'TG', 'TLC', 'TC', 'F', 'TP', 'TJyQ',
  'TCa', 'TV', 'RC', 'RP', 'CCo', 'CEn', 'CLo', 'CPi', 'CVa'];
const STOCK = {};
ABBRS.forEach((a) => { STOCK[a] = { f: 50, p: 50 }; });
const PIEZAS = { CVa: [{ id: 'VAC-01', kg: 1.064 }, { id: 'VAC-02', kg: 1.241 }] };

/* Rufo con Manzanares es el caso que planteo Tadeo, con nombre y apellido. */
const VENDEDORES = { vendedores: [
  { nombre: 'Rufo', wa: '5491100000003', alias: '',
    barrios: ['Manzanares', 'San Francisco', 'La Escondida', 'Manzanares Chico', 'Cerrillos', 'CUBA Fátima'] },
  { nombre: 'Marcos', wa: '5491100000001', alias: '',
    barrios: ['Tortugas y alrededores', 'El Lucero', 'Los Tacos', 'Villa Bertha', 'Azzurra'] },
] };

/* El premio de la ruleta. `RULETA-OK01` es el formato que emite Backend desde
   el 24/9/2026: tipo PCT, 15%, y `stack` para que se SUME al 10% de efectivo
   (hasta 25% en el primer pedido). `RUL-OK01` es el formato viejo, que tiene que
   seguir entrando. `RUL-TRUCHO` no lo valida el backend. */
const CUPON_OK = { ok: true, codigo: 'RUL-OK01', tipo: 'PCT', valor: 15, scope: 'TODO',
                   mensaje: '15% en tu primera compra', stack: true, minimo: 0 };
const CUPON_RULETA = { ok: true, codigo: 'RULETA-OK01', tipo: 'PCT', valor: 15, scope: 'TODO',
                       mensaje: '15% en tu primera compra', stack: true, minimo: 0 };

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

/* La semilla se siembra una vez por navegacion. El numero `n` la distingue, y
   repetirlo a proposito es como se prueba "vuelve la semana que viene": misma
   marca, localStorage intacto. */
const PREP = '(function () {' +
  'var m = /[?&]semilla=([^&]+)/.exec(location.search), nn = /[?&]n=(\\d+)/.exec(location.search);' +
  'if (m && sessionStorage.getItem("__semilla") !== (nn ? nn[1] : "") + m[1]) {' +
  '  sessionStorage.setItem("__semilla", (nn ? nn[1] : "") + m[1]);' +
  '  try { localStorage.clear(); var s = JSON.parse(decodeURIComponent(m[1]));' +
  '    Object.keys(s).forEach(function (k) { localStorage.setItem(k, typeof s[k] === "string" ? s[k] : JSON.stringify(s[k])); }); } catch (e) {}' +
  '}' +
  'var RD = Date; window.__ahora = ' + LUNES + ';' +
  'function FD() {' +
  '  if (!(this instanceof FD)) return new RD(window.__ahora).toString();' +
  '  if (arguments.length === 0) return new RD(window.__ahora);' +
  '  var a = [null].concat([].slice.call(arguments));' +
  '  return new (Function.prototype.bind.apply(RD, a))();' +
  '}' +
  'FD.prototype = RD.prototype; FD.now = function () { return window.__ahora; };' +
  'FD.UTC = RD.UTC; FD.parse = RD.parse; window.Date = FD;' +
  'window.__posts = []; window.__err = [];' +
  'addEventListener("error", function (e) { window.__err.push(String(e.message).slice(0, 120)); });' +
  'navigator.sendBeacon = function (u, d) { window.__posts.push({ beacon: true, body: String(d || "") }); return false; };' +
  'var orig = window.fetch;' +
  'var json = function (o) { return Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { "Content-Type": "application/json" } })); };' +
  'window.fetch = function (url, opts) {' +
  '  var u = String(url);' +
  '  if (opts && String(opts.method || "").toUpperCase() === "POST" && u.indexOf("script.google") >= 0) { window.__posts.push({ body: String(opts.body || "") }); return new Promise(function () {}); }' +
  '  if (u.indexOf("action=stock_full") >= 0) return json(' + JSON.stringify(STOCK) + ');' +
  '  if (u.indexOf("action=piezas_full") >= 0) return json(' + JSON.stringify(PIEZAS) + ');' +
  '  if (u.indexOf("action=vendedores") >= 0) return json(' + JSON.stringify(VENDEDORES) + ');' +
  '  if (u.indexOf("action=validarCupon") >= 0) {' +
  '    if (/RULETA-OK01/.test(u)) return json(' + JSON.stringify(CUPON_RULETA) + ');' +
  '    if (/RUL-OK01/.test(u)) return json(' + JSON.stringify(CUPON_OK) + ');' +
  '    return json({ ok: false, error: "Ese codigo no existe" });' +
  '  }' +
  '  if (u.indexOf("script.google") >= 0) return json({ ok: true });' +
  '  return orig.apply(this, arguments);' +
  '};' +
  '})();';

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-vend-'));
  const puertoCdp = 9200 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'], { stdio: 'ignore' });

  let mal = 0, bien = 0;
  const chk = (ok, t, extra) => {
    ok ? bien++ : mal++;
    console.log('  ' + (ok ? VER + 'ok   ' : RED + 'MAL  ') + RST + t + (extra ? DIM + '  (' + extra + ')' + RST : ''));
  };

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

    /* Manzanares con su sub-barrio, sembrados: lo que se viene a medir es a
       quien se le asigna la venta, no el modal. */
    const SEMILLA_RUFO = {
      maleu_zone: 'pilar',
      maleu_pilar_zona: { val: 'Manzanares', nombre: 'Manzanares', ts: 1 },
      maleu_pilar_barrio: { val: 'San Francisco', nombre: 'San Francisco', ts: 1 },
    };
    let nav = 0;
    const abrir = async (semilla, extra, mismaNav) => {
      if (!mismaNav) nav++;
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?n=' + nav +
        '&semilla=' + encodeURIComponent(JSON.stringify(semilla || {})) + (extra || '') });
      if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000))) {
        throw new Error('la tienda no arranco');
      }
      await esperar('Object.keys(stockMap).length > 5', 12000);
      await esperar('typeof piezasEstado !== "undefined" && piezasEstado !== "cargando"', 12000);
      await esperar('Object.keys(barrioToVendedor || {}).length > 0', 10000);
      await dormir(500);
    };
    const estado = async () => JSON.parse(await ev('JSON.stringify({' +
      ' zona: currentZone, nuestro: _esNuestro(), origen: _origenNuestroTexto(),' +
      ' esRed: _pilarBarrioIsRed(), entregaMaleu: _pilarEntregaMaleu(),' +
      ' envio: getShipping(), carne: document.querySelectorAll(".carne-card").length,' +
      ' dias: [].map.call(document.querySelectorAll("#day-picker .dp-cell.available"), function (b) { return b.getAttribute("data-dia"); })' +
      '        .filter(function (d, i, a) { return a.indexOf(d) === i; })' +
      '})'));
    const ultimoPost = async () => {
      const lista = JSON.parse(await ev('JSON.stringify(window.__posts.filter(function (p) { return !p.beacon; }))'));
      if (!lista.length) return null;
      try { return JSON.parse(lista[lista.length - 1].body); } catch (e) { return null; }
    };
    const mandar = async () => {
      await ev('(function () { var p = getActiveProducts().filter(function (x) { return !esPorPeso(x); })[0]; addToCart(String(p.id)); })()');
      await dormir(300);
      return ev('(async function () {' +
        'var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };' +
        'var c = { "f-nombre": "PRUEBA Vendedor", "f-telefono": "1155038905", "f-lote-pilar": "12" };' +
        'Object.keys(c).forEach(function (id) { var e = document.getElementById(id); if (!e) return; e.value = c[id]; e.dispatchEvent(new Event("change", { bubbles: true })); });' +
        'await dormir(200);' +
        'var d = document.querySelector("#day-picker .dp-cell.available"); if (d) d.click();' +
        'var ef = document.querySelector("input[name=pago][value=Efectivo]"); ef.checked = true; ef.dispatchEvent(new Event("change", { bubbles: true }));' +
        'await dormir(250);' +
        'enviarPedido();' +
        'for (var i = 0; i < 40 && !window.__posts.some(function (p) { return !p.beacon; }); i++) await dormir(100);' +
        'return "ok";' +
        '})()');
    };

    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });

    /* ── 1. SIN MARCA: EL VENDEDOR NO PIERDE NADA ──────────────────── */
    console.log('\n' + DIM + '== Sin marca, el de Manzanares sigue siendo de Rufo ==' + RST);
    await abrir(SEMILLA_RUFO);
    const e1 = await estado();
    chk(e1.zona === 'pilar' && e1.esRed === true,
        'el barrio de Rufo se reconoce como barrio con vendedor (sin esto lo de abajo no mide nada)', JSON.stringify(e1));
    chk(e1.nuestro === false, 'y el cliente NO esta marcado como nuestro');
    chk(e1.envio === 3000, 'el envio es el del vendedor: $3.000', String(e1.envio));
    chk(e1.dias.length === 1 && e1.dias[0] === 'Viernes', 'entrega solo los viernes', e1.dias.join(', '));
    chk(e1.carne === 0, 'y no se ofrece carne: la hoja Red no tiene columnas para guardarla');
    await mandar();
    const p1 = await ultimoPost();
    chk(!!p1 && p1.canal === 'Red', 'el pedido sale a la hoja Red', p1 ? p1.canal : 'sin POST');
    chk(!!p1 && p1.vendedor === 'Rufo', 'con Rufo como vendedor', p1 ? String(p1.vendedor) : '-');
    chk(!!p1 && !p1.origenDetalle, 'y sin origen: a este no lo trajimos nosotros');

    /* ── 2. CON UN LINK NUESTRO ────────────────────────────────────── */
    console.log('\n' + DIM + '== El mismo barrio, pero el cliente lo trajo Lucas ==' + RST);
    await abrir(SEMILLA_RUFO, '&o=evento&d=Los%20Robles&r=lucas');
    const e2 = await estado();
    chk(e2.nuestro === true, 'queda marcado como cliente nuestro');
    chk(/evento/.test(e2.origen) && /Los Robles/.test(e2.origen) && /lucas/.test(e2.origen),
        'con de donde salio, el lugar y quien lo trajo', '"' + e2.origen + '"');
    chk(await ev('!/[?&](o|d|r)=/.test(location.search)'),
        'y los parametros se borran de la barra: el link que comparta no arrastra el origen',
        await ev('location.search'));
    chk(e2.esRed === false && e2.entregaMaleu === true, 'para este pedido NO hay vendedor: lo entrega Maleu', JSON.stringify({ red: e2.esRed, maleu: e2.entregaMaleu }));
    chk(e2.dias.indexOf('Miércoles') >= 0 && e2.dias.indexOf('Viernes') >= 0,
        'con los miercoles y viernes de Maleu', e2.dias.join(', '));
    chk(e2.carne > 0, 'y con la carne, que la hoja Pilar si sabe guardar', e2.carne + ' cortes');
    chk(e2.envio === 5000, 'el envio pasa a ser el de Maleu: $5.000', String(e2.envio));
    await mandar();
    const p2 = await ultimoPost();
    chk(!!p2 && p2.canal === 'Pilar', 'el pedido sale a la hoja Pilar', p2 ? p2.canal : 'sin POST');
    chk(!!p2 && !p2.vendedor, 'sin vendedor: Rufo no cobra un cliente que no consiguio', p2 ? String(p2.vendedor) : '-');
    chk(!!p2 && /lucas/.test(String(p2.origenDetalle || '')),
        'y el pedido dice quien lo trajo', p2 ? String(p2.origenDetalle) : '-');

    /* ── 3. LA MARCA SE QUEDA ──────────────────────────────────────── */
    console.log('\n' + DIM + '== Vuelve la semana siguiente, sin el link ==' + RST);
    await abrir(SEMILLA_RUFO, '&o=evento&d=Los%20Robles&r=lucas', true);
    const e3 = await estado();
    chk(e3.nuestro === true && e3.esRed === false,
        'sigue siendo nuestro sin que el link vuelva a pasar', JSON.stringify({ nuestro: e3.nuestro, red: e3.esRed }));
    /* Y otro link no le cambia el dueño: el primero que lo trajo es el que vale. */
    await ev('_guardarOrigenNuestro({ o: "meta", d: "", r: "joaco", t: Date.now() })');
    chk(/lucas/.test(await ev('_origenNuestroTexto()')),
        'y un link de otro NO le cambia el dueño: vale el primero', '"' + (await ev('_origenNuestroTexto()')) + '"');

    /* ── 4. EL CUPON DE LA RULETA ──────────────────────────────────── */
    console.log('\n' + DIM + '== El cupon de la ruleta, validado por el backend ==' + RST);
    await abrir(SEMILLA_RUFO, '&cupon=RUL-OK01');
    await esperar('!!appliedCoupon', 8000);
    const e4 = await estado();
    chk(await ev('!!appliedCoupon && appliedCoupon.codigo === "RUL-OK01"'), 'el premio queda cargado');
    chk(e4.nuestro === true && /ruleta/.test(e4.origen), 'y marca al cliente como nuestro', '"' + e4.origen + '"');
    chk(e4.esRed === false, 'asi que el pedido ya no es de Rufo');

    /* ── 5. UN CUPON INVENTADO NO ALCANZA ──────────────────────────── */
    console.log('\n' + DIM + '== Un codigo tipeado a mano no le saca un cliente a nadie ==' + RST);
    await abrir(SEMILLA_RUFO, '&cupon=RUL-TRUCHO');
    await dormir(2500);
    const e5 = await estado();
    chk(await ev('!appliedCoupon'), 'el backend lo rechaza y no queda ningun premio');
    chk(e5.nuestro === false, 'no marca nada');
    chk(e5.esRed === true && e5.envio === 3000, 'y el cliente sigue siendo de Rufo', JSON.stringify({ red: e5.esRed, envio: e5.envio }));

    /* ── 6. LAS OTRAS ZONAS NO SE ENTERAN ──────────────────────────── */
    console.log('\n' + DIM + '== Estancias, donde no hay vendedores, no cambia ==' + RST);
    await abrir({ maleu_zone: 'estancias' }, '&o=evento&r=lucas');
    const e6 = await estado();
    chk(e6.zona === 'estancias' && e6.nuestro === true, 'la marca se guarda igual');
    chk(e6.envio === 0, 'y Estancias sigue sin envio, como siempre', String(e6.envio));
    chk(e6.carne > 0, 'y con su carne', e6.carne + ' cortes');

    /* ── 7. EL CUPON DE LA RULETA ──────────────────────────────────── */
    console.log('\n' + DIM + '== El premio de la ruleta: donde vale y donde no ==' + RST);
    /* El formato que emite Backend desde el 24/9/2026. El link solo aceptaba
       `RUL-`, asi que un `RULETA-XXXX` entraba y NO SE APLICABA: ni el
       descuento, ni la marca de "lo trajimos nosotros". */
    await abrir(SEMILLA_RUFO, '&cupon=RULETA-OK01');
    await esperar('!!appliedCoupon', 9000);
    const c1 = JSON.parse(await ev('JSON.stringify({ cod: appliedCoupon && appliedCoupon.codigo,' +
      ' tipo: appliedCoupon && appliedCoupon.tipo, nuestro: _esNuestro(), esRed: _pilarBarrioIsRed(),' +
      ' vale: cuponValeEnEstaZona() })'));
    chk(c1.cod === 'RULETA-OK01' && c1.tipo === 'PCT', 'un cupon RULETA- entra desde el link', JSON.stringify(c1));
    chk(c1.nuestro === true && c1.esRed === false && c1.vale === true,
        'y en el barrio de Rufo vale igual, porque al cliente lo trajimos nosotros', JSON.stringify(c1));
    await ev('(function () { var p = getActiveProducts().filter(function (x) { return !esPorPeso(x); })[0]; addToCart(String(p.id)); })()');
    await dormir(400);
    const desc1 = JSON.parse(await ev('JSON.stringify({ sub: cartTotal(), cupon: getCouponDiscount(), efectivo: getCashDiscount() })'));
    chk(desc1.cupon === Math.round(desc1.sub * 0.15), 'descuenta el 15%', JSON.stringify(desc1));

    /* En Estancias, con efectivo, los dos descuentos se suman: el cupon viene
       con `stack`, asi que el 10% se calcula sobre el subtotal entero. */
    await abrir({ maleu_zone: 'estancias' }, '&cupon=RULETA-OK01');
    await esperar('!!appliedCoupon', 9000);
    await ev('(function () { var p = getActiveProducts().filter(function (x) { return !esPorPeso(x); })[0]; addToCart(String(p.id));' +
      ' var e = document.querySelector("input[name=pago][value=Efectivo]"); if (e) { e.checked = true; e.dispatchEvent(new Event("change", { bubbles: true })); } })()');
    await dormir(500);
    const suma = JSON.parse(await ev('JSON.stringify({ sub: descontableSubtotal(), cupon: getCouponDiscount(),' +
      ' efectivo: getCashDiscount(), total: getTotalDiscount() })'));
    chk(suma.cupon > 0 && suma.efectivo === Math.round(suma.sub * 0.10),
        'en Estancias el 10% de efectivo se calcula sobre el subtotal ENTERO, no sobre lo que queda',
        JSON.stringify(suma));
    chk(suma.total === suma.cupon + suma.efectivo && suma.total === Math.round(suma.sub * 0.25),
        'asi que el premio y el efectivo se suman: 25% en el primer pedido', JSON.stringify(suma));

    /* Y donde atiende un VENDEDOR no vale: esos pedidos van a la hoja Red, que
       va sin descuentos.

       Para llegar a ese estado hay que sacarle la marca de "lo trajimos
       nosotros", y no es un truco del test: es que hoy NO SE PUEDE llegar de
       otra forma. El link siempre marca, y el campo para escribir un cupon a
       mano **no existe en el HTML** — y  quedaron en
        sin markup que los respalde—, asi que el link es la unica puerta,
       que es justo lo que se pidio. La guarda se prueba igual porque es la que
       sostiene la regla el dia que alguien vuelva a poner ese campo. */
    await abrir(SEMILLA_RUFO, '&cupon=RULETA-OK01');
    await esperar('!!appliedCoupon', 9000);
    await ev('(function () { var p = getActiveProducts().filter(function (x) { return !esPorPeso(x); })[0]; addToCart(String(p.id)); })()');
    await dormir(300);
    await ev('localStorage.removeItem("maleu_origen"); updateUI();');
    await dormir(400);
    const red = JSON.parse(await ev('JSON.stringify({ cod: appliedCoupon && appliedCoupon.codigo,' +
      ' esRed: _pilarBarrioIsRed(), vale: cuponValeEnEstaZona(), desc: getCouponDiscount(),' +
      ' resumen: (document.getElementById("form-summary") || {}).textContent || "" })'));
    chk(red.cod === 'RULETA-OK01' && red.esRed === true, 'sin la marca, el barrio vuelve a ser el de Rufo con el cupon cargado', JSON.stringify({ cod: red.cod, red: red.esRed }));
    chk(red.vale === false && red.desc === 0, 'pero NO descuenta: Red va sin descuentos', JSON.stringify({ vale: red.vale, desc: red.desc }));
    chk(/no se puede usar/i.test(red.resumen), 'y se dice por que, en vez de dar cero callado', red.resumen.slice(0, 90));

    /* ── 8. NADA SALIO ─────────────────────────────────────────────── */
    console.log('\n' + DIM + '== Nada salio hacia afuera ==' + RST);
    chk(escapados.length === 0, 'ningun POST escapo por CDP', escapados.join(' | ') || '0');
    const errs = JSON.parse(await ev('JSON.stringify(window.__err || [])'));
    chk(errs.length === 0, 'y ningun error de JS', errs.join(' | ') || '0');

    console.log('\n' + (mal ? RED : VER) + bien + ' ok · ' + mal + ' mal' + RST + DIM + '  (' + ANCHO + 'px)' + RST);
  } catch (e) {
    console.log('\n' + RED + 'CORTADO: ' + e.message + RST);
    mal++;
  } finally {
    try { proc.kill(); } catch (e) {}
    srv.close();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  process.exit(mal ? 1 : 0);
}

main();
