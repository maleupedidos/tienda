/**
 * Cuanta carne lleva en total (18/11/2026).
 *
 *   node _tools/verificar-carne-total.js [ancho]          (390 por defecto, local)
 *   URL=https://maleu.com.ar node _tools/verificar-carne-total.js 390   (la viva)
 *   REINYECTAR=1 node _tools/verificar-carne-total.js     (con el bug: tiene que dar MAL)
 *
 * POR QUE EXISTE. Un cliente armando el asado: «cuando alguien va sumando cortes
 * de carne, es clave saber cuantos kilos esta comprando en total». Cada corte
 * decia sus kilos; la suma no estaba en ningun lado. Ahora:
 *   · el aviso al agregar la segunda pieza dice "llevás X kg de carne";
 *   · el carrito tiene "Carne en total" arriba del subtotal, solo con carne;
 *   · el resumen del checkout dice lo mismo;
 *   · con una reserva (sin pesar) dice "aprox." y redondea al decimo.
 *
 * CON EL INVENTARIO REAL: las piezas y el catalogo se leen de la base (son
 * lecturas publicas). Se eligen tres cortes distintos con toques de verdad.
 *
 * NADA SALE A INTERNET QUE ESCRIBA: todo POST a Apps Script y toda RPC de la
 * base que no este en LECTURAS se corta con CDP, y tambien el pixel de Meta y
 * Analytics (un add_to_cart de prueba ensucia la medicion). Si aparece un POST
 * de escritura, falla.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = 8600 + Math.floor(Math.random() * 90);
const URL_VIVA = process.env.URL || '';
const REINYECTAR = !!process.env.REINYECTAR;
const CAPTURAS = process.env.CAPTURAS || '';
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

/* Las RPC de la base que solo LEEN. Cualquier otra se corta. */
const LECTURAS = ['catalogo_tienda', 'tienda_piezas', 'tienda_stock', 'tienda_vendedores', 'tienda_cuentas'];

function servir() {
  return new Promise((listo, fallo) => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const abs = path.join(RAIZ, rel);
      if (!abs.startsWith(RAIZ) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
        res.writeHead(404); res.end('no esta'); return;
      }
      const tipo = MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': tipo, 'Cache-Control': 'no-store' });
      if (REINYECTAR && rel === '/app.js') {
        /* El bug: el total se olvida de las piezas del segundo corte en adelante
           y el renglon del resumen no se dibuja. */
        let s = fs.readFileSync(abs, 'utf8');
        const a = s.replace('kg += g.kg; cortes++;', 'if (!cortes) kg += g.kg; cortes++;')
                   .replace("if (carneRes.cortes) {", "if (false) {");
        if (a === s) throw new Error('la reinyeccion no encontro donde');
        res.end(a); return;
      }
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

/* Zona y fecha como una persona (copiado de verificar-piezas.js). */
const ELEGIR_ZONA = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  var _inp = document.getElementById('dir-input');
  if (_inp) { _inp.value = 'Estancias del Pilar'; if (typeof dirBuscar === 'function') dirBuscar(); }
  var z = document.querySelector('#dir-lista .dir-op');
  if (z) { z.click(); await dormir(500); }
  if (typeof showDateModal === 'function') { showDateModal(); await dormir(300); }
  var f = document.querySelector('#loc-dates-grid button:not([disabled])');
  if (f) f.click();
  await dormir(700);
  var ov = document.getElementById('loc-overlay');
  return !!(ov && getComputedStyle(ov).display !== 'none');
})()`;

const IR_A = (y) => `(function(){var r=document.documentElement,p=r.style.scrollBehavior;` +
  `r.style.scrollBehavior='auto';window.scrollTo(0,${y});r.style.scrollBehavior=p;})()`;
const kgTxt = (n) => n.toFixed(3).replace('.', ',') + ' kg';

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = URL_VIVA ? null : await servir();
  const base = URL_VIVA || ('http://127.0.0.1:' + PUERTO);
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-carne-total-'));
  const puertoCdp = 9700 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'], { stdio: 'ignore' });

  let mal = 0, bien = 0;
  const chk = (ok, t) => { ok ? bien++ : mal++; console.log('  ' + (ok ? VER + 'ok   ' : RED + 'MAL  ') + RST + t); };
  const escrituras = [], lecturas = new Set();

  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');
    const movil = ANCHO < 700;
    await cli.enviar('Emulation.setDeviceMetricsOverride',
      { width: ANCHO, height: ALTO, deviceScaleFactor: movil ? 3 : 1, mobile: movil });
    if (movil) await cli.enviar('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

    await cli.enviar('Fetch.enable', { patterns: [
      { urlPattern: '*script.google.com*' }, { urlPattern: '*supabase.co*' },
      { urlPattern: '*facebook*' }, { urlPattern: '*google-analytics*' }, { urlPattern: '*googletagmanager*' },
      { urlPattern: '*wa.me*' }, { urlPattern: '*whatsapp*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const r = m.params.request;
      try {
        const rpc = (r.url.match(/\/rpc\/([a-z_]+)/) || [])[1];
        const medicion = /facebook|google-analytics|googletagmanager|wa\.me|whatsapp/.test(r.url);
        const lee = r.method !== 'POST' || (rpc && LECTURAS.includes(rpc));
        if (!medicion && lee) {
          if (rpc) lecturas.add(rpc);
          await cli.enviar('Fetch.continueRequest', { requestId: m.params.requestId });
          return;
        }
        if (!medicion) escrituras.push(rpc || r.url.slice(0, 80));
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
    /* Un toque de verdad: con touch en el celular, con el mouse en la compu.
       Si algo tapa el centro del elemento, el toque le cae a otro. */
    const tocar = async (x, y) => {
      if (movil) {
        await cli.enviar('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await dormir(60);
        await cli.enviar('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        for (const type of ['mousePressed', 'mouseReleased']) {
          await cli.enviar('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
        }
      }
      await dormir(350);
    };
    /* Lleva el elemento al medio de la pantalla y lo toca en su centro. */
    const tocarSel = async (sel) => {
      await ev(IR_A("window.pageYOffset + document.querySelector(" + JSON.stringify(sel) + ").getBoundingClientRect().top - innerHeight / 2"));
      await dormir(250);
      const r = JSON.parse(await ev("JSON.stringify((function(){var e=document.querySelector(" + JSON.stringify(sel) + ");var b=e.getBoundingClientRect();" +
        "var x=b.left+b.width/2,y=b.top+b.height/2,h=document.elementFromPoint(x,y);return {x:x,y:y,ok:!!h&&(h===e||e.contains(h))};})())"));
      if (!r.ok) throw new Error('algo tapa ' + sel + ': el toque le caeria a otro');
      await tocar(r.x, r.y);
    };
    const toastTxt = () => ev("((document.getElementById('toast')||{}).textContent||'').trim()");
    const captura = async (nombre) => {
      if (!CAPTURAS) return;
      const s = await cli.enviar('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(CAPTURAS, nombre + '-' + ANCHO + '.png'), Buffer.from(s.data, 'base64'));
    };

    await cli.enviar('Page.navigate', { url: base + '/?ct=' + Date.now() });
    for (let i = 0; i < 300; i++) {
      if (await ev("typeof hayPiezas === 'function' && hayPiezas() && !_sinPrecios() && !!document.querySelector('.carne-card .pz-fila')").catch(() => false)) break;
      await dormir(100);
    }
    await dormir(500);
    if (await ev(ELEGIR_ZONA)) throw new Error('el modal de zona y fecha sigue abierto: los toques le caerian a el');
    await dormir(800);

    console.log('\n' + DIM + '== 1. Tres cortes con toques de verdad (' + ANCHO + 'px, ' + (URL_VIVA || 'local') + ') ==' + RST);
    /* Tres cortes distintos que tengan pieza a la vista: la mas chica de cada uno. */
    const elegidos = JSON.parse(await ev(`JSON.stringify([].slice.call(document.querySelectorAll('.carne-card')).map(function (c) {
      var f = c.querySelector('.pz-fila'); if (!f || !f.offsetWidth) return null;
      var p = PROD_MAP[c.getAttribute('data-id')] || PRODUCTOS.filter(function (x) { return String(x.id) === c.getAttribute('data-id'); })[0];
      return p ? { id: c.getAttribute('data-id'), abbr: p.abbr, nombre: p.nombre } : null;
    }).filter(Boolean).filter(function (x, i, a) { return a.findIndex(function (y) { return y.abbr === x.abbr; }) === i; }).slice(0, 3))`));
    chk(elegidos.length === 3, 'hay tres cortes con piezas para elegir (' + elegidos.map((x) => x.abbr).join(', ') + ')');
    if (elegidos.length < 3) throw new Error('sin tres cortes no se puede probar la suma');

    const kgs = [];
    const toasts = [];
    for (const c of elegidos) {
      const sel = '.carne-card[data-id="' + c.id + '"] .pz-fila';
      const kg = await ev("(function(){var f=document.querySelector(" + JSON.stringify(sel) + ");" +
        "var t=f.querySelector('.pz-kg');return Number(String(t.firstChild.textContent).replace(/[^\\d,]/g,'').replace(',','.'));})()");
      await tocarSel(sel);
      kgs.push(kg);
      toasts.push(await toastTxt());
      /* El aviso queda abajo de todo, sobre la grilla: se espera a que se vaya. */
      await ev("(function(){var t=document.getElementById('toast');if(t)t.classList.remove('show');})()");
    }
    const enCarrito = await ev("Object.keys(piezaCart).length");
    chk(enCarrito === 3, 'las tres piezas entraron al carrito (' + enCarrito + ')');
    const suma = kgs.reduce((a, b) => a + b, 0);
    const sumaTxt = kgTxt(suma);
    console.log('    ' + DIM + elegidos.map((c, i) => c.nombre + ' ' + kgTxt(kgs[i])).join(' + ') + ' = ' + sumaTxt + RST);
    chk(!/llev[aá]s .* de carne/.test(toasts[0]), 'la primera pieza no repite el total: "' + toasts[0] + '"');
    chk(toasts[1].includes('llevás ' + kgTxt(kgs[0] + kgs[1]) + ' de carne'), 'la segunda dice cuanto va: "' + toasts[1] + '"');
    chk(toasts[2].includes('llevás ' + sumaTxt + ' de carne'), 'la tercera tambien: "' + toasts[2] + '"');

    console.log('\n' + DIM + '== 2. El carrito ==' + RST);
    const plataAntes = await ev("JSON.stringify([cartTotal(), getTotalDiscount(), getShipping()])");
    await tocarSel('.cart-btn');
    await dormir(600);
    const C = JSON.parse(await ev(`JSON.stringify((function () {
      var row = document.getElementById('cart-carne-row'), r = row.getBoundingClientRect();
      var sub = document.getElementById('cart-subtotal').parentElement.getBoundingClientRect();
      var foot = document.getElementById('cart-foot');
      return {
        visible: r.width > 0 && r.height > 0 && getComputedStyle(row).display !== 'none',
        txt: [].map.call(row.children, function (s) { return s.textContent.trim(); }).join(' ').replace(/\\s+/g, ' ').trim(),
        arribaDelSubtotal: r.bottom <= sub.top + 1,
        desborda: foot.scrollWidth > foot.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1,
        lineas: [].map.call(document.querySelectorAll('.cart-item-carne .cart-item-sub'), function (e) { return e.textContent.trim(); }),
        subtotal: document.getElementById('cart-subtotal').textContent.trim(),
        total: document.getElementById('cart-total').textContent.trim(),
        totalLbl: document.getElementById('cart-total').previousElementSibling.textContent.trim(),
        esperadoSub: ars(productsSubtotal() + combosSubtotal() + piezasSubtotal())
      };
    })())`));
    chk(C.visible, 'el renglon "Carne en total" se ve');
    chk(C.txt === 'Carne en total ' + sumaTxt, 'dice la suma exacta: "' + C.txt + '" (esperaba ' + sumaTxt + ')');
    chk(!/aprox/.test(C.txt), 'sin "aprox." con piezas pesadas');
    chk(C.arribaDelSubtotal, 'va arriba del subtotal, antes de la plata');
    chk(!C.desborda, 'nada se sale de ancho');
    chk(C.lineas.length === 3 && kgs.every((k) => C.lineas.some((l) => l.includes('1 pieza · ' + kgTxt(k) + ' · '))),
        'cada corte dice sus kilos: ' + C.lineas.join(' | '));
    chk(C.subtotal === C.esperadoSub && C.totalLbl === 'Total', 'la plata no cambia: subtotal ' + C.subtotal + ', ' + C.totalLbl + ' ' + C.total);
    chk(plataAntes === await ev("JSON.stringify([cartTotal(), getTotalDiscount(), getShipping()])"), 'abrir el carrito no movio ni un peso');
    await captura('carrito-3-cortes');

    console.log('\n' + DIM + '== 3. Sacar una pieza desde el carrito ==' + RST);
    await tocarSel('.cart-item-carne .pz-quitar');
    await dormir(400);
    const quedan = await ev("Object.keys(piezaCart).map(function(k){return piezaCart[k].kg;})");
    const quedanTxt = kgTxt(quedan.reduce((a, b) => a + b, 0));
    const t3 = await toastTxt();
    const row3 = await ev("[].map.call(document.getElementById('cart-carne-row').children,function(s){return s.textContent.trim();}).join(' ').replace(/\\s+/g,' ').trim()");
    chk(quedan.length === 2 && row3 === 'Carne en total ' + quedanTxt, 'el total se recalcula: "' + row3 + '"');
    chk(t3.includes('te quedan ' + quedanTxt + ' de carne'), 'y el aviso lo dice: "' + t3 + '"');

    console.log('\n' + DIM + '== 4. El resumen del checkout ==' + RST);
    await ev("updateFormSummary()");
    const R = await ev("(function(){var e=document.querySelector('.summary-line.summary-carne');return e?[].map.call(e.children,function(s){return s.textContent.trim();}).join(' ').replace(/\\s+/g,' ').trim():'';})()");
    chk(R === 'Carne en total' + quedanTxt || R === 'Carne en total ' + quedanTxt, 'dice lo mismo que el carrito: "' + R + '"');

    console.log('\n' + DIM + '== 5. Con una reserva: aprox. y al decimo ==' + RST);
    const res = await ev(`(function () {
      var guard = JSON.stringify(piezaCart);
      piezaCart['R:ZZ'] = { abbr: 'ZZ', id: 0, kg: 1.5, precio: 1, nombre: 'Prueba', reserva: true };
      var t = carneTotalTexto();
      piezaCart = JSON.parse(guard);
      return t;
    })()`);
    const esperadoRes = String(Math.round((quedan.reduce((a, b) => a + b, 0) + 1.5) * 10) / 10).replace('.', ',') + ' kg aprox.';
    chk(res === esperadoRes, 'con una reserva: "' + res + '" (esperaba "' + esperadoRes + '")');

    console.log('\n' + DIM + '== 6. Sin carne, no aparece ==' + RST);
    await ev("piezaCart = {}; var p0 = getActiveProducts().filter(function(p){return !esPorPeso(p) && p.cat !== 'Carnes';})[0]; cart = {}; cart[p0.id] = 1; updateUI();");
    await dormir(300);
    const sin = await ev("getComputedStyle(document.getElementById('cart-carne-row')).display");
    chk(sin === 'none', 'con solo un producto sin carne, el renglon no esta (' + sin + ')');
    await ev("updateFormSummary()");
    chk(!(await ev("!!document.querySelector('.summary-line.summary-carne')")), 'ni en el resumen');
    await ev("cart = {}; updateUI();");

    // 18/11: los cortes disponibles no desaparecen al elegir un barrio de representante.
    const zonasCarne = await ev(`(function(){
      var previo = {z:currentZone,b:selectedPilarBarrio,n:selectedPilarBarrioName};
      var casos = ['estancias','pilar'], faltan=[];
      casos.forEach(function(z){
        currentZone=z;
        var barrios=z==='pilar'?Object.keys(barrioToVendedor).concat(['__otro__']):[''];
        barrios.forEach(function(b){
          selectedPilarBarrio=b;selectedPilarBarrioName=b;
          var activos=getActiveProducts();
          renderCatalog();
          [38,45].forEach(function(id){
            if(!activos.some(function(p){return p.id===id;}) || !document.querySelector('.carne-card[data-id="'+id+'"]'))faltan.push(z+':'+b+':'+id);
          });
        });
      });
      currentZone=previo.z;selectedPilarBarrio=previo.b;selectedPilarBarrioName=previo.n;
      return {faltan:faltan,barrios:Object.keys(barrioToVendedor).length};
    })()`);
    chk(zonasCarne.faltan.length===0 && zonasCarne.barrios>0, 'matambres en Home y '+zonasCarne.barrios+' barrios: '+JSON.stringify(zonasCarne.faltan));

    chk(escrituras.length === 0, 'no salio ninguna escritura (' + (escrituras.join(', ') || 'ninguna') + ')');
    chk(lecturas.has('tienda_piezas'), 'las piezas vinieron de la base de verdad (' + [...lecturas].join(', ') + ')');
  } catch (e) {
    mal++;
    console.log('  ' + RED + 'ROTO ' + RST + e.message);
  } finally {
    try { proc.kill(); } catch (e) {}
    if (srv) srv.close();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  console.log('\n' + (mal ? RED : VER) + bien + ' ok · ' + mal + ' mal' + RST + '  (' + ANCHO + 'px' + (REINYECTAR ? ', CON EL BUG' : '') + ')');
  process.exit(mal ? 1 : 0);
}

main();
