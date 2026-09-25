/**
 * Que el cliente vea su ✓ cuando el pedido ENTRA, no cuando Google contesta.
 *
 *   node _tools/verificar-vigilante.js
 *
 * POR QUE EXISTE. El 25/9/2026 se midio por que el 38% de los clientes nunca
 * ve la confirmacion de su pedido:
 *
 *   · un POST corto vuelve siempre — 10 de 10 desde el origen real;
 *   · los intentos que fallan duran 24-29 s: se les agota el tope de 30 s;
 *   · el pedido queda guardado a los ~10 s (p50 de 113 pedidos reales), pero
 *     `doPost` sigue trabajando despues de guardarlo y lo ultimo que hace
 *     antes de contestar es llamar a WATI por internet.
 *
 * O sea que la respuesta del POST no se pierde: llega tarde. La tienda dejo de
 * esperarla y ahora PREGUNTA `action=pedidoEntro` cada 2,5 s desde el segundo
 * 4. Este test comprueba que esa pregunta sea la que confirma el pedido.
 *
 * COMO. Abre la tienda en un Chrome de verdad contra un servidor local y
 * finge el escenario exacto que rompia:
 *   · el POST NUNCA contesta (se queda colgado, como en produccion);
 *   · `pedidoEntro` dice "todavia no" y a los GUARDADO_MS dice "si".
 * El pedido tiene que quedar confirmado a los ~GUARDADO_MS, no a los 25 s, y
 * por la via `pedidoEntro`.
 *
 * El segundo escenario es el que NO tiene que romperse: si el pedido de verdad
 * no entro, el cliente tiene que seguir llegando al mensaje de siempre.
 *
 * Nada sale a internet y nada toca la planilla.
 *
 * Sale con codigo 1 si algo esta mal.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.env.PUERTO || 8179);
const RED = '\x1b[31m', VER = '\x1b[32m', DIM = '\x1b[2m', RST = '\x1b[0m';

/* Cuando el backend termina de GUARDAR el pedido. 9 s esta cerca del p50 real
   (10 s) y deja margen para ver la diferencia contra los 25 s del fallback. */
const GUARDADO_MS = 9000;
const TOPE_CONFIRMACION_MS = 16000;  // si tarda mas, el vigilante no esta haciendo su trabajo
const FALLBACK_MS = 25000;           // SEND_FALLBACK_MS de app.js

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
      ? new Error('El puerto ' + PUERTO + ' esta ocupado. Proba: PUERTO=8180 node _tools/verificar-vigilante.js')
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
  return { ws, listo, enviar: (m, p) => new Promise((ok, mal) => {
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

/* El POST se cuelga PARA SIEMPRE, que es el caso que rompia. `pedidoEntro`
   contesta "todavia no" hasta GUARDADO_MS y despues "si" — o nunca, cuando el
   escenario es que el pedido de verdad no entro.
   Todo se anota en localStorage y no en una variable: cuando el pedido se
   confirma, la tienda navega a wa.me y se lleva puesta la pagina. */
function prep(entraA, corrida) {
  return `(function () {
  try { localStorage.setItem('maleu_zone', 'estancias'); } catch (e) {}
  try { localStorage.removeItem('maleu_pending_orders'); } catch (e) {}
  try { localStorage.removeItem('maleu_order_sigs'); } catch (e) {}
  var ENTRA_A = ${entraA === null ? 'null' : entraA};
  var CORRIDA = ${corrida};

  window.__vigLeer = function () { try { return JSON.parse(localStorage.getItem('__vig') || '{}'); } catch (e) { return {}; } };
  var anotar = function (f) {
    var v = window.__vigLeer();
    f(v);
    try { localStorage.setItem('__vig', JSON.stringify(v)); } catch (e) {}
  };
  /* Se limpia SOLO al empezar una corrida nueva. Cuando el pedido se confirma
     la tienda navega a wa.me y el test vuelve aca a leer lo anotado: si el
     prep borrara en cada carga, se llevaria puesta justo la medicion. */
  anotar(function (v) {
    if (v.corrida === CORRIDA) return;
    v.corrida = CORRIDA; v.preguntas = []; v.t0 = 0; v.confirmado = null;
    v.posts = 0; v.fallback = null;
  });

  navigator.sendBeacon = function () { return false; };
  var orig = window.fetch;
  window.fetch = function (url, opts) {
    var u = String(url);
    if (opts && String(opts.method || '').toUpperCase() === 'POST') {
      anotar(function (v) { if (!v.t0) v.t0 = Date.now(); v.posts = (v.posts || 0) + 1; });
      return new Promise(function () {});           // nunca contesta
    }
    if (u.indexOf('action=pedidoEntro') >= 0) {
      var v0 = window.__vigLeer();
      var desde = v0.t0 ? Date.now() - v0.t0 : 0;
      var entro = ENTRA_A !== null && desde >= ENTRA_A;
      anotar(function (v) { (v.preguntas = v.preguntas || []).push(desde); });
      return Promise.resolve(new Response(JSON.stringify({ ok: true, entro: entro }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    if (u.indexOf('action=piezas_full') >= 0) {
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return orig.apply(this, arguments);
  };
})();`;
}

/* Arma un carrito minimo, completa el formulario y aprieta el boton.
   Antes envuelve `_confirmado` para saber POR QUE VIA se confirmo: es la
   diferencia entre "el POST contesto" y "se lo preguntamos". */
const COMPRAR = `(async function () {
  var dormir = function (ms) { return new Promise(function (s) { setTimeout(s, ms); }); };
  var anotar = function (f) {
    var v = window.__vigLeer(); f(v);
    try { localStorage.setItem('__vig', JSON.stringify(v)); } catch (e) {}
  };

  if (typeof window._confirmado !== 'function') return JSON.stringify({ error: '_confirmado no es global: el test no puede medir la via' });
  if (typeof window._vigilarSiEntro !== 'function') return JSON.stringify({ error: 'no existe _vigilarSiEntro' });
  var origConf = window._confirmado;
  window._confirmado = function (key, resp) {
    anotar(function (v) {
      if (!v.confirmado) v.confirmado = { ms: v.t0 ? Date.now() - v.t0 : -1, via: (resp && resp.via) || 'post' };
    });
    return origConf.apply(this, arguments);
  };

  addToCart(5); addToCart(5);
  document.getElementById('f-nombre').value = 'PRUEBA Vigilante';
  document.getElementById('f-telefono').value = '1155038905';
  var bp = document.getElementById('f-barrio-privado');
  bp.value = 'Estancias del Pilar'; bp.dispatchEvent(new Event('change'));
  await dormir(150);
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

  enviarPedido();
  return JSON.stringify({ ok: true });
})()`;

var _corrida = 0;
async function correr(cli, entraA, esperaMs) {
  _corrida++;
  await cli.enviar('Page.navigate', { url: 'about:blank' });
  await new Promise((s) => setTimeout(s, 400));
  await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: prep(entraA, _corrida) });
  await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/' });
  await new Promise((s) => setTimeout(s, 3500));

  const r = await cli.enviar('Runtime.evaluate',
    { expression: COMPRAR, awaitPromise: true, returnByValue: true });
  const arr = JSON.parse((r.result && r.result.value) || '{}');
  if (arr.error) throw new Error(arr.error);

  /* Se espera y despues se VUELVE a la tienda: si el pedido se confirmo, la
     pagina se fue a wa.me. localStorage es del mismo origen, asi que lo
     anotado sobrevive al viaje. */
  await new Promise((s) => setTimeout(s, esperaMs));
  /* El fallback no navega solo: deja el cartel con el boton para que lo toque
     el cliente. Se mira ANTES de volver, que es cuando todavia esta en pantalla. */
  try {
    const f = await cli.enviar('Runtime.evaluate', { returnByValue: true, expression:
      "(function(){var t=document.getElementById('send-title');" +
      "var b=document.getElementById('send-wa-btn');" +
      "return JSON.stringify({titulo:t?t.textContent:'',hayBoton:!!(b&&b.onclick)});})()" });
    const fb = JSON.parse((f.result && f.result.value) || '{}');
    await cli.enviar('Runtime.evaluate', { expression:
      "(function(){try{var v=JSON.parse(localStorage.getItem('__vig')||'{}');" +
      "v.fallback=" + JSON.stringify(JSON.stringify(fb)) + ";" +
      "localStorage.setItem('__vig',JSON.stringify(v));}catch(e){}})()" });
  } catch (e) { /* la pagina ya se fue a wa.me: no hay cartel que mirar */ }
  let destino = '';
  try {
    const u = await cli.enviar('Runtime.evaluate', { expression: 'location.href', returnByValue: true });
    destino = String((u.result && u.result.value) || '');
  } catch (e) { /* la pagina se estaba yendo */ }
  if (destino.indexOf('127.0.0.1') < 0) {
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/' });
    await new Promise((s) => setTimeout(s, 2500));
  }
  const v = await cli.enviar('Runtime.evaluate',
    { expression: "localStorage.getItem('__vig')", returnByValue: true });
  let datos = {};
  try { datos = JSON.parse((v.result && v.result.value) || '{}'); } catch (e) {}
  datos.destino = destino;
  return datos;
}

(async () => {
  const exe = CHROMES.find((p) => fs.existsSync(p));
  if (!exe) { console.log(RED + 'No encontre Chrome ni Edge.' + RST); process.exit(1); }

  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-vig-'));
  const puertoCdp = PUERTO + 1000;
  const chrome = spawn(exe, ['--headless=new', '--remote-debugging-port=' + puertoCdp,
    '--user-data-dir=' + perfil, '--no-first-run', '--disable-gpu',
    '--window-size=430,900', 'about:blank'], { stdio: 'ignore' });

  let fallas = [];
  const chk = (cond, msg, detalle) => {
    if (cond) console.log('  ' + VER + 'ok ' + RST + msg);
    else { fallas.push(msg); console.log('  ' + RED + 'MAL' + RST + ' ' + msg + (detalle !== undefined ? DIM + '  -> ' + JSON.stringify(detalle) + RST : '')); }
  };

  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');

    console.log('\n== 1. El POST nunca contesta, pero el pedido ENTRA a los ' + (GUARDADO_MS / 1000) + ' s ==\n');
    const a = await correr(cli, GUARDADO_MS, GUARDADO_MS + 5000);
    console.log(DIM + '   preguntas (ms desde el POST): ' + JSON.stringify(a.preguntas || []) + RST);
    console.log(DIM + '   confirmado: ' + JSON.stringify(a.confirmado) + RST);

    chk(!!a.confirmado, 'el pedido se confirma aunque el POST no conteste nunca', a);
    chk(!!(a.confirmado && a.confirmado.via === 'pedidoEntro'),
        'y se confirma PREGUNTANDO, no esperando el POST', a.confirmado);
    chk(!!(a.confirmado && a.confirmado.ms < TOPE_CONFIRMACION_MS),
        'el cliente espera menos de ' + (TOPE_CONFIRMACION_MS / 1000) + ' s (no los 25 del fallback)',
        a.confirmado && a.confirmado.ms);
    chk(!!(a.confirmado && a.confirmado.ms < FALLBACK_MS - 3000),
        'la confirmacion llega bastante ANTES del fallback', a.confirmado && a.confirmado.ms);
    chk((a.preguntas || []).length >= 2,
        'pregunta varias veces mientras espera, no una sola', a.preguntas);
    chk((a.preguntas || [])[0] !== undefined && a.preguntas[0] < 8000,
        'la primera pregunta sale enseguida, no a los 25 s', (a.preguntas || [])[0]);
    /* `wa.me/<num>?text=` redirige a `api.whatsapp.com/send/`: el destino que
       queda en la barra es el segundo, no el que escribe app.js. */
    chk(/wa\.me|whatsapp\.com/.test(String(a.destino || '')),
        'y se lo lleva a WhatsApp', a.destino && a.destino.slice(0, 60));
    chk(String(a.destino || '').indexOf('confirmaci') < 0
        && String(a.destino || '').indexOf('%E2%9A%A0') < 0,
        'con el mensaje NORMAL: sin el "no me aparecio la confirmacion"',
        decodeURIComponent(String(a.destino || '')).slice(-120));

    /* El hijo de una reinyeccion se saltea este escenario: tarda 31 s y lo que
       tiene que probar la reinyeccion es el escenario 1. */
    if (process.env.MALEU_HIJO) {
      console.log('\n' + DIM + '(soy el hijo de una reinyeccion: me salteo el escenario 2)' + RST);
    } else {
    console.log('\n== 2. Si el pedido de VERDAD no entro, el camino viejo sigue ==\n');
    const b = await correr(cli, null, FALLBACK_MS + 6000);
    console.log(DIM + '   preguntas: ' + (b.preguntas || []).length + '   destino: ' + String(b.destino || '').slice(0, 45) + RST);
    chk(!b.confirmado, 'no se confirma nada: nadie dijo que entro', b.confirmado);
    chk((b.preguntas || []).length >= 5,
        'pregunto varias veces antes de rendirse', (b.preguntas || []).length);
    var fb = {};
    try { fb = JSON.parse(b.fallback || '{}'); } catch (e) {}
    chk(String(fb.titulo || '').indexOf('Todav') >= 0,
        'le avisa que todavia no se registro', fb.titulo);
    chk(fb.hayBoton === true,
        'y le deja el boton para mandarlo igual por WhatsApp', fb);
    }

    try { cli.ws.close(); } catch (e) {}
  } catch (e) {
    fallas.push(String(e && e.message || e));
    console.log('\n' + RED + 'se rompio el test: ' + (e && e.message) + RST);
  } finally {
    try { chrome.kill(); } catch (e) {}
    try { srv.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }

  /* ── Reinyeccion ──────────────────────────────────────────────────────────
     Una prueba que no se pone roja cuando el bug vuelve no prueba nada. Se
     rompe el arreglo a proposito EN LA FUENTE y se corre de nuevo. */
  if (!process.env.MALEU_HIJO && fallas.length === 0) {
    console.log('== 3. Reinyeccion: que cada chequeo MUERDA ==\n');
    const cp = require('child_process');
    const APP = path.join(RAIZ, 'app.js');
    const orig = fs.readFileSync(APP, 'utf8');
    const casos = [
      ['no preguntar nada y esperar el POST (como estaba a la mañana)',
        '  _vigilarSiEntro(postData.clientOrderId);',
        '  /* reinyectado: sin vigilante */'],
      ['preguntar recien a los 24 s, cuando el cliente ya se canso',
        'var PEDIDO_ENTRO_DESDE_MS = 4000;',
        'var PEDIDO_ENTRO_DESDE_MS = 24000;'],
      ['ignorar el "si" que contesta el backend',
        "if (entro) { _confirmado(key, { ok: true, via: 'pedidoEntro' }); return; }",
        "if (false) { _confirmado(key, { ok: true, via: 'pedidoEntro' }); return; }"],
    ];
    for (const [que, de, a] of casos) {
      if (orig.indexOf(de) < 0) {
        fallas.push('no encontre el ancla: ' + que);
        console.log('  ' + RED + 'MAL' + RST + ' no encontre el ancla: ' + que);
        continue;
      }
      fs.writeFileSync(APP, orig.replace(de, a));
      const r = cp.spawnSync(process.execPath, [__filename], { encoding: 'utf8',
        env: Object.assign({}, process.env, { MALEU_HIJO: '1', PUERTO: String(PUERTO + 3) }) });
      fs.writeFileSync(APP, orig);
      if (r.status !== 0) console.log('  ' + VER + 'ok ' + RST + 'se pone rojo si: ' + que);
      else { fallas.push('no detecta: ' + que); console.log('  ' + RED + 'MAL' + RST + ' NO lo detecta: ' + que); }
    }
  }

  console.log('\n' + (fallas.length === 0 ? VER + 'TODO EN VERDE' : RED + fallas.length + ' MAL') + RST + '\n');
  process.exit(fallas.length === 0 ? 0 : 1);
})();
