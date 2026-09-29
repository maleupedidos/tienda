/**
 * El checkout en tres pasos: tus datos -> pago -> entrega.
 *
 *   node _tools/verificar-checkout.js [ancho]      (390 por defecto)
 *
 * POR QUE EXISTE. Tadeo, el 29/9/2026: *"la etapa de completar sus datos,
 * despues la parte de pago, despues la parte de dia de entrega, y un boton de
 * Realizar Compra que se vaya como cargando hasta llegar a toda la barra"*.
 * Hasta ese dia el formulario era UNA pantalla larga con todo junto.
 *
 * LO QUE DE VERDAD VIENE A CUIDAR, y es el bloque D: que la validacion de los
 * pasos y la de `enviarPedido` frenen LOS MISMOS CAMPOS. Son dos listas
 * escritas por separado —`enviarPedido` no se toco, sigue siendo la ultima
 * puerta— y este repo ya sabe como termina eso: dos formas de hacer lo mismo
 * se despegan. Aca se vacia cada campo obligatorio de a uno y se exige que
 * LAS DOS lo frenen. El dia que alguien agregue un campo a una sola, esto lo
 * dice.
 *
 * QUE MAS MIRA:
 *   A. un solo paso a la vista, el indicador marcando cual, y el boton de
 *      comprar SOLO en el ultimo (si se ve desde el 1, no hay pasos).
 *   B. "Continuar" frena lo incompleto, marca los errores y deja el foco.
 *   C. volver no pierde lo escrito, y no se puede saltar a un paso que
 *      todavia no se alcanzo.
 *   E. si `enviarPedido` frena por un campo de OTRO paso, lleva a ese paso.
 *      Sin esto se le hace scroll a un display:none y el cliente ve el
 *      formulario quieto, sin ninguna pista de que le falta algo.
 *   F. el que ya compro no vuelve a ver la pantalla de sus datos.
 *   G. el total se ve en los tres pasos y sigue al medio de pago.
 *   H. la barra NO llega al final sola: se frena cerca del 90 y el ultimo
 *      tramo lo completa la confirmacion. Una barra que se llena por su
 *      cuenta y despues espera es la version bonita del bug que costo el
 *      pedido de $84.600 el 10/9.
 *
 * El RELOJ va congelado en el lunes 14/9/2026 10:00 AR. Todo POST se corta dos
 * veces, adentro de la pagina y por CDP; Analytics y Meta se bloquean, que si
 * no cada corrida le suma visitas falsas a las metricas reales. Con
 * RAIZ=<carpeta> corre contra otra copia de la tienda.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = 8700 + Math.floor(Math.random() * 90);
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

/* Lunes 14/9/2026 10:00 AR = 13:00 UTC. */
const LUNES = Date.UTC(2026, 8, 14, 13, 0, 0);

const ABBRS = ['PMu', 'PMa', 'PJyQ', 'PCC', 'PJyM', 'PPM', 'PPJyQ', 'PPCyQ', 'SQB', 'SL', 'SCo',
  'SPyP', 'SJyQ', 'SE', 'SCa', 'ECaC', 'EJyQ', 'ECyQ', 'EV', 'TG', 'TLC', 'TC', 'F', 'TP', 'TJyQ',
  'TCa', 'TV', 'RC', 'RP', 'CCo', 'CEn', 'CLo', 'CPi', 'CVa'];
const STOCK = {};
ABBRS.forEach((a) => { STOCK[a] = { f: 50, p: 50 }; });
const PIEZAS = {};
const VENDEDORES = { vendedores: [] };

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
  '  if (u.indexOf("script.google") >= 0) return json({ ok: true });' +
  '  return orig.apply(this, arguments);' +
  '};' +
  '})();';

/* Completar el paso 1 de Estancias. Los eventos van como los dispara una
   persona (change + blur) para que corran los mismos manejadores. */
const LLENAR_DATOS = '(function () {' +
  'var set = function (id, v) { var e = document.getElementById(id); if (!e) return;' +
  '  e.value = v; e.dispatchEvent(new Event("change", { bubbles: true }));' +
  '  e.dispatchEvent(new Event("blur", { bubbles: true })); };' +
  'set("f-nombre", "Prueba Checkout");' +
  'set("f-barrio-privado", "Estancias del Pilar");' +
  'var sub = document.getElementById("f-barrio");' +
  'if (sub) { var o = Array.prototype.filter.call(sub.options, function (x) { return x.value && !x.hidden; })[0];' +
  '  if (o) { sub.value = o.value; sub.dispatchEvent(new Event("change", { bubbles: true })); } }' +
  'set("f-lote", "289"); set("f-telefono", "1155667788");' +
'})()';

/* Los campos obligatorios de Estancias, con como se vacian. El bloque D los
   recorre de a uno. */
const OBLIGATORIOS = [
  { campo: 'f-nombre', paso: 1, err: 'err-nombre' },
  { campo: 'f-barrio-privado', paso: 1, err: 'err-barrio-privado' },
  { campo: 'f-lote', paso: 1, err: 'err-lote' },
  { campo: 'f-telefono', paso: 1, err: 'err-telefono' },
];

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-checkout-'));
  const puertoCdp = 9400 + Math.floor(Math.random() * 90);
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
    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });

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

    const SEMILLA = { maleu_zone: 'estancias' };
    let nav = 0;
    const abrir = async (semilla, mismaNav) => {
      if (!mismaNav) nav++;
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?n=' + nav +
        '&semilla=' + encodeURIComponent(JSON.stringify(semilla || SEMILLA)) });
      if (!(await esperar("typeof PRODUCTOS !== 'undefined' && typeof coPaso !== 'undefined'", 15000))) {
        throw new Error('la tienda no arranco');
      }
      await esperar('Object.keys(stockMap).length > 5', 12000);
      await dormir(400);
    };
    /* Sumar algo y abrir el formulario, que es de donde arranca todo esto. */
    const alFormulario = async () => {
      await ev('(function () { var p = getActiveProducts().filter(function (x) { return !esPorPeso(x); })[0]; addToCart(String(p.id)); })()');
      await dormir(200);
      await ev('expandForm()');
      await dormir(400);
    };
    const pasos = async () => JSON.parse(await ev('JSON.stringify({' +
      ' paso: coPaso,' +
      ' visibles: [].filter.call(document.querySelectorAll(".co-paso"), function (p) { return !p.hidden; })' +
      '            .map(function (p) { return p.getAttribute("data-co-paso"); }),' +
      ' puntos: [].map.call(document.querySelectorAll(".co-punto"), function (p) {' +
      '            return p.classList.contains("activo") ? "activo" : (p.classList.contains("hecho") ? "hecho" : ""); }),' +
      ' volver: !document.getElementById("co-volver").hidden,' +
      ' seguir: !document.getElementById("co-seguir").hidden,' +
      ' comprar: !document.getElementById("whatsapp-cta-wrap").hidden,' +
      ' total: (document.getElementById("co-total").textContent || "").trim()' +
      '})'));

    /* ── A. UN SOLO PASO A LA VISTA ──────────────────────────────── */
    console.log('\n' + DIM + '== El formulario abre en el paso 1, y solo se ve ese (' + ANCHO + 'px) ==' + RST);
    await abrir();
    await alFormulario();
    let e = await pasos();
    chk(e.paso === 1, 'abre en el paso 1', 'paso ' + e.paso);
    chk(e.visibles.length === 1 && e.visibles[0] === '1', 'un solo paso a la vista', e.visibles.join(','));
    chk(e.puntos[0] === 'activo' && !e.puntos[1] && !e.puntos[2],
        'el indicador marca el 1 y ninguno como hecho', e.puntos.join('|'));
    chk(e.comprar === false, 'el boton de comprar NO se ve en el paso 1');
    chk(e.volver === false, 'ni "Volver": no hay a donde');
    chk(e.seguir === true, 'y si se ve "Continuar"');
    chk(/Total/.test(e.total) && /\$/.test(e.total), 'el total se ve desde el paso 1', e.total);

    /* ── B. CONTINUAR FRENA LO INCOMPLETO ────────────────────────── */
    console.log('\n' + DIM + '== "Continuar" frena lo incompleto y deja el foco donde falta ==' + RST);
    await ev('coSeguir()');
    await dormir(200);
    e = await pasos();
    chk(e.paso === 1, 'sin completar nada, no avanza');
    const errs = await ev('[].map.call(document.querySelectorAll(".field-error.visible"), function (x) { return x.id; }).join(",")');
    chk(/err-nombre/.test(errs) && /err-telefono/.test(errs) && /err-lote/.test(errs),
        'y avisa cuales faltan', errs);
    chk(await ev('document.activeElement && document.activeElement.id') === 'f-nombre',
        'el foco queda en el primero que falta');

    await ev(LLENAR_DATOS);
    await ev('coSeguir()');
    await dormir(300);
    e = await pasos();
    chk(e.paso === 2, 'con los datos completos pasa al 2', 'paso ' + e.paso);
    chk(e.puntos[0] === 'hecho' && e.puntos[1] === 'activo',
        'el 1 queda como hecho y el 2 activo', e.puntos.join('|'));
    chk(e.volver === true, 'y ahora si se puede volver');
    chk(e.comprar === false, 'el boton de comprar sigue sin verse');

    await ev('coSeguir()');
    await dormir(200);
    e = await pasos();
    chk(e.paso === 2, 'sin elegir pago tampoco avanza');
    chk(await ev('document.getElementById("err-pago").classList.contains("visible")'),
        'y lo dice');

    await ev('document.getElementById("pago-ef").click(); coSeguir()');
    await dormir(300);
    e = await pasos();
    chk(e.paso === 3, 'con el pago elegido pasa al 3', 'paso ' + e.paso);
    chk(e.comprar === true, 'RECIEN AHI aparece el boton de comprar');
    chk(e.seguir === false, 'y se va "Continuar": el que manda es el de comprar');
    chk(await ev('document.querySelectorAll("#day-picker .dp-cell.available").length > 0'),
        'el calendario esta a la vista en el paso 3');

    /* ── G. EL TOTAL SIGUE AL MEDIO DE PAGO ──────────────────────── */
    console.log('\n' + DIM + '== El total se ve en los tres pasos y sigue al medio de pago ==' + RST);
    const conEfectivo = (await pasos()).total;
    await ev('document.getElementById("pago-tr").click()');
    await dormir(300);
    const conTransfer = (await pasos()).total;
    chk(conEfectivo !== conTransfer,
        'el total cambia al pasar de efectivo a transferencia', conEfectivo + ' -> ' + conTransfer);
    const nEf = Number(String(conEfectivo).replace(/\D/g, ''));
    const nTr = Number(String(conTransfer).replace(/\D/g, ''));
    chk(nEf < nTr, 'y en efectivo es MENOS: el 10% esta contado', nEf + ' < ' + nTr);
    const propio = await ev('(function () {' +
      ' var t = Math.round(cartTotal() - getTotalDiscount() + getShipping() - getSaldoAFavor());' +
      ' return String(t); })()');
    chk(String(nTr) === String(propio),
        'y sale de la misma cuenta que el carrito y el WhatsApp', propio);

    /* ── C. VOLVER NO PIERDE NADA ────────────────────────────────── */
    console.log('\n' + DIM + '== Volver no pierde lo escrito, y no se puede saltear un paso ==' + RST);
    await ev('coVolver(); coVolver()');
    await dormir(300);
    e = await pasos();
    chk(e.paso === 1, 'dos veces "Volver" lleva al paso 1', 'paso ' + e.paso);
    chk(await ev('document.getElementById("f-nombre").value') === 'Prueba Checkout',
        'y el nombre sigue escrito');
    chk(await ev('document.getElementById("f-lote").value') === '289', 'y el lote tambien');
    chk(await ev('!!document.querySelector("input[name=pago]:checked")'),
        'y el medio de pago sigue elegido');

    await ev('(function () { var p = document.querySelector(".co-punto[data-co-punto=\\"3\\"]"); p.click(); })()');
    await dormir(200);
    chk((await pasos()).paso === 1,
        'tocar el punto 3 desde el 1 NO salta: ese paso todavia no se alcanzo');
    await ev('coSeguir(); coSeguir()');
    await dormir(300);
    await ev('(function () { var p = document.querySelector(".co-punto[data-co-punto=\\"1\\"]"); p.click(); })()');
    await dormir(200);
    chk((await pasos()).paso === 1, 'y tocar el punto 1, que si esta hecho, vuelve a el');

    /* ── D. LAS DOS VALIDACIONES FRENAN LOS MISMOS CAMPOS ────────── */
    console.log('\n' + DIM + '== Los pasos y enviarPedido frenan LOS MISMOS campos ==' + RST);
    for (const o of OBLIGATORIOS) {
      await ev(LLENAR_DATOS);
      await ev('document.getElementById(' + JSON.stringify(o.campo) + ').value = ""');
      const porElPaso = await ev('!!_coFaltaEnPaso(' + o.paso + ', true)');
      const antes = await ev('window.__posts.length');
      await ev('enviarPedido()');
      await dormir(250);
      const porElEnvio = (await ev('window.__posts.length')) === antes;
      chk(porElPaso && porElEnvio,
          'sin ' + o.campo + ': lo frenan las dos',
          'paso=' + porElPaso + ' envio=' + porElEnvio);
    }
    /* El control: con TODO completo, ninguna de las dos frena. Sin esto, una
       validacion rota que diga "falta" siempre pasaria los cuatro de arriba. */
    await ev(LLENAR_DATOS);
    chk(!(await ev('!!_coFaltaEnPaso(1, true)')),
        'CONTROL: con todo completo el paso 1 no frena nada');

    /* ── E. ENVIARPEDIDO LLEVA AL PASO ESCONDIDO ─────────────────── */
    console.log('\n' + DIM + '== Si falta algo de otro paso, enviarPedido lleva a ese paso ==' + RST);
    await ev(LLENAR_DATOS);
    await ev('coSeguir(); document.getElementById("pago-ef").click(); coSeguir()');
    await dormir(300);
    await ev('(function () { var c = document.querySelector("#day-picker .dp-cell.available"); if (c) c.click(); })()');
    await dormir(300);
    chk((await pasos()).paso === 3, 'estamos en el paso 3, con el dia elegido');
    await ev('document.getElementById("f-nombre").value = ""');
    const antesE = await ev('window.__posts.length');
    await ev('enviarPedido()');
    await dormir(400);
    e = await pasos();
    chk((await ev('window.__posts.length')) === antesE, 'sin nombre no manda nada');
    chk(e.paso === 1, 'y LLEVA al paso 1, donde vive el campo que falta', 'paso ' + e.paso);
    chk(await ev('document.getElementById("err-nombre").classList.contains("visible")'),
        'con el error marcado');
    chk(await ev('!document.querySelector(".co-paso[data-co-paso=\\"1\\"]").hidden'),
        'y ese paso esta a la vista, no escondido');

    /* ── F. EL QUE VUELVE ARRANCA EN EL PAGO ─────────────────────── */
    console.log('\n' + DIM + '== El que ya compro no vuelve a ver la pantalla de sus datos ==' + RST);
    await abrir({
      maleu_zone: 'estancias',
      /* La clave lleva la zona adentro: asi la escribe guardarDatosCliente. */
      maleu_cliente_estancias: { nombre: 'Ana Volvio', telefono: '1155667788', zone: 'estancias',
                       barrioPrivado: 'Estancias del Pilar', barrio: 'Champagnat Alto', lote: '77' },
    });
    await alFormulario();
    e = await pasos();
    chk(e.paso === 2, 'con los datos guardados arranca en el paso 2: el pago', 'paso ' + e.paso);
    chk(e.puntos[0] === 'hecho', 'y el paso 1 ya figura hecho', e.puntos.join('|'));
    chk(e.volver === true, 'pero puede volver a revisarlos');
    await ev('coVolver()');
    await dormir(200);
    chk(await ev('document.getElementById("f-nombre").value') === 'Ana Volvio',
        'y ahi estan sus datos, cargados solos');

    /* ── J. EL CIERRE EN LA TIENDA, CON `?cierre=1` ──────────────────
       El interruptor esta apagado para todo el mundo. `?cierre=1` lo prende
       solo para quien tenga el link, que es como Tadeo pudo ver el flujo
       nuevo antes de prenderlo. El dia que se prenda, este bloque pasa a
       correr sin el parametro y el parametro se borra. */
    console.log('\n' + DIM + '== Con ?cierre=1 el pedido termina en la tienda ==' + RST);
    chk(await ev('CIERRE_EN_LA_TIENDA === false'),
        'CONTROL: sin el parametro el interruptor esta apagado');
    const btnWa = await ev('JSON.stringify({ txt: document.getElementById("btn-final").textContent.trim(),' +
      ' logo: !!document.getElementById("btn-final").querySelector("svg"),' +
      ' cls: document.getElementById("btn-final").className })');
    chk(/WhatsApp/.test(btnWa) && /"logo":true/.test(btnWa),
        'y el boton sigue siendo el de WhatsApp, con su logo');

    nav++;
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?cierre=1&n=' + nav +
      '&semilla=' + encodeURIComponent(JSON.stringify(SEMILLA)) });
    await esperar("typeof PRODUCTOS !== 'undefined' && typeof coPaso !== 'undefined'", 15000);
    await esperar('Object.keys(stockMap).length > 5', 12000);
    await dormir(400);
    chk(await ev('CIERRE_EN_LA_TIENDA === true'), 'con ?cierre=1 el interruptor se prende');
    const btnCi = JSON.parse(await ev('JSON.stringify({ txt: document.getElementById("btn-final").textContent.trim(),' +
      ' logo: !!document.getElementById("btn-final").querySelector("svg"),' +
      ' verde: getComputedStyle(document.getElementById("btn-final")).backgroundColor,' +
      ' nota: document.getElementById("form-note").textContent })'));
    chk(!/WhatsApp/.test(btnCi.txt) && /compra/i.test(btnCi.txt),
        'el boton deja de ser de WhatsApp', '"' + btnCi.txt + '"');
    chk(btnCi.logo === false, 'y se va el logo: el pedido ya no se manda por ahi');
    chk(!/37, 211, 102/.test(btnCi.verde), 'ni el verde de WhatsApp', btnCi.verde);
    chk(/confirmaci/i.test(btnCi.nota) && !/te llevamos a WhatsApp/i.test(btnCi.nota),
        'y la nota ya no promete que lo lleva a WhatsApp');

    /* El backend contesta que si a los 2 s. Es la unica forma de ver la
       pantalla de cierre sin que salga un pedido de verdad. */
    await ev('(function () { var of = window.fetch;' +
      ' window.fetch = function (u, o) {' +
      '   if (o && String(o.method || "").toUpperCase() === "POST" && String(u).indexOf("script.google") >= 0) {' +
      '     window.__posts.push({ body: String(o.body || "") });' +
      '     return new Promise(function (r) { setTimeout(function () {' +
      '       r(new Response(JSON.stringify({ ok: true, n: 947 }), { status: 200, headers: { "Content-Type": "application/json" } })); }, 2000); });' +
      '   }' +
      '   return of.apply(this, arguments); }; })()');
    await alFormulario();
    await ev(LLENAR_DATOS);
    await ev('coSeguir(); document.getElementById("pago-tr").click(); coSeguir()');
    await dormir(300);
    await ev('(function () { var c = document.querySelector("#day-picker .dp-cell.available"); if (c) c.click(); })()');
    await dormir(300);
    /* Tres productos distintos: la lista del comprobante se mide por renglon,
       y con uno solo un bug que los pise a todos pasaria igual. */
    await ev('(function () { var ps = getActiveProducts().filter(function (x) { return !esPorPeso(x); }).slice(0, 3);' +
      ' ps.forEach(function (p) { addToCart(String(p.id)); }); })()');
    await dormir(300);
    const urlAntes = await ev('location.href');
    await ev('enviarPedido()');
    await dormir(900);
    chk(await ev('document.getElementById("send-title").textContent') === 'Registrando tu pedido…',
        'al tocar, la pantalla dice que lo esta registrando');
    await dormir(3000);
    const fin = JSON.parse(await ev('JSON.stringify({' +
      ' titulo: document.getElementById("send-title").textContent,' +
      ' cls: document.querySelector(".send-card").className,' +
      ' datos: document.getElementById("send-done-datos").textContent,' +
      ' url: location.href })'));
    chk(/947/.test(fin.titulo) && /confirmado/i.test(fin.titulo),
        'y al confirmar el ERP lo dice con su numero', '"' + fin.titulo + '"');
    chk(/done/.test(fin.cls), 'la tarjeta pasa al estado de pedido cerrado', fin.cls);
    chk(/Entrega/.test(fin.datos) && /Dirección/.test(fin.datos) && /Total/.test(fin.datos),
        'con la entrega, la direccion y el total, bien escritos');
    chk(fin.url === urlAntes, 'Y NO SE FUE A WHATSAPP: sigue en la tienda');
    chk(!escapados.some((x) => /wa\.me|whatsapp/.test(x)),
        'ni lo intento por atras', escapados.join(' | ') || 'nada');

    /* La confirmacion ocupa la pantalla, no es un cartel (29/9/2026). */
    const pant = JSON.parse(await ev('JSON.stringify((function () {' +
      ' var ov = document.getElementById("send-overlay");' +
      ' var card = ov.querySelector(".send-card");' +
      ' var r = card.getBoundingClientRect();' +
      ' var lo = card.querySelector(".send-loader").getBoundingClientRect();' +
      ' var btn = document.getElementById("send-done-btn");' +
      ' var wa = document.getElementById("send-done-wa");' +
      ' return { clase: ov.className, ancho: Math.round(r.width), alto: Math.round(r.height),' +
      '   viewW: window.innerWidth, viewH: window.innerHeight,' +
      '   loaderW: Math.round(lo.width), loaderH: Math.round(lo.height),' +
      '   items: document.querySelectorAll("#send-done-items li").length,' +
      '   btn: btn ? btn.textContent.trim() : "", btnAlto: btn ? Math.round(btn.getBoundingClientRect().height) : 0,' +
      '   wa: wa ? wa.textContent.trim() : "", waHref: wa ? wa.getAttribute("href") : "",' +
      '   waAlto: wa ? Math.round(wa.getBoundingClientRect().height) : 0 };' +
      '})())'));
    chk(/pantalla/.test(pant.clase), 'la confirmacion ocupa la pantalla, no es un cartel', pant.clase);
    chk(pant.ancho === pant.viewW, 'la tarjeta va de borde a borde', pant.ancho + ' de ' + pant.viewW);
    chk(pant.alto >= pant.viewH, 'y cubre el alto entero', pant.alto + ' >= ' + pant.viewH);
    /* El circulo del check es CUADRADO. Con `width:100%` heredado quedaba un
       ovalo de 84x72, y eso no lo dice ningun numero de la pagina: se vio en
       una captura. */
    chk(pant.loaderW === pant.loaderH, 'el circulo del check es redondo, no un ovalo',
        pant.loaderW + 'x' + pant.loaderH);
    chk(pant.items === 3, 'los productos van uno por renglon', String(pant.items));
    chk(/volver a la tienda/i.test(pant.btn), 'hay un boton para volver a la tienda', '"' + pant.btn + '"');
    chk(/duda/i.test(pant.wa) && /wa\.me/.test(pant.waHref),
        'y otro para escribirnos si tiene una duda', '"' + pant.wa + '"');
    chk(pant.btnAlto >= 44 && pant.waAlto >= 44,
        'los dos se pueden tocar (44px minimo)', pant.btnAlto + ' y ' + pant.waAlto);

    /* Y al volver, el overlay deja de ser pantalla: el proximo "Registrando tu
       pedido..." tiene que salir como cartel, no como un pedido ya cerrado. */
    await ev('document.getElementById("send-done-btn").click()');
    await dormir(300);
    chk(!(await ev('document.getElementById("send-overlay").classList.contains("pantalla")')),
        'al volver a la tienda, el overlay deja de ser pantalla completa');

    const postsDelCierre = await ev('window.__posts.length');
    chk(postsDelCierre === 1, 'y salio UN solo POST, no una cadena de reintentos', String(postsDelCierre));

    /* Vuelta al estado normal para el bloque de la barra. Ojo: esto navega, y
       con la navegacion se va `window.__posts`. Por eso el conteo del cierre
       se lee ARRIBA y el chequeo final mira los escapados por CDP, que son
       los que de verdad habrian llegado a Apps Script. */
    await abrir();

    /* ── H. LA BARRA NO LLEGA AL FINAL SOLA ──────────────────────── */
    console.log('\n' + DIM + '== La barra dice la verdad: no se llena sola ==' + RST);
    await ev('showSendLoader()');
    const b0 = await ev('parseFloat(document.getElementById("send-barra-fill").style.width) || 0');
    await dormir(1500);
    const b1 = await ev('parseFloat(document.getElementById("send-barra-fill").style.width) || 0');
    chk(b0 > 0 && b1 > b0, 'arranca y avanza', b0 + '% -> ' + b1 + '%');
    await dormir(9000);
    const b2 = await ev('parseFloat(document.getElementById("send-barra-fill").style.width) || 0');
    chk(b2 < 95, 'a los ~10 s sigue SIN llegar al final: falta la confirmacion', b2 + '%');
    chk(b2 > b1, 'pero siguio avanzando, no se congelo', b1 + '% -> ' + b2 + '%');
    await ev('setSendLoaderSuccess()');
    await dormir(200);
    const b3 = await ev('parseFloat(document.getElementById("send-barra-fill").style.width) || 0');
    chk(b3 === 100, 'y RECIEN con la confirmacion llega al 100', b3 + '%');
    chk(await ev('document.querySelectorAll("#send-barra, .send-progress").length') === 1,
        'hay UNA sola barra en la tarjeta, no dos');
    await ev('hideSendLoader()');
    await dormir(200);
    chk(await ev('parseFloat(document.getElementById("send-barra-fill").style.width) || 0') === 0,
        'al cerrar vuelve a cero: el proximo pedido no arranca lleno');

    /* ── I. NADA SALIO HACIA AFUERA ──────────────────────────────── */
    console.log('\n' + DIM + '== Nada salio hacia afuera ==' + RST);
    /* El bloque J manda un pedido a proposito contra el backend simulado, asi
       que ese POST esta contado y es el unico que puede haber. Lo que no puede
       haber es uno que se ESCAPE por CDP hacia Apps Script de verdad. */
    const posts = await ev('window.__posts.length');
    chk(escapados.length === 0,
        'nada llego a Apps Script de verdad',
        escapados.length + ' escapados por CDP' + (posts ? ', ' + posts + ' sin leer' : ''));
    const errores = await ev('JSON.stringify(window.__err)');
    chk(errores === '[]', 'y ningun error de JS en todo el recorrido', errores);

    console.log('\n' + (mal ? RED + bien + ' ok \u00b7 ' + mal + ' mal' : VER + bien + ' ok \u00b7 0 mal') +
                RST + DIM + '  (' + ANCHO + 'px)' + RST);
  } catch (err) {
    console.error('\n' + RED + 'CORTADO: ' + (err && err.stack ? err.stack : err) + RST);
    mal++;
  } finally {
    try { proc.kill(); } catch (e) {}
    srv.close();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  process.exit(mal ? 1 : 0);
}
main();
