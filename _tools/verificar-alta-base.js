/**
 * El alta de la tienda pregunta primero a la base (287, ALTA_TIENDA_DIRECTO, 29/10/2026).
 *
 *   node _tools/verificar-alta-base.js [app.js]
 *
 * Saca de app.js, tal cual, `_altaBaseVa`, `_postPedido`, `_postPedidoBase` y `_postPedidoApps`, y las corre en
 * Node con `fetch` simulado: NADA sale a la red (un fetch sin simular revienta la prueba). Sostiene:
 *   · desde maleu.com.ar: la base primero, y con `directo:true` y número NO se llama a Apps Script;
 *   · `directo:false`, un 404, un 500, un corte de red, una respuesta sin número o 8 s sin respuesta → el POST
 *     de siempre a Apps Script, con el MISMO cuerpo (el mismo clientOrderId);
 *   · desde localhost / 127.0.0.1 (donde corren las redes) la base NO se llama — salvo `__altaBaseForzar`;
 *   · lo que contesta llega a quien llamó con `n`, que es lo único que la tienda lee.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const APP = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'app.js');
const src = fs.readFileSync(APP, 'utf8');
let ok = 0, mal = 0;
const chk = (t, c, d) => { c ? ok++ : mal++; console.log((c ? '  ok  ' : '  MAL ') + t + (c ? '' : '  -> ' + JSON.stringify(d).slice(0, 400))); };

function fn(nombre) {
  const i = src.indexOf('function ' + nombre + '(');
  if (i < 0) return '';
  let j = src.indexOf('{', i), n = 0;
  for (; j < src.length; j++) { if (src[j] === '{') n++; else if (src[j] === '}' && --n === 0) break; }
  return src.slice(i, j + 1);
}
const piezas = ['_altaBaseVa', '_tiendaNoAnotar', '_postPedido', '_postPedidoBase', '_postPedidoApps'].map(fn);
if (piezas.some((p) => !p)) { console.log('  MAL no están las cinco funciones en ' + APP); process.exit(1); }

const APPS = 'https://script.google.com/macros/s/PRUEBA/exec', SB = 'https://xhaxmyvhygxynwjqrarm.supabase.co';
function armar(host, base, forzar) {
  const llamadas = [];
  const fetchFalso = (url, opts) => {
    llamadas.push({ url, body: opts && opts.body });
    if (url.indexOf('/rpc/pedido_alta_directo') >= 0) {
      if (base === 'cuelga') return new Promise((res, rej) => { opts.signal.addEventListener('abort', () => rej(new Error('abort'))); });
      if (base === 'corte') return Promise.reject(new Error('net'));
      const st = { '404': 404, '500': 500 }[base] || 200;
      const cuerpo = { si: { ok: true, n: 2201, ref: 'Home #2201', aceptada: true, diferida: true, directo: true },
        no: { ok: false, directo: false, motivo: 'palanca' }, sinNum: { ok: true, directo: true } }[base] || {};
      return Promise.resolve({ ok: st === 200, status: st, json: () => Promise.resolve(cuerpo), text: () => Promise.resolve(JSON.stringify(cuerpo)) });
    }
    if (url.indexOf('/rpc/directa_no_anotar') >= 0) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) });   // (4/11) el motivo a la base
    if (url === APPS) return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ ok: true, n: 2202 })) });
    throw new Error('fetch sin simular: ' + url);
  };
  const ctx = new Function('fetch', 'location', 'window', 'AbortController', 'setTimeout', 'clearTimeout',
    'const APPS_SCRIPT_URL=' + JSON.stringify(APPS) + ';const SB_URL_TIENDA=' + JSON.stringify(SB) +
    ';const SB_KEY_TIENDA="k";const MALEU_FETCH_TIMEOUT_MS=30000;' + piezas.join('\n') + ';return {_postPedido};');
  const reloj = (f, ms) => setTimeout(f, base === 'cuelga' && ms === 8000 ? 50 : ms); // los 8 s, en 50 ms
  const api = ctx(fetchFalso, { hostname: host }, forzar ? { __altaBaseForzar: true } : {}, AbortController, reloj, clearTimeout);
  return { api, llamadas };
}
const PEDIDO = { clientOrderId: 'co_prueba_1', canal: 'Home', items: [{ id: 5, qty: 1 }], total: 17000 };
const aBase = (l) => l.filter((x) => x.url.indexOf('pedido_alta_directo') >= 0);
const aApps = (l) => l.filter((x) => x.url === APPS);

(async () => {
  let t = armar('maleu.com.ar', 'si'); let r = await t.api._postPedido(PEDIDO);
  chk('maleu.com.ar, la base acepta: una llamada a la base y NINGUNA a Apps Script', aBase(t.llamadas).length === 1 && aApps(t.llamadas).length === 0, t.llamadas);
  chk('   la tienda recibe ok y el número de la base', r && r.ok === true && r.n === 2201, r);
  chk('   a la base le llega el pedido entero, con su clientOrderId', JSON.parse(aBase(t.llamadas)[0].body).p.clientOrderId === 'co_prueba_1', aBase(t.llamadas)[0]);
  /* La palanca apagada a propósito (directo:false, motivo palanca): Apps Script, como siempre. */
  t = armar('maleu.com.ar', 'no'); r = await t.api._postPedido(PEDIDO);
  let ap = aApps(t.llamadas);
  chk('maleu.com.ar, base «no» (palanca apagada): Apps Script una vez, con el MISMO cuerpo', ap.length === 1 && ap[0].body === JSON.stringify(PEDIDO) && r && r.n === 2202, { llamadas: t.llamadas, r });
  /* (4/11/2026) Cualquier otra falla: la base dos veces, NINGUNA a Apps Script, y el intento falla (lo reintenta
     `_sendWithRetry` y a los 45 s sale el cartel). De 15:25 a 16:55 del 4/11 la base rechazó toda alta y la caída a
     Apps Script, sin cuota, perdió los pedidos en silencio. */
  for (const caso of ['404', '500', 'corte', 'sinNum', 'cuelga']) {
    t = armar('maleu.com.ar', caso); let err = null; r = null;
    try { r = await t.api._postPedido(PEDIDO); } catch (e) { err = e; }
    chk('maleu.com.ar, base «' + caso + '»: la base dos veces, Apps Script ninguna, y el error sube', aBase(t.llamadas).length === 2 && aApps(t.llamadas).length === 0 && !!err && !r, { llamadas: t.llamadas.map((x) => x.url.slice(-30)), r, err: err && err.message });
  }
  t = armar('www.maleu.com.ar', 'si'); r = await t.api._postPedido(PEDIDO);
  chk('www.maleu.com.ar también va a la base', aBase(t.llamadas).length === 1 && aApps(t.llamadas).length === 0, t.llamadas);
  for (const h of ['127.0.0.1', 'localhost', '']) {
    t = armar(h, 'si'); r = await t.api._postPedido(PEDIDO);
    chk('«' + (h || 'sin host') + '» (las redes): NO se llama a la base, va a Apps Script', aBase(t.llamadas).length === 0 && aApps(t.llamadas).length === 1, t.llamadas);
  }
  t = armar('127.0.0.1', 'si', true); r = await t.api._postPedido(PEDIDO);
  chk('con __altaBaseForzar, desde 127.0.0.1 sí va a la base', aBase(t.llamadas).length === 1 && aApps(t.llamadas).length === 0, t.llamadas);
  console.log('\n' + ok + ' ok · ' + mal + ' MAL');
  process.exit(mal ? 1 : 0);
})().catch((e) => { console.log('  MAL reventó: ' + e.message); process.exit(1); });
