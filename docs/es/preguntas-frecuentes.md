# Preguntas Frecuentes (FAQ)

### 1. ¿Mis videos o audios se suben a algún servidor?
**No.** Splitly funciona 100% del lado del cliente. El procesamiento, división y codificación ocurren en la memoria local de tu navegador mediante WebAssembly (`@ffmpeg/ffmpeg`). Tus archivos nunca salen de tu equipo.

### 2. ¿Por qué necesita conexión a internet la primera vez?
Splitly descarga el motor WebAssembly (`ffmpeg-core.js` y `ffmpeg-core.wasm`, ~31 MB) desde un CDN público (jsDelivr) la primera vez que inicias un proceso. Una vez que tu navegador lo guarda en caché, no se requiere transferir datos de medios.

### 3. ¿Cuál es el tamaño máximo de archivo que puede procesar?
Splitly admite archivos de video de hasta aproximadamente **2 GB**. Esta limitación proviene de la arquitectura de memoria lineal de 32 bits de los sistemas de archivos virtuales de WebAssembly. Por estabilidad, se recomienda procesar 1 archivo a la vez para videos de más de 300 MB.

### 4. ¿Por qué el navegador consume memoria RAM durante el proceso?
FFmpeg.wasm crea un sistema de archivos virtual en memoria. Cargar un video de 1 GB y procesar sus flujos requiere espacio en la memoria del navegador. Splitly revoca automáticamente las URLs de objetos y elimina archivos temporales para evitar fugas de memoria.

### 5. ¿Por qué las partes de video a veces varían ligeramente en duración o tamaño?
Al dividir video sin recodificar (`-c copy`), los cortes solo pueden realizarse sobre **Keyframes (fotogramas clave)**. Si un video tiene un intervalo largo entre keyframes (de 5 a 10 segundos), FFmpeg corta en el keyframe anterior más cercano, lo que produce pequeñas variaciones en la duración de las partes.

### 6. ¿Es necesario registrarse o pagar para usar Splitly?
**No.** Splitly es software libre y de código abierto (FOSS) bajo licencia MIT. No existen cuentas, suscripciones ni planes de pago.

### 7. ¿NotebookLM soporta subir videos directamente?
NotebookLM admite archivos de audio (MP3, M4A, WAV), documentos de Google, PDFs y texto, pero no extrae automáticamente el audio de archivos de video pesados. El modo **Extraer Audio** de Splitly genera un archivo M4A ultraligero (~35 MB para 1.5 horas) que se sube limpiamente a NotebookLM sin agotar tu límite de fuentes.

### 8. ¿Está Splitly afiliado oficialmente con Google o NotebookLM?
**No.** Splitly es un proyecto open source independiente creado por Santiago Ospina Arango. No está afiliado, respaldado ni patrocinado por Google, Discord o WhatsApp.
