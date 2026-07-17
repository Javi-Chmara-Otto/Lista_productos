// scripts/optimizar-imagenes.js
//
// Convierte todas las imágenes de assets/productos/ (.png, .jpg, .jpeg)
// a formato WebP, manteniendo el mismo nombre de archivo (solo cambia la extensión).
//
// USO:
//   1. Instalar la dependencia (una sola vez):
//        npm install sharp --save-dev
//   2. Correr el script:
//        node scripts/optimizar-imagenes.js
//
// El script NO borra los archivos originales (.png/.jpg) — los deja como
// respaldo. Podés borrarlos manualmente después de confirmar que todo
// funciona bien en el sitio.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const CARPETA_PRODUCTOS = path.join(__dirname, "..", "assets", "productos");
const EXTENSIONES_VALIDAS = [".png", ".jpg", ".jpeg"];
const CALIDAD_WEBP = 82; // 0-100. 80-85 es buen balance calidad/peso para fotos de producto.

async function optimizarImagenes() {
    if (!fs.existsSync(CARPETA_PRODUCTOS)) {
        console.error(`❌ No se encontró la carpeta: ${CARPETA_PRODUCTOS}`);
        process.exit(1);
    }

    const archivos = fs.readdirSync(CARPETA_PRODUCTOS);
    const imagenes = archivos.filter(archivo =>
        EXTENSIONES_VALIDAS.includes(path.extname(archivo).toLowerCase())
    );

    if (imagenes.length === 0) {
        console.log("No se encontraron imágenes .png/.jpg/.jpeg para convertir.");
        return;
    }

    console.log(`Encontradas ${imagenes.length} imágenes. Convirtiendo a WebP...\n`);

    let convertidas = 0;
    let errores = 0;
    let pesoOriginalTotal = 0;
    let pesoNuevoTotal = 0;

    for (const archivo of imagenes) {
        const rutaOriginal = path.join(CARPETA_PRODUCTOS, archivo);
        const nombreSinExtension = path.basename(archivo, path.extname(archivo));
        const rutaWebp = path.join(CARPETA_PRODUCTOS, `${nombreSinExtension}.webp`);

        try {
            const statsOriginal = fs.statSync(rutaOriginal);

            await sharp(rutaOriginal)
                .resize(800, 800, { fit: "inside", withoutEnlargement: true }) // limita tamaño máximo sin agrandar imágenes chicas
                .webp({ quality: CALIDAD_WEBP })
                .toFile(rutaWebp);

            const statsNuevo = fs.statSync(rutaWebp);
            pesoOriginalTotal += statsOriginal.size;
            pesoNuevoTotal += statsNuevo.size;

            const ahorro = (100 - (statsNuevo.size / statsOriginal.size) * 100).toFixed(0);
            console.log(`✅ ${archivo} → ${nombreSinExtension}.webp (-${ahorro}%)`);
            convertidas++;
        } catch (err) {
            console.error(`❌ Error convirtiendo ${archivo}:`, err.message);
            errores++;
        }
    }

    console.log(`\n─────────────────────────────`);
    console.log(`Convertidas: ${convertidas}/${imagenes.length}`);
    if (errores > 0) console.log(`Errores: ${errores}`);
    if (pesoOriginalTotal > 0) {
        const ahorroTotal = (100 - (pesoNuevoTotal / pesoOriginalTotal) * 100).toFixed(0);
        console.log(`Peso total: ${(pesoOriginalTotal / 1024 / 1024).toFixed(1)}MB → ${(pesoNuevoTotal / 1024 / 1024).toFixed(1)}MB (-${ahorroTotal}%)`);
    }
    console.log(`\nLos archivos originales NO se borraron. Cuando confirmes que todo`);
    console.log(`funciona bien en el sitio, podés borrarlos manualmente.`);
}

optimizarImagenes();