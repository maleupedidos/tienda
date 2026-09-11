/**
 * Cuanto tarda en aparecer la carne (11/9/2026).
 *
 *   node _tools/verificar-carga-carne.js [ancho]      (390 por defecto)
 *
 * POR QUE EXISTE. Tadeo: "cuando cargo la pagina, tarda 10 segundos en que
 * aparezca la carne como categoria y como producto". Era cierto y tenia una
 * causa concreta: la tienda pedia el stock, ESPERABA la respuesta (~4 s) y
 * recien ahi pedia las piezas (otros ~4 s). Ahora:
 *
 *   · las piezas se piden EN PARALELO con el stock;
 *   · y se dibujan de la COPIA de la ultima visita mientras llega la de ahora.
 *
 * La copia trae un riesgo nuevo, y este test lo cubre: una pieza que se vendio
 * desde la ultima visita se ve unos segundos. Si el cliente la elige en ese
 * rato, cuando llega el inventario de ahora tiene que salir del carrito y
 * decirlo — salvo que el pedido ya este en camino.
 *
 * Todo lo del backend se contesta desde la pagina, con demoras a proposito:
 * no sale nada a Apps Script. Si aparece un POST, falla.
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

/* La ultima visita vio V01, V02 y V03 (desordenadas, y dos con `v`/`of`, como
   los sigue mandando el backend). Desde entonces se vendio V01 y entro V04. */
const COPIA = { CVa: [{ id: 'V03', kg: 1.383, v: 1, of: 5 }, { id: 'V01', kg: 1.064, v: 1, of: 5 }, { id: 'V02', kg: 1.241 }] };
const AHORA = { CVa: [{ id: 'V02', kg: 1.241 }, { id: 'V04', kg: 1.9 }, { id: 'V03', kg: 1.383 }] };

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

/* El backend, desde la pagina. `copia` es lo que dejo la ultima visita
   (string crudo, para poder probar una rota); las demoras y la respuesta de
   las piezas se leen AL CONTESTAR, asi un escenario las puede cambiar en el
   medio. Un MutationObserver anota cuando aparece la primera pieza. */
function prep(cfg) {
  return `(function () {
  try {
    localStorage.clear();
    localStorage.setItem('maleu_zone', 'estancias');
    ${cfg.copia != null ? 'localStorage.setItem("maleu_piezas_v1", ' + JSON.stringify(cfg.copia) + ');' : ''}
  } catch (e) {}
  var CFG = ${JSON.stringify(cfg)};
  window.__t = {};
  window.__piezasAhora = CFG.piezas;
  window.__demoraPiezas = CFG.demoraPiezas;
  var responder = function (cuerpo, ms, fin) {
    return new Promise(function (ok) {
      setTimeout(function () {
        if (fin && !window.__t[fin]) window.__t[fin] = performance.now();
        ok(new Response(JSON.stringify(typeof cuerpo === 'function' ? cuerpo() : cuerpo),
          { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }, ms);
    });
  };
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    var u = String(url);
    var m = String((opts && opts.method) || 'GET').toUpperCase();
    if (m === 'GET' && u.indexOf('action=piezas_full') >= 0) {
      if (!window.__t.piezasIni) window.__t.piezasIni = performance.now();
      return responder(function () { return window.__piezasAhora; }, window.__demoraPiezas, 'piezasFin');
    }
    if (m === 'GET' && u.indexOf('action=stock_full') >= 0) {
      if (!window.__t.stockIni) window.__t.stockIni = performance.now();
      return responder({}, CFG.demoraStock, 'stockFin');
    }
    return orig.apply(this, arguments);
  };
  new MutationObserver(function () {
    if (!window.__t.carne && document.querySelector('.carne-card .pz-fila')) window.__t.carne = performance.now();
  }).observe(document, { childList: true, subtree: true });
})();`;
}

const ELEGIR_ZONA = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  var z = [].slice.call(document.querySelectorAll('#loc-step-zone .loc-btn'))
    .filter(function (b) { return (b.getAttribute('onclick') || '').indexOf('estancias') >= 0; })[0];
  if (z) { z.click(); await dormir(300); }
  var f = document.querySelector('#loc-dates-grid button:not([disabled])');
  if (f) f.click();
  await dormir(300);
  var ov = document.getElementById('loc-overlay');
  return !!(ov && getComputedStyle(ov).display !== 'none');
})()`;

/* Los pesos del vacio que se VEN, en orden. */
const PESOS = `(function () {
  var p = PRODUCTOS.filter(function (x) { return x.abbr === 'CVa'; })[0];
  var card = document.querySelector('.carne-card[data-id="' + p.id + '"]');
  if (!card) return null;
  return [].map.call(card.querySelectorAll('.pz-fila .pz-kg'), function (e) { return e.textContent.trim(); }).join(' · ');
})()`;
const COPIA_GUARDADA = `(function () {
  var c = JSON.parse(localStorage.getItem('maleu_piezas_v1') || 'null');
  if (!c) return null;
  return { hace: Date.now() - c.t, ids: Object.keys(c.m).map(function (a) {
    return a + ':' + c.m[a].map(function (pz) { return pz.id; }).join(','); }).join('|') };
})()`;

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-carga-'));
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
    await cli.enviar('Emulation.setDeviceMetricsOverride',
      { width: ANCHO, height: ALTO, deviceScaleFactor: ANCHO < 700 ? 3 : 1, mobile: ANCHO < 700 });
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
    const esperar = async (expr, ms) => {
      for (let i = 0; i < ms / 100; i++) { if (await ev(expr).catch(() => false)) return true; await dormir(100); }
      return false;
    };
    let script = null;
    const abrir = async (cfg) => {
      if (script) await cli.enviar('Page.removeScriptToEvaluateOnNewDocument', { identifier: script });
      script = (await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: prep(cfg) })).identifier;
      await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?c=' + Date.now() });
      await esperar("typeof PRODUCTOS !== 'undefined' && !!document.getElementById('loc-step-zone')", 15000);
      if (await ev(ELEGIR_ZONA)) throw new Error('el modal de zona y fecha sigue abierto');
    };

    // ── 1. Sin copia: las piezas y el stock salen juntos ────────────────
    console.log('\n' + DIM + '== 1. Primera visita, con el backend tardando 2 s en cada consulta ==' + RST);
    await abrir({ piezas: AHORA, demoraPiezas: 2000, demoraStock: 2000 });
    chk(await esperar('!!window.__t.carne', 8000), 'la carne aparece');
    let t = await ev('window.__t');
    chk(t.piezasIni != null && t.stockIni != null && Math.abs(t.piezasIni - t.stockIni) < 300,
        'las piezas se piden junto con el stock (' + Math.round(t.piezasIni - t.stockIni) + ' ms de diferencia)');
    chk(t.piezasIni < t.stockFin, 'y ANTES de que vuelva el stock — antes iban una detras de la otra');
    chk(t.carne - t.stockIni < 3200, 'la carne se ve a los ' + Math.round(t.carne - t.stockIni) +
        ' ms del primer pedido (en fila serian 4000 o mas)');
    chk(await ev(PESOS) === '1,241 kg · 1,383 kg · 1,900 kg', 'de la mas chica a la mas grande: ' + await ev(PESOS));
    let g = await ev(COPIA_GUARDADA);
    chk(!!g && g.ids === 'CVa:V02,V03,V04' && g.hace < 60000, 'queda guardada la copia para la proxima visita (' + JSON.stringify(g) + ')');

    // ── 2. Con copia: se dibuja al instante y se corrige sola ───────────
    console.log('\n' + DIM + '== 2. Vuelve con una copia de hace 1 hora, y el backend tarda 6 s ==' + RST);
    await abrir({ copia: JSON.stringify({ t: Date.now() - 3600e3, m: COPIA }), piezas: AHORA, demoraPiezas: 6000, demoraStock: 500 });
    chk(await esperar('!!window.__t.carne', 4000), 'la carne aparece sin esperar al backend');
    t = await ev('window.__t');
    chk(!t.piezasFin, 'y es de la copia: el inventario de ahora todavia no llego');
    chk(await ev(PESOS) === '1,064 kg · 1,241 kg · 1,383 kg', 'ordenada por peso aunque la copia traiga `v`/`of`: ' + await ev(PESOS));
    /* Acotado a las cards de carne: el catalogo entero dice "La oferta de
       combos no es acumulable", que es otra cosa. */
    chk(!(await ev("[].some.call(document.querySelectorAll('.carne-card'), function (c) { return /OFF|oferta/i.test(c.textContent) || !!c.querySelector('s'); })")),
        'ni "OFF", ni "oferta", ni un precio tachado en las cards de carne');
    /* El cliente elige, en ese rato, justo la que ya se vendio. */
    await ev("togglePieza('CVa','V01')");
    chk(await ev("!!piezaCart['V01']"), 'elige la de 1,064 kg, que ya no existe');
    chk(await esperar('!!window.__t.piezasFin', 9000), 'llega el inventario de ahora');
    await dormir(400);
    chk(await ev("!piezaCart['V01']"), 'y la pieza vendida sale del carrito');
    const aviso = await ev("document.getElementById('toast').textContent");
    chk(/1,064 kg/.test(aviso) && /ya se vendió/.test(aviso), 'avisando cual: "' + aviso + '"');
    chk(await ev('cartCount()') === 0, 'el contador del carrito lo refleja (' + await ev('cartCount()') + ')');
    chk(await ev(PESOS) === '1,241 kg · 1,383 kg · 1,900 kg', 'la card pasa al inventario de ahora: ' + await ev(PESOS));
    g = await ev(COPIA_GUARDADA);
    chk(!!g && g.ids === 'CVa:V02,V03,V04', 'y la copia se actualiza (' + (g && g.ids) + ')');

    // ── 3. Con un pedido en camino, el carrito no se toca ───────────────
    console.log('\n' + DIM + '== 3. Pedido en camino ==' + RST);
    await ev("togglePieza('CVa','V02')");
    await ev("window.__piezasAhora = { CVa: [{ id: 'V03', kg: 1.383 }, { id: 'V04', kg: 1.9 }] }; window.__demoraPiezas = 200; _enviando = true;");
    await ev('_refrescarPiezas()');
    chk(await ev("!!piezaCart['V02']"), 'la pieza que el backend acaba de vender (la de este pedido) sigue en el carrito');
    await ev('_enviando = false');
    await ev('_refrescarPiezas()');
    chk(await ev("!piezaCart['V02']"), 'sin pedido en camino, la misma situacion si la saca');

    // ── 4. Sin piezas: la copia se borra ────────────────────────────────
    await ev('window.__piezasAhora = {}');
    await ev('_refrescarPiezas()');
    chk(await ev(COPIA_GUARDADA) === null, 'si el backend dice que no queda ninguna, la copia se borra');

    // ── 5. Una copia vencida o rota no se usa ───────────────────────────
    console.log('\n' + DIM + '== 5. Copias que NO se usan ==' + RST);
    await abrir({ copia: JSON.stringify({ t: Date.now() - 13 * 3600e3, m: COPIA }), piezas: AHORA, demoraPiezas: 4000, demoraStock: 300 });
    await dormir(800);
    chk(!(await ev('!!document.querySelector(".carne-card")')), 'una de hace 13 horas no se dibuja: se espera la de ahora');
    chk(await esperar('!!window.__t.carne', 6000), 'y cuando llega, aparece');
    await abrir({ copia: '{esto no es json', piezas: AHORA, demoraPiezas: 1500, demoraStock: 300 });
    chk(await esperar('!!window.__t.carne', 6000), 'una rota se ignora sin romper nada, y la carne aparece igual');

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
