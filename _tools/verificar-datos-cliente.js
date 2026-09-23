/* ¿Vuelven los datos del cliente en la visita siguiente?
 *
 * Iñaki (11/9/2026): "¿hay que completar cada vez que entra a la página los
 * datos del cliente? La idea era que queden fijos". Nada lo probaba: los tests
 * abren un perfil de Chrome NUEVO cada vez, así que la segunda visita —que es
 * justo lo que se quiere medir— no existía en ninguna red.
 *
 * Este usa UN MISMO perfil para varias visitas, como un cliente de verdad, y
 * mide qué campos vuelven llenos y cuáles no.
 *
 *   node _tools/verificar-datos-cliente.js [ancho]
 *
 * NINGÚN pedido puede llegar al ERP. Dos seguros, como verificar-envio.js:
 *   · se sirve app.js con la URL del backend cambiada por una que no existe;
 *   · y todo POST se corta por CDP, fuera de la página, desde antes de la
 *     primera navegación.
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const http = require('http'); const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = 8790 + Math.floor(Math.random() * 60);
const RED = '\x1b[31m', VER = '\x1b[32m', DIM = '\x1b[2m', RST = '\x1b[0m';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const dormir = (ms) => new Promise((s) => setTimeout(s, ms));

/* El cliente de la prueba. Nombre y teléfono inventados: este repo es público.
   `bp` es el Barrio Privado (hoy hay uno solo) y `barrio` el Sub Barrio, que se
   llena solo al elegir el primero — el sub-barrio se toma del desplegable real
   en vez de escribirlo acá, así el test no envejece cuando cambie la lista. */
const CLI = { nombre: 'Prueba Datos', tel: '1155667788', bp: 'Estancias del Pilar', lote: '77' };

let ok = 0, mal = 0;
function ch(cond, txt, extra) {
  if (cond) { ok++; console.log('  ' + VER + 'ok   ' + RST + txt + (extra ? DIM + '  (' + extra + ')' + RST : '')); }
  else { mal++; console.log('  ' + RED + 'MAL  ' + RST + txt + (extra ? DIM + '  (' + extra + ')' + RST : '')); }
}
function titulo(t) { console.log('\n' + DIM + t + RST); }

function servir() {
  return new Promise((listo, fallo) => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const abs = path.join(RAIZ, rel);
      if (!abs.startsWith(RAIZ) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
        res.writeHead(404); res.end('no esta'); return;
      }
      const ext = path.extname(abs).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      if (rel === '/app.js') {
        // SEGURO 1: el backend apunta a una URL que no existe. Si algo se
        // escapara del corte por CDP, Google contesta 404 y no escribe nada.
        // APP_JS=<ruta> sirve otro app.js: es como se prueba el test en la
        // direccion contraria, con el codigo de antes del arreglo.
        const js = fs.readFileSync(process.env.APP_JS || abs, 'utf8').replace(
          /const APPS_SCRIPT_URL = "[^"]+"/,
          'const APPS_SCRIPT_URL = "https://script.google.com/macros/s/NO-EXISTE-PRUEBA-DATOS/exec"');
        res.end(js); return;
      }
      fs.createReadStream(abs).pipe(res);
    });
    srv.on('error', fallo);
    srv.listen(PUERTO, '127.0.0.1', () => listo(srv));
  });
}

function cdp(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map(); const oy = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else if (m.method) oy.forEach((f) => f(m));
  });
  return {
    listo: new Promise((r) => ws.addEventListener('open', r)),
    on: (f) => oy.push(f),
    enviar: (m, p) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }),
  };
}

/* Elegir zona y fecha, como lo hace una persona. */
const ELEGIR_ZONA_FECHA = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  var ov = document.getElementById('loc-overlay');
  var abierto = function () { return !!(ov && getComputedStyle(ov).display !== 'none' && !ov.classList.contains('hidden')); };
  /* Desde el 23/9/2026 la tienda abre en el catalogo: el modal ya no sale solo.
     Si la zona todavia esta sin elegir, se abre por donde lo abre una persona
     que no toco "+ Agregar" — el chip 📍 de arriba. */
  if (!abierto() && typeof zonaProvisoria !== 'undefined' && zonaProvisoria) {
    showZoneModal('chip'); await dormir(300);
  }
  if (abierto()) {
    var z = [].slice.call(document.querySelectorAll('#loc-step-zone .loc-btn'))
      .filter(function (b) { return (b.getAttribute('onclick') || '').indexOf('estancias') >= 0; })[0];
    if (z) { z.click(); await dormir(500); }
    /* Si quedo abierto es porque falta un paso (en Pilar, el barrio). En
       Estancias cierra ahi mismo: la fecha se elige en el formulario. */
    var f = abierto() ? document.querySelector('#loc-dates-grid button:not([disabled])') : null;
    if (f) { f.click(); await dormir(700); }
  }
  return abierto();
})()`;

/* Cliente nuevo con el flujo del 23/9/2026: entra al catalogo sin que le
   pregunten nada, toca "+ Agregar", AHI le preguntan la zona, elige, y lo que
   habia tocado se suma solo. */
const AGREGAR_Y_ELEGIR_ZONA = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  var ov = document.getElementById('loc-overlay');
  var abierto = function () { return !!(ov && getComputedStyle(ov).display !== 'none' && !ov.classList.contains('hidden')); };
  var alEntrar = abierto();
  var act = getActiveProducts().filter(function (p) { return !esPorPeso(p); });
  var id = act[0].id;
  addToCart(id);
  await dormir(400);
  var pregunto = abierto(), mientras = cartCount();
  var z = [].slice.call(document.querySelectorAll('#loc-step-zone .loc-btn'))
    .filter(function (b) { return (b.getAttribute('onclick') || '').indexOf('estancias') >= 0; })[0];
  if (z) { z.click(); await dormir(600); }
  return JSON.stringify({ alEntrar: alEntrar, pregunto: pregunto, mientras: mientras,
                          abierto: abierto(), sumado: cartCount(), id: id });
})()`;

/* Lo que se ve en el formulario. Un campo vacío es un campo que hay que
   escribir de nuevo: es exactamente lo que se viene a medir. */
const LEER_FORM = `(function(){
  var v = function(id){ var e = document.getElementById(id); return e ? String(e.value || '') : null; };
  var pago = document.querySelector('input[name="pago"]:checked');
  return JSON.stringify({
    nombre: v('f-nombre'), tel: v('f-telefono'),
    bp: v('f-barrio-privado'), barrio: v('f-barrio'), lote: v('f-lote'),
    dia: v('f-dia'), pago: pago ? pago.value : '',
    guardado: (function(){ try {
      return { pg: !!localStorage.getItem('maleu_cliente_pg'),
               zona: !!localStorage.getItem('maleu_cliente_estancias'),
               maleu_zone: localStorage.getItem('maleu_zone') || '' };
    } catch(e) { return { error: String(e) }; } })()
  });
})()`;

(async () => {
  console.log('\n' + DIM + 'los datos del cliente en la visita siguiente · ' + ANCHO + 'px' + RST);
  const srv = await servir();
  const BASE = 'http://127.0.0.1:' + PUERTO + '/';
  // El perfil es el MISMO en todas las visitas: es lo que hace que esto mida
  // un cliente que vuelve y no uno nuevo.
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-cliente-'));
  const exe = CHROMES.find((p) => fs.existsSync(p));
  if (!exe) { console.log(RED + 'no encontre Chrome' + RST); process.exit(1); }
  const posts = [];
  let proc = null, cli = null;

  async function abrir(cual) {
    const pc = 9300 + Math.floor(Math.random() * 200);
    proc = spawn(exe, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--remote-debugging-port=' + pc, '--user-data-dir=' + (cual || perfil),
      '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'], { stdio: 'ignore' });
    let ws = null;
    for (let i = 0; i < 120 && !ws; i++) {
      try { const r = await fetch('http://127.0.0.1:' + pc + '/json/list');
        const t = (await r.json()).find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
        if (t) ws = t.webSocketDebuggerUrl; } catch (e) {}
      if (!ws) await dormir(250);
    }
    cli = cdp(ws); await cli.listo;
    await cli.enviar('Page.enable'); await cli.enviar('Runtime.enable');
    await cli.enviar('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: ANCHO < 700 });
    // SEGURO 2: los POST se cortan fuera de la página, desde antes de navegar.
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const r = m.params.request;
      const malo = r.method === 'POST' || /google-analytics|googletagmanager|facebook|wa\.me|whatsapp/.test(r.url);
      try {
        if (malo) { if (r.method === 'POST') posts.push(r.method + ' ' + r.url.slice(0, 80));
          await cli.enviar('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' }); }
        else await cli.enviar('Fetch.continueRequest', { requestId: m.params.requestId });
      } catch (e) {}
    });
  }
  /* Chrome se cierra ORDENADAMENTE, no a matarlo. El localStorage se escribe a
     disco de forma asincrona: con `proc.kill()` las ultimas escrituras se
     pierden a veces, y entonces la visita siguiente lee vacio y el test culpa a
     la tienda de algo que hizo el test. Pasó: una corrida dio la visita 2 en
     rojo y la siguiente en verde, con el mismo codigo. */
  async function cerrar() {
    try { await cli.enviar('Browser.close'); } catch (e) {}
    for (let i = 0; i < 40 && proc && proc.exitCode === null; i++) await dormir(100);
    try { proc.kill(); } catch (e) {}
    await dormir(300);
  }

  const ev = async (e) => {
    const r = await cli.enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('en la pagina: ' + String((d.exception && d.exception.description) || d.text).split(String.fromCharCode(10))[0]);
    }
    return r.result.value;
  };
  async function visitar() {
    await cli.enviar('Page.navigate', { url: BASE });
    for (let i = 0; i < 300; i++) {
      if (await ev("typeof PRODUCTOS !== 'undefined' && PRODUCTOS.length > 0").catch(() => false)) break;
      await dormir(100);
    }
    await dormir(400);
  }

  try {
    /* ───────── VISITA 1: un cliente nuevo que hace su primer pedido ───────── */
    titulo('visita 1 — cliente nuevo: elige zona, carga y manda el pedido');
    await abrir();
    await visitar();
    const modal1 = JSON.parse(await ev(AGREGAR_Y_ELEGIR_ZONA));
    ch(modal1.alEntrar === false, 'entra al catalogo sin nada encima (23/9/2026)');
    ch(modal1.pregunto === true, 'al tocar "+ Agregar" le pregunta la zona');
    ch(modal1.mientras === 0, 'y mientras pregunta no agrega nada', String(modal1.mientras));
    ch(modal1.abierto === false && modal1.sumado === 1, 'al elegir la zona cierra y suma lo que habia tocado',
       JSON.stringify({ abierto: modal1.abierto, carrito: modal1.sumado }));

    await ev('addToCart(' + JSON.stringify(modal1.id) + '); goToForm();');
    await dormir(700);
    const vacio = JSON.parse(await ev(LEER_FORM));
    ch(!vacio.nombre && !vacio.tel, 'el formulario arranca vacio, que es lo correcto para alguien nuevo',
       JSON.stringify({ nombre: vacio.nombre, tel: vacio.tel }));

    // Completar como una persona: escribir y disparar los eventos reales.
    // El sub-barrio sale del desplegable, que se llena al elegir el barrio
    // privado: inventarle un valor haria fallar el test y no el formulario.
    CLI.barrio = await ev(`(function(){
      var poner = function(id, val){ var e = document.getElementById(id); if(!e) return false;
        e.value = val; e.dispatchEvent(new Event('input', {bubbles:true}));
        e.dispatchEvent(new Event('change', {bubbles:true})); return true; };
      poner('f-nombre', ${JSON.stringify(CLI.nombre)});
      poner('f-telefono', ${JSON.stringify(CLI.tel)});
      poner('f-barrio-privado', ${JSON.stringify(CLI.bp)});
      if (typeof filtrarSubBarrios === 'function') filtrarSubBarrios();
      var sb = document.getElementById('f-barrio');
      var op = sb ? [].slice.call(sb.options).filter(function(o){ return o.value; })[0] : null;
      if (op) { sb.value = op.value; sb.dispatchEvent(new Event('change', {bubbles:true})); }
      poner('f-lote', ${JSON.stringify(CLI.lote)});
      var d = document.querySelector('#day-picker button.available') || document.querySelector('#day-picker button:not([disabled])');
      if (d) d.click();
      var ef = [].slice.call(document.querySelectorAll('input[name="pago"]')).filter(function(x){ return /efectivo/i.test(x.value); })[0];
      if (ef) { ef.click(); ef.dispatchEvent(new Event('change', {bubbles:true})); }
      return op ? op.value : '';
    })()`);
    await dormir(500);
    ch(!!CLI.barrio, 'el desplegable de sub-barrio se lleno al elegir el barrio privado', CLI.barrio);
    const lleno = JSON.parse(await ev(LEER_FORM));
    ch(lleno.nombre === CLI.nombre && lleno.tel === CLI.tel && lleno.bp === CLI.bp
       && lleno.barrio === CLI.barrio && lleno.lote === CLI.lote && !!lleno.dia && !!lleno.pago,
       'quedo completo antes de mandar', JSON.stringify(lleno).slice(0, 170));

    await ev('enviarPedido()');
    await dormir(1500);
    const trasEnviar = JSON.parse(await ev(LEER_FORM));
    ch(trasEnviar.guardado.pg === true, 'al mandar el pedido se guardan los datos del cliente');
    ch(trasEnviar.guardado.zona === true, 'y tambien los de la zona');
    ch(trasEnviar.guardado.maleu_zone === 'estancias', 'la zona queda guardada', trasEnviar.guardado.maleu_zone);
    const guardado = JSON.parse(await ev("localStorage.getItem('maleu_cliente_pg')"));
    ch(guardado && guardado.nombre === CLI.nombre && guardado.telefono === CLI.tel && guardado.lote === CLI.lote,
       'lo guardado es lo que el cliente escribio', JSON.stringify(guardado));
    await cerrar();

    /* ───────── VISITA 2: vuelve al otro día, mismo navegador ───────── */
    titulo('visita 2 — vuelve: el navegador es el mismo, la pagina se recarga');
    await abrir();
    await visitar();
    /* Antes de tocar nada: los datos tienen que estar puestos ya en el arranque.
       Si estan acá y no despues, lo que los borra es elegir la fecha. */
    const preFecha = JSON.parse(await ev(LEER_FORM));
    ch(preFecha.nombre === CLI.nombre, 'al abrir, antes de elegir la fecha, el nombre ya esta',
       JSON.stringify({ nombre: preFecha.nombre, lote: preFecha.lote }));
    const m2 = await ev(ELEGIR_ZONA_FECHA);   // solo pedira la fecha, la zona ya la sabe
    ch(m2 === false, 'entro sin tener que elegir la zona de nuevo');
    await ev('goToForm()'); await dormir(700);
    const v2 = JSON.parse(await ev(LEER_FORM));
    ch(v2.nombre === CLI.nombre, 'el nombre vuelve solo', JSON.stringify(v2.nombre));
    ch(v2.tel === CLI.tel, 'el telefono vuelve solo', JSON.stringify(v2.tel));
    ch(v2.bp === CLI.bp, 'el barrio privado vuelve solo', JSON.stringify(v2.bp));
    ch(v2.barrio === CLI.barrio, 'el sub-barrio vuelve solo', JSON.stringify(v2.barrio));
    ch(v2.lote === CLI.lote, 'el lote vuelve solo', JSON.stringify(v2.lote));
    /* El dia NO sale de la precarga: sale de la fecha que quedo elegida. Desde
       el 23/9/2026 esa fecha la pone el calendario del FORMULARIO
       (selectDayPicker llama a setDeliveryDate), no el modal. Lo que no tiene
       que volver es el PAGO — cambia en cada pedido y precargarlo seria decidir
       por el. */
    ch(!v2.pago, 'el metodo de pago NO vuelve, y es a proposito: se elige en cada pedido',
       JSON.stringify(v2.pago));
    ch(!!v2.dia, 'el dia viene de la fecha que quedo elegida, no de lo guardado', JSON.stringify(v2.dia));
    /* 12/9/2026: si la fecha guardada sigue vigente el modal NO se abre, y el
       dia lo marca goToForm. Con eso aparecio el riesgo contrario: que al
       volver del carrito pise un dia que el cliente cambio en el formulario. */
    const otroDia = JSON.parse(await ev(`(function(){
      var actual = (document.getElementById('f-dia-fecha')||{}).value || '';
      var b = [].slice.call(document.querySelectorAll('#day-picker button.available'))
        .filter(function(x){ return !x.disabled && x.getAttribute('data-fecha') && x.getAttribute('data-fecha') !== actual; })[0];
      if (!b) return JSON.stringify({ hay: false, actual: actual });
      b.click();
      var elegido = document.getElementById('f-dia-fecha').value;
      goToForm();
      return JSON.stringify({ hay: true, actual: actual, elegido: elegido,
        despues: document.getElementById('f-dia-fecha').value });
    })()`));
    if (otroDia.hay) {
      ch(otroDia.elegido !== otroDia.actual && otroDia.despues === otroDia.elegido,
         'si cambia el dia en el formulario, volver del carrito no se lo pisa', JSON.stringify(otroDia));
    } else {
      console.log('  ' + DIM + '(sin un segundo dia disponible hoy: no se puede probar que no lo pise)' + RST);
    }
    await cerrar();

    /* ───────── VISITA 3: el que vuelve a elegir su zona ─────────
       Es el caso que se sospecha roto: loadClientData() corre UNA sola vez, al
       arrancar. Si el cliente elige la zona despues (porque toco "¿Donde
       entregamos?", o porque el navegador perdio la zona pero no los datos),
       nadie la vuelve a llamar y el formulario queda vacio teniendo los datos
       guardados a mano. */
    titulo('visita 3 — vuelve a elegir la zona en el modal (los datos SI estan guardados)');
    await abrir();
    await visitar();
    await ev("localStorage.removeItem('maleu_zone'); localStorage.removeItem('maleu_delivery_date');");
    await visitar();
    const hay = JSON.parse(await ev(`JSON.stringify({ pg: !!localStorage.getItem('maleu_cliente_pg'), zone: localStorage.getItem('maleu_zone') })`));
    ch(hay.pg === true && !hay.zone, 'el escenario quedo sembrado: datos guardados y sin zona', JSON.stringify(hay));
    const m3 = await ev(ELEGIR_ZONA_FECHA);
    ch(m3 === false, 'eligio la zona en el modal');
    await ev('goToForm()'); await dormir(700);
    const v3 = JSON.parse(await ev(LEER_FORM));
    ch(v3.nombre === CLI.nombre, 'el nombre vuelve al elegir la zona en el modal', JSON.stringify(v3.nombre));
    ch(v3.tel === CLI.tel, 'el telefono tambien', JSON.stringify(v3.tel));
    ch(v3.bp === CLI.bp && v3.barrio === CLI.barrio && v3.lote === CLI.lote, 'y la direccion tambien',
       JSON.stringify({ bp: v3.bp, barrio: v3.barrio, lote: v3.lote }));
    await cerrar();

    /* ───────── VISITA 4: cambiar de zona a mano no borra lo escrito ───────── */
    titulo('visita 4 — toca "¿Donde entregamos?" y vuelve a elegir Estancias');
    await abrir();
    await visitar();
    await ev(ELEGIR_ZONA_FECHA);
    await ev('goToForm()'); await dormir(600);
    const antes4 = JSON.parse(await ev(LEER_FORM));
    ch(antes4.nombre === CLI.nombre, 'arranca con los datos puestos', JSON.stringify(antes4.nombre));
    // Abrir el selector de zona y volver a elegir Estancias, como una persona
    await ev(`(function(){
      if (typeof abrirSelectorZona === 'function') return abrirSelectorZona();
      if (typeof cambiarZona === 'function') return cambiarZona();
      if (typeof welcomeShowZoneStep === 'function') { welcomeShowZoneStep(); _setOverlay(true); }
    })()`);
    await dormir(500);
    await ev(ELEGIR_ZONA_FECHA);
    await ev('goToForm()'); await dormir(700);
    const v4 = JSON.parse(await ev(LEER_FORM));
    ch(v4.nombre === CLI.nombre && v4.tel === CLI.tel, 'despues de reelegir la zona los datos siguen ahi',
       JSON.stringify({ nombre: v4.nombre, tel: v4.tel }));
    ch(v4.bp === CLI.bp && v4.barrio === CLI.barrio && v4.lote === CLI.lote, 'y la direccion no se perdio',
       JSON.stringify({ bp: v4.bp, barrio: v4.barrio, lote: v4.lote }));

    /* Los POST a NO-EXISTE-PRUEBA-DATOS son los reintentos del pedido que quedo
       sin confirmar, y son la prueba de que el seguro funciona: ese pedido
       nunca pudo llegar a un backend de verdad. Lo que no puede haber es UNO
       SOLO a la URL real. */
    const alReal = posts.filter((u) => /script\.google\.com/.test(u) && !/NO-EXISTE-PRUEBA-DATOS/.test(u));
    ch(alReal.length === 0, 'ningun POST al backend real: este test no pudo crear un pedido', alReal.join(' , ') || '0');
    ch(posts.length > 0, 'el pedido sin confirmar se reintenta contra la URL falsa', posts.length + ' intentos, todos cortados');
    await cerrar();

    /* ───────── El caso de Iñaki: completar y NO mandar el pedido ─────────
       Hasta el 11/9/2026 los datos se guardaban solo al enviar, asi que el que
       completaba el formulario y se iba —o lo dejaba a medias para pensarlo—
       tenia que escribir todo de nuevo la vez siguiente. Va en un navegador
       LIMPIO: con el perfil de arriba los datos ya estarian guardados y este
       escenario no probaria nada. */
    titulo('otro navegador — completa el formulario y NO manda el pedido');
    const perfil2 = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-cliente2-'));
    await abrir(perfil2);
    await visitar();
    await ev(ELEGIR_ZONA_FECHA);
    await ev(`(function(){
      var act = getActiveProducts().filter(function(p){ return !esPorPeso(p); });
      addToCart(act[0].id); goToForm();
    })()`);
    await dormir(600);
    // Escribir y salir del campo, como una persona que pasa al siguiente
    await ev(`(function(){
      var poner = function(id, val){ var e = document.getElementById(id); if(!e) return;
        e.focus(); e.value = val;
        e.dispatchEvent(new Event('input', {bubbles:true}));
        e.dispatchEvent(new Event('change', {bubbles:true}));
        e.dispatchEvent(new Event('focusout', {bubbles:true}));
        e.blur(); };
      poner('f-nombre', ${JSON.stringify(CLI.nombre)});
      poner('f-telefono', ${JSON.stringify(CLI.tel)});
      poner('f-barrio-privado', ${JSON.stringify(CLI.bp)});
      if (typeof filtrarSubBarrios === 'function') filtrarSubBarrios();
      var sb = document.getElementById('f-barrio');
      var op = sb ? [].slice.call(sb.options).filter(function(o){ return o.value; })[0] : null;
      if (op) { sb.value = op.value; sb.dispatchEvent(new Event('change', {bubbles:true})); }
      poner('f-lote', ${JSON.stringify(CLI.lote)});
    })()`);
    await dormir(400);
    const sinMandar = JSON.parse(await ev(`localStorage.getItem('maleu_cliente_pg') || 'null'`));
    ch(!!sinMandar, 'se guardo sin haber mandado ningun pedido');
    ch(sinMandar && sinMandar.nombre === CLI.nombre && sinMandar.telefono === CLI.tel,
       'con el nombre y el telefono', JSON.stringify(sinMandar && { n: sinMandar.nombre, t: sinMandar.telefono }));
    ch(sinMandar && sinMandar.lote === CLI.lote && sinMandar.barrio === CLI.barrio,
       'y con la direccion entera', JSON.stringify(sinMandar && { b: sinMandar.barrio, l: sinMandar.lote }));
    await cerrar();

    titulo('y al volver, sin haber pedido nunca, estan todos');
    await abrir(perfil2);
    await visitar();
    await ev(ELEGIR_ZONA_FECHA);
    await ev('goToForm()'); await dormir(700);
    const v5 = JSON.parse(await ev(LEER_FORM));
    ch(v5.nombre === CLI.nombre && v5.tel === CLI.tel, 'nombre y telefono',
       JSON.stringify({ nombre: v5.nombre, tel: v5.tel }));
    ch(v5.bp === CLI.bp && v5.barrio === CLI.barrio && v5.lote === CLI.lote, 'barrio, sub-barrio y lote',
       JSON.stringify({ bp: v5.bp, barrio: v5.barrio, lote: v5.lote }));
    try { fs.rmSync(perfil2, { recursive: true, force: true }); } catch (e) {}
  } catch (e) {
    console.log(RED + 'ROTO' + RST + ' ' + e.message); mal++;
  } finally {
    try { proc.kill(); } catch (e) {}
    srv.close();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\n' + (mal ? RED : VER) + ok + ' ok · ' + mal + ' mal' + RST + DIM + '  (' + ANCHO + 'px)' + RST + '\n');
  process.exit(mal ? 1 : 0);
})();
