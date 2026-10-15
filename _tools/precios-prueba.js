/* LOS PRECIOS DE LAS PRUEBAS (14/10/2026).
 *
 * Desde ese dia app.js no tiene precios escritos: los toma de `stock_full`
 * (`pv` por producto y `_combos`), que sale de las hojas Productos y Precios Combos.
 * Las pruebas simulan `stock_full`; sin esto la tienda se quedaria en «$…» y no
 * dejaria agregar nada. Es una FOTO de la planilla del 14/10/2026: las pruebas no
 * dependen de la red. Si un precio cambia en la planilla, estas pruebas siguen
 * igual — lo que miden es la tienda, no la lista.
 *
 *   const conPrecios = require('./precios-prueba.js');
 *   ... JSON.stringify(conPrecios(STOCK)) ...
 */
'use strict';
const PV = {"PMu":11200,"PMa":11500,"PJyQ":11800,"PCC":11500,"PJyM":12000,"PPM":17000,"PPJyQ":17000,"PPCyQ":17000,
  "SQB":22100,"SL":22100,"SCo":19800,"SPyP":18300,"SJyQ":18300,"SE":17000,"SCa":16500,"ECaC":20000,"EJyQ":18000,
  "ECyQ":18000,"EV":18000,"TG":26000,"TLC":26000,"TC":26000,"F":9000,"TP":12000,"TJyQ":12000,"TCa":12000,"TV":12000,
  "RC":13000,"RP":13000,"CCo":20750,"CEn":34000,"CLo":33000,"CPi":22875,"CVa":26000,"CVE":25200,"CBC":29250,
  "COB":30325,"CMa":22825,"CAC":27900,"CAB":27900,"CPe":25025};
const COMBOS = { cmb_descubri_semana: 46900, cmb_descubri_finde: 34900, cmb_noche_casa: 23900,
  cmb_mesa_familiar: 45900, cmb_freezer_lleno: 84900 };

/** Devuelve una COPIA del stock simulado con `pv` en cada producto y `_combos`.
 *  Un producto que el stock no trae entra SOLO con su precio (sin `f`): la
 *  tienda no le inventa stock, igual que antes. */
module.exports = function conPrecios(stock) {
  const out = JSON.parse(JSON.stringify(stock || {}));
  Object.keys(PV).forEach((a) => {
    if (!out[a]) out[a] = {};
    if (out[a].pv === undefined) out[a].pv = PV[a];
  });
  if (!out._combos) out._combos = Object.assign({}, COMBOS);
  return out;
};
module.exports.PV = PV;
module.exports.COMBOS = COMBOS;
