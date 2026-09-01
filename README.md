# Splitly — divisor de video estático

Aplicación web 100% del lado del cliente para dividir uno o varios videos en partes con un tamaño máximo configurable.

## Uso inmediato

No necesita backend ni build. Sirve esta carpeta con cualquier hosting estático o servidor HTTP local. Por ejemplo:

    python -m http.server 8080

Luego abre `http://localhost:8080`.

También puedes usar Vite si prefieres:

    npm install
    npm run dev

## Funciones

- Uno o varios videos por arrastrar/soltar o selector.
- 190 MB por parte por defecto, configurable.
- 1 video a la vez o 2 en paralelo.
- FFmpeg WebAssembly, sin subir archivos a un backend.
- Stream copy (`-c copy`) para conservar calidad cuando el formato lo permite.
- Progreso, errores, vista previa y descarga de cada parte.
- Responsive, accesible por teclado y compatible con `prefers-reduced-motion`.

## Nota

El core de FFmpeg (~31 MB) se descarga desde jsDelivr al iniciar el primer procesamiento. Los videos permanecen en tu navegador. Para archivos muy grandes usa **1 a la vez** para reducir consumo de memoria.
