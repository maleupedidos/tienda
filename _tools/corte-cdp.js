/* EL CANARIO DEL CORTE (25/11/2026). Una sola función para todas las redes que cortan los pedidos por CDP.

   Desde el 25/11/2026 la tienda tiene un candado (`_altaRealBloqueada` en app.js): fuera de maleu.com.ar, un alta con el
   fetch NATIVO no sale. Nació porque una prueba creyó cortar los pedidos y no los cortaba: entraron Home #2585 y #2586.

   Las redes que cortan por CDP (Fetch.enable, afuera de la página) dejan el fetch nativo, así que el candado también las
   frena y el pedido no sale ni al corte: 0 POST. Para que corran hay que abrir el candado, y abrirlo a ciegas es el
   incidente al revés: si el corte no quedó activo, salen pedidos reales. Por eso, ANTES de abrirlo, se demuestra:

   · Se manda un POST canario desde la página al MISMO host del alta (script.google.com), con un id de deployment que
     no existe. No se usa el id real a propósito: si el corte fallara, un POST al id real con una acción desconocida
     cae en `_doPostPedido` y CREA un pedido. Al id falso, Google contesta 404 y no se escribe nada.
   · Pasa solo si CDP lo PAUSÓ (Fetch.requestPaused) y la respuesta NO vino de la red (sin IP remota). El que lo responde
     es el corte de la red: lo que haga con él da igual, mientras no lo deje seguir.
   · Recién ahí pone `window.__permitirAltaReal = 'apps'` (en la página actual y en cada recarga). Abre SOLO Apps
     Script: la base no la corta ninguna red y para ella el candado sigue cerrado.
   · Si el canario no se intercepta, devuelve { ok:false } y la red tiene que cortar en rojo sin seguir.

   Uso, después de Page.enable, Network.enable y el Fetch.enable con '*script.google.com*' y su manejador:
     const { abrirCandadoSiCorta } = require('./corte-cdp.js');
     const can = await abrirCandadoSiCorta(cli);
     if (!can.ok) { console.log('CORTE: ' + can.motivo); process.exit(1); }
*/
const CANARIO = 'https://script.google.com/macros/s/CANARIO-MALEU-NO-EXISTE/exec';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function abrirCandadoSiCorta(cli, opciones) {
  const espera = (opciones && opciones.esperaMs) || 4000;
  const marca = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const url = CANARIO + '?maleu_canario=' + marca;
  const v = { pausado: false, respondio: false, ip: '' };
  cli.on((m) => {
    if (m.method === 'Fetch.requestPaused' && String(m.params.request.url).indexOf(marca) >= 0) v.pausado = true;
    if (m.method === 'Network.responseReceived' && String(m.params.response.url).indexOf(marca) >= 0) {
      v.respondio = true; v.ip = m.params.response.remoteIPAddress || '';
    }
  });
  try { await cli.enviar('Network.enable'); } catch (e) { /* ya estaba */ }
  /* mode no-cors: el canario no necesita leer la respuesta, y así no hay preflight que lo confunda. */
  const expr = 'fetch(' + JSON.stringify(url) + ', { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },' +
    ' body: "{\\"canario\\":true}" }).then(function () { return "ok"; }, function (e) { return "err:" + e.message; })';
  let r = '';
  try {
    const res = await cli.enviar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    r = (res && res.result && res.result.value) || '';
  } catch (e) { r = 'err:' + e.message; }
  for (let t = 0; t < espera && !(v.pausado && (v.respondio || /^err/.test(r))); t += 100) await dormir(100);

  if (!v.pausado) return { ok: false, motivo: 'el canario NO quedó pausado por CDP: el corte de los POST a Apps Script no está activo. No se abre el candado.', v, r };
  if (v.ip) return { ok: false, motivo: 'el canario llegó a la red (' + v.ip + '): el corte lo dejó seguir. No se abre el candado.', v, r };

  const src = "window.__permitirAltaReal = 'apps';";
  await cli.enviar('Page.addScriptToEvaluateOnNewDocument', { source: src });
  await cli.enviar('Runtime.evaluate', { expression: src });
  return { ok: true, motivo: 'canario cortado por CDP', v, r };
}

module.exports = { abrirCandadoSiCorta, CANARIO };
