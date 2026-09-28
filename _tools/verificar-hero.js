/* verificar-hero.js — el carrusel del hero (28/9/2026)
 *
 *   node _tools/verificar-hero.js [ancho]
 *
 * Mide lo que un carrusel rompe de verdad, y que ninguna otra red mira:
 *
 *   1. EL CLS DE LA CARGA. Es el motivo numero uno por el que un hero con
 *      fotos empeora una home: la imagen llega despues del HTML y empuja
 *      media pagina hacia abajo. Google lo penaliza y el cliente pierde de
 *      vista lo que estaba leyendo. Tiene que dar 0 — que es lo que daba la
 *      tienda antes de tener fotos arriba (medido el 11/9/2026).
 *
 *   2. Que el alto lo fije el CSS y NO la foto. Si algun dia alguien saca la
 *      altura del contenedor, el punto 1 se rompe solo.
 *
 *   3. Que las tres fotos existan (un 404 deja el hero negro) y tengan alt.
 *
 *   4. Que los puntos salgan de la cantidad de fotos, no de un numero escrito
 *      a mano — la leccion de la ruleta cuando paso de 5 premios a 6.
 *
 *   5. Que el titulo se lea: el velo tiene que estar encima de la foto y
 *      debajo del texto.
 *
 *   6. Que el giro solo se detenga cuando el cliente elige una foto.
 *
 * Cero POST: no toca nada que guarde.
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ANCHO = parseInt(process.argv[2] || '390', 10);
const ALTO = ANCHO < 700 ? 844 : 900;
const RAIZ = process.env.RAIZ || path.join(__dirname, '..');
const PUERTO = 8471;

let ok = 0, mal = 0;
const V = '\x1b[32m', R = '\x1b[31m', G = '\x1b[2m', F = '\x1b[0m';
function chk(cond, txt, extra) {
  if (cond) { ok++; console.log('  ' + V + 'ok   ' + F + txt + (extra ? G + '  (' + extra + ')' + F : '')); }
  else { mal++; console.log('  ' + R + 'MAL  ' + txt + F + (extra ? G + '  (' + extra + ')' + F : '')); }
}
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── un servidor estatico, para no depender de internet ── */
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
function servir() {
  return new Promise((res) => {
    const s = http.createServer((req, rq) => {
      /* La ruta se normaliza a separadores del sistema ANTES de comparar: un
         servidor de prueba de este repo devolvia 404 en todo por comparar
         rutas con barra normal contra path.join, que en Windows las pasa a
         barra invertida (11/9/2026). */
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

/* ── CDP pelado ── */
/* CDP pelado. WebSocket es global desde Node 22, pero es el del navegador:
   se escucha con addEventListener, no con .on(). Mismo patron que el resto de
   las redes de este repo. */
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
    } catch (e) { /* todavia no */ }
    await dormir(250);
  }
  throw new Error('Chrome no abrio');
}

(async () => {
  console.log('\n' + G + 'verificar-hero.js — ' + ANCHO + 'px — raiz: ' + RAIZ + F + '\n');
  const srv = await servir();
  const perfil = path.join(require('os').tmpdir(), 'hero-' + Date.now());
  const chrome = spawn(process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9333', '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, '--no-first-run', '--disable-gpu',
  ], { stdio: 'ignore' });

  let c;
  try {
    c = cdp(await esperarPagina(9333));
    await c.listo;
    await c.send('Page.enable');
    await c.send('Runtime.enable');
    await c.send('Network.enable');
    await c.send('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: ANCHO < 700 });

    /* Analytics, Meta y el backend cortados de raiz.
       Se usa Network.setBlockedURLs y NO Fetch.enable: `Fetch.enable` pausa
       CADA request esperando que el test la conteste, asi que sin manejar sus
       eventos la pagina no carga nada y el test se cuelga midiendo un hero
       vacio. Ademas, sin cortar Analytics cada corrida le suma visitas falsas
       a las metricas reales (11/9/2026). */
    await c.send('Network.setBlockedURLs', { urls: [
      '*googletagmanager*', '*google-analytics*', '*facebook.com*', '*facebook.net*',
      '*script.google.com*', '*script.googleusercontent.com*',
    ] });

    /* El observador de CLS se instala ANTES de navegar: medirlo despues es
       medir cero siempre, porque los shifts de la carga ya pasaron. */
    await c.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__cls = 0;
        try {
          new PerformanceObserver(function (l) {
            l.getEntries().forEach(function (e) {
              /* hadRecentInput descarta lo que movio el usuario. Aca no hay
                 usuario, asi que todo lo que se cuente es de la carga. */
              if (e.hadRecentInput) return;
              window.__cls += e.value;
              /* QUIEN se movio, no solo cuanto. Un numero sin el culpable
                 obliga a adivinar, y adivinar fue el error que ya costo una
                 tarde con el pixel (10/9/2026). */
              (e.sources || []).forEach(function (s) {
                var n = s.node;
                window.__culpables = window.__culpables || [];
                window.__culpables.push({
                  v: +e.value.toFixed(5),
                  q: n ? (n.id ? '#' + n.id : (n.className || n.nodeName)) : '?',
                  de: Math.round(s.previousRect.top) + ',' + Math.round(s.previousRect.height),
                  a: Math.round(s.currentRect.top) + ',' + Math.round(s.currentRect.height)
                });
              });
            });
          }).observe({ type: 'layout-shift', buffered: true });
        } catch (e) {}
        window.__posts = [];
        (function (of) {
          window.fetch = function (u, o) {
            if (o && (o.method || '').toUpperCase() === 'POST') window.__posts.push(String(u));
            return of.apply(this, arguments);
          };
        })(window.fetch);
      `,
    });

    const ev = async (expr) => {
      const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return r && r.result ? r.result.value : undefined;
    };

    await c.send('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html' });
    await dormir(3500);

    /* ─────────── 1. el alto lo pone el CSS ─────────── */
    console.log(G + '== El alto lo fija el CSS, no la foto ==' + F);
    const caja = await ev(`(function(){
      var c = document.getElementById('hero-carrusel');
      if (!c) return null;
      var r = c.getBoundingClientRect();
      var cs = getComputedStyle(c);
      return JSON.stringify({ h: Math.round(r.height), w: Math.round(r.width),
        ov: cs.overflow, pos: cs.position });
    })()`);
    const k = caja ? JSON.parse(caja) : null;
    chk(!!k, 'el carrusel existe en la pagina');
    chk(k && k.h > 180 && k.h < 460, 'tiene un alto propio y razonable', k && k.h + 'px');
    chk(k && k.pos === 'relative' && k.ov === 'hidden', 'recorta lo que sobra de cada foto');

    /* Sin foto cargada el alto tiene que ser EL MISMO: eso es lo que hace
       que no haya salto. Se mide escondiendo las fotos. */
    const sinFotos = await ev(`(function(){
      var f = document.querySelectorAll('.hero-foto');
      [].forEach.call(f, function(i){ i.style.display='none'; });
      var h = Math.round(document.getElementById('hero-carrusel').getBoundingClientRect().height);
      [].forEach.call(f, function(i){ i.style.display=''; });
      return h;
    })()`);
    chk(k && sinFotos === k.h, 'sin las fotos el alto NO cambia: el lugar ya estaba reservado',
        sinFotos + 'px contra ' + (k && k.h) + 'px');

    /* ─────────── 2. el CLS ─────────── */
    console.log('\n' + G + '== El CLS de la carga ==' + F);
    const cls = await ev('window.__cls');
    chk(typeof cls === 'number', 'se pudo medir el CLS (si no, lo de abajo no mide nada)');

    /* EL CHEQUEO DURO ES SOBRE EL HERO, que es lo que esta red mide.
       El total de la pagina se reporta aparte: a 1440px salta 0,38 una de
       cada tres cargas por culpa de #cat-tiles-section, que crece de 120 a
       334px cuando se llena la grilla de categorias. Medido contra HEAD el
       28/9/2026: pasa IGUAL sin el carrusel, o sea que es preexistente y no
       es del hero. Convertirlo en un rojo de esta red seria un test que
       falla una de cada tres veces por algo que no es suyo, y un test
       intermitente deja de mirarse. */
    const delHero = await ev(`(function () {
      var c = window.__culpables || [];
      var suma = 0;
      c.forEach(function (x) {
        if (/hero/i.test(x.q || '')) suma += x.v;
      });
      return +suma.toFixed(5);
    })()`);
    chk(typeof delHero === 'number' && delHero <= 0.02,
        'ningun elemento del hero empuja la pagina', 'CLS del hero ' + delHero);

    if (typeof cls === 'number' && cls > 0.1) {
      const quien = await ev(`(function () {
        var c = (window.__culpables || []).slice(0, 4);
        return c.map(function (x) { return x.q + ' ' + x.de + ' -> ' + x.a; }).join(' · ');
      })()`);
      console.log('  ' + '\x1b[33m' + 'aviso' + F + ' la PAGINA salta CLS ' + cls.toFixed(4) +
                  ' (Google pide <= 0,1) — no es del hero');
      console.log(G + '        ' + quien + F);
      console.log(G + '        preexistente y ~1 de cada 3 cargas a 1440px. Ver el CLAUDE.md.' + F);
    }

    /* ─────────── 3. las fotos ─────────── */
    console.log('\n' + G + '== Las tres fotos ==' + F);
    const fotos = await ev(`(function(){
      var f = [].slice.call(document.querySelectorAll('.hero-foto'));
      return JSON.stringify(f.map(function(i){
        return { src: i.getAttribute('src'), alt: (i.getAttribute('alt')||'').trim(),
                 ok: i.complete && i.naturalWidth > 0, fit: getComputedStyle(i).objectFit };
      }));
    })()`);
    const fs2 = JSON.parse(fotos || '[]');
    chk(fs2.length >= 2, 'hay mas de una foto (con una no es un carrusel)', fs2.length + ' fotos');
    chk(fs2.every((f) => f.ok), 'las fotos cargan de verdad — un 404 deja el hero negro',
        fs2.filter((f) => !f.ok).map((f) => f.src).join(', ') || 'todas');
    chk(fs2.every((f) => f.alt.length > 8), 'cada foto tiene alt, y no uno de relleno');
    chk(fs2.every((f) => f.fit === 'cover'), 'se recortan en vez de deformarse (object-fit: cover)');
    chk(fs2.filter((f) => f.ok).every((f) => /^img\//.test(f.src)), 'salen de img/ del repo, no de afuera');

    /* ─────────── 4. los puntos ─────────── */
    console.log('\n' + G + '== Los puntos salen de la cantidad de fotos ==' + F);
    const pts = await ev(`document.querySelectorAll('#hero-puntos .hero-punto').length`);
    chk(pts === fs2.length, 'hay un punto por foto', pts + ' puntos, ' + fs2.length + ' fotos');
    const area = await ev(`(function(){
      var b = document.querySelector('#hero-puntos .hero-punto');
      if (!b) return null; var r = b.getBoundingClientRect();
      return Math.round(Math.min(r.width, r.height));
    })()`);
    /* 44px es la regla del repo, no un numero al azar: es el minimo tocable
       que ya se le aplico a los controles del combo. verificar-layout.js lo
       mide tambien, y fue el que agarro que estos nacian en 24. */
    chk(area >= 44, 'el punto se puede tocar con el dedo (44px)', area + 'px');
    const sel1 = await ev(`(function(){
      var b = [].slice.call(document.querySelectorAll('#hero-puntos .hero-punto'));
      return b.map(function(x){ return x.getAttribute('aria-selected'); }).join(',');
    })()`);
    chk(/^true(,false)*$/.test(sel1), 'arranca marcando la primera', sel1);

    /* ─────────── 5. el velo ─────────── */
    console.log('\n' + G + '== El titulo se lee sobre la foto ==' + F);
    const capas = await ev(`(function(){
      var c = document.getElementById('hero-carrusel');
      var v = c.querySelector('.hero-velo');
      var h = c.querySelector('h1');
      if (!v || !h) return null;
      var hijos = [].slice.call(c.children);
      var cs = getComputedStyle(h);
      return JSON.stringify({
        veloDespuesDeFotos: hijos.indexOf(v) > hijos.indexOf(c.querySelector('.hero-fotos')),
        tituloDespuesDelVelo: hijos.indexOf(h) > hijos.indexOf(v),
        color: cs.color, sombra: cs.textShadow !== 'none',
        fondoVelo: getComputedStyle(v).backgroundImage.indexOf('gradient') >= 0
      });
    })()`);
    const cp = capas ? JSON.parse(capas) : null;
    chk(cp && cp.veloDespuesDeFotos, 'el velo va encima de la foto');
    chk(cp && cp.tituloDespuesDelVelo, 'y el titulo encima del velo');
    chk(cp && cp.fondoVelo, 'el velo es un degradado, no un bloque opaco que tape la foto');
    chk(cp && /255,\s*255,\s*255/.test(cp.color), 'el titulo va en blanco', cp && cp.color);
    chk(cp && cp.sombra, 'y con sombra: sin ella se pierde en las fotos claras');

    /* ─────────── 6. el giro ─────────── */
    console.log('\n' + G + '== El giro solo, y cuando se detiene ==' + F);
    const antes = await ev(`(function(){ return [].slice.call(document.querySelectorAll('.hero-foto'))
      .findIndex(function(f){ return f.classList.contains('is-activa'); }); })()`);
    await ev('heroIr(1)');
    const dos = await ev(`(function(){ return [].slice.call(document.querySelectorAll('.hero-foto'))
      .findIndex(function(f){ return f.classList.contains('is-activa'); }); })()`);
    chk(dos === 1, 'se puede ir a otra foto', 'de ' + antes + ' a ' + dos);
    const selDos = await ev(`document.querySelectorAll('#hero-puntos .hero-punto')[1].getAttribute('aria-selected')`);
    chk(selDos === 'true', 'y el punto acompania');

    /* Da la vuelta en los dos sentidos, sin quedarse en el borde. */
    await ev('heroIr(-1)');
    const ult = await ev(`(function(){ return [].slice.call(document.querySelectorAll('.hero-foto'))
      .findIndex(function(f){ return f.classList.contains('is-activa'); }); })()`);
    chk(ult === fs2.length - 1, 'desde la primera para atras va a la ultima', 'quedo en ' + ult);

    /* El cliente elige => se deja de mover solo. */
    await ev('heroIr(0, true)');
    const corriendo = await ev('heroTimer !== null');
    chk(corriendo === false, 'cuando el cliente elige una foto, deja de girar solo');

    /* ─────────── 7. la primera pantalla no miente sobre la zona ─────────── */
    console.log('\n' + G + '== El hero no muestra lo que esa zona no vende ==' + F);
    const antesDeCambiar = await ev('heroFotos().length');
    chk(antesDeCambiar >= 2, 'en Estancias se ven todas las fotos', antesDeCambiar + ' fotos');

    /* Un barrio con vendedor: va a la hoja Red, que no tiene columnas de
       kilos, asi que la carne no se vende ahi. La foto de carne a la parrilla
       en la primera pantalla seria prometer algo que abajo no esta. */
    const tras = await ev(`(function () {
      if (typeof setZone !== 'function') return null;
      currentZone = 'pilar';
      selectedPilarZona = 'Tortugas y alrededores';
      try { applyZone(); } catch (e) { return 'reventó: ' + e.message; }
      var todas = [].slice.call(document.querySelectorAll('#hero-fotos .hero-foto'));
      return JSON.stringify({
        visibles: todas.filter(function (f) { return !f.hidden; }).length,
        carneVisible: todas.some(function (f) { return f.dataset.cat === 'carne' && !f.hidden; }),
        activaVisible: todas.some(function (f) { return f.classList.contains('is-activa') && !f.hidden; }),
        puntos: document.querySelectorAll('#hero-puntos .hero-punto').length,
        vendeCarne: getActiveProducts().some(function (p) { return esPorPeso(p); })
      });
    })()`);
    const t = (tras && tras[0] === '{') ? JSON.parse(tras) : null;
    chk(!!t, 'se pudo cambiar a un barrio con vendedor', t ? '' : String(tras));
    chk(t && t.vendeCarne === false, 'CONTROL: en ese barrio la tienda no vende carne');
    chk(t && t.carneVisible === false, 'y la foto de carne NO se muestra en el hero');
    chk(t && t.visibles >= 1, 'quedan fotos: el hero no se queda en negro', t && t.visibles + ' fotos');
    chk(t && t.activaVisible === true, 'la foto que se ve es una de las que quedan');
    chk(t && t.puntos === t.visibles, 'los puntos se recalculan', t && t.puntos + ' puntos');

    /* ─────────── 8. nada hacia afuera ─────────── */
    console.log('\n' + G + '== Nada salio hacia afuera ==' + F);
    const p = await ev('JSON.stringify(window.__posts || [])');
    const lista = JSON.parse(p || '[]');
    chk(lista.length === 0, 'ningun POST al backend', lista.join(', ') || '0');

    const errs = await ev(`(window.__erroresJS || []).length`);
    chk(errs === undefined || errs === 0, 'ningun error de JS propio');

  } catch (e) {
    mal++;
    console.log('  ' + R + 'MAL  el test reventó: ' + e.message + F);
  } finally {
    if (c) c.cerrar();
    chrome.kill();
    srv.close();
  }

  const color = mal === 0 ? V : R;
  console.log('\n' + color + ok + ' ok · ' + mal + ' mal' + F + G + '  (' + ANCHO + 'px)' + F + '\n');
  process.exit(mal === 0 ? 0 : 1);
})();
