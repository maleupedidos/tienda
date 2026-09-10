/**
 * Que no se rompa la pantalla: desborde, texto cortado y botones chicos.
 *
 *   node _tools/verificar-layout.js
 *
 * POR QUE EXISTE. Ninguna de las otras redes agarra esto: el HTML es valido, el
 * JS parsea, los links existen, el pedido llega al Sheets. Y sin embargo el
 * cliente ve un monto cortado, un boton que no puede tocar con el pulgar, o la
 * pagina corrida a lo ancho. Es lo que Tadeo reporta con una captura, o sea lo
 * que ya llego tarde.
 *
 * Abre las 9 paginas en un Chrome de verdad, a 390 y a 1440, y busca:
 *   · que la pagina no se pase de ancho (scroll horizontal)
 *   · texto que no entra en su caja y queda cortado
 *   · controles por debajo del minimo tactil en el celular
 *
 * QUE **NO** MARCA, y cada exclusion se pago con un falso positivo:
 *   · lo que puede scrollear — una barra de chips que se pasa del ancho esta
 *     hecha para eso
 *   · lo que tiene `text-overflow: ellipsis` — ahi el corte es deliberado
 *   · los hijos de un flex — que un rotulo mida 45px y su valor 105 es normal
 *   · los adornos con `overflow:hidden` del padre, que estan recortados a mano
 *
 * Un instrumento con ruido no se mira. Si algo de lo de arriba vuelve a
 * aparecer como problema, se agrega a la lista de exclusiones, no se ignora
 * la salida entera.
 *
 * Sale con codigo 1 si encuentra algo.
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.env.PUERTO || 8244);
const RED = '\x1b[31m', VER = '\x1b[32m', DIM = '\x1b[2m', RST = '\x1b[0m';
/* 44px es el minimo tactil que ya usa el resto del proyecto. */
const MIN_TACTIL = 44;

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
    srv.on('error', fallo);
    srv.listen(PUERTO, '127.0.0.1', () => listo(srv));
  });
}

function cdp(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map(); const oyentes = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      m.error ? mal(new Error(m.error.message)) : ok(m.result); }
    else if (m.method) oyentes.forEach((f) => f(m));
  });
  return { listo: new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', () => j(new Error('no conecta'))); }),
    on: (f) => oyentes.push(f),
    enviar: (m, p) => new Promise((ok, mal) => { const i = ++id; pend.set(i, { ok, mal });
      ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }) };
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

const REVISION = `(function () {
  var W = document.documentElement.clientWidth;
  var celular = W < 500;
  var problemas = [];
  var mirados = 0;

  function nombre(el) {
    var t = el.tagName.toLowerCase();
    if (el.id) return t + '#' + el.id;
    if (el.className && typeof el.className === 'string') return t + '.' + el.className.trim().split(/\\s+/)[0];
    return t;
  }
  function puedeScrollear(el) {
    var p = el;
    for (var i = 0; i < 4 && p; i++) {
      var o = getComputedStyle(p);
      if (/auto|scroll/.test(o.overflowX) || /auto|scroll/.test(o.overflow)) return true;
      p = p.parentElement;
    }
    return false;
  }
  function recortadoAProposito(el) {
    var p = el.parentElement;
    for (var i = 0; i < 3 && p; i++) {
      if (getComputedStyle(p).overflow === 'hidden') return true;
      p = p.parentElement;
    }
    return false;
  }

  /* 1. la pagina no se pasa de ancho */
  if (document.documentElement.scrollWidth > W + 1) {
    problemas.push('la pagina se pasa ' + (document.documentElement.scrollWidth - W) + 'px a lo ancho');
  }

  var todos = document.querySelectorAll('body *');
  for (var i = 0; i < todos.length; i++) {
    var el = todos[i];
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    var r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    mirados++;

    /* 2. texto cortado — solo si NO es un ellipsis deliberado y NO scrollea */
    if (cs.textOverflow !== 'ellipsis' && !puedeScrollear(el) && !recortadoAProposito(el)) {
      var soloTexto = el.children.length === 0 && (el.textContent || '').trim().length > 0;
      if (soloTexto && el.scrollWidth > el.clientWidth + 2) {
        problemas.push(nombre(el) + ' tiene texto cortado (' + el.scrollWidth + ' en ' + el.clientWidth + 'px): "' +
          (el.textContent || '').trim().slice(0, 40) + '"');
      }
    }

    /* 3. controles chicos, solo en el celular */
    if (celular) {
      var esControl = /^(button|a|select|input|textarea)$/.test(el.tagName.toLowerCase());
      /* Un <a> que es parte de un parrafo no es un boton: solo cuenta si esta
         solo en su linea o es un bloque. Sin esto, cada link dentro de un texto
         legal sale como "control chico" y son decenas. */
      var enParrafo = el.tagName.toLowerCase() === 'a' &&
                      el.parentElement && /^(p|li|span)$/.test(el.parentElement.tagName.toLowerCase());
      /* El logo del header queda afuera A PROPOSITO. Su alto lo da la imagen
         (26px), y llevarlo a 44 estiraria el header de las nueve paginas. No es
         un control que se busque a ciegas con el pulgar: es el ancla de la
         marca, y lo que hace —volver a la tienda— esta tambien en el menu y en
         el boton "Ir a la tienda". */
      var esLogo = /logo/.test(String(el.className || ''));
      if (esControl && !enParrafo && !esLogo && r.height < ${MIN_TACTIL} - 0.5) {
        problemas.push(nombre(el) + ' mide ' + Math.round(r.height) + 'px de alto (minimo ${MIN_TACTIL})');
      }
    }
  }
  /* Sin esto, "0 problemas" sobre 0 elementos examinados pasaria por verde. */
  return JSON.stringify({ problemas: problemas, mirados: mirados, ancho: W });
})()`;

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('No encontre Chrome ni Edge'); process.exit(1); }
  const paginas = fs.readdirSync(RAIZ).filter((f) => f.endsWith('.html')).sort();
  const srv = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-layout-'));
  const puertoCdp = 9750 + Math.floor(Math.random() * 200);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puertoCdp, '--user-data-dir=' + perfil, 'about:blank'], { stdio: 'ignore' });

  let malas = 0, errores = 0;
  try {
    const cli = cdp(await esperarPagina(puertoCdp));
    await cli.listo;
    await cli.enviar('Page.enable');
    await cli.enviar('Runtime.enable');
    await cli.enviar('Log.enable').catch(() => {});
    let consola = [];
    cli.on((m) => {
      if (m.method === 'Runtime.exceptionThrown') consola.push(String((m.params.exceptionDetails || {}).text || 'error'));
    });

    for (const [w, h, etiqueta] of [[390, 844, 'celular   '], [1440, 900, 'escritorio']]) {
      await cli.enviar('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 500 });
      for (const pag of paginas) {
        consola = [];
        /* La zona ya elegida: si no, el modal de bienvenida tapa la tienda y se
           mide el modal en vez de la pagina. */
        await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/' + pag + '?l=' + Date.now() });
        await cli.enviar('Runtime.evaluate', { expression: "try{localStorage.setItem('maleu_zone','estancias');}catch(e){}" });
        await cli.enviar('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/' + pag + '?l=' + (Date.now() + 1) });
        for (let i = 0; i < 80; i++) {
          const r = await cli.enviar('Runtime.evaluate', { returnByValue: true,
            expression: "document.readyState === 'complete' && document.body.innerText.length > 50" });
          if (r.result && r.result.value === true) break;
          await new Promise((s) => setTimeout(s, 100));
        }
        await new Promise((s) => setTimeout(s, 900));

        const r = await cli.enviar('Runtime.evaluate', { expression: REVISION, returnByValue: true });
        if (r.exceptionDetails || !r.result || typeof r.result.value !== 'string') {
          console.log(RED + '  MAL  ' + etiqueta + ' ' + pag + ': no se pudo medir' + RST); malas++; continue;
        }
        const o = JSON.parse(r.result.value);
        if (o.mirados < 10) {
          console.log(RED + '  MAL  ' + etiqueta + ' ' + pag + ': solo ' + o.mirados + ' elementos — la pagina no llego a pintar' + RST);
          malas++; continue;
        }
        if (consola.length) { errores += consola.length; }
        if (o.problemas.length) {
          malas += o.problemas.length;
          console.log(RED + '  MAL  ' + etiqueta + '  ' + pag + RST);
          o.problemas.slice(0, 5).forEach((p) => console.log('         ' + p));
          if (o.problemas.length > 5) console.log(DIM + '         (' + (o.problemas.length - 5) + ' mas)' + RST);
        } else {
          console.log(VER + '  ok   ' + RST + etiqueta + '  ' + pag.padEnd(22) + DIM + o.mirados + ' elementos' + RST);
        }
      }
    }
    if (errores) console.log(RED + '\n' + errores + ' error(es) de JS en consola' + RST);
  } finally {
    try { proc.kill(); } catch (e) {}
    try { srv.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  }

  if (malas || errores) { console.log(RED + '\n' + (malas + errores) + ' problema(s) de pantalla' + RST); process.exit(1); }
  console.log(DIM + '\nlas ' + paginas.length + ' paginas entran, se leen y se tocan' + RST);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
