// Importar las dependencias necesarias
const fs = require('fs').promises; // Usamos 'promises' para async/await
const path = require('path');

// 1. IMPORTAR TU MÓDULO
// Asegúrate de que el nombre ('./tu_archivo_principal.js') coincida con el 
// nombre del archivo donde guardaste las funciones que te pasé.
const { generateUserProfileCard } = require('./genshin_cards.js'); // <--- ¡CAMBIA ESTO!

// --- Configuración ---
const JUGADOR_UID = '642961104'; // UID del jugador que quieres buscar
const NOMBRE_ARCHIVO_SALIDA = 'tarjeta_usuario.png'; // Nombre del archivo a guardar
// --------------------

/**
 * Función principal asíncrona para generar y guardar la tarjeta.
 */
async function crearTarjeta() {
  console.log(`[INFO] Comenzando la generación de la tarjeta para el UID: ${JUGADOR_UID}...`);

  try {
    // 2. LLAMAR A LA FUNCIÓN
    // Llama a la función que te di y espera el buffer de la imagen.
    const imageBuffer = await generateUserProfileCard(JUGADOR_UID);

    // 3. DEFINIR LA RUTA DE SALIDA
    // Esto guardará el archivo en el mismo directorio donde ejecutes el script.
    const outputPath = path.resolve(__dirname, NOMBRE_ARCHIVO_SALIDA);

    // 4. GUARDAR EL ARCHIVO
    // Escribe el buffer de la imagen en el disco.
    await fs.writeFile(outputPath, imageBuffer);

    console.log(`[ÉXITO] ¡Tarjeta generada y guardada exitosamente!`);
    console.log(`       -> Ubicación: ${outputPath}`);

  } catch (error) {
    // Manejo de errores
    console.error(`[ERROR] No se pudo generar la tarjeta:`, error);
  }
}

// 5. EJECUTAR EL SCRIPT
crearTarjeta();