/**
 * Las zonas de la tienda salen de los datos, y «Mi barrio no está en la lista» pregunta la zona (2/11/2026).
 *
 *   node _tools/verificar-otra-zona.js [ancho]        (390 por defecto)
 *
 * POR QUE EXISTE. Hasta hoy «Mi barrio no está» armaba un pedido de Pilar con lo que se escribiera: así entró Hock
 * con «Palermo», y Salvador eligió Santa Bárbara viviendo en Belgrano C. Tadeo decidió una sola tienda y que Maleu
 * reparta por zona. Lo que este test defiende:
 *   1. Un representante con una zona que la tienda no tiene escrita (acá «Belgrano», partido CABA) aparece solo
 *      como zona, sacado de la respuesta de `tienda_vendedores`.
 *   2. «Mi barrio no está» muestra las zonas de los representantes, la de Maleu en Pilar y «Mi zona no está».
 *   3. Elegir la zona del representante deja el barrio escrito tal cual (Belgrano C) en la dirección, con
 *      «Otro barrio de esta zona», y el pedido se rutea a ese representante.
 *   4. «Mi zona no está» no arma pedido: pide el teléfono, dice «avisale a tu representante o escribinos» y manda
 *      `tiendaLead` (interceptado: nada sale a la red).
 * Todo POST se corta en la página y por CDP; la base y Apps Script se simulan.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const conPrecios = require('./precios-prueba.js');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390), ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = 8700 + Math.floor(Math.random() * 90);
const CHROMES = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const VENDEDORES = { vendedores: [
  { nombre: 'Marcos Prueba', wa: '5491100000001', alias: 'x', barrios: ['Tortugas y alrededores', 'Tortugas'], partido: 'Pilar', localidad: '' },
  { nombre: 'Nuevo Representante', wa: '5491100000009', alias: 'y', barrios: ['Belgrano', 'Belgrano C', 'Belgrano R', 'Palermo'], partido: 'CABA', localidad: '' },
] };

const servir = () => new Promise((ok, mal) => {
  const srv = http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]); if (rel === '/') rel = '/index.html';
    const abs = path.join(RAIZ, rel);
    if (!abs.startsWith(RAIZ) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(abs).pipe(res);
  });
  srv.on('error', mal); srv.listen(PUERTO, '127.0.0.1', () => ok(srv));
});
function cdp(url) {
  const ws = new WebSocket(url); let id = 0; const pend = new Map(), oy = [];
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.mal(new Error(m.error.message)) : p.ok(m.result); }
    else if (m.method) oy.forEach((f) => f(m)); });
  return { listo: new Promise((r) => ws.addEventListener('open', r)), on: (f) => oy.push(f),
    enviar: (m, p) => new Promise((ok, mal) => { const i = ++id; pend.set(i, { ok, mal }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }) };
}
async function esperarPagina(p) {
  for (let i = 0; i < 80; i++) {
    try { const l = await (await fetch('http://127.0.0.1:' + p + '/json/list')).json(); const x = l.find((y) => y.type === 'page' && y.webSocketDebuggerUrl); if (x) return x.webSocketDebuggerUrl; } catch (e) {}
    await new Promise((s) => setTimeout(s, 250));
  }
  throw new Error('Chrome no abrió');
}
const dormir = (ms) => new Promise((s) => setTimeout(s, ms));

const PREP = '(function(){try{localStorage.clear();}catch(e){}' +
  'window.__posts=[];window.__err=[];addEventListener("error",function(e){window.__err.push(String(e.message).slice(0,120));});' +
  'navigator.sendBeacon=function(){return false;};var orig=window.fetch;' +
  'var json=function(o){return Promise.resolve(new Response(JSON.stringify(o),{status:200,headers:{"Content-Type":"application/json"}}));};' +
  'window.fetch=function(url,opts){var u=String(url),post=opts&&String(opts.method||"").toUpperCase()==="POST";' +
  ' if(u.indexOf("rpc/tienda_vendedores")>=0)return json(' + JSON.stringify(VENDEDORES) + ');' +
  ' if(u.indexOf("supabase")>=0)return Promise.resolve(new Response("",{status:404}));' +
  ' if(post&&u.indexOf("script.google")>=0){window.__posts.push(String(opts.body||""));return json({ok:true});}' +
  ' if(u.indexOf("action=stock_full")>=0)return json(' + JSON.stringify(conPrecios({})) + ');' +
  ' if(u.indexOf("action=vendedores")>=0)return json(' + JSON.stringify(VENDEDORES) + ');' +
  ' if(u.indexOf("script.google")>=0)return json({ok:true});' +
  ' return orig.apply(this,arguments);};})();';

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c)); if (!chrome) { console.error('Sin Chrome'); process.exit(1); }
  const srv = await servir(), perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-zonas-'));
  const pc = 9500 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=' + pc,
    '--user-data-dir=' + perfil, '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'], { stdio: 'ignore' });
  let bien = 0, mal = 0;
  const chk = (c, t, d) => { c ? bien++ : mal++; console.log((c ? '  ok   ' : '  MAL  ') + t + (c || d === undefined ? '' : '  -> ' + JSON.stringify(d).slice(0, 300))); };
  try {
    const cli = cdp(await esperarPagina(pc)); await cli.listo;
    await cli.enviar('Page.enable'); await cli.enviar('Runtime.enable');
    await cli.enviar('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: ANCHO < 700 });
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*script.google.com*' }, { urlPattern: '*supabase*' },
      { urlPattern: '*googletagmanager*' }, { urlPattern: '*google-analytics*' }, { urlPattern: '*facebook*' }, { urlPattern: '*wa.me*' }] });
    cli.on(async (m) => { if (m.method === 'Fetch.requestPaused') { try { await cli.enviar('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' }); } catch (e) {} } });
    await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: PREP });
    await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html' });
    const ev = async (expr) => { const r = await cli.enviar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(expr.slice(0, 60) + ': ' + JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result.value; };
    for (let i = 0; i < 60; i++) { if (await ev('typeof BARRIOS_PILAR_MODAL!=="undefined"&&BARRIOS_PILAR_MODAL.some(function(b){return b.val==="Belgrano"})')) break; await dormir(250); }

    const zona = await ev('JSON.stringify(BARRIOS_PILAR_MODAL.map(function(b){return [b.val,!!b.isRed,!!b.isOther,b.region||"",b.badge||""]}))');
    const zs = JSON.parse(zona);
    const iB = zs.findIndex((z) => z[0] === 'Belgrano'), iO = zs.findIndex((z) => z[2]);
    chk(iB >= 0 && zs[iB][1] && zs[iB][3] === 'CABA' && zs[iB][4] === 'Nuevo', '1. el representante nuevo aparece como zona (Belgrano, CABA, «Nuevo»)', zs);
    chk(iB >= 0 && iB < iO && iO === zs.length - 1, '   antes de «Otra zona de Pilar», que queda última', zs);
    chk(zs.filter((z) => z[0] === 'Tortugas y alrededores').length === 1, '   la zona que ya estaba escrita no se duplica', zs);

    await ev('_setOverlay(true); welcomeShowZoneStep(); var i=$id("dir-input"); i.value="Belgrano C"; i.dispatchEvent(new Event("input",{bubbles:true})); 1');
    await dormir(300);
    const btn = await ev('(function(){var b=[].slice.call(document.querySelectorAll("#loc-step-zone button")).filter(function(x){return /no est|no encuentro/i.test(x.textContent)});if(!b.length)return "";b[b.length-1].click();return b[b.length-1].textContent})()');
    await dormir(200);
    const cards = await ev('JSON.stringify([].slice.call(document.querySelectorAll("#otrazona-grid .loc-zona-card")).map(function(c){return c.querySelector(".loc-zona-name").textContent}))');
    const vis = await ev('getComputedStyle($id("loc-step-otrazona")).display!=="none" && getComputedStyle($id("loc-step-zone")).display==="none"');
    chk(btn && vis, '2. «Mi barrio no está» abre «¿En qué zona queda tu casa?»', { btn, vis });
    const cs = JSON.parse(cards);
    chk(cs.includes('Belgrano') && cs.includes('Tortugas y alrededores') && cs.includes('Otro barrio de Pilar') && cs[cs.length - 1] === 'Mi zona no está', '   con las zonas de los representantes, la de Maleu y «Mi zona no está» al final', cs);
    const desb = await ev('(function(){var g=$id("otrazona-grid");return g.scrollWidth<=g.clientWidth+1 && document.documentElement.scrollWidth<=innerWidth+1})()');
    chk(desb, '   a ' + ANCHO + ' px nada se sale de la pantalla');
    const shot = await cli.enviar('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(os.tmpdir(), 'zonas-' + ANCHO + '-otrazona.png'), Buffer.from(shot.data, 'base64'));

    await ev('[].slice.call(document.querySelectorAll("#otrazona-grid .loc-zona-card")).filter(function(c){return c.querySelector(".loc-zona-name").textContent==="Belgrano"})[0].click(); 1');
    await dormir(400);
    const r3 = JSON.parse(await ev('JSON.stringify({zone:currentZone, dir:($id("f-direccion")||{}).value, sub:($id("f-pilar-barrio")||{}).value, z:(_getPilarZonaActual()||{}).val, v:(_vendedorDeBarrio("Belgrano C")||{}).nombre, ov:$id("loc-overlay").className})'));
    chk(r3.zone === 'pilar' && r3.z === 'Belgrano', '3. elegir Belgrano deja la zona del representante', r3);
    chk(r3.dir === 'Belgrano C' && r3.sub === '__otro__', '   con el barrio escrito tal cual y «Otro barrio de esta zona»', r3);
    chk(r3.v === 'Nuevo Representante', '   y el pedido se rutea a su representante', r3);
    chk(/hidden/.test(r3.ov), '   y el selector se cierra', r3);

    await ev('_setOverlay(true); welcomeShowZoneStep(); $id("dir-input").value="Rosario"; _dirOtro(); 1');
    await ev('[].slice.call(document.querySelectorAll("#otrazona-grid .loc-zona-card")).pop().click(); 1');
    await dormir(200);
    const t4 = await ev('$id("loc-step-lead").innerText');
    chk(/Todavía no llegamos/i.test(t4) && /avisale a tu representante o escribinos/i.test(t4), '4. «Mi zona no está»: el cartel con «avisale a tu representante o escribinos»', t4);
    chk(await ev('$id("lead-barrio").value') === 'Rosario', '   el barrio que escribió ya viene puesto');
    await ev('$id("lead-tel").value="12"; leadEnviar(); 1'); await dormir(200);
    chk(/código de área/.test(await ev('$id("lead-msg").textContent')) && (await ev('window.__posts.length')) === 0, '   sin teléfono válido no manda nada');
    const shot2 = await cli.enviar('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(os.tmpdir(), 'zonas-' + ANCHO + '-lead.png'), Buffer.from(shot2.data, 'base64'));
    await ev('$id("lead-nombre").value="Ana"; $id("lead-tel").value="11 5555 1234"; leadEnviar(); 1'); await dormir(400);
    const posts = await ev('window.__posts');
    const p = posts.map((x) => { try { return JSON.parse(x); } catch (e) { return {}; } }).find((x) => x.action === 'tiendaLead');
    chk(p && p.tel === '1155551234' && p.barrio === 'Rosario' && p.nombre === 'Ana', '   con teléfono manda tiendaLead (nombre, teléfono, barrio)', posts);
    chk(/Listo/.test(await ev('$id("lead-msg").textContent')), '   y le confirma');
    chk(!posts.some((x) => /"action":"(pedido|nuevoPedido)"|"items"/.test(x)), '   y no se armó ningún pedido', posts);
    const err = await ev('window.__err');
    chk(!err.length, 'sin errores de JS', err);
    console.log('  capturas: ' + path.join(os.tmpdir(), 'zonas-' + ANCHO + '-*.png'));
  } catch (e) { console.log('CORTADO: ' + e.message); mal++; }
  finally { proc.kill(); srv.close(); }
  console.log('\n' + bien + ' ok · ' + mal + ' mal'); process.exit(mal ? 1 : 0);
}
main();
