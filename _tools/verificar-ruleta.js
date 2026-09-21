/**
 * La ruleta de premios del QR y el premio en la tienda (22/9/2026).
 *
 *   node _tools/verificar-ruleta.js            ← 390px
 *   node _tools/verificar-ruleta.js 1440       ← escritorio
 *
 * Con el backend SIMULADO (Fetch de CDP, desde antes de la primera navegacion):
 * ningun giro ni pedido llega a la planilla, y Analytics y el pixel quedan
 * cortados. Ademas ruleta.html y app.js se sirven con la URL del backend
 * cambiada por una que no existe (segundo seguro, igual que verificar-envio).
 *
 * A. ruleta.html?o=colegio&d=Los Robles&r=lucas
 *    · la rueda se dibuja con los premios del servidor (sin las probabilidades)
 *    · valida nombre, celular y barrio antes de mandar
 *    · el POST lleva el origen del QR, el lugar y quien lo consiguio
 *    · la rueda FRENA en el premio que eligio el servidor
 *    · el resultado muestra el codigo y el link a la tienda con ?cupon=
 *    · "ya sos cliente", "nada" y el error de un campo
 * B. la tienda con ?cupon=RUL-XXXX
 *    · lo valida, lo guarda en el celular y saca el ?cupon= de la URL
 *    · el resumen del pedido lo muestra "de regalo" y el pedido lo manda
 *    · el WhatsApp dice el premio
 *    · con minimo sin alcanzar: dice cuanto falta, NO lo manda y lo conserva
 *
 * Sale con codigo 1 si algo falla.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, '..'));
const ANCHO = Number(process.argv[2] || 390);
const ALTO = ANCHO < 700 ? 844 : 900;
const PUERTO = Number(process.env.PUERTO || (8340 + Math.floor(Math.random() * 60)));
const RED = '\x1b[31m', VER = '\x1b[32m', RST = '\x1b[0m';
const CHROMES = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

function servir() {
  return new Promise((listo, fallo) => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/') rel = '/index.html';
      if (rel === '/ruleta') rel = '/ruleta.html';
      /* Una pagina del MISMO origen que no carga app.js: para leer el localStorage
         despues de que la tienda se fue a WhatsApp (otro origen: ahi da siempre null). */
      if (rel === '/__vacio') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<p>vacio</p>'); return; }
      const abs = path.join(RAIZ, rel);
      if (!abs.startsWith(RAIZ) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404); res.end('no esta'); return; }
      if (rel === '/app.js' || rel === '/ruleta.html') {
        const src = fs.readFileSync(abs, 'utf8');
        const falso = src.replace(/\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec/g, '/macros/s/PRUEBA-verificar-ruleta-NO-EXISTE/exec');
        if (falso === src) { res.writeHead(500); res.end('no encontre la URL del backend'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)], 'Cache-Control': 'no-store' }); res.end(falso); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
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
    if (m.id && pend.has(m.id)) { const { ok, mal } = pend.get(m.id); pend.delete(m.id); m.error ? mal(new Error(m.error.message)) : ok(m.result); }
    else if (m.method) oyentes.forEach((f) => f(m));
  });
  return {
    listo: new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('no conecta'))); }),
    on: (f) => oyentes.push(f),
    enviar: (m, p) => new Promise((ok, mal) => { const i = ++id; pend.set(i, { ok, mal }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }),
  };
}
async function esperarPagina(puerto) {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch('http://127.0.0.1:' + puerto + '/json/list'); const p = (await r.json()).find((t) => t.type === 'page' && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch (e) {}
    await new Promise((s) => setTimeout(s, 250));
  }
  throw new Error('Chrome no abrio');
}
const dormir = (ms) => new Promise((s) => setTimeout(s, ms));

const PREMIOS = [{ i: 0, txt: '3 empanadas de regalo', min: 0, nada: false }, { i: 1, txt: '6 empanadas de regalo', min: 0, nada: false },
  { i: 2, txt: 'Una pizza de regalo', min: 0, nada: false }, { i: 3, txt: 'Un Franui de regalo', min: 50000, nada: false }, { i: 4, txt: 'Nada esta vez', min: 0, nada: true }];

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const srv = await servir();
  const base = 'http://127.0.0.1:' + PUERTO;
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-ruleta-'));
  const puertoCdp = 9650 + Math.floor(Math.random() * 90);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, 'about:blank'], { stdio: 'ignore' });
  let mal = 0, ok = 0;
  const chk = (c, t, d) => { if (c) ok++; else mal++; console.log('  ' + (c ? VER + 'ok   ' : RED + 'MAL  ') + RST + t + (c || d === undefined ? '' : '  -> ' + JSON.stringify(d))); };

  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable'); await cli.enviar('Runtime.enable'); await cli.enviar('Network.enable');
    await cli.enviar('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: ANCHO < 700 ? 3 : 1, mobile: ANCHO < 700 });
    const errores = [];
    cli.on((m) => { if (m.method === 'Runtime.exceptionThrown') errores.push(String((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text).slice(0, 160)); });

    /* ── El backend simulado ── */
    let giro = { en: 2000, r: { ok: true, nombre: 'Juana', lead: 'L-0099', premio: { i: 1, txt: '6 empanadas de regalo', nada: false, min: 0 }, cupon: 'RUL-AB12', vence: '22/10/2026' } };
    let cupon = { ok: true, codigo: 'RUL-AB12', tipo: 'REGALO', valor: 0, scope: 'TODO', mensaje: '6 empanadas de regalo', stack: true, descuento: 0, pending: false, minimo: 0 };
    const posts = [], navs = [];
    await cli.enviar('Fetch.enable', { patterns: [{ urlPattern: '*script.google.com*' }, { urlPattern: '*wa.me*' }, { urlPattern: '*google-analytics.com*' },
      { urlPattern: '*googletagmanager.com*' }, { urlPattern: '*facebook.com*' }, { urlPattern: '*facebook.net*' }, { urlPattern: '*fonts.g*' }] });
    const fulfill = (requestId, body, tipo) => cli.enviar('Fetch.fulfillRequest', { requestId, responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: tipo || 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }],
      body: Buffer.from(body).toString('base64') }).catch(() => {});
    cli.on(async (m) => {
      if (m.method !== 'Fetch.requestPaused') return;
      const { requestId, request, networkId } = m.params, url = request.url;
      if (/wa\.me/.test(url)) { navs.push(url); fulfill(requestId, '<p>whatsapp simulado</p>', 'text/html'); return; }
      if (!/script\.google\.com/.test(url)) { cli.enviar('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }).catch(() => {}); return; }
      if (request.method === 'GET') {
        if (/action=ruleta&/.test(url)) return fulfill(requestId, JSON.stringify({ ok: true, activa: true, premios: PREMIOS }));
        if (/action=validarCupon/.test(url)) return fulfill(requestId, JSON.stringify(cupon));
        return fulfill(requestId, '{"ok":true}');
      }
      let body = request.postData || '';
      if (!body && request.hasPostData && networkId) { try { body = (await cli.enviar('Network.getRequestPostData', { requestId: networkId })).postData || ''; } catch (e) {} }
      let data = {}; try { data = JSON.parse(body); } catch (e) {}
      posts.push(data);
      if (data.action === 'ruletaGirar') { setTimeout(() => fulfill(requestId, JSON.stringify(giro.r)), giro.en); return; }
      if (data.action) return fulfill(requestId, '{"ok":true}');
      setTimeout(() => fulfill(requestId, '{"ok":true,"n":"999"}'), 500);   // el pedido
    });
    const ev = async (e) => {
      const r = await cli.enviar('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(String((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text).slice(0, 160));
      return r.result.value;
    };
    const evS = async (e) => { try { return await ev(e); } catch (x) { return null; } };
    const lsDelOrigen = async (k) => { await cli.enviar('Page.navigate', { url: base + '/__vacio' }); await dormir(500); return ev(`localStorage.getItem(${JSON.stringify(k)})`); };
    const esperar = async (e, ms) => { for (let t = 0; t < ms; t += 100) { if (await evS(e)) return true; await dormir(100); } return false; };
    const tipear = (id, v) => ev(`(function(){var e=document.getElementById('${id}');e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}));return 1;})()`);
    async function abrirRuleta(q) {
      await cli.enviar('Page.navigate', { url: 'about:blank' }); await dormir(200);
      await cli.enviar('Storage.clearDataForOrigin', { origin: base, storageTypes: 'local_storage' });
      await cli.enviar('Page.navigate', { url: base + '/ruleta' + q });
      await esperar(`document.querySelectorAll('#gira path').length===5`, 8000);
    }

    console.log('\n== Ruleta · ' + ANCHO + 'px ==\n');
    /* ── A. La página de la ruleta ── */
    await abrirRuleta('?o=colegio&d=Los%20Robles&r=lucas');
    const rueda = JSON.parse(await ev(`JSON.stringify({ n: document.querySelectorAll('#gira path').length, txt: [].map.call(document.querySelectorAll('#gira text'), function(t){return t.textContent;}) })`));
    chk(rueda.n === 5 && rueda.txt.join('|') === '3empanadas|6empanadas|Una pizza|Un Franui|Nada', 'la rueda se dibuja con los 5 premios del servidor, en corto', rueda);
    const geo = JSON.parse(await ev(`(function(){ var r=document.querySelector('.rueda').getBoundingClientRect(), b=document.getElementById('girar').getBoundingClientRect();
      return JSON.stringify({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, rw: Math.round(r.width), bh: Math.round(b.height),
        inputs: [].map.call(document.querySelectorAll('#form input:not(#web)'), function(i){ return parseFloat(getComputedStyle(i).fontSize); }) }); })()`));
    chk(geo.sw <= geo.cw && geo.rw >= 240 && geo.rw <= 300 && geo.bh >= 48, 'sin scroll de costado, la rueda entre 240 y 300 px y el botón de 48 px o más', geo);
    chk(geo.inputs.every((f) => f >= 16), 'los campos en 16 px (en iPhone, menos hace zoom al tocar)', geo.inputs);

    await ev(`document.getElementById('girar').click()`); await dormir(200);
    chk(/Contanos tu nombre/.test(await ev(`document.getElementById('err').textContent`)) && posts.length === 0, 'sin nombre no gira ni manda nada');
    await tipear('nombre', 'Juana Prueba'); await tipear('tel', '11 2345');
    await ev(`document.getElementById('girar').click()`); await dormir(200);
    chk(/código de área/.test(await ev(`document.getElementById('err').textContent`)) && await ev(`document.getElementById('tel').classList.contains('mal')`) && posts.length === 0, 'un celular corto: lo dice y marca el campo');
    await tipear('tel', '11 2345 6789'); await tipear('barrio', 'La Pionera');
    await ev(`document.getElementById('girar').click()`);
    await dormir(700);
    const gir1 = await ev(`document.querySelector('#gira').getAttribute('transform')`);
    await dormir(400);
    const gir2 = await ev(`document.querySelector('#gira').getAttribute('transform')`);
    chk(gir1 !== gir2 && /Girando/.test(await ev(`document.getElementById('girar').textContent`)), 'mientras el servidor contesta, la rueda gira y el botón dice "Girando…"', [gir1, gir2]);
    const pg = posts.find((p) => p.action === 'ruletaGirar') || {};
    chk(pg.nombre === 'Juana Prueba' && pg.tel === '11 2345 6789' && pg.barrio === 'La Pionera' && pg.o === 'colegio' && pg.d === 'Los Robles' && pg.r === 'lucas' && pg.web === '',
      'el POST lleva los datos, el origen del QR (colegio), el lugar y quién lo consiguió', pg);
    const vio = await esperar(`!document.getElementById('res').hidden`, 15000);
    const fin = JSON.parse(await ev(`(function(){ var t=document.querySelector('#gira').getAttribute('transform'), g=Number((t.match(/rotate\\(([-0-9.]+)/)||[])[1]);
      var a=((360-(g%360))%360+360)%360; var r=document.getElementById('res');
      return JSON.stringify({ seg: Math.floor(a/72), txt: r.textContent.replace(/\\s+/g,' '), href: (r.querySelector('a.btn')||{}).href||'' }); })()`));
    chk(vio && fin.seg === 1, 'la rueda frena en el premio que eligió el servidor (6 empanadas)', fin);
    chk(/Juana, ganaste 6 empanadas de regalo!/.test(fin.txt) && /RUL-AB12/.test(fin.txt) && /hasta el 22\/10\/2026/.test(fin.txt) && fin.href === 'https://maleu.com.ar/?cupon=RUL-AB12',
      'el resultado: el premio, el código, el vencimiento y "Hacer mi pedido" con ?cupon=', fin);
    chk(await ev(`document.getElementById('form').hidden`), 'el formulario se va (no se puede volver a girar desde la pantalla)');

    giro = { en: 300, r: { ok: false, yaCliente: true, nombre: 'Ana', error: '¡Ya sos cliente de Maleu!' } };
    await abrirRuleta('?o=folleto');
    await tipear('nombre', 'Ana Prueba'); await tipear('tel', '1155550001'); await tipear('barrio', 'Estancias');
    await ev(`document.getElementById('girar').click()`); await esperar(`!document.getElementById('res').hidden`, 8000);
    chk(/Ana, ya sos cliente de Maleu/.test(await ev(`document.getElementById('res').textContent`)), 'un cliente: "ya sos cliente de Maleu", sin premio');

    giro = { en: 300, r: { ok: true, nombre: 'Beto', premio: { i: 4, txt: 'Nada esta vez', nada: true, min: 0 }, cupon: '', vence: '' } };
    await abrirRuleta('?o=evento');
    chk(/Si querés Maleu en tu casa/.test(await ev(`document.getElementById('sub').textContent`)), 'el QR de un evento cambia la bajada: "Si querés Maleu en tu casa…"');
    await tipear('nombre', 'Beto Prueba'); await tipear('tel', '1155550003'); await tipear('barrio', 'Pilar');
    await ev(`document.getElementById('girar').click()`); await esperar(`!document.getElementById('res').hidden`, 12000);
    const nada = JSON.parse(await ev(`(function(){ var g=Number((document.querySelector('#gira').getAttribute('transform').match(/rotate\\(([-0-9.]+)/)||[])[1]); var a=((360-(g%360))%360+360)%360;
      return JSON.stringify({ seg: Math.floor(a/72), txt: document.getElementById('res').textContent }); })()`));
    chk(nada.seg === 4 && /Esta vez no hubo premio/.test(nada.txt) && !/RUL-/.test(nada.txt), '"Nada": frena en Nada, lo dice y no muestra código', nada);

    giro = { en: 200, r: { ok: false, campo: 'tel', error: 'Revisá el celular: con código de área' } };
    await abrirRuleta('');
    await tipear('nombre', 'Caro Prueba'); await tipear('tel', '1100000000'); await tipear('barrio', 'Pilar');
    await ev(`document.getElementById('girar').click()`); await esperar(`/Revisá el celular/.test(document.getElementById('err').textContent)`, 6000);
    chk(await ev(`document.getElementById('tel').classList.contains('mal') && !document.getElementById('girar').disabled && document.getElementById('res').hidden`),
      'un error del servidor en un campo: lo muestra, marca el campo y deja volver a intentar');

    /* ── B. El premio en la tienda ── */
    async function pedidoConCupon(q) {
      await cli.enviar('Page.navigate', { url: 'about:blank' }); await dormir(200);
      await cli.enviar('Storage.clearDataForOrigin', { origin: base, storageTypes: 'local_storage' });
      await cli.enviar('Page.navigate', { url: base + '/index.html' + q });
      await esperar(`typeof enviarPedido === 'function' && typeof PRODUCTOS !== 'undefined'`, 15000);
      await dormir(900);
      await ev(`(function(){var b=[].slice.call(document.querySelectorAll('button,[onclick]')).filter(function(e){return /estancias/i.test(e.innerText||'');}); if(b.length)b[0].click();})()`);
      await dormir(600);
      await ev(`(function(){var b=[].slice.call(document.querySelectorAll('button,[onclick]')).filter(function(e){return /cualquier d|sin preferencia/i.test(e.innerText||'');}); if(b.length)b[0].click();})()`);
      await dormir(1000);
    }
    async function armarForm(nProd) {
      await ev(`(function(){ var b=[].slice.call(document.querySelectorAll('.add-btn')).filter(function(x){ return !x.disabled && x.offsetParent; }); for (var i=0;i<${nProd};i++) if (b[i]) b[i].click(); })()`);
      await dormir(600);
      await ev("typeof goToForm === 'function' ? goToForm() : null"); await dormir(800);
      await ev(`(function(){ var set=function(id,v){var e=document.getElementById(id); if(!e) return; e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));};
        set('f-nombre','Prueba Ruleta'); set('f-telefono','1122334455');
        var bp=document.getElementById('f-barrio-privado'); if(bp){ for(var i=0;i<bp.options.length;i++){ if(bp.options[i].value==='Estancias del Pilar'){bp.selectedIndex=i;break;} } bp.dispatchEvent(new Event('change',{bubbles:true})); } })()`);
      await dormir(600);
      await ev(`(function(){ var ba=document.getElementById('f-barrio'); if(ba){ for(var i=0;i<ba.options.length;i++){ if(ba.options[i].value){ba.selectedIndex=i;break;} } ba.dispatchEvent(new Event('change',{bubbles:true})); }
        var lo=document.getElementById('f-lote'); if(lo){ lo.value='123'; lo.dispatchEvent(new Event('input',{bubbles:true})); }
        var c=document.querySelector('#day-picker .dp-cell.available'); if(c) c.click();
        var pg=document.querySelector('input[name="pago"][value="Efectivo"]')||document.querySelector('input[name="pago"]'); if(pg){ pg.checked=true; pg.dispatchEvent(new Event('change',{bubbles:true})); } })()`);
      await dormir(700);
    }
    cupon = { ok: true, codigo: 'RUL-AB12', tipo: 'REGALO', valor: 0, scope: 'TODO', mensaje: '6 empanadas de regalo', stack: true, descuento: 0, pending: false, minimo: 0 };
    await pedidoConCupon('?cupon=rul-ab12');
    const cargo = JSON.parse(await ev(`JSON.stringify({ c: appliedCoupon, ls: localStorage.getItem('maleu_cupon_premio'), url: location.search, toast: (document.getElementById('toast')||{}).textContent||'' })`));
    chk(cargo.c && cargo.c.codigo === 'RUL-AB12' && cargo.c.tipo === 'REGALO' && cargo.ls === 'RUL-AB12' && !/cupon/.test(cargo.url) && /Tu premio quedó cargado: 6 empanadas de regalo/.test(cargo.toast),
      'la tienda toma ?cupon=, lo valida, lo guarda en el celular, lo saca de la URL y avisa', cargo);
    await armarForm(2);
    const res = await ev(`document.getElementById('form-summary').textContent.replace(/\\s+/g,' ')`);
    chk(/🎁 6 empanadas de regalo · RUL-AB12\s?de regalo/.test(res) && !/-\$0/.test(res), 'el resumen del pedido muestra el premio "de regalo" (sin un descuento de $0)', res);
    posts.length = 0; navs.length = 0;
    await ev('enviarPedido()');
    await esperar(`false`, 0);
    for (let t = 0; t < 12000 && !navs.length; t += 200) await dormir(200);
    const ped = posts.find((p) => !p.action) || {};
    const wa = decodeURIComponent((navs[0] || '').replace(/^[^?]*\?text=/, ''));
    chk(ped.cupon === 'RUL-AB12', 'el pedido viaja con el código (el backend lo marca usado al guardarlo)', ped.cupon);
    chk(/🎁 Premio de la ruleta \(RUL-AB12\): 6 empanadas de regalo/.test(wa), 'el WhatsApp dice el premio, así el que arma el pedido lo suma', wa.slice(0, 200));
    chk(await lsDelOrigen('maleu_cupon_premio') === null, 'usado el premio, se borra del celular');

    cupon = { ok: true, codigo: 'RUL-FR99', tipo: 'REGALO', valor: 0, scope: 'TODO', mensaje: 'Un Franui de regalo', stack: true, descuento: 0, pending: false, minimo: 50000 };
    await pedidoConCupon('?cupon=RUL-FR99');
    await armarForm(1);
    const res2 = JSON.parse(await ev(`JSON.stringify({ s: document.getElementById('form-summary').textContent.replace(/\\s+/g,' '), tot: cartTotal() })`));
    chk(res2.tot < 50000 && /🎁 Un Franui de regalo · RUL-FR99\s?sumá \$38\.500/.test(res2.s), 'con mínimo de $50.000 sin alcanzar: dice cuánto falta', res2);
    posts.length = 0; navs.length = 0;
    await ev('enviarPedido()');
    for (let t = 0; t < 12000 && !navs.length; t += 200) await dormir(200);
    const ped2 = posts.find((p) => !p.action) || {};
    chk(navs.length && !ped2.cupon && !posts.some((p) => p.action === 'usarCupon'), 'y NO lo manda con el pedido (no se gasta)', { cupon: ped2.cupon, acciones: posts.map((p) => p.action || 'pedido') });
    chk(await lsDelOrigen('maleu_cupon_premio') === 'RUL-FR99', 'queda guardado en el celular para el próximo pedido');

    cupon = { ok: false, codigo: 'RUL-AB12', error: 'Este premio ya se usó' };
    await pedidoConCupon('?cupon=RUL-AB12');
    await dormir(400);
    const usado = JSON.parse(await ev(`JSON.stringify({ c: appliedCoupon, ls: localStorage.getItem('maleu_cupon_premio'), toast: (document.getElementById('toast')||{}).textContent||'' })`));
    chk(!usado.c && usado.ls === null && /ya se usó/.test(usado.toast), 'un premio ya usado: lo dice y no lo carga', usado);

    chk(errores.length === 0, 'sin errores de JS', errores.slice(0, 3));
  } catch (e) {
    mal++; console.log('  ' + RED + 'ERROR ' + RST + e.message);
  } finally {
    try { proc.kill(); } catch (e) {}
    srv.close();
  }
  console.log('\n' + ok + ' ok · ' + mal + ' mal');
  process.exit(mal ? 1 : 0);
}
main();
