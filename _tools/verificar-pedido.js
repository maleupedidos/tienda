/**
 * Que el pedido que arma la tienda ENTRE bien en la planilla.
 *
 *   node _tools/verificar-pedido.js
 *
 * POR QUE EXISTE. La tienda no escribe en el Sheets: le manda un JSON al Apps
 * Script y ese JSON tiene que hablar el idioma del backend. Si un id de
 * producto no esta en el mapa de columnas de su hoja, el backend **lo cobra y
 * no lo guarda**: el pedido entra, el total es correcto, y la cantidad no cae
 * en ningun lado. No hay error, no hay log, no hay nada.
 *
 * Es la misma forma de fallar que ya se pago dos veces del lado del ERP: el
 * `editarPedido` que cobraba 16 productos sin guardarlos, y el `setValues`
 * corrido de columna en la hoja OC.
 *
 * QUE HACE. Abre la tienda en un Chrome de verdad, arma un carrito, completa
 * el formulario y aprieta el boton. **El POST se intercepta**: no sale a
 * internet y no toca la planilla. Despues agarra ese JSON y lo cruza contra
 * los mapas REALES del backend (`HOME_PRODUCT_COLS`, `PAGE_ID_TO_ABBR`,
 * `RED_PRODUCT_COLS`, `CLUBES_PRODUCT_COLS`), leidos del `Code.js` publicado
 * — no contra una copia escrita aca, que se despegaria sola.
 *
 * Dos escenarios:
 *   · sin carne  — es como esta produccion HOY (el endpoint de piezas todavia
 *                  no existe). Tiene que dar TODO verde: es el gate del deploy.
 *   · con carne  — como va a quedar. Lo que falte del lado del BACKEND se
 *                  lista aparte y no corta, porque no se arregla desde este
 *                  repo; lo que este mal en la TIENDA si corta.
 *
 * Sale con codigo 1 si algo de la tienda esta mal.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const CODE_JS = path.resolve(RAIZ, '..', 'estancias', '.clasp-src', 'Code.js');
const PUERTO = Number(process.env.PUERTO || 8177);
const RED = '\x1b[31m', VER = '\x1b[32m', AMA = '\x1b[33m', DIM = '\x1b[2m', RST = '\x1b[0m';

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

/* ── los mapas del backend, sacados del archivo publicado ───────────────── */
function mapasDelBackend() {
  if (!fs.existsSync(CODE_JS)) return null;
  const src = fs.readFileSync(CODE_JS, 'utf8');
  const sacar = (nombre) => {
    const i = src.indexOf('const ' + nombre + ' = {');
    if (i < 0) return null;
    const j = src.indexOf('\n};', i);
    if (j < 0) return null;
    const cuerpo = src.slice(i + ('const ' + nombre + ' = ').length, j + 2);
    try { return (new Function('return ' + cuerpo))(); } catch (e) { return null; }
  };
  return {
    home:   sacar('HOME_PRODUCT_COLS'),
    pilar:  sacar('PILAR_PRODUCT_COLS'),
    red:    sacar('RED_PRODUCT_COLS'),
    clubes: sacar('CLUBES_PRODUCT_COLS'),
    abbr:   sacar('PAGE_ID_TO_ABBR'),
  };
}

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
    srv.on('error', (e) => fallo(e.code === 'EADDRINUSE'
      ? new Error('El puerto ' + PUERTO + ' esta ocupado. Proba: PUERTO=8178 node _tools/verificar-pedido.js')
      : e));
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

/* El POST se guarda y NO SALE. sendBeacon devuelve false y el fetch queda
   colgado a proposito: asi la tienda no toma el camino de exito y no navega a
   wa.me en el medio de la medicion. */
function prep(piezas, zona) {
  return `(function () {
  try { localStorage.setItem('maleu_zone', '${zona || 'estancias'}'); } catch (e) {}
  var PIEZAS = ${JSON.stringify(piezas)};
  window.__post = null;
  navigator.sendBeacon = function () { return false; };
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    var u = String(url);
    if (opts && String(opts.method || '').toUpperCase() === 'POST') {
      window.__post = String(opts.body || '');
      return new Promise(function () {});
    }
    if (u.indexOf('action=piezas_full') >= 0) {
      return Promise.resolve(new Response(JSON.stringify(PIEZAS),
        { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return orig.apply(this, arguments);
  };
})();`;
}

/* Arma el carrito y aprieta el boton. Devuelve lo que se habria mandado. */
const COMPRAR = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };

  addToCart(5); addToCart(5);        // 2 Pack Muzzarella x2
  addToCart(11);                     // 1 Empanadas Carne a Cuchillo

  var carne = [];
  Object.keys(piezasMap || {}).forEach(function (abbr) {
    (piezasMap[abbr] || []).forEach(function (pz) { carne.push({ abbr: abbr, id: pz.id, kg: pz.kg }); });
  });
  /* Las TRES piezas: dos son del mismo corte a proposito, para que el pedido
     ejercite la suma de kilos de un corte con varias piezas. */
  carne.slice(0, 3).forEach(function (c) { togglePieza(c.abbr, c.id); });

  document.getElementById('f-nombre').value = 'PRUEBA Automatica';
  document.getElementById('f-telefono').value = '1155038905';
  var bp = document.getElementById('f-barrio-privado');
  bp.value = 'Estancias del Pilar'; bp.dispatchEvent(new Event('change'));
  await dormir(120);
  var ba = document.getElementById('f-barrio');
  ba.value = ba.options[1] ? ba.options[1].value : ''; ba.dispatchEvent(new Event('change'));
  document.getElementById('f-lote').value = '999';
  var dia = document.querySelector('#day-picker .dp-cell.available');
  if (!dia) return JSON.stringify({ error: 'el calendario no ofrece ningun dia' });
  dia.click();
  await dormir(150);
  var ef = document.querySelector('input[name="pago"][value="Efectivo"]')
        || document.querySelector('input[name="pago"]');
  ef.checked = true; ef.dispatchEvent(new Event('change'));
  await dormir(200);

  var esperado = {
    productos: productsSubtotal(), carne: piezasSubtotal(),
    piezasEnCarrito: Object.keys(piezaCart).length,
    pago: ef.value
  };

  enviarPedido();
  for (var i = 0; i < 40 && !window.__post; i++) await dormir(100);
  return JSON.stringify({ post: window.__post, esperado: esperado });
})()`;

const ESCENARIOS = [
  { nombre: 'sin carne (produccion hoy)', duro: true, piezas: {} },
  { nombre: 'con carne', duro: false, piezas: {
      CEn: [{ id: 'ENT-01', kg: 1.163 }],
      CVa: [{ id: 'VAC-01', kg: 1.064 }, { id: 'VAC-03', kg: 1.922 }] } },
];

function revisar(p, esp, mapas, conCarne) {
  const fallas = [], backend = [];
  const ok = (cond, msg) => { if (!cond) fallas.push(msg); };

  ok(p.canal === 'Home', 'el canal es "' + p.canal + '" y tendria que ser Home');
  ok(!!p.nombre && !!p.telefono, 'falta nombre o telefono');
  ok(!!p.lote && !!p.subBarrio, 'falta lote o sub barrio');
  ok(!!p.fechaEntrega && !!p.dia, 'falta el dia de entrega');
  ok(/^co_/.test(String(p.clientOrderId || '')), 'sin clientOrderId: el backend no puede deduplicar un reintento');
  ok(Array.isArray(p.items) && p.items.length > 0, 'el pedido va sin items');

  const items = p.items || [];
  const sumaItems = items.reduce((a, it) => a + (it.importe != null ? it.importe : it.precio * it.qty), 0);
  ok(Math.abs(sumaItems - p.subtotalSinDescuento) < 2,
     'los items suman ' + Math.round(sumaItems) + ' y el subtotal declarado es ' + p.subtotalSinDescuento);
  ok(Math.abs(p.subtotalSinDescuento - (esp.productos + esp.carne)) < 2,
     'el subtotal no coincide con lo que muestra el carrito');

  /* La regla del 10%: el backend la RECALCULA sobre subtotalSinDescuento, asi
     que si la tienda manda otro numero el cliente ve un total y la planilla
     guarda otro. Tadeo confirmo el 10/9 que la carne entra en el descuento. */
  if (esp.pago === 'Efectivo') {
    const debe = Math.round(p.subtotalSinDescuento * 0.10);
    ok(p.descuento === debe, 'el descuento es ' + p.descuento + ' y el backend va a recalcular ' + debe);
  }
  ok(Math.abs(p.total - (p.subtotalSinDescuento + (p.envio || 0) - p.descuento)) < 2,
     'el total no cierra: ' + p.total);

  const carne = items.filter((it) => it.unidad === 'kg');
  if (conCarne) {
    ok(carne.length === 2, 'la carne llega como ' + carne.length + ' item(s) y son 2 cortes');
    carne.forEach((c) => {
      ok(c.qty > 0 && c.qty < 100, c.abbr + ': la cantidad es ' + c.qty + ' — tiene que ser KILOS');
      ok(Math.round(c.qty * 1000) === c.qty * 1000, c.abbr + ': ' + c.qty + ' tiene mas precision que el gramo');
      ok(Array.isArray(c.piezas) && c.piezas.length > 0, c.abbr + ': no viajan los ids de las piezas');
    });
    const ent = carne.filter((c) => c.abbr === 'CEn')[0];
    ok(ent && ent.qty === 1.163, 'la entraña tendria que ir con 1.163 kg y va con ' + (ent ? ent.qty : '(nada)'));
    const vac = carne.filter((c) => c.abbr === 'CVa')[0];
    ok(vac && Math.abs(vac.qty - 2.986) < 0.0005, 'el vacio tendria que sumar 2.986 kg y va con ' + (vac ? vac.qty : '(nada)'));
  } else {
    ok(carne.length === 0, 'sin inventario de carne igual viajan ' + carne.length + ' item(s) por kilo');
  }

  /* El cruce que importa: cada id tiene que tener columna en su hoja. */
  if (mapas && mapas.home) {
    items.forEach((it) => {
      if (!mapas.home[it.id]) fallas.push('el producto ' + it.id + ' (' + it.nombre + ') NO tiene columna en la hoja Home: se cobra y no se guarda');
    });
  }
  if (mapas && mapas.abbr) {
    items.forEach((it) => {
      if (!mapas.abbr[it.id]) backend.push('PAGE_ID_TO_ABBR no conoce el id ' + it.id + ' (' + it.nombre + '). Tres efectos, ninguno da error:\n' +
        '       1. el COSTO no se suma  → el margen de ese pedido queda inflado\n' +
        '       2. la auto-reserva de Home corta (`_stockSuficienteParaPedidoHome` hace `if (!abbr) return false`)\n' +
        '          → un pedido con carne pierde la reserva del RESTO de los productos, justo el fin de semana\n' +
        '       3. no entra en el JSON de "Origen Detalle" → en ARMADO no se ve de donde sale');
    });
  }
  return { fallas, backend };
}

/* Un corte no puede ofrecerse en una zona cuyo canal no tenga donde guardarlo.
   Pilar deriva a la hoja Red cuando el barrio tiene vendedor, y eso lo decide
   el backend, no el cliente: por eso Pilar se mira contra Red tambien. */
function revisarZonas(cortes, mapas) {
  const problemas = [];
  if (!mapas) return problemas;
  const destino = { estancias: [['Home', mapas.home]],
                    pilar: [['Pilar', mapas.pilar], ['Red', mapas.red]],
                    clubes: [['Clubes', mapas.clubes]] };
  cortes.forEach((c) => {
    /* El default NO incluye clubes: esa zona no filtra `PRODUCTOS`, usa una
       lista aparte (`PRODUCTOS_CLUBES`), asi que un corte no puede aparecer
       ahi aunque no declare zonas. Ponerlo daba un problema inventado, y una
       herramienta con ruido se deja de mirar. */
    const zonas = c.zonas || ['estancias', 'pilar'];
    zonas.forEach((z) => {
      (destino[z] || []).forEach(([hoja, mapa]) => {
        if (mapa && !mapa[c.id]) {
          problemas.push(c.nombre + ' se ofrece en "' + z + '", y un pedido de ahi puede caer en la hoja ' +
            hoja + ', que no tiene columna para el id ' + c.id + ': se cobraria sin guardarse');
        }
      });
    });
  });
  return problemas;
}

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }

  const mapas = mapasDelBackend();
  if (!mapas) console.log(AMA + 'Aviso: no encontre el Code.js del ERP — el cruce contra las columnas se saltea.' + RST);
  else console.log(DIM + 'Mapas del backend leidos de ' + path.basename(CODE_JS) + RST);

  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-pedido-'));
  const puertoCdp = 9500 + Math.floor(Math.random() * 200);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=430,900', 'about:blank'], { stdio: 'ignore' });

  let malas = 0; const pendientesBackend = new Set();
  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');

    let guionPrevio = null;
    for (const esc of ESCENARIOS) {
      /* Se acumulan: sin sacar el anterior, el primer escenario le sigue
         contestando al segundo y los dos miden lo mismo. */
      if (guionPrevio) await cli.enviar('Page.removeScriptToEvaluateOnNewDocument', { identifier: guionPrevio });
      const r0 = await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: prep(esc.piezas) });
      guionPrevio = r0.identifier;
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html' });

      let listo = false;
      for (let i = 0; i < 60; i++) {
        const r = await cli.enviar('Runtime.evaluate', {
          expression: "typeof enviarPedido === 'function' && document.querySelectorAll('.cat-section').length > 0 && typeof piezasEstado !== 'undefined' && piezasEstado !== 'cargando'",
          returnByValue: true });
        if (r.result && r.result.value === true) { listo = true; break; }
        await new Promise((s) => setTimeout(s, 250));
      }
      if (!listo) { console.log(RED + '  MAL  ' + esc.nombre + ': la tienda no termino de cargar' + RST); malas++; continue; }
      await new Promise((s) => setTimeout(s, 400));

      const r = await cli.enviar('Runtime.evaluate', { expression: COMPRAR, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        console.log(RED + '  MAL  ' + esc.nombre + ': ' + r.exceptionDetails.text + RST); malas++; continue;
      }
      const o = JSON.parse(r.result.value);
      if (o.error) { console.log(RED + '  MAL  ' + esc.nombre + ': ' + o.error + RST); malas++; continue; }
      if (!o.post) { console.log(RED + '  MAL  ' + esc.nombre + ': el boton no disparo ningun POST' + RST); malas++; continue; }

      /* Que el escenario sea el que dice ser: sin este control, un fallo al
         inyectar el inventario pasa como verde sobre una tienda sin carne. */
      const conCarne = Object.keys(esc.piezas).length > 0;
      if (conCarne !== (o.esperado.piezasEnCarrito > 0)) {
        console.log(RED + '  MAL  ' + esc.nombre + ': el escenario no se aplico — piezas en el carrito: ' + o.esperado.piezasEnCarrito + RST);
        malas++; continue;
      }

      const p = JSON.parse(o.post);
      const { fallas, backend } = revisar(p, o.esperado, mapas, conCarne);
      backend.forEach((b) => pendientesBackend.add(b));

      if (fallas.length) {
        malas += fallas.length;
        console.log(RED + '  MAL  ' + esc.nombre + RST);
        fallas.forEach((f) => console.log('         ' + f));
      } else {
        console.log(VER + '  ok   ' + esc.nombre + RST + DIM + '  (' + p.items.length + ' items, subtotal ' +
          p.subtotalSinDescuento + ', descuento ' + p.descuento + ', total ' + p.total + ')' + RST);
      }
    }

    /* Las zonas donde se ofrece cada corte, leidas del catalogo de verdad. */
    const rc = await cli.enviar('Runtime.evaluate', {
      expression: "JSON.stringify(PRODUCTOS.filter(function(p){return p.cat==='Carnes';}).map(function(p){return {id:p.id,nombre:p.nombre,zonas:p.zonas||null};}))",
      returnByValue: true });
    const problemas = revisarZonas(JSON.parse(rc.result.value || '[]'), mapas);
    if (problemas.length) {
      malas += problemas.length;
      console.log(RED + '  MAL  zonas donde se ofrece la carne' + RST);
      problemas.slice(0, 6).forEach((f) => console.log('         ' + f));
      if (problemas.length > 6) console.log(DIM + '         (' + (problemas.length - 6) + ' mas del mismo tipo)' + RST);
    } else {
      console.log(VER + '  ok   ' + RST + 'cada corte se ofrece solo donde la planilla tiene columna para guardarlo');
    }

    /* Y que el filtro se cumpla EN LA PANTALLA, con el inventario cargado: el
       catalogo declara las zonas, pero quien las respeta es `_zonaPermite`.
       Que el dato este bien no prueba que la tienda lo use. */
    for (const zona of ['pilar', 'clubes']) {
      if (guionPrevio) await cli.enviar('Page.removeScriptToEvaluateOnNewDocument', { identifier: guionPrevio });
      const rz = await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: prep(ESCENARIOS[1].piezas, zona) });
      guionPrevio = rz.identifier;
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html' });
      let ok = false;
      for (let i = 0; i < 60; i++) {
        const r = await cli.enviar('Runtime.evaluate', {
          expression: "document.querySelectorAll('.cat-section').length > 0 && typeof piezasEstado !== 'undefined' && piezasEstado !== 'cargando'",
          returnByValue: true });
        if (r.result && r.result.value === true) { ok = true; break; }
        await new Promise((s) => setTimeout(s, 250));
      }
      if (!ok) { console.log(RED + '  MAL  zona ' + zona + ': no cargo' + RST); malas++; continue; }
      await new Promise((s) => setTimeout(s, 500));
      const r = await cli.enviar('Runtime.evaluate', { returnByValue: true, expression:
        "JSON.stringify({cards: document.querySelectorAll('.carne-card').length," +
        " chip: !!document.querySelector('.cat-nav-btn[data-slug=\"carnes\"]')," +
        " sec: !!document.getElementById('cat-carnes')," +
        " piezas: (typeof piezasMap!=='undefined') ? Object.keys(piezasMap).length : -1})" });
      const z = JSON.parse(r.result.value);
      if (z.cards || z.chip || z.sec) {
        malas++;
        console.log(RED + '  MAL  en la zona ' + zona + ' la carne SIGUE a la vista' + RST +
          DIM + '  (cards ' + z.cards + ', chip ' + z.chip + ', seccion ' + z.sec + ')' + RST);
      } else {
        console.log(VER + '  ok   ' + RST + 'zona ' + zona + ': la carne no se ofrece' +
          DIM + '  (el inventario llego igual: ' + z.piezas + ' cortes)' + RST);
      }
    }
  } finally {
    try { proc.kill(); } catch (e) {}
    try { srv.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }

  if (pendientesBackend.size) {
    console.log(AMA + '\nEsto es del BACKEND (no se arregla desde este repo):' + RST);
    pendientesBackend.forEach((b) => console.log('   · ' + b));
  }
  if (malas) { console.log(RED + '\n' + malas + ' problema(s) en el pedido que arma la tienda' + RST); process.exit(1); }
  console.log(DIM + '\nel pedido llega con todo lo que el backend necesita para guardarlo' + RST);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
