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

/* Rufo con Manzanares es el caso que planteo Tadeo, con nombre y apellido.

   LOS ALIAS VAN CARGADOS a proposito: los tres vendedores reales tienen el suyo
   en la col "Alias MP" de la hoja Vendedores, y con el fixture en '' el bug que
   el 30/9/2026 se vino a cerrar —mostrarle al cliente el alias personal del
   vendedor en vez de maleump/maleubru— no seria reproducible. Son inventados:
   este repo es publico. */
const VENDEDORES = { vendedores: [
  { nombre: 'Rufo', wa: '5491100000003', alias: 'alias.rufo.prueba',
    barrios: ['Manzanares', 'San Francisco', 'La Escondida', 'Manzanares Chico', 'Cerrillos', 'CUBA Fátima'] },
  { nombre: 'Marcos', wa: '5491100000001', alias: 'alias.marcos.prueba',
    barrios: ['Tortugas y alrededores', 'El Lucero', 'Los Tacos', 'Villa Bertha', 'Azzurra'] },
  /* EL CUARTO VENDEDOR: su zona NO esta en BARRIOS_PILAR_MODAL, que es la
     situacion de cualquier vendedor que arranca — entra a la hoja `Vendedores` y
     nadie toca el codigo. El nombre va generico a proposito: el caso es "un
     vendedor nuevo", no una persona, y asi el test no envejece. */
  { nombre: 'Vendedor Nuevo', wa: '5491100000004', alias: 'alias.nuevo.prueba',
    barrios: ['Zona Nueva', 'Barrio Nuevo Uno', 'Barrio Nuevo Dos'] },
  /* EL VENDEDOR DE UNA REGION DONDE MALEU NO ENTREGA (30/9/2026). Es el caso de
     Tigre: su zona SI esta escrita en `BARRIOS_PILAR_MODAL`, pero si el no esta
     en la planilla no hay quien entregue ahi — y ahi la tienda tiene que
     esconder la zona entera en vez de mandar el pedido a la hoja Pilar.
     El primer barrio es la zona canonica, igual que en la planilla. */
  { nombre: 'Vendedor Region', wa: '5491100000005', alias: 'alias.region.prueba',
    barrios: ['Santa Bárbara', 'Altamira', 'Rincón de Milberg', 'Talar del Lago I', 'Virazón'] },
] };

/* El premio de la ruleta, como lo emite Backend desde el 24/9/2026:
   `RULETA-XXXX`, tipo PCT, 15%, **scope TODO y `stack: false`**.

   El `stack:false` no es un detalle tecnico: Tadeo subio el premio de 10% a 15%
   JUSTAMENTE para que NO se sume al 10% de efectivo. Asi el premio siempre vale
   mas que el descuento que esa persona ya tenia, y el techo queda en 15% en vez
   de 25%. Verificado en produccion por Backend: PCT 15 · Scope TODO · Stack No.

   `RUL-OK01` es el formato viejo, que tiene que seguir entrando. `RUL-TRUCHO`
   no lo valida el backend. */
const CUPON_OK = { ok: true, codigo: 'RUL-OK01', tipo: 'PCT', valor: 15, scope: 'TODO',
                   mensaje: '15% en tu primera compra', stack: false, minimo: 0 };
const CUPON_RULETA = { ok: true, codigo: 'RULETA-OK01', tipo: 'PCT', valor: 15, scope: 'TODO',
                       mensaje: '15% en tu primera compra', stack: false, minimo: 0 };

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
  /* `&demoraVend=` retrasa SOLO esta respuesta. Es la unica forma de medir la
     ventana en que `barrioToVendedor` todavia esta vacio: sin demora contesta al
     instante y esa ventana no existe en el test, pero en produccion dura los
     segundos que tarda Apps Script. */
  '  if (u.indexOf("action=vendedores") >= 0) {' +
  '    var dv = /[?&]demoraVend=(\\d+)/.exec(location.search);' +
  '    var rv = ' + JSON.stringify(VENDEDORES) + ';' +
  '    return dv ? new Promise(function (ok) { setTimeout(function () { ok(json(rv)); }, +dv[1]); }) : json(rv);' +
  '  }' +
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

    /* En Estancias, con efectivo, NO se suman: el cupon viene sin `stack`, asi
       que el 10% se calcula sobre lo que el cupon no cubre — y con scope TODO no
       queda nada. El cliente se lleva 15% y no 25%, que es lo que Tadeo decidio.
       Lo que la tienda NO puede hacer es prometerle el 10% igual. */
    await abrir({ maleu_zone: 'estancias' }, '&cupon=RULETA-OK01');
    await esperar('!!appliedCoupon', 9000);
    await ev('(function () { var p = getActiveProducts().filter(function (x) { return !esPorPeso(x); })[0]; addToCart(String(p.id));' +
      ' var e = document.querySelector("input[name=pago][value=Efectivo]"); if (e) { e.checked = true; e.dispatchEvent(new Event("change", { bubbles: true })); } })()');
    await dormir(500);
    const suma = JSON.parse(await ev('JSON.stringify({ sub: descontableSubtotal(), cupon: getCouponDiscount(),' +
      ' efectivo: getCashDiscount(), ahorroEf: ahorroPorEfectivo(), total: getTotalDiscount(),' +
      ' renglon: (document.querySelector("#cart-discount-row span") || {}).textContent || "",' +
      ' incentivo: (document.getElementById("cart-incentive") || {}).textContent || "" })'));
    chk(suma.cupon === Math.round(suma.sub * 0.15), 'el premio descuenta su 15%', JSON.stringify(suma));
    chk(suma.efectivo === 0 && suma.ahorroEf === 0,
        'y el 10% de efectivo NO se suma: el cupon cubre todo el carrito', JSON.stringify(suma));
    chk(suma.total === suma.cupon, 'el techo queda en 15%, que es lo que se decidio', suma.total + ' de ' + suma.sub);
    chk(!/10% OFF/.test(suma.renglon), 'el renglon del carrito NO nombra un descuento que dio cero', '"' + suma.renglon + '"');

    /* Y antes de elegir como paga, tampoco se le promete. */
    await ev('(function () { var t = document.querySelector("input[name=pago][value=Transferencia]") || document.querySelector("input[name=pago]:not([value=Efectivo])");' +
      ' if (t) { t.checked = true; t.dispatchEvent(new Event("change", { bubbles: true })); } })()');
    await dormir(400);
    const promesa = JSON.parse(await ev('JSON.stringify({ ahorroEf: ahorroPorEfectivo(),' +
      ' hint: getComputedStyle(document.getElementById("pago-hint")).display,' +
      ' incentivo: (document.getElementById("cart-incentive") || {}).textContent || "",' +
      ' promo: getComputedStyle(document.getElementById("promo-bar")).display })'));
    chk(promesa.hint === 'none', 'el cartel "pagando en efectivo tenes 10% OFF" no aparece', JSON.stringify(promesa));
    chk(!/efectivo ten[eé]s 10% OFF/i.test(promesa.incentivo), 'ni el incentivo del carrito lo promete', promesa.incentivo.slice(0, 70));
    chk(promesa.promo === 'none', 'ni la franja de arriba', promesa.promo);

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
    /* Se pide que LO DIGA, no la frase exacta: el texto se reescribio el
       29/9/2026 y un chequeo atado a la redaccion frena el copy sin que la
       plata haya cambiado. */
    chk(/no (aplica|se puede usar)/i.test(red.resumen) && red.resumen.indexOf('RULETA-OK01') >= 0,
        'y se dice por que, nombrando el cupon, en vez de dar cero callado', red.resumen.slice(0, 90));

    /* ── 10. LOS BARRIOS DEL MODAL Y EL ALIAS (30/9/2026) ─────────────
       Tadeo, mirando la lista: "sacá tortugas y alrededores y ayres y
       alrededores. Ayres del Pilar ya está como opción, y deberías agregar
       Tortugas Country". Y: "los ingresos en transferencia pasan por maleump o
       maleubru". */
    console.log('\n' + DIM + '== 10. La lista de barrios ==' + RST);
    await abrir({});
    await ev('(function(){ if (typeof showZoneModal === "function") showZoneModal("chip"); })()');
    await dormir(400);
    const lista = JSON.parse(await ev('(function () {' +
      'var i = document.getElementById("dir-input");' +
      'if (i) { i.value = ""; if (typeof dirBuscar === "function") dirBuscar(); }' +
      'var ops = [].slice.call(document.querySelectorAll("#dir-lista .dir-op"));' +
      'return JSON.stringify(ops.map(function (o) {' +
      '  var t = o.querySelector(".dir-op-nom") || o;' +
      '  return t.textContent.replace(/[\\s\\u00a0]+/g, " ").trim(); }));' +
      '})()'));
    const hay = (txt) => lista.some(function (x) { return x.indexOf(txt) === 0; });
    chk(lista.length > 5, 'CONTROL: la lista trae barrios', lista.length + ' opciones');
    chk(!hay('Tortugas y alrededores'), 'NO ofrece "Tortugas y alrededores": no es un barrio, es nuestra zona');
    chk(!hay('Ayres y alrededores'), 'NO ofrece "Ayres y alrededores", por lo mismo');
    chk(hay('Tortugas Country'), 'SI ofrece "Tortugas Country"');
    chk(hay('Ayres del Pilar'), 'y "Ayres del Pilar", que ya estaba');
    chk(hay('Manzanares'), 'y "Manzanares", que es un barrio de verdad aunque se llame como su zona');

    console.log('\n' + DIM + '== 10b. Tortugas Country: en el codigo, NO en la planilla ==' + RST);
    /* El caso real del 30/9: el barrio se agrego a BARRIOS_PILAR_MODAL y la col
       "Barrios" de la hoja Vendedores todavia no lo tenia. Sin el respaldo por
       zona de `_vendedorDeBarrio`, la pantalla decia "lo atiende Marcos"
       (viernes, sin carne, envio $3.000) y el pedido se iba a la hoja Pilar: la
       venta de Marcos, cobrada por nosotros, sin que nadie se entere. */
    const enPlanilla = await ev('!!barrioToVendedor["tortugas country"]');
    chk(enPlanilla === false,
        'CONTROL: la planilla simulada NO conoce "Tortugas Country"');
    /* Se elige por el buscador, como una persona: escribir y tocar el resultado.
       Esta red no tenia helper para eso porque sembraba el barrio en el
       localStorage — y aca lo que se quiere medir es justamente el camino del
       buscador, que es por donde entra un barrio que la planilla no conoce. */
    await ev('(function(){ var i = document.getElementById("dir-input");' +
             ' if (i) { i.value = "Tortugas Country"; if (typeof dirBuscar === "function") dirBuscar(); } })()');
    await dormir(300);
    const tocoTC = await ev('(function(){ var o = document.querySelector("#dir-lista .dir-op");' +
                            ' if (!o) return false; o.click(); return true; })()');
    await dormir(900);
    chk(tocoTC === true, 'CONTROL: se pudo elegir "Tortugas Country" en el buscador');
    const tc = await estado();
    chk(tc.esRed === true, 'igual lo atiende un vendedor', JSON.stringify({ esRed: tc.esRed }));
    chk(tc.carne === 0 && tc.envio === 3000, 'con sus reglas: sin carne y envio $3.000',
        JSON.stringify({ carne: tc.carne, envio: tc.envio }));
    /* SE MANDA EL PEDIDO Y SE MIRA A QUE HOJA VA. Preguntarle a
       `_vendedorDeBarrio()` directo no sirve como control: reinyectando el bug
       en el call site de `enviarPedido`, la funcion sigue contestando bien y el
       chequeo daba verde sobre un pedido que se iba a la hoja equivocada. Lo que
       cuida la plata es el canal del POST. */
    await mandar();
    const pedTC = (await ultimoPost()) || {};
    chk(pedTC.canal === 'Red',
        'y su PEDIDO se va a la hoja Red, no a Pilar', 'canal: ' + (pedTC.canal || 'ninguno'));
    chk(String(pedTC.vendedor || '').indexOf('Marcos') === 0,
        'a nombre de Marcos', 'vendedor: ' + (pedTC.vendedor || '-'));
    chk(pedTC.barrioPrivado === 'Tortugas Country',
        'con el barrio que eligio el cliente, no el nombre de la zona',
        'barrio: ' + (pedTC.barrioPrivado || '-'));

    console.log('\n' + DIM + '== 10c. El alias: siempre el de Maleu ==' + RST);
    /* Con EL LUCERO, que la planilla si conoce. Con "Tortugas Country" el
       desplegable del formulario no tiene esa opcion —se llena desde la
       planilla— y `_barrioPilarTieneVendedor()` devuelve null: el bug viejo no
       se activaba y este bloque daba verde sin medir nada. */
    await abrir({
      maleu_zone: 'pilar',
      maleu_pilar_zona: { val: 'Tortugas y alrededores', nombre: 'Tortugas y alrededores', ts: 1 },
      maleu_pilar_barrio: { val: 'El Lucero', nombre: 'El Lucero', ts: 1 },
    });
    chk(await ev('!!_barrioPilarTieneVendedor()'),
        'CONTROL: el formulario reconoce el barrio como de vendedor');
    await ev('(function(){ var t = document.querySelector("input[name=pago][value=Transferencia]");' +
      ' if (t) { t.checked = true; t.dispatchEvent(new Event("change", {bubbles:true})); } })()');
    await dormir(400);
    const al = JSON.parse(await ev('(function () {' +
      'var caja = document.getElementById("mp-alias");' +
      'var nota = document.getElementById("mp-alias-vendedor-note");' +
      'var vis = function (e) { return !!(e && !e.classList.contains("hidden") && getComputedStyle(e).display !== "none"); };' +
      'return JSON.stringify({ cajaMaleu: vis(caja), txtMaleu: caja ? caja.textContent : "",' +
      '  notaVendedor: vis(nota), alias: ALIAS_MALEU.map(function (c) { return c.alias; }),' +
      '  delVendedor: (barrioToVendedor["el lucero"] || {}).alias || "" });' +
      '})()'));
    chk(al.cajaMaleu === true, 'en un barrio con vendedor se ve la caja de alias de Maleu');
    chk(/maleump/.test(al.txtMaleu) && /maleubru/.test(al.txtMaleu),
        'con maleump y maleubru', al.txtMaleu.replace(/[\s\u00a0]+/g, ' ').slice(0, 70));
    chk(al.delVendedor && al.txtMaleu.indexOf(al.delVendedor) < 0,
        'y NO el alias personal del vendedor', 'el suyo es ' + al.delVendedor);
    chk(al.notaVendedor === false, 'el cartel con el alias del vendedor no se muestra mas');

    /* ── 11. UNA REGION DONDE MALEU NO ENTREGA (30/9/2026) ────────────
       Tadeo cargo los 34 barrios de Tigre de Fede D'Andrea. Esa zona se
       comporta como las de Pilar —hoja Red, viernes, sin carne, envio $3.000—
       con una diferencia que cuesta plata: si su vendedor no esta en la
       planilla, `vendedorMatch` sale null y `enviarPedido` cae en
       `canal: z.canal` = **Pilar**. O sea que la pantalla promete un vendedor y
       el pedido se va a la hoja de Maleu, que tendria que entregar en Nordelta.

       Con una zona de PILAR eso no pasa, porque ahi Maleu entrega de verdad. La
       diferencia la marca `region`, y es lo que este bloque mide. */
    console.log('\n' + DIM + '== 11. Tigre: con su vendedor y sin el ==' + RST);
    await abrir({});
    await ev('(function(){ if (typeof showZoneModal === "function") showZoneModal("chip"); })()');
    await dormir(400);
    const listaTg = () => ev('(function () {' +
      'var i = document.getElementById("dir-input");' +
      'if (i) { i.value = ""; if (typeof dirBuscar === "function") dirBuscar(); }' +
      'return JSON.stringify([].map.call(document.querySelectorAll("#dir-lista .dir-op-nom, #dir-lista .dir-op-nombre"),' +
      '  function (t) { return t.textContent.replace(/[\\s\\u00a0]+/g, " ").trim(); }));' +
      '})()');

    const conFede = JSON.parse(await listaTg());
    const hayTg = (t) => conFede.some(function (x) { return x.indexOf(t) === 0; });
    chk(hayTg('Santa Bárbara') && hayTg('Rincón de Milberg') && hayTg('Virazón'),
        'con su vendedor en la planilla, los barrios de Tigre se ofrecen',
        conFede.length + ' destinos');

    /* El orden alfabetico, que es lo que pidio Tadeo al sumar los 34. */
    const soloNom = conFede.filter(function (n) { return n && !/no encuentro|no est/i.test(n); });
    const nz = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const ordenTg = soloNom.slice().sort(function (a, b) { return nz(a) < nz(b) ? -1 : (nz(a) > nz(b) ? 1 : 0); });
    chk(soloNom.every(function (n, i) { return n === ordenTg[i]; }),
        'y toda la lista va de la A a la Z');

    /* El separador de letra: con 40+ barrios es lo que la hace recorrible. */
    const letras = JSON.parse(await ev('JSON.stringify([].map.call(' +
      'document.querySelectorAll("#dir-lista .dir-letra"), function (h) { return h.textContent.trim(); }))'));
    chk(letras.length >= 5 && letras.join('') === letras.slice().sort().join(''),
        'con separadores de letra, en orden', letras.join(' '));

    /* Y buscando NO van separadores: ahi el orden deja de ser alfabetico
       porque los que EMPIEZAN con lo escrito van primero. */
    await ev('(function(){ var i = document.getElementById("dir-input");' +
      ' i.value = "san"; if (typeof dirBuscar === "function") dirBuscar(); })()');
    await dormir(200);
    const letrasBusc = Number(await ev('document.querySelectorAll("#dir-lista .dir-letra").length'));
    chk(letrasBusc === 0, 'buscando no hay separadores: el orden ya no es alfabetico', String(letrasBusc));

    console.log('\n' + DIM + '   y el pedido de Tigre va a la hoja Red:' + RST);
    await abrir({
      maleu_zone: 'pilar',
      maleu_pilar_zona: { val: 'Santa Bárbara', nombre: 'Santa Bárbara', ts: 1 },
      maleu_pilar_barrio: { val: 'Rincón de Milberg', nombre: 'Rincón de Milberg', ts: 1 },
    });
    const tg = await estado();
    chk(tg.esRed === true && tg.entregaMaleu === false,
        'lo atiende su vendedor, no Maleu', JSON.stringify({ esRed: tg.esRed, maleu: tg.entregaMaleu }));
    chk(tg.carne === 0 && tg.envio === 3000,
        'con las mismas reglas que los demas: sin carne y envio $3.000',
        JSON.stringify({ carne: tg.carne, envio: tg.envio }));
    /* VIERNES Y SABADO (30/9/2026). Tadeo, viendo la tienda: "los de federico
       son entregas viernes y sabados a coordinar". Se lo habian prometido en
       la reunion y era lo unico de esa charla que la tienda no cumplia. */
    chk(tg.dias.indexOf('Viernes') >= 0 && tg.dias.indexOf('Sábado') >= 0,
        'y sus dias: viernes Y sabado', tg.dias.join(', '));
    await mandar();
    const pedTg = await ultimoPost();
    chk(pedTg && pedTg.canal === 'Red',
        'y su PEDIDO se va a la hoja Red, no a Pilar', 'canal: ' + ((pedTg && pedTg.canal) || 'ninguno'));

    /* EL CONTROL DEL SABADO, y es el que importa: el sabado tuvo que entrar a
       `ZONAS.pilar.horarios` para que el calendario supiera que horario decir,
       asi que sin filtro se lo lleva TODA la zona — incluidos los barrios que
       entrega Maleu, donde no repartimos los sabados, y los otros vendedores,
       a los que nadie les prometio un dia nuevo. */
    console.log('\n' + DIM + '   CONTROL: el sabado es solo de el:' + RST);
    await abrir({
      maleu_zone: 'pilar',
      maleu_pilar_zona: { val: 'Tortugas y alrededores', nombre: 'Tortugas y alrededores', ts: 1 },
      maleu_pilar_barrio: { val: 'El Lucero', nombre: 'El Lucero', ts: 1 },
    });
    const otroVend = await estado();
    chk(otroVend.dias.join() === 'Viernes',
        'otro vendedor sigue solo con viernes', otroVend.dias.join(', ') || '(ninguno)');
    await abrir({
      maleu_zone: 'pilar',
      maleu_pilar_zona: { val: '__otro__', nombre: 'Otra zona de Pilar', ts: 1 },
      maleu_pilar_barrio: { val: 'Los Alcanfores', nombre: 'Los Alcanfores', ts: 1 },
    });
    const maleuPil = await estado();
    chk(maleuPil.dias.indexOf('Sábado') === -1 && maleuPil.dias.indexOf('Miércoles') >= 0,
        'y lo que entrega Maleu sigue con miercoles y viernes, sin sabado',
        maleuPil.dias.join(', ') || '(ninguno)');

    console.log('\n' + DIM + '   CONTROL: sin su vendedor, la zona no se ofrece:' + RST);
    /* La copia de la ultima visita SIN el vendedor de Tigre, y la planilla
       demorada: es la ventana real de una primera visita. Si la zona se
       ofreciera ahi, ese pedido se iria a la hoja Pilar. */
    const sinRegion = VENDEDORES.vendedores.filter(function (v) { return v.nombre !== 'Vendedor Region'; });
    await abrir({ maleu_vendedores: { ts: Date.now(), vendedores: sinRegion } }, '&demoraVend=4000');
    await ev('(function(){ if (typeof showZoneModal === "function") showZoneModal("chip"); })()');
    await dormir(400);
    const sinFede = JSON.parse(await listaTg());
    const hayTg2 = (t) => sinFede.some(function (x) { return x.indexOf(t) === 0; });
    chk(!hayTg2('Santa Bárbara') && !hayTg2('Rincón de Milberg'),
        'los barrios de Tigre NO se ofrecen: no hay quien entregue ahi',
        sinFede.length + ' destinos');
    chk(hayTg2('El Lucero') || hayTg2('Manzanares'),
        'CONTROL: los de Pilar SI siguen, o sea que no se escondio todo',
        sinFede.slice(0, 3).join(' | '));

    /* ── 9. UN VENDEDOR NUEVO, QUE SOLO EXISTE EN LA PLANILLA ─────────
       El caso del cuarto vendedor. Su zona no esta escrita en
       BARRIOS_PILAR_MODAL, asi que las defensas 2 y 3 de `_pilarBarrioIsRed()`
       no lo reconocen: la 2 mira la lista del codigo y la 3 su zona canonica
       contra esa misma lista. Queda la 1 (el barrio en `barrioToVendedor`), que
       necesita que la planilla haya contestado — y la 4, la copia. */
    console.log('\n' + DIM + '== 9. Un vendedor nuevo, solo en la hoja Vendedores ==' + RST);
    await abrir({
      maleu_zone: 'pilar',
      maleu_pilar_zona: { val: 'Zona Nueva', nombre: 'Zona Nueva', ts: 1 },
      maleu_pilar_barrio: { val: 'Barrio Nuevo Uno', nombre: 'Barrio Nuevo Uno', ts: 1 },
    });
    const vn = await estado();
    chk(vn.esRed === true, 'su barrio lo atiende EL, no Maleu', JSON.stringify({ esRed: vn.esRed }));
    chk(vn.entregaMaleu === false, 'y por lo tanto no lo entrega Maleu');
    chk(vn.carne === 0, 'sin carne: la hoja Red no tiene columnas de kilos', String(vn.carne));
    chk(vn.dias.length > 0 && vn.dias.every(function (d) { return /Vier/i.test(d); }),
        'solo viernes, como los otros tres', vn.dias.join(' · '));
    chk(vn.envio === 3000, 'y el envio de $3.000, que se queda el vendedor', String(vn.envio));
    const enElCodigo = await ev('BARRIOS_PILAR_MODAL.some(function (b) { return b.val === "Zona Nueva"; })');
    chk(enElCodigo === false,
        'CONTROL: su zona NO esta en BARRIOS_PILAR_MODAL, o sea que esto no lo resuelve la lista del codigo');

    /* LA VENTANA: el cliente que VUELVE, antes de que conteste la planilla.
       `barrioToVendedor` esta vacio hasta que llega `action=vendedores`, y su
       barrio ya viene guardado del localStorage. Sin la copia de la ultima
       visita, ahi se le ofrece carne y miercoles, y su pedido se va a la hoja
       Pilar: la venta del vendedor, cobrada por nosotros. */
    console.log('\n' + DIM + '   la ventana de los primeros segundos (el que vuelve):' + RST);
    nav++;
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?n=' + nav +
      '&demoraVend=4000&semilla=' + encodeURIComponent(JSON.stringify({
        maleu_zone: 'pilar',
        maleu_pilar_zona: { val: 'Zona Nueva', nombre: 'Zona Nueva', ts: 1 },
        maleu_pilar_barrio: { val: 'Barrio Nuevo Uno', nombre: 'Barrio Nuevo Uno', ts: 1 },
        maleu_vendedores: { ts: Date.now(), vendedores: VENDEDORES.vendedores },
      })) });
    await esperar("typeof PRODUCTOS !== 'undefined' && typeof _pilarBarrioIsRed === 'function'", 15000);
    await dormir(400);
    const ventana = JSON.parse(await ev('JSON.stringify({' +
      ' llego: Object.keys(barrioToVendedor || {}).length,' +
      ' esRed: _pilarBarrioIsRed(), entregaMaleu: _pilarEntregaMaleu(),' +
      ' carne: document.querySelectorAll(".carne-card").length })'));
    chk(ventana.llego > 0,
        'la copia de la ultima visita se lee al arrancar', 'barrios conocidos: ' + ventana.llego);
    chk(ventana.esRed === true,
        'y su barrio YA es de vendedor, sin esperar a la planilla', JSON.stringify({ esRed: ventana.esRed }));
    chk(ventana.carne === 0, 'asi que no se le ofrece carne en esa ventana', String(ventana.carne));

    /* EL CONTROL, y sin el los tres de arriba no probarian nada: SIN la copia,
       en esa misma ventana el barrio pasa por "no es de vendedor". Es el agujero
       que la copia cierra, medido en vez de supuesto. */
    console.log('\n' + DIM + '   CONTROL: lo mismo pero SIN la copia guardada:' + RST);
    nav++;
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?n=' + nav +
      '&demoraVend=4000&semilla=' + encodeURIComponent(JSON.stringify({
        maleu_zone: 'pilar',
        maleu_pilar_zona: { val: 'Zona Nueva', nombre: 'Zona Nueva', ts: 1 },
        maleu_pilar_barrio: { val: 'Barrio Nuevo Uno', nombre: 'Barrio Nuevo Uno', ts: 1 },
      })) });
    await esperar("typeof PRODUCTOS !== 'undefined' && typeof _pilarBarrioIsRed === 'function'", 15000);
    await dormir(400);
    const sinCopia = JSON.parse(await ev('JSON.stringify({' +
      ' llego: Object.keys(barrioToVendedor || {}).length, esRed: _pilarBarrioIsRed() })'));
    chk(sinCopia.llego === 0 && sinCopia.esRed === false,
        'sin copia SI se abre el agujero, o sea que lo de arriba lo cierra la copia',
        JSON.stringify(sinCopia));
    /* Y que igual se corrige cuando la planilla contesta: la copia acelera, no
       reemplaza. */
    await esperar('Object.keys(barrioToVendedor || {}).length > 0', 10000);
    await dormir(400);
    const yaLlego = JSON.parse(await ev('JSON.stringify({ esRed: _pilarBarrioIsRed() })'));
    chk(yaLlego.esRed === true,
        'y cuando la planilla contesta se corrige solo', JSON.stringify(yaLlego));

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
