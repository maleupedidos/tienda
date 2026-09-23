/**
 * La pagina de Catering arma bien el mensaje de WhatsApp (23/9/2026).
 *
 *   node _tools/verificar-catering.js
 *
 * Esta pagina existe para UNA cosa: que la persona escriba. Si el boton no
 * arma el mensaje, la pagina entera no sirve — y eso no se nota mirandola,
 * porque se ve igual de linda con el boton roto.
 *
 * Lo que se sostiene:
 * · el boton abre wa.me con el texto ya escrito, y NO manda nada a ningun lado
 *   (no hay fetch, no se guarda nada: es click-to-chat ENTRANTE, el mensaje
 *   sale del telefono de la persona);
 * · los acentos y los saltos de linea viajan bien (`encodeURIComponent`);
 * · anda aunque la persona no complete nada — el objetivo es que escriba, no
 *   que llene un formulario;
 * · la fecha se tipea dd/mm/aaaa con mascara, nunca con `type="date"`, que en
 *   varios iPhone sale mm/dd/aaaa;
 * · y NO se publica ningun precio: Tadeo, 22/9/2026, "nunca se publica el
 *   precio por persona".
 */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.env.PUERTO || 8246);
const RED = '\x1b[31m', VER = '\x1b[32m', RST = '\x1b[0m';
let ok = 0, mal = 0;
const chk = (t, c, d) => { if (c === true) { ok++; console.log(VER + '  ok   ' + RST + t); }
  else { mal++; console.log(RED + '  MAL  ' + RST + t + (d !== undefined ? '\n         ' + String(d).slice(0, 300) : '')); } };

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

function servir() {
  return new Promise((listo, fallo) => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      const abs = path.join(RAIZ, rel);
      if (!abs.startsWith(RAIZ) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404); res.end('no esta'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(abs).pipe(res);
    });
    srv.on('error', fallo);
    srv.listen(PUERTO, '127.0.0.1', () => listo(srv));
  });
}
function cdp(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { ok, mal } = pend.get(m.id); pend.delete(m.id); m.error ? mal(new Error(m.error.message)) : ok(m.result); } });
  return { listo: new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('no conecta'))); }),
    enviar: (m, p) => new Promise((ok, mal) => { const i = ++id; pend.set(i, { ok, mal }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }) };
}
async function esperarPagina(p) {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch('http://127.0.0.1:' + p + '/json/list');
      const pg = (await r.json()).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pg) return pg.webSocketDebuggerUrl; } catch (e) { /* todavia no */ }
    await new Promise((s) => setTimeout(s, 250));
  }
  throw new Error('Chrome no abrio');
}

(async () => {
  const exe = CHROMES.find((c) => fs.existsSync(c));
  if (!exe) { console.log(RED + 'No encontre Chrome ni Edge' + RST); process.exit(1); }
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'cat-'));
  const dep = 9337;
  const chrome = spawn(exe, ['--headless=new', '--remote-debugging-port=' + dep, '--user-data-dir=' + perfil,
    '--no-first-run', '--disable-gpu', '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
  const cerrar = (c) => { try { chrome.kill(); } catch (e) {} try { srv.close(); } catch (e) {} process.exit(c); };
  try {
    const cli = cdp(await esperarPagina(dep));
    await cli.listo;
    await cli.enviar('Page.enable'); await cli.enviar('Runtime.enable');
    /* Los errores de JS se anotan ANTES de navegar: una pagina rota se ve
       perfecta y el boton simplemente no hace nada. */
    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source:
      `window.__err=[]; window.addEventListener('error',function(e){window.__err.push(String(e.message));});
       window.__abierto=null; window.open=function(u){ window.__abierto=String(u); return null; };
       window.__fetch=0; var _f=window.fetch; window.fetch=function(){ window.__fetch++; return _f.apply(this,arguments); };` });
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/catering.html' });
    await new Promise((s) => setTimeout(s, 1200));
    const ev = async (e) => (await cli.enviar('Runtime.evaluate', { expression: e, returnByValue: true })).result.value;

    console.log('\n== Catering · el pedido de presupuesto ==\n');

    chk('la pagina arranca sin un solo error de JS', JSON.parse(await ev('JSON.stringify(window.__err||[])')).length === 0, await ev('JSON.stringify(window.__err||[])'));

    /* ── La mascara de fecha ── */
    await ev(`(function(){var e=document.getElementById('cat-fecha');e.value='23092026';catMascaraFecha(e);return e.value;})()`);
    chk('la fecha se escribe sola como dd/mm/aaaa', await ev(`document.getElementById('cat-fecha').value`) === '23/09/2026');
    chk('y no hay ni un type="date" (en varios iPhone sale mm/dd/aaaa)',
      await ev(`document.querySelectorAll('input[type="date"]').length`) === 0);

    /* ── El mensaje ── */
    await ev(`document.getElementById('cat-personas').value='30';
              document.getElementById('cat-donde').value='Estancias del Pilar';
              document.getElementById('cat-plan').value='Premium';
              window.__abierto=null; catPedirPresupuesto();`);
    const url = await ev('window.__abierto');
    chk('el boton abre el WhatsApp de Maleu', typeof url === 'string' && url.indexOf('https://wa.me/5491155038905?text=') === 0, url);
    const msg = decodeURIComponent(String(url).split('?text=')[1] || '');
    chk('el mensaje lleva la fecha, cuantos son, donde y el menu',
      /23\/09\/2026/.test(msg) && /Somos 30 personas/.test(msg) && /Estancias del Pilar/.test(msg) && /Premium/.test(msg), msg);
    chk('los acentos y las enies viajan enteros', /Dónde/.test(msg) && /Menú/.test(msg), msg);
    chk('va en varias lineas, no todo pegado', msg.split('\n').length >= 5, JSON.stringify(msg));
    chk('NO se manda nada a ningun servidor: el mensaje lo manda la persona', await ev('window.__fetch') === 0);

    /* ── Con los campos vacios TIENE que andar igual ──
       El objetivo es que escriba, no que complete un formulario. */
    await ev(`['cat-fecha','cat-personas','cat-donde'].forEach(function(i){document.getElementById(i).value='';});
              document.getElementById('cat-plan').value=''; window.__abierto=null; catPedirPresupuesto();`);
    const vacio = decodeURIComponent(String(await ev('window.__abierto')).split('?text=')[1] || '');
    chk('sin completar nada el boton anda igual y saluda', /Hola Maleu/.test(vacio) && vacio.indexOf('\n') < 0, JSON.stringify(vacio));

    /* ── Una persona sola no dice "1 personas" ── */
    await ev(`document.getElementById('cat-personas').value='1'; window.__abierto=null; catPedirPresupuesto();`);
    chk('una sola persona se dice en singular', /Somos 1 persona(\n|$)/.test(decodeURIComponent(String(await ev('window.__abierto')).split('?text=')[1] || '')));

    /* ── Ni un precio publicado ── */
    const texto = await ev(`document.body.textContent`);
    chk('la pagina no publica NINGUN precio (Tadeo: "nunca se publica el precio por persona")',
      !/\$\s?\d/.test(String(texto)) && !/20\.000|23\.000|por persona \$/.test(String(texto)),
      (String(texto).match(/\$\s?\d[\d.,]*/g) || []).join(' · '));

    /* ── Y que se llegue desde el resto del sitio ── */
    const conLink = fs.readdirSync(RAIZ).filter((f) => f.endsWith('.html') && f !== 'catering.html' && f !== 'ruleta.html')
      .filter((f) => fs.readFileSync(path.join(RAIZ, f), 'utf8').includes('/catering.html'));
    chk('todas las paginas del sitio linkean a Catering', conLink.length === 9, conLink.join(', '));

    console.log('\n  ' + ok + ' ok · ' + mal + ' mal\n');
    cerrar(mal ? 1 : 0);
  } catch (e) { console.log(RED + '\n  EXPLOTO: ' + (e && e.message || e) + RST + '\n'); cerrar(1); }
})();
