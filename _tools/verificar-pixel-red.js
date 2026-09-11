/**
 * Que los eventos LLEGUEN a Meta, no que se encolen bien.
 *
 * El otro test bloquea fbevents.js para poder leer la cola. Este lo deja
 * cargar de verdad contra maleu.com.ar y mira las llamadas que salen a
 * facebook.com/tr — que es lo unico que prueba que Meta los recibe.
 *
 * Es la misma diferencia que curl vs el navegador: "el servidor lo tiene" y
 * "el cliente lo recibe" son dos preguntas distintas.
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawn } = require('child_process');
const VER = '\x1b[32m', RED = '\x1b[31m', DIM = '\x1b[2m', RST = '\x1b[0m';
const CHROMES = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
/* El ID sale del index.html: escrito a mano aca se despegaria del que de
   verdad esta instalado, y el test pasaria mirando un pixel que no existe. */
const PIXEL = (function () {
  const h = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
  const m = h.match(/fbq\(\s*'init'\s*,\s*'(\d+)'/);
  if (!m) { console.error('No encontre el fbq(init) en index.html'); process.exit(1); }
  return m[1];
})();
let ok = 0, mal = 0;
const chk = (c, m) => { if (c) { ok++; console.log(VER + '  ok   ' + RST + m); }
                        else { mal++; console.log(RED + '  MAL  ' + m + RST); } };

function cdp(url) {
  const ws = new WebSocket(url); let id = 0; const pend = new Map(); const hits = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Network.requestWillBeSent') {
      const u = m.params.request.url;
      if (u.indexOf('facebook.com/tr') >= 0) hits.push(u);
    }
    if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result); }
  });
  const listo = new Promise((r, j) => { ws.addEventListener('open', r);
    ws.addEventListener('error', () => j(new Error('no conecta'))); });
  return { listo, hits, enviar: (m, p) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }) };
}

(async () => {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'px-red-'));
  const puerto = 9855;
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puerto, '--user-data-dir=' + perfil,
    '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
  let wsUrl = null;
  for (let i = 0; i < 80 && !wsUrl; i++) {
    try { const r = await fetch('http://127.0.0.1:' + puerto + '/json/list');
      const p = (await r.json()).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (p) wsUrl = p.webSocketDebuggerUrl; } catch (e) {}
    await new Promise((s) => setTimeout(s, 250));
  }
  const cli = cdp(wsUrl); await cli.listo;
  await cli.enviar('Page.enable'); await cli.enviar('Runtime.enable'); await cli.enviar('Network.enable');
  await cli.enviar('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  /* El POST del pedido NO sale: no se toca la planilla. Todo lo demas es real. */
  await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source:
    "navigator.sendBeacon=function(){return false;};var o=window.fetch;" +
    "window.fetch=function(u,p){if(p&&String(p.method||'').toUpperCase()==='POST'){window.__post=String(p.body||'');" +
    "return new Promise(function(){});}return o.apply(this,arguments);};" });

  const ev = async (e) => (await cli.enviar('Runtime.evaluate',
    { returnByValue: true, awaitPromise: true, expression: e })).result.value;

  await cli.enviar('Page.navigate', { url: 'https://maleu.com.ar/index.html?r=' + Date.now() });
  for (let i = 0; i < 120; i++) {
    if (await ev("typeof setZone === 'function' && typeof fbq === 'function'")) break;
    await new Promise((s) => setTimeout(s, 250));
  }
  /* Un toque, que es lo que trae fbevents.js — igual que un cliente. */
  await cli.enviar('Input.dispatchMouseEvent', { type: 'mousePressed', x: 5, y: 5, button: 'left', clickCount: 1 });
  await cli.enviar('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 5, y: 5, button: 'left', clickCount: 1 });
  for (let i = 0; i < 60; i++) {
    if (await ev("typeof fbq === 'function' && !!fbq.callMethod")) break;
    await new Promise((s) => setTimeout(s, 250));
  }
  console.log('\n' + DIM + 'fbevents.js cargo: ' + (await ev("!!(window.fbq && fbq.callMethod)")) + RST);

  await ev("setZone('estancias')");
  await new Promise((s) => setTimeout(s, 1200));
  await ev("(function(){var g=document.getElementById('loc-dates-grid');if(!g)return;" +
    "var b=Array.prototype.slice.call(g.querySelectorAll('button')).filter(function(x){return !x.disabled;})[0];if(b)b.click();})()");
  await new Promise((s) => setTimeout(s, 2000));
  await ev("cart={}; addToCart(11); addToCart(11); goToForm();");
  await new Promise((s) => setTimeout(s, 1500));

  const con = (ev1) => cli.hits.filter((u) => u.indexOf('ev=' + ev1) >= 0).length;
  console.log('');
  chk(cli.hits.length > 0, 'salen llamadas a facebook.com/tr (' + cli.hits.length + ')');
  chk(cli.hits.every((u) => u.indexOf('id=' + PIXEL) >= 0), 'todas van al conjunto ' + PIXEL);
  chk(con('PageView') >= 1, 'PageView llego a Meta (' + con('PageView') + ')');
  chk(con('ViewContent') >= 1, 'ViewContent llego a Meta (' + con('ViewContent') + ')');
  chk(con('AddToCart') >= 1, 'AddToCart llego a Meta (' + con('AddToCart') + ')');
  chk(con('InitiateCheckout') >= 1, 'InitiateCheckout llego a Meta (' + con('InitiateCheckout') + ')');

  const conValor = cli.hits.filter((u) => u.indexOf('cd%5Bcurrency%5D=ARS') >= 0 || u.indexOf('cd[currency]=ARS') >= 0).length;
  chk(conValor >= 1, 'los eventos viajan con la moneda ARS adentro (' + conValor + ')');

  console.log('\n' + DIM + 'lo que salio:' + RST);
  cli.hits.forEach((u) => {
    const m = u.match(/[?&]ev=([^&]+)/);
    console.log('   ' + (m ? m[1] : '?'));
  });

  proc.kill();
  console.log('\n' + (mal ? RED : VER) + ok + ' ok · ' + mal + ' mal' + RST);
  process.exit(mal ? 1 : 0);
})();
