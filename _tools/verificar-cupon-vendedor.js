/* verificar-cupon-vendedor.js — el codigo del vendedor le deja el cliente A EL
 *
 *   node _tools/verificar-cupon-vendedor.js [ancho]
 *
 * La politica de Red (Joaco, 28/9/2026) le da a cada vendedor un codigo propio
 * —MARCOS10— con 10% off en la primera compra, y de ahi sale su bono de
 * $15.000 cuando ese cliente vuelve dentro de 60 dias. Todo eso depende de UNA
 * cosa: que el pedido diga quien lo trajo.
 *
 * Lo que se prueba, y por que cada caso:
 *
 *   1. MARCOS10 con `vendedor` => se guarda la atribucion, NO se marca "lo
 *      trajo Maleu", y el dato viaja en el pedido.
 *   2. MARCOS10 SIN `vendedor` (la validacion del backend no matcheo la hoja)
 *      => el descuento sale igual, pero NO se marca nuestro. Es la trampa del
 *      `else`: marcar "nuestro" por la ausencia del campo le sacaria el
 *      cliente al vendedor por un error de planilla.
 *   3. RULETA-XXXX => se marca nuestro, como desde el 24/9.
 *   4. EMPA20 => descuenta y no toca de quien es el cliente. Hasta el
 *      28/9/2026 NI SIQUIERA ENTRABA: el filtro pedia el prefijo RUL y salia
 *      con return en silencio. Un cliente real pago $18.000 sin su descuento.
 *   5. El primero que lo trajo no se pisa.
 *
 * El backend esta SIMULADO: no sale una sola consulta de verdad, y ningun POST.
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ANCHO = parseInt(process.argv[2] || '390', 10);
const ALTO = ANCHO < 700 ? 844 : 900;
const RAIZ = process.env.RAIZ || path.join(__dirname, '..');
const PUERTO = 8475;

let ok = 0, mal = 0;
const V = '\x1b[32m', R = '\x1b[31m', G = '\x1b[2m', F = '\x1b[0m';
function chk(c, t, e) {
  if (c) { ok++; console.log('  ' + V + 'ok   ' + F + t + (e ? G + '  (' + e + ')' + F : '')); }
  else { mal++; console.log('  ' + R + 'MAL  ' + t + F + (e ? G + '  (' + e + ')' + F : '')); }
}
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
function servir() {
  return new Promise((res) => {
    const s = http.createServer((req, rq) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
      const f = path.join(RAIZ, rel);
      if (!f.startsWith(path.resolve(RAIZ)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        rq.writeHead(404); rq.end('no'); return;
      }
      rq.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rq);
    });
    s.listen(PUERTO, '127.0.0.1', () => res(s));
  });
}
function cdp(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const { ok: o, mal: x } = pend.get(m.id); pend.delete(m.id);
      m.error ? x(new Error(m.error.message)) : o(m.result);
    }
  });
  return {
    listo: new Promise((r) => ws.addEventListener('open', r)),
    send: (m, p) => new Promise((o, x) => {
      const i = ++id; pend.set(i, { ok: o, mal: x });
      ws.send(JSON.stringify({ id: i, method: m, params: p || {} }));
    }),
    cerrar: () => ws.close(),
  };
}
async function esperarPagina(puerto) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + puerto + '/json/list');
      const p = (await r.json()).find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch (e) {}
    await dormir(250);
  }
  throw new Error('Chrome no abrio');
}

(async () => {
  console.log('\n' + G + 'verificar-cupon-vendedor.js — ' + ANCHO + 'px — raiz: ' + RAIZ + F + '\n');
  const srv = await servir();
  const perfil = path.join(os.tmpdir(), 'cv-' + Date.now());
  const chrome = spawn(process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9337', '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, '--no-first-run', '--disable-gpu',
  ], { stdio: 'ignore' });

  let c;
  try {
    c = cdp(await esperarPagina(9337));
    await c.listo;
    await c.send('Page.enable');
    await c.send('Runtime.enable');
    await c.send('Network.enable');
    await c.send('Network.setBlockedURLs', { urls: [
      '*googletagmanager*', '*google-analytics*', '*facebook.com*', '*facebook.net*',
      '*script.google.com*', '*script.googleusercontent.com*',
    ] });
    await c.send('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: ANCHO < 700 });

    const ev = async (expr) => {
      const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return r && r.result ? r.result.value : undefined;
    };

    /* Una visita con el backend simulado. `resp` es lo que contesta
       validarCupon; `limpiar` dice si se borra lo que quedo de antes. */
    /* OJO: los scripts de addScriptToEvaluateOnNewDocument SE ACUMULAN. Sin
       quitar el anterior, el `localStorage.clear()` de una visita seguia
       corriendo en las siguientes, y el caso "el primero que lo trajo no se
       pisa" medía sobre un storage recien borrado: daba rojo culpando a la
       tienda de algo que hacia bien. */
    let _guion = null;
    async function visitar(cod, resp, limpiar) {
      if (_guion) {
        await c.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: _guion });
        _guion = null;
      }
      const _r = await c.send('Page.addScriptToEvaluateOnNewDocument', {
        source:
          'window.__posts = [];' +
          (limpiar ? 'try { localStorage.clear(); } catch (e) {}' : '') +
          'try { localStorage.setItem("maleu_zone", "estancias"); } catch (e) {}' +
          '(function (of) {' +
          '  window.fetch = function (u, o) {' +
          '    var s = String(u);' +
          '    if ((o && (o.method || "").toUpperCase() === "POST")) {' +
          '      window.__posts.push(s);' +
          '      return Promise.resolve(new Response("{\\"ok\\":true}", { status: 200 }));' +
          '    }' +
          '    if (s.indexOf("validarCupon") >= 0) {' +
          '      return Promise.resolve(new Response(' + JSON.stringify(JSON.stringify(resp)) + ', { status: 200 }));' +
          '    }' +
          '    if (s.indexOf("script.google") >= 0) return Promise.resolve(new Response("{}", { status: 200 }));' +
          '    return of.apply(this, arguments);' +
          '  };' +
          '})(window.fetch);',
      });
      _guion = _r && _r.identifier;
      await c.send('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?cupon=' + cod });
      await dormir(2000);
    }

    const estado = () => ev(`(function () {
      var vt = null, on = null;
      try { vt = JSON.parse(localStorage.getItem('maleu_vendedor_trajo') || 'null'); } catch (e) {}
      try { on = JSON.parse(localStorage.getItem('maleu_origen') || 'null'); } catch (e) {}
      return JSON.stringify({
        vendedor: vt && vt.v ? vt.v : null,
        cuponDelVendedor: vt && vt.cupon ? vt.cupon : null,
        esNuestro: typeof _esNuestro === 'function' ? _esNuestro() : null,
        cupon: (typeof appliedCoupon !== 'undefined' && appliedCoupon) ? appliedCoupon.codigo : null,
        posts: (window.__posts || []).length
      });
    })()`);

    /* ── 1. el codigo del vendedor ── */
    console.log(G + '== MARCOS10: el cliente queda del vendedor ==' + F);
    await visitar('MARCOS10', { ok: true, codigo: 'MARCOS10', tipo: 'PCT', valor: 10,
                                scope: 'TODO', stack: false, vendedor: 'marcos' }, true);
    let e = JSON.parse(await estado());
    chk(e.cupon === 'MARCOS10', 'el cupon entra y se aplica', 'cupon: ' + e.cupon);
    chk(e.vendedor === 'marcos', 'queda registrado que lo trajo Marcos', 'vendedor: ' + e.vendedor);
    chk(e.esNuestro === false, 'y NO se marca como traido por Maleu — la venta es suya');
    chk(e.cuponDelVendedor === 'MARCOS10', 'se guarda con que codigo entro');

    const enviado = await ev(`(function () {
      var vt = _vendedorQueTrajo();
      return JSON.stringify({ v: vt ? vt.v : null, cup: vt ? vt.cupon : null });
    })()`);
    const en = JSON.parse(enviado);
    chk(en.v === 'marcos', 'y el pedido lo va a llevar al ERP', 'vendedorTrajo: ' + en.v);

    /* ── 2. LA TRAMPA DEL else ── */
    console.log('\n' + G + '== MARCOS10 sin `vendedor`: la validacion fallo en el backend ==' + F);
    await visitar('MARCOS10', { ok: true, codigo: 'MARCOS10', tipo: 'PCT', valor: 10,
                                scope: 'TODO', stack: false }, true);
    e = JSON.parse(await estado());
    chk(e.cupon === 'MARCOS10', 'CONTROL: el descuento le sale igual al cliente', 'cupon: ' + e.cupon);
    chk(e.esNuestro === false,
        'y NO se marca "lo trajo Maleu": un error de planilla no le saca el cliente al vendedor');
    chk(e.vendedor === null, 'tampoco se inventa una atribucion', 'vendedor: ' + e.vendedor);

    /* ── 3. la ruleta sigue igual ── */
    console.log('\n' + G + '== RULETA-K3P9: ese SI lo trajimos nosotros ==' + F);
    await visitar('RULETA-K3P9', { ok: true, codigo: 'RULETA-K3P9', tipo: 'PCT', valor: 15,
                                   scope: 'TODO', stack: false }, true);
    e = JSON.parse(await estado());
    chk(e.cupon === 'RULETA-K3P9', 'el premio entra', 'cupon: ' + e.cupon);
    chk(e.esNuestro === true, 'y se marca como nuestro, igual que desde el 24/9');
    chk(e.vendedor === null, 'sin vendedor: no se lo quitamos a nadie porque no era de nadie');

    /* ── 4. el cupon de campania, que hasta hoy NO ENTRABA ── */
    console.log('\n' + G + '== EMPA20: una campania de WATI ==' + F);
    await visitar('EMPA20', { ok: true, codigo: 'EMPA20', tipo: 'PCT', valor: 20,
                              scope: 'TODO', stack: false }, true);
    e = JSON.parse(await estado());
    chk(e.cupon === 'EMPA20',
        'entra y descuenta — antes del 28/9 el filtro lo rechazaba EN SILENCIO', 'cupon: ' + e.cupon);
    chk(e.esNuestro === false,
        'y NO se marca nuestro: le habla a la base que YA nos conoce, con los clientes de los vendedores adentro');
    chk(e.vendedor === null, 'ni se le atribuye a un vendedor');

    /* ── 5. el primero que lo trajo es el que vale ── */
    console.log('\n' + G + '== El primero que lo trajo no se pisa ==' + F);
    await visitar('MARCOS10', { ok: true, codigo: 'MARCOS10', tipo: 'PCT', valor: 10,
                                scope: 'TODO', stack: false, vendedor: 'marcos' }, true);
    await visitar('RUFO10', { ok: true, codigo: 'RUFO10', tipo: 'PCT', valor: 10,
                              scope: 'TODO', stack: false, vendedor: 'rufo' }, false);
    e = JSON.parse(await estado());
    chk(e.vendedor === 'marcos',
        'vuelve con el codigo de otro y sigue siendo de Marcos', 'vendedor: ' + e.vendedor);

    /* ── 6. una basura no entra ── */
    console.log('\n' + G + '== Lo que no tiene forma de codigo ni se consulta ==' + F);
    const consultas = await ev('0');
    await visitar('A', { ok: false, error: 'no deberia consultarse' }, true);
    e = JSON.parse(await estado());
    chk(e.cupon === null, 'un codigo de un solo caracter no se manda a validar', 'cupon: ' + e.cupon);

    /* ── 7. nada hacia afuera ── */
    console.log('\n' + G + '== Nada salio hacia afuera ==' + F);
    chk(e.posts === 0, 'ningun POST al backend', e.posts + ' posts');

  } catch (e) {
    mal++;
    console.log('  ' + R + 'MAL  el test reventó: ' + e.message + F);
  } finally {
    if (c) c.cerrar();
    chrome.kill();
    srv.close();
  }

  console.log('\n' + (mal === 0 ? V : R) + ok + ' ok · ' + mal + ' mal' + F + G + '  (' + ANCHO + 'px)' + F + '\n');
  process.exit(mal === 0 ? 0 : 1);
})();
