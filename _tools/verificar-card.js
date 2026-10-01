/* verificar-card.js — el boton de agregar y el de WhatsApp (1/10/2026)
 *
 *   node _tools/verificar-card.js [ancho]
 *
 * El 1/10/2026 el boton de agregar dejo de ser un bloque naranja relleno y
 * paso a ser contorneado con un carrito, y aparecio el boton flotante de
 * WhatsApp. Ninguna red miraba ni una cosa ni la otra.
 *
 * Lo que mide, y por que:
 *
 *   1. QUE EL TEXTO SE LEA. Es la razon por la que existe --orange-ink: el
 *      naranja de marca sobre blanco da 2,72 y el de hover 3,44, los dos por
 *      debajo del 4,5 que necesita un texto. Un boton contorneado pintado con
 *      el naranja de marca se ve deslavado, que es justo lo contrario de lo
 *      que se busco. El contraste se CALCULA sobre los colores que el
 *      navegador computa, no se da por sentado.
 *
 *   2. QUE SIGA SIENDO UN BOTON. Contorneado quiere decir borde: si alguien
 *      le saca el borde queda un texto suelto que nadie toca. El borde es un
 *      elemento de interfaz y necesita 3:1.
 *
 *   3. QUE TENGA EL CARRITO, y que lo tengan SOLO los que suman al carrito.
 *
 *   4. QUE AL TOCARLO PASE ALGO. Un boton que cambio de aspecto y dejo de
 *      agregar es el peor resultado posible de un cambio de estilo. Se toca
 *      con coordenadas, no con .click(): si algo quedo encima, un .click()
 *      no se entera.
 *
 *   5. EL BOTON DE WHATSAPP: que apunte al numero de Maleu, que su mensaje NO
 *      arranque como el de un pedido (WATI reconoce los pedidos por ahi), que
 *      se pueda tocar, que no se solape con "Ver pedido" y que DESAPAREZCA
 *      con cualquier panel abierto — sobre el checkout taparia el boton de
 *      comprar, que es lo ultimo que hay que estorbar.
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
const PUERTO = 8477;
const WA_MALEU = '5491155038905';

let ok = 0, mal = 0;
const V = '\x1b[32m', R = '\x1b[31m', G = '\x1b[2m', F = '\x1b[0m';
function chk(cond, txt, extra) {
  if (cond) { ok++; console.log('  ' + V + 'ok   ' + F + txt + (extra ? G + '  (' + extra + ')' + F : '')); }
  else { mal++; console.log('  ' + R + 'MAL  ' + txt + F + (extra ? G + '  (' + extra + ')' + F : '')); }
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
    } catch (e) { /* todavia no */ }
    await dormir(250);
  }
  throw new Error('Chrome no abrio');
}

/* El contraste WCAG se calcula EN LA PAGINA, sobre los colores que el
   navegador computa de verdad. Escribirlos a mano en el test seria repetir el
   CSS: el dia que alguien cambie el color, el test seguiria midiendo el
   viejo y daria verde. */
const CONTRASTE = `
  window.__contraste = function (c1, c2) {
    var rgb = function (s) {
      var m = String(s).match(/[\\d.]+/g) || [0, 0, 0];
      return [+m[0], +m[1], +m[2]];
    };
    var lum = function (s) {
      return rgb(s).map(function (v) {
        v = v / 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      }).reduce(function (a, v, i) { return a + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
    };
    var a = lum(c1), b = lum(c2);
    return +(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2));
  };
`;

(async () => {
  console.log('\n' + G + 'verificar-card.js — ' + ANCHO + 'px — raiz: ' + RAIZ + F + '\n');
  const srv = await servir();
  const perfil = path.join(require('os').tmpdir(), 'card-' + Date.now());
  const chrome = spawn(process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--remote-debugging-port=9337', '--user-data-dir=' + perfil,
    '--window-size=' + ANCHO + ',' + ALTO, '--no-first-run', '--disable-gpu',
  ], { stdio: 'ignore' });

  let c;
  try {
    c = cdp(await esperarPagina(9337));
    await c.listo;
    await c.send('Page.enable');
    await c.send('Runtime.enable');
    await c.send('Network.enable');
    await c.send('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: ANCHO < 700 });
    await c.send('Network.setBlockedURLs', { urls: [
      '*googletagmanager*', '*google-analytics*', '*facebook.com*', '*facebook.net*',
      '*script.google.com*', '*script.googleusercontent.com*',
      /* Si algun dia un toque se escapa, que no salga a internet. */
      '*wa.me*', '*api.whatsapp.com*',
    ] });

    /* La zona se siembra ANTES de cargar: sin zona elegida el primer
       "Agregar" abre el modal en vez de agregar (23/9/2026), y lo que se
       quiere medir aca es el boton, no esa puerta — de eso se ocupa
       verificar-entrada. */
    await c.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        try { localStorage.setItem('maleu_zone', 'estancias'); } catch (e) {}
        window.__posts = [];
        (function (of) {
          window.fetch = function (u, o) {
            if (o && (o.method || '').toUpperCase() === 'POST') window.__posts.push(String(u));
            return of.apply(this, arguments);
          };
        })(window.fetch);
        ${CONTRASTE}
      `,
    });

    const ev = async (expr) => {
      const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r && r.exceptionDetails) {
        throw new Error(String((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text).slice(0, 220));
      }
      return r && r.result ? r.result.value : undefined;
    };
    const esperar = async (expr, ms) => {
      for (let i = 0; i < ms / 100; i++) {
        if (await ev(expr).catch(() => false)) return true;
        await dormir(100);
      }
      return false;
    };
    /* Un toque de verdad: se acomoda el scroll, se espera, y RECIEN AHI se
       lee donde quedo el elemento. Entre acomodar y soltar el click la pagina
       se sigue moviendo, y un toque le puede caer a otra cosa (29/9/2026). */
    const tocar = async (sel, soloMedir) => {
      await ev(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); if(e) e.scrollIntoView({block:'center'}); return !!e;})()`);
      await dormir(450);
      const caja = JSON.parse(await ev(`(function(){
        var e = document.querySelector(${JSON.stringify(sel)});
        if (!e) return 'null';
        var r = e.getBoundingClientRect();
        var x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
        var enc = document.elementFromPoint(x, y);
        var libre = !!enc && (enc === e || e.contains(enc));
        return JSON.stringify({ x: x, y: y, libre: libre,
                                tapa: libre ? null : (enc ? String(enc.id || enc.className || enc.nodeName) : 'nada') });
      })()`));
      if (!caja) return null;
      if (caja.libre && !soloMedir) {
        for (const type of ['mousePressed', 'mouseReleased']) {
          await c.send('Input.dispatchMouseEvent', { type, x: caja.x, y: caja.y, button: 'left', clickCount: 1 });
        }
      }
      await dormir(500);
      return caja;
    };

    await c.send('Page.navigate', { url: 'http://127.0.0.1:' + PUERTO + '/index.html?t=' + Date.now() });
    if (!(await esperar("typeof PRODUCTOS !== 'undefined' && !!document.querySelector('#catalog-root .add-btn')", 15000))) {
      throw new Error('la tienda no arranco');
    }
    /* Las fotos lazy cambian el alto de la pagina MIENTRAS se scrollea, y
       entonces un toque medido antes del reflow le cae a otra cosa: el bloque
       de abajo fallo una corrida de cada tres con un "0 -> 0" que parecia que
       el boton no agregaba. Es lo mismo que verificar-franja ya hacia por el
       mismo motivo. Se cargan todas antes de medir nada. */
    await ev('document.querySelectorAll("img[loading=lazy]").forEach(function (i) { i.loading = "eager"; })');
    await dormir(2500);

    /* ─────────── 1. el boton de agregar, en reposo ─────────── */
    console.log(G + '== El boton de agregar ==' + F);
    const b = JSON.parse(await ev(`(function () {
      var btn = document.querySelector('#catalog-root .add-btn');
      var card = btn.closest('.product-card');
      var cs = getComputedStyle(btn), cc = getComputedStyle(card);
      var r = btn.getBoundingClientRect();
      /* El fondo del boton puede ser transparente: ahi lo que se ve es el de
         la card, y es contra ESE que hay que medir. */
      var fondo = cs.backgroundColor;
      if (/rgba\\(0, 0, 0, 0\\)|transparent/.test(fondo)) fondo = cc.backgroundColor;
      return JSON.stringify({
        texto: btn.textContent.trim(),
        color: cs.color, fondo: fondo, borde: cs.borderTopColor,
        anchoBorde: parseFloat(cs.borderTopWidth),
        alto: Math.round(r.height),
        carritos: btn.querySelectorAll('svg.ico').length,
        contrasteTexto: window.__contraste(cs.color, fondo),
        contrasteBorde: window.__contraste(cs.borderTopColor, cc.backgroundColor),
        relleno: window.__contraste(fondo, cc.backgroundColor) > 1.2
      });
    })()`));

    chk(b.texto === 'Agregar', 'dice "Agregar" (el "+" se fue con el icono)', '"' + b.texto + '"');
    chk(b.carritos === 1, 'lleva UN carrito dibujado', b.carritos + ' svg.ico');
    chk(!b.relleno, 'es contorneado y no un bloque de color: la foto manda', 'fondo ' + b.fondo);
    chk(b.anchoBorde >= 1, 'tiene borde, o sea que se lee como boton', b.anchoBorde + 'px');
    /* Los dos umbrales de WCAG: 4,5 para texto, 3 para un elemento de UI. */
    chk(b.contrasteTexto >= 4.5, 'el texto se lee sobre su fondo', b.contrasteTexto + ':1 (min 4,5)');
    chk(b.contrasteBorde >= 3, 'el borde se distingue de la card', b.contrasteBorde + ':1 (min 3)');
    chk(b.alto >= 44, 'se toca con el dedo', b.alto + 'px (min 44)');

    /* ─────────── 2. y al tocarlo, agrega ─────────── */
    console.log('\n' + G + '== Y al tocarlo, agrega ==' + F);
    const antes = await ev('cartCount()');
    const t = await tocar('#catalog-root .add-btn');
    chk(!!t && t.libre, 'nada lo tapa: el toque le llega al boton', t && t.libre ? 'libre' : 'lo tapa ' + (t && t.tapa));
    const despues = await ev('cartCount()');
    chk(despues === antes + 1, 'suma uno al carrito', antes + ' -> ' + despues);
    const pie = await ev(`document.querySelector('#catalog-root .product-footer').textContent.replace(/\\s+/g,'')`);
    chk(/\d/.test(pie) && !/Agregar/.test(pie), 'la card pasa a los +/- y deja de decir "Agregar"', pie);

    /* ─────────── 2b. cuanto sale una ─────────── */
    console.log('\n' + G + '== Cuanto sale una ==' + F);
    /* El numero se saca del CATALOGO, no se escribe aca: un precio copiado a
       mano queda viejo el dia que Tadeo lo cambie, y el test seguiria dando
       verde sobre una card que dice otra cosa. */
    const u = JSON.parse(await ev(`(function () {
      /* Uno que NO este en el carrito: el bloque anterior toca el primer
         .add-btn del catalogo, y en Estancias ese es justamente un pack. Con
         el pack ya agregado, este bloque mediria la rama de los +/- dos veces
         y la rama de "Agregar" quedaria sin cubrir — lo destapo reinyectar el
         bug en una rama y ver que el test lo dejaba pasar. */
      var conUnid = PRODUCTOS.filter(function (p) { return p.unid > 1 && _enLaZona(p.id) && !cart[p.id]; })[0];
      var sinUnid = PRODUCTOS.filter(function (p) { return !p.unid && p.cat === 'Sorrentinos' && _enLaZona(p.id); })[0];
      var leer = function (p) {
        if (!p) return null;
        var card = document.querySelector('#catalog-root .product-card[data-id="' + p.id + '"]');
        if (!card) return null;
        var e = card.querySelector('.precio-unidad');
        return { id: p.id, nombre: p.nombre, unid: p.unid || 0, precio: p.precio,
                 texto: e ? e.textContent.trim() : null };
      };
      return JSON.stringify({ con: leer(conUnid), sin: leer(sinUnid),
        esperado: conUnid ? ('$' + (conUnid.precio / conUnid.unid).toLocaleString('es-AR') + ' por ' + conUnid.unidQue) : null });
    })()`));

    chk(!!(u.con && u.con.texto), 'un pack dice cuanto sale una', u.con && u.con.nombre);
    chk(!!u.con && u.con.texto === u.esperado,
        'y el numero es el precio dividido por las unidades',
        u.con ? u.con.texto + ' (de ' + u.con.precio + ' / ' + u.con.unid + ')' : '-');
    /* El control: sin esto, un renglon puesto en TODAS las cards pasaria los
       dos chequeos de arriba. Los sorrentinos traen 16 unidades y NO lo
       llevan a proposito. */
    chk(!!u.sin && u.sin.texto === null,
        'CONTROL: los sorrentinos traen 16 y NO lo dicen — no va en todos',
        u.sin ? u.sin.nombre : 'no se encontro un sorrentino');

    /* El footer se repinta al agregar algo, y se arma en CUATRO lugares: es
       justo donde este repo ya perdio cosas (los carteles de stock, 10/9). */
    const tras = JSON.parse(await ev(`(function () {
      var p = PRODUCTOS.filter(function (x) { return x.unid > 1 && _enLaZona(x.id) && !cart[x.id]; })[0];
      var card = document.querySelector('#catalog-root .product-card[data-id="' + p.id + '"]');
      addToCart(String(p.id));
      var e = card.querySelector('.precio-unidad');
      return JSON.stringify({ texto: e ? e.textContent.trim() : null, qty: cart[p.id] || 0 });
    })()`));
    chk(tras.qty > 0 && tras.texto !== null,
        'y sigue estando cuando el footer se repinta con los +/-', tras.texto);

    /* En el carrito no va: ahi ya elegiste. */
    const enCarrito = await ev(`(function () { toggleCart(); return document.querySelectorAll('#cart-body .precio-unidad').length; })()`);
    chk(enCarrito === 0, 'en el carrito no se repite: ahi ya esta elegido', enCarrito + ' renglones');
    await ev('toggleCart()'); await dormir(400);

    /* ─────────── 3. el boton de WhatsApp ─────────── */
    console.log('\n' + G + '== Escribinos por WhatsApp ==' + F);
    const w = JSON.parse(await ev(`(function () {
      var a = document.getElementById('wa-float');
      if (!a) return JSON.stringify({ hay: false });
      var r = a.getBoundingClientRect();
      return JSON.stringify({
        hay: true, href: a.getAttribute('href') || '',
        target: a.getAttribute('target') || '', rel: a.getAttribute('rel') || '',
        rotulo: a.getAttribute('aria-label') || '',
        w: Math.round(r.width), h: Math.round(r.height),
        dentro: r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 && r.left >= 0,
        display: getComputedStyle(a).display
      });
    })()`));
    chk(w.hay, 'existe el boton flotante');
    chk(w.href.indexOf('wa.me/' + WA_MALEU) !== -1, 'va al WhatsApp de Maleu, que es el que escucha WATI', w.href.slice(0, 48));
    /* El mensaje de un pedido arranca con "Quiero hacer un pedido:" y WATI lo
       reconoce por ahi. Una consulta NO puede empezar igual o se mezclarian. */
    chk(!/pedido/i.test(decodeURIComponent(w.href)), 'su mensaje no se confunde con el de un pedido',
        decodeURIComponent((w.href.split('text=')[1] || '')));
    chk(w.target === '_blank' && /noopener/.test(w.rel), 'abre aparte y con noopener', w.target + ' · ' + w.rel);
    chk(!!w.rotulo, 'tiene nombre para un lector de pantalla', w.rotulo);
    chk(w.w >= 44 && w.h >= 44, 'se toca con el dedo', w.w + 'x' + w.h);
    chk(w.dentro, 'entra entero en la pantalla');
    /* SE MIDE, NO SE TOCA. Es un <a target="_blank">: un toque de verdad abre
       una pestaña a wa.me y deja el navegador ocupado — el test se comia los
       600 s del timeout y no imprimia ni el error. Para "nada lo tapa" alcanza
       con preguntarle al navegador que hay en ese punto, que es lo mismo que
       mira el toque antes de disparar.
       Sin scrollIntoView ademas: es un elemento fijo, y desde el 1/10/2026 un
       scroll hacia abajo lo esconde. */
    await ev('window.scrollTo(0, 0)');
    await dormir(420);
    const tw = await tocar('#wa-float', true);
    chk(!!tw && tw.libre, 'nada lo tapa', tw && tw.libre ? 'libre' : 'lo tapa ' + (tw && tw.tapa));

    /* ─────────── 4. no se pisa con "Ver pedido" ─────────── */
    console.log('\n' + G + '== Con el pedido armado ==' + F);
    const sol = JSON.parse(await ev(`(function () {
      var f = document.getElementById('float-cart-btn'), w = document.getElementById('wa-float');
      var vf = getComputedStyle(f).display !== 'none';
      var a = f.getBoundingClientRect(), b = w.getBoundingClientRect();
      var pisa = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
      return JSON.stringify({ verPedido: vf, pisa: pisa,
        separacion: Math.round(Math.min(b.left - a.right, a.top - b.bottom)) });
    })()`));
    /* El control: si "Ver pedido" no esta a la vista, que no se pisen no
       prueba nada — no hay con que pisarse. */
    chk(sol.verPedido, 'CONTROL: con algo en el carrito, "Ver pedido" esta a la vista');
    /* No alcanza con que no se toquen: a 8px uno del otro se ve apretado y
       se toca peor, que era justo el estado del que se salio. */
    chk(!sol.pisa && sol.separacion >= 12, 'el de WhatsApp queda lejos de "Ver pedido"', 'separados por ' + sol.separacion + 'px (min 12)');

    /* ─────────── 4b. se va mientras el cliente baja ─────────── */
    console.log('\n' + G + '== Bajando no estorba ==' + F);
    /* Que no tape los botones de las cards no se puede medir "en general":
       depende de donde quede cada card. Lo que SI es determinista es la
       condicion que lo causa — si esta a la vista mientras el cliente baja,
       antes o despues le cae encima de un boton. Es la misma leccion que la
       del CLS de la grilla (28/9/2026): un sintoma intermitente no sirve de
       chequeo, la condicion que lo provoca si. */
    const verWa = async () => await ev(`(function(){var w=document.getElementById('wa-float');` +
      `var cs=getComputedStyle(w);return cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0;})()`);
    const scrollA = async (y) => { await ev('window.scrollTo(0,' + y + ')'); await dormir(420); };

    await scrollA(0);
    chk(await verWa(), 'CONTROL: arriba de todo esta a la vista');
    await scrollA(900);
    chk(!(await verWa()), 'bajando se va: no le puede caer encima a un boton de una card');
    await scrollA(500);
    chk(await verWa(), 'al subir vuelve');
    await scrollA(0);
    chk(await verWa(), 'y arriba de todo esta, que es donde no tapa nada');

    /* ─────────── 5. y se va cuando hay un panel abierto ─────────── */
    console.log('\n' + G + '== Y desaparece con un panel abierto ==' + F);
    await ev('toggleCart()'); await dormir(500);
    chk(await ev(`getComputedStyle(document.getElementById('wa-float')).display`) === 'none',
        'con el carrito abierto no se ve');
    await ev('toggleCart()'); await dormir(500);
    chk(await ev(`getComputedStyle(document.getElementById('wa-float')).display`) === 'flex',
        'al cerrarlo vuelve');
    await ev('abrirCheckout()'); await dormir(700);
    chk(await ev(`getComputedStyle(document.getElementById('wa-float')).display`) === 'none',
        'sobre el checkout tampoco: ahi taparia el boton de comprar');
    await ev('cerrarCheckout()'); await dormir(600);
    chk(await ev(`getComputedStyle(document.getElementById('wa-float')).display`) === 'flex',
        'y vuelve al salir del checkout');

    /* ─────────── 6. nada hacia afuera ─────────── */
    console.log('\n' + G + '== Nada salio hacia afuera ==' + F);
    const lista = JSON.parse(await ev('JSON.stringify(window.__posts || [])') || '[]');
    chk(lista.length === 0, 'ningun POST al backend', lista.join(', ') || '0');

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
