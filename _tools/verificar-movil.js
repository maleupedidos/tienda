/**
 * Que la tienda se pueda usar con un dedo, en un celular, sin pelearse.
 *
 *   node _tools/verificar-movil.js
 *
 * POR QUE EXISTE. El 10/9/2026 Tadeo la uso desde su iPhone y encontro dos
 * cosas que ninguna de las otras redes agarra, porque las dos son
 * sintacticamente perfectas:
 *
 *   · "aprieto el casillero y me hace zoom"
 *     iOS Safari hace zoom SOLO cuando el input tiene font-size < 16px. El
 *     buscador tenia .92rem = 14,72px. En una compu no se ve nunca: el zoom
 *     de iOS no existe ahi. Y despues del zoom la pagina queda corrida a lo
 *     ancho y hay que volver a mano.
 *
 *   · "busco una palabra y me scrollea hacia el final"
 *     Al escribir, la busqueda esconde "Los mas pedidos", las categorias, el
 *     ultimo pedido y las cards que no matchean. El documento se achica de
 *     golpe y el navegador CLAMPEA el scroll al nuevo final. O sea que el
 *     cliente escribe y aterriza abajo de todo, mirando el pie de pagina.
 *
 * Los dos son del mismo tipo: no rompen nada, no tiran un error, y en la
 * compu del que programa no pasan. Solo se ven con un dedo y una pantalla de
 * 390px — que es como compra el 100% de los clientes de Maleu.
 *
 * QUE VERIFICA
 *   1. ningun campo enfocable dispara el zoom de iOS  (font-size >= 16px)
 *   2. al buscar, la lista arranca ARRIBA: la primera card queda en pantalla
 *   3. el buscador nunca se va de la pantalla mientras se busca
 *   4. los controles del flujo llegan al minimo tactil de 44px
 *
 * Sale con codigo 1 si algo falla.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.env.PUERTO || 8193);
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

function servir() {
  return new Promise((listo) => {
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
    srv.listen(PUERTO, '127.0.0.1', () => listo(srv));
  });
}

function cdp(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      m.error ? mal(new Error(m.error.message)) : ok(m.result);
    }
  });
  const listo = new Promise((r, j) => {
    ws.addEventListener('open', r);
    ws.addEventListener('error', () => j(new Error('no conecta con Chrome')));
  });
  return { listo, enviar: (m, p) => new Promise((ok, mal) => {
    const i = ++id; pend.set(i, { ok, mal });
    ws.send(JSON.stringify({ id: i, method: m, params: p || {} }));
  }) };
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

/* Ningun POST hacia afuera. `piezas_full` se contesta vacio a proposito: asi
   el test no depende de que haya internet ni de que el ERP tenga carne
   cargada hoy.

   OJO: la zona NO se siembra en localStorage. Poner `maleu_zone` sola no
   alcanza — falta la fecha, asi que el modal se queda abierto en el paso 3
   y el body queda con `overflow:hidden`. O sea CERO scroll, y un test de
   scroll sobre una pagina que no scrollea da verde sin haber mirado nada.
   Se recorre el modal a mano, como una persona. */
const PREP = `(function () {
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    var u = String(url);
    if (opts && String(opts.method || '').toUpperCase() === 'POST') {
      return Promise.resolve(new Response('{"ok":true}', { status: 200 }));
    }
    if (u.indexOf('action=piezas_full') >= 0) {
      return Promise.resolve(new Response('{}',
        { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return orig.apply(this, arguments);
  };
})();`;

/* Elegir zona y fecha en el modal de bienvenida, que es lo primero que hace
   cualquiera que entra. Devuelve el estado para que el test corte si quedo
   abierto. */
const ELEGIR_ZONA = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  var pasos = [];
  var z = [].slice.call(document.querySelectorAll('#loc-step-zone .loc-btn'))
    .filter(function (b) { return (b.getAttribute('onclick') || '').indexOf('estancias') >= 0; })[0];
  if (!z) return JSON.stringify({ error: 'no encontre el boton de Estancias' });
  z.click(); pasos.push('zona'); await dormir(500);

  var f = document.querySelector('#loc-dates-grid button:not([disabled])');
  if (f) { f.click(); pasos.push('fecha ' + (f.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30)); }
  await dormir(700);

  var ov = document.getElementById('loc-overlay');
  return JSON.stringify({
    pasos: pasos,
    abierto: !!(ov && getComputedStyle(ov).display !== 'none'),
    scrollable: document.documentElement.scrollHeight - window.innerHeight
  });
})()`;

const REVISION = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  var ok = [], mal = [];
  var anota = function (bien, texto) { (bien ? ok : mal).push(texto); return bien; };

  /* ── 1. EL ZOOM DE iOS ────────────────────────────────────────────
     Safari en iPhone hace zoom al enfocar cualquier campo con menos de
     16px. No hay forma de apagarlo desde el CSS del input; la unica es que
     el texto mida 16 o mas. (Se podria con maximum-scale=1 en el viewport,
     pero eso le saca al cliente el zoom con los dedos en TODA la pagina,
     que es un problema de accesibilidad mucho peor.) */
  var campos = [].slice.call(document.querySelectorAll(
    'input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea'));
  var chicos = campos.map(function (el) {
    var fs = parseFloat(getComputedStyle(el).fontSize) || 0;
    return { id: el.id || el.name || el.className || el.tagName, px: fs };
  }).filter(function (c) { return c.px < 16; });

  if (!campos.length) mal.push('no encontre un solo campo que medir — el test no probo nada');
  else {
    anota(chicos.length === 0,
      'los ' + campos.length + ' campos miden 16px o mas: ninguno dispara el zoom de iOS');
    chicos.forEach(function (c) {
      mal.push('el campo "' + c.id + '" mide ' + c.px.toFixed(1) + 'px — al tocarlo, iOS hace zoom');
    });
  }

  /* ── 2. AL BUSCAR, LA LISTA ARRANCA ARRIBA ────────────────────────
     El escenario real: el cliente venia scrolleando el catalogo y recien
     ahi se acuerda de buscar. Medirlo desde arriba de todo no probaria
     nada — desde arriba no hay nada que clampear. */
  var alto = document.documentElement.scrollHeight;
  /* SIN animacion, y esto no es un detalle: el CSS le pone
     scroll-behavior:smooth al html, asi que posicionar el escenario con un
     scrollTo normal deja una animacion de 10.000px EN VUELO. Esa animacion
     despues pisa el salto que se esta midiendo y el test reporta un bug que no
     existe — paso, y el numero era -127px. Un dedo de verdad no deja ninguna
     animacion pendiente.
     (Ojo con los acentos graves en estos comentarios: van adentro de un
     template literal y lo cierran.) */
  var _r = document.documentElement, _prev = _r.style.scrollBehavior;
  _r.style.scrollBehavior = 'auto';
  window.scrollTo(0, Math.max(0, alto - window.innerHeight - 40));
  _r.style.scrollBehavior = _prev;
  await dormir(320);
  var desde = Math.round(window.pageYOffset);
  anota(desde > 600, 'arranco scrolleado abajo (' + desde + 'px), que es donde el bug aparece');

  var inp = document.getElementById('buscador-input');
  if (!inp) { mal.push('no hay buscador'); return JSON.stringify({ ok: ok, mal: mal }); }

  inp.value = 'pizza';
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  await dormir(420);

  var visibles = [].slice.call(document.querySelectorAll(
    '#catalog-root .product-card[data-id]:not(.busq-oculto)'));
  anota(visibles.length > 0, 'la busqueda "pizza" encontro ' + visibles.length + ' productos');

  if (visibles.length) {
    var r = visibles[0].getBoundingClientRect();
    var sh = document.querySelector('.sticky-header');
    var tapa = sh ? sh.getBoundingClientRect().bottom : 0;

    /* Las DOS condiciones juntas, y no cada una por su lado: con el bug, el
       resultado queda 2188px ARRIBA de la pantalla y "top < innerHeight" da
       verde igual. Un ok falso es peor que un rojo.
       Y se exige ENTERO debajo de la barra: media card cortada arriba es
       justo lo que se siente como "me tiro a cualquier lado". */
    anota(r.top >= tapa - 2 && r.top < window.innerHeight,
      'el primer resultado se ve entero, justo debajo de la barra (a ' +
      Math.round(r.top) + 'px, la barra termina en ' + Math.round(tapa) + ')');
  }

  /* Y el buscador tiene que seguir a la vista: si el que escribio no ve lo
     que escribio, no sabe si el filtro esta puesto. */
  var rb = inp.getBoundingClientRect();
  anota(rb.top >= -1 && rb.bottom <= window.innerHeight + 1,
    'el buscador sigue en pantalla mientras se busca');

  /* Que no haya quedado nada abajo del todo por un clampeo posterior. */
  await dormir(500);
  var quedo = Math.round(window.pageYOffset);
  var fondo = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  anota(!(fondo > 40 && quedo >= fondo - 4),
    'no aterrizo pegado al final de la pagina (quedo en ' + quedo + ' de ' + fondo + ')');

  /* ── 3. SEGUIR ESCRIBIENDO NO PUEDE TIRARTE ABAJO ─────────────────
     Cada tecla achica mas la lista. Si el arreglo solo corrigiera la
     primera, la segunda volveria a clampear. */
  inp.value = 'pizza muzza';
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  await dormir(420);
  var v2 = document.querySelector('#catalog-root .product-card[data-id]:not(.busq-oculto)');
  if (v2) {
    var r2 = v2.getBoundingClientRect();
    var sh2 = document.querySelector('.sticky-header');
    anota(r2.bottom > (sh2 ? sh2.getBoundingClientRect().bottom : 0) && r2.top < window.innerHeight,
      'al seguir escribiendo, el resultado sigue a la vista');
  }

  /* ── 4. LO QUE SE TOCA CON EL DEDO ────────────────────────────────
     44px es el minimo de Apple. Se miran solo los controles del flujo de
     busqueda, que es lo que se esta arreglando. */
  var chicosTactil = [];
  [].slice.call(document.querySelectorAll(
    '.buscador-x, .buscador-limpiar, .cat-nav-btn')).forEach(function (b) {
    var rr = b.getBoundingClientRect();
    if (rr.width < 1 && rr.height < 1) return;          // oculto: no se toca
    if (rr.height < 43.5) chicosTactil.push((b.className || b.tagName) + ' ' + Math.round(rr.height) + 'px');
  });
  anota(chicosTactil.length === 0,
    'los controles del buscador llegan a 44px' + (chicosTactil.length ? '' : ''));
  chicosTactil.forEach(function (c) { mal.push('control de ' + c + ' — no se toca bien con el dedo'); });

  /* Y limpiar tiene que devolver el catalogo entero. */
  var limpiar = document.querySelector('.buscador-limpiar') || document.getElementById('buscador-x');
  if (limpiar) limpiar.click();
  await dormir(320);
  anota(!document.body.classList.contains('busqueda-activa'),
    'limpiar devuelve el catalogo completo');

  return JSON.stringify({ ok: ok, mal: mal });
})()`;

(async () => {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }

  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'movil-'));
  const puertoCdp = 9500 + Math.floor(Math.random() * 400);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    'about:blank'], { stdio: 'ignore' });

  const limpiar = () => {
    try { proc.kill(); } catch (e) {}
    try { srv.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  };

  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');
    /* Un iPhone de verdad: 390x844, touch, y los media queries de celular
       aplicando. Sin `mobile: true` la pagina se comporta como un escritorio
       angosto, que NO es lo mismo. */
    await cli.enviar('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await cli.enviar('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });

    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html' });

    /* Esperar al catalogo pintado, no a un tiempo fijo: medir una pagina que
       no llego a pintar da "0 problemas" sin haber mirado nada. */
    let listo = false;
    for (let i = 0; i < 100; i++) {
      const r = await cli.enviar('Runtime.evaluate', { returnByValue: true,
        expression: "document.querySelectorAll('#catalog-root .product-card[data-id]').length" });
      if (r.result && r.result.value > 5) { listo = true; break; }
      await new Promise((s) => setTimeout(s, 150));
    }
    if (!listo) { console.log(RED + '  MAL  el catalogo no llego a pintar' + RST); limpiar(); process.exit(1); }
    await new Promise((s) => setTimeout(s, 600));

    const zr = await cli.enviar('Runtime.evaluate', {
      expression: ELEGIR_ZONA, awaitPromise: true, returnByValue: true });
    const zona = JSON.parse(zr.result.value || '{}');
    if (zona.abierto || zona.error || zona.scrollable < 400) {
      console.log(RED + '  MAL  el modal de bienvenida no se cerro' + RST +
        ' — sin eso el body queda en overflow:hidden y la pagina NO scrollea,\n' +
        '       asi que todo lo de abajo daria verde sin haber medido nada.');
      console.log(DIM + '       ' + JSON.stringify(zona) + RST);
      limpiar(); process.exit(1);
    }
    console.log(DIM + '  ·    entre como un cliente: ' + zona.pasos.join(' → ') + RST);
    await new Promise((s) => setTimeout(s, 400));

    const res = await cli.enviar('Runtime.evaluate', {
      expression: REVISION, awaitPromise: true, returnByValue: true });
    if (res.exceptionDetails) {
      console.log(RED + '  MAL  la revision reviento: ' +
        (res.exceptionDetails.exception && res.exceptionDetails.exception.description ||
         res.exceptionDetails.text) + RST);
      limpiar(); process.exit(1);
    }

    const { ok, mal } = JSON.parse(res.result.value);
    ok.forEach((t) => console.log(VER + '  ok   ' + RST + t));
    mal.forEach((t) => console.log(RED + '  MAL  ' + RST + t));
    console.log('\n  ' + ok.length + ' ok · ' + mal.length + ' mal   ' + DIM + '(iPhone 390x844)' + RST + '\n');

    limpiar();
    process.exit(mal.length ? 1 : 0);
  } catch (e) {
    console.error(RED + 'Se rompio: ' + e.message + RST);
    limpiar(); process.exit(1);
  }
})();
