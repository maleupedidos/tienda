/**
 * La carne por pieza, en grilla y desplegable (11/9/2026).
 *
 *   node _tools/verificar-piezas.js [ancho]      (390 por defecto)
 *
 * POR QUE EXISTE. Cada pieza de carne tiene su peso y su precio, y el cliente
 * elige cual se lleva. Con una tanda de 80 kg son 10 a 25 piezas por corte:
 * van en una GRILLA de botones grandes y, desde nueve, se ven las primeras
 * seis y un boton "Ver las N piezas" despliega el resto.
 *
 * Falla en silencio de estas formas, y cada una tiene su chequeo:
 *   · no se pliega nunca                        → 25 piezas tapan el catalogo
 *   · se pliega con pocas                       → un toque de mas para ver 7
 *   · la pieza elegida desaparece al plegar     → el cliente no ve lo que lleva
 *   · al plegar, el boton se va de abajo del dedo → aparece en otro corte
 *   · la card se redibuja y se pliega sola      → cada toque cierra la lista
 *   · el cartel de la oferta tapa otra pieza    → se toca la que no es
 *
 * NADA SALE A INTERNET QUE ESCRIBA: el inventario se contesta desde la pagina
 * y todo POST lo corta CDP. Este test no manda ningun pedido: si aparece un
 * POST, falla.
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
const PUERTO = 8500 + Math.floor(Math.random() * 90);
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

/* ── el inventario ─────────────────────────────────────────────────────────
   Desordenado a proposito: el orden lo tiene que poner la tienda.
     · vacio   14 → se pliega (4 de la tanda anterior en oferta)
     · lomo     9 → el borde: se pliega
     · picaña   8 → el otro borde: NO se pliega
     · entraña  3 → pocas, sin boton                                          */
function pz(id, kg, extra) { return Object.assign({ id: id, kg: kg }, extra || {}); }
const MUCHAS = {
  CVa: [pz('V10', 1.402), pz('V01', 1.064, { v: 1, of: 5 }), pz('V05', 0.95), pz('V14', 2.14),
        pz('V02', 1.241, { v: 1, of: 5 }), pz('V06', 1.102), pz('V07', 1.156), pz('V03', 1.383, { v: 1, of: 5 }),
        pz('V08', 1.275), pz('V09', 1.318), pz('V04', 1.922, { v: 1, of: 5 }), pz('V11', 1.47),
        pz('V12', 1.555), pz('V13', 1.689)],
  CLo: [pz('L01', 1.9), pz('L02', 2.05), pz('L03', 2.11), pz('L04', 2.2), pz('L05', 2.31),
        pz('L06', 2.4), pz('L07', 2.46), pz('L08', 2.6), pz('L09', 2.73)],
  CPi: [pz('P01', 1.1), pz('P02', 1.2), pz('P03', 1.25), pz('P04', 1.3), pz('P05', 1.35),
        pz('P06', 1.4), pz('P07', 1.45), pz('P08', 1.5)],
  CEn: [pz('E02', 0.842), pz('E01', 1.163, { v: 1 }), pz('E03', 1.21)],
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

function prep(piezas) {
  return `(function () {
  try { localStorage.setItem('maleu_zone', 'estancias'); } catch (e) {}
  var R = ${JSON.stringify(piezas)};
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    var u = String(url);
    var metodo = String((opts && opts.method) || 'GET').toUpperCase();
    if (metodo === 'GET' && u.indexOf('action=piezas_full') >= 0) {
      return Promise.resolve(new Response(JSON.stringify(R),
        { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return orig.apply(this, arguments);
  };
})();`;
}

/* Lo que se ve de un corte. Se lee del DOM, que es lo que ve el cliente:
   "visible" es que el navegador la dibuje, no que exista en el HTML. */
function leer(abbr) {
  return `JSON.stringify((function () {
  var prod = PRODUCTOS.filter(function (p) { return p.abbr === '${abbr}'; })[0];
  var card = prod && document.querySelector('.carne-card[data-id="' + prod.id + '"]');
  if (!card) return null;
  var rotulo = card.querySelector('.pz-rotulo');
  var rr = rotulo ? rotulo.getBoundingClientRect() : null;
  var filas = [].map.call(card.querySelectorAll('.pz-fila'), function (f) {
    var r = f.getBoundingClientRect();
    var off = f.querySelector('.pz-off');
    var ro = off ? off.getBoundingClientRect() : null;
    var kgEl = f.querySelector('.pz-kg');
    var pr = f.querySelector('.pz-precio');
    return {
      kg: kgEl && kgEl.firstChild ? String(kgEl.firstChild.textContent).trim() : '',
      precio: pr && pr.lastChild ? String(pr.lastChild.textContent).trim() : '',
      off: off ? off.textContent.trim() : '',
      visible: r.width > 0 && r.height > 0,
      elegida: f.getAttribute('aria-pressed') === 'true',
      x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      desborda: f.scrollWidth > f.clientWidth + 1,
      offRect: ro ? { x: ro.left, y: ro.top, w: ro.width, h: ro.height } : null
    };
  });
  var b = card.querySelector('.pz-mas');
  var br = b ? b.getBoundingClientRect() : null;
  return {
    filas: filas,
    rotuloAbajo: rr ? rr.bottom : null,
    boton: b ? { txt: (b.querySelector('.pz-mas-txt') || b).textContent.trim(),
                 rango: ((b.querySelector('.pz-mas-rango') || {}).textContent || '').trim(),
                 exp: b.getAttribute('aria-expanded'), top: br.top, h: Math.round(br.height) } : null,
    resumen: ((card.querySelector('.pz-resumen') || {}).textContent || '').trim()
  };
})())`;
}

/* Zona y fecha a mano, como una persona. Sembrar `maleu_zone` NO alcanza:
   falta la fecha, el modal queda abierto encima de todo y se come los toques
   — la primera version de este test tocaba el calendario creyendo que tocaba
   una pieza. Copiado de verificar-paneles.js. */
const ELEGIR_ZONA = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  var z = [].slice.call(document.querySelectorAll('#loc-step-zone .loc-btn'))
    .filter(function (b) { return (b.getAttribute('onclick') || '').indexOf('estancias') >= 0; })[0];
  if (z) { z.click(); await dormir(500); }
  var f = document.querySelector('#loc-dates-grid button:not([disabled])');
  if (f) f.click();
  await dormir(700);
  var ov = document.getElementById('loc-overlay');
  return !!(ov && getComputedStyle(ov).display !== 'none');
})()`;

/* El html tiene scroll-behavior:smooth: un scrollTo pelado se anima y la
   posicion que se lee enseguida es la de la mitad del viaje. */
const IR_A = (y) => `(function(){var r=document.documentElement,p=r.style.scrollBehavior;` +
  `r.style.scrollBehavior='auto';window.scrollTo(0,${y});r.style.scrollBehavior=p;})()`;

const num = (t) => Number(String(t || '').replace(/[^\d]/g, '')) || 0;
const kgNum = (t) => Number(String(t || '').replace(' kg', '').replace(',', '.'));
const kgTxt = (n) => n.toFixed(3).replace('.', ',');
const choca = (a, b) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-piezas-'));
  const puertoCdp = 9800 + Math.floor(Math.random() * 90);
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
    await cli.enviar('Emulation.setDeviceMetricsOverride',
      { width: ANCHO, height: ALTO, deviceScaleFactor: ANCHO < 700 ? 3 : 1, mobile: ANCHO < 700 });

    /* Todo POST se corta ACA, fuera de la pagina y desde antes de navegar.
       Los GET a Apps Script siguen (el stock de los otros productos). */
    const posts = [];
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*script.google.com*' },
      { urlPattern: '*wa.me*' }, { urlPattern: '*whatsapp*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const r = m.params.request;
      try {
        if (r.method !== 'POST' && !/wa\.me|whatsapp/.test(r.url)) {
          await cli.enviar('Fetch.continueRequest', { requestId: m.params.requestId });
          return;
        }
        posts.push(r.url);
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
    const L = async (abbr) => JSON.parse(await ev(leer(abbr)));
    const card = (abbr) => "(function(){var p=PRODUCTOS.filter(function(x){return x.abbr==='" + abbr + "';})[0];" +
      "return document.querySelector('.carne-card[data-id=\"'+p.id+'\"]');})()";
    /* Un toque DE VERDAD, con el mouse de Chrome en el centro del elemento: si
       algo lo tapa (el cartel de la oferta de la vecina, por ejemplo), el
       toque le cae a otro y el chequeo lo agarra. */
    const tocar = async (x, y) => {
      if (process.env.DEPURAR) console.log('    toque en', Math.round(x), Math.round(y), '→', await ev("(function(){var e=document.elementFromPoint(" + x + "," + y + ");return e? (e.tagName+'.'+e.className+' / '+(e.parentElement&&e.parentElement.className)) : 'nada'})()"));
      for (const type of ['mousePressed', 'mouseReleased']) {
        await cli.enviar('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
      }
      await dormir(250);
    };

    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: prep(MUCHAS) });
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?pz=' + Date.now() });
    for (let i = 0; i < 200; i++) {
      if (await ev("typeof hayPiezas === 'function' && hayPiezas() && !!document.querySelector('.carne-card .pz-fila')").catch(() => false)) break;
      await dormir(100);
    }
    await dormir(500);
    const modalAbierto = await ev(ELEGIR_ZONA);
    /* Con el modal abierto, todo lo de abajo tocaria el calendario: se corta. */
    if (modalAbierto) throw new Error('el modal de zona y fecha sigue abierto: los toques le caerian a el');
    /* Los avisos (toast) quedan abajo, sobre la grilla: se apagan para que no
       se coman un toque. No es un bug de la tienda, es que el test toca rapido. */
    await ev("(function(){var s=document.createElement('style');s.textContent='.toast,#toast{display:none!important}';document.head.appendChild(s);})()");

    // ── 1. Plegada: seis a la vista ─────────────────────────────────────
    console.log('\n' + DIM + '== 1. El vacio, con 14 piezas — ' + ANCHO + 'px ==' + RST);
    await ev(IR_A("window.pageYOffset + " + card('CVa') + ".getBoundingClientRect().top - 70"));
    await dormir(200);
    let v = await L('CVa');
    chk(!!v, 'se dibuja la card del vacio');
    if (!v) throw new Error('sin card del vacio: lo de abajo no mediria nada');
    const vis = v.filas.filter((f) => f.visible);
    chk(v.filas.length === 14, 'las 14 piezas estan en la card (' + v.filas.length + ')');
    chk(vis.length === 6, 'plegada se ven 6 (' + vis.length + ')');
    const kgsVis = vis.map((f) => kgNum(f.kg));
    chk(JSON.stringify(kgsVis) === JSON.stringify([1.064, 1.241, 1.383, 1.922, 0.95, 1.102]),
        'primero las 4 de la tanda anterior (de chica a grande), despues las mas chicas: ' + kgsVis.join(' · '));
    chk(!!v.boton && v.boton.txt === 'Ver las 14 piezas', 'el boton dice "Ver las 14 piezas" ("' + (v.boton ? v.boton.txt : '(no esta)') + '")');
    const todosKg = MUCHAS.CVa.map((p) => p.kg);
    const rangoOk = 'de ' + kgTxt(Math.min(...todosKg)) + ' a ' + kgTxt(Math.max(...todosKg)) + ' kg';
    chk(!!v.boton && v.boton.rango === rangoOk, 'y de cuanto a cuanto van: "' + (v.boton ? v.boton.rango : '') + '" (esperaba "' + rangoOk + '")');
    chk(!!v.boton && v.boton.exp === 'false', 'aria-expanded="false"');
    chk(!!v.boton && v.boton.h >= 44, 'el boton mide 44px o mas (' + (v.boton ? v.boton.h : 0) + ')');

    /* La grilla: dos columnas en el celular, tres en la compu. */
    const filaUno = vis.filter((f) => Math.abs(f.y - vis[0].y) < 3);
    const colsEsperadas = ANCHO < 700 ? 2 : 3;
    chk(filaUno.length === colsEsperadas, colsEsperadas + ' piezas por fila (' + filaUno.length + ')');
    chk(vis.every((f) => f.h >= 48 && f.h <= 72), 'cada pieza mide entre 48 y 72px (' + Math.min(...vis.map((f) => f.h)) + '-' + Math.max(...vis.map((f) => f.h)) + ')');
    chk(vis.every((f) => !f.desborda), 'ninguna pieza se sale de su caja');
    /* El cartel de la oferta va montado sobre el borde: no puede tapar a otra
       pieza ni al rotulo de arriba. */
    let tapa = 0;
    vis.forEach((f, i) => {
      if (!f.offRect) return;
      vis.forEach((g, j) => { if (i !== j && choca(f.offRect, g)) tapa++; });
      if (v.rotuloAbajo !== null && f.offRect.y < v.rotuloAbajo - 0.5) tapa++;
    });
    chk(tapa === 0, 'ningun cartel de oferta tapa otra pieza ni el rotulo (' + tapa + ' choques)');
    chk(vis.slice(0, 4).every((f) => f.off === '5% OFF') && vis.slice(4).every((f) => !f.off),
        'las 4 de la tanda anterior dicen "5% OFF" y las otras no');

    // ── 2. Los bordes: 9 se pliega, 8 no, 3 no ─────────────────────────
    console.log('\n' + DIM + '== 2. Cuando se pliega y cuando no ==' + RST);
    const lo = await L('CLo'), pi = await L('CPi'), en = await L('CEn');
    chk(!!lo && !!lo.boton && lo.filas.filter((f) => f.visible).length === 6, 'lomo, con 9: se pliega (6 a la vista y el boton)');
    chk(!!pi && !pi.boton && pi.filas.filter((f) => f.visible).length === 8, 'picaña, con 8: NO se pliega (las 8 a la vista, sin boton)');
    chk(!!en && !en.boton && en.filas.filter((f) => f.visible).length === 3, 'entraña, con 3: sin boton');

    // ── 3. Desplegar con un toque de verdad ────────────────────────────
    console.log('\n' + DIM + '== 3. Desplegar ==' + RST);
    /* El boton tiene que estar EN pantalla: un toque fuera de la ventana no le
       cae a nada, y el test culparia a la tienda. */
    await ev(IR_A("window.pageYOffset + " + card('CVa') + ".querySelector('.pz-mas').getBoundingClientRect().top - innerHeight / 2"));
    await dormir(200);
    v = await L('CVa');
    await tocar(ANCHO / 2, v.boton.top + v.boton.h / 2);
    v = await L('CVa');
    chk(v.filas.filter((f) => f.visible).length === 14, 'con un toque se ven las 14 (' + v.filas.filter((f) => f.visible).length + ')');
    chk(!!v.boton && v.boton.txt === 'Ver menos' && v.boton.exp === 'true', 'el boton pasa a "Ver menos" y aria-expanded="true"');
    chk(!v.boton || !v.boton.rango, 'desplegada, el boton ya no repite los kilos');

    // ── 4. Elegir la ultima con un toque, y que no desaparezca al plegar ─
    console.log('\n' + DIM + '== 4. Elegir y plegar ==' + RST);
    const ult = v.filas.filter((f) => f.visible).slice(-1)[0];
    await ev(IR_A("window.pageYOffset + " + (ult.y - ALTO / 2)));
    await dormir(200);
    v = await L('CVa');
    const ult2 = v.filas.filter((f) => f.visible).slice(-1)[0];
    await tocar(ult2.x + ult2.w / 2, ult2.y + ult2.h / 2);
    v = await L('CVa');
    const elegidas = v.filas.filter((f) => f.elegida);
    chk(elegidas.length === 1 && kgNum(elegidas[0].kg) === 2.14, 'un toque sobre la de 2,140 kg la elige (' + elegidas.map((f) => f.kg).join(', ') + ')');
    chk(v.filas.filter((f) => f.visible).length === 14, 'elegir NO pliega la lista: sigue desplegada');
    chk(/Llevás 1 pieza · 2,140 kg · \$\s?55\.640/.test(v.resumen), 'el resumen dice cuanto y cuanta plata: "' + v.resumen + '"');

    /* El boton "Ver menos" bajo el dedo: se toca, y despues de plegar tiene
       que seguir en el mismo lugar de la pantalla. */
    const antes = v.boton.top;
    await tocar(ANCHO / 2, v.boton.top + v.boton.h / 2);
    v = await L('CVa');
    const vis4 = v.filas.filter((f) => f.visible);
    chk(vis4.length === 7, 'plegada se ven 7: las 6 de siempre y la elegida (' + vis4.length + ')');
    chk(vis4.some((f) => f.elegida && kgNum(f.kg) === 2.14), 'la elegida sigue a la vista');
    chk(!!v.boton && Math.abs(v.boton.top - antes) <= 2, 'al plegar, el boton queda bajo el dedo (se movio ' + (v.boton ? Math.round(v.boton.top - antes) : '?') + 'px)');

    // ── 5. Que un redibujo no la pliegue ni la despliegue sola ──────────
    console.log('\n' + DIM + '== 5. El estado sobrevive a un redibujo ==' + RST);
    await ev("renderCatalog()");
    await dormir(300);
    v = await L('CVa');
    chk(v.filas.filter((f) => f.visible).length === 7, 'plegada sigue plegada despues de renderCatalog()');
    await ev("verPiezas('CVa', " + card('CVa') + ".querySelector('.pz-mas'))");
    await ev("renderCatalog()");
    await dormir(300);
    v = await L('CVa');
    chk(v.filas.filter((f) => f.visible).length === 14, 'y desplegada sigue desplegada');
    /* Elegir otra con el tile y sacarla desde el tile tambien: el interruptor. */
    await ev("togglePieza('CVa','V05')");
    v = await L('CVa');
    const precioV05 = num(v.filas.find((f) => kgNum(f.kg) === 0.95).precio);
    chk(/Llevás 2 piezas · 3,090 kg/.test(v.resumen) && num(v.resumen.split('kg')[1]) === 55640 + precioV05,
        'con dos, el resumen suma kilos y plata: "' + v.resumen + '"');
    await ev("togglePieza('CVa','V05')");
    v = await L('CVa');
    chk(v.filas.filter((f) => f.elegida).length === 1, 'tocarla otra vez la saca');

    chk(posts.length === 0, 'no salio ningun POST (' + posts.length + ')');
  } catch (e) {
    mal++;
    console.log('  ' + RED + 'ROTO ' + RST + e.message);
  } finally {
    try { proc.kill(); } catch (e) {}
    srv.close();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }
  console.log('\n' + (mal ? RED : VER) + bien + ' ok · ' + mal + ' mal' + RST + '  (' + ANCHO + 'px)');
  process.exit(mal ? 1 : 0);
}

main();
