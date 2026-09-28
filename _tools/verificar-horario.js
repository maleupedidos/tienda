/* verificar-horario.js — no se ofrece una entrega cuyo reparto ya salio
 *
 *   node _tools/verificar-horario.js
 *
 * El 28/9/2026 el simulador de experiencia de cliente encontro que la tienda
 * ofrecia "HOY - 18 a 19 hs" a las 19:16 de un lunes. El filtro existia
 * —"si la entrega ya termino, saltar"— pero preguntaba por el fin del DIA,
 * asi que no sacaba "hoy" nunca.
 *
 * Se mide moviendo el reloj a los dos lados del corte de cada dia, que es la
 * unica forma de probarlo: un martes al mediodia todo da verde igual.
 *
 * CONTROL: antes de exigir que un dia NO este, se exige que en el momento
 * anterior SI este. Sin eso, "no aparece hoy" tambien lo cumple un calendario
 * roto que no muestra nada.
 *
 * Cero POST: no toca ningun boton que guarde.
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

const RAIZ = process.env.RAIZ || path.join(__dirname, '..');
const PUERTO = 8473;
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

/* Los momentos, en hora de Argentina. Estancias reparte lunes 18-19,
   miercoles/viernes/sabado 19-21 y domingo 11-13. */
const CASOS = [
  { t: '2026-09-28T17:30:00-03:00', dia: 'lunes 28/9 17:30', hoy: true,  que: 'una hora antes de salir el reparto' },
  { t: '2026-09-28T19:16:00-03:00', dia: 'lunes 28/9 19:16', hoy: false, que: 'EL CASO REAL: el reparto de 18 a 19 ya paso' },
  { t: '2026-09-28T23:40:00-03:00', dia: 'lunes 28/9 23:40', hoy: false, que: 'casi medianoche' },
  { t: '2026-09-27T10:00:00-03:00', dia: 'domingo 27/9 10:00', hoy: true,  que: 'antes del reparto de 11 a 13' },
  { t: '2026-09-27T13:30:00-03:00', dia: 'domingo 27/9 13:30', hoy: false, que: 'el domingo es el peor: 11 horas de agujero' },
  { t: '2026-09-30T18:45:00-03:00', dia: 'miercoles 30/9 18:45', hoy: true,  que: 'el miercoles reparte 19 a 21' },
  { t: '2026-09-30T21:30:00-03:00', dia: 'miercoles 30/9 21:30', hoy: false, que: 'y a las 21:30 ya paso' },
];

(async () => {
  console.log('\n' + G + 'verificar-horario.js — raiz: ' + RAIZ + F);
  console.log(G + 'Estancias: lun 18-19 · mie/vie/sab 19-21 · dom 11-13' + F + '\n');
  const srv = await servir();
  const perfil = path.join(os.tmpdir(), 'hor-' + Date.now());
  const chrome = spawn(process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9335', '--user-data-dir=' + perfil,
    '--window-size=390,844', '--no-first-run', '--disable-gpu',
  ], { stdio: 'ignore' });

  let c;
  try {
    c = cdp(await esperarPagina(9335));
    await c.listo;
    await c.send('Page.enable');
    await c.send('Runtime.enable');
    await c.send('Network.enable');
    await c.send('Network.setBlockedURLs', { urls: [
      '*googletagmanager*', '*google-analytics*', '*facebook.com*', '*facebook.net*',
      '*script.google.com*', '*script.googleusercontent.com*',
    ] });
    await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

    const ev = async (expr) => {
      const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return r && r.result ? r.result.value : undefined;
    };

    for (const caso of CASOS) {
      const ms = new Date(caso.t).getTime();
      /* El reloj se congela ANTES de que arranque la tienda: el calendario se
         arma en el arranque, asi que pisarlo despues no cambia nada. */
      await c.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `
          (function (real) {
            var fijo = ${ms};
            var D = function () {
              if (arguments.length === 0) return new real(fijo);
              return new (Function.prototype.bind.apply(real, [null].concat([].slice.call(arguments))))();
            };
            D.now = function () { return fijo; };
            D.UTC = real.UTC; D.parse = real.parse; D.prototype = real.prototype;
            window.Date = D;
          })(Date);
          try { localStorage.setItem('maleu_zone', 'estancias'); } catch (e) {}
        `,
      });
      await c.send('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?cb=' + ms });
      await dormir(2200);

      const r = await ev(`(function () {
        var g = _getNextDeliveryDatesGrouped('estancias');
        var todos = [].concat(g.thisWeek || [], g.nextWeek || [], g.later || []);
        return JSON.stringify({
          /* Se compara isToday, NO una etiqueta. La primera version miraba
             d.label, que no existe (el campo es dayShort), asi que hoy daba
             false SIEMPRE y los cuatro chequeos de "no se ofrece hoy"
             pasaban sin medir nada. Los delataron los tres que esperaban
             lo contrario. Sin backticks a proposito: adentro de un template
             string rompen el literal. */
          hoy: todos.some(function (d) { return d.isToday === true; }),
          primera: todos.length ? (todos[0].dayShort + ' ' + todos[0].iso) : 'NINGUNA',
          cuantas: todos.length
        });
      })()`);
      const d = JSON.parse(r || '{}');

      /* CONTROL: si el calendario no ofrece NADA, "hoy no esta" no prueba
         nada — prueba que se rompio el calendario entero. */
      chk(d.cuantas > 0, caso.dia + ' — el calendario ofrece fechas', d.cuantas + ' fechas');
      chk(d.hoy === caso.hoy,
          caso.dia + ' — ' + (caso.hoy ? 'SE ofrece hoy' : 'NO se ofrece hoy') + ': ' + caso.que,
          'primera: ' + d.primera);
    }

    console.log('\n' + G + '== Las zonas sin hora declarada no cambian ==' + F);
    const pil = await ev(`(function () {
      /* Pilar y Clubes dicen "A coordinar": sin hora no se inventa un corte,
         se deja el dia entero como antes. */
      return JSON.stringify({
        pilar: ZONAS.pilar.horarios,
        corte: _cierreDelDiaMs('2026-09-30', 'pilar'),
        medianoche: Date.UTC(2026, 9, 1, 3, 0, 0, 0)
      });
    })()`);
    const pd = JSON.parse(pil || '{}');
    chk(/coordinar/i.test(JSON.stringify(pd.pilar)), 'Pilar sigue diciendo "A coordinar"');
    chk(pd.corte === pd.medianoche, 'y su corte sigue siendo el fin del dia, como antes');

    const p = await ev(`JSON.stringify(window.__posts || [])`);
    chk(!p || JSON.parse(p).length === 0, 'ningun POST al backend');

  } catch (e) {
    mal++;
    console.log('  ' + R + 'MAL  el test reventó: ' + e.message + F);
  } finally {
    if (c) c.cerrar();
    chrome.kill();
    srv.close();
  }

  console.log('\n' + (mal === 0 ? V : R) + ok + ' ok · ' + mal + ' mal' + F + '\n');
  process.exit(mal === 0 ? 0 : 1);
})();
