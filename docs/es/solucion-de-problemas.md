# Solución de Problemas

Esta guía cubre los problemas comunes, mensajes de error y soluciones al utilizar Splitly.

---

## 1. Memoria Insuficiente (OOM) o Cierre de la Pestaña

- **Síntoma**: La pestaña del navegador se cierra inesperadamente, muestra `Código de error: Memoria insuficiente` o Splitly muestra *"El navegador se quedó sin memoria"*.
- **Causa**: WebAssembly en entornos de navegador de 32 bits no puede direccionar más de ~2–3 GB de memoria lineal. Procesar archivos grandes (>800 MB) con concurrencia paralela (2 a la vez) puede agotar este límite.
- **Solución**:
  1. Configura la Concurrencia en **"1 a la vez"**.
  2. Cierra pestañas inactivas para liberar memoria en el sistema.
  3. Para archivos cercanos a 2 GB, considera usar el modo de extracción de audio o recortar el archivo previamente.

---

## 2. "No se pudo descargar el motor WebAssembly de FFmpeg"

- **Síntoma**: Aparece un mensaje de error al iniciar el procesamiento.
- **Causa**: El navegador no pudo descargar `ffmpeg-core.js` y `ffmpeg-core.wasm` desde el CDN (jsDelivr) debido a una interrupción de red o a un bloqueador de contenido.
- **Solución**:
  1. Verifica tu conexión a internet.
  2. Desactiva temporalmente extensiones de bloqueo estricto que impidan cargar scripts de CDNs externos.
  3. Recarga la página y vuelve a intentarlo.

---

## 3. La Duración del Video Muestra "Analizando…" o Queda Indeterminada

- **Síntoma**: La duración del video aparece como `Analizando…` o `—`.
- **Causa**: Ciertos contenedores (MKV, AVI) o códecs (HEVC, ProRes) no pueden ser leídos de forma nativa por la etiqueta `<video>` de HTML5 en algunos navegadores.
- **Solución**: Splitly cuenta con un tiempo de espera automático de 4 segundos y realiza una estimación basada en el tamaño del archivo. El video puede dividirse o extraerse a audio sin inconvenientes.

---

## 4. Bloqueo de Múltiples Descargas

- **Síntoma**: Al pulsar "Descargar las N partes", solo se descarga el primer archivo.
- **Causa**: Las políticas de seguridad de algunos navegadores bloquean descargas múltiples automáticas iniciadas por un solo clic.
- **Solución**: Splitly aplica una pausa preventiva de 450 ms entre cada archivo. Si el navegador pregunta *"¿Deseas permitir que este sitio descargue varios archivos?"*, selecciona **Permitir**.
