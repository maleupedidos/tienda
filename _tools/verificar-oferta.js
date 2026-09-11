/**
 * La oferta de la tanda anterior, en la carne (11/9/2026).
 *
 *   node _tools/verificar-oferta.js [ancho]      (390 por defecto)
 *
 * POR QUE EXISTE. La carne fresca dura dos semanas y cada semana entra una
 * tanda nueva. La pieza de la tanda anterior va PRIMERO y, si el margen lo
 * aguanta, con el precio de lista tachado. Los dos datos los manda el backend
 * en `piezas_full`: `v` (no es de la ultima tanda) y `of` (el % de oferta).
 *
 * Falla en silencio de cuatro formas, y cada una tiene su chequeo:
 *   · el precio del carrito no es el que se mostro      → se cobra otra cosa
 *   · la oferta no llega al pedido                       → la planilla guarda otro total
 *   · un `of` basura (90, "abc", -5) se toma en serio    → carne al 10% por un tipeo
 *   · cambia solo el % y el catalogo no se repinta       → se ve el precio de antes
 *
 * Y un quinto, que es el mas importante: SIN `v` ni `of` —como responde el
 * backend hasta que publique su parte— la tienda tiene que quedar EXACTAMENTE
 * como antes. Es el escenario "hoy", y es el que gatea el deploy.
 *
 * NADA SALE A INTERNET QUE ESCRIBA: el inventario de carne se contesta desde la
 * pagina, el POST del pedido lo responde CDP con un ok falso, y el salto a
 * WhatsApp se corta. El stock de los otros productos si viene de produccion
 * (es un GET, no escribe nada).
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

/* path.resolve y no path.join: path.join normaliza a barras invertidas en
   Windows, y un RAIZ que llega por variable con barras normales no pasa el
   startsWith del servidor — todo da 404 y el test culpa a la tienda. */
const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = 8300 + Math.floor(Math.random() * 90);
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

/* ── los inventarios ────────────────────────────────────────────────────── */

/* Como responde el backend HOY: sin `v` ni `of`. */
const HOY = {
  CEn: [{ id: 'P-0001', kg: 1.163 }],
  CVa: [{ id: 'P-0003', kg: 1.241 }, { id: 'P-0002', kg: 1.064 },
        { id: 'P-0005', kg: 1.383 }, { id: 'P-0004', kg: 1.922 }],
};

/* Como va a responder: la tanda del 10/9 es la vieja, la de hoy la nueva.
   Van DESORDENADAS a proposito: el orden lo tiene que poner la tienda.
   La entraña vieja viene con `v` y SIN `of`: es el caso en que el margen no
   aguanta la oferta, y tiene que ir primera igual, sin tachado. */
const CON_OFERTA = {
  CEn: [{ id: 'P-0006', kg: 0.9 }, { id: 'P-0001', kg: 1.163, v: 1 }],
  CVa: [{ id: 'P-0007', kg: 1.1 },
        { id: 'P-0002', kg: 1.064, v: 1, of: 5 }, { id: 'P-0003', kg: 1.241, v: 1, of: 5 },
        { id: 'P-0008', kg: 0.95 },
        { id: 'P-0004', kg: 1.922, v: 1, of: 5 }, { id: 'P-0005', kg: 1.383, v: 1, of: 5 }],
};

/* Lo mismo pero con el % cambiado: mismos ids, mismos pesos. Es lo que pasa
   cuando alguien toca el porcentaje en Config_Maleu. */
const OFERTA_10 = JSON.parse(JSON.stringify(CON_OFERTA));
OFERTA_10.CVa.forEach((pz) => { if (pz.of) pz.of = 10; });

/* Basura: nada de esto puede convertirse en oferta. */
const BASURA = {
  CVa: [{ id: 'X1', kg: 1, of: 90 }, { id: 'X2', kg: 1.2, of: 'abc' },
        { id: 'X3', kg: 0.8, of: -5 }, { id: 'X4', kg: 1.1, of: 2.5 }],
};

/* ── infraestructura ────────────────────────────────────────────────────── */
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
  const listo = new Promise((r, j) => {
    ws.addEventListener('open', r);
    ws.addEventListener('error', () => j(new Error('no conecta con Chrome')));
  });
  return { listo, on: (f) => oyentes.push(f), enviar: (m, p) => new Promise((ok, mal) => {
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
const dormir = (ms) => new Promise((s) => setTimeout(s, ms));

/* El inventario se contesta DESDE LA PAGINA y es mutable (`window.__PIEZAS`):
   asi el escenario del refresco puede cambiarlo sin recargar. */
function prep(piezas) {
  return `(function () {
  try { localStorage.setItem('maleu_zone', 'estancias'); } catch (e) {}
  window.__PIEZAS = ${JSON.stringify(piezas)};
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    var u = String(url);
    var metodo = String((opts && opts.method) || 'GET').toUpperCase();
    if (metodo === 'GET' && u.indexOf('action=piezas_full') >= 0) {
      return Promise.resolve(new Response(JSON.stringify(window.__PIEZAS),
        { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return orig.apply(this, arguments);
  };
})();`;
}

/* Lo que se ve de cada corte. Se lee del DOM, que es lo que ve el cliente. */
const LEER_CARNE = `JSON.stringify((function () {
  var out = {};
  document.querySelectorAll('.carne-card').forEach(function (card) {
    var id = card.getAttribute('data-id');
    var prod = PRODUCTOS.filter(function (p) { return String(p.id) === id; })[0];
    if (!prod || out[prod.abbr]) return;
    out[prod.abbr] = {
      precioKg: prod.precio,
      chapa: !!card.querySelector('.chapa-oferta'),
      quedan: ((card.querySelector('.pz-quedan') || {}).textContent || '').trim(),
      filas: [].map.call(card.querySelectorAll('.pz-fila'), function (f) {
        var kgEl = f.querySelector('.pz-kg');
        var pr = f.querySelector('.pz-precio');
        var s = pr ? pr.querySelector('s') : null;
        var r = f.getBoundingClientRect();
        return {
          kg: kgEl && kgEl.firstChild ? String(kgEl.firstChild.textContent).trim() : '',
          off: ((f.querySelector('.pz-off') || {}).textContent || '').trim(),
          antes: s ? s.textContent.trim() : '',
          precio: pr && pr.lastChild ? String(pr.lastChild.textContent).trim() : '',
          alto: Math.round(r.height),
          desborda: f.scrollWidth > f.clientWidth + 1,
          aria: f.getAttribute('aria-label') || ''
        };
      })
    };
  });
  return out;
})())`;

const num = (t) => Number(String(t || '').replace(/[^\d]/g, '')) || 0;
const kgNum = (t) => Number(String(t || '').replace(' kg', '').replace(',', '.'));

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-oferta-'));
  const puertoCdp = 9700 + Math.floor(Math.random() * 90);
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
    await cli.enviar('Network.enable');
    await cli.enviar('Emulation.setDeviceMetricsOverride',
      { width: ANCHO, height: ALTO, deviceScaleFactor: ANCHO < 700 ? 3 : 1, mobile: ANCHO < 700 });

    /* El POST del pedido y el salto a WhatsApp se anotan ACA, fuera de la
       pagina: al enviar, la tienda navega y cualquier variable de la pagina
       se pierde. Los GET a Apps Script siguen de largo (el stock). */
    let posts = [], wa = [];
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*script.google.com*' },
      { urlPattern: '*wa.me*' }, { urlPattern: '*whatsapp*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const r = m.params.request;
      try {
        if (/wa\.me|whatsapp/.test(r.url)) {
          wa.push(r.url);
        } else if (r.method !== 'POST') {
          await cli.enviar('Fetch.continueRequest', { requestId: m.params.requestId });
          return;
        } else {
          posts.push(r.postData || '');
        }
        await cli.enviar('Fetch.fulfillRequest', {
          requestId: m.params.requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' },
                            { name: 'Access-Control-Allow-Origin', value: '*' }],
          body: Buffer.from('{"ok":true,"interceptado":true}').toString('base64'),
        });
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

    let guion = null;
    const abrir = async (piezas) => {
      if (guion) await cli.enviar('Page.removeScriptToEvaluateOnNewDocument', { identifier: guion });
      guion = (await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: prep(piezas) })).identifier;
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?of=' + Date.now() });
      for (let i = 0; i < 200; i++) {
        if (await ev("typeof hayPiezas === 'function' && hayPiezas() && !!document.querySelector('.carne-card .pz-fila')").catch(() => false)) break;
        await dormir(100);
      }
      await dormir(400);
      return JSON.parse(await ev(LEER_CARNE));
    };

    // ── 1. HOY: sin v ni of, la tienda queda como antes ───────────────────
    console.log('\n' + DIM + '== 1. Como responde el backend HOY (sin v ni of) — ' + ANCHO + 'px ==' + RST);
    let c = await abrir(HOY);
    chk(!!c.CVa && !!c.CEn, 'se dibujan los dos cortes con piezas (vacio y entraña)');
    if (c.CVa) {
      const kgs = c.CVa.filas.map((f) => kgNum(f.kg));
      chk(JSON.stringify(kgs) === JSON.stringify([1.064, 1.241, 1.383, 1.922]),
          'el vacio sigue de la mas chica a la mas grande: ' + kgs.join(' · '));
      chk(c.CVa.filas.every((f) => !f.off && !f.antes), 'ninguna pieza dice OFF ni muestra un tachado');
      chk(!c.CVa.chapa && !c.CEn.chapa, 'ninguna foto dice "Oferta"');
      chk(!/oferta/i.test(c.CVa.quedan), 'el contador no habla de ofertas: "' + c.CVa.quedan + '"');
      chk(c.CVa.filas.every((f) => num(f.precio) === Math.round(kgNum(f.kg) * c.CVa.precioKg)),
          'cada precio es el peso por el kilo, como antes');
    }

    // ── 2. CON OFERTA: la vieja primero, y tachada ───────────────────────
    console.log('\n' + DIM + '== 2. Con la tanda anterior en oferta ==' + RST);
    c = await abrir(CON_OFERTA);
    const vac = c.CVa, ent = c.CEn;
    chk(!!vac && vac.filas.length === 6, 'el vacio muestra las 6 piezas' + (vac ? ' (' + vac.filas.length + ')' : ''));
    if (vac) {
      const kgs = vac.filas.map((f) => kgNum(f.kg));
      chk(JSON.stringify(kgs) === JSON.stringify([1.064, 1.241, 1.383, 1.922, 0.95, 1.1]),
          'primero las 4 viejas (de chica a grande), despues las nuevas: ' + kgs.join(' · '));
      const viejas = vac.filas.slice(0, 4), nuevas = vac.filas.slice(4);
      chk(viejas.every((f) => f.off === '5% OFF'), 'las 4 viejas dicen "5% OFF"');
      chk(nuevas.every((f) => !f.off && !f.antes), 'las 2 nuevas van a precio de lista, sin tachado');
      chk(viejas.every((f) => num(f.antes) === Math.round(kgNum(f.kg) * vac.precioKg)),
          'el tachado es el de lista (peso × kilo)');
      chk(viejas.every((f) => num(f.precio) === Math.round(kgNum(f.kg) * vac.precioKg * 95 / 100)),
          'y el que se paga es ese menos 5%, redondeado una sola vez');
      chk(vac.chapa, 'la foto del vacio dice "Oferta"');
      chk(/6 disponibles · 4 en oferta/.test(vac.quedan), 'el contador lo dice: "' + vac.quedan + '"');
      chk(viejas.every((f) => /en oferta/.test(f.aria) && /en vez de/.test(f.aria)),
          'el lector de pantalla dice cual se paga y cual es la referencia');
      chk(vac.filas.every((f) => f.alto >= 44), 'todas las filas miden 44px o mas (' + Math.min(...vac.filas.map((f) => f.alto)) + ')');
      chk(vac.filas.every((f) => f.alto <= 66), 'y ninguna se parte en tres renglones (' + Math.max(...vac.filas.map((f) => f.alto)) + 'px la mas alta)');
      chk(vac.filas.every((f) => !f.desborda), 'ninguna fila se sale de su caja');
    }
    if (ent) {
      const kgs = ent.filas.map((f) => kgNum(f.kg));
      chk(JSON.stringify(kgs) === JSON.stringify([1.163, 0.9]),
          'la entraña vieja va primera aunque pese mas: ' + kgs.join(' · '));
      chk(ent.filas.every((f) => !f.off && !f.antes), 'y sin tachado: el backend no le mando %');
      chk(!ent.chapa, 'la foto de la entraña no dice "Oferta"');
    }

    // ── 3. Elegirla: el carrito cobra lo que se mostro ───────────────────
    console.log('\n' + DIM + '== 3. Al elegirla ==' + RST);
    const carro = JSON.parse(await ev(`JSON.stringify((function () {
      togglePieza('CVa', 'P-0002');     // vieja, en oferta
      togglePieza('CVa', 'P-0007');     // nueva, de lista
      var g = document.querySelector('#cart-body .cart-item-carne');
      return { of: piezaCart['P-0002'], nu: piezaCart['P-0007'],
               carrito: g ? g.innerHTML : '', subtotal: piezasSubtotal(),
               chapa: !!document.querySelector('.carne-card .chapa-oferta') };
    })())`));
    const kgOf = 1.064, kgNu = 1.1;
    const precioKgV = vac ? vac.precioKg : 26000;
    const esperOf = Math.round(kgOf * precioKgV * 95 / 100), listaOf = Math.round(kgOf * precioKgV);
    const esperNu = Math.round(kgNu * precioKgV);
    chk(carro.of && carro.of.precio === esperOf, 'la pieza en oferta entra a ' + (carro.of && carro.of.precio) + ' (se esperaba ' + esperOf + ')');
    chk(carro.of && carro.of.lista === listaOf && carro.of.of === 5, 'y guarda su precio de lista y el %');
    chk(carro.nu && carro.nu.precio === esperNu && !carro.nu.of, 'la nueva entra a precio de lista: ' + (carro.nu && carro.nu.precio));
    chk(carro.subtotal === esperOf + esperNu, 'el subtotal de la carne suma las dos: ' + carro.subtotal);
    chk(/pz-antes/.test(carro.carrito), 'el carrito muestra el tachado');
    chk(carro.chapa, 'con 3 viejas todavia libres, la foto sigue diciendo "Oferta"');

    // ── 4. Si cambia el %: se repinta, y lo elegido NO cambia ────────────
    console.log('\n' + DIM + '== 4. Si alguien cambia el % en Config_Maleu ==' + RST);
    const tras = JSON.parse(await ev(`(async function () {
      window.__PIEZAS = ${JSON.stringify(OFERTA_10)};
      await fetchStock();
      var fila = [].filter.call(document.querySelectorAll('.carne-card .pz-fila'), function (f) {
        return /1,241/.test(f.textContent);
      })[0];
      return JSON.stringify({ off: fila ? ((fila.querySelector('.pz-off') || {}).textContent || '') : '(no esta)',
                              elegida: piezaCart['P-0002'] ? piezaCart['P-0002'].precio : null });
    })()`));
    chk(tras.off === '10% OFF', 'el catalogo se repinta solo con el % nuevo: "' + tras.off + '"');
    chk(tras.elegida === esperOf, 'la que ya estaba en el carrito conserva el precio que vio el cliente (' + tras.elegida + ')');

    // ── 5. El pedido: lo que viaja al ERP ────────────────────────────────
    console.log('\n' + DIM + '== 5. El pedido que llega al ERP ==' + RST);
    const resumen = JSON.parse(await ev(`(async function () {
      var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
      if (typeof goToForm === 'function') goToForm();
      await dormir(400);
      var set = function (id, v) { var e = document.getElementById(id); if (!e) return;
        e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
      set('f-nombre', 'PRUEBA Oferta'); set('f-telefono', '1155038905');
      var bp = document.getElementById('f-barrio-privado');
      if (bp) { bp.value = 'Estancias del Pilar'; bp.dispatchEvent(new Event('change')); }
      await dormir(150);
      var ba = document.getElementById('f-barrio');
      if (ba && ba.options[1]) { ba.value = ba.options[1].value; ba.dispatchEvent(new Event('change')); }
      set('f-lote', '999');
      var dia = document.querySelector('#day-picker .dp-cell.available');
      if (dia) dia.click();
      await dormir(200);
      var ef = document.querySelector('input[name="pago"][value="Efectivo"]');
      if (ef) { ef.checked = true; ef.dispatchEvent(new Event('change')); }
      await dormir(250);
      if (typeof updateFormSummary === 'function') updateFormSummary();
      var s = document.getElementById('form-summary');
      return JSON.stringify({ html: s ? s.innerHTML : '', dia: !!dia, ef: !!ef });
    })()`));
    chk(resumen.dia && resumen.ef, 'el formulario se pudo completar (dia y forma de pago)');
    chk(/pz-antes/.test(resumen.html), 'el resumen muestra el tachado en la linea del vacio');

    posts = []; wa = [];
    await ev('enviarPedido();');
    for (let i = 0; i < 60 && (!posts.length || !wa.length); i++) await dormir(150);
    let pedido = null;
    for (const b of posts) { try { const j = JSON.parse(b); if (j && j.items) { pedido = j; break; } } catch (e) { /* otro POST */ } }
    chk(!!pedido, 'el pedido salio (interceptado, no llego a la planilla)');
    if (pedido) {
      const carne = (pedido.items || []).filter((it) => it.unidad === 'kg');
      const it = carne.filter((x) => x.abbr === 'CVa')[0];
      chk(!!it, 'la carne viaja como un item por kilo');
      if (it) {
        chk(it.qty === Math.round((kgOf + kgNu) * 1000) / 1000, 'con los kilos de las dos piezas: ' + it.qty);
        chk(it.importe === esperOf + esperNu, 'y el importe con la oferta adentro: ' + it.importe);
        chk(it.ofertas && it.ofertas['P-0002'] === 5 && !it.ofertas['P-0007'],
            'dice que pieza fue en oferta: ' + JSON.stringify(it.ofertas || null));
        chk(Array.isArray(it.piezas) && it.piezas.every((x) => typeof x === 'string') && it.piezas.length === 2,
            'la lista de piezas sigue siendo de ids (el backend asigna con eso)');
      }
      const suma = (pedido.items || []).reduce((a, x) => a + (x.importe != null ? x.importe : x.precio * x.qty), 0);
      chk(Math.abs(suma - pedido.subtotalSinDescuento) < 2,
          'el subtotal que manda es la suma de los items: ' + pedido.subtotalSinDescuento);
      chk(pedido.descuento === Math.round(pedido.subtotalSinDescuento * 0.10),
          'y el 10% en efectivo va sobre ESE subtotal, que es lo que el backend recalcula: ' + pedido.descuento);
    }
    const texto = wa.length ? decodeURIComponent((wa[0].split('text=')[1] || '').replace(/\+/g, ' ')) : '';
    chk(!!texto, 'salto a WhatsApp (cortado)');
    chk(/1,064 kg 5% OFF \+ 1,100 kg/.test(texto), 'el mensaje dice cual pieza fue en oferta: ' +
        ((texto.match(/\(1,0[^)]*\)/) || [''])[0] || '(no esta)'));

    // ── 6. Basura: nada se convierte en oferta ───────────────────────────
    console.log('\n' + DIM + '== 6. Un % que no tiene sentido ==' + RST);
    c = await abrir(BASURA);
    if (c.CVa) {
      chk(c.CVa.filas.every((f) => !f.off && !f.antes), '90, "abc", -5 y 2,5 se ignoran: todo a precio de lista');
      const kgs = c.CVa.filas.map((f) => kgNum(f.kg));
      chk(JSON.stringify(kgs) === JSON.stringify([0.8, 1, 1.1, 1.2]), 'y sin `v` el orden es por peso: ' + kgs.join(' · '));
      chk(!c.CVa.chapa, 'la foto no dice "Oferta"');
    } else chk(false, 'el vacio no se dibujo');

  } finally {
    try { proc.kill(); } catch (e) { /* ya estaba */ }
    try { srv.close(); } catch (e) { /* ya estaba */ }
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* Chrome lo tiene tomado un rato */ }
  }

  console.log('\n  ' + (mal ? RED : VER) + bien + ' ok · ' + mal + ' mal' + RST + '\n');
  process.exit(mal ? 1 : 0);
}

main().catch((e) => { console.error(RED + 'ROTO: ' + e.message + RST); process.exit(1); });
