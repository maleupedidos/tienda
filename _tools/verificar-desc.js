/* verificar-desc.js — «Ver más» en la descripción de la card (17/11/2026)
 *
 *   node _tools/verificar-desc.js [ancho]        (RAIZ=<carpeta> prueba otra copia de la tienda)
 *
 * Los 4 aceites de Estilo Oliva cortaban en «Es el más liviano de los dos:…» sin forma de leer el resto. Mide:
 *   1. los 4 aceites: la descripción se corta de verdad y tiene «Ver más»; una corta NO lo tiene (se mide, no se cuenta);
 *   2. tocar «Ver más» con el mouse (el toque cae en el botón): se lee entera, dice «Ver menos», no suma al carrito,
 *      no abre nada (ni el modal de zona ni el carrito) y no hay POST;
 *   3. la fila pareja: con la descripción abierta, el botón «Agregar» de las cards de esa fila queda a la misma altura;
 *   4. «Ver menos» la vuelve a 3 renglones.
 */
const { spawn } = require('child_process');
const http = require('http'), path = require('path'), fs = require('fs'), os = require('os');
const ANCHO = parseInt(process.argv[2] || '390', 10), ALTO = ANCHO < 700 ? 844 : 900;
const RAIZ = process.env.RAIZ || path.join(__dirname, '..');
const PUERTO = 8491, DEBUG = 9351;
let ok = 0, mal = 0;
const V = '\x1b[32m', R = '\x1b[31m', G = '\x1b[2m', F = '\x1b[0m';
const chk = (c, t, x) => { if (c) { ok++; console.log('  ' + V + 'ok   ' + F + t + (x ? G + '  (' + x + ')' + F : '')); } else { mal++; console.log('  ' + R + 'MAL  ' + t + F + (x ? G + '  (' + x + ')' + F : '')); } };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const servir = () => new Promise((res) => {
  const s = http.createServer((req, rq) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html', f = path.join(RAIZ, rel);
    if (!f.startsWith(path.resolve(RAIZ)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rq.writeHead(404); rq.end('no'); return; }
    rq.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rq);
  });
  s.listen(PUERTO, '127.0.0.1', () => res(s));
});
function cdp(url) {
  const ws = new WebSocket(url); let id = 0; const pend = new Map();
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.x(new Error(m.error.message)) : p.o(m.result); } });
  return { listo: new Promise((r) => ws.addEventListener('open', r)), send: (m, p) => new Promise((o, x) => { const i = ++id; pend.set(i, { o, x }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }), cerrar: () => ws.close() };
}
async function esperarPagina() { for (let i = 0; i < 80; i++) { try { const p = (await (await fetch('http://127.0.0.1:' + DEBUG + '/json/list')).json()).find((x) => x.type === 'page' && x.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch (e) {} await dormir(250); } throw new Error('Chrome no abrió'); }

(async () => {
  console.log('\n' + G + 'verificar-desc.js — ' + ANCHO + 'px — raiz: ' + RAIZ + F + '\n');
  const srv = await servir();
  const perfil = path.join(os.tmpdir(), 'desc-' + Date.now());
  const chrome = spawn(process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ['--headless=new', '--remote-debugging-port=' + DEBUG, '--user-data-dir=' + perfil, '--window-size=' + ANCHO + ',' + ALTO, '--no-first-run', '--disable-gpu'], { stdio: 'ignore' });
  let c;
  try {
    c = cdp(await esperarPagina()); await c.listo;
    await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Network.enable');
    await c.send('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: ANCHO < 700 });
    await c.send('Network.setBlockedURLs', { urls: ['*googletagmanager*', '*google-analytics*', '*facebook.com*', '*facebook.net*', '*wa.me*', '*api.whatsapp.com*'] });
    await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      window.__posts = [];
      (function (of) { window.fetch = function (u, o) {
        if (o && (o.method || '').toUpperCase() === 'POST' && !/catalogo_tienda|tienda_[a-z_]+|_pantalla/.test(String(u))) { window.__posts.push(String(u)); return Promise.resolve(new Response('{"ok":false}', { status: 200 })); }
        if (String(u).indexOf('action=stock_full') >= 0)
          return Promise.resolve(new Response(${JSON.stringify(JSON.stringify(require('./precios-prueba.js')({})))}, { status: 200, headers: { 'Content-Type': 'application/json' } }));
        return of.apply(this, arguments); }; })(window.fetch);` });
    await c.send('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html' });
    const ev = async (e) => { const r = await c.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(String((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).slice(0, 220)); return r.result.value; };
    const esperar = async (e, ms) => { for (let i = 0; i < ms / 100; i++) { if (await ev(e).catch(() => false)) return true; await dormir(100); } return false; };
    const tocar = async (sel) => {
      await ev(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); if(e) e.scrollIntoView({block:'center',behavior:'instant'}); return !!e;})()`); await dormir(500);
      const b = await ev(`(function(){ var e=document.querySelector(${JSON.stringify(sel)}); if(!e)return null; var r=e.getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2, h=document.elementFromPoint(x,y);
        return {x:x,y:y,libre:!!h&&(h===e||e.contains(h)),tapa:h?String(h.className||h.nodeName):'nada',alto:Math.round(r.height)}; })()`);
      if (!b) return null;
      for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await c.send('Input.dispatchMouseEvent', { type, x: b.x, y: b.y, button: 'left', clickCount: 1 });
      await dormir(350); return b;
    };
    if (!await esperar(`document.querySelectorAll('.product-card .product-desc').length > 20`, 30000)) throw new Error('no se dibujó el catálogo');
    await dormir(1500);

    // 1. Quién tiene «Ver más»: los 4 aceites sí; una descripción que entra, no.
    const est = await ev(`(function(){ return [].map.call(document.querySelectorAll('.product-card'), function(card){ var d=card.querySelector('.product-desc'); if(!d||!d.clientHeight)return null;
      var b=d.nextElementSibling; return {id:card.getAttribute('data-id'), nom:(card.querySelector('.product-name')||{}).textContent||'', corta:d.scrollHeight>d.clientHeight+1, mas:!!(b&&b.classList.contains('desc-mas')), sec:(card.closest('[id]')||{}).id||''}; }).filter(Boolean); })()`);
    const aceites = est.filter((x) => /aceite/i.test(x.nom) && !/^(top|ultimo)-productos$/.test(x.sec));
    chk(aceites.length >= 4, 'los 4 aceites están en el catálogo', aceites.map((x) => x.nom).join(' · '));
    chk(aceites.length >= 4 && aceites.every((x) => x.corta === x.mas) && aceites.some((x) => x.corta), 'los 4 aceites: «Ver más» en los que se cortan (' + aceites.filter((x) => x.corta).length + ' de ' + aceites.length + ')', JSON.stringify(aceites.map((x) => [x.nom.slice(0, 22), x.corta, x.mas])));
    const mentiras = est.filter((x) => x.mas !== x.corta);
    chk(!mentiras.length, '«Ver más» sale SOLO donde el texto se corta (' + est.filter((x) => x.mas).length + ' con botón de ' + est.length + ' cards medidas)', JSON.stringify(mentiras.slice(0, 4)));
    const corta = est.find((x) => !x.corta);
    chk(!!corta && !corta.mas, 'una descripción que entra no tiene «Ver más» (' + (corta && corta.nom) + ')');

    // 2. Tocar «Ver más» en el primer aceite.
    const id = aceites[0] && aceites[0].id, card = `.product-card[data-id="${id}"]`;
    if (!id) throw new Error('sin aceites para tocar');
    const filaAntes = await ev(`(function(){ var c=document.querySelectorAll(${JSON.stringify(card)})[0]; var top=c.getBoundingClientRect().top;
      return [].filter.call(c.parentElement.children,function(x){ return Math.abs(x.getBoundingClientRect().top-top)<2; }).length; })()`);
    const carritoAntes = await ev(`JSON.stringify(typeof cart!=='undefined'?cart:null)+JSON.stringify(typeof piezaCart!=='undefined'?Object.keys(piezaCart):null)`);
    const t = await tocar(card + ' .desc-mas');
    chk(!!t && t.libre, 'el toque cae sobre «Ver más» (' + (t && t.alto) + 'px de alto)', t && !t.libre ? 'lo tapa ' + t.tapa : '');
    const ab = await ev(`(function(){ var c=document.querySelector(${JSON.stringify(card)}), d=c.querySelector('.product-desc'), b=c.querySelector('.desc-mas');
      var fila=[].filter.call(c.parentElement.children,function(x){ return Math.abs(x.getBoundingClientRect().top-c.getBoundingClientRect().top)<2; });
      var btn=fila.map(function(x){ var a=x.querySelector('.add-btn, .product-footer'); return a?Math.round(a.getBoundingClientRect().bottom):null; }).filter(function(v){return v!=null;});
      return {abierta:d.classList.contains('desc-abierta'), entera:d.scrollHeight<=d.clientHeight+1, texto:d.textContent.length, boton:b&&b.textContent, aria:b&&b.getAttribute('aria-expanded'),
        btn:btn, modal:[].some.call(document.querySelectorAll('.modal, .modal-overlay, #loc-modal, #cart-sidebar.open, .cart-sidebar.open'),function(m){ var s=getComputedStyle(m); return m.getClientRects().length&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'&&(m.classList.contains('open')||m.classList.contains('active')||m.classList.contains('show')); })}; })()`);
    chk(ab.abierta && ab.entera, 'se lee entera, ahí mismo (' + ab.texto + ' caracteres)', JSON.stringify(ab));
    chk(ab.boton === 'Ver menos' && ab.aria === 'true', 'el botón dice «Ver menos»', ab.boton);
    chk(carritoAntes === await ev(`JSON.stringify(typeof cart!=='undefined'?cart:null)+JSON.stringify(typeof piezaCart!=='undefined'?Object.keys(piezaCart):null)`), 'no sumó nada al carrito');
    chk(!ab.modal, 'no abrió ningún modal ni el carrito');
    const posts = await ev(`window.__posts`); chk(posts.length === 0, 'cero POST', posts.join(' | ').slice(0, 300));
    if (filaAntes > 1) chk(ab.btn.length > 1 && Math.max(...ab.btn) - Math.min(...ab.btn) <= 2, 'la fila sigue pareja: el pie de las ' + ab.btn.length + ' cards a la misma altura', JSON.stringify(ab.btn));
    else console.log(G + '  --   la card va sola en su fila a ' + ANCHO + 'px: no hay con qué emparejar' + F);
    if (process.env.CAPTURA) { const r = await c.send('Page.captureScreenshot', { format: 'png' }); const f = path.join(process.env.CAPTURA, 'desc_abierta_' + ANCHO + '.png'); fs.writeFileSync(f, Buffer.from(r.data, 'base64')); console.log(G + '       ' + f + F); }

    // 4. «Ver menos».
    await tocar(card + ' .desc-mas');
    const ce = await ev(`(function(){ var c=document.querySelector(${JSON.stringify(card)}), d=c.querySelector('.product-desc'), b=c.querySelector('.desc-mas'); return {abierta:d.classList.contains('desc-abierta'), corta:d.scrollHeight>d.clientHeight+1, boton:b&&b.textContent}; })()`);
    chk(!ce.abierta && ce.corta && ce.boton === 'Ver más', '«Ver menos» la vuelve a cortar y dice «Ver más»', JSON.stringify(ce));
    if (process.env.CAPTURA) { await ev(`document.querySelector(${JSON.stringify(card)}).scrollIntoView({block:'center'})`); await dormir(400); const r = await c.send('Page.captureScreenshot', { format: 'png' }); const f = path.join(process.env.CAPTURA, 'desc_cerrada_' + ANCHO + '.png'); fs.writeFileSync(f, Buffer.from(r.data, 'base64')); console.log(G + '       ' + f + F); }
  } catch (e) { mal++; console.log('  ' + R + 'MAL  reventó: ' + e.message + F); }
  finally {
    console.log('\n' + (mal ? R : V) + ok + ' ok · ' + mal + ' mal' + F + '\n');
    try { await c.send('Browser.close'); } catch (e) {}
    try { c.cerrar(); } catch (e) {} try { chrome.kill(); } catch (e) {} srv.close();
    process.exit(mal ? 1 : 0);
  }
})();
