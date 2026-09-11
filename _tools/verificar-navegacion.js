/**
 * Que los botones de categoria lleven a alguna parte.
 *
 *   node _tools/verificar-navegacion.js
 *
 * POR QUE EXISTE. El 10/9/2026 los diez botones del nav dejaron de andar y no
 * habia forma de enterarse sin abrir la tienda y tocarlos:
 *
 *   · `node --check` pasa      — el JS es perfecto
 *   · `verificar-llamadas` pasa — scrollToCat existe
 *   · no hay un solo error en consola
 *
 * `scrollToCat` arranca con `if (!section) return;`. Si la seccion no tiene el
 * id que el boton nombra, el boton no hace NADA, en silencio. Ese dia pasaba
 * porque los id los asignaba `renderCatNav()` despues del render, y un
 * repintado que no lo llamaba dejaba el catalogo entero sin id.
 *
 * QUE VERIFICA, en los tres escenarios que importan (con carne, con toda la
 * carne agotada, y con el inventario sin llegar — ahi Carnes no se dibuja):
 *
 *   1. cada chip del nav tiene su seccion
 *   2. cada tile de "Categorias" tiene su seccion
 *   3. cada seccion tiene su chip   (al reves: una categoria sin chip no se
 *      puede alcanzar desde arriba)
 *   4. cada boton pide el scroll al destino de SU seccion, no a la de al lado
 *      — el emparejamiento por posicion se corria cuando una categoria no
 *      tenia productos, y cada boton llevaba a otra
 *
 * El punto 4 se mide interceptando `window.scrollTo` y comparando lo que se
 * PIDE contra donde esta la seccion. No se mide donde termina el scroll: la
 * animacion suave tarda, y esperarla hace que el test mida su propia
 * impaciencia — dos intentos se fueron en eso.
 *
 * Sale con codigo 1 si algo falla.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.env.PUERTO || 8188);
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

/* Se inyecta antes que la tienda: la zona y la fecha ya elegidas (asi no hay
   que pelearse con los dos modales) y el inventario de carne del escenario.
   Ningun POST sale. */
function prep(piezas) {
  return `(function () {
  try {
    localStorage.setItem('maleu_zone', 'estancias');
  } catch (e) {}
  var PIEZAS = ${JSON.stringify(piezas)};
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    var u = String(url);
    if (opts && String(opts.method || '').toUpperCase() === 'POST') {
      return Promise.resolve(new Response('{"ok":true}', { status: 200 }));
    }
    if (u.indexOf('action=piezas_full') >= 0) {
      return Promise.resolve(new Response(JSON.stringify(PIEZAS),
        { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return orig.apply(this, arguments);
  };
})();`;
}

const REVISION = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  var fallas = [];
  var real = window.scrollTo.bind(window);
  var pedido = null;
  window.scrollTo = function (a, b) {
    var y = (typeof a === 'object' && a) ? a.top : b;
    if (typeof y === 'number') pedido = Math.round(y);
    return real.apply(window, arguments);
  };

  var chips = [].slice.call(document.querySelectorAll('.cat-nav-btn'))
    .map(function (b) { return b.dataset.slug; })
    .filter(function (s) { return s && s !== 'combos-ancla'; });
  var tiles = [].slice.call(document.querySelectorAll('.cat-tile')).map(function (b) {
    var m = (b.getAttribute('onclick') || '').match(/'(.+?)'/); return m ? m[1] : null;
  }).filter(Boolean);
  var secciones = [].slice.call(document.querySelectorAll('.cat-section'))
    .map(function (s) { return s.id; })
    .filter(function (id) { return id && id !== 'combos-ancla'; });

  if (!chips.length)     fallas.push('no hay un solo chip de categoria');
  if (!secciones.length) fallas.push('no hay una sola seccion de categoria');

  chips.forEach(function (c) {
    if (!document.getElementById('cat-' + c)) fallas.push('el chip "' + c + '" no tiene seccion: no hace nada al tocarlo');
  });
  tiles.forEach(function (t) {
    if (!document.getElementById('cat-' + t)) fallas.push('el tile "' + t + '" no tiene seccion: no hace nada al tocarlo');
  });
  secciones.forEach(function (id) {
    if (chips.indexOf(id.replace('cat-', '')) < 0) fallas.push('la seccion ' + id + ' no tiene chip: no se llega desde arriba');
  });

  for (var i = 0; i < chips.length; i++) {
    var s = chips[i];
    var sec = document.getElementById('cat-' + s);
    if (!sec) continue;
    var debe = Math.round(Math.max(0, sec.getBoundingClientRect().top + window.pageYOffset - _stickyOffsetPx()));
    pedido = null;
    document.querySelector('.cat-nav-btn[data-slug="' + s + '"]').click();
    await dormir(60);
    if (pedido === null) fallas.push(s + ': no pidio ningun scroll');
    else if (Math.abs(pedido - debe) > 5) fallas.push(s + ': pidio ' + pedido + ' y su seccion esta en ' + debe + ' (los id estan corridos)');
    await dormir(900);
  }
  window.scrollTo = real;
  return JSON.stringify({ chips: chips.length, tiles: tiles.length, secciones: secciones.length,
    tieneCarnes: chips.indexOf('carnes') >= 0, fallas: fallas });
})()`;

/* Los tres tienen que andar: el bug de los id corridos aparecia justo cuando
   una categoria no se dibujaba.

   Desde el 11/9/2026 un inventario VACIO ya no esconde la categoria: los
   cortes se muestran con "Sin stock" (Tadeo: "estaria bueno que avisemos").
   La que desaparece ahora es la del backend caido — no saber no es no haber.
   Por eso el caso "Carnes no se dibuja" pasa a ser ese, y el vacio es uno
   aparte, con la categoria a la vista. */
const ESCENARIOS = [
  { nombre: 'sin inventario (backend caido)', piezas: { ok: false, error: 'caido' }, carnes: false },
  { nombre: 'toda la carne agotada', piezas: {}, carnes: true },
  { nombre: 'con carne', carnes: true, piezas: {
      CEn: [{ id: 'x1', kg: 1.163 }],
      CVa: [{ id: 'x2', kg: 1.064 }, { id: 'x3', kg: 1.922 }] } },
];

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-nav-'));
  const puertoCdp = 9300 + Math.floor(Math.random() * 200);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });

  let malas = 0;
  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');

    let guionPrevio = null;
    for (const esc of ESCENARIOS) {
      /* Sacar el del escenario anterior: estos scripts se ACUMULAN, y si no se
         quita, el primero le sigue contestando al segundo. La primera version
         de esto daba verde con los dos escenarios midiendo lo mismo (8 chips
         y 8 chips) — o sea que el caso "con carne" no se ejercitaba nunca. */
      if (guionPrevio) await cli.enviar('Page.removeScriptToEvaluateOnNewDocument', { identifier: guionPrevio });
      const r0 = await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: prep(esc.piezas) });
      guionPrevio = r0.identifier;
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html' });
      // esperar a que el catalogo este dibujado
      let listo = false;
      for (let i = 0; i < 60; i++) {
        const r = await cli.enviar('Runtime.evaluate', {
          expression: "document.querySelectorAll('.cat-nav-btn').length > 0 && document.querySelectorAll('.cat-section').length > 0",
          returnByValue: true });
        if (r.result && r.result.value === true) { listo = true; break; }
        await new Promise((s) => setTimeout(s, 250));
      }
      if (!listo) { console.log(RED + '  MAL  ' + esc.nombre + ': la tienda no llego a dibujar el catalogo' + RST); malas++; continue; }

      /* Esperar a que el inventario de carne haya CONTESTADO, no un rato fijo.
         Con 1200 ms fijos el chequeo medía una pantalla a la que todavia no le
         habian llegado las piezas, y daba "la categoria Carnes no aparece"
         sobre una tienda que estaba perfecta. */
      for (let i = 0; i < 60; i++) {
        const r = await cli.enviar('Runtime.evaluate', {
          expression: "typeof piezasEstado !== 'undefined' && piezasEstado !== 'cargando'",
          returnByValue: true });
        if (r.result && r.result.value === true) break;
        await new Promise((s) => setTimeout(s, 250));
      }
      await new Promise((s) => setTimeout(s, 500));   // el repintado posterior

      const r = await cli.enviar('Runtime.evaluate', { expression: REVISION, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        console.log(RED + '  MAL  ' + esc.nombre + ': ' + r.exceptionDetails.text + RST); malas++; continue;
      }
      const o = JSON.parse(r.result.value);
      /* Que el escenario sea el que dice ser. Sin este control, un fallo al
         inyectar el inventario pasa como "todo verde" sobre una tienda que
         nunca mostro carne. */
      const conCarne = esc.carnes;
      const hayCarne = o.chips > 0 && o.secciones > 0 && o.tieneCarnes;
      if (conCarne !== hayCarne) {
        malas++;
        console.log(RED + '  MAL  ' + esc.nombre + ': el escenario no se aplico — la categoria Carnes ' +
          (hayCarne ? 'aparece y no deberia' : 'no aparece y deberia') + RST);
        continue;
      }
      if (o.fallas.length) {
        malas += o.fallas.length;
        console.log(RED + '  MAL  ' + esc.nombre + RST);
        o.fallas.forEach((f) => console.log('         ' + f));
      } else {
        console.log(VER + '  ok   ' + esc.nombre + RST + DIM +
          '  (' + o.chips + ' chips, ' + o.tiles + ' tiles, ' + o.secciones + ' secciones)' + RST);
      }
    }
  } finally {
    try { proc.kill(); } catch (e) {}
    try { srv.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }

  if (malas) { console.log(RED + '\n' + malas + ' problema(s) de navegacion' + RST); process.exit(1); }
  console.log(DIM + '\ntodos los botones de categoria llevan a su seccion' + RST);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
