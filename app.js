/* ══════════════════════════════════════════════════
   MALEU — PILAR GLOBAL
   Unifica Home + Delivery en una sola web
   ══════════════════════════════════════════════════ */

/* ── EL ?v= DE LAS FOTOS ──
   Lo mismo que `app.js?v=` pero para las imagenes, y por la misma razon.

   El 10/9/2026 se optimizaron las fotos —8,7 MB a 3,5— y despues de publicar el
   navegador SEGUIA bajando las viejas. Medido contra maleu.com.ar, la misma URL
   contestaba distinto: sin query 222.347 bytes (la vieja), con una query nueva
   113.648 (la nueva). GitHub Pages las sirve con `Cache-Control: max-age=14400`,
   asi que el CDN y el navegador tenian guardada esa URL exacta por 4 horas.

   O sea que cambiar una foto —corregir una que salio mal, subir la del producto
   nuevo— podia no verse en todo el dia, sin ningun error y sin forma de darse
   cuenta desde aca: `curl` con una query distinta contesta con la nueva y te
   hace creer que esta todo bien.

   El mapa lo REGENERA `_tools/cachebuster.py` con el md5 de cada archivo, entre
   los dos anclajes de abajo. No se edita a mano. Una foto que no este en el mapa
   se sirve sin query — el comportamiento de antes, nunca un link roto. */
/* IMG_V:INICIO */
var IMG_V = {
  "carne-colita.jpg": "072cf98e",
  "carne-cortes.jpg": "ada9a490",
  "carne-entrana.jpg": "c9bbf036",
  "carne-lomo.jpg": "7f188d99",
  "carne-picana.jpg": "05684de8",
  "carne-vacio.jpg": "c1827fc5",
  "categoria-carnes.jpg": "7b69d315",
  "combo-finde.jpg": "4e0022fd",
  "combo-freezer.jpg": "2d59c6e7",
  "combo-mesa.jpg": "c99aab14",
  "combo-noche.jpg": "e39cfeea",
  "combo-semana.jpg": "b99c561e",
  "empanadas-carne-v2.jpg": "6de21882",
  "empanadas-cebolla-v2.jpg": "b33521e2",
  "empanadas-jamon-v2.jpg": "68b20155",
  "empanadas-verdura-v2.jpg": "314eb060",
  "favicon.png": "f3493058",
  "franui-new.jpg": "945b0cfa",
  "logo-icono.png": "d8163724",
  "logo-maleu-blanco.png": "0327ed85",
  "logo-maleu.png": "80e04e45",
  "og-maleu.jpg": "718f79e6",
  "pack-cebolla-queso-cocida.jpg": "2cff2442",
  "pack-jamon-queso-cocida.jpg": "069f34ca",
  "pack-muzarella-cocida.jpg": "44659df8",
  "pizza-cebolla-cocida.jpg": "251a9b16",
  "pizza-jamon-morron-cocida.jpg": "60a0bf43",
  "pizza-jamon-queso-cocida.jpg": "3ac5829a",
  "pizza-margarita-cocida.jpg": "1e619ec7",
  "pizza-muzarella-cocida.jpg": "ae0a07d5",
  "sorrentinos-brie.jpg": "1ff072a2",
  "sorrentinos-calabaza-v2.jpg": "025b9781",
  "sorrentinos-cordero-v2.jpg": "d07c39e4",
  "sorrentinos-espinaca.jpg": "cbbebff6",
  "sorrentinos-jamon-v2.jpg": "b95db8e0",
  "sorrentinos-langostinos.jpg": "95c70b57",
  "sorrentinos-pollo-puerro.jpg": "4cbe12c1",
  "tarta-calabaza.jpg": "7566975b",
  "tarta-jamon-queso.jpg": "ad0ddeaa",
  "tarta-pollo.jpg": "ad152a1c",
  "tarta-verdura.jpg": "253ea9ae",
  "torta-coco.jpg": "6713d6d8",
  "torta-golosa.jpg": "7a2cba95",
  "torta-lemon.jpg": "4a545bf8",
  "wrap-carne.jpg": "9515ce4f",
  "wrap-pollo.jpg": "9a5102fd"
};
/* IMG_V:FIN */
function fotoUrl(nombre) {
  var n = String(nombre || '');
  return 'img/' + n + (IMG_V[n] ? '?v=' + IMG_V[n] : '');
}

/* ── PRODUCTOS ── */
const PRODUCTOS = [
  { id:1,  cat:"Pizzas Individuales",   nombre:"Pizza Margarita",              desc:"Tomate fresco, mozzarella y albahaca. La que nunca falla.",                        precio:11500, img:"pizza-margarita-cocida.jpg", emoji:"🍕", top:true, chips:["Para 1–2 personas","1 pizza grande","Al horno en 12 min"] },
  { id:2,  cat:"Pizzas Individuales",   nombre:"Pizza Jamón y Queso",           desc:"Mucho jamón, mucho queso. Simple, efectiva y sin dramas.",                        precio:11800, img:"pizza-jamon-queso-cocida.jpg", emoji:"🍕", chips:["Para 1–2 personas","1 pizza grande","Al horno en 12 min"] },
  { id:3,  cat:"Pizzas Individuales",   nombre:"Pizza Cebolla Caramelizada",    desc:"Cebolla bien dulce con queso cremoso. Para los que saben.",                       precio:11500, img:"pizza-cebolla-cocida.jpg", emoji:"🍕", chips:["Para 1–2 personas","1 pizza grande","Al horno en 12 min"] },
  { id:4,  cat:"Pizzas Individuales",   nombre:"Pizza Jamón y Morrón",          desc:"Con jamón, morrón rojo y orégano. Completa y sabrosa.",                           precio:12000, img:"pizza-jamon-morron-cocida.jpg", emoji:"🍕", chips:["Para 1–2 personas","1 pizza grande","Al horno en 12 min"] },
  { id:19, cat:"Pizzas Individuales",   nombre:"Pizza Muzzarella",              desc:"Puro queso derretido sobre salsa de tomate. La clásica que nunca sobra.",          precio:11200, img:"pizza-muzarella-cocida.jpg", emoji:"🍕", chips:["Para 1–2 personas","1 pizza grande","Al horno en 12 min"] },
  { id:5,  cat:"Pack Pizzas x2",  nombre:"Pack Muzzarella x2",            desc:"Dos pizzas de muzzarella para tener siempre una cena resuelta en el freezer.",   precio:17000, img:"pack-muzarella-cocida.jpg", emoji:"🍕", top:true, chips:["Para 3–4 personas","2 pizzas grandes","Al horno en 12 min"] },
  { id:6,  cat:"Pack Pizzas x2",  nombre:"Pack Jamón y Queso x2",         desc:"Dos pizzas de jamón y queso. Una para hoy, otra para cuando quieras.",             precio:17000, img:"pack-jamon-queso-cocida.jpg", emoji:"🍕", chips:["Para 3–4 personas","2 pizzas grandes","Al horno en 12 min"] },
  { id:7,  cat:"Pack Pizzas x2",  nombre:"Pack Cebolla y Queso x2",       desc:"Dos pizzas con cebolla caramelizada. Guardá una para mañana.",                   precio:17000, img:"pack-cebolla-queso-cocida.jpg", emoji:"🍕", chips:["Para 3–4 personas","2 pizzas grandes","Al horno en 12 min"] },
  { id:8,  cat:"Sorrentinos",      nombre:"Sorrentinos Cordero al Malbec", desc:"Cordero, zanahoria, apio, cebolla y especias. Distinto y muy rico.",             precio:19800, img:"sorrentinos-cordero-v2.jpg", emoji:"🍝", chips:["Para 2–3 personas","600g · 16 unidades","Listos en 4 min"] },
  { id:9,  cat:"Sorrentinos",      nombre:"Sorrentinos Jamón y Queso",     desc:"Relleno cremoso y generoso. El favorito de la familia.",                         precio:18300, img:"sorrentinos-jamon-v2.jpg", emoji:"🍝", top:true, chips:["Para 2–3 personas","600g · 16 unidades","Listos en 4 min"] },
  { id:10, cat:"Sorrentinos",      nombre:"Sorrentinos Calabaza y Queso",  desc:"Suave, dulce y sabroso. Relleno cremoso de calabaza y queso.",                   precio:16500, img:"sorrentinos-calabaza-v2.jpg", emoji:"🍝", chips:["Para 2–3 personas","600g · 16 unidades","Listos en 4 min"] },
  { id:20, cat:"Sorrentinos",      nombre:"Sorrentinos Queso Brie",        desc:"Queso brie cremoso y perfumado. Gourmet sin vueltas.",                          precio:22100, img:"sorrentinos-brie.jpg",      emoji:"🍝", nuevoEn:["estancias"], chips:["Para 2–3 personas","600g · 16 unidades","Listos en 4 min"] },
  { id:21, cat:"Sorrentinos",      nombre:"Sorrentinos Langostinos al Azafrán", desc:"Langostinos y azafrán en masa casera. Muy gourmet.",                      precio:22100, img:"sorrentinos-langostinos.jpg",emoji:"🍝", nuevoEn:["estancias"], chips:["Para 2–3 personas","600g · 16 unidades","Listos en 4 min"] },
  { id:22, cat:"Sorrentinos",      nombre:"Sorrentinos Pollo y Puerro",    desc:"Pollo tierno con puerro salteado. Suave, sabroso y muy rendidor.",              precio:18300, img:"sorrentinos-pollo-puerro.jpg",emoji:"🍝", nuevoEn:["estancias"], chips:["Para 2–3 personas","600g · 16 unidades","Listos en 4 min"] },
  { id:23, cat:"Sorrentinos",      nombre:"Sorrentinos Espinaca",          desc:"Espinaca con queso cremoso. Verde, suave, tradicional.",                         precio:17000, img:"sorrentinos-espinaca.jpg",   emoji:"🍝", nuevoEn:["estancias"], chips:["Para 2–3 personas","600g · 16 unidades","Listos en 4 min"] },
  { id:11, cat:"Empanadas",        nombre:"Empanadas Carne a Cuchillo x8", desc:"Carne cortada a cuchillo, jugosa y bien condimentada. Las que piden todos.",     precio:20000, img:"empanadas-carne-v2.jpg", emoji:"🥟", top:true, chips:["Para 2–4 personas","8 empanadas","Al horno hasta dorar"] },
  { id:12, cat:"Empanadas",        nombre:"Empanadas Jamón y Queso x8",    desc:"Cremosas por dentro, doraditas por fuera. Para cualquier momento.",              precio:18000, img:"empanadas-jamon-v2.jpg", emoji:"🥟", chips:["Para 2–4 personas","8 empanadas","Al horno hasta dorar"] },
  { id:17, cat:"Empanadas",        nombre:"Empanadas Cebolla y Queso Azul x8",  desc:"Cebolla caramelizada con queso azul. Intensas y cremosas.",               precio:18000, img:"empanadas-cebolla-v2.jpg", emoji:"🥟", chips:["Para 2–4 personas","8 empanadas","Al horno hasta dorar"] },
  { id:18, cat:"Empanadas",        nombre:"Empanadas Verdura x8",          desc:"Relleno de verdura fresca y queso. Livianas y riquísimas.",                      precio:18000, img:"empanadas-verdura-v2.jpg", emoji:"🥟", chips:["Para 2–4 personas","8 empanadas","Al horno hasta dorar"] },
  { id:24, cat:"Tartas",   nombre:"Tarta Pollo y Verdeo",          desc:"Pollo y verdeo. Sustanciosa y bien rendidora.",                                                                  precio:12000, img:"tarta-pollo.jpg", emoji:"🥧", chips:["Para 1–2 personas","Tarta de 16 cm","Al horno en 10 min"] },
  { id:25, cat:"Tartas",   nombre:"Tarta Jamón y Queso",           desc:"El clásico. Mucho jamón, mucho queso. Hecha como en casa.",                                                                  precio:12000, img:"tarta-jamon-queso.jpg", emoji:"🥧", chips:["Para 1–2 personas","Tarta de 16 cm","Al horno en 10 min"] },
  { id:26, cat:"Tartas",   nombre:"Tarta Calabaza",                desc:"Calabaza con queso rallado y semillas de girasol arriba. Sabor a horno familiar.",                                                                  precio:12000, img:"tarta-calabaza.jpg", emoji:"🥧", chips:["Para 1–2 personas","Tarta de 16 cm","Al horno en 10 min"] },
  { id:27, cat:"Tartas",   nombre:"Tarta Verdura",                 desc:"Verdura con queso rallado. Liviana y rica.",                                                                  precio:12000, img:"tarta-verdura.jpg", emoji:"🥧", chips:["Para 1–2 personas","Tarta de 16 cm","Al horno en 10 min"] },
  { id:28, cat:"Wraps",    nombre:"Wrap Carne",                    desc:"Wrap relleno de carne. Bien condimentado, listo al horno.",                                                       precio:13000, img:"wrap-carne.jpg", emoji:"🌯", chips:["Para 1–2 personas","Listo al horno en 10 min"] },
  { id:29, cat:"Wraps",    nombre:"Wrap Pollo",                    desc:"Wrap relleno de pollo. Sabroso y rendidor.",                                                                      precio:13000, img:"wrap-pollo.jpg", emoji:"🌯", chips:["Para 1–2 personas","Listo al horno en 10 min"] },
  { id:13, cat:"Franuis", nombre:"Franui Leche",            desc:"Frambuesas bañadas en chocolate con leche y blanco. El cierre perfecto.",        precio:9000,  img:"franui-new.jpg", emoji:"🍫", chips:["Para 2–3 personas","Listo para servir"] },
  { id:14, cat:"Tortas", nombre:"Torta Golosa",                  desc:"Masa de chocolate, dulce de leche, mousse de chocolate y almendras acarameladas.", precio:26000, img:"torta-golosa.jpg", emoji:"🎂", chips:["Para 8–10 personas","Torta entera","Lista para cortar y servir"] },
  { id:15, cat:"Tortas", nombre:"Torta Lemon Crumble",           desc:"Base sablée, relleno de limón y crumble crocante espolvoreado.",                 precio:26000, img:"torta-lemon.jpg", emoji:"🎂", chips:["Para 8–10 personas","Torta entera","Lista para cortar y servir"] },
  { id:16, cat:"Tortas", nombre:"Torta Coco",                    desc:"Base crocante, dulce de leche y relleno de coco. Generosa y sin vueltas.",       precio:26000, img:"torta-coco.jpg", emoji:"🎂", chips:["Para 8–10 personas","Torta entera","Lista para cortar y servir"] },
  /* ═══ CARNES — Maleu Carnes (Lucas Moresco) ════════════════
     Se venden POR KILO y por PIEZA: el cliente elige la pieza que se lleva,
     con su peso exacto. Ver el bloque PIEZAS mas abajo.

     Los `id` son los del ERP (HOME_PRODUCT_COLS 30-34), no inventados: con
     otro numero el backend no encuentra la columna y el pedido se cobra sin
     guardarse. Los precios salen de la hoja Productos.

     `abbr` es la llave con la que se cruzan las piezas y la que entiende el
     backend. `porPeso` lo confirma `action=precios` (u:"kg") al cargar.

     DONDE SE VENDE: Estancias, y desde el 14/9/2026 tambien lo que Maleu
     entrega en "Otra zona de Pilar". Tadeo: "para las entregas que haga yo que
     no sean de mis vendedores, deberia estar involucrada la carne". Lo decide
     `_pilarEntregaMaleu`.

     NO en los barrios con vendedor (`sinVendedor`) ni en Clubes, y no es una
     decision comercial: es donde la planilla tiene DONDE guardarlos. La hoja
     Pilar tiene columnas para la carne (70-74); la de Clubes no, y un pedido de
     un barrio con vendedor la tienda lo manda a la hoja Red — que tampoco la tiene. En las dos, el pedido entra, el total
     sale bien, y los kilos no caen en ningun lado: sin error y sin log. Es la
     misma forma de fallar que el `editarPedido` que cobraba 16 productos sin
     guardarlos.
     Se abren esos canales el dia que RED_PRODUCT_COLS y CLUBES_PRODUCT_COLS
     conozcan los ids 30-34. Lo vigila `node _tools/verificar-pedido.js`. */
  { id:30, abbr:"CCo", cat:"Carnes", porPeso:true, sinVendedor:true, nuevo:true, zonas:["estancias","pilar"], nombre:"Colita de Cuadril", desc:"Jugosa al horno y perfecta a la parrilla. Un corte que nunca falla.", precio:25000, img:"carne-colita.jpg", emoji:"\ud83e\udd69", chips:["Fresca, no congelada","Envasada al vac\u00edo"] },
  /* La entrana viene de a DOS tiras por paquete (dato de Lucas, 10/9/2026), y
     el peso que se ve es el del paquete entero. Sin decirlo, el que elige una
     de 1,163 kg no sabe si le llega una tira grande o dos. */
  { id:31, abbr:"CEn", cat:"Carnes", porPeso:true, sinVendedor:true, nuevo:true, zonas:["estancias","pilar"], nombre:"Entra\u00f1a",           desc:"Fina, sabrosa y r\u00e1pida. La que sale primero de la parrilla.",          precio:34000, img:"carne-entrana.jpg", emoji:"\ud83e\udd69", chips:["Fresca, no congelada","Envasada al vac\u00edo","2 tiras por paquete"] },
  { id:32, abbr:"CLo", cat:"Carnes", porPeso:true, sinVendedor:true, nuevo:true, zonas:["estancias","pilar"], nombre:"Lomo sin cord\u00f3n",  desc:"El corte m\u00e1s tierno, limpio y sin cord\u00f3n. Para la ocasi\u00f3n que se merece el mejor.", precio:33000, img:"carne-lomo.jpg", emoji:"\ud83e\udd69", chips:["Fresco, no congelado","Envasado al vac\u00edo","Sin cord\u00f3n"] },
  { id:33, abbr:"CPi", cat:"Carnes", porPeso:true, sinVendedor:true, nuevo:true, zonas:["estancias","pilar"], nombre:"Pica\u00f1a",            desc:"El corte brasilero que se volvi\u00f3 infaltable. Con su tapa de grasa.",  precio:26000, img:"carne-picana.jpg", emoji:"\ud83e\udd69", chips:["Fresca, no congelada","Envasada al vac\u00edo"] },
  { id:34, abbr:"CVa", cat:"Carnes", porPeso:true, sinVendedor:true, nuevo:true, zonas:["estancias","pilar"], nombre:"Vac\u00edo",             desc:"El cl\u00e1sico del asado argentino. Paciencia y fuego bajo.",            precio:26000, img:"carne-vacio.jpg", emoji:"\ud83e\udd69", chips:["Fresco, no congelado","Envasado al vac\u00edo"] },
];

const CATEGORIAS = [
  { nombre:"Pack Pizzas x2",      icono:"🍕", nota:"Pack de 2 unidades · Perfectas para tener siempre a mano" },
  { nombre:"Pizzas Individuales", icono:"🍕", nota:"Pre-cocidas · Listas en minutos · Al horno directo desde el freezer" },
  /* La carne va TERCERA, pegada a las dos de pizzas, no al final: lo pidio
     Tadeo el 10/9/2026. `img` es propia a proposito: sin ella la foto saldria
     del primer corte de la zona, y cambiaria sola el dia que se reordene la
     lista. Hasta el 13/9/2026 era carne-cortes.jpg, una foto de stock que no
     es ninguno de los cortes que se venden; del 13 al 14/9, la colita cruda.
     Desde el 14/9 es carne a la parrilla, cortada (la paso Tadeo): las demas
     categorias muestran el producto cocinado, y la carne cruda desentonaba. */
  { nombre:"Carnes",              icono:"🥩", nota:"Cortes frescos de Maleu Carnes · Elegís vos la pieza que te llevás y sabés su peso exacto antes de pedirla", img:"categoria-carnes.jpg" },
  { nombre:"Wraps",               icono:"🌯", nota:"Pre-cocidos · Listos al horno en pocos minutos" },
  { nombre:"Empanadas",           icono:"🥟", nota:"x8 unidades · Congeladas, listas para el horno · Cocinar hasta dorar" },
  { nombre:"Sorrentinos",         icono:"🍝", nota:"600g · 16 unidades · Rinde 3 porciones · Solo 4 minutos de cocción", tip:"Hervir agua · Agregar sorrentinos · 4 min con olla destapada · Retirar con espumadera y servir" },
  { nombre:"Tartas",              icono:"🥧", nota:"Pre-cocidas · 16cm · Listas al horno en 10 min", tip:"Precalentar horno al máximo 10 min · Hornear 10 min · Servir" },
  { nombre:"Franuis",             icono:"🍫", nota:"Frambuesas bañadas en chocolate · Listas para servir" },
  { nombre:"Tortas",              icono:"🎂", nota:"Tortas enteras · Listas para cortar y servir" },
];

/* ── PRODUCTOS CLUBES (precios especiales, solo pizzas) ── */
const PRODUCTOS_CLUBES = [
  { id:'pmu', cat:"Pizzas Individuales",  nombre:"Pizza Muzzarella",           desc:"Puro queso derretido sobre salsa de tomate. La clásica que nunca sobra.",   precio:7900,  img:"pizza-muzarella-cocida.jpg", emoji:"🍕", chips:["1 pizza grande","Al horno en 12 min"] },
  { id:'pjq', cat:"Pizzas Individuales",  nombre:"Pizza Jamón y Queso",        desc:"Mucho jamón, mucho queso. Simple, efectiva y sin dramas.",                  precio:8300,  img:"pizza-jamon-queso-cocida.jpg", emoji:"🍕", chips:["1 pizza grande","Al horno en 12 min"] },
  { id:'pcc', cat:"Pizzas Individuales",  nombre:"Pizza Cebolla Caramelizada", desc:"Cebolla bien dulce con queso cremoso. Para los que saben.",                 precio:8000,  img:"pizza-cebolla-cocida.jpg", emoji:"🍕", chips:["1 pizza grande","Al horno en 12 min"] },
  { id:'pma', cat:"Pizzas Individuales",  nombre:"Pizza Margarita",            desc:"Tomate fresco, mozzarella y albahaca. La que nunca falla.",                  precio:8000,  img:"pizza-margarita-cocida.jpg", emoji:"🍕", chips:["1 pizza grande","Al horno en 12 min"] },
  { id:'pjm', cat:"Pizzas Individuales",  nombre:"Pizza Jamón y Morrón",       desc:"Con jamón, morrón rojo y orégano. Completa y sabrosa.",                     precio:8000,  img:"pizza-jamon-morron-cocida.jpg", emoji:"🍕", chips:["1 pizza grande","Al horno en 12 min"] },
  { id:'pp1', cat:"Pack Pizzas x2", nombre:"Pack Muzzarella x2",         desc:"Dos pizzas de muzzarella. Cena resuelta para todo el equipo.",              precio:13000, img:"pack-muzarella-cocida.jpg", emoji:"🍕", top:true, chips:["2 pizzas grandes","Al horno en 12 min"] },
  { id:'pp2', cat:"Pack Pizzas x2", nombre:"Pack Jamón y Queso x2",      desc:"Dos pizzas de jamón y queso. El clásico del tercer tiempo.",               precio:13000, img:"pack-jamon-queso-cocida.jpg", emoji:"🍕", chips:["2 pizzas grandes","Al horno en 12 min"] },
  { id:'pp3', cat:"Pack Pizzas x2", nombre:"Pack Cebolla y Queso x2",    desc:"Dos pizzas con cebolla caramelizada. Siempre piden más.",                  precio:13000, img:"pack-cebolla-queso-cocida.jpg", emoji:"🍕", chips:["2 pizzas grandes","Al horno en 12 min"] },
  { id:'ecac', cat:"Empanadas", nombre:"Empanadas Carne a Cuchillo x8", desc:"Carne cortada a cuchillo, jugosa y bien condimentada. Las que piden todos.", precio:18400, img:"empanadas-carne-v2.jpg", emoji:"🥟", chips:["8 empanadas","Al horno hasta dorar"] },
  { id:'ejyq', cat:"Empanadas", nombre:"Empanadas Jamón y Queso x8",    desc:"Cremosas por dentro, doraditas por fuera. Para cualquier momento.",          precio:16000, img:"empanadas-jamon-v2.jpg", emoji:"🥟", chips:["8 empanadas","Al horno hasta dorar"] },
  { id:'ecyq', cat:"Empanadas", nombre:"Empanadas Cebolla y Queso Azul x8", desc:"Cebolla caramelizada con queso azul. Intensas y cremosas.",              precio:16000, img:"empanadas-cebolla-v2.jpg", emoji:"🥟", chips:["8 empanadas","Al horno hasta dorar"] },
  { id:'evc',  cat:"Empanadas", nombre:"Empanadas Verdura x8",          desc:"Relleno de verdura fresca y queso. Livianas y riquísimas.",                  precio:16000, img:"empanadas-verdura-v2.jpg", emoji:"🥟", chips:["8 empanadas","Al horno hasta dorar"] },
];
const CATEGORIAS_CLUBES = [
  { nombre:"Pack Pizzas x2",      icono:"🍕", nota:"Pack de 2 unidades · Ideal para compartir en equipo" },
  { nombre:"Pizzas Individuales", icono:"🍕", nota:"Individuales · Pre-cocidas · Al horno directo desde el freezer" },
  { nombre:"Empanadas",           icono:"🥟", nota:"x8 unidades · Congeladas, listas para el horno · Cocinar hasta dorar" },
];
// Los productos de clubes se agregan a PROD_MAP después de su declaración (ver más abajo)

/* Restricción de producto por SUB-BARRIO. En "Ayres del Pilar" (zona de Fini)
   NO se pueden vender sorrentinos: Fini sí los vende en sus otros barrios, pero
   en Ayres del Pilar no. Se ocultan del catálogo, de las categorías y de los
   combos, y se purgan del carrito si el cliente cambia a ese barrio.
   (13/07/2026, pedido de Tadeo.) */
function _catBloqueadaPorBarrio(cat) {
  return currentZone === 'pilar'
      && cat === 'Sorrentinos'
      && (selectedPilarBarrio === 'Ayres del Pilar' || selectedPilarBarrioName === 'Ayres del Pilar');
}
/* Lo mismo, por producto: lo que no tiene donde guardarse en la hoja Red
   (`sinVendedor`, la carne) no se ofrece en un barrio con vendedor. */
function _productoBloqueadoPorBarrio(p) {
  if (!p) return false;
  if (_catBloqueadaPorBarrio(p.cat)) return true;
  return !!(p.sinVendedor && currentZone === 'pilar' && !_pilarEntregaMaleu());
}
/* Saca del carrito los productos bloqueados por el barrio actual. Devuelve
   cuantas piezas de carne saco (0 si ninguna) o true si solo saco productos:
   la carne se avisa aparte, porque el cliente la eligio pieza por pieza.
   (cart y PROD_MAP se inicializan más abajo; se usa en runtime.) */
function _purgeCartBloqueados() {
  var changed = false, piezas = 0;
  Object.keys(cart).forEach(function(id) {
    var p = PROD_MAP[id];
    if (p && _productoBloqueadoPorBarrio(p)) { delete cart[id]; changed = true; }
  });
  Object.keys(piezaCart).forEach(function (pid) {
    if (_productoBloqueadoPorBarrio(PROD_MAP[piezaCart[pid].id])) { delete piezaCart[pid]; piezas++; }
  });
  return piezas || changed;
}

/* El modo `?autopedido=1` se ELIMINO el 8/9/2026.

   Existio del 1/9 al 8/9 para un caso real: Javier Galarraga, de Estancias,
   pidio 3 Sorrentinos Espinaca — que en ese momento era exclusivo de Pilar y
   aca no se mostraba. Con el parametro se veia el catalogo completo y Tadeo
   cargaba el pedido por el cliente.
   El 10/9/2026 ese caso dejo de existir: Tadeo abrio los 4 sorrentinos premium
   a Estancias, asi que el cliente los pide solo. El modo sigue eliminado por
   el motivo de abajo, que no tiene nada que ver con el catalogo.

   El problema no era que anduviera mal. Era que convertia a la tienda en una
   SEGUNDA pantalla para cargar pedidos, en paralelo a la tab AUTOPEDIDO del
   ERP. Dos caminos para lo mismo se despegan solos, y este no tiene los
   controles del otro: ni el stock del freezer, ni el origen, ni "ya me pago",
   ni el resumen para WhatsApp segun el momento del pedido.

   Esos cuatro productos viven ahora en el catalogo de la tab AUTOPEDIDO, en un
   bloque "por encargo" que dice que no salen del freezer y que origen
   corresponde. Aca `_zonaPermite` vuelve a filtrar SIEMPRE, sin excepcion. */

/* Unico lugar que decide si un producto o combo se muestra en la zona actual.
   Antes esta condicion estaba repetida en tres lados y era facil que una
   quedara sin actualizar. */
/* La chapita "Nuevo" no siempre es global. Los 4 sorrentinos premium se
   abrieron a Estancias el 10/9/2026 y ahi son novedad, pero en Pilar los
   venimos vendiendo hace meses: decirle "Nuevo" a alguien que ya los compro
   gasta la unica chapita que hace que un cliente frecuente vuelva a mirar el
   catalogo. `nuevo` sigue siendo el flag de siempre (novedad en todos lados);
   `nuevoEn` lo acota a las zonas donde de verdad lo es. */
function _esNuevo(p) {
  if (p.nuevo) return true;
  return !!(p.nuevoEn && p.nuevoEn.indexOf(currentZone) >= 0);
}

function _zonaPermite(zonas) {
  if (!zonas) return true;
  return zonas.indexOf(currentZone) >= 0;
}

/* Productos y categorías activos según zona */
function getActiveProducts() {
  if (currentZone === 'clubes') return PRODUCTOS_CLUBES;
  return PRODUCTOS.filter(function(p) {
    if (!_zonaPermite(p.zonas)) return false;
    if (_productoBloqueadoPorBarrio(p)) return false;
    /* La carne se muestra solo cuando SABEMOS que hay: mientras el inventario
       viaja, o si no se pudo traer, no se dibuja ningun corte. Decir "sin
       stock" sin haber mirado seria mentir: no saber no es lo mismo que no hay.

       Sabiendolo, un corte sin piezas se muestra con "Sin stock" SOLO si no
       hay ninguna pieza de ningun corte — la regla esta explicada entera arriba
       de `_corteSeMuestra`. Cuando se muestra va al final de su categoria
       (renderCatalog) y en chico, para no empujar los que si hay. */
    if (!_corteSeMuestra(p)) return false;
    return true;
  });
}
function getActiveCategories() {
  var cats = currentZone === 'clubes' ? CATEGORIAS_CLUBES : CATEGORIAS;
  return cats.filter(function(c) { return !_catBloqueadaPorBarrio(c.nombre); });
}

/* Las categorias que de verdad se VEN: las que tienen al menos un producto
   activo en esta zona.

   Existe porque el criterio vivia en tres lugares y uno no filtraba: el chip
   "Carnes" se dibujaba en el nav aunque no hubiera ni una pieza, y al tocarlo
   no pasaba nada — su seccion no existe. Un boton que no hace nada es peor
   que no tener boton: el cliente concluye que la tienda esta rota. */
function getCategoriasVisibles() {
  var prods = getActiveProducts();
  return getActiveCategories().filter(function (c) {
    return prods.some(function (p) { return p.cat === c.nombre; });
  });
}

/* ══════════════════════════════════════════════════
   COMBOS — bundles configurables con precio fijo cerrado
   ──────────────────────────────────────────────────
   Un combo es una PLANTILLA con `slots` (ranuras). Cada slot es "elegí N de
   este conjunto de opciones válidas". El cliente arma el combo en un modal y
   recién entonces lo agrega; cada CONFIGURACIÓN distinta es una instancia
   distinta del carrito.
   - precio: fijo cerrado (NO suma de componentes). No apila 10%/promos/cupón.
   - slots[].options: { cat:'Tartas' }  (todas las de la zona) | { ids:[28,29] }.
   - slots[].pick: cuántas unidades elige (default 1).
   - Un slot con 1 sola opción válida = componente fijo (no muestra selector).
   - Un combo aparece en una zona solo si TODOS sus slots tienen >=1 opción.
   El combo se EXPANDE a productos reales al escribir al Sheet (stock/caja/
   abastecimiento/analytics intactos). El precio original "tachado" se calcula
   según la selección concreta.

   comboCart: { [signature]: { comboId, qty, comp:[{id,qty}], picks:[{label,prodId,nombre}] } }
   ══════════════════════════════════════════════════ */
// Placeholder común hasta tener artes definitivos de cada combo.
const COMBO_PLACEHOLDER_IMG = 'pack-muzarella-cocida.jpg';
const COMBOS = [
  // ── PERMANENTES ──
  {
    id: 'cmb_descubri_semana',
    nombre: 'Descubrí Maleu · Semana',
    desc: 'Conocé los productos ideales para el día a día.',
    personas: '2 a 3 personas',
    precio: 46900,
    img: 'combo-semana.jpg', fullCard: true,
    emoji: '🎁',
    zonas: ['estancias', 'pilar'],
    slots: [
      { label: 'Tarta',       unidad: 'tarta',               pick: 1, options: { cat: 'Tartas' } },
      { label: 'Wrap',        unidad: 'wrap',                pick: 1, options: { cat: 'Wraps' } },
      { label: 'Sorrentinos', unidad: 'pack de sorrentinos', pick: 1, options: { ids: [10, 9, 8] } },  // Calabaza, J&Q, Cordero
      { label: 'Postre',      unidad: 'Franui',              pick: 1, options: { ids: [13] } },
    ],
  },
  {
    id: 'cmb_descubri_finde',
    nombre: 'Descubrí Maleu · Fin de Semana',
    desc: 'Probá los clásicos de Maleu para compartir.',
    personas: '2 a 3 personas',
    precio: 34900,
    img: 'combo-finde.jpg', fullCard: true,
    emoji: '🎁',
    zonas: ['estancias', 'pilar'],
    slots: [
      { label: 'Pizza premium', unidad: 'pizza individual',      pick: 1, options: { cat: 'Pizzas Individuales' } },
      { label: 'Empanadas',     unidad: 'pack de empanadas x8',  pick: 1, options: { cat: 'Empanadas' } },
      { label: 'Postre',        unidad: 'Franui',                pick: 1, options: { ids: [13] } },
    ],
  },
  {
    id: 'cmb_noche_casa',
    nombre: 'Noche en Casa',
    desc: 'Una cena rica y lista en minutos para dos personas.',
    personas: '2 personas',
    precio: 23900,
    img: 'combo-noche.jpg', fullCard: true,
    emoji: '🎁',
    zonas: ['estancias', 'pilar'],
    slots: [
      { label: 'Pizza',  unidad: 'pack de pizzas clásicas x2', pick: 1, options: { cat: 'Pack Pizzas x2' } },
      { label: 'Postre', unidad: 'Franui',                     pick: 1, options: { ids: [13] } },
    ],
  },
  {
    id: 'cmb_mesa_familiar',
    nombre: 'Mesa Familiar',
    desc: 'Una solución práctica para una comida en familia.',
    personas: '4 a 5 personas',
    precio: 45900,
    img: 'combo-mesa.jpg', fullCard: true,
    emoji: '🎁',
    zonas: ['estancias', 'pilar'],
    slots: [
      { label: 'Tarta',     unidad: 'tarta',                 pick: 2, options: { cat: 'Tartas' } },      // dos iguales o distintas
      { label: 'Empanadas', unidad: 'pack de empanadas x8',  pick: 1, options: { cat: 'Empanadas' } },
      { label: 'Postre',    unidad: 'Franui',                pick: 1, options: { ids: [13] } },
    ],
  },
  {
    id: 'cmb_freezer_lleno',
    nombre: 'Freezer Lleno',
    desc: 'Resolvé varias comidas de la semana en un solo pedido.',
    personas: '4 a 6 personas',
    precio: 84900,
    img: 'combo-freezer.jpg', fullCard: true,
    emoji: '🎁',
    zonas: ['estancias', 'pilar'],
    slots: [
      { label: 'Pizza',       unidad: 'pack de pizzas clásicas x2', pick: 2, options: { cat: 'Pack Pizzas x2' } },  // dos iguales o distintas
      { label: 'Sorrentinos', unidad: 'pack de sorrentinos',        pick: 1, options: { ids: [10, 9, 8] } },
      { label: 'Empanadas',   unidad: 'pack de empanadas x8',       pick: 1, options: { cat: 'Empanadas' } },
      { label: 'Tarta',       unidad: 'tarta',                      pick: 2, options: { cat: 'Tartas' } },           // dos iguales o distintas
    ],
  },
];
const COMBO_MAP = {}; COMBOS.forEach(c => COMBO_MAP[c.id] = c);

/* Opciones válidas de un slot en la zona actual (array de productos). */
function slotOptions(slot) {
  let prods;
  if (slot.options && slot.options.ids) {
    prods = slot.options.ids.map(id => PROD_MAP[id]).filter(Boolean);
  } else if (slot.options && slot.options.cat) {
    prods = getActiveProducts().filter(p => p.cat === slot.options.cat);
  } else { prods = []; }
  return prods.filter(p => _zonaPermite(p.zonas) && !_productoBloqueadoPorBarrio(p));
}
/* ¿El combo tiene al menos un slot con opción a elegir (más de 1)? */
function comboHasChoices(c) { return (c.slots || []).some(s => slotOptions(s).length > 1); }
/* ¿El combo se puede mostrar en la zona? Todos los slots con >=1 opción. */
function comboAvailableInZone(c) {
  if (!_zonaPermite(c.zonas)) return false;
  if (!c.slots || !c.slots.length) return false;
  return c.slots.every(s => slotOptions(s).length >= 1);
}
function getActiveCombos() {
  if (currentZone === 'clubes') return [];
  return COMBOS.filter(comboAvailableInZone);
}
/* Saca el prefijo de categoría redundante del nombre de una opción según el
   label del slot. Ej: slot "Empanadas" + "Empanadas Carne x8" → "Carne x8". */
function _optLabel(nombre, slotLabel) {
  if (!nombre) return '';
  const l = (slotLabel || '').trim().toLowerCase();
  if (l && nombre.toLowerCase().indexOf(l + ' ') === 0) return nombre.slice(l.length + 1);
  return nombre;
}
/* Selección por defecto: primera opción de cada slot (repite si pick>1). */
function defaultSelection(c) {
  return (c.slots || []).map(slot => {
    const opts = slotOptions(slot);
    const pick = slot.pick || 1;
    const sel = [];
    for (let k = 0; k < pick; k++) { const p = opts[k % opts.length] || opts[0]; sel.push(p ? p.id : null); }
    return sel;
  });
}
/* Igual que defaultSelection pero prefiriendo gustos que SÍ tengan stock. Se
   usa solo al abrir el configurador: si el gusto por defecto estaba agotado, el
   modal abría directo en "Sin stock para esta combinación" y parecía que el
   combo entero no se podía armar. La selección "cruda" se sigue usando para el
   precio tachado, para que no baile según el stock del día. */
function defaultSelectionInStock(c) {
  const usado = {};
  return (c.slots || []).map(slot => {
    const opts = slotOptions(slot);
    const pick = slot.pick || 1;
    const sel = [];
    for (let k = 0; k < pick; k++) {
      let elegido = null;
      for (let i = 0; i < opts.length; i++) {
        const libre = optionAvailable(opts[i].id);
        if (libre === Infinity || libre - (usado[opts[i].id] || 0) > 0) { elegido = opts[i]; break; }
      }
      // Si no hay nada libre, caemos al default de siempre (el modal avisará).
      if (!elegido) elegido = opts[k % opts.length] || opts[0];
      if (elegido) { usado[elegido.id] = (usado[elegido.id] || 0) + 1; sel.push(elegido.id); }
      else sel.push(null);
    }
    return sel;
  });
}
/* Resuelve una selección (array alineado a slots, cada uno array de prodIds)
   en componentes mergeados {comp:[{id,qty}], picks:[{label,prodId,nombre}]}. */
function resolveComp(c, selections) {
  const compMap = {}; const picks = [];
  (c.slots || []).forEach((slot, i) => {
    (selections[i] || []).forEach(pid => {
      if (pid == null) return;
      const key = String(pid);
      compMap[key] = (compMap[key] || 0) + 1;
      const p = PROD_MAP[pid];
      picks.push({ label: slot.label, prodId: pid, nombre: p ? p.nombre : '' });
    });
  });
  const comp = Object.entries(compMap).map(([id, qty]) => ({ id: isNaN(id) ? id : +id, qty }));
  return { comp, picks };
}
/* Firma única de una configuración (combo + componentes elegidos). */
function comboSignature(comboId, comp) {
  return comboId + '|' + comp.map(ci => ci.id + 'x' + ci.qty).sort().join(',');
}
/* Valor individual (precio "tachado") de una lista de componentes. */
function comboNaturalSumComp(comp) {
  return comp.reduce((s, ci) => { const p = PROD_MAP[ci.id]; return s + (p ? p.precio * ci.qty : 0); }, 0);
}

/* Unidades de un producto ya comprometidas (productos sueltos + instancias de
   combo), opcionalmente excluyendo una firma (para evaluar cuántas más entran). */
function _unitsConsumed(prodId, excludeSig) {
  let n = cart[prodId] || 0;
  Object.keys(comboCart).forEach(sig => {
    if (sig === excludeSig) return;
    const inst = comboCart[sig]; if (!inst) return;
    inst.comp.forEach(ci => { if (String(ci.id) === String(prodId)) n += ci.qty * inst.qty; });
  });
  return n;
}
/* Máximo de instancias de esta configuración que entran dado el stock libre. */
function compMaxTotal(comp, excludeSig) {
  let cap = Infinity;
  comp.forEach(ci => {
    const sc = getStockCap(ci.id);                  // null/undefined = ilimitado
    if (sc === null || sc === undefined) return;
    const otros = _unitsConsumed(ci.id, excludeSig);
    cap = Math.min(cap, Math.floor((sc - otros) / ci.qty));
  });
  return cap;
}
/* Máximo de instancias del combo eligiendo el MEJOR gusto disponible en cada
   slot, en vez de dar por sentado el gusto por defecto.

   Antes las cards usaban compMaxTotal(defaultSelection(c)), que mira solo la
   primera opción de cada slot. Bastaba que se acabara UN gusto (típicamente el
   Franui, que es la única opción del slot Postre en todos los combos, o la
   primera tarta de la lista) para que TODOS los combos se mostraran "Sin
   stock" — cuando en realidad el combo se puede armar perfecto con los otros
   gustos. Acá sumamos las unidades libres de todas las opciones del slot: si
   entre todas alcanzan, el combo está disponible.

   Los slots de un mismo combo no comparten productos entre sí (ver COMBOS), así
   que sumar por slot no double-countea. */
function comboBestMax(c, excludeSig) {
  var libre = {};
  function libreDe(id) {
    if (libre[id] === undefined) {
      var sc = getStockCap(id);
      libre[id] = (sc === null || sc === undefined)
        ? Infinity
        : Math.max(0, sc - _unitsConsumed(id, excludeSig));
    }
    return libre[id];
  }
  var cap = Infinity;
  (c.slots || []).forEach(function(slot) {
    var opts = slotOptions(slot);
    if (!opts.length) { cap = 0; return; }
    var total = 0, hayIlimitada = false;
    opts.forEach(function(p) {
      var f = libreDe(p.id);
      if (f === Infinity) hayIlimitada = true;
      else total += f;
    });
    if (hayIlimitada) return;  // alguna opción sin tope → este slot no limita
    cap = Math.min(cap, Math.floor(total / (slot.pick || 1)));
  });
  return cap;
}

/* Disponibilidad de una opción suelta (cuántas unidades libres quedan ahora). */
function optionAvailable(prodId) {
  const sc = getStockCap(prodId);
  if (sc === null || sc === undefined) return Infinity;
  return sc - _unitsConsumed(prodId, null);
}

/* Subtotales separados: productos sueltos vs combos (a precio cerrado). */
/* ══ PIEZAS DE CARNE ═════════════════════════════════════════
   La carne se vende por pieza, y cada pieza pesa distinto porque viene
   envasada al vacio. El cliente elige cual se lleva.
   ═════════════════════════════════════════════════════════════ */

/* Un peso en kilos, como se escribe en Argentina: coma decimal y hasta tres
   decimales, que es lo que da una balanza. 1.24 -> "1,240 kg" */
function kgTexto(kg) {
  var n = Number(kg) || 0;
  return n.toFixed(3).replace('.', ',') + ' kg';
}

/* Lo que sale una pieza: su peso por el precio del kilo.
   Se redondea al peso porque no existe el centavo, y se redondea UNA sola vez
   — si cada pantalla redondeara por su cuenta, el total del carrito no daria
   igual que la suma de las lineas. */
function piezaPrecio(prod, kg) {
  return Math.round((Number(kg) || 0) * (prod ? prod.precio : 0));
}

/* Las piezas disponibles de un corte, sin las que ya estan en el carrito.
   Devuelve [] si el corte no tiene ninguna, y tambien si todavia no llegaron
   los datos: quien lo llame tiene que mirar `piezasEstado` para saber cual de
   las dos cosas es. */
function piezasDe(abbr) {
  var lista = piezasMap[abbr];
  if (!lista || !lista.length) return [];
  return lista.filter(function (pz) { return !piezaCart[pz.id]; });
}

/* ── LA SUGERENCIA DE CARNE EN EL CARRITO (13/9/2026) ──
   Tadeo: "que la sugerencia sea con algo que realmente tengamos: le sumás una
   pieza de colita de x peso". 229 de las 262 casas de Estancias nunca
   compraron carne (medido en el ERP el 11/9/2026), y la carne va en la misma
   entrega: no agrega un viaje.

   Sale del MISMO inventario que la grilla de Carnes (piezasDe, que ya saca
   las piezas del carrito), asi que no puede ofrecer una pieza que no existe.
   Si se vende mientras el carrito esta abierto, togglePieza la rechaza y la
   conciliacion la saca; y la sugerencia se repinta con cada refresco del
   inventario (cuelga de renderCatalog) y con cada cambio del carrito (updateUI).

   Sale solo si:
   · hay algo en el carrito — a un carrito vacio no se le sugiere nada;
   · no hay carne adentro — el que ya eligio su pieza no necesita otra oferta;
   · la zona vende carne y hay piezas (hayPiezas: sin inventario conocido no
     se afirma nada).

   Ofrece hasta DOS cortes, una pieza de cada uno: la mas chica, que es el
   paso mas facil de dar, y un link a ver todas. El orden de los cortes es de
   mayor a menor margen, medido en el ERP: sugerir primero lo que menos deja
   seria empujar justo la venta que menos conviene. Los numeros no van aca:
   el repo es publico. Un corte nuevo que no este en la lista entra al final. */
var SUG_CARNE_ORDEN = ['CPi', 'CVa', 'CCo', 'CLo', 'CEn'];
var SUG_CARNE_MAX = 2;

function _sugerenciaCarne() {
  if (cartCount() === 0 || piezasAgrupadas().length || !hayPiezas()) return [];
  var activos = {};
  getActiveProducts().forEach(function (p) { if (esPorPeso(p)) activos[p.abbr] = p; });
  var out = [];
  SUG_CARNE_ORDEN.concat(Object.keys(activos)).forEach(function (abbr) {
    if (out.length >= SUG_CARNE_MAX || !activos[abbr]) return;
    if (out.some(function (x) { return x.p.abbr === abbr; })) return;
    var libres = piezasDe(abbr);
    if (!libres.length) return;
    out.push({ p: activos[abbr], pz: libres.slice().sort(_piezaOrden)[0], n: libres.length });
  });
  return out;
}

/* ── Y AL REVES: EL QUE SOLO LLEVA CARNE (13/9/2026) ──
   Tadeo, el mismo dia: "si la experiencia del cliente solo va por la carne y
   ve el carrito, estaria bueno poner: ¿queres sumar algo mas? Tenemos pizzas,
   sorrentinos, empanadas, tartas, wraps". Misma caja, mismo lugar, la regla
   dada vuelta:
   · sale solo si el carrito tiene carne y NADA mas (ni productos ni combos);
   · ofrece hasta TRES productos de categorias distintas, porque lo que se
     quiere decir es "tenemos de todo": una pizza, unos sorrentinos, unas
     empanadas — no tres pizzas;
   · primero los "Lo mas pedido" (top:true, que cura Tadeo), despues el resto
     en el orden del catalogo;
   · solo lo que se puede pedir PARA LA FECHA ELEGIDA, con getStockCap: el
     mismo tope que el boton "+ Agregar". Si la margarita no hay para hoy, la
     pizza que se ofrece es otra. Nunca ofrece algo que no hay. */
var SUG_MALEU_MAX = 3;
var _sugVistas = {};
/* Como se nombra una categoria adentro de una frase. Una categoria nueva que no
   este aca entra con su nombre en minuscula: se lee raro, pero no se pierde. */
var SUG_GRUPO = { 'Pizzas Individuales': 'pizzas', 'Pack Pizzas x2': 'pizzas', 'Sorrentinos': 'sorrentinos',
  'Empanadas': 'empanadas', 'Tartas': 'tartas', 'Wraps': 'wraps', 'Franuis': 'postres', 'Tortas': 'postres' };
function _sugGrupo(cat) { return SUG_GRUPO[cat] || String(cat || '').toLowerCase(); }
function _hayParaLaFecha(p) {
  var cap = getStockCap(p.id);
  return cap === null || cap === undefined || cap > 0;
}

function _sugerenciaMaleu() {
  var nada = { prods: [], grupos: [] };
  if (!piezasAgrupadas().length) return nada;
  if (Object.keys(cart).some(function (id) { return cart[id] > 0; }) || Object.keys(comboCart).length) return nada;
  var hay = getActiveProducts().filter(function (p) { return !esPorPeso(p) && _hayParaLaFecha(p); });
  var grupos = [];
  hay.forEach(function (p) { var g = _sugGrupo(p.cat); if (grupos.indexOf(g) === -1) grupos.push(g); });
  var usados = {}, prods = [];
  hay.filter(function (p) { return p.top; }).concat(hay.filter(function (p) { return !p.top; })).forEach(function (p) {
    var g = _sugGrupo(p.cat);
    if (prods.length >= SUG_MALEU_MAX || usados[g]) return;
    usados[g] = true;
    prods.push(p);
  });
  return { prods: prods, grupos: grupos };
}

/* "pizzas, sorrentinos y empanadas" */
function _sugLista(arr) {
  return arr.length > 1 ? arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1] : (arr[0] || '');
}
function _sugFila(img, nombre, det, onclick) {
  return '<div class="sug-fila">' +
    '<img class="sug-img" src="' + fotoUrl(img) + '" alt="" loading="lazy" width="48" height="48" onerror="this.style.visibility=\'hidden\'">' +
    '<div class="sug-info"><div class="sug-nom">' + nombre + '</div><div class="sug-det">' + det + '</div></div>' +
    '<button type="button" class="sug-btn" onclick="' + onclick + '">+ Sumar</button>' +
  '</div>';
}

/* Una sola caja para las dos sugerencias: nunca salen juntas (una pide que
   haya carne y la otra que no), y dos carteles de "sumá algo" seguidos serian
   mucho. data-tipo dice cual es, para medirla. */
function _pintarSugerencia() {
  var el = $id('cart-sug');
  if (!el) return;
  var tipo = '', html = '';
  var carne = _sugerenciaCarne();
  if (carne.length) {
    tipo = 'carne';
    html = '<div class="sug-t">¿Le sumás carne?</div>' +
      '<div class="sug-s">Fresca, envasada al vacío, y va en la misma entrega.</div>' +
      carne.map(function (x) {
        return _sugFila(x.p.img, x.p.nombre,
          'Pieza de ' + kgTexto(x.pz.kg) + ' · <strong>' + ars(piezaPrecio(x.p, x.pz.kg)) + '</strong>',
          'sumarPiezaSugerida(\'' + x.p.abbr + '\',\'' + x.pz.id + '\')');
      }).join('') +
      '<button type="button" class="sug-ver" onclick="verDesdeCarrito(\'carne\')">Ver todas las piezas →</button>';
  } else {
    var m = _sugerenciaMaleu();
    if (m.prods.length) {
      tipo = 'maleu';
      var lista = _sugLista(m.grupos);
      html = '<div class="sug-t">¿Le sumás algo más?</div>' +
        '<div class="sug-s">También tenemos ' + lista + '. Va todo en la misma entrega.</div>' +
        m.prods.map(function (p) {
          var porc = (p.chips || []).filter(function (c) { return /^Para /.test(c); })[0];
          /* "Para 3-4 personas" solo en la compu: en el celular el carrito deja
             ~110px para el nombre y el renglon se partia en tres. */
          return _sugFila(p.img, p.nombre, (porc ? '<span class="sug-porc">' + porc + ' · </span>' : '') + '<strong>' + ars(p.precio) + '</strong>',
            'sumarProductoSugerido(\'' + p.id + '\')');
        }).join('') +
        '<button type="button" class="sug-ver" onclick="verDesdeCarrito(\'todo\')">Ver todo lo que tenemos →</button>';
    }
  }
  if (!tipo) { el.innerHTML = ''; el.hidden = true; el.removeAttribute('data-tipo'); return; }
  el.hidden = false;
  el.setAttribute('data-tipo', tipo);
  el.innerHTML = '<div class="sug">' + html + '</div>';
}

/* Por togglePieza, el mismo camino que la grilla: si la pieza ya se vendio,
   lo dice ahi y no se agrega nada. */
function sumarPiezaSugerida(abbr, id) {
  if (piezaCart[id]) { _pintarSugerencia(); return; }
  togglePieza(abbr, id);
  if (piezaCart[id]) {
    _track('sugerencia_carne', { id: abbr, kg: piezaCart[id].kg, value: piezaCart[id].precio, zone: currentZone });
  } else {
    _pintarSugerencia();
  }
}

/* Por addToCart, el mismo camino que "+ Agregar": respeta el tope de la fecha
   y dice si no entro. */
function sumarProductoSugerido(id) {
  var p = PROD_MAP[id];
  if (p && addToCart(String(id))) {
    _track('sugerencia_maleu', { id: p.id, item_name: p.nombre, value: p.precio, zone: currentZone });
  } else {
    _pintarSugerencia();
  }
}

function verDesdeCarrito(que) {
  if ($id('cart-sidebar').classList.contains('open')) toggleCart();
  // Lo mismo que goToForm: dejar terminar la animacion de cierre.
  setTimeout(function () {
    if (que === 'carne') scrollToCat(slugify('Carnes'));
    else scrollToProductos();
  }, 380);
}

/* ¿Este producto se vende por peso? Sale del catalogo, que a su vez lo saca de
   la hoja Productos (col Q). No hay ninguna lista de cortes escrita a mano
   aca: si manana un producto de Maleu pasa a venderse por kilo, entra solo. */
function esPorPeso(p) { return !!(p && p.porPeso); }

/* Cuantas piezas de este corte hay en el carrito, cuantos kilos y cuanta
   plata suman. */
function piezasEnCarrito(abbr) {
  var n = 0, kg = 0, total = 0;
  Object.keys(piezaCart).forEach(function (pid) {
    var it = piezaCart[pid];
    if (it.abbr === abbr && !it.reserva) { n++; kg += it.kg; total += it.precio; }
  });
  return { n: n, kg: kg, total: total };
}

/* Poner o sacar una pieza del carrito. Es un interruptor y no un +/-: la
   pieza es unica, o te la llevas o no. */
function togglePieza(abbr, piezaId) {
  if (_pedirZonaAntes(function () {
        if (!getActiveProducts().some(function (p) { return p.abbr === abbr; })) {
          _noEstaEnEstaZona('La carne'); return;
        }
        togglePieza(abbr, piezaId);
      }, 'carne')) return;
  if (piezaCart[piezaId]) {
    var fuera = piezaCart[piezaId];
    delete piezaCart[piezaId];
    toast('Sacaste ' + fuera.nombre + ' de ' + kgTexto(fuera.kg));
  } else {
    var prod = PRODUCTOS.filter(function (x) { return x.abbr === abbr; })[0];
    var pz = (piezasMap[abbr] || []).filter(function (x) { return x.id === piezaId; })[0];
    /* Si la pieza ya no esta en el inventario es porque el catalogo se
       refresco y alguien se la llevo. Decirlo es mejor que agregar algo que
       no existe. */
    if (!prod || !pz) { toast('⚠️ Esa pieza ya no está disponible', 3000); return; }
    piezaCart[piezaId] = { abbr: abbr, id: prod.id, kg: pz.kg,
                           precio: piezaPrecio(prod, pz.kg), nombre: prod.nombre };
    toast('✓ ' + prod.nombre + ' de ' + kgTexto(pz.kg) + ' agregado');
    _track('add_to_cart', { id: prod.abbr || prod.id, item_name: prod.nombre + ' ' + kgTexto(pz.kg),
                            price: piezaCart[piezaId].precio, zone: currentZone });
  }
  /* updateUI y no updateCart: esa funcion NO EXISTE en este archivo y la
     llame de memoria. Parsea perfecto y revienta recien al tocar la pieza,
     que es el peor momento. updateFormVisibility va con ella — es lo mismo
     que hace modifyCart, que es el camino equivalente para los productos por
     unidad. */
  updateUI();
  updateFormVisibility();
  /* Se repinta SOLO la card del corte y no el catalogo entero: al agregar la
     pieza aparece el resumen, la card crece, y redibujar todo le mueve el
     scroll al que esta eligiendo. */
  _repintarCarne(abbr);
}

/* querySelectorAll y no querySelector: un producto puede estar dibujado dos
   veces (su categoria y "Lo mas pedido"), y las dos copias tienen que decir lo
   mismo. Hoy ningun corte esta destacado, pero el dia que lo este esto ya
   funciona. */
function _repintarCarne(abbr) {
  var prod = PRODUCTOS.filter(function (x) { return x.abbr === abbr; })[0];
  if (!prod) return;
  var cards = document.querySelectorAll('.carne-card[data-id="' + prod.id + '"]');
  if (!cards.length) return;
  var html = carneCardHTML(prod);
  cards.forEach(function (card) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    card.replaceWith(tmp.firstElementChild);
  });
}

/* LA LISTA DE PIEZAS SE DESPLIEGA (11/9/2026).

   El 11/9 a la tarde se probo elegir la carne por rango de peso (no llego a
   publicarse), y esa misma tarde Tadeo y Lucas lo dieron vuelta: "si hacemos
   por rango estariamos
   categorizando por precio y perdiendo plata: cada peso de pieza tiene un
   precio distinto". Vuelven todas las piezas, cada una con su peso y su precio.

   Pero una tanda de 80 kg son 10 a 25 piezas por corte, y en una columna de
   filas de 48px eso tapa el resto del catalogo. Por eso van en una GRILLA de
   botones grandes —como los talles de una tienda de ropa— y, cuando son
   muchas, se ven las primeras seis y un boton despliega el resto. Seis son
   tres filas en el celular (dos columnas) y dos en la compu (tres).

   Se pliega recien desde nueve: esconder una o dos detras de un boton es un
   toque de mas para nada.

   Lo que el cliente ya eligio se ve SIEMPRE, este plegada o no: si elige la de
   1,9 kg con la lista abierta y la cierra, su pieza no puede desaparecer. */
var PZ_A_LA_VISTA = 6;
var PZ_PLEGAR_DESDE = 9;
/* Que cortes estan desplegados. Vive fuera del DOM porque la card se redibuja
   entera al elegir una pieza y con cada refresco del catalogo: guardado en la
   card, cada toque la volveria a plegar. */
var pzDesplegado = {};

function verPiezas(abbr, btn) {
  var abrir = !pzDesplegado[abbr];
  pzDesplegado[abbr] = abrir;
  var cards = [].slice.call(document.querySelectorAll('.carne-card'));
  var idx = btn ? cards.indexOf(btn.closest('.carne-card')) : -1;
  var antes = btn ? btn.getBoundingClientRect().top : null;
  _repintarCarne(abbr);
  /* Al PLEGAR, las piezas que se esconden estan arriba del boton y el boton
     sube: el scroll se corre lo mismo para que quede bajo el dedo. Sin eso,
     con la lista abierta abajo de todo, al cerrarla aparecés en el medio del
     corte siguiente sin saber donde estas. Al desplegar no hace falta: lo
     nuevo aparece justo donde estas mirando. */
  if (!abrir && antes !== null && idx >= 0) {
    var nueva = document.querySelectorAll('.carne-card')[idx];
    var b = nueva && nueva.querySelector('.pz-mas');
    /* El html tiene `scroll-behavior:smooth`, y con eso este scrollBy se
       animaria: el boton se iria de abajo del dedo y volveria medio segundo
       despues. Se apaga para este salto y se devuelve como estaba. */
    if (b) {
      var raiz = document.documentElement, antesSB = raiz.style.scrollBehavior;
      raiz.style.scrollBehavior = 'auto';
      window.scrollBy(0, b.getBoundingClientRect().top - antes);
      raiz.style.scrollBehavior = antesSB;
    }
  }
  if (abrir) _track('ver_piezas', { id: abbr, zone: currentZone });
}

function piezasSubtotal() {
  return Object.keys(piezaCart).reduce(function (s, k) { return s + piezaCart[k].precio; }, 0);
}
function piezasCount() { return Object.keys(piezaCart).length; }

/* Las piezas del carrito, agrupadas por corte y ordenadas de la mas chica a
   la mas grande. Tres colitas sueltas se leen como tres productos distintos,
   y son el mismo corte en tres pedazos.

   Existe como funcion porque este agrupado se dibuja en TRES lados —el
   carrito, el resumen del formulario y el mensaje de WhatsApp— y las tres
   tienen que decir lo mismo. Escrito tres veces, se despega. */
function piezasAgrupadas() {
  var porCorte = {};
  Object.keys(piezaCart).forEach(function (pid) {
    var it = piezaCart[pid];
    (porCorte[it.abbr] = porCorte[it.abbr] || []).push({ pid: pid, kg: it.kg, precio: it.precio, nombre: it.nombre, reserva: !!it.reserva });
  });
  return Object.keys(porCorte).map(function (abbr) {
    var lista = porCorte[abbr].sort(function (a, b) { return a.kg - b.kg; });
    return {
      abbr: abbr,
      nombre: lista[0].nombre,
      lista: lista,
      /* Un corte va con piezas O con reserva, nunca las dos (ver LA RESERVA DE
         CARNE POR KILO): con una reserva, el grupo es esa reserva. */
      reserva: lista.some(function (x) { return x.reserva; }),
      kg: lista.reduce(function (t, x) { return t + x.kg; }, 0),
      total: lista.reduce(function (t, x) { return t + x.precio; }, 0)
    };
  });
}

/* Traer el inventario del backend: `piezas_full`, el equivalente publico de
   `stock_full`. (`action=carnePiezas` NO sirve: pide token de sesion y la
   tienda no tiene.) Devuelve true solo si llego un inventario de verdad: es lo
   que decide si se puede conciliar el carrito contra el. */
function fetchPiezas() {
  return fetch(APPS_SCRIPT_URL + '?action=piezas_full&t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      /* Se pide FORMA, no que la respuesta exista: un {ok:false, err:"..."}
         tiene claves y pasaria un chequeo de "vino algo". Es el mismo error
         que en el ERP vacio la tabla de precios entera. */
      if (!d || typeof d !== 'object' || d.ok === false) { _piezasFallo(); return false; }
      var r = _piezasLimpiar(d);
      piezasMap = r.mapa;
      /* `_reserva` es un objeto y no un array: _piezasLimpiar ya lo salta. */
      reservaInfo = _reservaLimpiar(d._reserva);
      /* 'vacio' y no 'sin-datos': el backend CONTESTO y dijo que no queda
         ninguna pieza. Es un dato, y la tienda lo muestra ("Sin stock"). Un
         fallo de red es otra cosa y queda en 'sin-datos' (_piezasFallo). */
      piezasEstado = r.hubo ? 'ok' : 'vacio';
      _piezasGuardarCopia(r.mapa, r.hubo, reservaInfo);
      return true;
    })
    .catch(function () { _piezasFallo(); return false; });
}

/* Del crudo que manda el backend (o de la copia guardada) a lo que dibuja la
   tienda: sin piezas rotas, y cada corte ordenado. Es UNA funcion porque la
   usan los dos caminos: si la copia se limpiara distinto que la respuesta, la
   primera pintada y la segunda dirian cosas distintas. */
function _piezasLimpiar(d) {
  var mapa = {}, hubo = 0;
  Object.keys(d || {}).forEach(function (abbr) {
    var lista = d[abbr];
    if (!Array.isArray(lista)) return;
    var ok = lista.filter(function (pz) {
      return pz && pz.id && Number(pz.kg) > 0;
    }).map(_piezaDeRespuesta);
    ok.sort(_piezaOrden);
    if (ok.length) { mapa[abbr] = ok; hubo += ok.length; }
  });
  return { mapa: mapa, hubo: hubo };
}

/* LA COPIA DE LA ULTIMA VISITA (11/9/2026).

   `piezas_full` tarda ~4 s, como cualquier consulta a Apps Script, y sin copia
   la categoria Carnes aparecia recien ahi: tercera en el catalogo, empujando
   para abajo todo lo que ya estabas mirando. Con la copia se dibuja al
   instante y se corrige sola cuando llega la de ahora. Si en ese rato elegiste
   una pieza que ya se vendio, _piezasConciliarCarrito te la saca y te lo dice.

   Vence a las 12 horas: la de la semana pasada son piezas que ya no existen, y
   mostrarlas aunque sea unos segundos es prometer carne que no hay. */
var PIEZAS_COPIA = 'maleu_piezas_v1';
var PIEZAS_COPIA_MS = 12 * 3600 * 1000;
function _piezasGuardarCopia(mapa, hubo, reserva) {
  try {
    if (hubo || reserva) localStorage.setItem(PIEZAS_COPIA, JSON.stringify({ t: Date.now(), m: mapa, r: reserva || null }));
    else localStorage.removeItem(PIEZAS_COPIA);
  } catch (e) { /* sin lugar o bloqueado: se pide igual, solo tarda mas */ }
}
function _piezasLeerCopia() {
  try {
    var c = JSON.parse(localStorage.getItem(PIEZAS_COPIA) || 'null');
    if (!c || typeof c.m !== 'object' || !(Date.now() - Number(c.t) < PIEZAS_COPIA_MS)) return;
    var r = _piezasLimpiar(c.m), res = _reservaLimpiar(c.r);
    if (!r.hubo && !res) return;
    piezasMap = r.mapa;
    reservaInfo = res;
    piezasEstado = r.hubo ? 'ok' : 'vacio';
  } catch (e) { /* una copia rota se ignora: se espera la de ahora */ }
}

/* Si llega el inventario de ahora y una pieza del carrito ya no esta, es que
   se la llevo otro cliente: se saca y se dice. Sin esto el pedido saldria con
   una pieza que no existe, y habria que resolverlo a mano despues de cobrado.

   No se toca con un pedido en camino: ese carrito ya se mando, y la pieza que
   "desaparece" es la suya, que el backend acaba de marcar como vendida. */
function _piezasConciliarCarrito() {
  if (_enviando) return [];
  var hay = {};
  Object.keys(piezasMap).forEach(function (a) {
    piezasMap[a].forEach(function (pz) { hay[pz.id] = true; });
  });
  var fuera = [];
  Object.keys(piezaCart).forEach(function (pid) {
    if (esReservaPid(pid)) return;   // no es una pieza: _reservasConciliarCarrito
    if (!hay[pid]) { fuera.push(piezaCart[pid]); delete piezaCart[pid]; }
  });
  return fuera;
}

/* De cada pieza se toma el id y el peso, y nada mas.

   Del 11/9/2026 a la tarde el backend manda ademas `v` (la pieza es de la
   tanda anterior) y `of` (su % de oferta), y durante unas horas la tienda puso
   esas primero y con el precio tachado. Tadeo lo dio de baja el mismo dia:
   "te cancelo la idea del descuento a carne antigua. Pone todo en orden, de
   menor a mayor". Si el backend los sigue mandando, se ignoran: el precio de
   una pieza es su peso por el kilo, y su lugar en la lista, su peso. */
function _piezaDeRespuesta(pz) {
  return { id: String(pz.id), kg: Number(pz.kg) };
}

/* De la mas chica a la mas grande: el que compra carne casi siempre busca
   "una de kilo y medio", y ordenadas se encuentra de un vistazo. A igual peso
   decide el id, para que dos piezas iguales no se crucen en cada refresco. */
function _piezaOrden(a, b) {
  return (a.kg - b.kg) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/* Que piezas hay, en una linea. Sirve para saber si el inventario cambio
   sin comparar objeto por objeto.

   Arranca diciendo si el inventario es CONOCIDO: de "cargando" a "el backend
   dijo que no hay ninguna" las piezas son las mismas (ninguna), pero la
   pantalla cambia — aparecen los cortes con "Sin stock". Sin esa marca, la
   firma no cambiaba y el catalogo no se repintaba nunca. */
function _piezasFirma() {
  /* Con la reserva adentro: si cambian los kilos que quedan, los cortes que
     se reservan tienen que repintarse aunque las piezas sean las mismas. */
  return (_carneConocida() ? 'k' : 'u') + '#' + Object.keys(piezasMap).sort().map(function (a) {
    return a + ':' + piezasMap[a].map(function (pz) { return pz.id + '@' + pz.kg; }).join(',');
  }).join('|') + '#R' + (reservaInfo ? JSON.stringify(reservaInfo) : '');
}

/* Un refresco que falla NO borra lo que ya sabemos.

   Solo la primera consulta puede concluir "no hay datos". Despues, si ya
   habia piezas —o si el backend ya habia dicho que no quedaba ninguna—, se
   deja: un corte de red de un segundo no puede dejar al cliente con cinco
   cortes que dicen "Cargando..." y no se pueden comprar, ni hacer
   desaparecer un "Sin stock" que era cierto.
   Es la misma regla de siempre — no saber no es lo mismo que no hay. */
function _piezasFallo() {
  if (Object.keys(piezasMap).length || piezasEstado === 'vacio') return;   // ya sabemos: se queda
  piezasEstado = 'sin-datos';
}

/* ── LA RESERVA DE CARNE POR KILO (17/9/2026) ──
   Lucas, en la reunion del 17/9: "la carne me entra los viernes, y en la
   pagina solo figura el stock que tenemos. Me gustaria que el cliente pueda
   reservar: no un peso exacto, cierta cantidad de kilos". Y el porque: "la
   gente hace el super para el asado con tiempo; si no, van a ver que hay solo
   entraña y se van a ir".

   Un corte SIN piezas y con carne en camino ofrece "Reservar": el cliente
   elige kilos y el pedido entra A CONFIRMAR. Cuando llega la carne, Lucas le
   asigna las piezas que mas se acercan, las pesa ("Pesar la carne" en el ERP)
   y le confirma el peso y el precio.

   El dato es `piezas_full._reserva` = { llega:'aaaa-mm-dd', cortes:{abbr:kg} }:
   los kilos que quedan para reservar de la compra que Lucas cargo como
   "Pedida". El tope (un % de lo pedido) y lo ya reservado los calcula el ERP.
   Sin esa clave no se ofrece nada, que es el estado de siempre.

   Lo que garantiza la tienda (contrato con Backend, 17/9/2026):
   · un corte va con piezas O con reserva, nunca los dos: la hoja tiene UNA
     columna de kilos por corte, y Lucas no sabria que parte pesar;
   · solo se ofrece para cortes sin piezas: el que tiene piezas se elige pieza
     por pieza, como siempre;
   · la entrega es el dia que llega o uno posterior;
   · desde 1 kg y de a medio kilo: una pieza envasada pesa de 1 a 2 kg y no se
     corta.

   En el carrito vive adentro de `piezaCart`, con la clave "R:<abbr>" y
   `reserva:true`. Asi el total, el 10% en efectivo, los cupones, el pixel y el
   ultimo pedido la cuentan sin tocarlos: es carne con precio estimado. Lo que
   cambia es como se DICE (reserva, aprox.) y lo que viaja al ERP (sin piezas,
   con reserva:true). */
var RES_MIN = 1, RES_PASO = 0.5;
function _resClave(abbr) { return 'R:' + abbr; }
function esReservaPid(pid) { return String(pid).indexOf('R:') === 0; }
function reservaEnCarrito(abbr) { return piezaCart[_resClave(abbr)] || null; }
function hayReservaEnCarrito() { return Object.keys(piezaCart).some(esReservaPid); }
function _corteDe(abbr) { return PRODUCTOS.filter(function (x) { return x.abbr === abbr; })[0]; }
/* LA MINIATURA DEL CARRITO (23/9/2026)

   Cada renglon mostraba el `emoji` del producto: una pizza 🍕 para las tres
   pizzas, un 🥩 para los cinco cortes. O sea que en el carrito los productos
   se veian todos iguales — y la foto de verdad la teniamos ahi al lado, es la
   misma que se ve en la card del catalogo.

   Mostrar la foto es lo que hace cualquier tienda, y ademas resuelve algo
   practico: al revisar el pedido antes de confirmarlo, el cliente reconoce lo
   que eligio de un vistazo en vez de leer tres nombres parecidos.

   El emoji queda de respaldo por si algun dia entra un producto sin foto. */
function _miniCarrito(o) {
  if (o && o.img) {
    return '<img class="cart-item-thumb" src="' + fotoUrl(o.img) + '" alt="" loading="lazy" ' +
           'width="46" height="46" onerror="this.classList.add(\'sin-foto\')">';
  }
  return '<span class="cart-item-emoji">' + ((o && o.emoji) || '') + '</span>';
}

/* "1,5 kg" y "2 kg": en una reserva los gramos no existen. */
function _kgCorto(kg) { return String(Math.round((Number(kg) || 0) * 1000) / 1000).replace('.', ',') + ' kg'; }

/* Del crudo del backend (o de la copia) a algo usable: fecha valida, kilos de a
   medio y solo cortes que la tienda vende por peso. Cualquier otra cosa es null
   y no se ofrece nada: mejor sin reserva que con una inventada. */
function _reservaLimpiar(r) {
  if (!r || typeof r !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(r.llega || ''))) return null;
  var cortes = {}, hay = false;
  Object.keys(r.cortes || {}).forEach(function (abbr) {
    var kg = Math.floor((Number(r.cortes[abbr]) || 0) / RES_PASO) * RES_PASO;
    if (esPorPeso(_corteDe(abbr)) && kg >= RES_MIN) { cortes[abbr] = kg; hay = true; }
  });
  return hay ? { llega: String(r.llega), cortes: cortes } : null;
}

/* Desde que dia se puede entregar: el que dice el ERP, u hoy si la compra
   viene atrasada (el viernes paso y todavia no se cargaron las piezas). */
function reservaLlega() {
  if (!reservaInfo) return '';
  var hoy = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  return reservaInfo.llega > hoy ? reservaInfo.llega : hoy;
}
/* Cuantos kilos se pueden reservar de este corte: 0 si tiene piezas (esas se
   eligen una por una) o si no viene en la compra. */
function reservaMaxKg(p) {
  if (!esPorPeso(p) || !reservaInfo || !carneAgotada(p)) return 0;
  return reservaInfo.cortes[p.abbr] || 0;
}
/* La primera fecha que el calendario ofrece desde que llega la carne. Sale de
   la MISMA funcion que arma el calendario: no puede ofrecer un dia que no
   existe. null = no hay dia para entregarla, y entonces no se reserva. */
function _reservaPrimeraFecha() {
  var llega = reservaLlega();
  if (!llega || !currentZone) return null;
  var g = _getNextDeliveryDatesGrouped(currentZone);
  var todas = g.thisWeek.concat(g.nextWeek, g.later);
  for (var i = 0; i < todas.length; i++) if (todas[i].iso >= llega) return todas[i];
  return null;
}
function reservable(p) { return reservaMaxKg(p) >= RES_MIN && !!_reservaPrimeraFecha(); }
/* ¿La fecha elegida sirve? Sin fecha, o con "Cualquier dia", si: la del
   formulario se controla al mandar el pedido. */
function _fechaSirveReserva(iso) { return !iso || iso === 'any' || iso >= reservaLlega(); }
function _fechaElegidaParaReserva() { return selectedDateIsFlexible ? null : selectedDeliveryDate; }

/* Sumar o sacar medio kilo. Desde cero, el primer toque pone el minimo. */
function cambiarReserva(abbr, delta) {
  /* LA OCTAVA PUERTA (23/9/2026). El dia que la tienda paso a preguntar la zona
     en el primer "+ Agregar" se cerraron siete puertas al carrito; esta rama
     venia de antes y traia una octava que ese dia no existia. Sin la puerta,
     alguien reserva kilos sin haber dicho de donde es y el pedido se va a la
     hoja equivocada — o peor, a una zona que ni vende carne.

     Al retomar se chequea que el corte exista EN LA ZONA elegida: `_corteDe`
     mira PRODUCTOS, que en Clubes no es el catalogo, asi que sin este chequeo
     se podia reservar carne en una zona que no la vende. */
  if (_pedirZonaAntes(function () {
        if (!getActiveProducts().some(function (x) { return x.abbr === abbr; })) {
          _noEstaEnEstaZona('La carne'); return;
        }
        cambiarReserva(abbr, delta);
      }, 'reserva')) return;
  var p = _corteDe(abbr);
  if (!p) return;
  var it = reservaEnCarrito(abbr), max = reservaMaxKg(p);
  if (delta > 0 && !it) {
    if (max < RES_MIN) { toast('⚠️ Ya no quedan kilos de ' + p.nombre + ' para reservar', 3500); _repintarCarne(abbr); return; }
    if (!_fechaSirveReserva(_fechaElegidaParaReserva())) { reservarParaOtraFecha(abbr); return; }
  }
  var kg = it ? Math.round((it.kg + delta) / RES_PASO) * RES_PASO : (delta > 0 ? RES_MIN : 0);
  if (kg < RES_MIN) kg = 0;
  if (kg > max) {
    kg = max;
    if (max >= RES_MIN) toast('Es todo lo que queda para reservar de ' + p.nombre + ': ' + _kgCorto(max), 3500);
  }
  if (kg <= 0) {
    delete piezaCart[_resClave(abbr)];
    if (it) toast('Sacaste la reserva de ' + p.nombre);
  } else {
    piezaCart[_resClave(abbr)] = { abbr: abbr, id: p.id, kg: kg, precio: piezaPrecio(p, kg), nombre: p.nombre, reserva: true };
    if (!it) {
      toast('✓ Reservaste ' + _kgCorto(kg) + ' de ' + p.nombre + ' · te confirmamos el peso cuando llegue', 4000);
      _track('add_to_cart', { id: p.abbr, item_name: p.nombre + ' reserva ' + _kgCorto(kg),
                              price: piezaCart[_resClave(abbr)].precio, zone: currentZone });
      if (typeof gtag === 'function') gtag('event', 'reserva_carne', { id: p.abbr, kg: kg, llega: reservaInfo ? reservaInfo.llega : '', zone: currentZone });
    }
  }
  updateUI();
  updateFormVisibility();
  _repintarCarne(abbr);
}

/* La fecha elegida es antes de que llegue: se pregunta con la MISMA hoja que
   "Pedir para el vie 18", porque tambien mueve la entrega de todo el pedido. */
function reservarParaOtraFecha(abbr, yaPregunto) {
  var p = _corteDe(abbr), f = _reservaPrimeraFecha();
  if (!p || !f) { toast('⚠️ Ya no se puede reservar ' + (p ? p.nombre : 'ese corte'), 3000); return; }
  if (!yaPregunto) {
    _preguntarOtraFecha({ nombre: p.nombre, img: p.img, f: f, id: p.id,
                          seguir: function () { reservarParaOtraFecha(abbr, true); } });
    return;
  }
  var antes = selectedDeliveryDate;
  setDeliveryDate(f.iso, f.dayName, { sinScroll: true });
  cambiarReserva(abbr, RES_PASO);
  if (reservaEnCarrito(abbr)) {
    /* El aviso va DESPUES: el de "Reservaste" pisaria el cambio de fecha. */
    toast('✓ Reservaste ' + _kgCorto(RES_MIN) + ' de ' + p.nombre + ' · tu entrega ' +
          (f.isTomorrow ? 'ahora es mañana' : 'pasó al ' + _diaYFecha(f.iso)), 4500);
    if (typeof gtag === 'function') gtag('event', 'fecha_por_stock', { id: p.id, item_name: p.nombre, desde: antes, hasta: f.iso, zone: currentZone, reserva: 1 });
  }
}

/* Si la fecha pasa a un dia en que la carne todavia no llego, la reserva sale
   y se dice. Y los cortes se repintan: su boton depende de la fecha. */
function _reservasSegunFecha() {
  var sel = _fechaElegidaParaReserva(), fuera = 0;
  if (sel && !_fechaSirveReserva(sel)) {
    Object.keys(piezaCart).forEach(function (pid) { if (esReservaPid(pid)) { delete piezaCart[pid]; fuera++; } });
  }
  if (reservaInfo) Object.keys(reservaInfo.cortes).forEach(_repintarCarne);
  if (fuera) {
    updateUI();
    updateFormVisibility();
    toast('⚠️ La carne reservada llega ' + _paraCuando(reservaLlega()) + ': para ' + _paraCuando(sel) +
          ' no la podemos llevar, así que salió de tu carrito', 5000);
  }
}

/* Llego el inventario de ahora: una reserva que ya no entra se saca o se
   achica, y se dice. Pasa en tres casos — llego la carne (ahora hay piezas y
   se elige pieza por pieza), otros reservaron lo que quedaba, o el proveedor
   no trajo ese corte y Lucas lo saco de la compra. Con un pedido en camino no
   se toca, igual que las piezas. Devuelve los avisos. */
function _reservasConciliarCarrito() {
  if (_enviando) return [];
  var avisos = [];
  Object.keys(piezaCart).forEach(function (pid) {
    if (!esReservaPid(pid)) return;
    var it = piezaCart[pid], p = _corteDe(it.abbr), max = reservaMaxKg(p);
    if (!p || max < RES_MIN || !_reservaPrimeraFecha()) {
      delete piezaCart[pid];
      avisos.push(p && !carneAgotada(p)
        ? 'Llegó la carne: tu reserva de ' + it.nombre + ' salió del carrito y ahora podés elegir tu pieza'
        : 'Ya no se puede reservar ' + it.nombre + ' y salió de tu carrito');
    } else if (it.kg > max) {
      it.kg = max;
      it.precio = piezaPrecio(p, max);
      avisos.push('De ' + it.nombre + ' quedan ' + _kgCorto(max) + ' para reservar: ajustamos tu reserva');
    }
  });
  return avisos;
}

/* El cuerpo de la card de un corte que se reserva. */
function _reservaCuerpoHTML(p) {
  var it = reservaEnCarrito(p.abbr), max = reservaMaxKg(p);
  var h = '<div class="res-caja">' +
    '<div class="res-t">Llega ' + _paraCuando(reservaLlega()) + '</div>' +
    '<p class="res-s">Reservá los kilos que quieras. Cuando llegue te armamos las piezas que más se acerquen y te confirmamos el peso y el precio.</p>';
  if (it) {
    h += '<div class="res-pie">' +
        '<div class="card-qty-controls">' +
          '<button class="card-qty-btn remove" type="button" aria-label="Medio kilo menos" onclick="cambiarReserva(\'' + p.abbr + '\',-' + RES_PASO + ')">−</button>' +
          '<span class="card-qty-val res-kg">' + _kgCorto(it.kg) + '</span>' +
          '<button class="card-qty-btn" type="button" aria-label="Medio kilo más" onclick="cambiarReserva(\'' + p.abbr + '\',' + RES_PASO + ')"' + (it.kg >= max ? ' disabled' : '') + '>+</button>' +
        '</div>' +
        '<span class="res-aprox">aprox. <strong>' + ars(it.precio) + '</strong></span>' +
      '</div>' +
      (it.kg >= max ? '<p class="res-tope">Es todo lo que queda para reservar.</p>' : '');
  } else if (!_fechaSirveReserva(_fechaElegidaParaReserva())) {
    h += '<button class="add-btn add-btn-otra-fecha res-btn" type="button" onclick="reservarParaOtraFecha(\'' + p.abbr + '\')">' +
      'Reservar para ' + _fechaCorta(_reservaPrimeraFecha()) + '</button>';
  } else {
    h += '<button class="add-btn res-btn" type="button" onclick="cambiarReserva(\'' + p.abbr + '\',' + RES_PASO + ')">' +
      'Reservar ' + _kgCorto(RES_MIN) + ' · aprox. ' + ars(piezaPrecio(p, RES_MIN)) + '</button>';
  }
  return h + '</div>';
}

/* ¿Hay algo de carne para comprar? */
function hayPiezas() {
  return piezasEstado === 'ok' && Object.keys(piezasMap).length > 0;
}

/* ¿Sabemos que hay de carne? Sí si el backend contesto, con piezas ('ok') o
   sin ninguna ('vacio'). Decide si los cortes se dibujan. */
function _carneConocida() {
  return piezasEstado === 'ok' || piezasEstado === 'vacio';
}

/* Un corte sin ninguna pieza en el inventario. Mira el INVENTARIO y no las
   piezas libres: si el cliente tiene en su carrito la ultima, el corte no esta
   agotado para el — tiene que seguir a la vista con su pieza tildada. */
function carneAgotada(p) {
  return esPorPeso(p) && !(piezasMap[p.abbr] || []).length;
}

/* ¿SE MUESTRA UN CORTE QUE NO TIENE PIEZAS? (24/9/2026)

   Tadeo, unas horas antes de la ruleta: "queda feo que diga sin stock, yo los
   sacaria por el momento, y que solo aparezcan los productos de carne que ya
   tenemos las piezas confirmadas". Ese dia Caco no habia traido entrana, lomo
   ni picaña, asi que de cinco cortes habia dos: la seccion se leia como una
   carniceria vacia justo cuando entraba gente nueva por el evento.

   Es lo contrario de lo que el mismo pidio el 11/9 —"si bien ya no hay algunos
   gustos, estaria bueno que avisemos"—, y las dos veces tenia razon, porque el
   caso no era el mismo. UN corte agotado entre cuatro que estan es un aviso
   util: "hoy no hay entrana, vuelvo". TRES agotados de cinco no avisan nada,
   nada mas muestran lo que falta.

   Por eso la regla no es "no mostrar nunca" ni "mostrar siempre", sino ESTA:
   un corte sin piezas se esconde MIENTRAS HAYA OTRO CORTE CON PIEZAS. La
   vidriera se llena con lo que hay.

   Y si no hay NINGUNA pieza de ningun corte, se muestran todos con "Sin
   stock", que es el comportamiento del 11/9. No es una excepcion caprichosa:
   sin eso la categoria Carnes desapareceria entera del catalogo, de los chips
   y del buscador, y eso si se lee como "aca no venden carne" — que es
   exactamente lo que ese cambio vino a evitar.

   NO HACE FALTA ACORDARSE DE NADA. El dia que entren piezas de los tres que
   faltan, aparecen solos; el dia que se acabe todo, vuelven los cinco avisando.
   No hay interruptor que quede prendido de mas. */
function _corteSeMuestra(p) {
  if (!esPorPeso(p)) return true;
  if (!_carneConocida()) return false;          // no sabemos: no se dibuja
  if (!carneAgotada(p)) return true;            // tiene piezas: va
  /* UN CORTE QUE SE PUEDE RESERVAR NO ESTA AGOTADO: hay carne en camino y se
     vende hoy. Esconderlo apagaria la reserva entera cada vez que otro corte
     tenga piezas — o sea casi siempre, que es justo cuando sirve. Lo agarro
     `verificar-reserva.js` apenas se escribio la regla de arriba. */
  if (reservaMaxKg(p) > 0) return true;
  return !hayPiezas();                          // agotado de verdad: solo si no hay de NADA
}

function productsSubtotal() {
  return Object.entries(cart).reduce(function(s, e) { const p = PROD_MAP[e[0]]; return s + (p ? p.precio * e[1] : 0); }, 0);
}
function combosSubtotal() {
  return Object.values(comboCart).reduce((s, inst) => { const c = COMBO_MAP[inst.comboId]; return s + (c ? c.precio * inst.qty : 0); }, 0);
}
/* ¿Hay al menos un combo en el carrito? Si hay, se inhabilitan TODOS los
   descuentos del pedido (10% efectivo y cupones): el combo ya es precio
   cerrado promocional y no acumula con nada. */
function combosInCart() { return Object.keys(comboCart).length > 0; }

/* LA BASE DEL DESCUENTO AUTOMATICO (el 10% en efectivo).

   Hasta el 11/9/2026 habia otro: 10% por superar $100.000. Lo dio de baja
   Tadeo: "saquemos el 10% off superando los $100.000 porque con la carne ahora
   es muy facil". Con dos piezas de lomo ya se pasa el umbral, y el descuento
   se comia el margen de la carne entero (ver abajo). Los descuentos puntuales
   se arman a mano desde el AUTOPEDIDO del ERP.

   Productos sueltos + carne. Los combos NO: son precio cerrado promocional y
   no acumulan con nada.

   La carne SI, por decision de Tadeo del 10/9/2026: "el 10% en efectivo es
   para cualquier compra de Maleu. incluyendo carne". Se lo plantee al reves
   —con el 10% puesto la entrana pasa de 11,8% a 2,0% de margen y el lomo de
   13,6% a 4,0%, medido contra los costos de la hoja Productos— y lo
   reafirmo. Queda escrito por si alguna vez se revisan los margenes de la
   carne: el numero esta, la decision es comercial.

   Existe como funcion y no repetida en cada lugar porque son SEIS los que la
   miran (el descuento, su etiqueta, el incentivo del carrito, el hint de
   pago y las dos barras de promo). Con seis copias, cambiar la regla una vez
   mas significaria acordarse de seis. */
function descontableSubtotal() { return productsSubtotal() + piezasSubtotal(); }

/* ── ZONAS ── */
const ZONAS = {
  /* 14/9/2026: Estancias del Río volvió a esta zona (desde el 10/8 estaba en
     "Otra zona de Pilar"). Tadeo: "son los 2 barrios a atacar, son muy
     parecidos y deberían ir juntos". Mismos días, envío gratis y el 10% en
     efectivo; el pedido va a la hoja Home con el barrio "Estancias del Río". */
  estancias: {
    nombre: "Estancias del Pilar y Estancias del Río",
    envio: 0,
    canal: "Home",
    horarios: { "Lunes":"18 a 19 hs", "Miércoles":"19 a 21 hs", "Viernes":"19 a 21 hs", "Sábado":"19 a 21 hs", "Domingo":"11 a 13 hs" },
    deliveryText: "Entregas: Lun · Mié · Vie · Sáb · Dom",
    schedule: "Lunes 18 a 19hs · Miércoles, Viernes y Sábado 19 a 21hs · Domingo 11 a 13hs",
    showStock: false
  },
  pilar: {
    nombre: "Pilar y Alrededores",
    envio: 5000,
    canal: "Pilar",
    // 06/07/26: se había sacado el miércoles (solo viernes). 14/9/2026: vuelve
    // el miércoles para lo que entrega Maleu ("Otra zona de Pilar"). Los
    // barrios con vendedor siguen solo el viernes: el vendedor reparte ese día,
    // y un pedido suyo es "a pedido" (entra en la orden del jueves), así que un
    // miércoles no habría con qué armarlo. Lo decide _pilarEntregaMaleu.
    horarios: { "Miércoles":"A coordinar", "Viernes":"A coordinar" },
    deliveryText: "Entregas: miércoles y viernes · Para el viernes, pedidos hasta el jueves 12 hs",
    deliveryTextVendedor: "Entregas: viernes durante el día · Pedidos hasta el jueves 12 hs",
    showStock: false
  },
  clubes: {
    nombre: "Clubes Deportivos",
    envio: 0,
    canal: "Clubes",
    horarios: { "Viernes":"Horario a coordinar" },
    deliveryText: "Entrega los viernes en la puerta del club · Pedidos hasta el jueves 12 hs",
    showStock: false
  }
};

const WA_NUMBER = "5491155038905";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmrG5YVSshcYezk8lXFx_uxb7NFGcb9EfTXc7dsIN4rZyj73CET4mk_aKPFPDY2wNi/exec";
// Meses del cumpleaños — definido arriba para que initCumpleBlock() (llamado en el init) lo tenga listo.
var CUMPLE_MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const STOCK_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOq210U9LeSxvXbx_sdglHS0K9DZP8H_5pGXC-WwlMo8AE4UacIN0bpagQqAr79XeJNQ1Nm1eql271/pub?gid=792614962&single=true&output=csv';

/* ── AJUSTES ESPECIALES POR SEMANA ──
   Feriados que se BLOQUEAN del calendario (no hay entrega ese día).
   Entregas EXTRA agregadas puntualmente (días que normalmente no se
   entregan pero que esta semana sí). Después de la fecha pasada se
   ignoran solas.

   Semana del 28/04 al 03/05/2026:
   - Jue 30/04: entrega Home extra 19-21hs. Como Vie 01/05 es feriado
     (Día del Trabajador), la gente con casa de fin de semana llega el
     Jue y conviene tener delivery ese día. El Vie 01/05 SÍ se entrega
     normal — es feriado pero buen momento de ventas. */
const FERIADOS_BLOQUEADOS = {
  // Vacío — no hay días bloqueados esta semana
};
const ENTREGAS_EXTRA = {
  estancias: [
    { iso: '2026-04-30', dayName: 'Jueves', timeRange: '19 a 21 hs' }
  ]
};
/* Stock estricto extendido: entregas Home dentro de esta ventana topan
   al stock real aunque la fecha esté a >24hs. Pensado para semanas con
   feriado donde no se puede reponer al proveedor. Después del timestamp
   se desactiva sola. */
const STOCK_ESTRICTO_HASTA_MS = {
  estancias: Date.UTC(2026, 4, 4, 3, 0, 0) // Lun 04/05 00:00 AR = 03:00 UTC
};

/* ── RESTRICCIONES TEMPORALES ──
   Pilar y Alrededores: del 29/04 hasta el Domingo 03/05/2026 inclusive.
   Durante esa ventana, los pedidos de Pilar deben (a) topar al stock
   real del depósito y (b) solo aceptar barrios cubiertos por vendedores
   Red activos (hoy: Marcos Bottcher en El Lucero / Los Tacos). Vuelve
   automáticamente a la normalidad el Lunes 04/05 (en realidad la zona
   se reabre el Mié 06/05 que es el próximo día de entrega Pilar).
   Vencido el timestamp, la restricción se desactiva sola sin tocar nada. */
const PILAR_RESTRICCION_HASTA_MS = Date.UTC(2026, 4, 4, 2, 59, 59); // Dom 03/05 23:59:59 AR = Lun 04/05 02:59:59 UTC
function isPilarRestricted() {
  if (currentZone !== 'pilar') return false;
  return Date.now() < PILAR_RESTRICCION_HASTA_MS;
}

/* Cutoff del Viernes de esta semana para Pilar.
   - Marcos (barrio Red): Jue 13:00 → Marcos necesita el pedido el Jue tarde
     para repartirlo en Garín el Vie.
   - Otro barrio: Jue 21:00 → Tadeo va el Vie a la mañana al proveedor a
     buscar y reparte el Vie a la noche.
   Si no se eligió barrio aún (caso modal de bienvenida), usamos el cutoff
   más permisivo (Otro = Jue 21:00) para no ocultar de más. El day-picker
   del checkout, una vez elegido el barrio, vuelve a evaluar.

   Devuelve true si HOY ya pasó el cutoff aplicable y el Vie de esta semana
   debe quedar oculto. */
function _isFridayCutoffPast() {
  // Desde 12/05/2026 ambos cutoffs (Red y no-Red) están alineados al cierre
  // de OC con proveedor: Jueves 12:00 hs AR. Después de ese momento, el Vie
  // de esta semana ya no es ofrecible.
  var nowAR = new Date(Date.now() - 3 * 3600 * 1000);
  var arDow = nowAR.getUTCDay(); // 0=Dom..6=Sáb
  var arHour = nowAR.getUTCHours();
  return (arDow === 4 && arHour >= 12) || arDow === 5 || arDow === 6;
}
/* Zonas cuyo reparto sale del recorrido del viernes y por lo tanto dependen
   del cierre de OC del jueves 12hs: Pilar y Clubes. Estancias no entra — tiene
   entregas cinco días por semana y se abastece distinto.
   14/08/26: Clubes se sumó acá. Antes no tenía cutoff de ningún tipo, así que
   un club podía pedir el viernes a la tarde para ese mismo viernes y había que
   sacar mercadería del depósito para cubrirlo. */
function _zonaDependeDelCutoffViernes(zone) {
  return zone === 'pilar' || zone === 'clubes';
}
/* ¿Esta fecha ISO es el viernes de ESTA semana y el cutoff ya pasó? Sirve para
   descartar una fecha ya elegida (guardada en localStorage) que dejó de ser
   ofrecible mientras el cliente no estaba mirando. */
function _fechaBloqueadaPorCutoff(zone, iso) {
  if (!iso || iso === 'any') return false;
  if (!_zonaDependeDelCutoffViernes(zone)) return false;
  if (!_isFridayCutoffPast()) return false;
  var nowAR = new Date(Date.now() - 3 * 3600 * 1000);
  var today = new Date(Date.UTC(nowAR.getUTCFullYear(), nowAR.getUTCMonth(), nowAR.getUTCDate()));
  var diffToMonday = (today.getUTCDay() + 6) % 7;
  var viernes = new Date(today);
  viernes.setUTCDate(today.getUTCDate() - diffToMonday + 4);
  return iso === viernes.toISOString().slice(0, 10);
}

/* ── ESTADO ── */
let cart = {};
let comboCart = {}; // { [signature]: { comboId, qty, comp, picks } } — instancias configuradas
/* Las piezas de carne elegidas. Cada una es UNICA: no hay cantidad, esta o no
   esta. { "PZ-0012": {abbr, id, kg, precio, nombre} } */
let piezaCart = {};
/* El inventario que manda el backend: { "CCo": [{id, kg}, ...] }, ya ordenado. */
let piezasMap = {};
/* 'cargando' | 'ok' | 'sin-datos'. Se mira para no afirmar que algo no hay
   cuando en realidad todavia no lo sabemos — no saber no es lo mismo que no
   hay, y decirlo al reves es la forma mas facil de perder una venta. */
let piezasEstado = 'cargando';
/* Lo que se puede RESERVAR de la carne que esta en camino: { llega, cortes:
   {abbr: kg} } o null. Ver LA RESERVA DE CARNE POR KILO. Va antes de leer la
   copia porque la copia tambien la trae. */
let reservaInfo = null;
_piezasLeerCopia();
/* El observer que resalta el chip de la categoria que estas mirando. Vive
   afuera para poder desconectar el anterior en cada repintado. */
let _catObserver = null;
let currentZone = null; // 'estancias' | 'pilar' | 'clubes'
let stockMap = {};            // stock físico actual (lo que hay en el depósito)
let stockProyectadoMap = {};  // físico + Σ cantidad OC "Pedido" pendientes
let vendedoresRed = []; // {nombre, wa, barrios:[], partido, localidad}
let barrioToVendedor = {}; // { 'El Lucero': {nombre, wa, partido, localidad}, ... }
let _enviando = false;
let selectedDeliveryDate = null;     // ISO "YYYY-MM-DD"
let selectedDeliveryDayName = null;  // "Lunes" | "Miércoles" | etc.
let selectedDateIsFlexible = false;  // true cuando el cliente elige "Cualquier día"
let selectedPilarZona = null;        // zona canonical elegida en paso 2 (ej: 'Ayres y alrededores')
let selectedPilarZonaName = null;
let selectedPilarBarrio = null;      // sub-barrio elegido en paso 3 (ej: 'Ayres del Pilar', '__otro__')
let selectedPilarBarrioName = null;

/* Lista de barrios que se muestran en el paso 2 del modal de bienvenida
   cuando el cliente eligió Pilar y Alrededores. Los marcados isRed son
   los de vendedores Red (Marcos) y entran en flujo "a pedido". El resto
   se comporta como Home: tope al stock real si la fecha está cerca. */
// Rediseño 13/07/2026: 4 ZONAS grandes (antes 7 barrios sueltos + Otro).
// Cada zona = 1 vendedor Red (o Tadeo para "Otra zona"). Los sub-barrios se
// listan como texto informativo dentro de la card, pero el valor que va al
// backend es el nombre de la zona (que también está en Sheets Vendedores col
// "Barrios" para que el routing barrioToVendedor haga match). Escalable: si
// suma otro vendedor, se agrega una card.
const BARRIOS_PILAR_MODAL = [
  {
    val: 'Tortugas y alrededores',
    nombre: 'Tortugas y alrededores',
    isRed: true, badge: 'Marcos',
    subBarrios: 'El Lucero · Los Tacos · Villa Bertha · Azzurra',
    subBarriosList: ['El Lucero', 'Los Tacos', 'Villa Bertha', 'Azzurra']
  },
  {
    val: 'Ayres y alrededores',
    nombre: 'Ayres y alrededores',
    isRed: true, badge: 'Fini',
    subBarrios: 'Ayres del Pilar · La Lomada · Los Lagartos · Highland',
    subBarriosList: ['Ayres del Pilar', 'La Lomada', 'Los Lagartos', 'Highland']
  },
  {
    val: 'Manzanares',
    nombre: 'Manzanares',
    isRed: true, badge: 'Rufo',
    subBarrios: 'San Francisco · La Escondida · Manzanares Chico · Cerrillos · CUBA Fátima',
    subBarriosList: ['San Francisco', 'La Escondida', 'Manzanares Chico', 'Cerrillos', 'CUBA Fátima']
  },
  {
    val: '__otro__',
    nombre: 'Otra zona de Pilar',
    isRed: false, isOther: true, badge: 'Maleu',
    // 10/08/26: Los Alcanfores y Estancias del Río se mudaron acá desde la zona
    // Estancias. 14/9/2026: Estancias del Río volvió a Estancias; Los
    // Alcanfores se queda. Esta zona la entrega Maleu: miércoles y viernes.
    subBarrios: 'Los Alcanfores · Pilara · El Ocho · Otros',
    subBarriosList: ['Los Alcanfores', 'Pilara', 'El Ocho']  // '__otro__' se agrega dinámico para el input libre
  }
];

/* Barrios que hasta el 10/08/2026 eran zona Estancias (canal Home) y pasaron
   a "Otra zona de Pilar". Cambian los días de entrega (ahora solo viernes),
   pero por decisión comercial NO pierden los dos beneficios que tenían como
   Home: envío gratis y 10% OFF en efectivo. Por eso getShipping() y
   cashDiscountActive() los tratan como excepción dentro de la zona Pilar.
   14/9/2026: Estancias del Río volvió a la zona Estancias, así que queda uno. */
const BARRIOS_EX_HOME = ['Los Alcanfores'];
function _pilarBarrioEsExHome() {
  if (currentZone !== 'pilar') return false;
  // Mismo criterio que _pilarBarrioIsRed(): el dropdown puede estar vacío si
  // renderPilarBarrios() todavía no corrió, así que caemos al estado JS.
  var sel = $id('f-pilar-barrio');
  var val = (sel && sel.value) || selectedPilarBarrio || '';
  return BARRIOS_EX_HOME.indexOf(val) !== -1;
}

/* Devuelve la ZONA canonical actualmente elegida (o null si no hay).
   Soporta que selectedPilarBarrio sea la zona (Ayres y alrededores) O un
   sub-barrio (Ayres del Pilar) — para el segundo caso resuelve la zona vía
   barrioToVendedor.zonaCanon (que se llena desde Sheets Vendedores). */
function _getPilarZonaActual() {
  var candidato = selectedPilarZona || selectedPilarBarrio;
  if (!candidato) return null;
  var i;
  for (i = 0; i < BARRIOS_PILAR_MODAL.length; i++) {
    if (BARRIOS_PILAR_MODAL[i].val === candidato) return BARRIOS_PILAR_MODAL[i];
  }
  // Retro-compat: si es un sub-barrio viejo, resolvemos vía barrioToVendedor.
  var v = barrioToVendedor[String(candidato).toLowerCase()];
  if (v && v.zonaCanon) {
    for (i = 0; i < BARRIOS_PILAR_MODAL.length; i++) {
      if (BARRIOS_PILAR_MODAL[i].val === v.zonaCanon) return BARRIOS_PILAR_MODAL[i];
    }
  }
  return null;
}

/* ¿Este pedido de Pilar lo entrega MALEU, y no un vendedor? (14/9/2026)
   Decide dos cosas que van juntas: el miércoles (los vendedores reparten solo
   el viernes) y la carne (sus pedidos van a la hoja Red, que no tiene columnas
   para ella).

   Mira la ZONA elegida en el modal y no solo el barrio: `_pilarBarrioIsRed`
   reconoce un barrio de vendedor recién cuando llega la lista de vendedores de
   la planilla, y mientras tanto diria "no es de vendedor" y ofreceria carne y
   miércoles a un cliente de Fini. Sin zona elegida, no: ante la duda, lo que
   no se le puede prometer a nadie. */
function _pilarEntregaMaleu() {
  if (currentZone !== 'pilar') return false;
  /* Al cliente que trajimos nosotros lo entregamos nosotros, viva donde viva
     (24/9/2026). Hasta hoy el unico caso era "Otra zona de Pilar", y por eso
     esta funcion exigia `isOther`: con esa condicion sola, el de Manzanares que
     entra por la ruleta salia de la hoja Red —bien— pero se quedaba con los
     viernes del vendedor y sin carne, que es media promesa. */
  if (_esNuestro()) return true;
  var z = _getPilarZonaActual();
  if (!z || !z.isOther) return false;
  return !_pilarBarrioIsRed();
}

/* Hook para ocultar una zona/barrio temporalmente (feriados, arranque de un
   vendedor nuevo, etc.). Actualmente no hay ninguno oculto (Fini arrancó
   13/07/26 con Ayres y alrededores). Para volver a usar, retornar true
   cuando corresponda. */
function _barrioOculto(val) {
  return false;
}

/* Tope estricto de stock — depende de la fecha de entrega elegida.
   Solo aplica en zona Estancias (Pilar y Clubes nunca tienen tope).

   Regla: si la fecha elegida está a <24hs del horario más temprano de
   entrega de ese día, no hay tiempo de reponer vía OC al proveedor.
   Por lo tanto, el cliente solo puede pedir lo que hay en el freezer.

   Si la fecha es a más de 24hs → modo abierto con info (puede pedir
   cualquier cantidad porque hay margen de reposición).

   Si elige "Cualquier día" o no eligió fecha → modo abierto con info
   también (asumimos que es flexible). */
/* Devuelve el modo de stock a aplicar según zona, barrio y fecha de
   entrega elegida. Tres valores:
     - 'ilimitado': sin tope, cliente pide lo que quiera.
     - 'proyectado': tope = físico + lo que viene en camino (OC "Pedido").
     - 'real': tope = stock físico actual.
   Regla operativa: Tadeo cierra OC con proveedor Jue 12hs AR. Lo que el
   cliente pida para entregas posteriores al próximo Vie depende de si
   alcanzó esa OC (antes Jue 12hs → ilimitado) o ya no (después → proyectado).

   Sin argumento mira la fecha elegida. Con una fecha ISO contesta "¿cómo sería
   si eligiera ESTA?" — lo usa el botón "Pedir para el vie 18" de una card sin
   stock (13/9/2026). Es la misma función y no una copia a propósito: el ERP la
   saca de este archivo (`probar-stock-modo.js`) y la compara con la de la tab
   «+». Llamada sin argumento se comporta exactamente igual que antes. */
function getStockMode(isoFecha) {
  var conFecha = isoFecha !== undefined;
  var fecha = conFecha ? isoFecha : selectedDeliveryDate;
  // Clubes y Pilar Red siempre ilimitado (el calendario los bloquea por
  // cutoff si la fecha no aplica; el stock en sí no tiene tope).
  if (currentZone === 'clubes') return 'ilimitado';
  if (currentZone === 'pilar' && _pilarBarrioIsRed()) return 'ilimitado';
  // Restricción Pilar temporal (29/4 - 3/5/2026, ya vencida). Compat.
  if (isPilarRestricted()) {
    if (!conFecha && selectedDateIsFlexible) return 'real';
    if (!fecha) return 'real';
    var pms = _deliveryStartMs(fecha);
    if (pms && pms < PILAR_RESTRICCION_HASTA_MS) return 'real';
    return 'ilimitado';
  }
  if (currentZone !== 'estancias' && currentZone !== 'pilar') return 'ilimitado';
  if (!conFecha && selectedDateIsFlexible && !selectedDeliveryDate) return 'ilimitado';
  if (!fecha) return 'ilimitado';
  var deliveryDay = _isoToUTCMidnightMs(fecha);
  if (deliveryDay == null) return 'ilimitado';
  var todayDay = _todayARMidnightMs();
  if (deliveryDay < todayDay) return 'real';
  var todayDow = new Date(todayDay).getUTCDay();
  var daysToFriday = (5 - todayDow + 7) % 7;
  var proximoVie = todayDay + daysToFriday * 86400000;
  var siguienteVie = proximoVie + 7 * 86400000;
  if (deliveryDay < proximoVie) return 'real';
  if (deliveryDay >= siguienteVie) return 'ilimitado';
  // Entrega entre próximo_vie y siguiente_vie: depende del cutoff_OC.
  // cutoff_OC = Jue anterior 12hs AR = Jue 00:00 UTC + 15hs.
  var cutoffOC = proximoVie - 86400000 + 15 * 3600 * 1000;
  return Date.now() < cutoffOC ? 'ilimitado' : 'proyectado';
}
function _todayARMidnightMs() {
  var nowAR = new Date(Date.now() - 3 * 3600 * 1000);
  return Date.UTC(nowAR.getUTCFullYear(), nowAR.getUTCMonth(), nowAR.getUTCDate());
}
function _isoToUTCMidnightMs(iso) {
  if (!iso) return null;
  var p = iso.split('-'); if (p.length !== 3) return null;
  return Date.UTC(+p[0], +p[1] - 1, +p[2]);
}
function isStockLimited() {
  var m = getStockMode();
  return m === 'real' || m === 'proyectado';
}
/* True si la fecha de entrega ISO cae ANTES del próximo Viernes
   (incluyendo hoy si aún no es Vie). Regla operativa: tope al stock real
   para entregas anteriores al próximo Vie; modo abierto desde el Vie en
   adelante. Cumple los casos de Home y Pilar no-Red:
     Hoy Mar 12 → Mié 13 = stock (antes del Vie 15), Vie 15 = ilimitado.
     Hoy Dom 9  → Lun 10 = stock (antes del Vie 14), Mié 12 = stock,
                  Vie 14 = ilimitado.
   Si hoy es Vie, el "próximo Vie" es hoy mismo → todas las entregas
   futuras (incl. la de hoy) caen como ilimitado.
   Si hoy es Sáb, el "próximo Vie" es +6 días → entregas Dom/Lun/Mar/Mié/Jue
   intermedios quedan como stock. */
function _isDeliveryBeforeNextFriday(iso) {
  if (!iso) return false;
  var parts = iso.split('-'); if (parts.length !== 3) return false;
  var nowAR = new Date(Date.now() - 3 * 3600 * 1000);
  var today = new Date(Date.UTC(nowAR.getUTCFullYear(), nowAR.getUTCMonth(), nowAR.getUTCDate()));
  var d = Date.UTC(+parts[0], +parts[1] - 1, +parts[2]);
  if (d < today.getTime()) return false;
  var todayDow = today.getUTCDay(); // 0=Dom..6=Sáb
  // Distancia al próximo Vie (5 = Vie). Si hoy es Vie, daysToFriday=0.
  var daysToFriday = (5 - todayDow + 7) % 7;
  var fridayMs = today.getTime() + daysToFriday * 86400000;
  return d < fridayMs;
}
/* Devuelve true si el barrio elegido en Pilar pertenece a un vendedor Red
   (hoy Marcos: El Lucero / Los Tacos / Villa Bertha). Si todavía no eligió
   barrio, devuelve false (no-Red por default → más estricto). */
/* ═══════════════════════════════════════════════════════════════════
   EL CLIENTE QUE TRAJIMOS NOSOTROS (24/9/2026)

   Tadeo, despues de la mesa de Grupo Matriz y con la ruleta de Los Robles al
   dia siguiente: "si una persona de Manzanares [el barrio de Rufo] entra por
   la ruleta, le va a dirigir el pedido a Rufino, y eso esta mal, porque Rufino
   no hizo nada para conseguir este cliente. A los 3 vendedores les pagamos lo
   que les pagamos porque ellos se mueven para conseguir clientes".

   Hasta hoy la tienda ruteaba por GEOGRAFIA: barrio con vendedor -> hoja Red,
   y el vendedor cobra su 17% mas los $3.000 del envio. Da igual quien haya
   conseguido al cliente. Ahora la tienda rutea por QUIEN LO TRAJO, que es lo
   que se esta pagando.

   Un cliente es "nuestro" cuando llego por un canal de Maleu:
     · giro la ruleta y tiene su cupon `RUL-…`  (el caso de Los Robles);
     · o entro por un link nuestro con `?r=lucas|tadeo|joaco` — el mismo
       parametro que ya usan los QR de la ruleta (`o` = de donde salio,
       `d` = el lugar, `r` = quien lo consiguio).

   Y se queda guardado: el que compra a la semana siguiente sigue siendo
   nuestro. Es la contracara de lo que se le paga al vendedor — si el cliente
   es suyo lo es siempre, y si es nuestro, tambien.

   EL CORTE VA ACA Y NO EN EL ERP. Se podia cortar en tres lugares: la tienda
   al elegir el canal, el backend al rutear, o la hoja Red al liquidar. Los dos
   ultimos ya escribieron plata y habria que corregirla; este no escribio nada
   todavia. (Verificado con Backend, 24/9/2026.)
   ═══════════════════════════════════════════════════════════════════ */
var ORIGEN_NUESTRO = 'maleu_origen';

/* Guarda de donde vino, una sola vez: el primer canal que lo trajo es el que
   vale. Si vuelve por otro link no le cambiamos el dueño. */
function _guardarOrigenNuestro(o) {
  try {
    if (localStorage.getItem(ORIGEN_NUESTRO)) return;
    localStorage.setItem(ORIGEN_NUESTRO, JSON.stringify(o));
  } catch (e) {}
}
function _origenNuestro() {
  try { return JSON.parse(localStorage.getItem(ORIGEN_NUESTRO) || 'null'); } catch (e) { return null; }
}
function _esNuestro() { return !!_origenNuestro(); }

/* Un link nuestro marca al cliente como nuestro (24/9/2026). Son los mismos
   tres parametros que ya usan los QR de la ruleta:
     o = folleto | colegio | evento | meta   (de donde salio)
     d = el lugar, texto libre               (ej. "Los Robles")
     r = lucas | tadeo | joaco               (quien lo consiguio)
   Alcanza con UNO de los tres. Despues se borran de la barra de direcciones,
   igual que el cupon: el link que el cliente comparta no tiene por que arrastrar
   de donde salio. */
(function () {
  try {
    var p = new URLSearchParams(location.search);
    var o = (p.get('o') || '').trim(), d = (p.get('d') || '').trim(), r = (p.get('r') || '').trim();
    if (o || r) {
      _guardarOrigenNuestro({ o: o || 'link', d: d, r: r, t: Date.now() });
      var u = new URL(location.href);
      ['o', 'd', 'r'].forEach(function (k) { u.searchParams.delete(k); });
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    }
  } catch (e) {}
})();
/* Repinta lo que depende de quien entrega. Hace falta cuando la marca aparece
   DESPUES del arranque, que es el caso del cupon: el backend lo valida por
   fetch, y para entonces el calendario y el catalogo ya estan dibujados con
   los dias del vendedor. No se llama a applyZone(), que vacia el carrito. */
function _repintarPorOrigen() {
  try {
    _updateZoneChip();
    _pintarHeroEntregas();
    if (typeof renderPilarBarrios === 'function' && currentZone === 'pilar') renderPilarBarrios();
    renderDayPicker();
    renderCatalog();
    renderCatNav();
    updateUI();
    updateStockDisplay();
    updatePromoBar();
  } catch (e) {}
}

/* Lo que se le manda al ERP para que sepa quien lo trajo: "ruleta · Los Robles
   · lucas". El cupon `RUL-…` ya viaja aparte y el ERP lo puede cruzar con el
   lead, pero un link con `?r=` no tiene cupon y sin esto no dejaria rastro. */
function _origenNuestroTexto() {
  var o = _origenNuestro(); if (!o) return '';
  return [o.o, o.d, o.r].filter(function (x) { return x; }).join(' · ');
}

function _pilarBarrioIsRed() {
  /* La pregunta que contesta esta funcion es "¿a este pedido lo atiende un
     vendedor?", no "¿este barrio queda en su zona?" — y de eso cuelgan los
     dias de entrega, el envio, el alias al que se transfiere, el tope de stock
     y si se ofrece carne. Para un cliente que trajimos nosotros la respuesta
     es NO, aunque viva en Manzanares.

     Se corta aca, en la raiz, y no en cada uno de los seis lugares que
     preguntan: es la leccion que este repo ya aprendio dos veces (los botones
     muertos del 10/9 y la franja del 10% del 23/9). */
  if (_esNuestro()) return false;
  var sel = $id('f-pilar-barrio');
  // Priorizar selectedPilarBarrio (estado JS) sobre el dropdown — el dropdown
  // puede tener value='' si la option aún no fue cargada por renderPilarBarrios.
  var val = (sel && sel.value) || selectedPilarBarrio || '';
  if (!val || val === '__otro__') return false;
  // Defensa 1: barrioToVendedor cargado desde Sheets (puede no haber llegado todavía).
  if (barrioToVendedor[val.toLowerCase()]) return true;
  // Defensa 2: lista hardcodeada en BARRIOS_PILAR_MODAL (siempre disponible).
  for (var i = 0; i < BARRIOS_PILAR_MODAL.length; i++) {
    if (BARRIOS_PILAR_MODAL[i].val === val && BARRIOS_PILAR_MODAL[i].isRed) return true;
  }
  return false;
}
/* Modo "abierto con info": muestra cartel celeste "Hoy hay N en stock ·
   Pedís más para fecha futura". Aplica solo cuando el modo es 'ilimitado'
   en Estancias o Pilar no-Red, y el stock físico es bajo. */
function isStockInfoMode() {
  if (getStockMode() !== 'ilimitado') return false;
  if (currentZone === 'estancias') return true;
  if (currentZone === 'pilar' && !_pilarBarrioIsRed()) return true;
  return false;
}
/* Hora de inicio de entrega (UTC ms) para una fecha ISO dada.
   Lun 18hs · Mié/Vie/Sáb 19hs · Dom 11hs · Pilar 19hs · Clubes 19hs. */
function _deliveryStartMs(iso) {
  if (!iso || iso === 'any') return null;
  var parts = iso.split('-'); if (parts.length !== 3) return null;
  var y = +parts[0], m = +parts[1] - 1, d = +parts[2];
  var date = new Date(Date.UTC(y, m, d));
  var dow = date.getUTCDay(); // 0=Dom..6=Sáb
  var hourAR;
  if (dow === 1) hourAR = 18;        // Lunes 18hs
  else if (dow === 0) hourAR = 11;   // Domingo 11hs
  else hourAR = 19;                   // Mié/Vie/Sáb 19hs (y Pilar/Clubes)
  // AR (UTC-3) → UTC = AR + 3
  date.setUTCHours(hourAR + 3, 0, 0, 0);
  return date.getTime();
}
/* Fin del día calendario AR (00:00 del día siguiente) para una fecha ISO.
   Se usa para decidir si la fecha calendario ya pasó. Mantenemos la fecha
   disponible hasta las 23:59 hs AR de ese mismo día, aunque la ventana de
   entrega haya terminado a las 21hs. */
function _deliveryEndMs(iso) {
  if (!iso || iso === 'any') return null;
  var parts = iso.split('-'); if (parts.length !== 3) return null;
  // 00:00 AR del día siguiente = 03:00 UTC del día siguiente
  var date = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2] + 1));
  date.setUTCHours(3, 0, 0, 0);
  return date.getTime();
}
let _formVisible = false;
const PROD_MAP = {}; PRODUCTOS.forEach(p => PROD_MAP[p.id] = p);
PRODUCTOS_CLUBES.forEach(p => PROD_MAP[p.id] = p);

const PROD_ABBR = {
  5:'PPM', 6:'PPJyQ', 7:'PPCyQ',
  8:'SCo', 9:'SJyQ', 10:'SCa',
  11:'ECaC', 12:'EJyQ', 17:'ECyQ', 18:'EV',
  14:'TG', 15:'TLC', 16:'TC', 13:'F',
  1:'PMa', 2:'PJyQ', 3:'PCC', 4:'PJyM', 19:'PMu',
  20:'SQB', 21:'SL', 22:'SPyP', 23:'SE',
  24:'TP', 25:'TJyQ', 26:'TCa', 27:'TV',
  28:'RC', 29:'RP',
  // Clubes (IDs string)
  'pmu':'PMu', 'pma':'PMa', 'pjq':'PJyQ', 'pcc':'PCC', 'pjm':'PJyM',
  'pp1':'PPM', 'pp2':'PPJyQ', 'pp3':'PPCyQ',
  'ecac':'ECaC', 'ejyq':'EJyQ', 'ecyq':'ECyQ', 'evc':'EV',
};

/* ── HELPERS ── */
function $id(id) { return document.getElementById(id); }
function ars(n) { return '$' + n.toLocaleString('es-AR'); }
function cartTotal() { return productsSubtotal() + combosSubtotal() + piezasSubtotal(); }
function cartCount() { return Object.values(cart).reduce((a,b)=>a+b, 0) + Object.values(comboCart).reduce((a,inst)=>a+(inst.qty||0), 0) + piezasCount(); }

/* ── SALDO A FAVOR DEL CLIENTE (auto-detección por teléfono) ──
   Cuando el cliente termina de escribir el teléfono en el checkout, consultamos
   al backend si tiene saldo a favor de compras anteriores. Si sí, mostramos un
   banner y aplicamos automáticamente como descuento al total.
   El monto aplicado se manda al backend en `saldoAplicado` del postData, y queda
   registrado en hoja Saldos Clientes como "Aplicación" + col BI/BL del pedido. */
var _saldoCliente = { tel: '', saldo: 0, ultimoFetch: 0 };
function getSaldoAFavor() {
  // Aplicar saldo solo si: tenemos saldo>0, hay teléfono válido y hay carrito.
  // No aplicar más que el subtotal (no puede dejar el pedido en negativo).
  if (!_saldoCliente.saldo || _saldoCliente.saldo <= 0) return 0;
  var sub = cartTotal();
  if (sub <= 0) return 0;
  return Math.min(_saldoCliente.saldo, sub);
}
function checkSaldoCliente() {
  try {
    var inp = $id('f-telefono');
    if (!inp) return;
    var tel = String(inp.value || '').replace(/\D/g, '');
    if (tel.length < 8) {
      // No es un teléfono válido todavía — limpiar banner
      _saldoCliente = { tel: '', saldo: 0, ultimoFetch: 0 };
      _toggleSaldoBanner();
      _updateCartTotals();
      return;
    }
    // Cache: no re-fetch si es el mismo número en los últimos 30s
    if (_saldoCliente.tel === tel && (Date.now() - _saldoCliente.ultimoFetch) < 30000) return;
    _saldoCliente.tel = tel;
    _saldoCliente.ultimoFetch = Date.now();
    fetch(APPS_SCRIPT_URL + '?action=saldoCliente&tel=' + encodeURIComponent(tel) + '&t=' + Date.now())
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data && data.ok) {
          _saldoCliente.saldo = Number(data.saldo) || 0;
        } else {
          _saldoCliente.saldo = 0;
        }
        _toggleSaldoBanner();
        _updateCartTotals();
      })
      .catch(function(){ /* silencioso: si falla, simplemente no aplica saldo */ });
  } catch(e) {}
}
function _toggleSaldoBanner() {
  var banner = $id('saldoFavorBanner');
  var monto = $id('saldoFavorMonto');
  if (!banner || !monto) return;
  if (_saldoCliente.saldo > 0) {
    banner.style.display = '';
    monto.textContent = ars(_saldoCliente.saldo);
  } else {
    banner.style.display = 'none';
  }
}
function _updateCartTotals() {
  // Re-render todos los lugares que muestran el total (cart pop, resumen final).
  try { if (typeof updateUI === 'function') updateUI(); } catch(e){}
}
function getShipping() {
  if (!currentZone) return 0;
  // Cupón tipo ENVIO → envío gratis sin importar la zona/barrio.
  if (getCouponShippingOverride()) return 0;
  const z = ZONAS[currentZone];
  // En Pilar:
  //   Red (Marcos: El Lucero / Los Tacos / Villa Bertha / Azzurra): $3.000
  //     El envío queda para el vendedor, no para Maleu (Maleu cobra 83% del
  //     facturado sin envío, así que el envío entero se queda con Marcos).
  //   NO-Red (Pilara, El Ocho, Otro barrio): $5.000 — lo reparte Tadeo.
  if (currentZone === 'pilar') {
    // Ex-Home (Los Alcanfores / Estancias del Río): conservan el envío gratis
    // que tenían cuando eran zona Estancias.
    if (_pilarBarrioEsExHome()) return 0;
    return _pilarBarrioIsRed() ? 3000 : z.envio;
  }
  return z.envio;
}
function pilarIsOtroBarrio() {
  if (currentZone !== 'pilar') return false;
  var el = $id('f-pilar-barrio');
  return !!(el && el.value === '__otro__');
}
// El unico descuento automatico: 10% en efectivo, en Home (Estancias) y en los
// ex-Home de Pilar (Los Alcanfores / Estancias del Río, ver BARRIOS_EX_HOME).
// El de "10% +$100K" (Home y Pilar no-Red) se dio de baja el 11/9/2026: ver
// arriba de descontableSubtotal. Si vuelve, tiene que volver TAMBIEN en la
// salvaguarda de _doPostHome del ERP, que recalcula el descuento de cada pedido
// de la tienda: con una sola de las dos puntas, el cliente ve un total y el ERP
// guarda otro.
function cashDiscountActive() {
  /* Con la zona provisoria no se afirma: el 10% es de Estancias y de los dos
     ex-Home, y en un barrio con vendedor no aplica. Prometerselo a alguien que
     todavia no dijo de donde es seria mentirle a la mitad de los que entran.

     Va ACA y no en la franja de arriba. Por el descuento preguntan tres
     lugares —la franja, el incentivo del carrito y el cartel del medio de
     pago—, y apagar uno solo deja los otros dos prendidos: la primera version
     tapaba la franja en `updatePromoBar` y `updateUI` se la volvia a encender
     dos lineas despues. Es la leccion de siempre de este repo: se arregla en
     la raiz, no en los call sites. (23/9/2026) */
  if (zonaProvisoria) return false;
  if (currentZone === 'estancias') return true;
  // Ex-Home: conservan el 10% en efectivo aunque ahora estén en zona Pilar.
  if (_pilarBarrioEsExHome()) return true;
  return false;
}
function discountsActive() {
  // Hay algun descuento automatico en la zona — decide la promo bar y el
  // incentivo del carrito. Desde el 11/9/2026 es solo el del efectivo.
  return cashDiscountActive();
}

/* ── CUPÓN aplicado ─────────────────────────────────────────
   Estado: appliedCoupon = {codigo, tipo, valor, scope, mensaje, stack}
   o null si no hay cupón.

   Regla por producto: gana el descuento más alto entre cupón y auto
   (el 10% en efectivo). El cupón aplica solo a su scope (todo, cat, prod),
   y el auto aplica solo a lo que NO está cubierto por el cupón. */
let appliedCoupon = null;

function _itemsInCart() {
  var items = Object.entries(cart).map(function(e) {
    const p = PROD_MAP[e[0]]; if (!p) return null;
    return { id: p.id, abbr: PROD_ABBR[p.id] || '', cat: p.cat, precio: p.precio, qty: e[1] };
  }).filter(Boolean);
  /* Cada pieza de carne entra como un item de una unidad, con SU precio (el
     de esa pieza, no el del kilo). Sin esto un cupon que dice "TODO" no
     cubriria la carne y el cliente veria un descuento mas chico del que le
     prometieron — y de paso el 10% automatico se le aplicaria encima al
     pedazo que el cupon no toco. */
  Object.keys(piezaCart).forEach(function (pid) {
    var g = piezaCart[pid];
    items.push({ id: g.id, abbr: g.abbr, cat: 'Carnes', precio: g.precio, qty: 1 });
  });
  return items;
}
function _subtotalForScope(scope) {
  if (!scope) return 0;
  const ix = scope.indexOf(':');
  const key = (ix >= 0 ? scope.substring(0, ix) : scope).trim().toUpperCase();
  const val = ix >= 0 ? scope.substring(ix + 1).trim() : '';
  return _itemsInCart().reduce(function(sum, it) {
    var match = false;
    if (key === 'TODO') match = true;
    else if (key === 'CATEGORIA' && it.cat === val) match = true;
    else if (key === 'PRODUCTO' && it.abbr === val) match = true;
    return sum + (match ? it.precio * it.qty : 0);
  }, 0);
}
/* ¿Vale un cupon en esta zona? (24/9/2026)

   No, cuando el pedido lo atiende un VENDEDOR: esos van a la hoja Red, que va
   sin descuentos, y el ERP los recalcularia igual — el cliente veria un total y
   la planilla guardaria otro.

   Si en Estancias y en lo que entrega Maleu en Pilar. Y ojo con el caso que
   parece una excepcion y no lo es: el cliente que trajimos nosotros por la
   ruleta, aunque viva en el barrio de Rufo, NO lo atiende un vendedor
   —`_pilarBarrioIsRed()` ya devuelve false para el— asi que su premio vale. Que
   las dos reglas cuelguen de la misma funcion es lo que las mantiene de
   acuerdo. */
function cuponValeEnEstaZona() {
  return !(currentZone === 'pilar' && _pilarBarrioIsRed());
}
function getCouponDiscount() {
  if (!appliedCoupon) return 0;
  if (!cuponValeEnEstaZona()) return 0;
  const sub = _subtotalForScope(appliedCoupon.scope);
  if (sub <= 0) return 0;
  if (appliedCoupon.tipo === 'PCT')  return Math.round(sub * (appliedCoupon.valor / 100));
  if (appliedCoupon.tipo === 'ARS')  return Math.min(appliedCoupon.valor, sub);
  return 0;
}
function couponAppliesToAll() {
  // Cupón con scope=TODO cubre toda la base imponible para auto-descuentos
  return appliedCoupon && /^TODO\b/i.test(appliedCoupon.scope || 'TODO');
}

/* CUANTO MAS se ahorra pagando en efectivo — que no siempre es el 10%.

   Con un cupon que NO se suma (`stack:false`) y que cubre todo el carrito, el
   efectivo **no agrega nada**: su base queda en cero. Es el caso del premio de
   la ruleta desde el 24/9/2026 — Tadeo subio el premio de 10% a 15% justamente
   para que NO se sumen, asi el premio siempre vale mas que el descuento que esa
   persona ya tenia, y el techo queda en 15% y no en 25%.

   Existe aparte de `getCashDiscount()` porque hay tres carteles que preguntan
   "¿le conviene pagar en efectivo?" ANTES de que elija como paga, y con la
   cuenta vieja los tres le prometian un 10% que no iba a ver. */
function ahorroPorEfectivo() {
  if (!cashDiscountActive()) return 0;
  // Base = subtotal NO cubierto por el cupón (la parte del cupón ya tiene su descuento).
  // Excepción: si cupón=ENVIO, no afecta base. Si cupón con stack=true, base = subtotal completo.
  const total = descontableSubtotal();
  let base = total;
  if (appliedCoupon && cuponValeEnEstaZona() && appliedCoupon.tipo !== 'ENVIO' && !appliedCoupon.stack) {
    const cubierto = _subtotalForScope(appliedCoupon.scope);
    base = Math.max(0, total - cubierto);
  }
  if (base <= 0) return 0;
  return Math.round(base * 0.10);
}
function getCashDiscount() {
  // El 10% en efectivo, y nada mas: el de "+$100K" se dio de baja el 11/9/2026.
  // La base sale de descontableSubtotal(): productos + carne, sin los combos
  // (precio cerrado, no acumulan). El porque esta escrito arriba de esa funcion.
  const sel = document.querySelector('input[name="pago"]:checked');
  const isCash = sel && sel.value === 'Efectivo';
  if (!isCash) return 0;
  return ahorroPorEfectivo();
}
function getDiscountLabel() {
  const sel = document.querySelector('input[name="pago"]:checked');
  const isCash = sel && sel.value === 'Efectivo';
  // El cupón se muestra en su propia línea; esta es la del automático.
  if (isCash && cashDiscountActive()) return '10% OFF Efectivo';
  return '';
}
function getTotalDiscount() {
  // Total combinado de cupón + auto. Lo usa el shipping bar, el WhatsApp y el total final.
  return getCouponDiscount() + getCashDiscount();
}
function getCouponShippingOverride() {
  // Si cupón=ENVIO, devuelve true para anular el envío
  if (!cuponValeEnEstaZona()) return false;
  return appliedCoupon && appliedCoupon.tipo === 'ENVIO';
}


/* ── UI cupón ─────────────────────────────────────────────── */
function toggleCouponBox() {
  var btn = $id('coupon-toggle'), box = $id('coupon-box');
  var open = box.style.display === 'none';
  box.style.display = open ? '' : 'none';
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) setTimeout(function() { var inp = $id('f-cupon'); if (inp) inp.focus(); }, 50);
}
function _showCouponMsg(txt, cls) {
  var el = $id('coupon-msg'); if (!el) return;
  el.textContent = txt || '';
  el.className = 'coupon-msg' + (cls ? ' ' + cls : '');
}
function applyCoupon() {
  var inp = $id('f-cupon');
  var btn = $id('coupon-apply-btn');
  var code = (inp.value || '').trim().toUpperCase();
  if (!code) { _showCouponMsg('Escribí el código del cupón', 'err'); return; }
  if (code.length < 3) { _showCouponMsg('Código muy corto', 'err'); return; }

  btn.disabled = true; btn.textContent = '...';
  _showCouponMsg('', '');

  var items = _itemsInCart();
  var url = APPS_SCRIPT_URL + '?action=validarCupon&codigo=' + encodeURIComponent(code)
          + '&itemsJson=' + encodeURIComponent(JSON.stringify(items))
          + '&t=' + Date.now();
  fetch(url, { cache: 'no-store' })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      btn.disabled = false; btn.textContent = 'Aplicar';
      if (!d.ok) {
        _showCouponMsg(d.error || 'No pudimos validar el cupón', 'err');
        return;
      }
      appliedCoupon = {
        codigo:  d.codigo,
        tipo:    d.tipo,
        valor:   d.valor,
        scope:   d.scope,
        mensaje: d.mensaje,
        stack:   !!d.stack
      };
      // Cerrar el input y mostrar el card. _renderCouponApplied decide el copy según
      // si el descuento ya se está aplicando o si está pending (sin productos del scope).
      $id('coupon-box').style.display = 'none';
      $id('coupon-toggle').style.display = 'none';
      _renderCouponApplied();
      _track('coupon_applied', { code: d.codigo, scope: d.scope });
      updateUI();
    })
    .catch(function(err) {
      btn.disabled = false; btn.textContent = 'Aplicar';
      _showCouponMsg('Sin conexión. Probá de nuevo.', 'err');
    });
}
function removeCoupon() {
  // Cupones discontinuados (el bloque ya no existe en la tienda). Mantener
  // null-safe: removeCoupon() se sigue llamando en el reset post-envío.
  appliedCoupon = null;
  var ca = $id('coupon-applied'); if (ca) { ca.style.display = 'none'; ca.classList.remove('pending'); }
  var cb = $id('coupon-box'); if (cb) cb.style.display = 'none';
  var ct = $id('coupon-toggle'); if (ct) { ct.style.display = ''; ct.setAttribute('aria-expanded', 'false'); }
  var inp = $id('f-cupon'); if (inp) inp.value = '';
  _showCouponMsg('', '');
  updateUI();
}

/* Render del card del cupón aplicado.
   Estado ACTIVE: hay descuento aplicándose → card verde con monto.
   Estado PENDING: cupón válido pero todavía no agregaron productos del
   scope → card naranja/amarillo invitando a sumar (ej. "agregá un
   sorrentino y se activa el 20% off"). */
function _renderCouponApplied() {
  if (!appliedCoupon) return;
  var card = $id('coupon-applied');
  if (!card) return;
  var disc = getCouponDiscount();
  var codeEl = $id('coupon-applied-code');
  var msgEl  = $id('coupon-applied-msg');

  // Etiqueta linda del scope (ej "CATEGORIA:Sorrentinos" → "Sorrentinos")
  var scopeNice = '';
  if (appliedCoupon.scope) {
    var ix = appliedCoupon.scope.indexOf(':');
    if (ix >= 0) scopeNice = appliedCoupon.scope.substring(ix + 1).trim();
  }

  if (disc > 0) {
    // Activo: descuento aplicándose ahora
    card.classList.remove('pending');
    codeEl.textContent = appliedCoupon.codigo + ' aplicado';
    msgEl.textContent  = appliedCoupon.mensaje || '';
  } else {
    // Pending: el cupón está cargado pero no hay productos del scope
    card.classList.add('pending');
    codeEl.textContent = appliedCoupon.codigo + ' listo para usar';
    if (scopeNice) {
      msgEl.textContent = '¡Adelante! Sumá ' + scopeNice + ' al pedido y activá tu ' +
        (appliedCoupon.tipo === 'PCT' ? appliedCoupon.valor + '% OFF' : 'descuento') + '.';
    } else {
      msgEl.textContent = appliedCoupon.mensaje || '¡Adelante, usalo en tu pedido!';
    }
  }
  card.style.display = '';
}
function slugify(str) {
  return str.toLowerCase().replace(/[áäâà]/g,'a').replace(/[éëêè]/g,'e').replace(/[íïîì]/g,'i').replace(/[óöôò]/g,'o').replace(/[úüûù]/g,'u').replace(/ñ/g,'n').replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

/* ── VENDEDORES RED (Pilar) ── */
function fetchVendedores() {
  fetch(APPS_SCRIPT_URL + '?action=vendedores', { cache: 'no-store' })
    .then(r => r.json())
    .then(d => {
      vendedoresRed = d.vendedores || [];
      barrioToVendedor = {};
      vendedoresRed.forEach(v => {
        // Convención Sheets Vendedores col "Barrios": el PRIMER item es la
        // ZONA canonical ("Tortugas y alrededores", etc.). Los demás son sub-
        // barrios que también matchean para retro-compatibilidad.
        var zonaCanon = (v.barrios || [])[0] || '';
        (v.barrios || []).forEach(b => {
          barrioToVendedor[b.toLowerCase()] = { nombre: v.nombre, wa: v.wa, alias: v.alias || '', partido: v.partido, localidad: v.localidad, barrio: b, zonaCanon: zonaCanon };
        });
      });
      try { localStorage.setItem('maleu_vendedores', JSON.stringify({ ts: Date.now(), vendedores: vendedoresRed })); } catch(e) {}
      renderPilarBarrios();
    })
    .catch(function() {
      // Fallback: usar cache si hay
      try {
        var cached = JSON.parse(localStorage.getItem('maleu_vendedores') || 'null');
        if (cached && cached.vendedores) {
          vendedoresRed = cached.vendedores;
          barrioToVendedor = {};
          vendedoresRed.forEach(v => {
            var zonaCanon = (v.barrios || [])[0] || '';
            (v.barrios || []).forEach(b => {
              barrioToVendedor[b.toLowerCase()] = { nombre: v.nombre, wa: v.wa, alias: v.alias || '', partido: v.partido, localidad: v.localidad, barrio: b, zonaCanon: zonaCanon };
            });
          });
          renderPilarBarrios();
        }
      } catch(e) {}
    });
}
function renderPilarBarrios() {
  var sel = $id('f-pilar-barrio');
  if (!sel) return;
  var restricted = isPilarRestricted();
  var zona = _getPilarZonaActual();
  var curSubBarrio = sel.value || '';

  // Si el cliente todavía no eligió zona en el welcome, dropdown vacío.
  if (!zona) {
    sel.innerHTML = '<option value="">Elegí tu zona primero</option>';
    var info0 = $id('pilar-restriccion-info');
    if (info0) info0.style.display = restricted ? '' : 'none';
    return;
  }

  sel.innerHTML = '<option value="">Elegí tu barrio</option>';
  // Sub-barrios de la zona activa. Estos VALORES matchean 1:1 con Sheets
  // Vendedores col Barrios → barrioToVendedor los usa para el routing al
  // vendedor correcto (Fini para 'Ayres del Pilar', etc.).
  (zona.subBarriosList || []).forEach(function(b) {
    sel.innerHTML += '<option value="' + b + '">' + b + '</option>';
  });
  // 'Otra zona de Pilar' agrega opción "Otro barrio" con input libre para
  // que el cliente escriba la dirección exacta (ej. calle + número).
  if (zona.isOther && !restricted) {
    sel.innerHTML += '<option value="__otro__">Otro barrio (escribo la dirección)</option>';
  }

  // Preservar la selección del cliente si sigue siendo válida en la zona nueva
  if (curSubBarrio && Array.from(sel.options).some(function(o){ return o.value === curSubBarrio; })) {
    sel.value = curSubBarrio;
  }

  var info = $id('pilar-restriccion-info');
  if (info) info.style.display = restricted ? '' : 'none';
}
function onPilarBarrioChange() {
  var val = $id('f-pilar-barrio').value;
  var fieldOtro = $id('field-pilar-otro');
  if (fieldOtro) fieldOtro.style.display = val === '__otro__' ? '' : 'none';
  // Sincronizar con el barrio guardado del modal
  if (val) {
    var match = BARRIOS_PILAR_MODAL.filter(function(b) { return b.val === val; })[0];
    var nombre = match ? match.nombre : val;
    selectedPilarBarrio = val;
    selectedPilarBarrioName = nombre;
    try { localStorage.setItem('maleu_pilar_barrio', JSON.stringify({ val: val, nombre: nombre, ts: Date.now() })); } catch(e) {}
  }
  updatePilarVendedorLabel();
  updatePilarDiasEntrega();
  updatePromoBar();
  _updateZoneChip();
  _pintarHeroEntregas();
  // Sorrentinos bloqueados en Ayres del Pilar, y la carne en los barrios con
  // vendedor: sacarlos del carrito y re-renderizar catálogo + nav (oculta o
  // reaparece la categoría y sus chips según el barrio).
  // renderCatalog() ya repinta el nav y los tiles: no hace falta pedirlo.
  var _sacadas = _purgeCartBloqueados();
  if (typeof _sacadas === 'number' && _sacadas > 0) {
    toast('⚠️ La carne la entregamos nosotros: en los barrios con vendedor no está. ' +
      'Lo que tenías de carne salió de tu carrito', 5000);
  }
  if (typeof renderCatalog === 'function') renderCatalog();
  // Si cambió Red ↔ no-Red, el cap de stock puede cambiar — refrescar
  _ensureCartFitsDate();
  updateStockDisplay();
  updateUI();
  updateShippingBar();
}
// Si el barrio tiene vendedor Red asignado, limitar días de entrega a Viernes
function updatePilarDiasEntrega() {
  if (currentZone !== 'pilar') return;
  // Re-renderiza el calendario con los días habilitados según el vendedor asignado al barrio.
  renderDayPicker();
}
function updatePilarVendedorLabel() {
  var label = $id('pilar-vendedor-label');
  if (!label) return;
  var val = $id('f-pilar-barrio').value;
  var text = '';
  if (val === '__otro__') {
    var otro = ($id('f-direccion') && $id('f-direccion').value || '').trim();
    if (otro) text = 'Te lo entrega Maleu';
  } else if (val) {
    var v = barrioToVendedor[val.toLowerCase()];
    if (v && v.nombre) text = 'El vendedor es ' + v.nombre;
  }
  if (text) { label.textContent = text; label.style.display = ''; }
  else { label.textContent = ''; label.style.display = 'none'; }
  // Si ya eligió método de pago, re-evaluar visibilidad del alias maleump
  if (typeof onPagoChange === 'function') onPagoChange();
}

/* ── ZONA + FECHA (modal de bienvenida) ── */
/* ── EL FONDO SE QUEDA QUIETO ──────────────────────────────────────
   Lo pidio Tadeo el 10/9/2026: "cuando pongo ver pedido... lo que esta atras
   deberia estar estable y fijo, y no se deberia poder scrollear".

   Habia DOS mecanismos conviviendo y solo uno funciona en el iPhone:

   | quien              | usaba                          | frena en iOS |
   | modal de zona      | clase modal-open (html + body) | SI           |
   | carrito, combo,    | body.style.overflow='hidden'   | NO           |
   | envio, menu        |                                |              |

   `overflow:hidden` sobre el body lo IGNORA Safari en iOS — por eso se notaba
   justo en el carrito, que es el que mas se abre. Lo que sirve es la clase,
   que ademas pone `touch-action:none`, o sea que tampoco responde al dedo.

   Lleva la CUENTA DE QUIEN lo pidio, con nombre, y no un contador ni un
   booleano: los paneles se superponen (desde el carrito se va al formulario y
   encima aparece el overlay de envio) y ademas hay cierres que corren sin que
   ese panel estuviera abierto. Con un contador, ese cierre de mas le devolveria
   el scroll al fondo con OTRO panel todavia abierto; con nombres, cerrar dos
   veces el combo no le saca el bloqueo al carrito. */
var _fondoQuietoPor = {};
function _fondoQuieto(quien, bloquear) {
  if (bloquear) _fondoQuietoPor[quien] = true;
  else delete _fondoQuietoPor[quien];
  var on = false;
  for (var k in _fondoQuietoPor) { if (_fondoQuietoPor.hasOwnProperty(k)) { on = true; break; } }
  document.body.classList.toggle('modal-open', on);
  document.documentElement.classList.toggle('modal-open', on);
}

function _setOverlay(show) {
  var ov = $id('loc-overlay');
  if (!ov) return;
  ov.classList.toggle('hidden', !show);
  _fondoQuieto('zona', show);
  if (!show) _catalogoALaVista();
}

/* ═══════════════════════════════════════════════════════════════════
   LA TIENDA ABRE EN EL CATALOGO (23/9/2026)

   Hasta hoy el catalogo arrancaba tapado por el modal: zona, y despues
   fecha. Para alguien de Estancias eran 2 pantallas antes de ver un precio;
   para alguien de Pilar, 4 (zona, zona de Pilar, barrio, fecha). Tadeo,
   mirando entrar a un cliente nuevo: "es bastante dificil el flujo...
   demasiada informacion 'de donde sos', 'cuando queres que te entregue'. Lo
   primero que quieren es ver que vendo y que precios tengo".

   La zona y la fecha son para ENTREGAR, no para MIRAR. Preguntarlas antes
   es pedirle el domicilio a alguien que todavia no entro al local. Ahora:

     entra        -> el catalogo entero, con precios, sin nada encima
     primer "+"   -> una pantalla, tres botones: donde entregamos
     el dia       -> en el formulario, que es donde ya esta decidiendo

   Mientras no elige, la tienda trabaja con una zona PROVISORIA —Estancias,
   el catalogo mas grande y de donde sale la mayor parte de las ventas— que
   NO se guarda en localStorage: el cliente no eligio nada, y guardarla seria
   decidir por el. Todo lo que seria una afirmacion sobre su zona se calla
   hasta que elija: los dias de entrega del hero y la franja del 10% (que en
   un barrio con vendedor no aplica).

   Sin fecha elegida `getStockMode()` devuelve 'ilimitado', asi que el
   catalogo se ve completo y sin carteles de "Sin stock" — que es justo lo
   que vino a ver. El tope real entra cuando elige el dia en el formulario:
   `selectDayPicker` llama a `setDeliveryDate`, y de ahi cuelga
   `_ensureCartFitsDate`, que recorta y lo dice.
   ═══════════════════════════════════════════════════════════════════ */
var ZONA_PROVISORIA = 'estancias';
var zonaProvisoria = false;
var _zonaOrigen = 'entrada';   // de donde salio la pregunta, para medirla
var _zonaPend = null;          // lo que el cliente estaba haciendo cuando se le pregunto

/* La puerta. Devuelve true si FRENO lo que se estaba por hacer — el que la
   llama tiene que cortar ahi —, y corre `seguir` cuando la zona ya quedo
   elegida.

   Va en las funciones que el cliente toca (addToCart, togglePieza, los
   combos) y no adentro de modifyCart: para retomar hay que volver a hacer lo
   MISMO que pidio, y eso solo lo sabe la funcion de arriba. */
function _pedirZonaAntes(seguir, motivo) {
  if (!zonaProvisoria) return false;
  _zonaPend = seguir || null;
  _track('zona_pedida', { motivo: motivo || 'agregar' });
  showZoneModal('agregar');
  return true;
}
/* Un solo lugar cierra el modal con la zona ya completa. Si el cliente venia
   de tocar "+ Agregar" se retoma eso y NO se sube arriba de todo: esta
   mirando ese producto. */
function _cerrarModalZona() {
  _setOverlay(false);
  var seguir = _zonaPend; _zonaPend = null;
  if (seguir) { seguir(); return; }
  window.scrollTo(0, 0);
}
/* El producto puede no existir en la zona recien elegida. Pasa de verdad:
   entra por el catalogo provisorio de Estancias, toca un pack y elige Clubes,
   que tiene otro catalogo. Agregarlo igual meteria en el carrito algo que la
   pantalla no muestra. */
function _enLaZona(id) {
  return getActiveProducts().some(function (p) { return String(p.id) === String(id); });
}
function _noEstaEnEstaZona(nombre) {
  var z = ZONAS[currentZone];
  toast('⚠️ ' + (nombre || 'Eso') + ' no lo tenemos en ' + ((z && z.nombre) || 'esta zona'), 4000);
}
/* El cartel de arriba del catalogo, mientras la zona sea provisoria. */
function _updateZonaCta() {
  var cta = $id('zona-cta'); if (!cta) return;
  cta.hidden = !zonaProvisoria;
}
/* "Entro al catalogo", una vez por visita. Antes esto lo marcaba
   `select_zone`, porque elegir zona ERA entrar. Ahora se entra sin elegir
   nada, asi que el momento es otro y el evento tambien — si no, el publico de
   remarketing de Meta se quedaria solo con los que eligieron zona, y el
   denominador para medir este cambio no existiria. */
var _vioCatalogo = false;
function _catalogoALaVista() {
  if (_vioCatalogo) return;
  _vioCatalogo = true;
  _track('ver_catalogo', { zone: currentZone, provisoria: zonaProvisoria ? 1 : 0 });
}

function setZone(zone) {
  currentZone = zone;
  zonaProvisoria = false;
  localStorage.setItem('maleu_zone', zone);
  _track('select_zone', { zone: zone, origen: _zonaOrigen });
  applyZone();
  // Clubes: la entrega es siempre Viernes "a coordinar" en la puerta del
  // club, no tiene sentido preguntar fecha. Se setea automáticamente.
  if (zone === 'clubes') {
    _setClubesDefaultDate();
    _cerrarModalZona();
    return;
  }
  // Pilar: cuando el cliente elige Pilar EXPLÍCITAMENTE desde el modal,
  // siempre mostrar el paso barrio (puede que quiera cambiarlo). El skip
  // del paso barrio solo aplica en el INIT cuando ya entra con zona+barrio
  // guardados y NO está pasando por el modal de zona.
  if (zone === 'pilar') {
    welcomeShowBarrioStep();
    return;
  }
  /* El paso de fecha ya no es parte de la entrada (23/9/2026). Si el cliente
     tenia una fecha guardada y vigente se respeta; si no, entra sin fecha —el
     catalogo se ve entero— y el dia lo elige en el formulario o desde el
     chip 📅. */
  if (!_loadSavedDate()) _olvidarFecha();
  _cerrarModalZona();
}
function welcomeShowBarrioStep() {
  _hideAllSteps();
  var step = $id('loc-step-barrio');
  if (step) step.style.display = '';
  renderWelcomeBarrioGrid();
}
function welcomeBackFromDate() {
  /* Botón "← Volver" del paso fecha. Desde el 23/9/2026 a ese paso se llega
     SOLO desde el chip 📅, asi que volver es cerrar: mandarlo a reelegir zona
     y barrio —que es lo que hacia— seria devolverle el interrogatorio que
     este cambio vino a sacar. */
  _setOverlay(false);
}
function renderWelcomeBarrioGrid() {
  var grid = $id('loc-barrios-grid');
  if (!grid) return;
  grid.innerHTML = BARRIOS_PILAR_MODAL.filter(function(b){ return !_barrioOculto(b.val); }).map(function(b) {
    var classes = ['loc-zona-card'];
    if (b.isRed) classes.push('is-red');
    if (b.isOther) classes.push('is-other');
    // Badge del vendedor: solo el nombre. La "Otra zona" la entrega Maleu y usa
    // estilo naranja. En la tienda no se nombra a Tadeo (13/9/2026): es una marca.
    var badgeCls = 'loc-zona-vendedor' + (b.isOther ? ' is-maleu' : '');
    var badge = '<span class="' + badgeCls + '">' + (b.badge || '') + '</span>';
    var subBarrios = b.subBarrios ? '<span class="loc-zona-sub">' + b.subBarrios + '</span>' : '';
    // Escapo comillas simples del nombre para el onclick
    var valEsc = b.val.replace(/'/g, "\\'");
    var nombreEsc = b.nombre.replace(/'/g, "\\'");
    return '<button type="button" class="' + classes.join(' ') + '"'
         + ' onclick="setPilarBarrio(\'' + valEsc + '\',\'' + nombreEsc + '\')">'
         + '<div class="loc-zona-head">'
         +   '<span class="loc-zona-name">' + _ico('pin') + b.nombre + '</span>'
         +   badge
         + '</div>'
         + subBarrios
         + '</button>';
  }).join('');
}
/* Paso 2 del welcome: el cliente eligió una ZONA canonical (Tortugas /
   Ayres / Manzanares / Otra). Guardamos la zona y avanzamos al paso 3
   (sub-barrio) — no vamos directo a fecha porque ahora el cliente debe
   elegir su barrio específico dentro de la zona. */
function setPilarBarrio(val, nombre) {
  selectedPilarZona = val;
  selectedPilarZonaName = nombre;
  try {
    localStorage.setItem('maleu_pilar_zona', JSON.stringify({
      val: val, nombre: nombre, ts: Date.now()
    }));
  } catch(e) {}
  // Refresca el dropdown del form (los sub-barrios de la zona nueva).
  if (typeof renderPilarBarrios === 'function') renderPilarBarrios();
  _updateZoneChip();
  welcomeShowSubBarrioStep();
}

/* Paso 3 del welcome: el cliente eligió el sub-barrio dentro de la zona.
   Con eso la zona esta completa y se cierra: desde el 23/9/2026 no hay paso
   de fecha atras. */
function setPilarSubBarrio(val, nombre) {
  selectedPilarBarrio = val;
  selectedPilarBarrioName = nombre || val;
  try {
    localStorage.setItem('maleu_pilar_barrio', JSON.stringify({
      val: val, nombre: nombre || val, ts: Date.now()
    }));
  } catch(e) {}
  var sel = $id('f-pilar-barrio');
  if (sel) {
    sel.value = val;
    if (typeof onPilarBarrioChange === 'function') onPilarBarrioChange();
  }
  _updateZoneChip();
  if (!_loadSavedDate()) _olvidarFecha();
  _cerrarModalZona();
}

/* Muestra el paso 3 (sub-barrio) con las cards individuales de la zona
   elegida. Se llama desde setPilarBarrio (avance normal) o desde el
   botón "← Cambiar barrio" del paso fecha si el cliente vuelve. */
function welcomeShowSubBarrioStep() {
  _hideAllSteps();
  var step = $id('loc-step-subbarrio');
  if (step) step.style.display = '';
  renderWelcomeSubBarrioGrid();
}

function renderWelcomeSubBarrioGrid() {
  var grid = $id('loc-subbarrios-grid');
  if (!grid) return;
  var zona = _getPilarZonaActual();
  if (!zona) { grid.innerHTML = ''; return; }
  var subs = (zona.subBarriosList || []).slice();
  // 'Otra zona': agregamos "Otro barrio" con input libre (mismo comportamiento
  // que en el dropdown del form).
  var cards = subs.map(function(nombre) {
    var valEsc = nombre.replace(/'/g, "\\'");
    var nombreEsc = nombre.replace(/'/g, "\\'");
    return '<button type="button" class="loc-zona-card is-simple"'
         + ' onclick="setPilarSubBarrio(\'' + valEsc + '\',\'' + nombreEsc + '\')">'
         +   '<span class="loc-zona-name">' + _ico('pin') + nombre + '</span>'
         + '</button>';
  });
  if (zona.isOther) {
    cards.push(
      '<button type="button" class="loc-zona-card is-simple is-other"'
    + ' onclick="setPilarSubBarrio(\'__otro__\',\'Otro barrio\')">'
    +   '<span class="loc-zona-name">' + _ico('pin') + 'Otro barrio</span>'
    +   '<span class="loc-zona-sub">Escribís la dirección al confirmar</span>'
    + '</button>'
    );
  }
  grid.innerHTML = cards.join('');
}

function _loadSavedPilarZona() {
  try {
    var raw = JSON.parse(localStorage.getItem('maleu_pilar_zona') || 'null');
    if (!raw || !raw.val) return false;
    selectedPilarZona = raw.val;
    selectedPilarZonaName = raw.nombre || '';
    return true;
  } catch(e) { return false; }
}
function _loadSavedPilarBarrio() {
  try {
    var raw = JSON.parse(localStorage.getItem('maleu_pilar_barrio') || 'null');
    if (!raw || !raw.val) return false;
    selectedPilarBarrio = raw.val;
    selectedPilarBarrioName = raw.nombre || '';
    var sel = $id('f-pilar-barrio');
    if (sel) {
      sel.value = raw.val;
      if (typeof onPilarBarrioChange === 'function') onPilarBarrioChange();
    }
    _updateZoneChip();
    return true;
  } catch(e) { return false; }
}
function _setClubesDefaultDate() {
  // Próximo Viernes (a coordinar). Marcamos como flexible para que no
  // muestre el chip "📅 Fecha" y para que el stock siempre sea abierto.
  var fri = _getNextDeliveryOf('clubes', 'Viernes');
  selectedDateIsFlexible = true;
  if (fri) {
    selectedDeliveryDate = fri.iso;
    selectedDeliveryDayName = fri.dayName;
  }
  try {
    localStorage.setItem('maleu_delivery_date', JSON.stringify({
      iso: selectedDeliveryDate, dayName: selectedDeliveryDayName,
      flexible: true, zone: 'clubes', ts: Date.now()
    }));
  } catch(e) {}
  _updateDateChip();
  _preselectDayPicker();
}
function showZoneModal(origen) {
  // Reabrir desde el chip "📍", desde el cartel del catalogo, o porque el
  // cliente toco "+ Agregar" sin haber elegido zona todavia.
  _zonaOrigen = origen || 'chip';
  welcomeShowZoneStep();
  _setOverlay(true);
}
function showDateModal() {
  // Reabrir desde el chip "📅 Fecha". En Clubes no aplica (Vie en cancha).
  if (currentZone === 'clubes') return;
  welcomeShowDateStep();
  _setOverlay(true);
}
function welcomeBackToZone() {
  welcomeShowZoneStep();
}
function _hideAllSteps() {
  var ids = ['loc-step-zone', 'loc-step-barrio', 'loc-step-subbarrio', 'loc-step-date'];
  ids.forEach(function(id) { var el = $id(id); if (el) el.style.display = 'none'; });
}
function welcomeShowZoneStep() {
  _hideAllSteps();
  $id('loc-step-zone').style.display = '';
}
/* Aviso contextual del cutoff, para las zonas que dependen del recorrido del
   viernes (Pilar y Clubes).

   Por qué existe: el cliente frecuente entra con zona y fecha ya guardadas, así
   que este cartel es el único lugar donde nos lee cómo funciona el recorrido. Y
   lo que necesita saber cambia según el día — el reparto es el viernes y los
   pedidos cierran el jueves 12hs (mismo cutoff que _isFridayCutoffPast, el que
   además esconde el viernes del calendario).

   Dónde se muestra: en Pilar, en el paso "¿para cuándo?" del modal. En Clubes
   NO hay paso de fecha (la fecha se asigna sola en _setClubesDefaultDate), así
   que va en el hero, que es lo primero que ven al entrar.

   Devuelve null en Estancias, que no depende de este cutoff. */
/* Sin emoji adelante (23/9/2026). Cada uno viaja con su `tone` —info,
   urgente, entregando— y el tono es el que pinta el cartel de naranja, de
   amarillo o de verde. El ⏰ 📦 📅 🚚 repetia en simbolo lo que el color ya
   decia, y cuatro emojis distintos en cuatro variantes del mismo cartel se
   leen como cuatro avisos distintos. */
function _cutoffNote(zone) {
  zone = zone || currentZone;
  if (!_zonaDependeDelCutoffViernes(zone)) return null;
  var esClub = zone === 'clubes';
  var donde = esClub ? 'en la puerta del club' : 'en Pilar y Alrededores';
  var nowAR = new Date(Date.now() - 3 * 3600 * 1000);
  var dow = nowAR.getUTCDay();      // 0=Dom .. 6=Sáb
  var hour = nowAR.getUTCHours();
  /* Las fechas van escritas (13/9/2026). Hasta ese día el sábado y el domingo
     decían "los pedidos de este viernes ya cerraron" — y un domingo "este
     viernes" es el que viene, que cierra recién el jueves. El cliente leía que
     había llegado tarde a un recorrido que estaba abierto. */
  var hoyMs = Date.UTC(nowAR.getUTCFullYear(), nowAR.getUTCMonth(), nowAR.getUTCDate());
  var dm = function (ms) { var d = new Date(ms); return d.getUTCDate() + '/' + (d.getUTCMonth() + 1); };
  var proxVieMs = hoyMs + ((5 - dow + 7) % 7) * 86400000;   // si hoy es viernes, hoy
  var cierraJue = dm(proxVieMs - 86400000);
  /* Lo que entrega Maleu en Pilar tiene también el miércoles (14/9/2026). El
     miércoles no depende del cierre del jueves: se arma con lo que hay en el
     freezer, igual que un miércoles de Estancias. El cierre es solo del viernes. */
  if (zone === 'pilar' && _pilarEntregaMaleu()) {
    // El próximo viernes que todavía acepta pedidos: el de esta semana, salvo
    // que ya cerró (jueves desde las 12) o que es hoy.
    var sigVieMs = ((dow === 4 && hour >= 12) || dow === 5) ? proxVieMs + 7 * 86400000 : proxVieMs;
    var mieTras = function (ms) { return dm(ms - 2 * 86400000); };   // el miércoles de esa misma semana
    if (dow === 4 && hour < 12) {
      return { tone: 'urgente', html: '<strong>¡Estás a tiempo!</strong> Para mañana viernes ' + dm(proxVieMs) + ' cerramos los pedidos <strong>hoy a las 12 hs</strong>. También entregamos el <strong>miércoles ' + mieTras(proxVieMs + 7 * 86400000) + '</strong>.' };
    }
    if (dow === 5) {
      return { tone: 'entregando', html: '<strong>Hoy estamos entregando</strong> ' + donde + '. Volvemos el <strong>miércoles ' + mieTras(sigVieMs) + '</strong> y el <strong>viernes ' + dm(sigVieMs) + '</strong>: dejanos tu pedido y ya quedás en el recorrido.' };
    }
    if (dow === 4) {
      return { tone: 'info', html: 'Los pedidos para <strong>mañana viernes ya cerraron</strong>. Pedí para el <strong>miércoles ' + mieTras(sigVieMs) + '</strong> o el <strong>viernes ' + dm(sigVieMs) + '</strong>.' };
    }
    return { tone: 'info', html: 'Entregamos los <strong>miércoles y los viernes</strong> ' + donde + '. Para el viernes ' + dm(sigVieMs) + ', pedí hasta el <strong>jueves ' + dm(sigVieMs - 86400000) + ' a las 12 hs</strong>.' };
  }
  // Jueves antes del cierre: última chance para el viernes de mañana.
  if (dow === 4 && hour < 12) {
    return { tone: 'urgente', html: '<strong>¡Estás a tiempo!</strong> Cerramos los pedidos <strong>hoy a las 12 hs</strong> y mañana viernes ' + dm(proxVieMs) + ' salimos a repartir. Dejanos el tuyo y entrás en el recorrido.' };
  }
  // Viernes: hoy es el día. Lo invitamos al recorrido de la semana que viene.
  if (dow === 5) {
    return { tone: 'entregando', html: '<strong>Hoy estamos entregando</strong> ' + donde + '. ¿Querés vivir la experiencia Maleu? El <strong>viernes ' + dm(proxVieMs + 7 * 86400000) + '</strong> volvemos a pasar — dejanos tu pedido ahora y ya quedás en el recorrido.' };
  }
  // Jueves después de las 12: el de mañana ya cerró, entra en el siguiente.
  if (dow === 4) {
    return { tone: 'info', html: 'Los pedidos para <strong>mañana viernes ya cerraron</strong>. Dejanos el tuyo ahora y salís en el recorrido del <strong>viernes ' + dm(proxVieMs + 7 * 86400000) + '</strong>.' };
  }
  // Sábado a miércoles: el próximo viernes está abierto hasta el jueves 12 hs.
  return { tone: 'info', html: 'Entregamos los <strong>viernes</strong> ' + donde + '. Pedí hasta el <strong>jueves ' + cierraJue + ' a las 12 hs</strong> y entrás en el recorrido del <strong>viernes ' + dm(proxVieMs) + '</strong>.' };
}
/* Pinta el aviso en un contenedor. Comparten función el cartel del modal
   (Pilar) y el del hero (Clubes) para que nunca se desincronicen. */
function _renderCutoffNote(el, note, baseClass) {
  if (!el) return;
  if (note) {
    el.className = baseClass + ' ' + note.tone;
    el.innerHTML = note.html;
    el.style.display = '';
  } else {
    el.innerHTML = '';
    el.style.display = 'none';
  }
}

function welcomeShowDateStep() {
  _hideAllSteps();
  var step = $id('loc-step-date');
  step.style.display = '';
  // Etiqueta con la zona elegida
  var z = ZONAS[currentZone];
  var label = step.querySelector('#loc-date-zone-label strong');
  if (label && z) label.textContent = z.nombre;
  // Aviso del cutoff. Acá en la práctica es siempre Pilar: Clubes nunca llega
  // a este paso (ve el mismo aviso en el hero) y Estancias devuelve null.
  _renderCutoffNote($id('loc-date-note'), _cutoffNote(), 'loc-date-note');
  // Render grilla
  renderWelcomeDateGrid();
}
function renderWelcomeDateGrid() {
  var grid = $id('loc-dates-grid');
  if (!grid || !currentZone) return;
  var groups = _getNextDeliveryDatesGrouped(currentZone);
  var html = '';

  // Card "Cualquier día" (flexible) — destacada arriba, ancho completo
  html += '<button type="button" class="loc-any-btn" onclick="setDeliveryDate(\'any\',\'\')" aria-label="Cualquier día">'
        + '<span class="any-icon">🤝</span>'
        + '<span class="any-text"><strong>Cualquier día</strong><small>Sin preferencia, lo coordinamos juntos</small></span>'
        + '</button>';

  function cardHTML(d, isNext) {
    var classes = ['loc-date-card'];
    if (isNext) classes.push('next');
    if (d.isToday) classes.push('is-today');
    else if (d.isTomorrow) classes.push('is-tomorrow');
    var dayClass = (d.isToday || d.isTomorrow) ? 'dc-day dc-day-flag' : 'dc-day';
    return '<button type="button" class="' + classes.join(' ') + '"'
         + ' onclick="setDeliveryDate(\'' + d.iso + '\',\'' + d.dayName + '\')"'
         + ' aria-label="' + d.dayName + ' ' + d.dayNum + ' de ' + d.monthShort + '">'
         + '<span class="' + dayClass + '">' + d.dayShort + '</span>'
         + '<span class="dc-num">' + d.dayNum + '</span>'
         + '<span class="dc-mon">' + d.monthShort + '</span>'
         + '<span class="dc-time">' + d.timeRange + '</span>'
         + '</button>';
  }

  // Sección: Semana actual
  if (groups.thisWeek.length) {
    html += '<div class="loc-date-section">';
    html += '<div class="loc-date-section-title">Semana actual</div>';
    html += '<div class="loc-date-section-grid">';
    groups.thisWeek.forEach(function(d, i) { html += cardHTML(d, i === 0); });
    html += '</div></div>';
  }

  // Sección: Semana siguiente
  if (groups.nextWeek.length) {
    var firstNext = groups.thisWeek.length === 0; // si no había nada esta semana, marcar la primera
    html += '<div class="loc-date-section">';
    html += '<div class="loc-date-section-title">Semana siguiente</div>';
    html += '<div class="loc-date-section-grid">';
    groups.nextWeek.forEach(function(d, i) { html += cardHTML(d, i === 0 && firstNext); });
    html += '</div></div>';
  }

  // Sección: Para más adelante (acordeón)
  if (groups.later.length) {
    html += '<div class="loc-date-section">';
    html += '<button type="button" class="loc-later-toggle" onclick="toggleLaterSection(this)" aria-expanded="false">';
    html += '<span>Para más adelante</span><span class="chev">▾</span>';
    html += '</button>';
    html += '<div class="loc-later-content" hidden>';
    html += '<div class="loc-date-section-grid">';
    groups.later.forEach(function(d) { html += cardHTML(d, false); });
    html += '</div></div></div>';
  }

  grid.innerHTML = html;
}

function toggleLaterSection(btn) {
  if (!btn) return;
  var expanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!expanded));
  btn.classList.toggle('open', !expanded);
  var content = btn.nextElementSibling;
  if (content) {
    if (expanded) content.setAttribute('hidden', '');
    else content.removeAttribute('hidden');
  }
}

/* Devuelve las próximas fechas de entrega válidas para la zona dada,
   agrupadas por: thisWeek (hasta el Domingo de esta semana),
   nextWeek (Lun-Dom de la semana siguiente), later (todo lo posterior,
   hasta 5 semanas en total). */
function _getNextDeliveryDatesGrouped(zone) {
  var out = { thisWeek: [], nextWeek: [], later: [] };
  var z = ZONAS[zone]; if (!z || !z.horarios) return out;
  var validDays = Object.keys(z.horarios);
  var DAY_NAMES_LONG = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  var DAY_NAMES_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  var MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  // Hoy en hora Argentina (medianoche UTC del día AR)
  var nowAR = new Date(Date.now() - 3 * 3600 * 1000);
  var today = new Date(Date.UTC(nowAR.getUTCFullYear(), nowAR.getUTCMonth(), nowAR.getUTCDate()));
  var todayMs = today.getTime();
  var tomorrowMs = todayMs + 86400000;

  // Lunes de la semana actual (en AR, semana arranca Lun)
  var dow = today.getUTCDay(); // 0=Dom..6=Sáb
  var diffToMonday = (dow + 6) % 7; // si Dom=0 → 6, Lun=1 → 0
  var thisMonday = new Date(today);
  thisMonday.setUTCDate(today.getUTCDate() - diffToMonday);
  var nextMonday = new Date(thisMonday);
  nextMonday.setUTCDate(thisMonday.getUTCDate() + 7);
  var laterStart = new Date(thisMonday);
  laterStart.setUTCDate(thisMonday.getUTCDate() + 14);

  // Durante la restricción Pilar de esta semana, en thisWeek solo se
  // acepta Viernes (Marcos entrega los Vie). El resto de la semana queda
  // fuera. La semana siguiente en adelante NO se filtra.
  var pilarRestricted = (zone === 'pilar' && isPilarRestricted());
  // Barrio con vendedor: solo Vie en TODAS las semanas (los vendedores reparten
  // solamente los viernes). El miércoles es de lo que entrega Maleu, y sin
  // zona elegida tampoco se ofrece: ver _pilarEntregaMaleu.
  var pilarRedOnly = (zone === 'pilar' && !_pilarEntregaMaleu());
  var feriados = FERIADOS_BLOQUEADOS[zone] || [];
  var extras = ENTREGAS_EXTRA[zone] || [];
  // Cutoff del Vie de esta semana: si ya pasó, bloquear el Vie en thisWeek.
  // Aplica a Pilar y a Clubes — los dos salen en el recorrido del viernes.
  var pilarFridayBloqueadoFlag = (_zonaDependeDelCutoffViernes(zone) && _isFridayCutoffPast());

  for (var i = 0; i < 35; i++) {
    var d = new Date(today);
    d.setUTCDate(today.getUTCDate() + i);
    var dayName = DAY_NAMES_LONG[d.getUTCDay()];
    var iso = d.toISOString().slice(0,10);
    // Es entrega extra puntual de esa fecha
    var isExtra = extras.some(function(e) { return e.iso === iso; });
    // ¿Día normalmente válido O entrega extra?
    if (validDays.indexOf(dayName) === -1 && !isExtra) continue;
    // Bloqueado por feriado
    if (feriados.indexOf(iso) !== -1) continue;
    // Si la entrega ya terminó (pasó el horario de cierre), saltar
    var endMs = _deliveryEndMs(iso);
    if (endMs && endMs <= Date.now()) continue;
    var inThisWeek = d.getTime() < nextMonday.getTime();
    // Filtro de restricción Pilar: solo Vie en thisWeek (las extras también pasan)
    if (pilarRestricted && inThisWeek && dayName !== 'Viernes' && !isExtra) continue;
    // Barrio Red (Marcos): solo Viernes, todas las semanas
    if (pilarRedOnly && dayName !== 'Viernes' && !isExtra) continue;
    // Cutoff Pilar Vie de esta semana ya vencido → no ofrecer ese Vie
    if (pilarFridayBloqueadoFlag && inThisWeek && dayName === 'Viernes') continue;
    // timeRange: usar el de extra si aplica, sino el del horario normal
    var timeRange;
    if (isExtra) {
      var ex = extras.filter(function(e) { return e.iso === iso; })[0];
      timeRange = (ex && ex.timeRange) || '19 a 21 hs';
    } else {
      timeRange = (z.horarios[dayName] || '').replace(/\s*hs/g,'hs');
    }
    var dms = d.getTime();
    var label;
    if (dms === todayMs) label = 'HOY';
    else if (dms === tomorrowMs) label = 'MAÑANA';
    else label = DAY_NAMES_SHORT[d.getUTCDay()];
    var item = {
      iso: iso,
      dayName: dayName,
      dayShort: label,
      dayNum: d.getUTCDate(),
      monthShort: MONTH_SHORT[d.getUTCMonth()],
      timeRange: timeRange,
      isExtra: isExtra,
      isToday: dms === todayMs,
      isTomorrow: dms === tomorrowMs
    };
    if (inThisWeek) out.thisWeek.push(item);
    else if (d.getTime() < laterStart.getTime()) out.nextWeek.push(item);
    else out.later.push(item);
  }
  return out;
}

/* Devuelve el próximo objeto de fecha de entrega de un día específico
   ("Viernes", etc.) para la zona dada. Usado para el fallback de
   "Cualquier día". */
function _getNextDeliveryOf(zone, targetDayName) {
  var groups = _getNextDeliveryDatesGrouped(zone);
  var all = groups.thisWeek.concat(groups.nextWeek, groups.later);
  for (var i = 0; i < all.length; i++) if (all[i].dayName === targetDayName) return all[i];
  return all[0] || null;
}
function setDeliveryDate(iso, dayName, opts) {
  if (iso === 'any') {
    // "Cualquier día" → flexible. Para el day-picker del form usamos
    // por default el próximo Viernes (la fecha más común y disponible
    // en todas las zonas).
    selectedDateIsFlexible = true;
    var fri = _getNextDeliveryOf(currentZone, 'Viernes') || _getNextDeliveryOf(currentZone, 'Miércoles');
    if (fri) {
      selectedDeliveryDate = fri.iso;
      selectedDeliveryDayName = fri.dayName;
    } else {
      selectedDeliveryDate = null;
      selectedDeliveryDayName = '';
    }
  } else {
    selectedDateIsFlexible = false;
    selectedDeliveryDate = iso;
    selectedDeliveryDayName = dayName;
  }
  try {
    localStorage.setItem('maleu_delivery_date', JSON.stringify({
      iso: selectedDeliveryDate, dayName: selectedDeliveryDayName,
      flexible: selectedDateIsFlexible, zone: currentZone, ts: Date.now()
    }));
  } catch(e) {}
  _setOverlay(false);
  _updateDateChip();
  _ensureCartFitsDate();
  _reservasSegunFecha();
  updateStockDisplay();
  // Pre-rellenar el day-picker del form si corresponde
  _preselectDayPicker();
  // Desde el modal se sube arriba de todo. Desde el boton "Pedir para el vie
  // 18" de una card NO: el cliente esta mirando ese producto.
  if (!(opts && opts.sinScroll)) window.scrollTo(0, 0);
}
/* La fecha que quedo en memoria cuando la guardada ya no vale para esta zona o
   este barrio: sin olvidarla, el chip de arriba seguia diciendo el dia viejo
   detras del paso de fecha, y el tope de stock se calculaba con el. */
function _olvidarFecha() {
  selectedDeliveryDate = null;
  selectedDeliveryDayName = null;
  selectedDateIsFlexible = false;
  _updateDateChip();
}
function _loadSavedDate() {
  try {
    var raw = JSON.parse(localStorage.getItem('maleu_delivery_date') || 'null');
    if (!raw || !raw.iso) return false;
    if (raw.zone && raw.zone !== currentZone) return false;
    var startMs = _deliveryStartMs(raw.iso);
    if (!startMs || startMs < Date.now()) return false; // ya pasó
    // El viernes de esta semana pudo quedar bloqueado por el cutoff del jueves
    // 12hs DESPUÉS de que el cliente lo eligiera. Sin esto, un club que entró
    // el miércoles vuelve el viernes a la tarde y se le respeta la fecha vieja.
    if (_fechaBloqueadaPorCutoff(currentZone, raw.iso)) return false;
    /* Y tiene que ser un dia que esta zona y este barrio ofrecen HOY (14/9/2026).
       Con el miercoles de Pilar pasa de verdad: elige un miercoles en "Otra
       zona", cambia a un barrio con vendedor, y sin esto se le respetaba un dia
       en que ese vendedor no reparte — el chip decia "Mie 16/9" y el pedido no
       tenia con que armarse. Vale igual para un feriado que se bloquea despues.
       "Cualquier dia" no se mira: su fecha es una sugerencia, no una eleccion. */
    if (!raw.flexible) {
      var _of = _getNextDeliveryDatesGrouped(currentZone);
      var _ofrecida = _of.thisWeek.concat(_of.nextWeek, _of.later).some(function (d) { return d.iso === raw.iso; });
      if (!_ofrecida) return false;
    }
    selectedDeliveryDate = raw.iso;
    selectedDeliveryDayName = raw.dayName || '';
    selectedDateIsFlexible = !!raw.flexible;
    _updateDateChip();
    return true;
  } catch(e) { return false; }
}
function _updateDateChip() {
  var chip = $id('date-chip'); if (!chip) return;
  // En Clubes no se muestra el chip de fecha (entrega siempre Vie en cancha)
  if (currentZone === 'clubes') { chip.style.display = 'none'; return; }
  /* Sin fecha elegida el chip INVITA, no se esconde (23/9/2026). Desde que
     el dia no se pregunta al entrar, este es el unico lugar donde el cliente
     ve que todavia esta sin elegir, y por donde lo puede elegir sin bajar
     hasta el formulario. */
  if (!selectedDeliveryDate && !selectedDateIsFlexible) {
    chip.style.display = '';
    _chipIcono(chip, 'cal', 'Elegí el día');
    chip.classList.add('is-pendiente');
    return;
  }
  chip.classList.remove('is-pendiente');
  chip.style.display = '';
  if (selectedDateIsFlexible) {
    _chipIcono(chip, 'cal', 'Cualquier día');
    return;
  }
  var parts = selectedDeliveryDate.split('-');
  if (parts.length !== 3) { _chipIcono(chip, 'cal', 'Fecha'); return; }
  var DAY_NAMES_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  var d = new Date(Date.UTC(+parts[0], +parts[1]-1, +parts[2]));
  _chipIcono(chip, 'cal', DAY_NAMES_SHORT[d.getUTCDay()] + ' ' + (+parts[2]) + '/' + (+parts[1]));
}
function _ensureCartFitsDate() {
  // Si la fecha elegida activa modo limitado, recortar carrito al stock real
  if (!isStockLimited()) return;
  var ajustado = false;
  Object.entries(cart).forEach(function(kv) {
    var id = kv[0], qty = kv[1];
    var avail = stockMap[id];
    if (avail !== undefined && qty > avail) {
      if (avail === 0) delete cart[id];
      else cart[id] = avail;
      ajustado = true;
      renderCardFooter(id);
    }
  });
  if (ajustado) { updateUI(); toast('⚠️ Tu carrito fue ajustado al stock disponible para esa fecha'); }
}
function _preselectDayPicker() {
  // Si el day-picker del form existe, marcar la fecha elegida
  if (!selectedDeliveryDate || selectedDeliveryDate === 'any') return;
  var hidden = $id('f-dia'), hiddenF = $id('f-dia-fecha');
  if (hidden) hidden.value = selectedDeliveryDayName || '';
  if (hiddenF) hiddenF.value = selectedDeliveryDate;
  if (typeof renderDayPicker === 'function') renderDayPicker();
}
/* ═══════════════════════════════════════════════════════════════════
   LOS ICONOS DE LA INTERFAZ (23/9/2026)

   Hasta hoy la tienda usaba emojis — 📍 📅 🛒 💵 🎁 — como iconografia.
   Un emoji NO es un icono: lo dibuja el sistema operativo, asi que se ve
   distinto en cada telefono (y en varios, de otro color), nunca hereda el
   color de la marca, y se lee como un mensaje de WhatsApp metido adentro de
   una tienda. Es el detalle que mas delata una pantalla armada a las
   apuradas.

   Estos son de trazo, heredan `currentColor` y se alinean con el texto que
   tienen al lado, que es lo que hace cualquier tienda hecha en serio.

   Van inline y no como archivo: son cuatro, pesan menos que la conexion que
   habria que abrir para bajarlos, y tienen que estar dibujados cuando la
   primera pantalla se pinta. */
var _ICONOS = {
  pin:  '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  cal:  '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  bolsa:'<path d="M6 8h12l-1.1 12.2H7.1L6 8Z"/><path d="M9 8V6.2a3 3 0 0 1 6 0V8"/>',
  reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.9"/>'
};
function _ico(nombre, clase) {
  var d = _ICONOS[nombre];
  if (!d) return '';
  return '<svg class="ico' + (clase ? ' ' + clase : '') + '" viewBox="0 0 24 24" fill="none" ' +
         'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
         'aria-hidden="true" focusable="false">' + d + '</svg>';
}
/* Pinta un chip como icono + texto. El texto va por `textContent` y NO
   concatenado al HTML: varias de estas etiquetas son nombres de barrio que
   llegan de la planilla (`action=vendedores`), o sea de afuera del codigo. */
function _chipIcono(chip, ico, texto) {
  chip.innerHTML = _ico(ico) + '<span class="chip-txt"></span>';
  chip.querySelector('.chip-txt').textContent = texto;
}
/* Actualiza el chip de ubicacion del header con la etiqueta más específica disponible:
     Pilar + sub-barrio elegido  → 'Ayres del Pilar' (mostramos el barrio)
     Pilar sin sub-barrio        → nombre de la zona canonical (Tortugas y…)
     Home/Clubes o sin datos     → z.nombre.
   Se llama desde applyZone() y desde cada punto donde cambia el barrio. */
function _updateZoneChip() {
  var chip = $id('zone-chip'); if (!chip) return;
  /* Zona provisoria: el chip pregunta en vez de afirmar una zona que eligio
     la tienda y no el cliente. */
  if (zonaProvisoria) {
    _chipIcono(chip, 'pin', '¿Dónde entregamos?');
    chip.classList.add('is-pendiente');
    return;
  }
  chip.classList.remove('is-pendiente');
  var z = ZONAS[currentZone];
  var label = z ? z.nombre : '';
  if (currentZone === 'estancias') {
    // El barrio privado del formulario si ya lo eligió; si no, el nombre corto
    // de la zona: "Estancias del Pilar y Estancias del Río" no entra en el chip
    // de un celular.
    var bp = $id('f-barrio-privado');
    label = (bp && bp.value) || 'Estancias del Pilar y del Río';
  }
  if (currentZone === 'pilar') {
    // Si el sub-barrio del form está seleccionado, usarlo
    var sel = $id('f-pilar-barrio');
    var val = (sel && sel.value) || selectedPilarBarrio || '';
    if (val && val !== '__otro__') {
      label = val;
    } else if (selectedPilarZona || selectedPilarZonaName) {
      label = selectedPilarZonaName || selectedPilarZona;
    }
  }
  _chipIcono(chip, 'pin', label);
}
/* Los días de entrega del hero. En Pilar dependen de quién entrega: lo de
   Maleu, miércoles y viernes; un barrio con vendedor, solo viernes. Por eso se
   repinta también al cambiar de barrio (onPilarBarrioChange). */
function _pintarHeroEntregas() {
  const z = ZONAS[currentZone];
  if (!z) return;
  const schedEl = $id('hero-schedule');
  /* Con la zona provisoria no se dicen dias ni envio: serian los de una zona
     que el cliente no eligio. Lo pide el cartel de abajo (#zona-cta). */
  if (zonaProvisoria) {
    $id('hero-delivery').style.display = 'none';
    if (schedEl) schedEl.style.display = 'none';
    return;
  }
  // Hero delivery text — si hay schedule detallado, mostrar solo eso
  if (z.schedule) {
    $id('hero-delivery').style.display = 'none';
    if (schedEl) { schedEl.textContent = z.schedule; schedEl.style.display = ''; }
  } else {
    var txt = (currentZone === 'pilar' && !_pilarEntregaMaleu() && z.deliveryTextVendedor) ? z.deliveryTextVendedor : z.deliveryText;
    $id('hero-delivery').textContent = txt;
    $id('hero-delivery').style.display = '';
    if (schedEl) schedEl.style.display = 'none';
  }
}
function applyZone() {
  const z = ZONAS[currentZone];
  _updateZoneChip();
  _updateZonaCta();
  /* El chip de fecha tambien, y no solo cuando hay fecha: desde el 23/9/2026
     cuando NO hay dice "Elegí el día", y ese es justamente el estado con el
     que entra todo el mundo. Lo pintaban `_loadSavedDate` (solo si encontraba
     una) y `_olvidarFecha`, asi que el cliente nuevo se quedaba con el "📅
     Fecha" escrito a mano en el HTML. Lo agarro verificar-entrada.js. */
  _updateDateChip();
  _pintarHeroEntregas();
  // Aviso del cutoff en el hero: solo Clubes, que no pasa por el paso de fecha
  // del modal y por lo tanto no lo vería en ningún otro lado.
  _renderCutoffNote($id('hero-cutoff-note'),
    currentZone === 'clubes' ? _cutoffNote('clubes') : null, 'hero-cutoff-note');
  // Form fields
  $id('fields-estancias').style.display = currentZone === 'estancias' ? '' : 'none';
  $id('fields-pilar').style.display = currentZone === 'pilar' ? '' : 'none';
  $id('fields-clubes').style.display = currentZone === 'clubes' ? '' : 'none';
  // Limpiar cartel del vendedor Red (solo aplica en Pilar con barrio Marcos).
  // Si el cliente venía de Pilar y vuelve a Home/Clubes, el cartel quedaba pegado.
  var _aliasNote = $id('mp-alias-vendedor-note');
  if (_aliasNote) _aliasNote.classList.add('hidden');
  if (typeof onPagoChange === 'function') onPagoChange();
  // Si Pilar, re-render dropdown de barrios por si ya llegaron vendedores
  if (currentZone === 'pilar') renderPilarBarrios();
  // Días de entrega (calendario 14 días)
  $id('f-dia').value = '';
  if ($id('f-dia-fecha')) $id('f-dia-fecha').value = '';
  renderDayPicker();
  // Promo bar: ocultar si no hay descuentos activos (clubes, o pilar sin "Otro barrio")
  updatePromoBar();
  // Limpiar carrito al cambiar zona (productos/precios cambian)
  cart = {}; comboCart = {}; piezaCart = {};
  // Re-render catálogo y nav con productos de la zona (y "Lo que pediste la
  // última vez", que cuelga de renderCatalog)
  renderCatalog();
  renderCatNav();
  updateCatNavTop();
  // Botón "Ver los combos" del hero: solo si la zona tiene combos (Estancias y Pilar).
  var combosCta = $id('hero-combos-cta');
  if (combosCta) combosCta.style.display = getActiveCombos().length ? '' : 'none';
  updateUI();
  updateStockDisplay();
  /* Los datos del cliente, de nuevo. Antes `loadClientData()` corría UNA sola
     vez al arrancar el script, y ahí `currentZone` todavía puede no existir:
     el que elegía su zona en el modal recuperaba nombre y teléfono (que se
     guardan aparte del barrio) y tenía que volver a escribir barrio, sub-barrio
     y lote, teniéndolos guardados a mano. No pisa nada de lo que ya esté
     escrito, así que llamarla de más no molesta. */
  loadClientData();
}

/* HTML de UNA card de combo (reutilizable en grupos temporales y permanentes).
   - fullCard: la imagen YA es una placa diseñada (trae nombre, descripción y
     composición). Se muestra entera y NO se repite el texto en HTML; debajo
     solo el precio (tachado dinámico + final) y el botón.
   - sin fullCard: layout de texto clásico (placeholder / combos sin arte). */
/* Lista de composición de un combo (los <li>): cuántas unidades de cada cosa +
   "elegís el/los sabor(es)" en los slots con opción, o el producto en los fijos.
   Se usa igual en la card permanente (fullCard) y en la temporal (texto). */
function _comboCompListHTML(c) {
  return (c.slots || []).map(slot => {
    const opts = slotOptions(slot);
    const pick = slot.pick || 1;
    const noun = slot.unidad || slot.label.toLowerCase();
    if (opts.length <= 1) {
      const p = opts[0];
      return p ? '<li class="fixed"><strong>' + pick + '×</strong> ' + p.nombre + '</li>' : '';
    }
    return '<li><strong>' + pick + '×</strong> ' + noun +
      ' <span class="combo-choose">· elegís ' + (pick > 1 ? 'los sabores' : 'el sabor') + '</span></li>';
  }).join('');
}

/* Badge "para cuántas personas" — lo primero que mira el cliente. */
function _comboPersonasHTML(c) {
  return c.personas ? '<div class="combo-personas">Para ' + c.personas + '</div>' : '';
}

function _comboCardHTML(c) {
  const tachado = c.tachadoFijo || comboNaturalSumComp(resolveComp(c, defaultSelection(c)).comp);
  const priceHtml = '<span class="product-price">' +
    (tachado > c.precio ? '<s class="combo-price-old">' + ars(tachado) + '</s> ' : '') + ars(c.precio) + '</span>';
  const choices = comboHasChoices(c);
  // Combo terminado (evento pasó): botón bloqueado + label custom. Se sigue viendo
  // en la tienda pero sin acción posible.
  const btn = c.terminado
    ? '<button class="add-btn combo-btn-terminado" disabled aria-disabled="true">Terminado</button>'
    : (choices
      ? '<button class="add-btn" onclick="openComboConfig(\'' + c.id + '\')">Armar combo</button>'
      : '<button class="add-btn" onclick="addComboDefault(\'' + c.id + '\')">+ Agregar</button>');
  const terminadoBadge = c.terminado
    ? '<span class="combo-terminado-badge">' + (c.terminadoLabel || 'Terminado') + '</span>'
    : '';
  const cardCls = c.terminado ? ' combo-card-terminado' : '';

  if (c.fullCard) {
    // placaSola: la placa YA trae composición + precio (tachado y final). Mostramos
    // solo la imagen + botón, sin duplicar/chocar con un precio dinámico debajo.
    var foot = c.placaSola
      ? '<span class="stock-indicator" id="stock-' + c.id + '"></span>' +
        '<div class="product-footer">' + btn + '</div>'
      : _comboPersonasHTML(c) +
        '<ul class="combo-includes">' + _comboCompListHTML(c) + '</ul>' +
        '<span class="stock-indicator" id="stock-' + c.id + '"></span>' +
        '<div class="product-footer">' + priceHtml + btn + '</div>';
    return '<article class="product-card combo-card combo-card-full' + cardCls + '" data-id="' + c.id + '">' +
      terminadoBadge +
      '<img class="combo-full-img" src="' + fotoUrl(c.img) + '" alt="' + c.nombre + '" loading="lazy">' +
      '<div class="combo-full-foot">' + foot + '</div>' +
    '</article>';
  }

  return '<article class="product-card combo-card' + cardCls + '" data-id="' + c.id + '">' +
    terminadoBadge +
    '<div class="product-thumb">' +
      /* Las mismas chapitas que la card de producto, y en el MISMO
         contenedor que el flag del combo: si fueran dos capas absolutas se
         superpondrian — las dos viven en top:.5rem/left:.5rem. */
      '<div class="chapas-prod">' +
        '<span class="combo-flag">' + (c.flag || 'Combo') + '</span>' +
        (c.nuevo ? '<span class="chapa-prod chapa-nuevo">Nuevo</span>' : '') +
        (c.top   ? '<span class="chapa-prod chapa-top">Lo más pedido</span>' : '') +
      '</div>' +
      '<img class="product-thumb-img" src="' + fotoUrl(c.img) + '" alt="' + c.nombre + '" loading="lazy" width="400" height="400" style="object-position:' + (c.imgPos||'center') + '" onerror="this.style.display=\'none\'">' +
    '</div>' +
    '<div class="product-body">' +
      '<h3 class="product-name">' + c.nombre + '</h3>' +
      _comboPersonasHTML(c) +
      '<p class="product-desc">' + c.desc + '</p>' +
      '<ul class="combo-includes">' + _comboCompListHTML(c) + '</ul>' +
      (c.chips ? '<div class="product-chips">' + c.chips.map(x => '<span class="chip">' + x + '</span>').join('') + '</div>' : '') +
      '<span class="stock-indicator" id="stock-' + c.id + '"></span>' +
      '<div class="product-footer">' + priceHtml + btn + '</div>' +
    '</div>' +
  '</article>';
}

/* ── RENDER SECCIÓN COMBOS ──
   Dentro de la sección conviven CATEGORÍAS:
   - Temporales (combo.categoria definido): van PRIMERO, cada una con su
     encabezado y estilo destacado (ej. "🇦🇷 Mundial 2026").
   - Permanentes (sin categoria): van debajo.
   Para sumar otra categoría temporal (octavos, Día del Amigo, etc.) basta con
   poner `categoria` en cada combo nuevo; se agrupan solos. */
function renderCombosSectionHTML() {
  const combos = getActiveCombos();
  if (!combos.length) return '';
  const temporales = combos.filter(c => c.categoria);
  const permanentes = combos.filter(c => !c.categoria);

  // Agrupar temporales por nombre de categoría, en orden de aparición.
  const catOrder = []; const catMap = {};
  temporales.forEach(c => {
    if (!catMap[c.categoria]) { catMap[c.categoria] = []; catOrder.push(c.categoria); }
    catMap[c.categoria].push(c);
  });

  let groups = '';
  catOrder.forEach(cat => {
    groups += '<div class="combo-group combo-group-temporal">' +
      '<div class="combo-group-head">' + cat + '<span class="combo-group-tag">Por tiempo limitado</span></div>' +
      '<div class="products-grid">' + catMap[cat].map(_comboCardHTML).join('') + '</div>' +
    '</div>';
  });
  if (permanentes.length) {
    groups += '<div class="combo-group">' +
      (catOrder.length ? '<div class="combo-group-head combo-group-head-perma">Combos de siempre</div>' : '') +
      '<div class="products-grid">' + permanentes.map(_comboCardHTML).join('') + '</div>' +
    '</div>';
  }

  return '<section class="cat-section combos-section" id="combos-ancla"><div class="cat-header">' +
    '<div class="cat-title">Combos</div>' +
    '<div class="cat-nota">Propuestas ya armadas a precio cerrado · Elegí los sabores y listo</div>' +
    '<div class="combos-disclaimer">ℹ️ La oferta de combos no es acumulable a los descuentos.</div>' +
    '</div>' + groups + '</section>';
}

/* El HTML de UNA card de producto. Salio de adentro de renderCatalog el
   7/9/2026, cuando aparecio la seccion "Los mas pedidos": el mismo producto
   pasa a estar dos veces en la pagina y tener el markup escrito dos veces
   garantiza que un dia se despeguen.

   Ojo con el indicador de stock: aca es data-stock y NO id. Dos elementos
   con el mismo id hacen que getElementById pinte solo el primero, asi que
   la copia se quedaria mostrando "Sin stock" viejo — o peor, nada — sin un
   solo error en consola. Es el mismo bug que costo caro en el ERP con
   nuevoView. Los combos siguen usando id porque no se duplican. */
/* La card de un corte que se vende por peso. Tiene su propio armador porque
   cambia la mitad de abajo: donde va el precio y el boton "+ Agregar" va la
   lista de piezas, que es a la vez el precio, el stock y el selector. */
function carneCardHTML(p) {
  var libres = piezasDe(p.abbr);
  var mias = piezasEnCarrito(p.abbr);
  var agotada = _carneConocida() && carneAgotada(p);
  /* Sin piezas pero con carne en camino: se reserva por kilo (17/9/2026). */
  var aReservar = agotada && reservable(p);
  var chapas = '';
  /* Agotada, la unica chapita es "Sin stock": un "Nuevo" sobre algo que no se
     puede comprar gasta la chapita que hace que el cliente vuelva a mirar. */
  if (aReservar) chapas += '<span class="chapa-prod chapa-reserva">Para reservar</span>';
  else if (agotada) chapas += '<span class="chapa-prod chapa-agotado">Sin stock</span>';
  else if (_esNuevo(p)) chapas += '<span class="chapa-prod chapa-nuevo">Nuevo</span>';

  var cuerpo;
  if (!_carneConocida()) {
    /* Todavia no sabemos que hay. No decimos "sin stock": no saber no es lo
       mismo que no hay. (Hoy getActiveProducts ni siquiera dibuja la card en
       este estado; queda por si alguien la pide igual.) */
    cuerpo = '<p class="pz-vacio">Cargando las piezas de esta semana…</p>';
  } else if (aReservar) {
    cuerpo = _reservaCuerpoHTML(p);
  } else if (agotada) {
    /* "Reponemos todas las semanas" y no un dia: la carne se pide los martes
       y llega los jueves, pero no se repone cada corte cada semana, y
       prometer "vuelve el jueves" seria prometer por Lucas. */
    cuerpo = '<p class="pz-agotado"><strong>Sin stock por ahora.</strong> ' +
      '<span>Reponemos la carne todas las semanas.</span></p>';
  } else {
    var todas = piezasMap[p.abbr] || [];
    /* Con muchas piezas se pliega: ver LA LISTA DE PIEZAS SE DESPLIEGA. */
    var plegable = todas.length >= PZ_PLEGAR_DESDE;
    var plegada = plegable && !pzDesplegado[p.abbr];
    var filas = todas.map(function (pz, i) {
      var elegida = !!piezaCart[pz.id];
      var oculta = plegada && i >= PZ_A_LA_VISTA && !elegida;
      return '<button type="button" class="pz-fila' + (elegida ? ' elegida' : '') +
        (oculta ? ' pz-oculta' : '') + '"' +
        ' onclick="togglePieza(\'' + p.abbr + '\',\'' + pz.id + '\')"' +
        ' aria-pressed="' + (elegida ? 'true' : 'false') + '">' +
          '<span class="pz-check" aria-hidden="true"></span>' +
          '<span class="pz-kg">' + kgTexto(pz.kg) + '</span>' +
          '<span class="pz-precio">' + ars(piezaPrecio(p, pz.kg)) + '</span>' +
        '</button>';
    }).join('');
    var cuantas = todas.length;
    /* El boton dice cuantas son y DE CUANTO A CUANTO van: con la lista
       plegada se ven las primeras seis, y el que busca una de dos kilos tiene
       que saber que existe antes de tocar. */
    var botonMas = '';
    if (plegable) {
      var kgs = todas.map(function (pz) { return pz.kg; });
      botonMas = '<button type="button" class="pz-mas" aria-expanded="' + (plegada ? 'false' : 'true') + '"' +
        ' onclick="verPiezas(\'' + p.abbr + '\', this)">' +
          '<span class="pz-mas-txt">' + (plegada ? 'Ver las ' + cuantas + ' piezas' : 'Ver menos') +
            '<span class="pz-mas-flecha" aria-hidden="true"></span></span>' +
          (plegada ? '<span class="pz-mas-rango">de ' + kgTexto(Math.min.apply(null, kgs)).replace(' kg', '') +
            ' a ' + kgTexto(Math.max.apply(null, kgs)) + '</span>' : '') +
        '</button>';
    }
    cuerpo =
      '<div class="pz-rotulo">' +
        '<span>Eleg\u00ed tu pieza</span>' +
        '<span class="pz-quedan">' + cuantas + (cuantas === 1 ? ' disponible' : ' disponibles') + '</span>' +
      '</div>' +
      '<div class="pz-lista">' + filas + '</div>' +
      botonMas +
      (mias.n
        ? '<div class="pz-resumen">Llev\u00e1s <strong>' + mias.n +
          (mias.n === 1 ? ' pieza' : ' piezas') + '</strong> \u00b7 ' + kgTexto(mias.kg) +
          ' \u00b7 ' + ars(mias.total) + '</div>'
        : '');
  }

  var gris = agotada && !aReservar;
  return '<article class="product-card carne-card' + (gris ? ' agotada' : '') + (aReservar ? ' reserva-card' : '') + '" data-id="' + p.id + '">' +
    '<div class="product-thumb">' +
      (chapas ? '<div class="chapas-prod">' + chapas + '</div>' : '') +
      '<img class="product-thumb-img" src="' + fotoUrl(p.img) + '" alt="' + p.nombre + (gris ? ' (sin stock)' : '') + '" loading="lazy" width="400" height="400" onerror="this.style.display=\'none\'">' +
    '</div>' +
    '<div class="product-body">' +
      '<h3 class="product-name">' + p.nombre + '</h3>' +
      '<p class="product-desc">' + p.desc + '</p>' +
      (p.chips ? '<div class="product-chips">' + p.chips.map(function (c) { return '<span class="chip">' + c + '</span>'; }).join('') + '</div>' : '') +
      '<div class="pz-kilo">' + ars(p.precio) + ' <span>por kilo</span></div>' +
      cuerpo +
    '</div>' +
  '</article>';
}

function productCardHTML(p) {
  if (esPorPeso(p)) return carneCardHTML(p);
  /* Las chapitas van SOBRE la foto y no en el cuerpo: es lo primero que se
     mira, y es donde las ponen Frizata, Comodos y Breaders. Abajo quedaban
     a 10,4px, que es el tamaño de la letra chica de un contrato.
     El orden importa: "Nuevo" primero, porque es la novedad la que hace que
     alguien que ya conoce el catalogo lo vuelva a mirar. */
  var chapas = '';
  if (_esNuevo(p)) chapas += '<span class="chapa-prod chapa-nuevo">Nuevo</span>';
  if (p.top)   chapas += '<span class="chapa-prod chapa-top">Lo más pedido</span>';
  return '<article class="product-card" data-id="' + p.id + '">' +
    '<div class="product-thumb">' +
      (chapas ? '<div class="chapas-prod">' + chapas + '</div>' : '') +
      '<img class="product-thumb-img" src="' + fotoUrl(p.img) + '" alt="' + p.nombre + '" loading="lazy" width="400" height="400" style="object-position:' + (p.imgPos||'center') + '" onerror="this.style.display=\'none\'">' +
    '</div>' +
    '<div class="product-body">' +
      '<h3 class="product-name">' + p.nombre + '</h3>' +
      '<p class="product-desc">' + p.desc + '</p>' +
      (p.chips ? '<div class="product-chips">' + p.chips.map(c => '<span class="chip">' + c + '</span>').join('') + '</div>' : '') +
      '<span class="stock-indicator" data-stock="' + p.id + '"></span>' +
      '<div class="product-footer">' +
        '<span class="product-price">' + ars(p.precio) + '</span>' +
        '<button class="add-btn" onclick="addToCart(\'' + p.id + '\')">+ Agregar</button>' +
      '</div>' +
    '</div>' +
  '</article>';
}

/* "Los mas pedidos" del inicio. Sale del flag top:true que Tadeo cura a mano
   en PRODUCTOS — el mismo que ya pone la estrella en la card, asi que las dos
   cosas no pueden decir distinto. No sale de las ventas reales del ERP: eso
   vive en la hoja Productos y la tienda no le pega al backend para esto. */
function renderTopProductos() {
  const cont = $id('top-productos');
  if (!cont) return;
  const tops = getActiveProducts().filter(p => p.top);
  cont.innerHTML = tops.map(productCardHTML).join('');
  const sec = $id('top-section');
  if (sec) sec.style.display = tops.length ? '' : 'none';
  // Los footers se pintan aparte: la card nace con "+ Agregar" y hay que
  // reflejar lo que ya haya en el carrito.
  tops.forEach(p => renderCardFooter(p.id));
}

/* ── RENDER CATÁLOGO ── */
function renderCatalog() {
  const cats = getCategoriasVisibles();
  const prods_all = getActiveProducts();
  $id('catalog-root').innerHTML = '<span id="productos-ancla"></span>' + cats.map(cat => {
    /* Los destacados primero y los cortes sin stock al final: el que entra a
       Carnes tiene que ver primero lo que puede comprar. El sort es estable,
       asi que adentro de cada grupo queda el orden de PRODUCTOS. */
    const prods = prods_all.filter(p => p.cat === cat.nombre)
      .sort((a,b) => ((b.top?1:0) - (a.top?1:0)) || (_carneOrden(a) - _carneOrden(b)));
    if (!prods.length) return '';
    /* El id va EN EL MARKUP y no lo asigna nadie despues: es lo que busca
       scrollToCat, y una seccion sin id es un boton que no hace nada. */
    return '<section class="cat-section" id="cat-' + slugify(cat.nombre) + '"><div class="cat-header">' +
      '<div class="cat-title">' + cat.nombre + '</div>' +
      '<div class="cat-nota">' + cat.nota + '</div>' +
      (cat.tip ? '<div class="cat-tip">' + cat.tip + '</div>' : '') +
      '</div><div class="products-grid">' +
      prods.map(productCardHTML).join('') +
      '</div></section>';
  }).join('') + renderCombosSectionHTML();  // combos al final, después de la última categoría (Tortas)
  // Los destacados se repintan aca y no en cada call site: hay CUATRO
  // lugares que llaman a renderCatalog y colgarse de uno solo es como se
  // despegan las dos listas.
  renderTopProductos();
  renderUltimoPedido();
  // El inventario de carne cambio (o llego): la sugerencia del carrito tiene
  // que ofrecer lo que hay AHORA, no lo que habia al abrirlo.
  _pintarSugerencia();
  /* El nav y los tiles se repintan aca por el mismo motivo que los
     destacados: si aparece o desaparece una categoria, los chips de arriba
     tienen que decir lo mismo que el catalogo. Colgarlo de los call sites es
     como los botones dejaron de andar el 10/9/2026 — habia cinco y dos se
     olvidaron de llamarlo. */
  renderCatNav();
  // Si hay una busqueda puesta, el catalogo recien dibujado tiene que
  // respetarla. Sin esto, cualquiera de los cuatro repintados la deshace
  // sin decir nada y aparecen productos que el cliente ya habia filtrado.
  if (_busqTexto) buscarEnCatalogo();
  /* Y los carteles de stock, por el MISMO motivo que el nav: redibujar las
     cards los borra, porque se pintan aparte.

     Colgarlo de los call sites ya fallo: de los cinco que repintan el
     catalogo, cuatro llamaban a updateStockDisplay y el de fetchPiezas no.
     Efecto medido contra maleu.com.ar el 10/9/2026: el cliente veia
     "Sin stock" durante 2 segundos y desaparecia de los 34 productos al
     llegar el inventario de carne — sin un solo error en consola. Antes de
     que Lucas cargara las primeras piezas no se notaba, porque sin piezas la
     firma no cambiaba y este repintado no ocurria nunca.

     No es doble trabajo real: los call sites que ya lo llamaban lo hacen
     sobre 34 productos y es idempotente. Se dejan igual a proposito — sacar
     una llamada de mas es mas riesgo que valor. */
  updateStockDisplay();
}

/* Adentro de Carnes: primero los cortes con piezas, despues los que se
   reservan y al final los que no hay. En el resto de las categorias es 0. */
function _carneOrden(p) {
  if (!carneAgotada(p)) return 0;
  return reservable(p) ? 1 : 2;
}

/* ── RENDER CARD FOOTER ── */
function renderCardFooter(id) {
  /* querySelectorAll y no querySelector: desde el 7/9/2026 un producto puede
     estar dos veces en la pagina (su categoria y "Los mas pedidos"), y pintar
     solo la primera deja a la otra congelada en "+ Agregar" aunque el carrito
     tenga 3 — sin ningun error en consola. */
  const cards = document.querySelectorAll('.product-card[data-id="' + id + '"]');
  if (!cards.length) return;
  cards.forEach(function(card) { _pintarFooterDeCard(card, id); });
}

function _pintarFooterDeCard(card, id) {
  const footer = card.querySelector('.product-footer');
  if (!footer) return;
  const p = PROD_MAP[id];
  if (!p) return;
  const qty = cart[id] || 0;
  // Tope dinámico según modo: real (físico), proyectado (físico+OC), o null (ilimitado).
  const cap = getStockCap(id);
  const sinStock = cap !== null && cap !== undefined && cap <= 0;
  const atLimit = cap !== null && cap !== undefined && qty >= cap;
  const otraFecha = (sinStock && qty === 0) ? _fechaConStock(id) : null;
  if (qty === 0 && otraFecha) {
    footer.innerHTML = '<span class="product-price">' + ars(p.precio) + '</span>' +
      '<button class="add-btn add-btn-otra-fecha" onclick="pedirParaOtraFecha(\'' + p.id + '\')">' +
      'Pedir para ' + _fechaCorta(otraFecha) + '</button>';
  } else if (qty === 0) {
    footer.innerHTML = '<span class="product-price">' + ars(p.precio) + '</span>' +
      '<button class="add-btn" onclick="addToCart(\'' + p.id + '\')"' + (sinStock ? ' disabled' : '') + '>' +
      (sinStock ? 'Sin stock' : '+ Agregar') + '</button>';
  } else {
    footer.innerHTML = '<span class="product-price">' + ars(p.precio) + '</span>' +
      '<div class="card-qty-controls">' +
        '<button class="card-qty-btn remove" onclick="cardChangeQty(\'' + p.id + '\',-1)">−</button>' +
        '<span class="card-qty-val">' + qty + '</span>' +
        '<button class="card-qty-btn" onclick="cardChangeQty(\'' + p.id + '\',+1)"' + (atLimit ? ' disabled' : '') + '>+</button>' +
      '</div>' +
      (atLimit ? '<span style="display:block;text-align:center;font-size:.75rem;color:#c0392b;margin-top:4px;font-weight:600;">Máximo disponible: ' + cap + '</span>' : '');
  }
}

/* ── SIN STOCK PARA ESA FECHA, PERO SÍ PARA OTRA (13/9/2026) ──
   Un domingo a la mañana, el cliente que elegía "hoy" veía los cuatro "Lo más
   pedido" en gris: el freezer estaba vacío y era cierto. Pero para el viernes
   se podía pedir cualquier cosa — entra en la orden de compra del jueves — y
   la tienda no lo decía: el botón gris era un callejón sin salida.

   Ahora, si hay una fecha de entrega más adelante en la que ese producto SÍ se
   puede pedir, el botón la ofrece ("Pedir para el vie 18") y al tocarlo pasa
   la entrega a esa fecha y agrega el producto. El toast dice que la fecha
   cambió: cambia para todo el pedido, y eso no puede pasar callado.

   Mover la fecha para adelante nunca achica un tope: lo que ya estaba en el
   carrito sigue entrando. La fecha sale de las MISMAS dos funciones que arman
   el calendario y el tope (`_getNextDeliveryDatesGrouped` y `getStockMode`),
   así que no puede ofrecer un día que el calendario no ofrece. */
var _fechasCache = null;
function _fechasPosteriores() {
  if (!currentZone || !selectedDeliveryDate || selectedDateIsFlexible) return [];
  var clave = currentZone + '|' + selectedDeliveryDate + '|' + (selectedPilarZona || '') + '|' +
              (selectedPilarBarrio || '') + '|' + Math.floor(Date.now() / 60000);
  if (!_fechasCache || _fechasCache.clave !== clave) {
    var g = _getNextDeliveryDatesGrouped(currentZone);
    var todas = g.thisWeek.concat(g.nextWeek, g.later)
      .filter(function (f) { return f.iso > selectedDeliveryDate; })
      .map(function (f) { return { f: f, modo: getStockMode(f.iso) }; });
    _fechasCache = { clave: clave, fechas: todas };
  }
  return _fechasCache.fechas;
}
/* ¿Hay de este producto con el tope de ese modo? Una sola regla para las dos
   que buscan fecha: la de una card y la de "Agregar lo mismo". */
function _hayEnModo(id, m) {
  if (m === 'ilimitado') return true;
  if (m === 'proyectado') return (stockProyectadoMap[id] || 0) > 0;
  return (stockMap[id] || 0) > 0;
}
function _fechaConStock(id) {
  var p = PROD_MAP[id];
  if (!p || esPorPeso(p)) return null;   // la carne va por pieza, no por fecha
  var lista = _fechasPosteriores();
  for (var i = 0; i < lista.length; i++) {
    if (_hayEnModo(id, lista[i].modo)) return lista[i].f;
  }
  return null;
}
/* La primera fecha en la que hay de TODOS: "Agregar lo mismo" mueve la entrega
   una sola vez, y a una fecha en la que despues falte la mitad no sirve. */
function _fechaParaLoMismo(items) {
  if (!items || !items.length) return null;
  var lista = _fechasPosteriores();
  for (var i = 0; i < lista.length; i++) {
    var m = lista[i].modo;
    if (items.every(function (x) { return _hayEnModo(x.p.id, m); })) return lista[i].f;
  }
  return null;
}
/* Un combo solo se ofrece para una fecha SIN tope: calcular si alcanza el
   stock real o proyectado de cada gusto de cada slot para otra fecha seria una
   segunda copia de `comboBestMax`, y es como se despegan dos cuentas. */
function _fechaParaCombo(c) {
  if (!c || c.terminado) return null;
  var lista = _fechasPosteriores();
  for (var i = 0; i < lista.length; i++) if (lista[i].modo === 'ilimitado') return lista[i].f;
  return null;
}
function armarComboOtraFecha(comboId, yaPregunto) {
  var c = COMBO_MAP[comboId];
  var f = _fechaParaCombo(c);
  if (!c || !f) { toast('⚠️ No hay stock para la fecha que elegiste', 3000); return; }
  if (!yaPregunto) {
    _preguntarOtraFecha({ nombre: c.nombre, img: c.img, f: f, id: 'combo-' + c.id,
                          seguir: function () { armarComboOtraFecha(comboId, true); } });
    return;
  }
  var antes = selectedDeliveryDate;
  setDeliveryDate(f.iso, f.dayName, { sinScroll: true });
  var partes = f.iso.split('-');
  var cuando = 'tu entrega ' + (f.isTomorrow ? 'ahora es mañana'
    : 'pasó al ' + f.dayName.toLowerCase() + ' ' + (+partes[2]) + '/' + (+partes[1]));
  if (typeof gtag === 'function') {
    gtag('event', 'fecha_por_stock', { id: 'combo-' + c.id, item_name: c.nombre, desde: antes, hasta: f.iso, zone: currentZone });
  }
  /* El aviso va DESPUES: agregar el combo pisa el toast con su "✓ agregado",
     y el cambio de fecha no puede quedar tapado. */
  if (comboHasChoices(c)) {
    openComboConfig(comboId);
    toast(cuando.charAt(0).toUpperCase() + cuando.slice(1), 4500);
  } else {
    addComboDefault(comboId);
    toast('✓ ' + c.nombre + ' agregado · ' + cuando, 4500);
  }
}
/* "el vie 18" o "mañana": entra en el botón de una card de 170px. */
function _fechaCorta(f) {
  if (f.isTomorrow) return 'mañana';
  var CORTOS = { Lunes: 'lun', Martes: 'mar', 'Miércoles': 'mié', Jueves: 'jue', Viernes: 'vie', 'Sábado': 'sáb', Domingo: 'dom' };
  return 'el ' + (CORTOS[f.dayName] || f.dayName.toLowerCase()) + ' ' + f.dayNum;
}
function pedirParaOtraFecha(id, yaPregunto) {
  var f = _fechaConStock(id);
  var p = PROD_MAP[id];
  if (!f || !p) { toast('⚠️ No hay stock para la fecha que elegiste', 3000); return; }
  if (!yaPregunto) {
    _preguntarOtraFecha({ nombre: p.nombre, img: p.img, f: f, id: p.id,
                          seguir: function () { pedirParaOtraFecha(id, true); } });
    return;
  }
  var antes = selectedDeliveryDate;
  setDeliveryDate(f.iso, f.dayName, { sinScroll: true });
  var partes = f.iso.split('-');
  var cuando = f.isTomorrow ? 'ahora es mañana'
    : 'pasó al ' + f.dayName.toLowerCase() + ' ' + (+partes[2]) + '/' + (+partes[1]);
  var entro = addToCart(id, '✓ ' + p.nombre + ' agregado · tu entrega ' + cuando);
  if (entro && typeof gtag === 'function') {
    gtag('event', 'fecha_por_stock', { id: p.id, item_name: p.nombre, desde: antes, hasta: f.iso, zone: currentZone });
  }
}

/* ── ¿PASAR TODO EL PEDIDO A OTRA FECHA? (13/9/2026) ──
   Tadeo: "elijo para hoy, pongo cosas que SI hay, y toco 'Pedir para el vie
   18' en un pack que hoy no hay: ¿como sigue? ¿separa dos ventas?". No las
   separa: un pedido tiene UNA fecha de entrega. El boton pasaba todo el
   carrito al viernes con un aviso de 4 segundos, y el que habia elegido
   "hoy" se enteraba —si se enteraba— mirando el chip de arriba.

   Se pregunta SIEMPRE antes de mover la fecha, tambien con el carrito vacio.
   Hasta la tarde del 13/9 el carrito vacio seguia de un toque ("no hay nada
   que perder") y Tadeo lo dio vuelta: el que eligio "hoy" y arranca por un
   producto que hoy no hay queda con la entrega en el viernes, y todo lo que
   sume despues —pensando que es para hoy— tambien. Lo que se pierde no es
   el carrito: es la fecha que eligio. Con el carrito vacio el texto no habla
   del carrito, habla de la entrega.

   No se parte en dos pedidos solo, a proposito: serian dos entregas, dos
   confirmaciones por WhatsApp, dos pagos y en Pilar dos envios. Al que quiere
   las dos cosas se le dice como: mandar el de hoy y armar otro.

   Cerrar sin elegir (la ×, tocar afuera, Escape) es "seguir con lo de hoy":
   nunca se mueve la fecha sin un toque que lo diga. */
var _otraFechaPend = null;
/* "viernes 18/9", armado con los componentes del ISO: new Date(iso) se lee
   UTC y en Argentina devuelve el dia anterior. */
function _diaYFecha(iso) {
  var p = String(iso || '').split('-');
  if (p.length !== 3) return '';
  var NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  return NOMBRES[d.getUTCDay()] + ' ' + (+p[2]) + '/' + (+p[1]);
}
/* "hoy" · "mañana" · "el martes 15/9" */
function _paraCuando(iso) {
  var ms = _isoToUTCMidnightMs(iso), hoy = _todayARMidnightMs();
  if (ms === hoy) return 'hoy';
  if (ms === hoy + 86400000) return 'mañana';
  return 'el ' + _diaYFecha(iso);
}
function _preguntarOtraFecha(o) {
  _otraFechaPend = o;
  var ov = $id('fecha-modal');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'fecha-modal';
    ov.className = 'combo-modal-overlay';
    ov.onclick = function (e) { if (e.target === ov) otraFechaNo(); };
    ov.innerHTML = '<div class="combo-modal fecha-modal" role="dialog" aria-modal="true" aria-labelledby="fecha-modal-t">' +
      '<button class="combo-modal-close" type="button" onclick="otraFechaNo()" aria-label="Cerrar">×</button>' +
      '<div id="fecha-modal-content"></div></div>';
    document.body.appendChild(ov);
  }
  var hoy = _paraCuando(selectedDeliveryDate);
  var nueva = _paraCuando(o.f.iso);                          // "el viernes 18/9"
  var aNueva = nueva === 'mañana' ? 'a mañana' : 'al ' + nueva.slice(3);
  var lleno = cartCount() > 0;
  $id('fecha-modal-content').innerHTML =
    '<div class="combo-modal-head">' +
      (o.img ? '<img class="combo-modal-img" src="' + fotoUrl(o.img) + '" alt="">' : '') +
      '<div><div class="combo-modal-title" id="fecha-modal-t">' + o.nombre + '</div>' +
      '<div class="combo-modal-desc">Para ' + hoy + ' no hay. Lo tenemos para ' + nueva + '.</div></div>' +
    '</div>' +
    (lleno
      ? '<p class="fecha-modal-txt">Cada pedido se entrega todo junto, en un solo viaje. Si lo sumás, ' +
          '<strong>lo que ya tenés en el carrito también pasa ' + aNueva + '</strong>.</p>' +
        '<button class="fecha-modal-si" type="button" onclick="otraFechaSi()">Pasar todo ' + aNueva + '</button>' +
        '<button class="fecha-modal-no" type="button" onclick="otraFechaNo()">Seguir con mi pedido para ' + hoy + '</button>' +
        '<p class="fecha-modal-tip">¿Querés las dos cosas? Mandá primero tu pedido para ' + hoy +
          ' y después armá otro para ' + nueva + '.</p>'
      : '<p class="fecha-modal-txt">Cada pedido se entrega todo junto, en un solo viaje. Si lo pedís, ' +
          '<strong>tu entrega pasa ' + aNueva + '</strong>, y lo que sumes después también va para ese día.</p>' +
        '<button class="fecha-modal-si" type="button" onclick="otraFechaSi()">Pasar mi entrega ' + aNueva + '</button>' +
        '<button class="fecha-modal-no" type="button" onclick="otraFechaNo()">Ver lo que hay para ' + hoy + '</button>' +
        '<p class="fecha-modal-tip">¿Querés algo para ' + hoy + ' y esto para ' + nueva +
          '? Son dos pedidos: mandá primero ' + (/^el /.test(hoy) ? 'el del ' + hoy.slice(3) : 'el de ' + hoy) + '.</p>');
  ov.style.display = 'flex';
  _fondoQuieto('fecha', true);
  var si = ov.querySelector('.fecha-modal-si');
  if (si) { try { si.focus({ preventScroll: true }); } catch (e) { si.focus(); } }
}
function _cerrarOtraFecha() {
  var ov = $id('fecha-modal');
  if (ov) ov.style.display = 'none';
  _fondoQuieto('fecha', false);
  var o = _otraFechaPend;
  _otraFechaPend = null;
  return o;
}
function otraFechaSi() {
  var o = _cerrarOtraFecha();
  if (o) o.seguir();
}
function otraFechaNo() {
  var o = _cerrarOtraFecha();
  if (o && typeof gtag === 'function') {
    gtag('event', 'fecha_por_stock_no', { id: o.id, item_name: o.nombre, desde: selectedDeliveryDate, hasta: o.f.iso, zone: currentZone });
  }
}

/* ── CARRITO ── */
/* Devuelve true si el carrito cambió. `addToCart` lo necesita: hasta el
   13/9/2026 decía "✓ agregado" y le mandaba un AddToCart a Meta y a Google
   aunque el tope de stock hubiera frenado el producto. */
function modifyCart(id, delta) {
  const current = cart[id] || 0;
  if (delta > 0) {
    const cap = getStockCap(id);
    if (cap !== null && cap !== undefined && current >= cap) {
      toast(cap <= 0
        ? '⚠️ No hay stock para la fecha que elegiste'
        : '⚠️ Stock limitado — solo hay ' + cap + ' disponible' + (cap !== 1 ? 's' : ''), 3000);
      return false;
    }
  }
  const newQty = current + delta;
  if (newQty <= 0) delete cart[id];
  else cart[id] = newQty;
  updateUI();
  renderCardFooter(id);
  updateFormVisibility();
  updateShippingBar();
  return true;
}
/* Un solo lugar manda los eventos a los dos lados. Colgar Meta de cada call
   site serian 6 lugares de los que acordarse, y ya sabemos como termina eso:
   de los cinco que repintan el catalogo, uno se olvidaba del stock. */
function _track(event, params) {
  params = params || {};
  if (typeof gtag === 'function') gtag('event', event, params);
  _trackMeta(event, params);
}

/* Que hay en el carrito, en el formato que espera Meta. Se arma aca y no en
   cada llamada: `cart` es la fuente, y pasarlo por parametro seria copiarla. */
function _metaContents() {
  var out = [];
  try {
    Object.keys(cart || {}).forEach(function (id) {
      var q = Number(cart[id]) || 0;
      if (q > 0) out.push({ id: String(id), quantity: q });
    });
    /* La carne va por pieza y no entra en `cart`: su cantidad son KILOS. */
    if (typeof piezaCart === 'object' && piezaCart) {
      var porCorte = {};
      Object.keys(piezaCart).forEach(function (pid) {
        var pz = piezaCart[pid];
        if (!pz || !pz.abbr) return;
        porCorte[pz.abbr] = (porCorte[pz.abbr] || 0) + (Number(pz.kg) || 0);
      });
      Object.keys(porCorte).forEach(function (ab) {
        out.push({ id: ab, quantity: Math.round(porCorte[ab] * 1000) / 1000 });
      });
    }
  } catch (e) { /* un evento de medicion no puede voltear un pedido */ }
  return out;
}

/* Traduce los eventos de la tienda a los ESTANDAR de Meta. Los nombres
   importan: `AddToCart` lo entiende y optimiza, `add_to_cart` es un evento
   inventado que no sirve para optimizar ni para armar publico.

   `currency` va SIEMPRE junto con `value`. Sin moneda, Meta no puede calcular
   el retorno y el numero queda mudo. */
function _trackMeta(event, params) {
  if (typeof fbq !== 'function') return;
  try {
    var v = Number(params.value != null ? params.value : params.price);
    var base = {};
    if (!isNaN(v) && v > 0) { base.value = v; base.currency = 'ARS'; }

    if (event === 'add_to_cart') {
      base.content_type = 'product';
      if (params.id != null) base.content_ids = [String(params.id)];
      if (params.item_name) base.content_name = params.item_name;
      fbq('track', 'AddToCart', base);

    } else if (event === 'begin_checkout') {
      base.content_type = 'product';
      base.contents = _metaContents();
      if (params.items) base.num_items = params.items;
      _metaForzarCarga();
      fbq('track', 'InitiateCheckout', base);

    } else if (event === 'purchase') {
      base.content_type = 'product';
      base.contents = _metaContents();
      if (params.items) base.num_items = params.items;
      /* eventID = el mismo clientOrderId con el que el backend deduplica.
         Hoy no hace falta —solo manda el navegador—, pero el dia que el ERP
         mande la compra por la API de Conversiones, Meta reconoce que son el
         MISMO hecho y no cuenta la venta dos veces. Ponerlo ahora es gratis;
         ponerlo despues obliga a tocar las dos puntas a la vez. */
      var opciones = params.orderId ? { eventID: String(params.orderId) } : undefined;
      _metaForzarCarga();
      fbq('track', 'Purchase', base, opciones);

    } else if (event === 'select_zone') {
      /* El momento en que el visitante deja de mirar la portada y entra al
         catalogo. Es el publico que sirve para volver a buscarlo despues:
         miro la comida y no compro. */
      fbq('track', 'ViewContent', { content_type: 'product', content_category: params.zone || '' });
    }
  } catch (e) { /* idem: medir nunca puede romper la compra */ }
}

/* Trae `fbevents.js` YA, sin esperar al diferido.

   Sin esto, el que compra rapido se lleva el Purchase sin enviar: la tienda
   salta a WhatsApp apenas termina, y un evento encolado en `fbq.queue` con el
   script todavia en camino se va con la pagina. Es justo el evento que mas
   importa. */
function _metaForzarCarga() {
  try { if (typeof window.traerMeta === 'function') window.traerMeta(); } catch (e) {}
}
function addToCart(id, mensaje) {
  /* La zona, primero: cambia el catalogo, el envio y el 10% en efectivo, y
     applyZone() vacia el carrito. Preguntarla despues le borraria en la cara
     lo que acaba de agregar. */
  if (_pedirZonaAntes(function () {
        if (!_enLaZona(id)) { _noEstaEnEstaZona(PROD_MAP[id] && PROD_MAP[id].nombre); return; }
        addToCart(id, mensaje);
      }, 'producto')) return false;
  if (!modifyCart(id, 1)) return false;
  const p = PROD_MAP[id];
  _track('add_to_cart', { id: p.id, item_name: p.nombre, price: p.precio, zone: currentZone });
  toast(mensaje || ('✓ ' + p.nombre + ' agregado'), mensaje ? 4500 : undefined);
  const badge = $id('cart-badge');
  badge.classList.remove('bounce');
  void badge.offsetWidth;
  badge.classList.add('bounce');
  return true;
}
function changeQty(id, delta) { modifyCart(id, delta); }
function cardChangeQty(id, delta) { modifyCart(id, delta); }

/* ── COMBOS: alta de instancias configuradas ── */
/* Agrega una instancia (comboId + componentes resueltos). Devuelve true si entró. */
function addComboInstance(comboId, comp, picks) {
  const c = COMBO_MAP[comboId]; if (!c) return false;
  const sig = comboSignature(comboId, comp);
  const existing = comboCart[sig] ? comboCart[sig].qty : 0;
  const max = compMaxTotal(comp, sig);                 // máx instancias de esta config
  if (existing >= max) {
    toast('⚠️ No hay stock para sumar otro ' + c.nombre, 3000);
    return false;
  }
  if (comboCart[sig]) comboCart[sig].qty = existing + 1;
  else comboCart[sig] = { comboId, qty: 1, comp, picks: picks || [] };
  _track('add_to_cart', { id: 'combo-' + c.id, item_name: c.nombre, price: c.precio, zone: currentZone, combo: true });
  toast('✓ ' + c.nombre + ' agregado');
  const badge = $id('cart-badge');
  if (badge) { badge.classList.remove('bounce'); void badge.offsetWidth; badge.classList.add('bounce'); }
  _afterComboChange();
  return true;
}
/* Combo sin elecciones reales: arma la config por defecto y la agrega directo. */
function addComboDefault(comboId) {
  if (_pedirZonaAntes(function () {
        var cz = COMBO_MAP[comboId];
        if (!cz || !comboAvailableInZone(cz)) { _noEstaEnEstaZona('Ese combo'); return; }
        addComboDefault(comboId);
      }, 'combo')) return;
  const c = COMBO_MAP[comboId]; if (!c) return;
  if (c.terminado) { toast('⚠ Este combo ya no está disponible', 3000); return; }
  const r = resolveComp(c, defaultSelection(c));
  addComboInstance(comboId, r.comp, r.picks);
}
/* +/- y eliminar sobre una instancia puntual del carrito (por firma). */
function comboChangeQty(sig, delta) {
  const inst = comboCart[sig]; if (!inst) return;
  if (delta > 0) {
    const max = compMaxTotal(inst.comp, sig);
    if (inst.qty >= max) { toast('⚠️ No hay stock para sumar otro ' + (COMBO_MAP[inst.comboId] || {}).nombre, 3000); return; }
    inst.qty++;
  } else {
    inst.qty--;
    if (inst.qty <= 0) delete comboCart[sig];
  }
  _afterComboChange();
}
function removeComboInst(sig) { delete comboCart[sig]; _afterComboChange(); }
/* Refresca todo lo que depende del stock compartido tras tocar un combo. */
function _afterComboChange() {
  updateUI();
  getActiveProducts().forEach(p => renderCardFooter(p.id));
  getActiveCombos().forEach(c => renderComboFooter(c.id));
  updateStockBadgesCombos();
  updateFormVisibility();
  updateShippingBar();
}

/* Footer de la card de combo: combos con elecciones → "Armar combo" (abre el
   configurador). Combos sin elecciones → "+ Agregar" directo. */
function renderComboFooter(comboId) {
  const card = document.querySelector('.combo-card[data-id="' + comboId + '"]');
  if (!card) return;
  const footer = card.querySelector('.product-footer');
  if (!footer) return;
  const c = COMBO_MAP[comboId];
  if (!c) return;
  // Botón según estado (terminado / con elecciones / directo).
  let btn;
  if (c.terminado) {
    btn = '<button class="add-btn combo-btn-terminado" disabled aria-disabled="true">Terminado</button>';
  } else if (comboBestMax(c, null) <= 0 && _fechaParaCombo(c)) {
    /* Sin stock para la fecha elegida, pero se puede armar para otra (13/9/2026).
       Antes decia "Sin stock" arriba y "Armar combo" en naranja abajo, y el
       boton llevaba a un configurador donde nada se podia elegir. */
    btn = '<button class="add-btn add-btn-otra-fecha" onclick="armarComboOtraFecha(\'' + c.id + '\')">' +
      (comboHasChoices(c) ? 'Armar para ' : 'Pedir para ') + _fechaCorta(_fechaParaCombo(c)) + '</button>';
  } else if (comboHasChoices(c)) {
    btn = '<button class="add-btn" onclick="openComboConfig(\'' + c.id + '\')">Armar combo</button>';
  } else {
    // Sin elecciones: el "mejor" armado es el único posible, pero usamos
    // comboBestMax igual para que card y badge midan siempre con la misma vara.
    const max = comboBestMax(c, null);
    const sinStock = max !== Infinity && max <= 0;
    btn = '<button class="add-btn" onclick="addComboDefault(\'' + c.id + '\')"' + (sinStock ? ' disabled' : '') + '>' +
      (sinStock ? 'Sin stock' : '+ Agregar') + '</button>';
  }
  // placaSola: la placa ya trae el precio → footer solo con el botón (no duplicar).
  if (c.placaSola) { footer.innerHTML = btn; return; }
  const tachado = c.tachadoFijo || comboNaturalSumComp(resolveComp(c, defaultSelection(c)).comp);
  const priceHtml = '<span class="product-price">' +
    (tachado > c.precio ? '<s class="combo-price-old">' + ars(tachado) + '</s> ' : '') +
    ars(c.precio) + '</span>';
  footer.innerHTML = priceHtml + btn;
}
/* Badge de stock de las cards de combo (mismo criterio que productos). */
function updateStockBadgesCombos() {
  const mode = (typeof getStockMode === 'function') ? getStockMode() : 'ilimitado';
  getActiveCombos().forEach(c => {
    const el = $id('stock-' + c.id);
    if (!el) return;
    const max = comboBestMax(c, null);
    if (mode === 'ilimitado' || max === Infinity) el.innerHTML = '';
    else if (max <= 0) el.innerHTML = '<span class="stock-badge stock-out">Sin stock</span>';
    else if (max <= 3) el.innerHTML = '<span class="stock-badge stock-low">' + _ultimasTexto(max) + '</span>';
    else el.innerHTML = '';
  });
}

/* ══════════════════════════════════════════════════
   CONFIGURADOR DE COMBO (modal "Armar combo")
   ══════════════════════════════════════════════════ */
let _comboConfig = null;  // { comboId, sel:[[prodId,...], ...] }
function openComboConfig(comboId) {
  if (_pedirZonaAntes(function () {
        var cz = COMBO_MAP[comboId];
        if (!cz || !comboAvailableInZone(cz)) { _noEstaEnEstaZona('Ese combo'); return; }
        openComboConfig(comboId);
      }, 'combo')) return;
  const c = COMBO_MAP[comboId]; if (!c) return;
  if (c.terminado) { toast('⚠ Este combo ya no está disponible', 3000); return; }
  _comboConfig = { comboId, sel: defaultSelectionInStock(c) };
  _ensureComboModal();
  renderComboConfig();
  const ov = $id('combo-modal');
  ov.style.display = 'flex';
  _fondoQuieto('combo', true);
}
function closeComboConfig() {
  const ov = $id('combo-modal');
  if (ov) ov.style.display = 'none';
  _fondoQuieto('combo', false);
  _comboConfig = null;
}
function _ensureComboModal() {
  if ($id('combo-modal')) return;
  const ov = document.createElement('div');
  ov.id = 'combo-modal';
  ov.className = 'combo-modal-overlay';
  ov.onclick = function(e) { if (e.target === ov) closeComboConfig(); };
  ov.innerHTML = '<div class="combo-modal" role="dialog" aria-modal="true">' +
    '<button class="combo-modal-close" onclick="closeComboConfig()" aria-label="Cerrar">×</button>' +
    '<div id="combo-modal-content"></div>' +
    '</div>';
  document.body.appendChild(ov);
}
/* Elige una opción en un slot (índice de slot, posición dentro del pick). */
function comboPick(slotIdx, pickIdx, prodId) {
  if (!_comboConfig) return;
  _comboConfig.sel[slotIdx][pickIdx] = isNaN(prodId) ? prodId : +prodId;
  renderComboConfig();
}
function renderComboConfig() {
  if (!_comboConfig) return;
  const c = COMBO_MAP[_comboConfig.comboId]; if (!c) return;
  const cont = $id('combo-modal-content'); if (!cont) return;
  const sel = _comboConfig.sel;

  const slotsHtml = (c.slots || []).map((slot, i) => {
    const opts = slotOptions(slot);
    const pick = slot.pick || 1;
    // Slot fijo (1 sola opción): se muestra como "incluido", sin selector.
    if (opts.length <= 1) {
      const p = opts[0];
      return p ? '<div class="cfg-slot cfg-slot-fixed"><div class="cfg-slot-label">' + slot.label +
        '</div><div class="cfg-fixed-item">✓ ' + (pick > 1 ? pick + '× ' : '') + _optLabel(p.nombre, slot.label) + '</div></div>' : '';
    }
    // Un bloque de opciones por cada unidad a elegir (pick).
    const pickBlocks = [];
    for (let k = 0; k < pick; k++) {
      const chosen = sel[i][k];
      const cards = opts.map(p => {
        const avail = optionAvailable(p.id);
        const out = avail !== Infinity && avail <= 0;
        const active = String(chosen) === String(p.id);
        return '<button class="cfg-opt' + (active ? ' active' : '') + (out ? ' out' : '') + '"' +
          (out ? ' disabled' : ' onclick="comboPick(' + i + ',' + k + ',\'' + p.id + '\')"') + '>' +
          '<span class="cfg-opt-name">' + _optLabel(p.nombre, slot.label) + '</span>' +
          (out ? '<span class="cfg-opt-out">Sin stock</span>' : '') +
          '</button>';
      }).join('');
      const blockHdr = pick > 1 ? '<div class="cfg-pick-idx">Elección ' + (k + 1) + '</div>' : '';
      pickBlocks.push('<div class="cfg-pickblock">' + blockHdr + '<div class="cfg-opts">' + cards + '</div></div>');
    }
    const lbl = slot.label + ' <span class="cfg-pick-n">· elegí ' + pick + '</span>';
    return '<div class="cfg-slot"><div class="cfg-slot-label">' + lbl + '</div>' + pickBlocks.join('') + '</div>';
  }).join('');

  // Resolver la selección actual para precio tachado + chequeo de stock.
  const r = resolveComp(c, sel);
  const tachado = c.tachadoFijo || comboNaturalSumComp(r.comp);
  const sig = comboSignature(c.id, r.comp);
  const existing = comboCart[sig] ? comboCart[sig].qty : 0;
  const max = compMaxTotal(r.comp, sig);
  const completo = (c.slots || []).every((slot, i) => (sel[i] || []).every(x => x != null));
  const sinStock = max !== Infinity && existing >= max;
  const canAdd = completo && !sinStock;

  cont.innerHTML =
    '<div class="combo-modal-head">' +
      (c.fullCard ? '' : '<img class="combo-modal-img" src="' + fotoUrl(c.img) + '" alt="" onerror="this.style.display=\'none\'">') +
      '<div><h3 class="combo-modal-title">' + c.nombre + '</h3>' +
      '<p class="combo-modal-desc">' + c.desc + '</p></div>' +
    '</div>' +
    '<div class="combo-modal-slots">' + slotsHtml + '</div>' +
    '<div class="combo-modal-foot">' +
      '<div class="combo-modal-price">' +
        (!c.placaSola && tachado > c.precio ? '<s class="combo-price-old">' + ars(tachado) + '</s> ' : '') +
        '<strong>' + ars(c.precio) + '</strong>' +
      '</div>' +
      '<button class="combo-modal-add" onclick="confirmComboConfig()"' + (canAdd ? '' : ' disabled') + '>' +
        (sinStock ? 'Sin stock para esta combinación' : 'Agregar al carrito') +
      '</button>' +
    '</div>';
}
function confirmComboConfig() {
  if (!_comboConfig) return;
  const c = COMBO_MAP[_comboConfig.comboId]; if (!c) return;
  const r = resolveComp(c, _comboConfig.sel);
  if (addComboInstance(c.id, r.comp, r.picks)) closeComboConfig();
}

function updateUI() {
  const count = cartCount(), subtotal = cartTotal(), discount = getTotalDiscount(), shipping = getShipping(), saldoAFavor = getSaldoAFavor(), total = subtotal - discount + shipping - saldoAFavor;
  const badge = $id('cart-badge');
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';

  const floatBtn = $id('float-cart-btn');
  if (floatBtn) {
    floatBtn.style.display = (count > 0 && !_formVisible) ? 'flex' : 'none';
    if (count > 0) floatBtn.innerHTML = _ico('bolsa') + '<span class="chip-txt">Ver pedido · ' + ars(total) + '</span>';
  }

  const bodyEl = $id('cart-body'), footEl = $id('cart-foot');
  if (count === 0) {
    bodyEl.innerHTML = '<div class="cart-empty-msg">' + _ico('bolsa', 'ico-grande') + 'Todavía no agregaste nada.</div>';
    footEl.style.display = 'none';
  } else {
    footEl.style.display = 'block';
    const comboLines = Object.entries(comboCart).map(([sig,inst]) => {
      const c = COMBO_MAP[inst.comboId];
      if (!c) return '';
      const comps = (inst.picks || []).map(pk =>
        '<li><span class="pk-label">' + pk.label + ':</span> ' + _optLabel(pk.nombre, pk.label) + '</li>'
      ).join('');
      const sigEsc = sig.replace(/'/g, "\\'");
      return '<div class="cart-item cart-item-combo">' +
        _miniCarrito(c) +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + c.nombre + '</div>' +
          '<div class="cart-item-sub">' + ars(c.precio) + ' c/u · <strong>' + ars(c.precio*inst.qty) + '</strong></div>' +
          '<ul class="cart-combo-includes">' + comps + '</ul>' +
        '</div>' +
        '<div class="qty-controls">' +
          '<button class="qty-btn" onclick="comboChangeQty(\'' + sigEsc + '\',-1)">−</button>' +
          '<span class="qty-val">' + inst.qty + '</span>' +
          '<button class="qty-btn" onclick="comboChangeQty(\'' + sigEsc + '\',+1)">+</button>' +
        '</div>' +
      '</div>';
    }).join('');
    const prodLinesHtml = Object.entries(cart).map(([id,qty]) => {
      const p = PROD_MAP[id];
      if (!p) return '';
      return '<div class="cart-item">' +
        _miniCarrito(p) +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + p.nombre + '</div>' +
          '<div class="cart-item-sub">' + ars(p.precio) + ' c/u · <strong>' + ars(p.precio*qty) + '</strong></div>' +
        '</div>' +
        '<div class="qty-controls">' +
          '<button class="qty-btn" onclick="changeQty(\'' + id + '\',-1)">−</button>' +
          '<span class="qty-val">' + qty + '</span>' +
          '<button class="qty-btn" onclick="changeQty(\'' + id + '\',+1)">+</button>' +
        '</div>' +
      '</div>';
    }).join('');
    var piezaLinesHtml = piezasAgrupadas().map(function (g) {
      var abbr = g.abbr, lista = g.lista, kg = g.kg, tot = g.total;
      /* La reserva se cambia de a medio kilo, como un producto con +/-, y dice
         que el precio es aproximado: la carne todavia no se peso. */
      if (g.reserva) {
        return '<div class="cart-item cart-item-carne cart-item-reserva">' +
          _miniCarrito(_corteDe(abbr)) +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + g.nombre + '</div>' +
            '<div class="cart-item-sub">Reserva de ' + _kgCorto(kg) + ' \u00b7 <strong>aprox. ' + ars(tot) + '</strong></div>' +
            '<div class="cart-res-nota">' + (reservaInfo ? 'Llega ' + _paraCuando(reservaLlega()) + '. ' : '') +
              'Te confirmamos el peso y el precio.</div>' +
          '</div>' +
          '<div class="qty-controls">' +
            '<button class="qty-btn" type="button" aria-label="Medio kilo menos" onclick="cambiarReserva(\'' + abbr + '\',-' + RES_PASO + ')">\u2212</button>' +
            '<span class="qty-val">' + String(kg).replace('.', ',') + '</span>' +
            '<button class="qty-btn" type="button" aria-label="Medio kilo m\u00e1s" onclick="cambiarReserva(\'' + abbr + '\',' + RES_PASO + ')">+</button>' +
          '</div>' +
        '</div>';
      }
      var filas = lista.map(function (x) {
        return '<li>' + kgTexto(x.kg) + ' \u00b7 ' + ars(x.precio) +
          '<button class="pz-quitar" type="button" aria-label="Sacar esta pieza" ' +
          'onclick="togglePieza(\'' + abbr + '\',\'' + x.pid + '\')">\u00d7</button></li>';
      }).join('');
      var una = lista.length === 1;
      return '<div class="cart-item cart-item-carne">' +
        _miniCarrito(_corteDe(abbr)) +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + g.nombre + '</div>' +
          '<div class="cart-item-sub">' + lista.length +
            (una ? ' pieza' : ' piezas') + ' \u00b7 ' + kgTexto(kg) +
            ' \u00b7 <strong>' + ars(tot) + '</strong></div>' +
          /* El desglose recien desde DOS piezas: con una sola repetiria el
             renglon de arriba palabra por palabra. */
          (una ? '' : '<ul class="cart-piezas">' + filas + '</ul>') +
        '</div>' +
        (una
          ? '<button class="pz-quitar pz-quitar-solo" type="button" aria-label="Sacar esta pieza" ' +
            'onclick="togglePieza(\'' + abbr + '\',\'' + lista[0].pid + '\')">\u00d7</button>'
          : '') +
      '</div>';
    }).join('');
    bodyEl.innerHTML = comboLines + prodLinesHtml + piezaLinesHtml + '<div id="cart-sug" hidden></div>';
    _pintarSugerencia();
    $id('cart-subtotal').textContent = ars(subtotal);
    const discRow = $id('cart-discount-row');
    if (discount > 0) {
      discRow.style.display = '';
      // Label combinado: si hay cupón + auto, los junta con '+'.
      /* Solo lo que DESCONTO de verdad. Con un cupon que no se suma, el
         renglon decia "🎟️ RULETA-XXXX + 10% OFF Efectivo" y descontaba 15%:
         nombraba un descuento que dio cero. (24/9/2026) */
      var partes = [];
      if (appliedCoupon && getCouponDiscount() > 0) partes.push(appliedCoupon.codigo);
      var autoLbl = getCashDiscount() > 0 ? getDiscountLabel() : '';
      if (autoLbl) partes.push(autoLbl);
      discRow.querySelector('span').textContent = partes.join(' + ') || '10% OFF';
      $id('cart-discount').textContent = '-' + ars(discount);
    }
    else { discRow.style.display = 'none'; }
    $id('cart-shipping').textContent = shipping === 0 ? 'Gratis' : ars(shipping);
    const saldoRow = $id('cart-saldo-row');
    if (saldoRow) {
      if (saldoAFavor > 0) { saldoRow.style.display = ''; $id('cart-saldo').textContent = '-' + ars(saldoAFavor); }
      else { saldoRow.style.display = 'none'; }
    }
    $id('cart-total').textContent = ars(total);
    /* Con carne reservada el total todavia no es el final: falta pesarla. */
    var totLbl = $id('cart-total').previousElementSibling;
    if (totLbl) totLbl.textContent = hayReservaEnCarrito() ? 'Total aprox.' : 'Total';

    // Incentivo — el 10% en efectivo aplica a productos y carne, no a los
    // combos: si el carrito es solo combos (pSub=0), no hay nada que
    // descontar y se oculta. Hasta el 11/9/2026 habia otro renglon, "Estás a
    // $X de tener 10% OFF por superar los $100.000": se fue con ese descuento.
    var incentiveEl = $id('cart-incentive');
    var pSub = descontableSubtotal();
    if (incentiveEl && discountsActive() && pSub > 0) {
      var sel = document.querySelector('input[name="pago"]:checked');
      var isCash = sel && sel.value === 'Efectivo';

      if (discount > 0) {
        // Ya tiene descuento — felicitarlo
        incentiveEl.innerHTML = '<strong>¡Descuento aplicado!</strong><br>Estás ahorrando <strong>' + ars(discount) + '</strong>';
        incentiveEl.style.display = '';
      } else if (!isCash && ahorroPorEfectivo() > 0 && _anunciar10Hoy()) {
        // Recordar el efectivo, sea el pedido chico o grande
        incentiveEl.innerHTML = '<div class="incentive-cash" style="border:none;margin:0;padding:0;">Pagando en efectivo tenés 10% OFF</div>';
        incentiveEl.style.display = '';
      } else {
        incentiveEl.style.display = 'none';
      }
    } else if (incentiveEl) {
      incentiveEl.style.display = 'none';
    }
  }
  // Barra de promo superior: visible normalmente (el 10% aplica a productos
  // sueltos aun con combos). Solo se oculta si el carrito es SOLO combos
  // (no hay nada descontable → el cartel mentiría).
  /* La franja tiene UNA sola funcion que decide si va: updatePromoBar(). Aca
     habia una segunda copia de la regla —solo miraba "carrito de solo
     combos"— y volvia a encender la barra dos lineas despues de que la otra la
     apagara. Es la tercera vez en el dia que aparece el mismo patron: la
     primera fue la zona provisoria, la segunda el 10% de efectivo. Se arregla
     en la raiz, no en el call site. (24/9/2026) */
  updatePromoBar();
  updateFormSummary();
  updatePagoHint();
  // Si hay cupón aplicado, refresco el card para que pase de pending → activo
  // (o viceversa) cuando el cliente agrega o saca productos del scope.
  if (appliedCoupon) _renderCouponApplied();
  // "Agregar lo mismo" dice si todavia falta algo: depende del carrito.
  _pintarUltimoPie();
}

function updateFormSummary() {
  const el = $id('form-summary'), count = cartCount();
  if (count === 0) { el.innerHTML = '<p class="summary-empty">Agregá productos para ver el resumen.</p>'; return; }
  const subtotal = cartTotal();
  const cuponDesc = getCouponDiscount();
  const autoDesc  = getCashDiscount();
  const totalDesc = cuponDesc + autoDesc;
  const shipping  = getShipping();
  const saldoAFavor = getSaldoAFavor();
  const total     = subtotal - totalDesc + shipping - saldoAFavor;

  // Combos primero (cada instancia configurada), luego productos sueltos.
  let html = Object.values(comboCart).map(inst => {
    const c = COMBO_MAP[inst.comboId];
    if (!c) return '';
    const picks = (inst.picks || []).map(pk => _optLabel(pk.nombre, pk.label)).join(' · ');
    return '<div class="summary-line summary-line-combo"><span>' +
      '<span class="summary-combo-name">' + c.nombre +
        (inst.qty > 1 ? ' <strong>×' + inst.qty + '</strong>' : '') + '</span>' +
      (picks ? '<span class="summary-combo-picks">' + picks + '</span>' : '') +
      '</span><span>' + ars(c.precio*inst.qty) + '</span></div>';
  }).join('');
  html += Object.entries(cart).map(([id,qty]) => {
    const p = PROD_MAP[id];
    if (!p) return '';
    return '<div class="summary-line"><span>' + p.nombre + ' <strong>×' + qty + '</strong></span><span>' + ars(p.precio*qty) + '</span></div>';
  }).join('');

  /* La carne. Faltaba: con un pedido de pura carne el resumen mostraba los
     totales sin una sola linea de que estabas llevando. Se dice el PESO,
     porque es lo que se compro: "1,240 kg" dice mas que "1 pieza". */
  html += piezasAgrupadas().map(function (g) {
    if (g.reserva) {
      return '<div class="summary-line"><span>\ud83e\udd69 ' + g.nombre + ' <strong>reserva de ' + _kgCorto(g.kg) + '</strong>' +
        ' <span class="summary-pz-detalle">a confirmar cuando llegue</span></span><span>aprox. ' + ars(g.total) + '</span></div>';
    }
    var detalle = g.lista.length > 1
      ? ' <span class="summary-pz-detalle">(' + g.lista.map(function (x) { return kgTexto(x.kg); }).join(' + ') + ')</span>'
      : '';
    return '<div class="summary-line"><span>\ud83e\udd69 ' + g.nombre + ' <strong>' + kgTexto(g.kg) + '</strong>' +
      detalle + '</span><span>' + ars(g.total) + '</span></div>';
  }).join('');

  // Sub Total: solo si hay descuentos (deja claro de qué monto sale el 10%/cupón).
  if (totalDesc > 0) {
    html += '<div class="summary-line subtotal-line"><span>Sub Total</span><span>' + ars(subtotal) + '</span></div>';
  }
  // Cupón en su propia línea (verde) — separado del auto para que el cliente entienda qué le aportó.
  if (cuponDesc > 0 && appliedCoupon) {
    html += '<div class="summary-line discount-line" style="color:#2e7d32"><span>' + appliedCoupon.codigo + ' · ' + (appliedCoupon.mensaje || '') + '</span><span>-' + ars(cuponDesc) + '</span></div>';
  }
  /* El premio existe pero en este barrio no se puede usar. Decirlo es lo unico
     honesto: el cliente lo cargo desde el link y lo vio aplicado hasta que
     eligio su barrio. (24/9/2026) */
  if (appliedCoupon && !cuponValeEnEstaZona()) {
    html += '<div class="summary-line discount-line" style="color:#8a3b00"><span>' + appliedCoupon.codigo
      + ' · en un barrio con vendedor no se puede usar</span><span>—</span></div>';
  }
  /* El premio de la ruleta (22/9/2026): no descuenta plata, se suma al pedido.
     Si tiene minimo y no llega, dice cuanto falta. */
  if (appliedCoupon && appliedCoupon.tipo === 'REGALO' && cuponValeEnEstaZona()) {
    var faltaPremio = Math.max(0, (appliedCoupon.minimo || 0) - subtotal);
    html += '<div class="summary-line discount-line" style="color:#2e7d32"><span>' + (appliedCoupon.mensaje || 'Tu premio') + ' · ' + appliedCoupon.codigo + '</span><span>' +
      (faltaPremio > 0 ? 'sumá ' + ars(faltaPremio) : 'de regalo') + '</span></div>';
  }
  // Auto-descuento (el 10% en efectivo)
  if (autoDesc > 0) {
    html += '<div class="summary-line discount-line"><span>' + getDiscountLabel() + '</span><span>-' + ars(autoDesc) + '</span></div>';
  }
  html += '<div class="summary-line shipping-line"><span>Envío</span><span>' + (shipping === 0 ? 'Gratis' : ars(shipping)) + '</span></div>';
  if (saldoAFavor > 0) {
    html += '<div class="summary-line discount-line" style="color:#2e7d32"><span>Saldo a favor</span><span>-' + ars(saldoAFavor) + '</span></div>';
  }
  var conReserva = hayReservaEnCarrito();
  html += '<div class="summary-line total-line"><span>Total' + (conReserva ? ' aprox.' : '') + '</span><span>' + ars(total) + '</span></div>';
  if (conReserva) {
    html += '<p class="summary-res-nota">La carne reservada llega ' + _paraCuando(reservaLlega()) +
      '. Cuando llegue la pesamos y te confirmamos el total.</p>';
  }
  el.innerHTML = html;
}

/* ── TOGGLE CART ── */
function toggleCart() {
  const s=$id('cart-sidebar'), o=$id('cart-overlay');
  const open = s.classList.toggle('open');
  o.classList.toggle('open', open);
  _fondoQuieto('carrito', open);
  /* Cuantas veces se VIO cada sugerencia, una por visita: sin el denominador,
     "3 la sumaron" no dice si es mucho o poco. */
  var sug = $id('cart-sug'), tipo = sug && sug.getAttribute('data-tipo');
  if (open && sug && !sug.hidden && tipo && !_sugVistas[tipo]) {
    _sugVistas[tipo] = true;
    _track('sugerencia_' + tipo + '_vista', { zone: currentZone, filas: sug.querySelectorAll('.sug-fila').length });
  }
}
function goToForm() {
  if (_pedirZonaAntes(function () { goToForm(); }, 'formulario')) return;
  toggleCart();
  _track('begin_checkout', { value: cartTotal(), zone: currentZone, items: cartCount() });
  const section = $id('form-section');
  if (section) section.classList.remove('collapsed');
  /* El dia de la fecha elegida, marcado en el formulario (12/9/2026). Un
     cliente que vuelve con la fecha guardada y vigente NO pasa por el modal,
     que es el unico que la marcaba: entraba desde el carrito y el dia estaba
     vacio, con el chip de arriba diciendo la fecha. expandForm() ya lo hacia;
     este camino, que es el del carrito, no. Solo si el dia esta vacio:
     elegir otro dia en el formulario no cambia la fecha del modal, y pisarlo
     al volver del carrito le borraria lo que eligio. */
  var _fdf = $id('f-dia-fecha');
  if (!_fdf || !_fdf.value) _preselectDayPicker();
  // Delay 380ms deja terminar la animación de cierre del sidebar. Usamos scroll
  // INSTANT porque hay layout shifts en paralelo — smooth se cancelaría.
  setTimeout(function() {
    var target = $id('form-title') || $id('form-section');
    if (target) _smoothScrollToEl(target, { instant: true });
  }, 380);
}

/* ── DÍA / HORARIO ── */
function _getHorarioForFecha(zone, dayName, iso) {
  // Si la fecha es una entrega extra puntual (ej. Jue 30/4 por feriado),
  // devolver el horario de la entrega extra. Sino, el horario normal de la zona.
  var extras = ENTREGAS_EXTRA[zone] || [];
  var ex = extras.filter(function(e) { return e.iso === iso; })[0];
  if (ex) return ex.timeRange;
  var z = ZONAS[zone];
  return (z && z.horarios && z.horarios[dayName]) || '';
}
function onDiaChange() {
  const dia = $id('f-dia').value;
  const fecha = $id('f-dia-fecha') ? $id('f-dia-fecha').value : '';
  const hint = $id('horario-hint');
  const horario = _getHorarioForFecha(currentZone, dia, fecha);
  if (horario) {
    hint.textContent = 'Horario: ' + horario;
    hint.style.display = 'block';
  } else {
    hint.style.display = 'none';
  }
}

/* ── CALENDARIO DE 14 DÍAS ── */
const DP_DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DP_DAY_LABELS = ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];

function _todayAR() {
  // Hora Argentina (UTC-3) — normalizado a medianoche UTC para comparar por día.
  var now = new Date();
  var ar = new Date(now.getTime() - 3 * 3600 * 1000);
  return new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate()));
}

function _zoneHorariosForDayPicker() {
  if (!currentZone) return {};
  var z = ZONAS[currentZone];
  if (!z) return {};
  // Pilar: del 06/07/26 al 14/9/2026 fue solo viernes para todos. Desde el
  // 14/9 lo que entrega Maleu vuelve a tener miércoles y viernes; los barrios
  // con vendedor, solo viernes. Mismo criterio que el calendario del modal.
  if (currentZone === 'pilar') return _pilarEntregaMaleu() ? z.horarios : { 'Viernes': 'A coordinar' };
  return z.horarios || {};
}

function renderDayPicker() {
  var root = $id('day-picker');
  if (!root) return;
  if (!currentZone) { root.innerHTML = ''; return; }

  var horarios = _zoneHorariosForDayPicker();
  var today = _todayAR();
  var dow = today.getUTCDay(); // 0=Dom..6=Sáb
  var diffToMonday = (dow + 6) % 7;
  var monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - diffToMonday);
  var todayTs = today.getTime();
  var selectedFecha = $id('f-dia-fecha') ? $id('f-dia-fecha').value : '';

  // Cutoff del Vie de esta semana (Pilar y Clubes) — usa la misma función que
  // el modal de bienvenida para que ambos sean consistentes.
  var redCutoffFriday = null;
  if (_zonaDependeDelCutoffViernes(currentZone) && _isFridayCutoffPast()) {
    var fri = new Date(monday);
    fri.setUTCDate(monday.getUTCDate() + 4);
    redCutoffFriday = fri.getTime();
  }

  var html = '<div class="dp-dow">' + DP_DAY_LABELS.map(function(l){ return '<span>' + l + '</span>'; }).join('') + '</div>';
  html += '<div class="dp-grid">';

  var feriadosDP = FERIADOS_BLOQUEADOS[currentZone] || [];
  var extrasDP = ENTREGAS_EXTRA[currentZone] || [];

  for (var i = 0; i < 14; i++) {
    var d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    var dayName = DP_DAY_NAMES[d.getUTCDay()];
    var dayNum = d.getUTCDate();
    var iso = d.toISOString().slice(0, 10);
    var isPast = d.getTime() < todayTs;
    var isToday = d.getTime() === todayTs;
    var isExtraDP = extrasDP.some(function(e) { return e.iso === iso; });
    var available = (!!horarios[dayName]) || isExtraDP;
    if (feriadosDP.indexOf(iso) !== -1) available = false;
    var isRedCutoff = redCutoffFriday !== null && d.getTime() === redCutoffFriday;

    var cls = 'dp-cell';
    var disabled = false;
    if (isPast) { cls += ' past'; disabled = true; }
    else if (isRedCutoff) { cls += ' unavailable'; disabled = true; }
    else if (!available) { cls += ' unavailable'; disabled = true; }
    else { cls += ' available'; }
    if (isToday) cls += ' today';
    if (!disabled && iso === selectedFecha) cls += ' selected';
    // Si la fecha previamente elegida ya no está disponible (ej. cambió barrio), limpiarla
    if (disabled && iso === selectedFecha) {
      if ($id('f-dia')) $id('f-dia').value = '';
      if ($id('f-dia-fecha')) $id('f-dia-fecha').value = '';
      selectedFecha = '';
    }

    html += '<button type="button" class="' + cls + '"'
      + (disabled ? ' disabled aria-disabled="true" tabindex="-1"' : '')
      + ' data-fecha="' + iso + '"'
      + ' data-dia="' + dayName + '"'
      + ' aria-label="' + dayName + ' ' + dayNum + (disabled ? ' (no disponible)' : '') + '"'
      + ' onclick="selectDayPicker(this)">'
      + dayNum
      + '</button>';
  }

  html += '</div>';
  html += '<div class="dp-legend">'
    + '<span><i class="l-ok"></i>Disponible</span>'
    + '<span><i class="l-off"></i>Sin entrega</span>'
    + '</div>';
  root.innerHTML = html;
}

function selectDayPicker(el) {
  if (!el || el.disabled) return;
  var root = $id('day-picker');
  if (root) {
    var prev = root.querySelectorAll('.dp-cell.selected');
    for (var i = 0; i < prev.length; i++) prev[i].classList.remove('selected');
  }
  el.classList.add('selected');
  var dia = el.getAttribute('data-dia');
  var fecha = el.getAttribute('data-fecha');
  var hidden = $id('f-dia');
  var hiddenF = $id('f-dia-fecha');
  if (hidden) hidden.value = dia;
  if (hiddenF) hiddenF.value = fecha;
  /* Y esta es la fecha del pedido (23/9/2026). Hasta hoy elegir un dia aca no
     movia `selectedDeliveryDate`: el tope de stock seguia calculado con la
     fecha del modal, asi que se podia armar el carrito para el viernes (todo
     disponible) y pedir la entrega para hoy (freezer vacio). Ahora el dia del
     formulario es el que manda y `_ensureCartFitsDate` recorta y lo dice,
     igual que cuando se cambia desde el chip 📅. Desde que la fecha dejo de
     preguntarse al entrar, este es ADEMAS el lugar donde la mayoria la elige:
     el agujero paso de raro a estar en el camino principal. */
  setDeliveryDate(fecha, dia, { sinScroll: true });
  clearError('f-dia','err-dia');
  if (root) root.classList.remove('error');
  onDiaChange();
}

/* ── VALIDACIÓN ── */
function showError(fId, eId) { const f=$id(fId), e=$id(eId); if(f)f.classList.add('error'); if(e)e.classList.add('visible'); }
function clearError(fId, eId) { const f=$id(fId), e=$id(eId); if(f)f.classList.remove('error'); if(e)e.classList.remove('visible'); }
function validateOnBlur(campo) {
  if (campo==='nombre') { $id('f-nombre').value.trim() ? clearError('f-nombre','err-nombre') : showError('f-nombre','err-nombre'); }
  if (campo==='barrioPrivado') { $id('f-barrio-privado').value ? clearError('f-barrio-privado','err-barrio-privado') : showError('f-barrio-privado','err-barrio-privado'); }
  if (campo==='barrio') { $id('f-barrio').value ? clearError('f-barrio','err-barrio') : showError('f-barrio','err-barrio'); }
  if (campo==='lote') { $id('f-lote').value.trim() ? clearError('f-lote','err-lote') : showError('f-lote','err-lote'); }
  if (campo==='direccion') { $id('f-direccion').value.trim() ? clearError('f-direccion','err-direccion') : showError('f-direccion','err-direccion'); }
  if (campo==='lotePilar') { $id('f-lote-pilar').value.trim() ? clearError('f-lote-pilar','err-lote-pilar') : showError('f-lote-pilar','err-lote-pilar'); }
  if (campo==='club') { $id('f-club').value ? clearError('f-club','err-club') : showError('f-club','err-club'); }
  if (campo==='deporte') { $id('f-deporte').value ? clearError('f-deporte','err-deporte') : showError('f-deporte','err-deporte'); }
  if (campo==='grupo') { $id('f-grupo').value ? clearError('f-grupo','err-grupo') : showError('f-grupo','err-grupo'); }
  if (campo==='telefono') { $id('f-telefono').value.replace(/\D/g,'').length >= 8 ? clearError('f-telefono','err-telefono') : showError('f-telefono','err-telefono'); }
  if (campo==='dia') {
    var dpRoot = $id('day-picker');
    if ($id('f-dia').value) {
      clearError('f-dia','err-dia');
      if (dpRoot) dpRoot.classList.remove('error');
    } else {
      showError('f-dia','err-dia');
      if (dpRoot) dpRoot.classList.add('error');
    }
  }
  // Refrescar el hint del botón WhatsApp: puede haber cambiado el estado
  // (ej: al completar nombre, el hint pasa a "solo falta el pago").
  updateWhatsappCta();
}
function filtrarSubBarrios(keepValue) {
  const privado = $id('f-barrio-privado').value;
  const subField = $id('field-sub-barrio');
  const subSel = $id('f-barrio');
  if (!keepValue) subSel.value = '';
  clearError('f-barrio-privado','err-barrio-privado');
  clearError('f-barrio','err-barrio');
  if (privado === 'Estancias del Pilar') {
    Array.from(subSel.options).forEach(opt => { if (!opt.value) return; opt.hidden = opt.dataset.privado !== 'Estancias del Pilar'; });
    subField.style.display = '';
  } else {
    // Estancias del Río no tiene sub-barrios: se entrega por lote.
    subField.style.display = 'none';
  }
  _updateZoneChip();
}

/* ── LOADER OVERLAY DE ENVÍO ──
   Cubre la pantalla mientras el pedido se registra. Estados:
     · default   — registrando (el POST esta en vuelo)
     · .success  — ✓, el backend CONFIRMO: recien ahi se va a WhatsApp
     · .fallback — a los 25 s sin confirmacion: se ofrece mandarlo igual por
                   WhatsApp, con un mensaje que dice que no quedo registrado */
function showSendLoader() {
  var ov = $id('send-overlay');
  if (!ov) return;
  var card = ov.querySelector('.send-card');
  if (card) card.classList.remove('success', 'error', 'fallback');
  var t = $id('send-title'), s = $id('send-sub');
  if (t) t.textContent = 'Registrando tu pedido…';
  if (s) s.textContent = 'Tarda unos segundos. No cierres esta pantalla.';
  var fb = $id('send-wa-btn');
  if (fb) fb.onclick = null;
  ov.classList.add('active');
  ov.setAttribute('aria-hidden', 'false');
  _fondoQuieto('envio', true);
}
function setSendLoaderSuccess() {
  var ov = $id('send-overlay');
  if (!ov) return;
  var card = ov.querySelector('.send-card');
  if (card) { card.classList.remove('fallback'); card.classList.add('success'); }
  var t = $id('send-title'), s = $id('send-sub');
  if (t) t.textContent = '¡Pedido registrado!';
  if (s) s.textContent = 'Te llevamos a WhatsApp para que nos lo mandes.';
}
/* A los 8 s todavia sin confirmacion: casi siempre es la señal. Decirlo evita
   que el cliente crea que se colgo y cierre la pantalla. */
function setSendLoaderLento() {
  var s = $id('send-sub');
  if (s) s.textContent = 'La conexión está lenta. Seguimos intentando…';
}
/* A los 25 s el cliente no se queda trabado: lo puede mandar por WhatsApp,
   que guarda y reenvia el mensaje aunque no haya señal. Ese mensaje dice que
   el pedido NO quedo registrado y lleva los datos para cargarlo a mano. La
   tienda sigue intentando mientras tanto: si confirma antes del toque, sigue
   sola por el camino normal. */
function setSendLoaderFallback(alTocar) {
  var ov = $id('send-overlay');
  if (!ov) return;
  var card = ov.querySelector('.send-card');
  if (card) card.classList.add('fallback');
  var t = $id('send-title'), s = $id('send-sub');
  if (t) t.textContent = 'Todavía no se registró';
  if (s) s.textContent = 'Podés mandarlo igual por WhatsApp: nos llega con todos tus datos.';
  var fb = $id('send-wa-btn');
  if (fb) fb.onclick = function () { fb.onclick = null; alTocar(); };
}
function hideSendLoader() {
  var ov = $id('send-overlay');
  if (!ov) return;
  ov.classList.remove('active');
  ov.setAttribute('aria-hidden', 'true');
  var card = ov.querySelector('.send-card');
  if (card) card.classList.remove('success', 'error', 'fallback');
  _fondoQuieto('envio', false);
}

/* ── ENVIAR PEDIDO ── */
function enviarPedido() {
  if (_enviando) return;
  if (!currentZone) { showZoneModal('enviar'); return; }
  /* Una zona provisoria vale para MIRAR, no para entregar: el pedido iria a la
     hoja equivocada, con el envio y el descuento de una zona que el cliente
     nunca eligio. En la practica no se llega aca —para tener algo en el
     carrito ya hubo que elegirla—, pero es la ultima puerta y las puertas se
     cierran todas. */
  if (zonaProvisoria) { showZoneModal('enviar'); return; }

  const nombre = $id('f-nombre').value.trim();
  const telefono = $id('f-telefono').value.trim();
  const dia = $id('f-dia').value;
  const z = ZONAS[currentZone];
  const fechaISOEarly = $id('f-dia-fecha') ? $id('f-dia-fecha').value : '';
  const horario = _getHorarioForFecha(currentZone, dia, fechaISOEarly);
  const pagoEl = document.querySelector('input[name="pago"]:checked');

  // Limpiar errores
  ['f-nombre','err-nombre','f-telefono','err-telefono','f-dia','err-dia'].forEach((id,i) => {
    if (i%2===0) { const el=$id(id); if(el) el.classList.remove('error'); }
    else { const el=$id(id); if(el) el.classList.remove('visible'); }
  });
  clearError('f-nombre','err-nombre');
  clearError('f-telefono','err-telefono');
  clearError('f-dia','err-dia');
  $id('err-pago').classList.remove('visible');

  if (currentZone === 'estancias') {
    clearError('f-barrio-privado','err-barrio-privado');
    clearError('f-barrio','err-barrio');
    clearError('f-lote','err-lote');
  } else if (currentZone === 'clubes') {
    clearError('f-club','err-club');
    clearError('f-deporte','err-deporte');
    clearError('f-grupo','err-grupo');
  } else {
    clearError('f-pilar-barrio','err-pilar-barrio');
    clearError('f-direccion','err-direccion');
    clearError('f-lote-pilar','err-lote-pilar');
  }

  if (cartCount() === 0) { toast('⚠️ Agregá al menos un producto'); return; }

  // Validar campos
  let primerInvalido = null;
  if (!nombre) { showError('f-nombre','err-nombre'); if(!primerInvalido) primerInvalido=$id('f-nombre'); }

  let barrioPrivado='', barrio='', lote='', direccion='', club='', deporte='', grupo='';
  if (currentZone === 'estancias') {
    barrioPrivado = $id('f-barrio-privado').value;
    barrio = barrioPrivado === 'Estancias del Pilar' ? $id('f-barrio').value : barrioPrivado;
    lote = $id('f-lote').value.trim();
    if (!barrioPrivado) { showError('f-barrio-privado','err-barrio-privado'); if(!primerInvalido) primerInvalido=$id('f-barrio-privado'); }
    if (barrioPrivado === 'Estancias del Pilar' && !barrio) { showError('f-barrio','err-barrio'); if(!primerInvalido) primerInvalido=$id('f-barrio'); }
    if (!lote) { showError('f-lote','err-lote'); if(!primerInvalido) primerInvalido=$id('f-lote'); }
  } else if (currentZone === 'clubes') {
    club = $id('f-club').value;
    deporte = $id('f-deporte').value;
    grupo = $id('f-grupo').value;
    if (!club) { showError('f-club','err-club'); if(!primerInvalido) primerInvalido=$id('f-club'); }
    if (!deporte) { showError('f-deporte','err-deporte'); if(!primerInvalido) primerInvalido=$id('f-deporte'); }
    if (!grupo) { showError('f-grupo','err-grupo'); if(!primerInvalido) primerInvalido=$id('f-grupo'); }
  } else {
    // Pilar: dropdown barrio + opción "Otro" (input libre)
    var pilarSel = $id('f-pilar-barrio').value;
    lote = $id('f-lote-pilar').value.trim();
    if (!pilarSel) {
      showError('f-pilar-barrio','err-pilar-barrio'); if(!primerInvalido) primerInvalido=$id('f-pilar-barrio');
    } else if (pilarSel === '__otro__') {
      direccion = $id('f-direccion').value.trim();
      if (!direccion) { showError('f-direccion','err-direccion'); if(!primerInvalido) primerInvalido=$id('f-direccion'); }
    } else {
      direccion = pilarSel;
    }
    if (!lote) { showError('f-lote-pilar','err-lote-pilar'); if(!primerInvalido) primerInvalido=$id('f-lote-pilar'); }
  }

  if ($id('f-telefono').value.replace(/\D/g,'').length < 8) { showError('f-telefono','err-telefono'); if(!primerInvalido) primerInvalido=$id('f-telefono'); }
  if (!dia) {
    showError('f-dia','err-dia');
    var _dpRoot = $id('day-picker');
    if (_dpRoot) _dpRoot.classList.add('error');
    if(!primerInvalido) primerInvalido=_dpRoot || $id('f-dia');
  }
  if (!pagoEl) { $id('err-pago').classList.add('visible'); if(!primerInvalido) primerInvalido=$id('pago-group'); }
  if (primerInvalido) {
    primerInvalido.scrollIntoView({behavior:'smooth',block:'center'});
    /* Y ademas el FOCO, que faltaba: sin el, la pagina te lleva hasta el campo
       que falta y ahi te suelta — hay que tocarlo a mano para poder escribir,
       con el teclado del celular todavia cerrado. Con foco se escribe derecho.
       · preventScroll para no pelearse con el scrollIntoView suave de arriba:
         el foco por si solo salta de golpe y se pierde el hacia donde vamos.
       · Un contenedor (pago-group, day-picker) no toma foco: se busca adentro
         el primer control de verdad, y si no hay ninguno no se fuerza nada. */
    var _aFocar = /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(primerInvalido.tagName)
      ? primerInvalido
      : primerInvalido.querySelector('input,select,textarea,button');
    if (_aFocar) { try { _aFocar.focus({preventScroll:true}); } catch(e) { try { _aFocar.focus(); } catch(e2){} } }
    return;
  }

  /* Con carne reservada, la entrega es el dia que llega o despues. El chip de
     arriba ya lo cuida (_reservasSegunFecha), pero el dia del formulario se
     elige aparte. */
  if (hayReservaEnCarrito() && fechaISOEarly && !_fechaSirveReserva(fechaISOEarly)) {
    var _dpRes = $id('day-picker');
    if (_dpRes) { _dpRes.classList.add('error'); _dpRes.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    toast('⚠️ La carne reservada llega ' + _paraCuando(reservaLlega()) + ': elegí ese día o uno posterior', 5000);
    return;
  }

  // Guardar en localStorage. Por la MISMA función que el guardado incremental:
  // dos formas de guardar el mismo dato se despegan sola.
  guardarDatosCliente({ dia: dia, pago: pagoEl.value });
  guardarUltimoPedido();

  // Construir mensaje WhatsApp
  const subtotal = cartTotal(), discount = getTotalDiscount(), shipping = getShipping(), saldoAFavor = getSaldoAFavor(), total = subtotal - discount + shipping - saldoAFavor;
  // Combos: el precio cerrado se traduce en un descuento sobre el valor
  // individual de los componentes, para que el Sheet vea productos reales a
  // precio de lista y el ahorro del combo quede como descuento (total intacto).
  const comboSavingsTotal = Object.values(comboCart).reduce((s,inst) => {
    const c = COMBO_MAP[inst.comboId]; if (!c) return s;
    return s + Math.max(0, comboNaturalSumComp(inst.comp) - c.precio) * inst.qty;
  }, 0);
  const naturalSubtotal = subtotal + comboSavingsTotal;     // productos + componentes a precio lista
  const descuentoSheet  = discount + comboSavingsTotal;     // descuentos vigentes + ahorro de combos

  const comboLinesWA = Object.values(comboCart).map((inst) => {
    const c = COMBO_MAP[inst.comboId]; if (!c) return null;
    // Sin emoji: en algunos celulares el emoji llega a WhatsApp como "�" (ver
    // _WA_SIN_EMOJI, mas abajo). El nombre del combo ya lleva la identidad
    // ("Combo Argentina · 16avos") y va en negrita.
    const head = '*' + c.nombre + (inst.qty > 1 ? ' ×' + inst.qty : '') + '*  —  ' + ars(c.precio * inst.qty);
    // Agrupar componentes repetidos: 3 slots de Franui → "Franui Leche ×3".
    // Se descarta el prefijo de categoría ("Pizzas:/Postre:") — es ruido; el
    // nombre del producto ya se entiende solo.
    const counts = {};
    (inst.picks || []).forEach(pk => {
      const nom = _optLabel(pk.nombre, pk.label);
      counts[nom] = (counts[nom] || 0) + 1;
    });
    const comps = Object.entries(counts).map(([nom, n]) => {
      const totalN = n * inst.qty;
      // Cantidad como número adelante, siempre ("3 Franui Leche", "1 Pack
      // Muzarella x2"): el nº es cuántos, el resto es el nombre. Sin ambigüedad.
      return '     • ' + totalN + ' ' + nom;
    }).join('\n');
    return head + (comps ? '\n' + comps : '');
  }).filter(Boolean).join('\n\n');
  const prodLinesProductos = Object.entries(cart).map(([id,qty]) => {
    const p = PROD_MAP[id]; if (!p) return null;
    // Cantidad como número adelante, siempre ("2 Pack Muzarella x2",
    // "3 Sorrentinos Cordero"): el nº es cuántos, el resto es el nombre.
    return '  • ' + qty + ' ' + p.nombre + '  —  ' + ars(p.precio * qty);
  }).filter(Boolean).join('\n');
  // Cuando hay combo Y productos sueltos, un encabezado "Además:" deja clarísimo
  // qué entra en el combo y qué es adicional (hoy se confunden).
  const _sepAdemas = (comboLinesWA && prodLinesProductos) ? '\nAdemás:' : '';
  /* La carne va con el peso de CADA pieza, no con el total del corte: el
     cliente eligio esas piezas y tiene que poder controlarlas una por una
     cuando le llega el pedido. */
  const piezaLinesWA = (function () {
    return piezasAgrupadas().map(function (g) {
      if (g.reserva) return '  \u2022 ' + g.nombre + '  \u2014  reserva de ' + _kgCorto(g.kg) + ' \u00b7 aprox. ' + ars(g.total);
      /* El desglose solo desde DOS piezas: con una sola, "1,163 kg (1,163 kg)"
         repite el mismo numero y se lee como un error. Mismo criterio que el
         carrito. */
      var desglose = g.lista.length > 1
        ? '\n     (' + g.lista.map(function (x) { return kgTexto(x.kg); }).join(' + ') + ')'
        : '';
      /* Con la misma vineta que el resto de los productos, sin el emoji de la
         carne: ver _WA_SIN_EMOJI. */
      return '  \u2022 ' + g.nombre + '  \u2014  ' + kgTexto(g.kg) + ' \u00b7 ' + ars(g.total) + desglose;
    }).join('\n');
  })();
  const prodLines = [comboLinesWA, _sepAdemas, prodLinesProductos, piezaLinesWA].filter(Boolean).join('\n');

  let direccionStr;
  if (currentZone === 'estancias') {
    const barrioInfo = barrioPrivado === 'Estancias del Pilar' ? barrioPrivado + ' — ' + barrio : barrioPrivado;
    direccionStr = barrioInfo + ', Lote ' + lote;
  } else if (currentZone === 'clubes') {
    direccionStr = club + ' — ' + deporte + ' — ' + grupo;
  } else {
    direccionStr = direccion + ', ' + lote;
  }

  const z2 = ZONAS[currentZone];
  const fechaISO = $id('f-dia-fecha') ? $id('f-dia-fecha').value : '';
  const horarioStr = _getHorarioForFecha(currentZone, dia, fechaISO);
  // fechaFull  = "22/04/2026" → va al Sheets (col "Día de entrega")
  // diaMensaje = "Miércoles 22/04" → va al WhatsApp del cliente
  let fechaFull = '';
  let diaMensaje = dia;
  if (fechaISO) {
    const _fp = fechaISO.split('-');
    fechaFull = _fp[2] + '/' + _fp[1] + '/' + _fp[0];
    diaMensaje = dia + ' ' + _fp[2] + '/' + _fp[1];
  }
  const diaSheets = fechaFull || dia;
  const entregaStr = diaMensaje + (horarioStr && horarioStr !== 'A coordinar' ? ' de ' + horarioStr : '');
  const pagoStr = pagoEl.value === 'Efectivo' ? 'Efectivo' : 'Mercado Pago';

  // Detectar si barrio tiene vendedor asignado (Pilar + barrio match)
  let vendedorMatch = null;
  if (currentZone === 'pilar' && direccion) {
    vendedorMatch = barrioToVendedor[direccion.toLowerCase()] || null;
    /* Con carne, un barrio escrito a mano en "Otra zona" no se manda al
       vendedor aunque coincida con uno suyo: el pedido iria a la hoja Red, que
       no tiene columnas de carne, y los kilos no se guardarian. Lo entrega
       Maleu, que es lo que la pantalla le dijo al cliente ("Te lo entrega
       Maleu"). Sin carne sigue como siempre. */
    if (vendedorMatch && Object.keys(piezaCart).length && _pilarEntregaMaleu()) vendedorMatch = null;
    /* Y el cliente que trajimos nosotros no se le asigna a nadie: el pedido va
       a la hoja Pilar y lo entrega Maleu (24/9/2026). `barrioToVendedor` mira
       el barrio, que sigue siendo el de Rufo — lo que cambia es de quien es la
       venta. */
    if (vendedorMatch && _esNuestro()) vendedorMatch = null;
  }

  // Mensaje unificado: mínimo imprescindible para el cliente.
  // Los datos del cliente (nombre, tel, dirección, pago) los ve Maleu en el ERP
  // y no se repiten en el WhatsApp — SALVO cuando la web no llegó a confirmar
  // el pedido (11/9/2026): ahí el WhatsApp es la única copia y va completo.
  // El día de entrega sí va siempre: al cliente le sirve de confirmación.
  const cuponDescW = getCouponDiscount();
  const autoDescW  = getCashDiscount();
  var msgLines = ['Hola! Quiero hacer un pedido:', '', prodLines, ''];
  if (_premioActivo()) msgLines.push('🎁 Premio de la ruleta (' + appliedCoupon.codigo + '): ' + (appliedCoupon.mensaje || ''), '');
  // Solo desglosar Subtotal cuando hay descuento, envío o saldo a favor.
  if (discount > 0 || shipping > 0 || saldoAFavor > 0) {
    msgLines.push('Subtotal: ' + ars(subtotal));
    if (cuponDescW > 0 && appliedCoupon) msgLines.push('Cupón ' + appliedCoupon.codigo + ': -' + ars(cuponDescW));
    if (autoDescW > 0) msgLines.push(getDiscountLabel() + (combosInCart() ? ' (productos)' : '') + ': -' + ars(autoDescW));
    if (shipping > 0) msgLines.push('Envio: ' + ars(shipping));
    if (saldoAFavor > 0) msgLines.push('Saldo a favor: -' + ars(saldoAFavor));
  }
  var _hayRes = hayReservaEnCarrito();
  msgLines.push('*Total: ' + ars(total) + '*' + (_hayRes ? ' (aprox.)' : ''));
  /* Sin emoji (ver _WA_SIN_EMOJI) y con la voz del cliente: el mensaje lo
     manda el. */
  if (_hayRes) msgLines.push('La carne reservada me la confirman cuando llegue (' + _diaYFecha(reservaLlega()) + ').');
  // Alias de Mercado Pago cuando el cliente elige Transferencia:
  //   - Sin vendedor Red (Home / 'Otra zona' de Pilar): alias maleu (maleump).
  //   - Con vendedor Red y ALIAS cargado en Sheets: alias del vendedor.
  //   - Con vendedor Red sin alias: no ponemos alias — el vendedor lo pasa a mano.
  /* El alias va aparte y AL FINAL del mensaje: es lo que el cliente copia.
     Entre el total y el alias va el dia de entrega, que se arma mas abajo. */
  var aliasLines = [];
  if (pagoEl.value === 'Transferencia') {
    if (!vendedorMatch) {
      /* Las dos cuentas de Maleu: el cliente transfiere a la que le quede
         comoda. Van con el banco adelante porque el alias solo no dice a que
         app entrar. */
      aliasLines.push('');
      aliasLines.push(_hayRes ? 'Para transferir cuando me confirmen el total:'
        : ALIAS_MALEU.length > 1 ? 'Para transferir, cualquiera de las dos:' : 'alias:');
      ALIAS_MALEU.forEach(function (c) {
        aliasLines.push('\u2022 ' + c.banco + ': *' + c.alias + '*');
      });
    } else if (vendedorMatch.alias) {
      aliasLines.push('');
      aliasLines.push('alias: *' + vendedorMatch.alias + '*');
    }
  }

  // Registrar en Google Sheets — los combos se EXPANDEN a sus productos reales
  // y se fusionan con los productos sueltos por id (qty sumada). Así el stock se
  // descuenta bien, abastecimiento ve los productos y analytics no se rompe.
  const expanded = {};
  Object.entries(cart).forEach(([id,qty]) => { const p = PROD_MAP[id]; if (!p) return; expanded[p.id] = (expanded[p.id] || 0) + qty; });
  Object.values(comboCart).forEach((inst) => {
    inst.comp.forEach(ci => { const p = PROD_MAP[ci.id]; if (!p) return; expanded[ci.id] = (expanded[ci.id] || 0) + ci.qty * inst.qty; });
  });
  const items = Object.entries(expanded).map(([id,qty]) => {
    const p = PROD_MAP[id]; return p ? {id:p.id, nombre:p.nombre, qty, precio:p.precio} : null;
  }).filter(Boolean);
  /* La carne entra como un item mas, con la cantidad EN KILOS: es lo que
     guarda la columna de la hoja y de lo que salen el precio, el costo, el
     margen y el sugeridor de compra. Los ids de las piezas viajan aparte: con
     ellos el backend marca cada pieza Asignada a este pedido, y ARMADO y RUTA
     dicen que pieza buscar en el freezer. */
  var reservaCortes = {};
  (function () {
    var porCorte = {};
    Object.keys(piezaCart).forEach(function (pid) {
      var it = piezaCart[pid];
      /* La reserva va sola: sin piezas y con reserva:true. El ERP guarda los
         kilos como un pesaje pendiente y la marca "Reserva a confirmar"
         (contrato con Backend, 17/9/2026). */
      if (it.reserva) {
        items.push({ id: it.id, nombre: it.nombre, qty: it.kg, precio: (PROD_MAP[it.id] || {}).precio || 0,
                     unidad: 'kg', abbr: it.abbr, importe: it.precio, piezas: [], reserva: true });
        reservaCortes[it.abbr] = it.kg;
        return;
      }
      var g = porCorte[it.abbr] = porCorte[it.abbr] || { id: it.id, nombre: it.nombre, kg: 0, precio: 0, piezas: [] };
      g.kg += it.kg; g.precio += it.precio; g.piezas.push(pid);
    });
    Object.keys(porCorte).forEach(function (abbr) {
      var g = porCorte[abbr];
      var item = { id: g.id, nombre: g.nombre,
                   /* al gramo: mas precision no la da ninguna balanza, y sin
                      redondear un 1.2000000000000002 llega tal cual a la hoja */
                   qty: Math.round(g.kg * 1000) / 1000,
                   precio: (PROD_MAP[g.id] || {}).precio || 0,
                   unidad: 'kg', abbr: abbr, importe: g.precio, piezas: g.piezas };
      items.push(item);
    });
  })();
  // Trazabilidad del combo (receta + sabores elegidos) para uso futuro del backend / Panel.
  const combosPayload = Object.values(comboCart).map((inst) => {
    const c = COMBO_MAP[inst.comboId]; if (!c) return null;
    return { id:c.id, nombre:c.nombre, precio:c.precio, qty:inst.qty,
      picks: (inst.picks || []).map(pk => ({ label:pk.label, id:pk.prodId, nombre:pk.nombre })),
      items: inst.comp.map(ci => ({ id:ci.id, qty:ci.qty, precio:(PROD_MAP[ci.id]||{}).precio || 0 })) };
  }).filter(Boolean);

  let postData;
  if (currentZone === 'clubes') {
    postData = {
      canal: 'Clubes',
      fecha: new Date().toLocaleString('es-AR'),
      nombre, telefono, club, deporte, grupo,
      dia: diaSheets, horario, fechaEntrega: fechaISO, pago: pagoEl.value,
      envio: shipping, items, total,
      subtotalSinDescuento: naturalSubtotal, descuento: descuentoSheet
    };
  } else if (vendedorMatch) {
    // Pilar con barrio cubierto por vendedor → va al canal Red
    postData = {
      canal: 'Red',
      fecha: new Date().toLocaleString('es-AR'),
      vendedor: vendedorMatch.nombre,
      nombre, telefono,
      barrioPrivado: vendedorMatch.barrio,
      lote: lote,
      dia: diaSheets, horario, fechaEntrega: fechaISO, pago: pagoEl.value,
      envio: shipping, items, total
    };
  } else {
    postData = {
      canal: z.canal,
      fecha: new Date().toLocaleString('es-AR'),
      nombre, barrioPrivado,
      subBarrio: barrioPrivado === 'Estancias del Pilar' ? barrio : '',
      barrio: currentZone === 'estancias' ? barrio : direccion,
      lote, telefono, dia: diaSheets, horario, fechaEntrega: fechaISO,
      pago: pagoEl.value,
      envio: shipping, items, total,
      subtotalSinDescuento: naturalSubtotal, descuento: descuentoSheet,
      saldoAplicado: saldoAFavor  // backend lo escribe negativo en col BI/BL del pedido
    };
  }
  /* De que compra es la reserva y cuantos kilos de cada corte: con esto el ERP
     suma lo reservado sin releer los pedidos en cada consulta de la tienda. */
  if (Object.keys(reservaCortes).length && reservaInfo) {
    postData.reservaCarne = { llega: reservaInfo.llega, cortes: reservaCortes };
  }
  /* De donde salio el cliente, cuando lo trajimos nosotros. El backend ignora
     los campos que no conoce, asi que esto no rompe nada mientras no lo lea. */
  var _org = _origenNuestroTexto();
  if (_org) postData.origenDetalle = _org;
  // Metadata de combos (trazabilidad). El backend ignora campos que no conoce;
  // queda listo para cuando el Panel desglose el combo desde la receta.
  if (combosPayload.length) {
    postData.combos = combosPayload;
    postData.comboDetalle = JSON.stringify(combosPayload);
    // CLAVE: con combos el descuento que mando (= ahorro del combo) es la
    // autoridad. Sin este flag el backend RECALCULA el descuento (10%/0%) y
    // pisaría el precio cerrado del combo, cobrando mal (ej. el subtotal a
    // precio de lista). El backend respeta descuento+total tal cual (línea
    // ~4182 de apps-script.gs) → total = subtotalSinDescuento - ahorro combo.
    postData.descuentoManualEsAutoridad = true;
  }
  // ID único para idempotencia: si el cliente reintenta por mala señal y el POST
  // anterior ya había llegado al server, el backend lo descarta (CacheService 6h).
  //
  // Firma del pedido = canal+telefono+items+total. Si el cliente aprieta el botón
  // 2 veces con el MISMO pedido (típico en señal mala: ve error, reintenta), el
  // clientOrderId se REUSA → backend dedupea. Fix del 21/06/26 tras duplicados
  // Vie/Sáb 19-20/06 en Estancias que hubo que borrar a mano del Sheets.
  postData.clientOrderId = _clientOrderIdForOrder(postData);
  /* El mensaje de WhatsApp se arma recien aca, cuando ya existe el
     clientOrderId. Son DOS versiones:
       · msgNormal       — el backend confirmo: el pedido ya esta en el ERP.
       · msgSinConfirmar — a los 25 s no hubo confirmacion y el cliente lo manda
         igual. Lleva los datos para cargarlo a mano y DICE que la web no lo
         confirmo: sin eso, en WhatsApp se ve igual que uno registrado, que es
         exactamente como se perdio un pedido de $84.600 el 10/9/2026.
     La primera linea ("Hola! Quiero hacer un pedido:") no se toca: si alguna
     regla de WATI la busca tal cual, cambiarla la romperia sin avisar.

     LA REFERENCIA VA SOLO EN EL SIN CONFIRMAR (12/9/2026). Del 11 al 12/9 el
     normal cerraba con "_Pedido web · G4ZDJ_", y Tadeo: "eso queda feisimo".
     Tenia razon y ademas sobraba: desde el 11/9 un mensaje normal SOLO sale con
     el pedido ya confirmado por el ERP, asi que no hay nada que cruzar. La
     referencia sirve cuando la web no llego a confirmar, para buscar en Log
     Pedidos (col H) si un reintento lo metio despues: el telefono del
     formulario viene mal tipeado seguido.

     _WA_SIN_EMOJI — el mensaje no lleva emoji de 4 bytes (📅 📍 🎁 🥩...).
     Medido en WATI el 12/9/2026: de 8 pedidos confirmados con el mismo codigo,
     2 llegaron con "� Sabado 12/09" y 6 sanos. Depende del celular del
     cliente, no del codigo (el archivo tiene el 📅 bien escrito). Los
     caracteres simples · • — × si llegan en esos mismos mensajes, asi que
     se usan esos y texto. El ⚠️ se queda: es U+26A0, un caracter simple. */
  var _refPedido = _refDePedido(postData.clientOrderId);
  var _lineaDia = 'Entrega: ' + diaMensaje + (horarioStr && !/coordinar/i.test(horarioStr) ? ' · ' + horarioStr : '');
  var msgNormal = msgLines.concat(['', _lineaDia], aliasLines).join('\n');
  /* EL TEXTO DEL SIN CONFIRMAR (25/9/2026). Tadeo, viendo uno que le llego:
     "muy feo el detalle del mensaje como queda". Tenia razon, y eran dos cosas:
       · Los rotulos ("A nombre de:", "Direccion:") hacian parecer un formulario
         volcado en un chat. Los datos se leen igual sin ellos.
       · "La web no llego a confirmar este pedido" esta escrito en tercera
         persona sobre un sistema, pero el que manda el mensaje es el CLIENTE.
         Ahora lo dice como lo diria una persona.
     Lo que NO cambia: que los datos esten. Existen para que Tadeo lo pueda
     cargar a mano, que es el unico caso en que este mensaje sale. */
  var msgSinConfirmar = msgLines.concat(['',
    _lineaDia,
    nombre + ' · ' + telefono,
    direccionStr,
    'Pago: ' + (pagoEl.value === 'Efectivo' ? 'Efectivo' : 'Transferencia'),
    '',
    '⚠️ No me apareció la confirmación en la web, así que te lo mando por acá (ref. ' + _refPedido + ')'
  ], aliasLines).join('\n');
  // Cumpleaños del cliente (si lo cargó en el form) → backend lo guarda en Clientes Meta.
  var _cumple = getCumpleValue();
  if (_cumple) postData.cumple = _cumple;
  // Cupón aplicado: lo mando al backend para tracking futuro y best-effort sumo uso al cerrar.
  /* Un premio de la ruleta que no llega a su minimo NO viaja: no se usa y queda
     guardado en el celular para el proximo pedido. */
  var _cuponVa = !!(appliedCoupon && (appliedCoupon.tipo !== 'REGALO' || _premioActivo()));
  if (_cuponVa) {
    postData.cupon = appliedCoupon.codigo;
    postData.cuponDescuento = cuponDescW;
  }
  _track('purchase', { value: total, orderId: postData.clientOrderId, zone: currentZone, items: cartCount(), discount: discount, payment: pagoEl.value, cupon: appliedCoupon ? appliedCoupon.codigo : '', vendedor: vendedorMatch ? vendedorMatch.nombre : '' });

  /* ── EL PEDIDO SE DA POR REGISTRADO SOLO CUANDO EL BACKEND LO CONFIRMA (11/9/2026) ──
     Hasta ese dia la tienda mandaba al cliente a WhatsApp a los 3,8 s si
     `navigator.sendBeacon` devolvia true. Pero true solo quiere decir "el
     navegador lo puso en la cola", no "llego". Y como Apps Script tarda como
     minimo ~5 s en contestar, la confirmacion por fetch no llegaba NUNCA dentro
     de los 3 s: el 100% de los pedidos salia por ese camino optimista.
     Si el beacon no salia (mala señal, el navegador cerrado al saltar a
     WhatsApp), el pedido se perdia sin un error en ningun lado, mientras el
     mensaje le llegaba igual a Maleu: WhatsApp guarda y reenvia aunque no
     haya señal. Asi se perdio un pedido de $84.600 el 10/9/2026.

     Ahora: UN POST por fetch y se ESPERA el {ok:true} (~7-9 s). Recien ahi
     WhatsApp. A los 25 s sin confirmacion, el cliente lo puede mandar igual,
     pero con un mensaje que dice que la web no lo confirmo. */
  _enviando = true;
  const waTarget = vendedorMatch ? vendedorMatch.wa : WA_NUMBER;
  const waBtn = document.querySelector('.whatsapp-btn');
  const waBtnOrig = waBtn ? waBtn.innerHTML : '';
  if (waBtn) { waBtn.disabled = true; waBtn.innerHTML = 'Enviando…'; waBtn.style.background = '#2e7d32'; }
  showSendLoader();

  var _terminado = false;
  var tLento = setTimeout(function () { if (!_terminado) setSendLoaderLento(); }, SEND_LENTO_MS);
  var tFallback = setTimeout(function () {
    if (_terminado) return;
    /* Antes de decirle al cliente que la web no confirmó, PREGUNTAR si entró.
       En el 38% de los casos entró y la respuesta no volvió: sin esto, esos
       clientes mandan un pedido guardado marcado como dudoso, y Tadeo no sabe
       si cargarlo a mano (y si lo carga, lo duplica). */
    _pedidoEntro(postData.clientOrderId).then(function (entro) {
      if (_terminado) return;
      if (entro) { _irAWhatsApp(msgNormal, true); return; }
      _fallbackWhatsApp();
    });
  }, SEND_FALLBACK_MS);

  function _fallbackWhatsApp() {
    setSendLoaderFallback(function () {
      /* Ultimo intento antes de irse: el beacon sobrevive a que la pagina
         cambie. Si llega junto con el fetch que sigue en vuelo, el backend
         descarta el repetido por clientOrderId. */
      _beaconPendientes();
      _irAWhatsApp(msgSinConfirmar, false);
    });
  }

  function _irAWhatsApp(texto, confirmado) {
    if (_terminado) return;
    _terminado = true;
    clearTimeout(tLento); clearTimeout(tFallback);
    if (confirmado) {
      if (waBtn) waBtn.innerHTML = '✓ Pedido registrado';
      setSendLoaderSuccess();
    }
    // Best-effort: sumar uso al cupón. No bloqueamos el flujo si falla.
    if (_cuponVa && appliedCoupon && appliedCoupon.tipo === 'REGALO') { try { localStorage.removeItem(CUPON_GUARDADO); } catch (_e) {} }
    if (_cuponVa && appliedCoupon) {
      try {
        var blob = new Blob([JSON.stringify({ action: 'usarCupon', codigo: appliedCoupon.codigo })], { type: 'text/plain;charset=utf-8' });
        if (navigator.sendBeacon) navigator.sendBeacon(APPS_SCRIPT_URL, blob);
        else fetch(APPS_SCRIPT_URL, { method:'POST', body: blob, mode:'no-cors', keepalive: true }).catch(function(){});
      } catch(_e) {}
    }
    // Con confirmacion, un respiro para que se vea el check verde.
    setTimeout(function () {
      window.location.href = 'https://wa.me/' + waTarget + '?text=' + encodeURIComponent(texto);
    }, confirmado ? 800 : 0);
    setTimeout(() => {
      cart = {}; comboCart = {}; piezaCart = {}; updateUI();
      getActiveProducts().forEach(p => renderCardFooter(p.id));
      getActiveCombos().forEach(c => renderComboFooter(c.id));
      $id('f-dia').value = '';
      if ($id('f-dia-fecha')) $id('f-dia-fecha').value = '';
      onDiaChange();
      renderDayPicker();
      document.querySelectorAll('input[name="pago"]').forEach(r => r.checked = false);
      removeCoupon();
      if (waBtn) { waBtn.disabled = false; waBtn.innerHTML = waBtnOrig; waBtn.style.background = ''; }
      _enviando = false;
      hideSendLoader();
      updateFormVisibility();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1800);
  }

  /* La confirmacion puede venir del primer intento o de cualquier reintento:
     por eso se escucha por clientOrderId y no la promesa del primer POST. */
  _alConfirmar(postData.clientOrderId, function () { _irAWhatsApp(msgNormal, true); });
  _sendWithRetry(postData).catch(function () { /* los reintentos siguen solos; a los 25 s decide el fallback */ });
}

/* Referencia corta del pedido para el mensaje de WhatsApp que la web NO llego
   a confirmar (el normal no la lleva desde el 12/9/2026): 5 caracteres del
   clientOrderId (co_<epoch>_<azar>). Con ella el mensaje se cruza con Log
   Pedidos (col H) sin depender del telefono, que en el formulario viene mal
   tipeado seguido: 3 de los 21 pedidos del 31/8 al 10/9 traian un 15 donde iba
   un 11. */
function _refDePedido(coid) {
  var azar = String(coid || '').split('_').pop();
  return azar.length >= 3 ? azar.slice(0, 5).toUpperCase() : '';
}

/* Dispara solo el sendBeacon con el postData. Devuelve true si el navegador
   lo ACEPTO EN SU COLA — no quiere decir que haya llegado, y por eso nunca
   cuenta como confirmacion (asi se perdieron pedidos hasta el 11/9/2026). */
function _tryBeaconOnly(postData) {
  try {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return false;
    var blob = new Blob([JSON.stringify(postData)], { type: 'text/plain;charset=UTF-8' });
    return navigator.sendBeacon(APPS_SCRIPT_URL, blob) === true;
  } catch (e) { return false; }
}

/* ── REINTENTOS — rehechos el 11/9/2026 ──
   El pedido sale por UN solo camino, fetch, y se espera su {ok:true}.
   1. Se guarda en localStorage ANTES de mandarlo (sobrevive a cerrar la tienda).
   2. Un solo POST en vuelo por pedido (`_enVuelo`). Antes cada reintento
      disparaba un sendBeacon MAS un fetch, y el intervalo de 30 s arrancaba
      otra cadena encima de la que ya corria: un pedido del 11/9 llego 18 veces
      a Apps Script, y cada una toma el lock de doPost que usa todo el ERP.
   3. Tope de 30 s por intento, no 12: doPost espera el lock hasta 30 s, y
      abortar antes no cancela nada en el servidor — solo fabrica un reintento.
   4. Backoff de 2 s, 4 s, 8 s, 15 s... hasta 15 min. Los primeros son cortos
      porque el cliente esta mirando la pantalla.
   5. sendBeacon queda como ULTIMO recurso, cuando la pagina se va con un
      pedido sin confirmar (pagehide / hidden). Nunca cuenta como confirmacion.
   6. El backend deduplica por clientOrderId (CacheService 6 h).
   Estructura en localStorage: { [clientOrderId]: { data, ts, tries } } */
var MALEU_RETRY_DELAYS = [2000, 4000, 8000, 15000, 30000, 60000, 120000, 300000, 900000]; // ms
var MALEU_MAX_TRIES = MALEU_RETRY_DELAYS.length + 1;  // despues espera al proximo evento
var MALEU_FETCH_TIMEOUT_MS = 30000;
var SEND_LENTO_MS = 8000;       // "la conexion esta lenta"
var SEND_FALLBACK_MS = 25000;   // se ofrece mandarlo por WhatsApp sin confirmar

// ── SIGNATURE-BASED IDEMPOTENCY (21/06/26) ────────────────────────────
// Si el cliente aprieta 'Pedir por WhatsApp' 2 veces con el MISMO pedido
// (típico cuando ve un error y reintenta), reusamos el clientOrderId anterior
// para que el backend deduplique (CacheService 6h). Antes cada intento
// generaba un ID nuevo → se creaban duplicados en Sheets. Ventana: 30 min.
function _orderSignature(postData) {
  var itemsKey = ((postData && postData.items) || [])
    .slice()
    .sort(function(a,b){ return Number(a.id) - Number(b.id); })
    .map(function(it){ return it.id + 'x' + it.qty; })
    .join(',');
  return [
    postData.canal || '',
    (postData.telefono || '').toString().replace(/\D/g,''),
    postData.dia || '',
    itemsKey,
    Math.round(Number(postData.total) || 0)
  ].join('|');
}
function _clientOrderIdForOrder(postData) {
  var sig = _orderSignature(postData);
  var map = {};
  try { map = JSON.parse(localStorage.getItem('maleu_order_sigs') || '{}'); } catch(e) {}
  var now = Date.now();
  // Limpiar entradas viejas (>30 min) para no crecer indefinidamente
  Object.keys(map).forEach(function(k) {
    if (!map[k] || now - (map[k].ts || 0) > 1800000) delete map[k];
  });
  var oid = (map[sig] && map[sig].oid) ? map[sig].oid
          : ('co_' + now + '_' + Math.random().toString(36).slice(2,10));
  map[sig] = { oid: oid, ts: now };
  try { localStorage.setItem('maleu_order_sigs', JSON.stringify(map)); } catch(e) {}
  return oid;
}

function _pendingMap() {
  try { return JSON.parse(localStorage.getItem('maleu_pending_orders') || '{}'); }
  catch(e) { return {}; }
}
function _pendingSave(map) {
  try { localStorage.setItem('maleu_pending_orders', JSON.stringify(map)); } catch(e) {}
}
function _persistPending(data) {
  var key = data.clientOrderId;
  if (!key) return;
  var map = _pendingMap();
  var prev = map[key];
  map[key] = { data: data, ts: (prev && prev.ts) || Date.now(), tries: (prev && prev.tries || 0),
               beacon: (prev && prev.beacon) || 0 };
  _pendingSave(map);
}
function _removePending(key) {
  if (!key) return;
  var map = _pendingMap();
  if (map[key]) { delete map[key]; _pendingSave(map); }
}

var _enVuelo = {};        // clientOrderId -> promesa del POST que espera respuesta
var _programado = {};     // clientOrderId -> setTimeout del proximo reintento
var _alConfirmarCbs = {}; // clientOrderId -> quienes esperan la confirmacion

function _alConfirmar(key, cb) {
  if (!key) return;
  (_alConfirmarCbs[key] = _alConfirmarCbs[key] || []).push(cb);
}
function _confirmado(key, resp) {
  _removePending(key);
  var cbs = _alConfirmarCbs[key] || [];
  delete _alConfirmarCbs[key];
  cbs.forEach(function (cb) { try { cb(resp); } catch (e) {} });
}

/* Un intento: POST por fetch con tope de 30 s. Resuelve SOLO con {ok:true} del
   backend — un dedup tambien es ok: quiere decir que el pedido ya estaba. */
function _postPedido(data) {
  var ctrl = null, tid = null;
  try { ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null; } catch (e) {}
  if (ctrl) tid = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, MALEU_FETCH_TIMEOUT_MS);
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // request "simple": sin preflight CORS
    body: JSON.stringify(data)
  };
  if (ctrl) opts.signal = ctrl.signal;
  return fetch(APPS_SCRIPT_URL, opts).then(function (r) {
    if (!r.ok) throw new Error('http ' + r.status);
    return r.text();
  }).then(function (txt) {
    if (tid) clearTimeout(tid);
    var resp = null;
    try { resp = JSON.parse(txt); } catch (e) {}
    if (resp && resp.ok) return resp;
    throw new Error('server-not-ok: ' + ((resp && (resp.err || resp.error)) || String(txt || '').slice(0, 80)));
  }, function (err) {
    if (tid) clearTimeout(tid);
    throw err;
  });
}

/* ¿El pedido ya entró? — se PREGUNTA, no se supone. (25/9/2026)
 *
 * El 25/9 una clienta mandó su pedido por WhatsApp con el cartel "la web no
 * llegó a confirmar este pedido" y el pedido estaba guardado: entraron los tres
 * POST —el primero y sus dos reintentos, deduplicados— y ninguna de las tres
 * respuestas le volvió al navegador. Medido sobre `Log Pedidos`: **41 de 107
 * pedidos reales (38%) tuvieron reintentos**, o sea que a 4 de cada 10 clientes
 * la confirmación no les llega.
 *
 * Por qué un GET y no arreglar el POST: todavía no se sabe por qué la respuesta
 * del POST no vuelve (la hipótesis del lock compartido se midió y se descartó).
 * Pero los GET de la tienda —catálogo, stock, precios— andan siempre. Así que
 * en lugar de esperar a entender la causa, se usa la vía que funciona.
 *
 * NUNCA rechaza y NUNCA se cuelga: si no se puede saber, devuelve false y el
 * cliente ve el fallback de siempre. El tope es corto a propósito — ya esperó
 * 25 s, y esto se suma a esa espera. */
var PEDIDO_ENTRO_TIMEOUT_MS = 6000;
function _pedidoEntro(coid) {
  if (!coid) return Promise.resolve(false);
  var ctrl = null, tid = null;
  try { ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null; } catch (e) {}
  var opts = ctrl ? { signal: ctrl.signal } : {};
  if (ctrl) tid = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, PEDIDO_ENTRO_TIMEOUT_MS);
  return fetch(APPS_SCRIPT_URL + '?action=pedidoEntro&coid=' + encodeURIComponent(coid), opts)
    .then(function (r) { return r.text(); })
    .then(function (txt) {
      if (tid) clearTimeout(tid);
      var resp = null;
      try { resp = JSON.parse(txt); } catch (e) {}
      /* `ok:false` es "no pude consultar", no "no entró": ante la duda, false,
         que deja el camino de antes. Solo un si explicito cuenta como si. */
      return !!(resp && resp.ok === true && resp.entro === true);
    })
    .catch(function () { if (tid) clearTimeout(tid); return false; });
}

function _sendWithRetry(data) {
  var key = data && data.clientOrderId;
  if (!key) return Promise.reject(new Error('pedido sin clientOrderId'));
  _persistPending(data);
  if (_enVuelo[key]) return _enVuelo[key];   // ya hay uno esperando respuesta: no se duplica
  if (_programado[key]) { clearTimeout(_programado[key]); delete _programado[key]; }
  var p = _postPedido(data).then(function (resp) {
    delete _enVuelo[key];
    _confirmado(key, resp);
    return resp;
  }, function (err) {
    delete _enVuelo[key];
    var map = _pendingMap();
    if (map[key]) {
      map[key].tries = (map[key].tries || 0) + 1;
      map[key].lastError = String((err && err.message) || err);
      _pendingSave(map);
      if (map[key].tries < MALEU_MAX_TRIES) {
        var delay = MALEU_RETRY_DELAYS[Math.min(map[key].tries - 1, MALEU_RETRY_DELAYS.length - 1)];
        _programado[key] = setTimeout(function () {
          delete _programado[key];
          _sendWithRetry(data).catch(function () {});
        }, delay);
      }
      // Agotados los intentos, queda en la cola: _retryPendingOrders lo agarra
      // con el proximo evento (vuelve la señal, vuelve a la tienda, cada 30 s).
    }
    throw err;
  });
  _enVuelo[key] = p;
  return p;
}

/* ahora=true (volvio la señal / volvio a la tienda): se manda ya, aunque haya
   un reintento programado. Sin eso (el intervalo de 30 s): solo los que no
   tienen nada en marcha — antes el intervalo arrancaba una cadena nueva encima
   de la que ya estaba corriendo. */
function _retryPendingOrders(ahora) {
  var map = _pendingMap();
  var keys = Object.keys(map);
  if (keys.length === 0) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  // Descartar pendientes de mas de 4 horas (tests viejos, sesiones anteriores).
  var now = Date.now(), maxAge = 4*3600*1000, cambio = false, aMandar = [];
  keys.forEach(function (k) {
    var entry = map[k];
    if (!entry || !entry.data) { delete map[k]; cambio = true; return; }
    var ts = Number(entry.ts) || 0;
    if (ts > 0 && (now - ts) > maxAge) { delete map[k]; cambio = true; return; }
    if (_enVuelo[k]) return;
    if (_programado[k] && ahora !== true) return;
    entry.tries = 0; cambio = true;
    aMandar.push(entry.data);
  });
  if (cambio) _pendingSave(map);
  aMandar.forEach(function (d) { _sendWithRetry(d).catch(function () {}); });
}

/* Ultimo recurso cuando la pagina se va con un pedido sin confirmar: el beacon
   sobrevive a que se cierre o pase a segundo plano. No trae respuesta, asi que
   el pedido sigue en la cola hasta que un fetch lo confirme; el backend
   descarta el repetido por clientOrderId. */
function _beaconPendientes() {
  var map = _pendingMap(), now = Date.now(), cambio = false;
  Object.keys(map).forEach(function (k) {
    var e = map[k];
    if (!e || !e.data) return;
    if (now - (Number(e.ts) || 0) > 4*3600*1000) return;
    if (e.beacon && now - e.beacon < 20000) return;   // uno cada 20 s como mucho
    if (_tryBeaconOnly(e.data)) { e.beacon = now; cambio = true; }
  });
  if (cambio) _pendingSave(map);
}

// Reintentos oportunos: vuelve la señal, vuelve a la tienda, o cada 30 s.
if (typeof window !== 'undefined') {
  window.addEventListener('online', function () { _retryPendingOrders(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') _retryPendingOrders(true);
    else _beaconPendientes();
  });
  window.addEventListener('pagehide', _beaconPendientes);
}
setInterval(function () { _retryPendingOrders(false); }, 30000);

/* ── TOAST ── */
let _tt;
function toast(msg, duration) { const el=$id('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(_tt); _tt=setTimeout(()=>el.classList.remove('show'), duration || 800); }

/* ── FORM VISIBILITY ── */
function updateFormVisibility() {
  const section = $id('form-section');
  if (!section) return;
  if (cartCount() > 0) {
    section.classList.remove('collapsed');
    // Mostrar hint de descuento si no eligió pago aún
    updatePagoHint();
  }
  updateWhatsappCta();
}

/* Detecta si el form está completo y resalta el botón WhatsApp con
   hint "Último paso" + pulse + glow para que el cliente lo encuentre.
   Bug común: el cliente completa todo y deja la pantalla ahí sin tocar
   el botón final, perdiéndose el pedido. */
function updateWhatsappCta() {
  const wrap = $id('whatsapp-cta-wrap');
  if (!wrap) return;
  const hintText = wrap.querySelector('.wh-hint-text');
  const hintArrow = wrap.querySelector('.wh-arrow');
  const setState = function(cls, arrow, text) {
    wrap.classList.remove('ready', 'missing-pay');
    if (cls) wrap.classList.add(cls);
    if (hintArrow) hintArrow.textContent = arrow;
    if (hintText) hintText.textContent = text;
  };

  // Necesita carrito con items
  if (cartCount() === 0) { setState('', '', 'Último paso: tocá para enviar tu pedido'); return; }
  // Campos comunes salvo pago: nombre, teléfono, fecha de entrega
  const nombre = ($id('f-nombre') && $id('f-nombre').value || '').trim();
  const telDigits = ($id('f-telefono') && $id('f-telefono').value || '').replace(/\D/g,'');
  const fechaIso = $id('f-dia-fecha') ? $id('f-dia-fecha').value : '';
  const dia = $id('f-dia') ? $id('f-dia').value : '';
  const pagoSel = document.querySelector('input[name="pago"]:checked');
  const otherCompleto = !!nombre && telDigits.length >= 8 && !!(fechaIso || dia);
  if (!otherCompleto) { setState('', '', 'Último paso: tocá para enviar tu pedido'); return; }
  // Campos específicos por zona (los revisamos aparte del pago para poder
  // detectar el caso "solo falta pago").
  let zonaCompleto = true;
  if (currentZone === 'estancias') {
    const bp = ($id('f-barrio-privado') && $id('f-barrio-privado').value || '').trim();
    const lote = ($id('f-lote') && $id('f-lote').value || '').trim();
    if (!bp || !lote) zonaCompleto = false;
    // Sub-barrio requerido si eligió Estancias del Pilar
    if (bp === 'Estancias del Pilar') {
      const sb = ($id('f-barrio') && $id('f-barrio').value || '').trim();
      if (!sb) zonaCompleto = false;
    }
  } else if (currentZone === 'pilar') {
    const pb = ($id('f-pilar-barrio') && $id('f-pilar-barrio').value || '').trim();
    const lotep = ($id('f-lote-pilar') && $id('f-lote-pilar').value || '').trim();
    if (!pb || !lotep) zonaCompleto = false;
    if (pb === '__otro__') {
      const dir = ($id('f-direccion') && $id('f-direccion').value || '').trim();
      if (!dir) zonaCompleto = false;
    }
  } else if (currentZone === 'clubes') {
    const club = ($id('f-club') && $id('f-club').value || '').trim();
    const dep = ($id('f-deporte') && $id('f-deporte').value || '').trim();
    const gr = ($id('f-grupo') && $id('f-grupo').value || '').trim();
    if (!club || !dep || !gr) zonaCompleto = false;
  }
  if (!zonaCompleto) { setState('', '', 'Último paso: tocá para enviar tu pedido'); return; }

  // Todo lo demás está OK. Si solo falta pago → hint específico ambar.
  if (!pagoSel) { setState('missing-pay', '⚠️', 'Te falta elegir el método de pago antes de pedir'); return; }

  // Todo listo — el hint clásico verde.
  setState('ready', '', 'Último paso: tocá para enviar tu pedido');
}
function expandForm() {
  const section = $id('form-section');
  if (section) section.classList.remove('collapsed');
  updatePagoHint();
  // Asegurar que la fecha elegida en el modal welcome quede seleccionada
  // en el day-picker del form (por si algún re-render la limpió antes).
  _preselectDayPicker();
  setTimeout(() => document.querySelector('.form-wrap').scrollIntoView({behavior:'smooth'}), 50);
}

/* ── CAT NAV ── */
/* Las fichas de categoria del inicio: una foto por categoria, como puerta de
   entrada al catalogo (7/9/2026, pedido de Tadeo mirando bocado.com.ar).

   La foto sale del producto marcado top:true de esa categoria, y si no hay
   ninguno, del primero. Se deriva de PRODUCTOS en vez de tener su propia
   lista de imagenes: asi una categoria nueva aparece sola, y el dia que se
   renombre una foto no queda un hueco aca sin que nadie se entere. */
function renderCatTiles() {
  const cont = $id('cat-tiles');
  if (!cont) return;
  const cats = getCategoriasVisibles();
  const prods = getActiveProducts();
  let tiles = cats.map(cat => {
    const suyos = prods.filter(p => p.cat === cat.nombre);
    if (!suyos.length) return '';          // categoria sin productos en esta zona
    // cat.img gana si esta: hay categorias cuya mejor foto no es la de
    // ninguno de sus productos.
    const foto = cat.img || (suyos.find(p => p.top) || suyos[0]).img;
    const slug = slugify(cat.nombre);
    /* El contador dice lo que se puede ELEGIR: con dos cortes sin stock,
       "5 opciones" promete de mas. Solo cambia algo en Carnes — en el resto
       carneAgotada es siempre false. */
    const elegibles = suyos.filter(p => !carneAgotada(p) || reservable(p)).length;
    const cuenta = elegibles ? elegibles + (elegibles === 1 ? ' opción' : ' opciones') : 'Sin stock';
    return '<button class="cat-tile" type="button" onclick="scrollToCat(\'' + slug + '\')" ' +
             'aria-label="Ver ' + cat.nombre + '">' +
             '<img class="cat-tile-img" src="' + fotoUrl(foto) + '" alt="" loading="lazy">' +
             '<span class="cat-tile-name">' + cat.nombre + '</span>' +
             '<span class="cat-tile-count">' + cuenta + '</span>' +
           '</button>';
  }).filter(Boolean);
  cont.innerHTML = tiles.join('');
  /* En la compu es una grilla, y con 4 columnas fijas las 9 categorias de
     Estancias dejaban a Tortas SOLA en una tercera fila (13/9/2026). Se elige
     el ancho que no deja una ficha huerfana: 9 va de a 3, 8 de a 4, 10 de a 5.
     Pilar (sin carne) tiene 8 y sigue de a 4. En el celular no se usa: ahi es
     una fila que se desliza. */
  var n = tiles.length;
  var cols = n <= 4 ? Math.max(n, 1) : (n % 4 === 0 ? 4 : n % 3 === 0 ? 3 : n % 5 === 0 ? 5 : 4);
  cont.style.setProperty('--cat-cols', cols);
  tiles = tiles.join('');
  // Sin categorias no queda el titulo "Categorias" solo, colgado de la nada.
  const sec = $id('cat-tiles-section');
  if (sec) sec.style.display = tiles ? '' : 'none';
}

function renderCatNav() {
  renderCatTiles();
  const nav = $id('cat-nav');
  if (!nav) return;
  /* La MISMA lista que el catalogo: un chip cuya seccion no existe es un
     boton muerto. */
  const cats = getCategoriasVisibles();
  nav.innerHTML =
    '<button class="cat-nav-home" type="button" aria-label="Volver al inicio" onclick="window.scrollTo({top:0,behavior:\'smooth\'})">' +
      '<img src="' + fotoUrl('logo-icono.png') + '" alt="Maleu">' +
    '</button>' +
    '<div class="cat-nav-wrap" id="cat-nav-wrap"><div class="cat-nav-inner" id="cat-nav-inner">' +
    cats.map((cat,i) => {
      const slug = slugify(cat.nombre);
      return '<button class="cat-nav-btn' + (i===0?' active':'') + '" data-slug="' + slug + '" onclick="scrollToCat(\'' + slug + '\')">' +
        cat.nombre + '</button>';
    }).join('') +
    // Chip "Combos" al final, color propio. data-slug = id de la sección para que
    // el IntersectionObserver lo resalte al scrollear hasta los combos.
    (getActiveCombos().length ? '<button class="cat-nav-btn cat-nav-combos" data-slug="combos-ancla" onclick="scrollToCombos()">Combos</button>' : '') +
    '</div></div>';
  /* Los id ya vienen en el markup de cada seccion. Aca se asignaban
     emparejando `.cat-section[i]` con `getActiveCategories()[i]`, y eso
     estaba mal de dos formas: se perdian en cualquier repintado que no
     pasara por aca, y la seccion de Combos TAMBIEN tiene `.cat-section`,
     asi que con una categoria sin productos los id salian corridos y cada
     boton llevaba a otra categoria. */
  if (_catObserver) _catObserver.disconnect();   // si no, se acumulan
  const observer = _catObserver = new IntersectionObserver(entries => {
    if (_scrollingToCat) return;
    entries.forEach(entry => { if (entry.isIntersecting) setActiveNav(entry.target.id.replace('cat-','')); });
  }, { rootMargin:'-20% 0px -70% 0px', threshold:0 });
  document.querySelectorAll('.cat-section').forEach(s => observer.observe(s));
  // Hint de scroll: si el inner ya está al final, sacar el fade
  var inner = $id('cat-nav-inner'), wrap = $id('cat-nav-wrap');
  function updateFade() {
    if (!inner || !wrap) return;
    var atEnd = (inner.scrollLeft + inner.clientWidth) >= (inner.scrollWidth - 4);
    wrap.classList.toggle('at-end', atEnd);
  }
  if (inner) {
    inner.addEventListener('scroll', updateFade);
    setTimeout(updateFade, 100);
  }
  // Pulse inicial para llamar la atención (solo una vez por sesión)
  try {
    if (!sessionStorage.getItem('maleu_cat_pulse_done')) {
      setTimeout(function() {
        document.querySelectorAll('.cat-nav-btn').forEach(function(b) { b.classList.add('cat-nav-pulse'); });
        setTimeout(function() {
          document.querySelectorAll('.cat-nav-btn').forEach(function(b) { b.classList.remove('cat-nav-pulse'); });
        }, 1400);
      }, 1200);
      sessionStorage.setItem('maleu_cat_pulse_done', '1');
    }
  } catch(e) {}
}
/* Scroll suave a un ancla. Usa scrollIntoView (imperativo, no depende del
   hash) + scroll-margin-top en CSS para compensar el header sticky. */
/* Scroll robusto a un elemento respetando el sticky-header (cat-nav + promo-bar
   ≈ 110px). Antes usábamos scrollIntoView({behavior:'smooth'}) que a veces se
   cancelaba en iOS Safari por layout shifts paralelos → el usuario terminaba
   viendo el elemento anterior (típico: combos en vez del form). Ahora:
   - Calculamos Y con getBoundingClientRect (100% determinista).
   - behavior:'smooth' cuando el navegador está calmo; 'auto' si acabamos de
     abrir/cerrar overlays (para no competir con animaciones).
   - Reintento a los 380ms por si un reflow tardío movió el layout. */
function _stickyOffsetPx() {
  var sh = document.querySelector('.sticky-header');
  if (!sh) return 100;
  var r = sh.getBoundingClientRect();
  /* En el celular la franja del 10% va superpuesta debajo de la barra y no
     suma a su alto (ver LA FRANJA DEL 10% SE ESCONDE AL BAJAR). Se cuenta
     siempre que exista, aunque este escondida: un scroll hacia arriba la hace
     aparecer, y sin contarla taparia el titulo de la categoria a la que se va. */
  var promo = $id('promo-bar');
  var extra = (promo && promo.offsetHeight && getComputedStyle(promo).position === 'absolute') ? promo.offsetHeight : 0;
  return Math.max(60, r.height + extra + 10);
}
function _smoothScrollToEl(el, opts) {
  if (!el) return false;
  var instant = !!(opts && opts.instant);
  var offset = _stickyOffsetPx();
  var doScroll = function() {
    var rect = el.getBoundingClientRect();
    var y = Math.max(0, rect.top + window.pageYOffset - offset);
    if (!instant) { window.scrollTo({ top: y, behavior: 'smooth' }); return; }
    /* OJO: behavior:'auto' NO es instantáneo. Hereda el `scroll-behavior:smooth`
       que el CSS le pone al <html>, así que lo que parecía un salto era en
       realidad una animación de miles de píxeles. En iPhone esa animación se
       corta sola (basta que el dedo roce la pantalla al soltar el botón) y el
       cliente quedaba tirado a mitad de camino, arriba de los Combos, en vez de
       llegar al formulario. Apagamos el smooth del CSS solo durante el salto. */
    var root = document.documentElement;
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    root.style.scrollBehavior = prev;
  };
  doScroll();
  // Segundo intento por si un reflow tardío desplazó el layout (típico cuando
  // se acaba de expandir/colapsar una sección arriba del target).
  setTimeout(doScroll, 380);
  return true;
}
function scrollToCombos() {
  // Buscar por id; si no está, por clase (más estable ante re-render).
  const el = $id('combos-ancla') || document.querySelector('.combos-section');
  if (!_smoothScrollToEl(el)) {
    // Último recurso: si la sección no existe aún, re-render y reintentar.
    if (typeof renderCatalog === 'function') { renderCatalog(); updateStockDisplay(); }
    _smoothScrollToEl($id('combos-ancla') || document.querySelector('.combos-section'));
  }
}
function scrollToProductos() { _smoothScrollToEl($id('productos-ancla') || $id('catalogo')); }

let _scrollingToCat = false;
function scrollToCat(slug) {
  // Salir de la busqueda: la seccion a la que vamos puede estar filtrada, y
  // un boton que scrollea a algo oculto no hace nada y no avisa por que.
  if (_busqTexto) limpiarBusqueda();
  const section = $id('cat-' + slug); if (!section) return;
  _scrollingToCat = true;
  setActiveNav(slug);
  _smoothScrollToEl(section);
  setTimeout(() => { _scrollingToCat = false; }, 800);
}
function setActiveNav(slug) {
  const container = $id('cat-nav-inner');
  document.querySelectorAll('.cat-nav-btn').forEach(btn => {
    const isActive = btn.dataset.slug === slug;
    btn.classList.toggle('active', isActive);
    if (isActive && container) {
      const nR = container.getBoundingClientRect(), bR = btn.getBoundingClientRect();
      container.scrollTo({left: container.scrollLeft + (bR.left - nR.left) - (nR.width/2) + (bR.width/2), behavior:'smooth'});
    }
  });
}
function updateCatNavTop() {
  const nav = $id('cat-nav'), promo = $id('promo-bar');
  if (nav) {
    // Header NO es sticky → cat-nav va al top:0 cuando scrolleás
    nav.style.top = '0px';
    /* Hasta el 13/9/2026 aca se le ponia `top` a la franja del 10%. No hacia
       nada (la franja no estaba posicionada) y desde que en el celular va
       `position:absolute` la habria tirado encima de las categorias. */
    const promoH = promo ? promo.offsetHeight : 0;
    document.documentElement.style.setProperty('--promo-h', promoH + 'px');
    const total = nav.offsetHeight + promoH;
    document.querySelectorAll('.cat-section').forEach(s => { s.style.scrollMarginTop = total + 'px'; });
  }
}

/* ── LA FRANJA DEL 10% SE ESCONDE AL BAJAR (13/9/2026) ──
   En el celular la barra pegada arriba medía 166px —buscador, categorías y la
   franja—, un cuarto de la pantalla de un iPhone con la barra de Safari. La
   franja (35px) se esconde mientras el cliente BAJA y vuelve apenas SUBE, o
   cuando la barra deja de estar pegada. Lo que se dice ahí (el 10% en efectivo)
   se repite en el carrito, que es donde importa.

   No se achica la barra: se ESCONDE una pieza que va superpuesta debajo
   (styles.css, `position:absolute` desde el celular). Achicar algo pegado
   arriba mueve todo lo de abajo 35px mientras el dedo scrollea — en Chrome lo
   compensa el "scroll anchoring", en Safari no existe y la página salta. Por
   eso la barra ocupa siempre lo mismo y la franja solo se desvanece.

   Solo con un movimiento de 8px o más: el temblor del dedo no la hace
   parpadear. En la compu la clase se pone igual, pero el CSS no la usa. */
(function () {
  var ultimoY = window.pageYOffset || 0, pendiente = false, UMBRAL = 8;
  function mirar() {
    pendiente = false;
    var sh = document.querySelector('.sticky-header');
    if (!sh) return;
    var y = window.pageYOffset || 0;
    var pegada = y > 0 && sh.getBoundingClientRect().top <= 0.5;
    if (!pegada) { sh.classList.remove('promo-oculta'); ultimoY = y; return; }
    var d = y - ultimoY;
    if (Math.abs(d) < UMBRAL) return;          // se acumula hasta llegar al umbral
    sh.classList.toggle('promo-oculta', d > 0);
    ultimoY = y;
  }
  window.addEventListener('scroll', function () {
    if (!pendiente) { pendiente = true; requestAnimationFrame(mirar); }
  }, { passive: true });
})();

/* ── STOCK ── */
/* stockMap[id]            = stock físico (lo que hay en el depósito ahora)
   stockProyectadoMap[id]  = físico + Σ cantidad de OCs en estado "Pedido"
                             (lo que está en camino al depósito)            */
async function fetchStock() {
  /* Las piezas se piden YA, en paralelo con el stock (11/9/2026). Iban
     DESPUES: el stock tarda ~4 s, las piezas otros ~4, y la carne aparecia a
     los 10 s de abrir la tienda. Son dos endpoints distintos y ninguno
     necesita al otro. */
  const piezasListas = _refrescarPiezas();
  try {
    const bust = '?action=stock_full&_=' + Date.now();
    const res = await fetch(APPS_SCRIPT_URL + bust, { cache: 'no-store' });
    const full = await res.json();
    PRODUCTOS.forEach(p => {
      const abbr = PROD_ABBR[p.id];
      if (!abbr || !full[abbr]) return;
      /* SOLO el depósito de Tadeo (25/9/2026). `f` y `p` son la suma de LOS DOS
         depósitos, y eso alcanzaba mientras el de Lucas estaba en cero — que es
         como estuvo siempre, porque el ERP no tenía forma de repartir.
         El 25/9 se repartió por primera vez y el agujero se abrió al instante:
         la tienda ofrecía 25 Empanadas de Carne a Cuchillo con 0 en el depósito
         de Tadeo; las 27 estaban en el de Lucas. Los pedidos de la tienda los
         entrega Tadeo, así que lo que está en lo de Lucas no se puede prometer.
         `f` ya viene con lo reservado descontado, así que restarle el depósito
         de Lucas da lo disponible del de Tadeo: (ustariz + moresco - reservado)
         - moresco = ustariz - reservado. `_stockLimpio` lo deja en 0 si da
         negativo, que pasa cuando hay más reservado que físico.
         Sin `pd` (backend viejo) da 0 y queda el comportamiento de antes. */
      var enLucas = (full[abbr].pd && Number(full[abbr].pd.moresco)) || 0;
      stockMap[p.id] = _stockLimpio(full[abbr].f - enLucas);
      stockProyectadoMap[p.id] = _stockLimpio(full[abbr].p - enLucas);
    });
    // Ajustar carrito si excede el tope vigente según el modo actual
    const mode = getStockMode();
    if (mode === 'real' || mode === 'proyectado') {
      const capMap = mode === 'real' ? stockMap : stockProyectadoMap;
      let ajustado = false;
      Object.entries(cart).forEach(([id, qty]) => {
        const cap = capMap[id];
        if (cap !== undefined && qty > cap) {
          if (cap === 0) delete cart[id];
          else cart[id] = cap;
          ajustado = true;
          renderCardFooter(id);
        }
      });
      if (ajustado) { updateUI(); toast('⚠️ Tu carrito fue ajustado al stock disponible'); }
    }
    updateStockDisplay();
  } catch (e) { console.warn('fetchStock:', e); }
  await piezasListas;
}

/* Las piezas van con el mismo pulso que el stock: son el stock de la carne.
   Solo se repinta si la lista cambio de verdad: repintar el catalogo entero
   cada 60 s le mueve el nav al que esta scrolleando y redibuja 39 productos al
   pedo. Un fallo aca no frena el stock, ni al reves. */
async function _refrescarPiezas() {
  try {
    var antes = _piezasFirma();
    var llego = await fetchPiezas();
    var fuera = llego ? _piezasConciliarCarrito() : [];
    var resAvisos = llego ? _reservasConciliarCarrito() : [];
    if ((_piezasFirma() !== antes || resAvisos.length) && typeof renderCatalog === 'function') renderCatalog();
    if (fuera.length || resAvisos.length) {
      updateUI();
      updateFormVisibility();
      var avisos = [];
      if (fuera.length) avisos.push(fuera.length === 1
        ? 'La pieza de ' + kgTexto(fuera[0].kg) + ' de ' + fuera[0].nombre + ' ya se vendió y salió de tu carrito'
        : fuera.length + ' piezas de tu carrito ya se vendieron y salieron del carrito');
      toast('⚠️ ' + avisos.concat(resAvisos).join(' · '), 6000);
    }
  }
  catch (e) { console.warn('fetchPiezas:', e); }
}
/* El stock que manda el ERP, listo para usar (13/9/2026).
   El ERP puede mandar un NEGATIVO: ese domingo Empanadas Jamón y Queso vino en
   -1, y como la tienda solo trataba el 0 como agotado, la card decía
   "Últimas -1 unidades" con el botón "+ Agregar" prendido. Tocarlo decía
   "✓ agregado" sin agregar nada. Para el cliente no hay stock negativo: es 0.
   Y los kilos traen ruido de punto flotante (3.8900000000000006). */
function _stockLimpio(v) {
  var n = Number(v);
  if (!isFinite(n) || n <= 0) return 0;
  return Math.round(n * 1000) / 1000;
}
/* "Últimas 1 unidades" no se dice. */
function _ultimasTexto(n) {
  return n === 1 ? 'Última unidad' : 'Últimas ' + n + ' unidades';
}
/* Devuelve el tope a usar para un producto según el modo de stock actual.
   Si es 'ilimitado', devuelve null (sin tope). */
function getStockCap(id) {
  const m = getStockMode();
  if (m === 'ilimitado') return null;
  if (m === 'proyectado') return stockProyectadoMap[id];
  return stockMap[id];
}
function updateStockDisplay() {
  const mode = getStockMode();
  const showStock = mode !== 'ilimitado' || isStockInfoMode() || (currentZone && ZONAS[currentZone] && ZONAS[currentZone].showStock);
  PRODUCTOS.forEach(p => {
    /* querySelectorAll: un producto destacado esta dos veces en la pagina
       (su categoria y "Los mas pedidos") y las dos copias tienen que decir
       lo mismo del stock. */
    const els = document.querySelectorAll('[data-stock="' + p.id + '"]');
    if (!els.length) return;
    const el = { set innerHTML(v) { els.forEach(function(e) { e.innerHTML = v; }); } };
    const fis = stockMap[p.id];
    const proy = stockProyectadoMap[p.id];
    if (!showStock || fis === undefined) { el.innerHTML = ''; renderCardFooter(p.id); return; }
    if (mode === 'real') {
      if (fis === 0) el.innerHTML = '<span class="stock-badge stock-out">Sin stock</span>';
      else if (fis <= 3) el.innerHTML = '<span class="stock-badge stock-low">' + _ultimasTexto(fis) + '</span>';
      else el.innerHTML = '';
    } else if (mode === 'proyectado') {
      // Mismo tratamiento visual que modo real: el cliente no ve "lo que
      // viene en camino" explícito; solo ve "Sin stock" o "Últimas N" si
      // queda poco. Cuando intente superar el tope verá "Máximo disponible: N".
      if (proy === 0) el.innerHTML = '<span class="stock-badge stock-out">Sin stock</span>';
      else if (proy <= 3) el.innerHTML = '<span class="stock-badge stock-low">' + _ultimasTexto(proy) + '</span>';
      else el.innerHTML = '';
    } else {
      // Modo ilimitado: el cliente puede pedir cualquier cantidad. NO mostrar
      // info de stock físico — solo distrae. El cartel "A pedido" se mantiene
      // únicamente en Pilar/Clubes cuando stock=0 (zonas que siempre son a pedido).
      if (fis === 0 && currentZone !== 'estancias' && !(currentZone === 'pilar' && !_pilarBarrioIsRed())) {
        el.innerHTML = '<span class="stock-badge stock-order">A pedido</span>';
      } else {
        el.innerHTML = '';
      }
    }
    renderCardFooter(p.id);
  });
  // Combos: badge de stock (mismo criterio que productos) + footer.
  updateStockBadgesCombos();
  getActiveCombos().forEach(c => renderComboFooter(c.id));
  /* El tope cambio (llego el stock, o se eligio otra fecha): "Agregar lo
     mismo" puede quedar sin nada que sumar, o volver a tener. Va aca y no en
     cada call site por lo mismo que los carteles: son varios. Lo mismo la
     sugerencia del carrito: lo que ofrece de Maleu depende del tope. */
  _pintarUltimoPie();
  _pintarSugerencia();
}

/* ── GUARDAR LO QUE EL CLIENTE ESCRIBE ──
   Hasta el 11/9/2026 los datos se guardaban SOLO al mandar el pedido, así que
   el que completaba el formulario y no llegaba a mandarlo lo tenía que escribir
   todo de nuevo la próxima vez. Ahora se guarda a medida que se completa cada
   campo, y `enviarPedido` usa esta misma función con el día y el pago — tener
   dos formas de guardar el mismo dato es como se despegan.

   Va en `change` y en `focusout`, NO en cada tecla: con `input`, un teléfono a
   medio escribir pisaría el que ya estaba guardado. */
function _datosClienteDelForm(extra) {
  var v = function (id) { var e = $id(id); return e ? String(e.value || '').trim() : ''; };
  var d = { nombre: v('f-nombre'), telefono: v('f-telefono'), zone: currentZone };
  if (currentZone === 'estancias') {
    d.barrioPrivado = v('f-barrio-privado');
    d.barrio = d.barrioPrivado === 'Estancias del Pilar' ? v('f-barrio') : d.barrioPrivado;
    d.lote = v('f-lote');
  } else if (currentZone === 'clubes') {
    d.club = v('f-club'); d.deporte = v('f-deporte'); d.grupo = v('f-grupo');
  } else if (currentZone === 'pilar') {
    // Mismo criterio que enviarPedido: el dropdown, salvo "Otro" que usa el
    // campo libre. Si no eligió nada todavía, no se inventa una dirección.
    var sel = v('f-pilar-barrio');
    d.direccion = sel === '__otro__' ? v('f-direccion') : sel;
    d.lote = v('f-lote-pilar');
  }
  if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) d[k] = extra[k];
  return d;
}
function guardarDatosCliente(extra) {
  try {
    if (!currentZone || !ZONAS[currentZone]) return;
    var d = _datosClienteDelForm(extra);
    // Un formulario vacío no se guarda: pisaría lo que ya había con nada. Pasa
    // al cambiar de zona, que limpia los campos antes de que el cliente toque.
    if (!d.nombre && !d.telefono) return;
    localStorage.setItem('maleu_cliente_pg', JSON.stringify(d));
    localStorage.setItem('maleu_cliente_' + currentZone, JSON.stringify(d));
  } catch (e) {}
}

/* ── PRECARGAR DATOS ── */
/* NUNCA pisa un campo que ya tiene algo escrito. Eso es lo que la deja llamar
   más de una vez: en el arranque los campos están vacíos y se comporta igual
   que siempre, y al elegir la zona (donde antes no se llamaba) completa lo que
   falta sin tocar lo que el cliente acaba de tipear. */
function _ponerSiVacio(id, val) {
  if (!val) return false;
  var e = $id(id);
  if (!e || String(e.value || '').trim()) return false;
  e.value = val;
  return true;
}
function loadClientData() {
  try {
    // Datos específicos de la zona actual (prioridad) o legacy global
    var saved = JSON.parse(localStorage.getItem('maleu_cliente_' + currentZone) || 'null');
    var global = JSON.parse(localStorage.getItem('maleu_cliente_pg') || 'null');
    if (!saved && global && global.zone === currentZone) saved = global;
    if (!saved) {
      // Al menos cargar nombre y teléfono del global si existe
      if (global) {
        _ponerSiVacio('f-nombre', global.nombre);
        _ponerSiVacio('f-telefono', global.telefono);
      }
      return;
    }
    _ponerSiVacio('f-nombre', saved.nombre);
    _ponerSiVacio('f-telefono', saved.telefono);
    if (currentZone === 'estancias') {
      if (_ponerSiVacio('f-barrio-privado', saved.barrioPrivado)) filtrarSubBarrios(true);
      _ponerSiVacio('f-barrio', saved.barrio);
      _ponerSiVacio('f-lote', saved.lote);
    }
    if (currentZone === 'pilar') {
      if (saved.direccion && !$id('f-pilar-barrio').value) {
        var sel = $id('f-pilar-barrio');
        // Buscar si el barrio guardado está en el dropdown
        var found = false;
        if (sel) {
          for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === saved.direccion) { sel.value = saved.direccion; found = true; break; }
          }
        }
        if (!found && sel) {
          sel.value = '__otro__';
          $id('f-direccion').value = saved.direccion;
        }
        onPilarBarrioChange();
      }
      _ponerSiVacio('f-lote-pilar', saved.lote);
    }
    if (currentZone === 'clubes') {
      _ponerSiVacio('f-club', saved.club);
      _ponerSiVacio('f-deporte', saved.deporte);
      _ponerSiVacio('f-grupo', saved.grupo);
    }
    // Día y método de pago NO se precargan — el cliente los elige cada vez
  } catch(e) {}
}
/* ── LO QUE PEDISTE LA ÚLTIMA VEZ (13/9/2026) ──
   Existia desde antes del 25/8/2026 como "Tu último pedido": una lista de
   nombres con UN boton, "Agregar todo de nuevo", metida arriba del catalogo y
   solo si la zona coincidia exacto.

   Medido el 13/9/2026 sobre los 994 pedidos de Home y Pilar, comparando cada
   pedido con el anterior del mismo cliente (sin la carne, que va por pieza):
   solo el 13,5% repite los mismos productos, pero el 65% repite al menos uno.
   Y de los 67 pedidos de la tienda desde el 31/8, 38 son de gente que ya habia
   comprado. O sea: "agregar todo" le sirve a pocos; tener a mano lo que ya
   pidio, cada cosa con su boton, le sirve a la mayoria de los que vuelven.

   Por eso son las cards de siempre (productCardHTML), igual que "Los mas
   pedidos": el stock, el tope, "Pedir para el vie 18" y el +/- salen de las
   mismas funciones que en el catalogo, y renderCardFooter ya pinta un producto
   que esta mas de una vez en la pagina. "Agregar lo mismo" queda para el que
   repite todo, y solo con dos productos o mas.

   Vive en el navegador y no en el ERP, a proposito: un endpoint que devuelva
   los pedidos de un telefono seria una puerta a los pedidos de cualquiera. La
   contracara es que en otro celular no aparece. */
var ULTIMO_KEY = 'maleu_ultimo_pedido_v2';
var ULTIMO_A_LA_VISTA = 4;

function _ultimoGuardado() {
  try {
    var v2 = JSON.parse(localStorage.getItem(ULTIMO_KEY) || 'null');
    if (v2 && Array.isArray(v2.items)) return v2;
    /* El formato de antes del 13/9/2026: una lista de {id, qty}, sin fecha ni
       carne. Los que ya pidieron lo tienen guardado asi, y tiene que servirles
       desde la primera visita. */
    var viejo = JSON.parse(localStorage.getItem('maleu_ultimo_pedido_pg') || 'null');
    if (Array.isArray(viejo) && viejo.length) return { t: 0, items: viejo, carne: [] };
  } catch (e) {}
  return null;
}

/* Se llama al validar el formulario, igual que guardarDatosCliente: lo que el
   cliente quiso pedir, aunque el ERP tarde en confirmarlo. Un pedido de solo
   combos NO pisa el anterior: los combos no se muestran aca (tienen su propio
   armado de gustos) y quedaria la seccion vacia. */
function guardarUltimoPedido() {
  try {
    var items = Object.keys(cart).map(function (id) {
      return { id: isNaN(id) ? id : +id, qty: Number(cart[id]) || 0 };
    }).filter(function (x) { return x.qty > 0; });
    var carne = [];
    Object.keys(piezaCart || {}).forEach(function (pid) {
      var pz = piezaCart[pid];
      var p = pz && PRODUCTOS.find(function (x) { return x.abbr === pz.abbr; });
      if (p && carne.indexOf(p.id) === -1) carne.push(p.id);
    });
    if (!items.length && !carne.length) return;
    localStorage.setItem(ULTIMO_KEY, JSON.stringify({ t: Date.now(), zona: currentZone, items: items, carne: carne }));
  } catch (e) {}
}

/* Lo guardado que se puede mostrar HOY: solo lo que la zona vende
   (getActiveProducts, la misma lista que el catalogo), de mayor a menor
   cantidad. Ya no se exige que la zona sea la misma: un producto que la zona
   no vende directamente no aparece. */
function _ultimoItems() {
  var g = _ultimoGuardado(); if (!g) return null;
  var activos = {};
  getActiveProducts().forEach(function (p) { activos[p.id] = p; });
  var items = g.items.map(function (x, i) { return { p: activos[x.id], qty: Number(x.qty) || 0, i: i }; })
    .filter(function (x) { return x.p && !esPorPeso(x.p) && x.qty > 0; })
    .sort(function (a, b) { return (b.qty - a.qty) || (a.i - b.i); });
  var carne = (g.carne || []).map(function (id) { return activos[id]; }).filter(Boolean);
  return { t: g.t || 0, items: items, carne: carne };
}

function _ultimoFecha(t) {
  var d = new Date(t - 3 * 3600 * 1000);   // hora argentina
  return d.getUTCDate() + '/' + (d.getUTCMonth() + 1);
}

function renderUltimoPedido() {
  var sec = $id('ultimo-section'), cont = $id('ultimo-productos');
  if (!sec || !cont) return;
  var u = _ultimoItems();
  if (!u || (!u.items.length && !u.carne.length)) {
    sec.hidden = true; cont.innerHTML = ''; $id('ultimo-pie').innerHTML = '';
    return;
  }
  var vista = u.items.slice(0, ULTIMO_A_LA_VISTA);
  cont.innerHTML = vista.map(function (x) { return productCardHTML(x.p); }).join('');
  cont.hidden = !vista.length;
  $id('ultimo-sub').textContent = u.t
    ? 'Tu pedido del ' + _ultimoFecha(u.t) + ' · tocá lo que quieras repetir'
    : 'Tocá lo que quieras repetir';
  sec.hidden = false;
  // Los footers se pintan aparte, igual que en "Los mas pedidos".
  vista.forEach(function (x) { renderCardFooter(x.p.id); });
  _pintarUltimoPie(u);
}

/* Cuanto de cada producto se puede sumar hoy: lo que pidio, topeado por el
   stock de la fecha elegida. Es la misma cuenta que modifyCart (getStockCap es
   el total permitido, no lo que falta). */
function _ultimoQuiero(x) {
  var cap = getStockCap(x.p.id);
  return (cap === null || cap === undefined) ? x.qty : Math.max(0, Math.min(x.qty, cap));
}

function _pintarUltimoPie(u) {
  var pie = $id('ultimo-pie'), sec = $id('ultimo-section');
  if (!pie || !sec || sec.hidden) return;
  u = u || _ultimoItems();
  if (!u) { pie.innerHTML = ''; return; }
  var html = '';
  if (u.items.length >= 2) {
    /* El boton dice lo que VA a quedar en el carrito: sin lo que no hay para
       esta fecha y topeado por el stock. Contar los seis del pedido guardado
       con uno agotado adentro prometeria algo que el toque no hace. */
    var falta = 0, sinStock = 0, valor = 0, disp = 0;
    u.items.forEach(function (x) {
      var q = _ultimoQuiero(x);
      if (q <= 0) { sinStock++; return; }
      disp++;
      if ((cart[x.p.id] || 0) < q) falta++;
      valor += x.p.precio * q;
    });
    if (falta) {
      html += '<button type="button" class="ultimo-todo" onclick="agregarLoMismo()">' +
        'Agregar lo mismo · ' + disp + (disp === 1 ? ' producto' : ' productos') + ' · ' + ars(valor) + '</button>';
    } else if (sinStock === u.items.length) {
      /* Nada de ese pedido hay para la fecha elegida (un domingo con el
         freezer vacio). Un boton gris ahi es un callejon sin salida — lo mismo
         que se arreglo en las cards con "Pedir para el vie 18" —, asi que si
         hay una fecha en la que hay de todo, se ofrece esa. */
      var fl = _fechaParaLoMismo(u.items);
      html += fl
        ? '<button type="button" class="ultimo-todo" onclick="agregarLoMismoOtraFecha()">' +
            'Agregar lo mismo para ' + _fechaCorta(fl) + ' · ' + u.items.length + ' productos</button>'
        : '<button type="button" class="ultimo-todo" disabled>Para esta fecha no hay stock de ese pedido</button>';
    } else {
      html += '<button type="button" class="ultimo-todo" disabled>✓ Ya está en tu carrito</button>';
    }
  }
  /* Los que no entran en las cuatro cards se nombran: "Agregar lo mismo" los
     suma igual, y sumar algo que no se ve seria una sorpresa en el carrito. */
  var ocultos = u.items.slice(ULTIMO_A_LA_VISTA);
  if (ocultos.length) {
    html += '<p class="ultimo-mas">Y también: ' + ocultos.map(function (x) {
      return x.p.nombre + ' ×' + x.qty;
    }).join(' · ') + '</p>';
  }
  /* La carne no se repite: cada pieza es unica y la de la vez pasada ya no
     existe. Se dice que la llevo y se lleva a elegir la de hoy. */
  if (u.carne.length) {
    var nombres = u.carne.map(function (p) { return p.nombre; });
    var lista = nombres.length > 1 ? nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1] : nombres[0];
    html += '<p class="ultimo-carne">También llevaste carne: ' + lista + '.</p>' +
      '<button type="button" class="ultimo-carne-btn" onclick="scrollToCat(\'' + slugify('Carnes') + '\')">' +
      'Elegir las piezas de hoy →</button>';
  }
  pie.innerHTML = html;
}

/* Pasa la entrega a la primera fecha en la que hay de todo y suma lo mismo. Por
   la MISMA pregunta que "Pedir para el vie 18": nunca se mueve la fecha sin un
   toque que lo diga. */
function agregarLoMismoOtraFecha(yaPregunto) {
  var u = _ultimoItems();
  var f = u && _fechaParaLoMismo(u.items);
  if (!f) { toast('⚠️ No hay stock para la fecha que elegiste', 3000); return; }
  if (!yaPregunto) {
    _preguntarOtraFecha({ nombre: 'Lo que pediste la última vez', img: u.items[0].p.img, f: f, id: 'repetir',
                          seguir: function () { agregarLoMismoOtraFecha(true); } });
    return;
  }
  var antes = selectedDeliveryDate;
  setDeliveryDate(f.iso, f.dayName, { sinScroll: true });
  var partes = f.iso.split('-');
  var cuando = f.isTomorrow ? 'ahora es mañana'
    : 'pasó al ' + f.dayName.toLowerCase() + ' ' + (+partes[2]) + '/' + (+partes[1]);
  if (typeof gtag === 'function') {
    gtag('event', 'fecha_por_stock', { id: 'repetir', item_name: 'Lo que pediste la última vez', desde: antes, hasta: f.iso, zone: currentZone });
  }
  agregarLoMismo(' · tu entrega ' + cuando);
}

function agregarLoMismo(sufijo) {
  sufijo = typeof sufijo === 'string' ? sufijo : '';
  /* En la practica no se da —el que tiene un pedido guardado tiene zona—,
     pero es una puerta al carrito y las puertas se cierran todas. */
  if (_pedirZonaAntes(function () { agregarLoMismo(sufijo); }, 'repetir')) return;
  var u = _ultimoItems(); if (!u || !u.items.length) return;
  var sumados = 0, sinStock = 0, recortados = 0, valor = 0;
  u.items.forEach(function (x) {
    var q = _ultimoQuiero(x);
    if (q <= 0) { sinStock++; return; }
    if (q < x.qty) recortados++;
    var actual = cart[x.p.id] || 0;
    /* Hasta lo que pidio, no ENCIMA de lo que ya hay: si ya sumo una
       margarita tocando su card, "lo mismo" son dos y no tres. Asi el boton
       se puede tocar dos veces sin duplicar el pedido. */
    if (actual >= q) return;
    cart[x.p.id] = q;
    sumados++;
    valor += x.p.precio * (q - actual);
    renderCardFooter(x.p.id);
    _track('add_to_cart', { id: x.p.id, item_name: x.p.nombre, price: x.p.precio * (q - actual), zone: currentZone });
  });
  if (sumados) {
    updateUI();
    updateFormVisibility();
    updateShippingBar();
    _track('repetir_pedido', { items: sumados, value: valor, zone: currentZone });
    var badge = $id('cart-badge');
    if (badge) { badge.classList.remove('bounce'); void badge.offsetWidth; badge.classList.add('bounce'); }
  }
  var msg;
  if (sumados) {
    msg = '✓ Sumamos ' + sumados + (sumados === 1 ? ' producto' : ' productos') + ' de tu último pedido';
    if (sinStock) msg += ' · ' + sinStock + ' no hay para esta fecha';
    else if (recortados) msg += ' · algunos, hasta el stock que hay';
    msg += sufijo;
  } else if (sinStock === u.items.length) {
    msg = '⚠️ Para esta fecha no hay stock de ese pedido';
  } else {
    msg = '✓ Ya está todo en tu carrito';
  }
  toast(msg, 4500);
}

/* ── INIT ── */
renderCatalog();   // repinta tambien el nav y los tiles
updateCatNavTop();
window.addEventListener('resize', updateCatNavTop);

// Zona guardada
let savedZone = localStorage.getItem('maleu_zone');
if (savedZone === 'capital') { savedZone = 'pilar'; localStorage.setItem('maleu_zone', 'pilar'); }
/* Migración 10/08/2026: Los Alcanfores y Estancias del Río salieron de la zona
   Estancias y pasaron a "Otra zona de Pilar". Los clientes recurrentes tienen
   maleu_zone='estancias' cacheado en el navegador; sin esto entrarían a una
   zona donde su barrio ya no está en el dropdown y quedarían trabados. Los
   movemos solos a Pilar con la zona y el barrio ya elegidos. La fecha guardada
   se descarta sola: _loadSavedDate() ignora las fechas de otra zona. */
if (savedZone === 'estancias') {
  try {
    var _cliMig = JSON.parse(localStorage.getItem('maleu_cliente_estancias') || 'null')
               || JSON.parse(localStorage.getItem('maleu_cliente_pg') || 'null');
    var _bpMig = _cliMig && _cliMig.barrioPrivado;
    if (_bpMig && BARRIOS_EX_HOME.indexOf(_bpMig) !== -1) {
      savedZone = 'pilar';
      localStorage.setItem('maleu_zone', 'pilar');
      localStorage.setItem('maleu_pilar_zona', JSON.stringify({ val: '__otro__', nombre: 'Otra zona de Pilar', ts: Date.now() }));
      localStorage.setItem('maleu_pilar_barrio', JSON.stringify({ val: _bpMig, nombre: _bpMig, ts: Date.now() }));
    }
  } catch(e) {}
}
/* Migración 14/9/2026, la de arriba al revés para Estancias del Río: volvió a
   la zona Estancias. El que lo tenía elegido en Pilar entraría a una zona donde
   su barrio ya no está en la lista. Se lo pasa a Estancias con el barrio y el
   lote que ya había escrito, así no tiene que cargar nada de nuevo. */
if (savedZone === 'pilar') {
  try {
    var _pbRio = JSON.parse(localStorage.getItem('maleu_pilar_barrio') || 'null');
    if (_pbRio && _pbRio.val === 'Estancias del Río') {
      var _cliPil = JSON.parse(localStorage.getItem('maleu_cliente_pilar') || 'null') || {};
      var _cliEst = JSON.parse(localStorage.getItem('maleu_cliente_estancias') || 'null') || {};
      _cliEst.nombre = _cliEst.nombre || _cliPil.nombre || '';
      _cliEst.telefono = _cliEst.telefono || _cliPil.telefono || '';
      _cliEst.barrioPrivado = 'Estancias del Río';
      _cliEst.barrio = 'Estancias del Río';
      _cliEst.lote = _cliPil.lote || _cliEst.lote || '';
      _cliEst.zone = 'estancias';
      localStorage.setItem('maleu_cliente_estancias', JSON.stringify(_cliEst));
      localStorage.removeItem('maleu_pilar_barrio');
      localStorage.removeItem('maleu_pilar_zona');
      localStorage.setItem('maleu_zone', 'estancias');
      savedZone = 'estancias';
    }
  } catch(e) {}
}
if (savedZone && ZONAS[savedZone]) {
  // Cliente recurrente: tiene zona. NO mostrar paso 1 (zona).
  currentZone = savedZone;
  applyZone();
  if (savedZone === 'clubes') {
    // Clubes: nunca se pregunta fecha (Vie en cancha). Setear default.
    if (!_loadSavedDate()) _setClubesDefaultDate();
    _setOverlay(false);
  } else if (savedZone === 'pilar') {
    // Pilar: cargar zona + barrio guardados si existen. Si falta alguno,
    // arrancar por el paso más cercano.
    var tieneZona = _loadSavedPilarZona();
    /* El desplegable del formulario se arma con la zona: applyZone() lo dibujo
       cuando la zona todavia no estaba cargada ("Elegí tu zona primero"), asi
       que el barrio guardado no tenia opcion donde caer y el que volvia
       encontraba el formulario sin su barrio (visto el 14/9/2026). */
    if (tieneZona) renderPilarBarrios();
    var tieneBarrio = _loadSavedPilarBarrio();
    if (!tieneZona) {
      welcomeShowBarrioStep();       // Paso 2: elegir zona
      _setOverlay(true);
    } else if (!tieneBarrio) {
      welcomeShowSubBarrioStep();    // Paso 3: elegir sub-barrio (zona ya elegida)
      _setOverlay(true);
    } else {
      _loadSavedDate();              // Zona + barrio OK → adentro
      _setOverlay(false);
    }
  } else {
    // Con fecha vigente se respeta; sin ella, entra sin fecha y la elige en
    // el formulario. En ningun caso se le abre el modal (23/9/2026).
    _loadSavedDate();
    _setOverlay(false);
  }
} else {
  /* Cliente nuevo: no se le pregunta NADA. Entra al catalogo con la zona
     provisoria y el cartel "¿A donde te lo llevamos?" arriba; la zona se le
     pregunta en el primer "+ Agregar" (_pedirZonaAntes). */
  currentZone = ZONA_PROVISORIA;
  zonaProvisoria = true;
  applyZone();
  _setOverlay(false);
}

loadClientData();
$id('cart-badge').style.display = 'none';
fetchStock();
fetchVendedores();
_retryPendingOrders();
initCumpleBlock();
// Listener delegado: cualquier cambio en el form recalcula el CTA del botón WA
// y guarda los datos, para que el que completa y se va no los pierda.
(function(){
  var formSec = $id('form-section');
  if (!formSec) return;
  ['input','change'].forEach(function(ev){
    formSec.addEventListener(ev, updateWhatsappCta);
  });
  /* `change` y `focusout`, no `input`: guardar en cada tecla dejaría un
     teléfono a medio escribir encima del que ya estaba. `focusout` porque
     burbujea (blur no), y cubre al que escribe y toca otra cosa sin que el
     campo dispare `change`. */
  ['change','focusout'].forEach(function(ev){
    formSec.addEventListener(ev, function(){ guardarDatosCliente(); });
  });
})();
let _stockTimer = setInterval(fetchStock, 60000);
document.addEventListener('visibilitychange', () => {
  if(document.hidden){clearInterval(_stockTimer);_stockTimer=null;}
  else{fetchStock();_stockTimer=setInterval(fetchStock,60000);}
});

// Float cart visibility
const _formObs = new IntersectionObserver(([entry]) => { _formVisible = entry.isIntersecting; updateUI(); }, {threshold:0.3});
_formObs.observe(document.querySelector('.form-section'));

/* ══════════════════════════════════════════════════
   CUMPLEAÑOS DEL CLIENTE
   Bloque en el form (arriba del botón WhatsApp). Se guarda en
   localStorage al completar y viaja en el payload del pedido
   (postData.cumple) → el backend lo escribe en "Clientes Meta"
   atado al teléfono normalizado (filtro 🎂 Cumple del Panel).
   Formato guardado: "DD/MM/AAAA". (CUMPLE_MESES se define arriba con las constantes.)
   ══════════════════════════════════════════════════ */
function getCumpleValue() {
  try { return localStorage.getItem('maleu_cumple') || ''; } catch(e) { return ''; }
}

function initCumpleBlock() {
  var selDia = $id('f-cumple-dia'), selMes = $id('f-cumple-mes'), selAnio = $id('f-cumple-anio');
  if (!selDia || !selMes || !selAnio) return;

  // Poblar días 1–31
  for (var d = 1; d <= 31; d++) {
    var o = document.createElement('option'); o.value = String(d); o.textContent = String(d); selDia.appendChild(o);
  }
  // Poblar meses
  for (var m = 0; m < 12; m++) {
    var om = document.createElement('option'); om.value = String(m + 1); om.textContent = CUMPLE_MESES[m]; selMes.appendChild(om);
  }
  // Poblar años 2012 → 1956 (más jóvenes primero)
  for (var y = 2012; y >= 1956; y--) {
    var oy = document.createElement('option'); oy.value = String(y); oy.textContent = String(y); selAnio.appendChild(oy);
  }

  [selDia, selMes, selAnio].forEach(function(s) { s.addEventListener('change', cumpleOnChange); });

  // Si ya lo completó en una visita anterior → no volver a mostrar NADA (ni el "¡Listo!").
  // El estado "¡Listo!" solo se ve en el momento en que lo carga (cumpleOnChange).
  var saved = getCumpleValue();
  if (saved) {
    var block = $id('cumple-block');
    if (block) block.style.display = 'none';
  } else {
    _cumpleShowAsk();
  }
}

function cumpleOnChange() {
  var dia = $id('f-cumple-dia').value, mes = $id('f-cumple-mes').value, anio = $id('f-cumple-anio').value;
  if (!dia || !mes || !anio) return; // todavía incompleto
  var dd = ('0' + dia).slice(-2), mm = ('0' + mes).slice(-2);
  var valor = dd + '/' + mm + '/' + anio;
  try { localStorage.setItem('maleu_cumple', valor); } catch(e) {}
  // Si ya conocemos el teléfono del cliente (recurrente), lo guardamos al toque.
  _cumpleSaveBackend(valor);
  _cumpleShowDone(valor);
  try { toast('🎂 ¡Gracias! Guardamos tu cumple'); } catch(e) {}
}

function _cumpleShowDone(valor) {
  var ask = $id('cumple-ask'), done = $id('cumple-done'), fechaEl = $id('cumple-done-fecha');
  if (fechaEl) {
    var p = valor.split('/');
    fechaEl.textContent = (p.length === 3) ? (parseInt(p[0],10) + ' de ' + (CUMPLE_MESES[parseInt(p[1],10)-1] || '')) : valor;
  }
  if (ask) ask.style.display = 'none';
  if (done) done.style.display = '';
}

function _cumpleShowAsk() {
  var ask = $id('cumple-ask'), done = $id('cumple-done');
  if (ask) ask.style.display = '';
  if (done) done.style.display = 'none';
}

// Permite corregir un cumple ya cargado.
function cumpleEditar() { _cumpleShowAsk(); }

// Guarda el cumple en el backend si ya tenemos un teléfono (cliente recurrente o
// número ya tipeado en el form). Fire-and-forget, no bloquea nada. El pedido igual
// lleva postData.cumple como vía principal.
function _cumpleSaveBackend(valor) {
  var tel = '';
  var telEl = $id('f-telefono');
  if (telEl && telEl.value) tel = telEl.value;
  if (!tel) {
    try {
      var saved = JSON.parse(localStorage.getItem('maleu_cliente_pg') || 'null');
      if (saved && saved.telefono) tel = saved.telefono;
    } catch(e) {}
  }
  if (!tel || tel.replace(/\D/g, '').length < 8) return; // sin teléfono → se guarda al hacer el pedido
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST', mode: 'cors', keepalive: true,
      headers: { 'Content-Type': 'text/plain' }, // evita preflight CORS (igual que el pedido)
      body: JSON.stringify({ action: 'guardarCumpleCliente', tel: tel, cumple: valor })
    }).catch(function(){});
  } catch(e) {}
}

/* ══════════════════════════════════════════════════
   FEATURES FRIZATA-INSPIRED
   ══════════════════════════════════════════════════ */

/* ── BARRA ENVÍO GRATIS ── */
const FREE_SHIPPING_MIN = 25000; // envío gratis desde $25.000 (solo aplica para zona pilar)
/* Cutoff de pedidos para vendedores Red: jueves 12:00 AR, entrega el viernes.
   Devuelve el chip para incluir en el ticker o '' si no aplica.

   Hasta el 13/9/2026 el sabado y el domingo decia "Tiempo agotado esta
   semana": el mismo error que tenia _cutoffNote hasta ese dia. Un domingo el
   viernes que viene esta abierto hasta el jueves, y el cliente leia que habia
   llegado tarde. Ahora dice las fechas, con la misma cuenta que _cutoffNote. */
function _pilarRedCutoffChip() {
  if (currentZone !== 'pilar' || !_pilarBarrioIsRed()) return '';
  return _cutoffChipTexto();
}
function _cutoffChipTexto() {
  var nowAR = new Date(Date.now() - 3 * 3600 * 1000);
  var dow = nowAR.getUTCDay();      // 0=Dom .. 6=Sáb
  var hour = nowAR.getUTCHours();
  var hoyMs = Date.UTC(nowAR.getUTCFullYear(), nowAR.getUTCMonth(), nowAR.getUTCDate());
  var dm = function (ms) { var d = new Date(ms); return d.getUTCDate() + '/' + (d.getUTCMonth() + 1); };
  var proxVieMs = hoyMs + ((5 - dow + 7) % 7) * 86400000;   // si hoy es viernes, hoy
  var sigVieMs = proxVieMs + 7 * 86400000;
  if (dow === 4 && hour < 12) return 'Último día: pedí hasta hoy a las 12 hs · Entrega mañana viernes ' + dm(proxVieMs);
  if (dow === 5) return 'Hoy estamos entregando · El próximo viernes es el ' + dm(sigVieMs) + ', pedí hasta el jueves ' + dm(sigVieMs - 86400000) + ' a las 12 hs';
  if (dow === 4) return 'Los pedidos para mañana ya cerraron · Pedí ahora para el viernes ' + dm(sigVieMs);
  return 'Pedí hasta el jueves ' + dm(proxVieMs - 86400000) + ' a las 12 hs · Entrega el viernes ' + dm(proxVieMs);
}

/* DIAS SIN FRANJA (24/9/2026)

   Tadeo, la manana de la ruleta de Los Robles: "sacá el cartel negro del 10%
   OFF por hoy nomas; mañana si querés que aparezca está ok". El motivo es que
   hoy el descuento que se comunica es el premio de la ruleta, y dos descuentos
   anunciados a la vez se pisan: el que gana 15% no tiene que estar leyendo
   arriba que hay un 10%.

   VA POR FECHA Y NO POR UN INTERRUPTOR A MANO, a proposito. Un cartel que se
   apaga "por hoy" y depende de que alguien se acuerde de prenderlo se queda
   apagado: nadie extraña lo que no ve. Asi vuelve solo el 25 a las 00:00 de
   Argentina, sin que nadie publique nada.

   Para apagarla otro dia, se agrega la fecha a la lista. Para dejarla apagada
   un fin de semana largo, se agregan los tres dias.

   El 10% SIGUE EXISTIENDO hoy: lo que se apaga es el cartel de arriba, no el
   descuento. El que paga en efectivo lo recibe igual. */
function _hoyAR() {
  /* AR es UTC-3 todo el ano (no hay horario de verano desde 2009), asi que
     restar 3 horas y leer en UTC da el dia calendario de aca. Es el mismo
     truco que usa _cutoffChipTexto(), y no `toLocaleDateString`, que en un
     celular con la zona horaria mal puesta devolveria otro dia. */
  var d = new Date(Date.now() - 3 * 3600 * 1000);
  var m = d.getUTCMonth() + 1, x = d.getUTCDate();
  return d.getUTCFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (x < 10 ? '0' : '') + x;
}
function _anunciar10Hoy() {
  /* ¿HOY SE ANUNCIA EL 10% DE EFECTIVO? (24/9/2026)

     Tadeo, la manana de la ruleta: "la idea es no mostrar ese 10% por el tema
     del sorteo de la tarde, para que ningun cliente sospeche de que ya habia un
     10% off en efectivo". O sea que lo que molesta no es el cartel de arriba:
     es que alguien que gana el 15% pueda pensar que el premio en realidad le da
     cinco puntos mas que lo que ya tenia cualquiera.

     Por eso esto NO es "esconder la franja": es una sola respuesta que miran
     los TRES carteles que hablan del 10% —la franja, el cartel del formulario
     y el incentivo del carrito—. Colgarlo de cada uno por separado es como se
     rompio tres veces el 23/9: uno se olvida y sigue hablando.

     OJO CON LO QUE ESTO NO HACE: el descuento SIGUE APLICANDOSE. Lo que se
     apaga es el anuncio, no la plata. El que elige efectivo lo ve igual en el
     total, y tiene que verlo — cobrarle 10% de mas sin decirle nada seria otra
     cosa, y no es lo que se pidio.

     LA LISTA VA ADENTRO DE LA FUNCION, y no en una `var` de arriba.

     La primera version la puso en `var DIAS_SIN_FRANJA` justo encima de
     `updatePromoBar()`, en la linea 6536. Pero a `updatePromoBar()` la llama el
     arranque —`applyZone()`, `updateUI()`— y ese arranque corre ANTES de que se
     ejecute la linea 6536: la `var` esta declarada (hoisting) pero vale
     `undefined`, asi que `undefined.indexOf(...)` tiraba TypeError, la funcion
     moria ahi, y LA FRANJA NO SE DIBUJABA NUNCA — ningun dia, no solo hoy.

     Una declaracion `function` se iza entera, con su cuerpo, asi que esto anda
     desde cualquier lado y no depende de donde quede el bloque el dia que
     alguien mueva codigo. Lo encontro `verificar-franja.js` en la primera
     corrida, por su chequeo de control: "la franja existe (sin esto lo de abajo
     no mide nada)". (24/9/2026) */
  var DIAS_SIN_ANUNCIO_10 = ['2026-09-24'];
  return DIAS_SIN_ANUNCIO_10.indexOf(_hoyAR()) < 0;
}
function updatePromoBar() {
  var bar = $id('promo-bar');
  if (!bar) return;
  if (!_anunciar10Hoy()) { bar.style.display = 'none'; return; }
  // Carrito solo-combos: los descuentos no aplican → ocultarlos.
  var soloCombos = combosInCart() && descontableSubtotal() === 0;
  // Construir el ticker mezclando descuentos (si aplican) + cutoff Red (si aplica).
  var chips = [];
  /* Ya se escondia con un carrito de solo combos, por la misma razon: el cartel
     no puede hablar de un descuento que este carrito no va a recibir. Con el
     premio de la ruleta puesto pasa lo mismo. */
  if (discountsActive() && !soloCombos && !(appliedCoupon && cartCount() > 0 && ahorroPorEfectivo() === 0)) {
    /* Hasta el 11/9/2026 iban tambien "🔥 10% OFF superando $100.000" y "No son
       acumulables · Máximo 10% OFF por pedido", que aclaraba que los dos no se
       sumaban. Con un solo descuento, esa aclaracion no tiene de que hablar. */
    /* Sin emoji y sin adorno: el CSS la pone en mayusculas, que es como
       lo escribe una tienda — no como lo escribiria un chat. */
    chips.push('10% OFF pagando en efectivo');
    chips.push('Los combos no participan de esta promoción');
  }
  // Chip de cutoff Red (aplica en Pilar Red haya descuentos o no).
  var cutoffChip = _pilarRedCutoffChip();
  if (cutoffChip) chips.push(cutoffChip);

  if (chips.length === 0) { bar.style.display = 'none'; return; }

  var msgEl = bar.querySelector('.promo-msg');
  if (msgEl) {
    // Duplicar la secuencia para el efecto marquee continuo
    var seq = chips.concat(chips).join(' &nbsp;·&nbsp; ') + ' &nbsp;·&nbsp;';
    msgEl.innerHTML = seq;
  }
  bar.style.display = '';
}
// Cutoff cambia a las 12:00 del jueves — refrescamos la barra promo cada minuto
// para que el mensaje pase de "abierto" a "cerrado" sin necesidad de recargar.
setInterval(function() {
  try { if (typeof updatePromoBar === 'function') updatePromoBar(); } catch(e) {}
}, 60000);
function updatePagoHint() {
  var hint = $id('pago-hint');
  if (!hint) return;
  var sel = document.querySelector('input[name="pago"]:checked');
  var isCash = sel && sel.value === 'Efectivo';
  // El 10% aplica a productos y carne, no a los combos: "hay algo que
  // descontar" se mide sobre descontableSubtotal. Si el carrito es solo combos
  // (pSub=0), no mostrar el cartel. Hasta el 11/9/2026 se escondia tambien
  // arriba de $100.000, porque ahi ya tenia el 10% por monto: ese se fue, y
  // el efectivo vuelve a ser la unica forma de tenerlo.
  var pSub = descontableSubtotal();
  /* `ahorroPorEfectivo()` y no `cashDiscountActive()`: con el premio de la
     ruleta puesto, el efectivo no agrega nada y prometerle un 10% que no va a
     ver es lo peor que puede hacer esta pantalla justo antes de que elija.
     (24/9/2026) */
  hint.style.display = (_anunciar10Hoy() && ahorroPorEfectivo() > 0 && !isCash && pSub > 0) ? '' : 'none';
  /* Con carne reservada no se transfiere todavia: el total cambia al pesarla. */
  var aliasHint = document.querySelector('#mp-alias .mp-alias-hint');
  if (aliasHint) {
    if (!aliasHint.getAttribute('data-texto')) aliasHint.setAttribute('data-texto', aliasHint.textContent);
    aliasHint.textContent = hayReservaEnCarrito()
      ? 'Mandá el pedido con el botón verde. Como llevás carne reservada, transferí cuando te confirmemos el total.'
      : aliasHint.getAttribute('data-texto');
  }
}
function updateShippingBar() {
  const bar = $id('shipping-bar');
  // En Pilar nunca mostrar la barra de envío gratis (el usuario lo pidió así)
  if (currentZone === 'pilar') { bar.classList.add('hidden'); return; }
  // En el resto: mostrar solo si la zona cobra envío AHORA
  if (!currentZone || getShipping() === 0) { bar.classList.add('hidden'); return; }
  const subtotal = cartTotal();
  if (cartCount() === 0) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  const fill = $id('shipping-bar-fill');
  const text = $id('shipping-bar-text');
  if (subtotal >= FREE_SHIPPING_MIN) {
    bar.classList.add('free');
    text.textContent = '¡Envío gratis! Tu pedido supera ' + ars(FREE_SHIPPING_MIN);
    fill.style.width = '100%';
    // Override shipping to 0
  } else {
    bar.classList.remove('free');
    const falta = FREE_SHIPPING_MIN - subtotal;
    text.textContent = 'Sumá ' + ars(falta) + ' más para envío gratis';
    fill.style.width = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100) + '%';
  }
}
// getShipping ya maneja FREE_SHIPPING_MIN internamente

/* ── MERCADO PAGO ALIAS ── */
/* Las cuentas de Maleu para transferir. El cliente elige la que le quede
   comoda: son las mismas dos que el ERP tiene dadas de alta.
   Una sola lista: la usan el formulario y el mensaje de WhatsApp. */
const ALIAS_MALEU = [
  { banco: 'Mercado Pago', alias: 'maleump' },
  { banco: 'Brubank',      alias: 'maleubru' }
];

// Los alias de Maleu central. Si el barrio (Pilar) tiene vendedor Red
// asignado (ej: Marcos Bottcher en El Lucero/Los Tacos), el cobro va al vendedor
// y el alias de Maleu no aplica — el vendedor le pasa el suyo al confirmar.
function _barrioPilarTieneVendedor() {
  if (currentZone !== 'pilar') return null;
  var sel = $id('f-pilar-barrio');
  if (!sel) return null;
  var val = sel.value;
  if (!val || val === '__otro__') return null;
  return barrioToVendedor[val.toLowerCase()] || null;
}
function onPagoChange() {
  const sel = document.querySelector('input[name="pago"]:checked');
  const alias = $id('mp-alias');
  const aliasNote = $id('mp-alias-vendedor-note');
  const esTransfer = sel && sel.value === 'Transferencia';
  const vendedor = _barrioPilarTieneVendedor();
  // Alias maleu (bloque azul con "maleump" + botón Copiar): se muestra cuando el
  // cliente elige transferencia y NO hay vendedor Red (Home, Pilar 'Otra zona',
  // o vendedor Red sin alias propio cargado).
  var mostrarAliasMaleu = esTransfer && (!vendedor || !vendedor.alias);
  if (mostrarAliasMaleu) { _pintarAliasMaleu(); alias.classList.remove('hidden'); }
  else { alias.classList.add('hidden'); }
  if (aliasNote) {
    if (esTransfer && vendedor) {
      var nombreCorto = (vendedor.nombre || '').split(' ')[0];
      if (vendedor.alias) {
        // Vendedor tiene alias cargado — se lo mostramos directo con botón Copiar.
        aliasNote.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap">' +
            '<span>Alias de ' + nombreCorto + ': <strong>' + vendedor.alias + '</strong></span>' +
            '<button type="button" onclick="copyVendedorAlias(\'' + vendedor.alias.replace(/\'/g, "\\'") + '\',\'' + nombreCorto + '\')" style="background:#E67C0E;color:#fff;border:none;border-radius:6px;padding:.3rem .7rem;font-family:var(--font);font-size:.75rem;font-weight:700;cursor:pointer">Copiar</button>' +
          '</div>';
      } else {
        aliasNote.textContent = nombreCorto + ' te va a pasar el alias al confirmar tu pedido.';
      }
      aliasNote.classList.remove('hidden');
    } else {
      aliasNote.classList.add('hidden');
    }
  }
  // Hint de descuento: mostrar solo cuando NO eligió efectivo
  updatePagoHint();
  updateUI();
  updateFormSummary();
}
/* Las filas de alias se dibujan desde ALIAS_MALEU y no estan escritas en el
   HTML: si maniana se suma o se cambia una cuenta, se toca un solo lugar y el
   WhatsApp dice lo mismo que la pantalla. */
function _pintarAliasMaleu() {
  var cont = $id('mp-alias-lista');
  if (!cont) return;
  cont.innerHTML = ALIAS_MALEU.map(function (c) {
    return '<div class="mp-alias-row">' +
      '<span><span class="mp-alias-banco">' + c.banco + '</span> <strong>' + c.alias + '</strong></span>' +
      '<button type="button" class="mp-copy-btn" onclick="copyAlias(\'' + c.alias + '\')">Copiar</button>' +
    '</div>';
  }).join('');
}
/* Copiar un alias sin quedarse callado si el navegador no deja (13/9/2026).
   `navigator.clipboard` no existe o rechaza en varios navegadores embebidos —
   el de Instagram y el de Facebook, que es justo donde cae un cliente que viene
   de la pauta— y el botón no hacía nada: ni copiaba ni avisaba. El alias es lo
   que el cliente necesita para pagar. Primero el portapapeles moderno, después
   el método viejo, y si ninguno anda se lo decimos con el alias escrito. */
function _copiarTexto(texto, alCopiar) {
  var fallo = function () {
    var ok = false;
    try {
      var ta = document.createElement('textarea');
      ta.value = texto;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.left = '0'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select(); ta.setSelectionRange(0, texto.length);
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) { ok = false; }
    if (ok) alCopiar();
    else toast('No pudimos copiarlo: el alias es ' + texto + ' — mantené apretado para copiarlo', 6000);
  };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(alCopiar, fallo);
      return;
    }
  } catch (e) { /* abajo */ }
  fallo();
}
function copyAlias(a) {
  var alias = a || ALIAS_MALEU[0].alias;
  _copiarTexto(alias, function () { toast('✓ Alias copiado: ' + alias, 2000); });
}
function copyVendedorAlias(alias, nombreCorto) {
  _copiarTexto(alias, function () { toast('✓ Alias de ' + nombreCorto + ' copiado: ' + alias, 2000); });
}

updateShippingBar();

// Listener global: cualquier input/change dentro del form refresca el hint
// del botón WhatsApp. Antes solo se disparaba en blur de inputs y cambio de
// pago — al elegir día/barrio/sub-barrio/etc. el hint quedaba desactualizado
// y el usuario no veía el aviso 'Te falta elegir el método de pago'.
(function _wireCtaRefresh() {
  var form = document.querySelector('.form-wrap');
  if (form) {
    form.addEventListener('input',  function() { updateWhatsappCta(); });
    form.addEventListener('change', function() { updateWhatsappCta(); });
  }
  // Day-picker: los "botones día" viven fuera del <form>. Delegación en el root.
  var dp = document.getElementById('day-picker');
  if (dp) dp.addEventListener('click', function() { setTimeout(updateWhatsappCta, 30); });
})();

/* ── MENU DE SECCIONES ─────────────────────────────────────────────────────
   Abre y cierra el panel del celular. En escritorio el menu va inline y este
   boton no se dibuja, asi que esta funcion no corre nunca ahi.

   Usa el atributo `hidden` y no style.display: es lo que el resto de la
   tienda ya hace, y asi un [hidden] en el CSS no puede pelearse con un
   display inline puesto por JS. */
function toggleMenu() {
  var panel = $id('menu-panel'), overlay = $id('menu-overlay'), btn = $id('menu-btn');
  if (!panel) return;
  var abriendo = panel.hidden;
  panel.hidden = !abriendo;
  if (overlay) overlay.hidden = !abriendo;
  if (btn) {
    btn.setAttribute('aria-expanded', abriendo ? 'true' : 'false');
    btn.setAttribute('aria-label', abriendo ? 'Cerrar el menú' : 'Abrir el menú');
    btn.classList.toggle('is-open', abriendo);
  }
  // Con el panel abierto, el fondo no scrollea. Ojo: esto ANTES era
  // body.style.overflow, que es justamente lo que iOS ignora — el comentario
  // decia que arreglaba el scroll de atras y no lo arreglaba.
  _fondoQuieto('menu', abriendo);
}

// Escape cierra el menu. Un panel que solo se cierra tocando exactamente el
// boton es una trampa en un celular.
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var fm = $id('fecha-modal');
    if (fm && fm.style.display === 'flex') { otraFechaNo(); return; }
    var panel = $id('menu-panel');
    if (panel && !panel.hidden) toggleMenu();
  }
});


/* ══════════════════════════════════════════════════════════════════
   BUSCADOR DEL CATALOGO                                    (8/9/2026)
   ══════════════════════════════════════════════════════════════════
   Filtra ocultando cards, nunca re-renderizando: asi el estado del
   carrito de cada card (el "- 2 +") no se toca. Ver parche_buscador.py
   en el scratchpad para el por que de cada decision. */

var _busqTexto = '';
/* Donde venia mirando antes de empezar a buscar, para devolverlo ahi cuando
   limpie. Ver _busqAcomodarScroll. */
var _busqScrollPrevio = null;

/* Minusculas y sin tildes, en las dos puntas: asi "pina" encuentra "Piña"
   y "jamon" encuentra "Jamón". */
function _busqNorm(s) {
  return String(s == null ? '' : s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function _busqEsc(s) {
  return String(s).replace(/[&<>"]/g, function(c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
  });
}

/* ── QUE ES BUSCAR UN PRODUCTO ──────────────────────────────────────
   Cada card guarda DOS textos, y no uno:

     fuerte = nombre + categoria      → lo que el cliente esta nombrando
     debil  = descripcion + porciones + chips

   Lo pidio Tadeo el 10/9/2026: buscaba "cebolla" y le salia "Sorrentinos
   Cordero al Malbec", porque su descripcion dice "cordero, zanahoria, apio,
   cebolla y especias". "Deberian aparecer los productos cuando el usuario
   tipea algo relacionado al producto, no a la descripcion."

   Los CHIPS van del lado debil aunque parezcan etiquetas: son de
   presentacion, no de producto —"Para 2-3 personas", "600g · 16 unidades",
   "Lista para cortar y servir"—. Ese ultimo era el que metia las TRES tortas
   en una busqueda de "cor", por la palabra "cortar".

   Medido sobre el catalogo real: "cebolla" pasa de 4 a 3, "cor" de 8 a 1,
   y "pollo" y "queso" no se mueven. */
function _busqTextosDeCard(card) {
  if (card.dataset.busqF !== undefined) {
    return { fuerte: card.dataset.busqF, debil: card.dataset.busqD };
  }
  var p = PROD_MAP[card.dataset.id] || COMBO_MAP[card.dataset.id];
  var fuerte, debil;
  if (p) {
    fuerte = _busqNorm([p.nombre, p.cat || ''].join(' '));
    debil = _busqNorm([p.desc || '', p.personas || ''].concat(p.chips || []).join(' '));
  } else {
    /* Por si algun dia hay una card sin mapa: se comporta como antes, todo
       junto, que es preferible a no encontrarla nunca. */
    fuerte = _busqNorm(card.innerText || '');
    debil = '';
  }
  card.dataset.busqF = fuerte;
  card.dataset.busqD = debil;
  return { fuerte: fuerte, debil: debil };
}

function _busqEntra(texto, palabras) {
  for (var i = 0; i < palabras.length; i++) {
    if (texto.indexOf(palabras[i]) === -1) return false;
  }
  return true;
}

/* ── DONDE QUEDA EL SCROLL AL BUSCAR ────────────────────────────────
   Al filtrar, la busqueda esconde "Los mas pedidos", las categorias, el
   ultimo pedido y todas las cards que no matchean. El documento se achica de
   golpe —de ~11.000px a ~3.000— y el navegador CLAMPEA el scroll al nuevo
   final: el cliente escribe una palabra y aterriza abajo de todo, mirando el
   pie de pagina, sin ver un solo resultado.

   Lo reporto Tadeo el 10/9/2026 desde su iPhone: "busco una palabra y me
   scrollea hacia el final. deberia arrancar de arriba hacia abajo".

   La regla es esa: los resultados arrancan ARRIBA. Y solo SUBE — si ya
   estabas mirando el buscador, no te mueve nada; empujar para abajo a alguien
   que ya esta arriba seria cambiar un problema por otro. */
function _busqTopeDeResultados() {
  var cat = $id('catalogo') || $id('catalog-root');
  if (!cat) return 0;
  /* _stickyOffsetPx() ya contempla la barra pegada arriba (buscador + info +
     categorias), asi que el primer resultado queda justo debajo y no tapado.
     Es la MISMA cuenta que usan los botones de categoria: dos formas de
     decidir "donde arranca el catalogo" se despegarian sin que nadie se
     entere. */
  return Math.max(0, cat.getBoundingClientRect().top + window.pageYOffset - _stickyOffsetPx());
}

/* El CSS le pone `scroll-behavior:smooth` al <html>, asi que un scrollTo
   pelado sale ANIMADO. En el celular esa animacion se corta sola apenas el
   dedo roza la pantalla y el cliente queda tirado a mitad de camino — ya paso
   con el salto al formulario. Acá ademas seria mareante: esto no es un viaje,
   es una correccion de posicion, y ocurre con cada tecla. */
function _busqSaltoSeco(y) {
  var root = document.documentElement;
  var prev = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, y);
  root.style.scrollBehavior = prev;
}

function _busqAcomodarScroll(hayBusqueda, habiaAntes) {
  if (hayBusqueda) {
    /* La primera tecla: me guardo donde venia mirando. Las siguientes no lo
       pisan — si no, cada tecla guardaria el tope y al limpiar no volveria a
       ningun lado. */
    if (!habiaAntes) _busqScrollPrevio = window.pageYOffset;
    var tope = _busqTopeDeResultados();
    if (window.pageYOffset > tope + 2) _busqSaltoSeco(tope);
    return;
  }
  /* Se limpio. Al reaparecer las secciones de arriba el catalogo se corre
     ~1.700px hacia abajo, asi que quedarse quieto significa aterrizar en
     cualquier otro lado. Lo devolvemos donde estaba. Vive aca y no en
     limpiarBusqueda() para que valga tambien cuando borra las letras a mano,
     que es como se limpia la mitad de las veces. */
  if (habiaAntes && _busqScrollPrevio !== null) {
    _busqSaltoSeco(_busqScrollPrevio);
    _busqScrollPrevio = null;
  }
}

function buscarEnCatalogo() {
  var inp = $id('buscador-input');
  if (!inp) return;
  var crudo = String(inp.value || '').trim();
  var q = _busqNorm(crudo).trim();
  var habia = !!_busqTexto;
  _busqTexto = q;

  var x = $id('buscador-x');
  if (x) x.hidden = !crudo;
  document.body.classList.toggle('busqueda-activa', !!q);

  /* Varias palabras tienen que estar TODAS: "pizza jamon" achica la lista,
     no la ensancha. */
  var palabras = q ? q.split(/\s+/) : [];

  var cards = document.querySelectorAll('#catalog-root .product-card[data-id]');

  /* Primero por el NOMBRE. Si no hay ni uno, recien ahi entra la descripcion:
     asi "cebolla" trae los tres que se llaman cebolla, pero "zanahoria" o
     "apio" —que no son el nombre de nada— igual encuentran el sorrentino de
     cordero en vez de dejarte en "no encontramos nada" sobre un producto que
     existe. El cliente se entera de cual de las dos cosas paso. */
  var porDescripcion = false;
  if (palabras.length) {
    var hayPorNombre = false;
    Array.prototype.forEach.call(cards, function(card) {
      if (_busqEntra(_busqTextosDeCard(card).fuerte, palabras)) hayPorNombre = true;
    });
    porDescripcion = !hayPorNombre;
  }

  var visibles = 0;
  Array.prototype.forEach.call(cards, function(card) {
    var t = _busqTextosDeCard(card);
    var entra = _busqEntra(porDescripcion ? (t.fuerte + ' ' + t.debil) : t.fuerte, palabras);
    card.classList.toggle('busq-oculto', !entra);
    if (entra) visibles++;
  });

  /* Una categoria sin ninguna card visible no tiene por que dejar su titulo
     colgado arriba de un hueco. Los combo-group son hijos de la seccion de
     combos, asi que al quedar los dos vacios se ocultan los dos. */
  var secciones = document.querySelectorAll('#catalog-root .cat-section, #catalog-root .combo-group');
  Array.prototype.forEach.call(secciones, function(sec) {
    var quedan = sec.querySelectorAll('.product-card[data-id]:not(.busq-oculto)').length;
    sec.classList.toggle('busq-oculto', palabras.length > 0 && quedan === 0);
  });

  _busqPintarInfo(visibles, crudo, porDescripcion);

  /* Al final de todo: la info de arriba cambia el alto de la barra pegada, y
     el tope se calcula con ese alto ya puesto. */
  _busqAcomodarScroll(!!q, habia);
}

/* El renglon que va debajo del buscador.

   Tuvo chips con los nombres de cada resultado, y Tadeo los dio de baja el
   mismo 10/9/2026: "abortalo, que solo aparezca 3 de 36 productos coinciden
   con tu busqueda, continua bajando para pedir". Los resultados ya quedan
   justo debajo de la barra —de eso se ocupa _busqAcomodarScroll—, asi que
   nombrarlos arriba era decir dos veces lo mismo.

   Lo que si hacia falta era la segunda linea: el numero solo no dice que hay
   que hacer con el. */
function _busqPintarInfo(visibles, crudo, porDescripcion) {
  var info = $id('buscador-info');
  if (!info) return;
  if (!_busqTexto) { info.hidden = true; info.innerHTML = ''; return; }
  info.hidden = false;
  if (visibles === 0) {
    info.className = 'buscador-info vacio';
    info.innerHTML =
      '<span>No encontramos nada con <b>' + _busqEsc(crudo) + '</b></span>' +
      '<button type="button" class="buscador-limpiar" onclick="limpiarBusqueda()">Ver todo</button>';
    return;
  }
  info.className = 'buscador-info';
  var sust = visibles === 1 ? ' producto ' : ' productos ';
  var verbo = visibles === 1 ? 'coincide' : 'coinciden';
  /* Si ningun producto SE LLAMA asi, se dice. Sin eso, "cebolla" y
     "zanahoria" devuelven renglones que se leen igual y significan cosas
     distintas. */
  var cuenta = porDescripcion
    ? '<b>' + visibles + '</b>' + sust + verbo + ' por su descripción'
    : '<b>' + visibles + '</b>' + sust + verbo + ' con tu búsqueda';
  /* NO se dice "de 34": Tadeo lo saco el 10/9/2026 — el total del catalogo
     no es lo que vino a buscar, y obliga a restar de cabeza para saber cuantos
     quedaron afuera.

     Y recien ahi entro "con tu busqueda", que hace unas horas habia que sacar
     porque partia el renglon en dos. El texto es MAS largo que el de antes (37
     caracteres contra 27), pero mas corto que el que no entraba — los dos
     juntos eran 43. Medido a 390px: un renglon, 47px, el mismo alto de siempre.

     Si se toca el texto, se vuelve a medir: dos renglones suben la barra
     pegada 15px, y el tope del scroll se calcula con ese alto. */
  info.innerHTML =
    '<div class="busq-texto">' +
      '<span class="busq-cuenta' + (porDescripcion ? ' busq-porque' : '') + '">' + cuenta + '</span>' +
      '<span class="busq-guia">Seguí bajando para pedirlos ↓</span>' +
    '</div>' +
    '<button type="button" class="buscador-limpiar" onclick="limpiarBusqueda()">Limpiar</button>';
}

function limpiarBusqueda() {
  var inp = $id('buscador-input');
  if (inp) inp.value = '';
  buscarEnCatalogo();
}

/* ── EL PREMIO DE LA RULETA (22/9/2026) ──────────────────────────────────────
   maleu.com.ar/ruleta da un codigo RUL-XXXX y manda aca con ?cupon=RUL-XXXX.
   Es un cupon REGALO ("3 empanadas de regalo"): no descuenta plata, se suma al
   pedido, sirve UNA vez y es para el primer pedido. Se guarda en el celular
   hasta que se use o venza: el que escaneo el QR en la puerta del colegio y
   pide a la noche lo tiene cargado igual. Viaja en el pedido (`postData.cupon`)
   y el backend lo marca usado al guardar el pedido. */
var CUPON_GUARDADO = 'maleu_cupon_premio';
function _premioActivo() {
  return !!(appliedCoupon && appliedCoupon.tipo === 'REGALO' && cuponValeEnEstaZona()
            && cartTotal() >= (appliedCoupon.minimo || 0));
}
(function () {
  var q = '';
  try { q = (new URLSearchParams(location.search).get('cupon') || '').trim().toUpperCase(); } catch (e) {}
  if (q) {
    try { localStorage.setItem(CUPON_GUARDADO, q); } catch (e) {}
    try { var u = new URL(location.href); u.searchParams.delete('cupon'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch (e) {}
  }
  var cod = q;
  if (!cod) { try { cod = localStorage.getItem(CUPON_GUARDADO) || ''; } catch (e) {} }
  /* `RUL-` y `RULETA-`. Los primeros (22/9/2026) eran REGALO; desde el
     24/9/2026 Backend emite `RULETA-XXXX` tipo PCT. El link solo aceptaba los
     viejos, asi que un premio de la ruleta nueva entraba a la tienda y NO SE
     APLICABA: ni el descuento, ni la marca de "lo trajimos nosotros". Se
     encontro el dia anterior a Los Robles, leyendo el pedido de Backend.

     El filtro no es decoracion: lo que llega por la URL se manda al backend a
     validar, y aceptar cualquier cosa seria pegarle con lo que escriba
     cualquiera. El codigo escrito a mano tiene su propia puerta (applyCoupon),
     que es donde corresponde que se pueda probar cualquier cosa. */
  if (!/^RUL(?:ETA)?-[A-Z0-9]{4,}$/.test(cod)) return;
  fetch(APPS_SCRIPT_URL + '?action=validarCupon&codigo=' + encodeURIComponent(cod) + '&t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || !d.ok) {
        try { localStorage.removeItem(CUPON_GUARDADO); } catch (e) {}
        if (q && d && d.error) toast(d.error, 3500);
        return;
      }
      if (appliedCoupon && appliedCoupon.tipo !== 'REGALO') return;   // no pisa otro cupon
      /* Un cupon `RUL-…` VALIDADO POR EL BACKEND quiere decir que esta persona
         giro la ruleta, o sea que la trajimos nosotros. Se marca aca y no al
         leer la URL a proposito: un codigo tipeado a mano no le puede sacar un
         cliente a un vendedor. (24/9/2026) */
      var _eraNuestro = _esNuestro();
      _guardarOrigenNuestro({ o: 'ruleta', d: '', r: '', cupon: d.codigo, t: Date.now() });
      if (!_eraNuestro) _repintarPorOrigen();
      appliedCoupon = { codigo: d.codigo, tipo: d.tipo, valor: d.valor, scope: d.scope, mensaje: d.mensaje, stack: !!d.stack, minimo: Number(d.minimo) || 0 };
      try { updateUI(); } catch (e) {}
      if (q) toast('🎁 Tu premio quedó cargado: ' + (d.mensaje || d.codigo), 3500);
    })
    .catch(function () {});
})();
