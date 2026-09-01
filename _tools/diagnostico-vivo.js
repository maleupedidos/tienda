/**
 * Diagnostico contra la tienda VIVA (maleu.com.ar), no contra la copia local.
 *
 * Tadeo reporta que con ?autopedido=1 no le aparecen los otros sorrentinos.
 * La prueba anterior pasaba porque llamaba setZone('estancias') a mano, que NO
 * es lo que hace una persona: una persona abre la pagina, le sale el modal de
 * bienvenida, y elige la zona ahi.
 *
 * Esto reproduce el camino real y reporta el estado interno en cada paso.
 *
 *   node _tools/diagnostico-vivo.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const URL_VIVA = 'https://maleu.com.ar/?autopedido=1';
const RED = '\x1b[31m', VER = '\x1b[32m', AMA = '\x1b[33m', DIM = '\x1b[2m', RST = '\x1b[0m';
const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

function conectar(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      m.error ? mal(new Error(m.error.message)) : ok(m.result);
    }
  });
  const listo = new Promise((r, j) => {
    ws.addEventListener('open', r);
    ws.addEventListener('error', () => j(new Error('no conecta')));
  });
  return { listo,
    enviar: (m, p) => new Promise((ok, mal) => { const i = ++id; pend.set(i, { ok, mal }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }),
    cerrar() { try { ws.close(); } catch (e) { /* ya */ } } };
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

async function main() {
  const chrome = CHROMES.find((c) => fs.existsSync(c));
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'maleu-diag-'));
  const puerto = 9600 + Math.floor(Math.random() * 300);
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + puerto, '--user-data-dir=' + perfil, 'about:blank'], { stdio: 'ignore' });
  let cli;
  const limpiar = () => { if (cli) cli.cerrar(); try { proc.kill(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {} };

  try {
    cli = conectar(await esperarPagina(puerto));
    await cli.listo;
    await cli.enviar('Runtime.enable');
    await cli.enviar('Page.enable');
    await cli.enviar('Network.enable');
    await cli.enviar('Network.setCacheDisabled', { cacheDisabled: true });

    const errores = [];
    console.log('\n== DIAGNOSTICO contra ' + URL_VIVA + ' ==\n');
    await cli.enviar('Page.navigate', { url: URL_VIVA });
    for (let i = 0; i < 100; i++) {
      const r = await cli.enviar('Runtime.evaluate', {
        expression: "typeof PRODUCTOS !== 'undefined' && typeof getActiveProducts === 'function'",
        returnByValue: true });
      if (r.result && r.result.value === true) break;
      await new Promise((s) => setTimeout(s, 250));
    }

    const ev = async (expr) => {
      const r = await cli.enviar('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) return { _err: r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception || {}).description };
      return r.result.value;
    };

    // ── 1) llego el codigo nuevo? ──
    const base = await ev(`JSON.stringify({
      search: location.search,
      modoExiste: typeof MODO_AUTOPEDIDO !== 'undefined',
      modo: (typeof MODO_AUTOPEDIDO !== 'undefined') ? MODO_AUTOPEDIDO : null,
      zonaPermiteExiste: typeof _zonaPermite === 'function',
      zonaGuardada: (function(){try{return localStorage.getItem('maleu_zone');}catch(e){return 'err';}})(),
      currentZone: (typeof currentZone !== 'undefined') ? currentZone : 'undef',
      banner: !!document.getElementById('banner-autopedido'),
      totalCatalogo: (typeof PRODUCTOS !== 'undefined') ? PRODUCTOS.length : -1
    })`);
    const b = JSON.parse(base);
    console.log(DIM + '  al abrir la pagina:' + RST);
    console.log('   location.search      ' + JSON.stringify(b.search));
    console.log('   MODO_AUTOPEDIDO      ' + (b.modoExiste ? (b.modo ? VER + 'true' + RST : RED + 'false' + RST) : RED + 'NO EXISTE (codigo viejo en cache)' + RST));
    console.log('   _zonaPermite()       ' + (b.zonaPermiteExiste ? VER + 'existe' + RST : RED + 'NO EXISTE' + RST));
    console.log('   cartel naranja       ' + (b.banner ? VER + 'se ve' + RST : RED + 'NO se ve' + RST));
    console.log('   currentZone          ' + b.currentZone);
    console.log('   zona en localStorage ' + b.zonaGuardada);
    console.log('   productos en total   ' + b.totalCatalogo);

    // ── 2) el camino real: elegir Estancias por la UI ──
    console.log(DIM + '\n  eligiendo "Estancias del Pilar" como lo hace una persona:' + RST);
    const paso = await ev(`(function(){
      var out = { intentos: [] };
      // el modal de bienvenida: buscar el control que elige zona
      var cands = [].slice.call(document.querySelectorAll('[data-zone],[onclick*="Zone"],[onclick*="zona"],button,.zone-btn,.loc-btn'));
      var hit = cands.filter(function(e){
        var t = (e.textContent||'') + ' ' + (e.getAttribute('data-zone')||'') + ' ' + (e.getAttribute('onclick')||'');
        return /estancias/i.test(t);
      });
      out.candidatos = hit.slice(0,4).map(function(e){
        return { tag: e.tagName, txt: (e.textContent||'').trim().slice(0,40),
                 zone: e.getAttribute('data-zone'), onclick: (e.getAttribute('onclick')||'').slice(0,60) };
      });
      if (hit.length) { try { hit[0].click(); out.clickeado = true; } catch(e){ out.clickErr = String(e); } }
      return JSON.stringify(out);
    })()`);
    const p = JSON.parse(paso);
    if (p.candidatos && p.candidatos.length) {
      p.candidatos.forEach(c => console.log('   ' + DIM + 'control:' + RST + ' <' + c.tag.toLowerCase() + '> "' + c.txt + '"' + (c.zone ? ' data-zone=' + c.zone : '') + (c.onclick ? ' onclick=' + c.onclick : '')));
    } else {
      console.log('   ' + AMA + 'no encontre el control de zona en el modal' + RST);
    }
    await new Promise((s) => setTimeout(s, 1200));

    // ── 3) que se ve ahora ──
    const fin = await ev(`JSON.stringify((function(){
      var vis = [].slice.call(document.querySelectorAll('.product-card,.prod-card,[data-prod-id],.card'))
        .filter(function(e){ return e.offsetParent !== null; }).length;
      var act = (typeof getActiveProducts === 'function') ? getActiveProducts().map(function(x){return x.nombre;}) : [];
      return {
        currentZone: (typeof currentZone !== 'undefined') ? currentZone : 'undef',
        activos: act.length,
        sorrentinos: act.filter(function(n){ return /Sorrentinos/i.test(n); }),
        enPantalla: vis
      };
    })())`);
    const f = JSON.parse(fin);
    console.log(DIM + '\n  despues de elegir zona:' + RST);
    console.log('   currentZone          ' + f.currentZone);
    console.log('   getActiveProducts()  ' + f.activos + ' productos');
    console.log('   tarjetas visibles    ' + f.enPantalla);
    console.log('   sorrentinos activos:');
    (f.sorrentinos || []).forEach(n => console.log('     - ' + n));

    const CUATRO = ['Queso Brie', 'Langostinos', 'Pollo y Puerro', 'Espinaca'];
    const faltan = CUATRO.filter(c => !(f.sorrentinos || []).some(n => n.indexOf(c) >= 0));
    console.log();
    if (faltan.length === 0) console.log('  ' + VER + 'los 4 de Pilar estan disponibles' + RST);
    else console.log('  ' + RED + 'FALTAN: ' + faltan.join(', ') + RST);

    limpiar();
    process.exit(faltan.length ? 1 : 0);
  } catch (e) {
    console.error(RED + 'X ' + e.message + RST);
    limpiar(); process.exit(1);
  }
}
main();
