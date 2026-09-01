# Splitly — divisor de video estático

Aplicación web 100% del lado del cliente para dividir uno o varios videos en partes con un tamaño máximo configurable.

## Uso inmediato

No necesita backend. Sirve esta carpeta con cualquier hosting estático o servidor HTTP local. Por ejemplo:

    python -m http.server 8080

Luego abre `http://localhost:8080`.

## GitHub Pages

Esta versión incluye `src/ffmpeg-worker.js` y `src/ffmpeg-wrapper.js` para que el Web Worker de `@ffmpeg/ffmpeg` se cargue desde el mismo origen de GitHub Pages. Esto evita el error del navegador:

    Failed to construct 'Worker': Script at 'https://cdn.jsdelivr.net/.../worker.js' cannot be accessed from origin 'https://<usuario>.github.io'

El core y el WASM siguen descargándose desde jsDelivr, pero los videos nunca se suben a un servidor.

## Funciones

- Uno o varios videos por arrastrar/soltar o selector.
- 190 MB por parte por defecto, configurable.
- 1 video a la vez o 2 en paralelo.
- FFmpeg WebAssembly, sin subir archivos a un backend.
- Stream copy (`-c copy`) para conservar calidad cuando el formato lo permite.
- Progreso, errores, vista previa y descarga de cada parte.
- Responsive, accesible por teclado y compatible con `prefers-reduced-motion`.

## Nota

Para archivos muy grandes usa **1 a la vez** para reducir consumo de memoria.
