# Guía de Usuario de Splitly

Esta guía explica cómo dividir archivos de video, extraer pistas de audio optimizadas, configurar presets de tamaño y gestionar la cola de procesamiento.

---

## 1. Selección de Modo

Splitly ofrece dos modos principales de operación:

### 🎬 Modo Dividir Video
Divide archivos de video completos según el tamaño máximo configurado (en MB), conservando tanto el video como el audio original mediante copia de stream (`-c copy`) sin pérdida de calidad siempre que sea posible.

### 🎙️ Modo Extraer Audio (Optimizado para NotebookLM)
Extrae la pista de audio y la codifica en formato AAC de alta fidelidad dentro de un contenedor M4A a 96 kbps con `+faststart`.
- **Caso de uso**: Una grabación de 1.5 horas (~1 GB de video) se convierte en un único archivo de audio M4A de apenas ~35–45 MB.
- **Por qué**: Las fuentes en NotebookLM tienen un límite de 200 MB por archivo, y procesar únicamente audio es hasta 10 veces más rápido, ahorrando cuota de fuentes.

---

## 2. Carga de Archivos de Video

- **Arrastrar y soltar**: Arrastra uno o varios archivos de video a la zona central.
- **Selector de archivos**: Haz clic en **"selecciona archivos"** para abrir el explorador de tu sistema.
- **Formatos admitidos**: MP4, MOV, MKV, WebM, AVI, M4V, TS, MPG.
- **Límite de tamaño**: Hasta ~2 GB por archivo (límite práctico de memoria lineal para sistemas de archivos virtuales WebAssembly de 32 bits).

---

## 3. Configuración de Límites y Presets

En el modo **Dividir Video**, configura el tamaño máximo de cada fragmento:
- **NotebookLM (190 MB)**: Diseñado para Google NotebookLM (límite oficial de 200 MB menos un margen de seguridad de 10 MB para metadatos del contenedor MP4).
- **Discord (25 MB)**: Límite estándar para cuentas gratuitas de Discord.
- **WhatsApp (16 MB / 64 MB)**: 16 MB para multimedia estándar; 64 MB para archivos enviados como documentos.
- **Email (25 MB)**: Umbral de adjuntos habitual en Gmail y Outlook.
- **Personalizado**: Modifica el campo numérico o utiliza los botones **−** y **+** (entre 10 MB y 2000 MB).

---

## 4. Concurrencia de Procesamiento

- **1 a la vez (Recomendado)**: Minimiza el consumo de memoria del navegador. Esencial para archivos de más de 300 MB.
- **2 en paralelo**: Útil en equipos con 8 GB o más de RAM para procesar varios clips pequeños simultáneamente.

---

## 5. Control de la Cola y Cancelación

- **Iniciar**: Haz clic en **"Dividir videos"** o **"Extraer audio"**.
- **Progreso en tiempo real**: La barra de progreso refleja el tiempo de decodificación y el estado describe la fase actual (`Iniciando motor`, `Copiando archivo`, `Extrayendo audio`, `Creando parte N`).
- **Cancelación inmediata**: Pulsa el botón rojo **"Cancelar"** en cualquier momento. Splitly interrumpe inmediatamente el worker de WebAssembly, libera la memoria y marca el elemento como cancelado sin generar falsas alertas de error.
- **Reintentar**: Los trabajos cancelados o con error pueden reactivarse pulsando **"Procesar pendientes"**.

---

## 6. Descarga de Resultados

- **Descarga individual**: Haz clic en el icono de descarga junto a cualquier parte en la lista de resultados.
- **Descargar todo**: Pulsa **"Descargar las N partes"**. Splitly espacia las descargas con un intervalo de 450 ms para evitar que el navegador bloquee descargas automáticas múltiples.
- **Vista previa en el navegador**: Haz clic en el icono de reproducción para previsualizar el video o escuchar el audio extraído en el reproductor integrado.
