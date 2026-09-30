/**
 * ¿Como esta la tienda VIVA, ahora mismo? (reescrito el 29/9/2026)
 *
 *   node _tools/diagnostico-vivo.js
 *
 * Recorre https://maleu.com.ar como una persona —entra, escribe su barrio en el
 * buscador de direccion, mira el catalogo— y reporta el estado interno. Es para
 * correr ANTES de mostrarle la tienda a alguien, o cuando algo se siente raro y
 * no se sabe si es la tienda o el navegador.
 *
 * NO REEMPLAZA A LAS REDES. Las 32 `verificar-*.js` miden la tienda contra una
 * copia local y prueban casos que en produccion no se pueden provocar. Esto mide
 * una sola cosa que ninguna de ellas puede: lo que hay publicado AHORA.
 *
 * LO QUE HABIA ACA HASTA HOY MEDIA UN CASO QUE YA NO EXISTE, y por eso daba
 * rojos que no eran de la tienda. Buscaba `?autopedido=1` (eliminado el
 * 8/9/2026), `MODO_AUTOPEDIDO`, `_zonaPermite()` y un `#banner-autopedido` que
 * no existen, elegia la zona tocando un boton del modal viejo —desde el
 * 28/9/2026 el modal es un buscador de direccion— y terminaba preguntando si
 * cuatro sorrentinos estaban en Estancias, que se abrieron el 10/9/2026. O sea
 * que no estaba viejo: era el script de un problema resuelto tres veces, y
 * seguia listado en el CLAUDE.md como herramienta vigente.
 *
 * ES DE SOLO LECTURA, y con dos seguros: todo POST se corta por CDP antes de la
 * primera navegacion, y ademas Analytics y Meta se bloquean — si no, cada
 * corrida le sumaria una visita falsa a las metricas de verdad.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const URL_VIVA = process.env.URL || 'https://maleu.com.ar/';
const BARRIO = process.env.BARRIO || 'Estancias del Pilar';
const RED = '\x1b[31m', VER = '\x1b[32m', AMA = '\x1b[33m', DIM = '\x1b[2m', RST = '\x1b[0m';
const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const dormir = (ms) => new Promise((s) => setTimeout(s, ms));

function conectar(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map(); const oyentes = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      m.error ? mal(new Error(m.error.message)) : ok(m.result);
    } else if (m.method) oyentes.forEach((f) => f(m));
  });
  return {
    listo: new Promise((r, j) => {
      ws.addEventListener('open', r);
      ws.addEventListener('error', () => j(new Error('no conecta')));
    }),
    on: (f) => oyentes.push(f),
    enviar: (m, p) => new Promise((ok, mal) => {
      const i = ++id; pend.set(i, { ok, mal });
      ws.send(JSON.stringify({ id: i, method: m, params: p || {} }));
    }),
  };
}

async function esperarPagina(puerto) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + puerto + '/json/list');
      const p = (await r.json()).find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch (e) { /* todavia no */ }
    await dormir(250);
  }
  throw new Error('Chrome no abrio');
}

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-vivo-'));
  const puerto = 9700 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=' + puerto,
    '--user-data-dir=' + perfil, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
  const limpiar = () => { try { proc.kill(); } catch (e) {} };

  let avisos = 0, fallas = 0;
  const linea = (etiqueta, valor, estado) => {
    const color = estado === 'mal' ? RED : estado === 'aviso' ? AMA : estado === 'ok' ? VER : RST;
    if (estado === 'mal') fallas++;
    if (estado === 'aviso') avisos++;
    console.log('   ' + etiqueta.padEnd(24) + color + valor + RST);
  };

  try {
    const cli = conectar(await esperarPagina(puerto));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');
    await cli.enviar('Log.enable').catch(() => {});
    await cli.enviar('Emulation.setDeviceMetricsOverride',
      { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

    /* SOLO LECTURA. Todo POST se corta, y con el Analytics y el pixel de Meta
       bloqueados esta corrida no le suma una visita falsa a las metricas. */
    const cortados = [];
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const r = m.params.request;
      const malo = r.method === 'POST' ||
        /googletagmanager|google-analytics|facebook|connect\.facebook/.test(r.url);
      try {
        if (malo) {
          if (r.method === 'POST') cortados.push(r.url.slice(0, 70));
          await cli.enviar('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' });
        } else {
          await cli.enviar('Fetch.continueRequest', { requestId: m.params.requestId });
        }
      } catch (e) { /* la pagina ya se fue */ }
    });

    const errores = [];
    cli.on((m) => {
      if (m.method === 'Runtime.exceptionThrown') {
        const d = m.params.exceptionDetails;
        errores.push(String((d.exception && d.exception.description) || d.text).split('\n')[0].slice(0, 120));
      }
    });

    const ev = async (expr) => {
      const r = await cli.enviar('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        return { _err: String((d.exception && d.exception.description) || d.text).slice(0, 160) };
      }
      return r.result.value;
    };
    /* `ev` devuelve {_err} cuando la expresion tira. Sin esto, el JSON.parse de
       ese objeto tapaba el error real con '"[object Object]" is not valid JSON' —
       pasó en la primera corrida contra produccion. */
    const leer = async (expr, donde) => {
      const v = await ev(expr);
      if (v && typeof v === 'object' && v._err) throw new Error(donde + ': ' + v._err);
      try { return JSON.parse(v); }
      catch (e) { throw new Error(donde + ': contesto ' + JSON.stringify(String(v)).slice(0, 120)); }
    };
    const esperar = async (cond, ms) => {
      const fin = Date.now() + (ms || 15000);
      while (Date.now() < fin) {
        if (await ev('!!(' + cond + ')').catch(() => false) === true) return true;
        await dormir(200);
      }
      return false;
    };

    console.log('\n' + DIM + 'la tienda viva · ' + URL_VIVA + ' · ' +
      new Date().toLocaleString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }) + RST);

    const t0 = Date.now();
    await cli.enviar('Page.navigate', { url: URL_VIVA });
    const arranco = await esperar("typeof PRODUCTOS !== 'undefined' && PRODUCTOS.length > 0", 25000);
    const msArranque = Date.now() - t0;
    if (!arranco) {
      linea('la tienda', 'NO ARRANCO en 25 s', 'mal');
      throw new Error('la tienda no arranco: no hay nada mas que medir');
    }

    /* ── 1) que codigo esta publicado ── */
    console.log('\n' + DIM + '  lo que esta publicado:' + RST);
    const pub = await leer(`JSON.stringify({
      ver: (function(){ var s = [].slice.call(document.querySelectorAll('script[src*="app.js"]'));
        return s.length ? (s[0].getAttribute('src') || '') : 'sin app.js'; })(),
      productos: PRODUCTOS.length,
      combos: (typeof COMBOS !== 'undefined') ? COMBOS.length : -1,
      cierre: (typeof CIERRE_EN_LA_TIENDA !== 'undefined') ? !!CIERRE_EN_LA_TIENDA : null,
      lento: (typeof SEND_LENTO_MS !== 'undefined') ? SEND_LENTO_MS : null,
      fallback: (typeof SEND_FALLBACK_MS !== 'undefined') ? SEND_FALLBACK_MS : null,
      carrito: (typeof CARRITO_COPIA !== 'undefined') ? CARRITO_COPIA : null
    })`, 'lo publicado');
    linea('app.js', pub.ver.replace(/^.*app\.js/, 'app.js'), 'dato');
    linea('arranco en', msArranque + ' ms', msArranque < 4000 ? 'ok' : 'aviso');
    linea('catalogo', pub.productos + ' productos · ' + pub.combos + ' combos',
      pub.productos > 20 ? 'ok' : 'mal');
    linea('el pedido cierra en', pub.cierre === true ? 'la tienda' :
      pub.cierre === false ? 'WhatsApp (el interruptor esta APAGADO)' : 'no se sabe',
      pub.cierre === true ? 'ok' : 'aviso');
    linea('avisos del envio', pub.lento === null ? 'no se sabe' :
      'lento ' + (pub.lento / 1000) + ' s · fallback ' + (pub.fallback / 1000) + ' s', 'dato');
    linea('el carrito se guarda', pub.carrito ? 'si (' + pub.carrito + ')' : 'NO', pub.carrito ? 'ok' : 'aviso');

    /* ── 2) la primera pantalla, antes de decir de donde es ── */
    console.log('\n' + DIM + '  la primera pantalla (sin elegir zona):' + RST);
    const uno = await leer(`JSON.stringify({
      provisoria: !!window.zonaProvisoria,
      tapado: (function(){ var o = document.getElementById('loc-overlay');
        return !!(o && getComputedStyle(o).display !== 'none' && !o.classList.contains('hidden')); })(),
      /* Las cards de carne quedan afuera a proposito: su precio es por kilo y
         no tienen product-price. Contarlas daba "38 de 43" y un aviso que era
         del instrumento, no de la tienda. OJO: nada de backticks adentro de
         este template string — cierran el literal y lo que sigue se evalua
         como codigo. Ya estaba anotado en el CLAUDE.md y volvio a morder. */
      cards: document.querySelectorAll('.product-card:not(.carne-card)').length,
      conPrecio: [].slice.call(document.querySelectorAll('.product-card:not(.carne-card) .product-price'))
        .filter(function(e){ return /\\d/.test(e.textContent); }).length,
      cardsCarne: document.querySelectorAll('.product-card.carne-card').length,
      hero: document.querySelectorAll('.hero-foto, .hero-slide, [data-cat]').length,
      cta: (function(){ var c = document.getElementById('zona-cta'); return !!c && !c.hidden; })()
    })`, 'la primera pantalla');
    linea('nada encima', uno.tapado ? 'HAY UN MODAL TAPANDO' : 'el catalogo esta a la vista',
      uno.tapado ? 'mal' : 'ok');
    linea('cards con precio', uno.conPrecio + ' de ' + uno.cards +
      (uno.cardsCarne ? ' · ' + uno.cardsCarne + ' de carne (precio por kilo)' : ''),
      uno.cards > 0 && uno.conPrecio === uno.cards ? 'ok' : 'aviso');
    linea('zona provisoria', uno.provisoria ? 'si, y el cartel de zona se ve: ' + uno.cta : 'no (hay zona guardada)',
      uno.provisoria && !uno.cta ? 'mal' : 'ok');

    /* ── 3) elegir el barrio, como una persona ── */
    console.log('\n' + DIM + '  escribiendo "' + BARRIO + '" en el buscador de direccion:' + RST);
    const abrio = await ev(`(function(){ if (typeof showZoneModal === 'function') { showZoneModal('chip'); return true; } return false; })()`);
    await dormir(500);
    const buscado = await leer(`(function(){
      var i = document.getElementById('dir-input');
      if (!i) return JSON.stringify({ sinBuscador: true });
      i.value = ${JSON.stringify(BARRIO)};
      if (typeof dirBuscar === 'function') dirBuscar();
      var ops = [].slice.call(document.querySelectorAll('#dir-lista .dir-op'));
      return JSON.stringify({ abrio: ${!!abrio}, opciones: ops.length,
        primera: ops.length ? ops[0].textContent.replace(/[\\s\\u00a0]+/g, ' ').trim().slice(0, 70) : '' });
    })()`, 'el buscador');
    if (buscado.sinBuscador) linea('el buscador', 'NO EXISTE #dir-input', 'mal');
    else {
      linea('resultados', buscado.opciones + (buscado.primera ? ' · 1o: ' + buscado.primera : ''),
        buscado.opciones > 0 ? 'ok' : 'mal');
      if (buscado.opciones > 0) {
        await ev(`document.querySelector('#dir-lista .dir-op').click()`);
        await dormir(1200);
      }
    }

    /* ── 4) el estado con la zona puesta ── */
    console.log('\n' + DIM + '  con la zona elegida:' + RST);
    await esperar('Object.keys(stockMap || {}).length > 0', 20000);
    await esperar("typeof piezasEstado !== 'undefined' && piezasEstado !== 'cargando'", 20000);
    const dos = await leer(`JSON.stringify({
      zona: currentZone, provisoria: !!window.zonaProvisoria,
      activos: getActiveProducts().length,
      stock: Object.keys(stockMap || {}).length,
      sinStock: Object.keys(stockMap || {}).filter(function(k){ return !(stockMap[k] > 0); }).length,
      piezasEstado: piezasEstado,
      piezas: Object.keys(piezasMap || {}).reduce(function(s, a){ return s + piezasMap[a].length; }, 0),
      cortes: Object.keys(piezasMap || {}),
      reserva: (typeof reservaInfo !== 'undefined' && reservaInfo) ? reservaInfo.llega : null,
      /* Devuelve {thisWeek, nextWeek, later}, no un array: el nombre lo dice y
         la primera version le hizo .slice() igual. Y la clave es dayShort, no
         label — ese mismo descuido dejo pasar cuatro chequeos de
         verificar-horario.js el 28/9/2026. */
      fechas: (typeof _getNextDeliveryDatesGrouped === 'function')
        ? (function(){ var g = _getNextDeliveryDatesGrouped(currentZone) || {};
            return [].concat(g.thisWeek || [], g.nextWeek || [], g.later || [])
              .slice(0, 4).map(function(d){ return (d.dayShort || '?') + ' ' + (d.iso || '?') +
                (d.timeRange ? ' ' + d.timeRange : ''); }); })() : [],
      sinStockCards: [].slice.call(document.querySelectorAll('.product-card'))
        .filter(function(c){ return /Sin stock/i.test(c.textContent); }).length
    })`, 'con la zona elegida');
    linea('zona', dos.zona + (dos.provisoria ? ' (todavia provisoria)' : ''), dos.provisoria ? 'mal' : 'ok');
    linea('productos de la zona', String(dos.activos), dos.activos > 10 ? 'ok' : 'aviso');
    linea('stock del ERP', dos.stock + ' productos · ' + dos.sinStock + ' en cero',
      dos.stock > 20 ? 'ok' : 'mal');
    linea('piezas de carne', dos.piezasEstado + ' · ' + dos.piezas + ' piezas en ' +
      dos.cortes.length + ' cortes' + (dos.reserva ? ' · reserva llega ' + dos.reserva : ''),
      dos.piezasEstado === 'sin-datos' ? 'mal' : 'ok');
    linea('cards "Sin stock"', String(dos.sinStockCards), 'dato');
    linea('proximas entregas', (dos.fechas || []).join(' · ') || 'NINGUNA',
      (dos.fechas || []).length ? 'ok' : 'mal');

    /* ── 5) lo que nada de esto puede pasar por alto ── */
    console.log('\n' + DIM + '  salud:' + RST);
    linea('excepciones en consola', errores.length ? errores.length + ': ' + errores[0] : 'ninguna',
      errores.length ? 'mal' : 'ok');
    linea('POST cortados', cortados.length ? cortados.length + ' (' + cortados[0] + ')' : 'ninguno', 'dato');

    console.log('\n' + (fallas ? RED + fallas + ' mal' : VER + 'sin fallas') +
      (avisos ? DIM + ' · ' + avisos + ' para mirar' : '') + RST);
    console.log(DIM + '  Ojo: esto mide lo publicado, no si el navegador de Tadeo lo recibe.' +
      ' Para eso: node _tools/probar-cache.js' + RST + '\n');
    limpiar();
    process.exit(fallas ? 1 : 0);
  } catch (e) {
    console.error('\n' + RED + 'X ' + e.message + RST + '\n');
    limpiar();
    process.exit(1);
  }
}
main();
