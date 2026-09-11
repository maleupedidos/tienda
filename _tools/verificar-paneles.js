/**
 * Que la tienda se comporte como una aplicacion y no como un documento.
 *
 *   node _tools/verificar-paneles.js
 *   URL=https://maleu.com.ar node _tools/verificar-paneles.js   ← lo publicado
 *
 * POR QUE EXISTE. Lo pidio Tadeo el 10/9/2026, en tres partes, y las tres
 * fallan CALLADAS — no rompen nada, no tiran un error, y en una compu casi no
 * se notan:
 *
 *   · "cuando pongo ver pedido, lo que esta atras deberia estar estable y
 *     fijo, y no se deberia poder scrollear"
 *     Habia DOS mecanismos para frenar el fondo y solo uno funciona en el
 *     iPhone: el modal de zona usaba la clase `modal-open` (html + body +
 *     touch-action:none) y el carrito, el combo, el envio y el menu hacian
 *     `body.style.overflow='hidden'`, que Safari en iOS IGNORA.
 *
 *   · al unificarlos aparecio un bug PEOR que el original: con
 *     `html.modal-open{height:100%}` el documento se recorta y el navegador
 *     clampea el scroll a 0. Abrias el carrito mirando la mitad del catalogo,
 *     lo cerrabas, y aparecias arriba de todo. No se veia antes porque el
 *     unico que usaba esa clase era el modal de zona, que sale con el scroll
 *     ya en 0.
 *
 *   · "manteniendo una palabra puedo seleccionar y copiar"
 *     La interfaz no se selecciona. Pero el alias SI, porque la propia tienda
 *     dice "Copia el alias y transferi desde tu app": si se bloquea ahi y el
 *     boton Copiar falla, el cliente no puede pagar.
 *
 * Y de paso los chips del buscador, del mismo dia.
 *
 * EL CONTROL NO ES OPCIONAL. Si la rueda no mueve el fondo ni siquiera SIN
 * panel abierto, entonces "el fondo no se movio" no prueba nada: prueba que
 * el instrumento no sabe scrollear. El test CORTA en ese caso en vez de dar
 * verde. (Ya paso una vez en el ERP con page.mouse.wheel.)
 *
 * Sale con codigo 1 si algo falla.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.env.PUERTO || 8196);
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

/* Ningun POST hacia afuera, y `piezas_full` vacio: el test no depende de que
   el ERP tenga carne cargada hoy. */
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

/* Zona y fecha a mano, como una persona. Sembrar `maleu_zone` en
   localStorage NO alcanza: falta la fecha, el modal queda abierto, y con el
   modal abierto el fondo ya esta bloqueado — o sea que todo lo de abajo daria
   verde sin haber medido nada. */
const ELEGIR_ZONA = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  var z = [].slice.call(document.querySelectorAll('#loc-step-zone .loc-btn'))
    .filter(function (b) { return (b.getAttribute('onclick') || '').indexOf('estancias') >= 0; })[0];
  if (!z) return JSON.stringify({ error: 'no encontre el boton de Estancias' });
  z.click(); await dormir(500);
  var f = document.querySelector('#loc-dates-grid button:not([disabled])');
  if (f) f.click();
  await dormir(700);
  var ov = document.getElementById('loc-overlay');
  return JSON.stringify({
    abierto: !!(ov && getComputedStyle(ov).display !== 'none'),
    scrollable: document.documentElement.scrollHeight - window.innerHeight
  });
})()`;

const IR_A = (y) => `(function(){var r=document.documentElement,p=r.style.scrollBehavior;` +
  `r.style.scrollBehavior='auto';window.scrollTo(0,${y});r.style.scrollBehavior=p;` +
  `return Math.round(window.pageYOffset);})()`;
const POS = `Math.round(window.pageYOffset)`;

(async () => {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }

  const externo = process.env.URL || '';
  const srv = externo ? { close() {} } : await servir();
  const destino = externo || ('http://127.0.0.1:' + PUERTO + '/index.html');
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'paneles-'));
  const puertoCdp = 9600 + Math.floor(Math.random() * 300);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    'about:blank'], { stdio: 'ignore' });

  let ok = 0, mal = 0;
  const chk = (bien, texto) => { if (bien) { ok++; console.log(VER + '  ok   ' + RST + texto); }
                                 else { mal++; console.log(RED + '  MAL  ' + texto + RST); } };
  const limpiar = () => {
    try { proc.kill(); } catch (e) {}
    try { srv.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  };
  const cortar = (msg) => { console.log(RED + '  MAL  ' + msg + RST); limpiar(); process.exit(1); };

  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');
    await cli.enviar('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });

    const ev = async (expr, prom) => (await cli.enviar('Runtime.evaluate',
      { expression: expr, returnByValue: true, awaitPromise: !!prom })).result.value;
    const dormir = (ms) => new Promise((s) => setTimeout(s, ms));
    const rueda = async (y) => {
      await cli.enviar('Input.dispatchMouseEvent',
        { type: 'mouseWheel', x: 120, y: 500, deltaX: 0, deltaY: y, pointerType: 'mouse' });
      await dormir(450);
    };

    console.log(DIM + '  ·    midiendo ' + destino + RST);
    await cli.enviar('Page.navigate', { url: destino });

    let listo = false;
    for (let i = 0; i < 100; i++) {
      if (await ev("document.querySelectorAll('#catalog-root .product-card[data-id]').length") > 5) { listo = true; break; }
      await dormir(150);
    }
    if (!listo) cortar('el catalogo no llego a pintar');
    await dormir(500);

    const zona = JSON.parse(await ev(ELEGIR_ZONA, true) || '{}');
    if (zona.abierto || zona.error || zona.scrollable < 400) {
      cortar('el modal de bienvenida no se cerro — con el abierto el fondo YA esta bloqueado ' +
             'y todo lo de abajo daria verde sin medir nada  ' + JSON.stringify(zona));
    }

    /* ── EL CONTROL ─────────────────────────────────────────────────
       Si la rueda no mueve el fondo ni siquiera sin panel abierto, este
       test no puede medir nada y tiene que decirlo, no dar verde. */
    console.log('\n' + DIM + 'CONTROL' + RST);
    await ev(IR_A(1200)); await dormir(150);
    const c0 = await ev(POS);
    await rueda(900);
    const c1 = await ev(POS);
    if (c0 !== 1200 || c1 === c0) {
      cortar('la rueda no mueve el fondo NI SIN panel abierto (' + c0 + ' -> ' + c1 + '). ' +
             'El instrumento no sabe scrollear, asi que "no se movio" no probaria nada.');
    }
    chk(true, 'la rueda mueve el fondo cuando no hay nada abierto (' + c0 + ' -> ' + c1 + ')');

    /* ── EL FONDO QUIETO, PANEL POR PANEL ───────────────────────────── */
    console.log('\n' + DIM + 'EL FONDO SE QUEDA QUIETO' + RST);
    const PANELES = [
      { nombre: 'carrito', abrir: 'toggleCart()', cerrar: 'toggleCart()' },
      { nombre: 'menu',    abrir: 'toggleMenu()', cerrar: 'toggleMenu()' },
      { nombre: 'combo',   abrir: "_fondoQuieto('combo',true)", cerrar: "_fondoQuieto('combo',false)" },
      { nombre: 'envio',   abrir: 'showSendLoader()',           cerrar: 'hideSendLoader()' },
    ];
    for (const p of PANELES) {
      await ev(IR_A(1200)); await dormir(150);
      await ev(p.abrir); await dormir(350);
      const abierto = await ev(POS);
      const clase = await ev("document.documentElement.classList.contains('modal-open') && " +
                             "document.body.classList.contains('modal-open')");
      const taHtml = await ev("getComputedStyle(document.documentElement).touchAction");
      const taBody = await ev("getComputedStyle(document.body).touchAction");
      await rueda(900);
      const tras = await ev(POS);
      await ev(p.cerrar); await dormir(350);
      const cerrado = await ev(POS);
      chk(clase, p.nombre + ': marca html y body (el mecanismo que SI frena en iOS)');
      /* La rueda de una compu NO puede reproducir el bug de Tadeo: en el
         escritorio el que frena es `overflow:hidden`, y en el iPhone es
         `touch-action:none`. O sea que un verde en la linea de arriba
         convive perfectamente con el fondo scrolleandose en su telefono.
         Por eso esto se mide directo sobre la propiedad. */
      chk(taHtml === 'none' && taBody === 'none',
          p.nombre + ': html y body quedan en touch-action:none, que es lo unico que ' +
          'frena el DEDO en iOS (html:' + taHtml + ' body:' + taBody + ')');
      chk(tras === abierto, p.nombre + ': con el panel abierto la rueda no mueve el fondo (' + abierto + ' -> ' + tras + ')');
      chk(cerrado === 1200, p.nombre + ': al cerrar volves donde estabas (' + cerrado + ', esperado 1200)');
    }

    /* ── SUPERPONER ─────────────────────────────────────────────────
       Desde el carrito se va al formulario y encima aparece el overlay de
       envio. Si el bloqueo fuera un booleano, el primero que cierra le
       devolveria el scroll al fondo con el otro todavia abierto. */
    console.log('\n' + DIM + 'PANELES SUPERPUESTOS' + RST);
    const activo = () => ev("document.body.classList.contains('modal-open')");
    await ev('toggleCart()'); await dormir(250);
    await ev("_fondoQuieto('combo',true)"); await dormir(150);
    await ev("_fondoQuieto('combo',false)"); await dormir(150);
    chk(await activo(), 'cerrar el combo NO le saca el bloqueo al carrito');
    await ev("_fondoQuieto('combo',false)"); await dormir(150);
    chk(await activo(), 'un cierre de mas tampoco lo desbloquea');
    await ev('toggleCart()'); await dormir(250);
    chk(!(await activo()), 'con todo cerrado, el fondo vuelve a scrollear');

    /* ── ADENTRO DEL PANEL SI SE SCROLLEA ───────────────────────────
       `touch-action:none` sobre html y body apaga el dedo en toda la pagina.
       Sin volver a prenderlo en cada panel, el carrito largo queda muerto. */
    console.log('\n' + DIM + 'ADENTRO DEL PANEL SI SE SCROLLEA' + RST);
    const ta = async (sel) => ev("(function(){var e=document.querySelector('" + sel + "');" +
      "return e?getComputedStyle(e).touchAction:'(no existe)';})()");
    for (const sel of ['.cart-body', '.menu-panel', '.cart-sidebar']) {
      const v = await ta(sel);
      chk(v === 'pan-y', sel + ' deja scrollear con el dedo (touch-action: ' + v + ')');
    }
    const ob = await ev("getComputedStyle(document.querySelector('.cart-body')).overscrollBehaviorY");
    chk(ob === 'contain', '.cart-body no le pasa el scroll al fondo al llegar al final (' + ob + ')');

    /* ── NO SE SELECCIONA LA INTERFAZ, SI EL ALIAS ─────────────────── */
    console.log('\n' + DIM + 'SELECCION DE TEXTO' + RST);
    const us = async (sel) => ev("(function(){var e=document.querySelector('" + sel + "');" +
      "return e?getComputedStyle(e).userSelect:'(no existe)';})()");
    for (const sel of ['body', '.add-btn', '.cat-nav-btn']) {
      const v = await us(sel);
      chk(v === 'none', sel + ' no se selecciona (' + v + ')');
    }
    for (const sel of ['#buscador-input', '#mp-alias', '#mp-alias-vendedor-note']) {
      const v = await us(sel);
      chk(v === 'text', sel + ' SI se puede copiar — sin esto el cliente no puede pagar (' + v + ')');
    }

    /* ── SE BUSCA EL PRODUCTO, NO SU DESCRIPCION ──────────────
       Tadeo, 10/9/2026: buscaba "cebolla" y le salia el sorrentino de cordero,
       porque su descripcion dice "cordero, zanahoria, apio, cebolla". */
    console.log('\n' + DIM + 'SE BUSCA EL PRODUCTO, NO SU DESCRIPCION' + RST);
    const buscar = async (q) => {
      await ev("(function(){document.getElementById('buscador-input').value='" + q + "';" +
               "buscarEnCatalogo();})()");
      await dormir(250);
      return JSON.parse(await ev(`JSON.stringify({
        chips: [].slice.call(document.querySelectorAll('.busq-chip')).map(function(b){return b.textContent;}),
        productos: [].slice.call(document.querySelectorAll('#catalog-root .product-card[data-id]:not(.busq-oculto)'))
          .map(function(c){var p=PROD_MAP[c.dataset.id]||COMBO_MAP[c.dataset.id];return p?p.nombre:'';})
          .filter(Boolean),
        porDescripcion: !!document.querySelector('.busq-porque')
      })`));
    };

    const ceb = await buscar('cebolla');
    chk(ceb.productos.length === 3,
        '"cebolla" trae 3 y no 4 (' + ceb.productos.length + ')');
    chk(!ceb.productos.some((n) => /cordero/i.test(n)),
        'el sorrentino de cordero YA NO sale en "cebolla" — su descripcion decia cebolla');
    chk(ceb.productos.every((n) => /cebolla/i.test(n)),
        'los 3 que quedan se llaman cebolla: ' + ceb.productos.join(' · '));
    chk(!ceb.porDescripcion, '"cebolla" no necesita el respaldo por descripcion');

    /* El respaldo: sin el, buscar un ingrediente que no es el nombre de nada
       daria "no encontramos nada" sobre un producto que existe. */
    const zan = await buscar('zanahoria');
    chk(zan.productos.length === 1 && /cordero/i.test(zan.productos[0] || ''),
        '"zanahoria" igual encuentra el cordero, por el respaldo (' + zan.productos.join(' · ') + ')');
    chk(zan.porDescripcion, 'y la pantalla avisa que ese resultado vino de la descripcion');

    const nada = await buscar('xyzqw');
    chk(nada.productos.length === 0, 'algo que no existe sigue sin traer nada');

    /* ── EL BUSCADOR NOMBRA LO QUE ENCONTRO ─────────────────── */
    console.log('\n' + DIM + 'EL BUSCADOR NOMBRA LO QUE ENCONTRO' + RST);
    chk(ceb.chips.length === 3, '"cebolla" nombra los 3 en vez de contarlos (' + ceb.chips.join(' · ') + ')');

    /* Relevancia: el que matchea en el NOMBRE le gana al que matchea por la
       categoria. Con "pizza", las individuales se llaman Pizza; los packs
       entran por su categoria "Pack Pizzas x2". */
    const piz = await buscar('pizza');
    const primeras = piz.chips.slice(0, 5).join(' ');
    chk(!/x2/.test(primeras),
        'con "pizza" las que SE LLAMAN pizza van antes que los packs (' + piz.chips.slice(0, 3).join(' · ') + ')');

    const jam = await buscar('jam');
    chk(jam.chips.length === new Set(jam.chips).size,
        '"jam" no repite ningun chip: los cortos que chocarian vuelven al nombre completo');

    /* Coherencia: adentro de una categoria, o se acortan todos o ninguno. */
    const indiv = piz.chips.filter((c) => /margarita|caramelizada|muzzarella|morron/i.test(c));
    const conPref = indiv.filter((c) => /^pizza/i.test(c)).length;
    chk(indiv.length > 1 && (conPref === 0 || conPref === indiv.length),
        'las pizzas individuales se nombran igual entre si (' + indiv.join(' · ') + ')');

    /* Y que el chip LLEVE a la card. */
    await buscar('cebolla');
    await ev(IR_A(0)); await dormir(150);
    const fue = await ev("(function(){var c=[].slice.call(document.querySelectorAll('.busq-chip'))" +
      ".filter(function(b){return /azul/i.test(b.textContent);})[0];if(!c)return false;c.click();return true;})()");
    await dormir(700);
    const salto = JSON.parse(await ev(`JSON.stringify((function(){
      var m=document.querySelector('.product-card.busq-destaca');
      var r=m?m.getBoundingClientRect():null;
      var sh=document.querySelector('.sticky-header').getBoundingClientRect();
      return { hay:!!m, top:r?Math.round(r.top):null, barra:Math.round(sh.bottom),
               y:Math.round(window.pageYOffset),
               foco: document.activeElement.id };
    })())`));
    chk(fue && salto.y > 0, 'tocar un chip te lleva a su producto (scroll ' + salto.y + ')');
    chk(salto.hay, 'la card queda destacada, asi sabes donde aterrizaste');
    chk(salto.top !== null && salto.top >= salto.barra - 12,
        'y no queda tapada por la barra pegada (card en ' + salto.top + ', barra termina en ' + salto.barra + ')');
    chk(salto.foco !== 'buscador-input', 'suelta el foco del buscador, asi el teclado no tapa media pantalla');

    console.log('\n' + (mal ? RED : VER) + ok + ' ok · ' + mal + ' mal' + RST +
                DIM + '   (iPhone 390x844)' + RST);
    limpiar();
    process.exit(mal ? 1 : 0);
  } catch (e) {
    console.error(RED + 'reviento: ' + e.message + RST);
    limpiar();
    process.exit(1);
  }
})();
