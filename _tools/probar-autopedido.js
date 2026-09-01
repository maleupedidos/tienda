/**
 * Prueba del modo autopedido, en un Chrome de verdad.
 *
 * Lo que tiene que pasar:
 *   - SIN ?autopedido=1  -> la tienda de Estancias se ve EXACTAMENTE igual que
 *     siempre: los 4 sorrentinos de Pilar no aparecen, y no hay cartel.
 *   - CON ?autopedido=1  -> aparecen los 4, y el cartel avisa.
 *
 * Lo primero importa mas que lo segundo: este cambio no puede tocar en nada lo
 * que ve un cliente.
 *
 *   node _tools/probar-autopedido.js        (necesita el servidor en :8081)
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const http = require('http');
const path = require('path');

const RAIZ = path.join(__dirname, ".."); // la tienda esta un nivel arriba
const RED = '\x1b[31m', VER = '\x1b[32m', DIM = '\x1b[2m', RST = '\x1b[0m';
const PUERTO_WEB = 8099;

const SOLO_PILAR = [
  'Sorrentinos Queso Brie',
  'Sorrentinos Langostinos al Azafrán',
  'Sorrentinos Pollo y Puerro',
  'Sorrentinos Espinaca',
];

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };

function servir() {
  return new Promise((res) => {
    const s = http.createServer((req, rep) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const f = path.join(RAIZ, p);
      if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        rep.writeHead(404); rep.end('no'); return;
      }
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      rep.end(fs.readFileSync(f));
    });
    s.listen(PUERTO_WEB, () => res(s));
  });
}

function conectar(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pend = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      m.error ? mal(new Error(m.error.message)) : ok(m.result);
    }
  });
  const listo = new Promise((r, j) => {
    ws.addEventListener('open', r);
    ws.addEventListener('error', () => j(new Error('no pude conectar')));
  });
  return {
    listo,
    enviar: (method, params) => new Promise((ok, mal) => {
      const i = ++id; pend.set(i, { ok, mal });
      ws.send(JSON.stringify({ id: i, method, params: params || {} }));
    }),
    cerrar() { try { ws.close(); } catch (e) { /* ya */ } }
  };
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

async function mirar(cli, conParam) {
  const url = 'http://127.0.0.1:' + PUERTO_WEB + '/index.html' + (conParam ? '?autopedido=1' : '');
  await cli.enviar('Page.navigate', { url });
  // esperar a que la app defina lo suyo
  for (let i = 0; i < 80; i++) {
    const r = await cli.enviar('Runtime.evaluate', {
      expression: "typeof setZone === 'function' && typeof getActiveProducts === 'function'",
      returnByValue: true });
    if (r.result && r.result.value === true) break;
    await new Promise((s) => setTimeout(s, 250));
  }
  const r = await cli.enviar('Runtime.evaluate', {
    expression: `(function(){
      try {
        setZone('estancias');
        var nombres = getActiveProducts().map(function(p){return p.nombre;});
        return JSON.stringify({
          ok: true,
          total: nombres.length,
          nombres: nombres,
          banner: !!document.getElementById('banner-autopedido'),
          modo: (typeof MODO_AUTOPEDIDO !== 'undefined') ? MODO_AUTOPEDIDO : 'no existe'
        });
      } catch (e) { return JSON.stringify({ ok:false, err: String(e) }); }
    })()`,
    returnByValue: true });
  return JSON.parse(r.result.value);
}

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error(RED + 'X no encontre Chrome' + RST); process.exit(1); }
  const web = await servir();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-auto-'));
  const puerto = 9800 + Math.floor(Math.random() * 300);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puerto, '--user-data-dir=' + perfil, 'about:blank'], { stdio: 'ignore' });

  let cli, fallas = 0;
  const limpiar = () => {
    if (cli) cli.cerrar();
    try { proc.kill(); } catch (e) { /* ya */ }
    try { web.close(); } catch (e) { /* ya */ }
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* ocupado */ }
  };

  try {
    cli = conectar(await esperarPagina(puerto));
    await cli.listo;
    await cli.enviar('Runtime.enable');
    await cli.enviar('Page.enable');

    console.log('\n== AUTOPEDIDO: el catalogo completo, solo para Tadeo ==\n');

    const sin = await mirar(cli, false);
    const con = await mirar(cli, true);
    if (!sin.ok) throw new Error('sin parametro: ' + sin.err);
    if (!con.ok) throw new Error('con parametro: ' + con.err);

    const chequeo = (nombre, cond) => {
      if (!cond) fallas++;
      console.log('  ' + (cond ? VER + 'ok  ' + RST : RED + 'MAL ' + RST) + nombre);
    };

    console.log(DIM + '  zona Estancias, sin el parametro:' + RST);
    for (const p of SOLO_PILAR) {
      chequeo('  no se ve "' + p + '"', sin.nombres.indexOf(p) < 0);
    }
    chequeo('  no aparece el cartel', sin.banner === false);
    chequeo('  MODO_AUTOPEDIDO = false', sin.modo === false);
    console.log(DIM + '    (' + sin.total + ' productos a la vista)' + RST);

    console.log(DIM + '\n  zona Estancias, con ?autopedido=1:' + RST);
    for (const p of SOLO_PILAR) {
      chequeo('  SI se ve "' + p + '"', con.nombres.indexOf(p) >= 0);
    }
    chequeo('  aparece el cartel de aviso', con.banner === true);
    chequeo('  MODO_AUTOPEDIDO = true', con.modo === true);
    console.log(DIM + '    (' + con.total + ' productos a la vista)' + RST);

    chequeo('\n  el modo agrega exactamente ' + SOLO_PILAR.length + ' productos, ni uno mas',
      con.total - sin.total === SOLO_PILAR.length);

    limpiar();
    console.log('\n  ' + (fallas ? RED + fallas + ' FALLAN' + RST : VER + 'todo bien' + RST) + '\n');
    process.exit(fallas ? 1 : 0);
  } catch (e) {
    console.error(RED + 'X ' + e.message + RST);
    limpiar();
    process.exit(1);
  }
}

main();
