# Arquitectura del Sistema Splitly 2.0

Splitly se basa en una arquitectura modular de WebAssembly del lado del cliente, diseñada para ofrecer un procesamiento de medios seguro y determinista sin servidores externos.

---

## 1. Diagrama de Arquitectura de Alto Nivel

```mermaid
graph TD
    UI["Interfaz de Usuario (JS Vanilla + Vite)"] --> I18N["Motor i18n (Reactivo)"]
    UI --> QM["Gestor de Cola (Máquina de Estados)"]
    QM --> PE["Motor de Procesamiento (Pool y Cancelación)"]
    PE --> FW["Wrapper de Mismo Origen de FFmpeg"]
    FW --> WW["Web Worker de Mismo Origen (ffmpeg-worker.js)"]
    WW --> WASM["FFmpeg Core WebAssembly (.wasm)"]
    WASM --> VFS["Sistema de Archivos Virtual en Memoria (FS)"]
    VFS --> BLOB["Generación de Blobs y URLs de Objetos"]
    BLOB --> DL["Descarga de Archivos en el Navegador"]
```

---

## 2. Módulos Principales

### `src/i18n/` (Internacionalización)
- **`index.js`**: Almacén reactivo con interpolación de plurales (`one` / `other`), reemplazo de variables, detección de idioma (localStorage -> navigator.language -> inglés por defecto) y sincronización del título y atributos del documento.
- **`locales/en.json` y `locales/es.json`**: Diccionarios de traducción con 100% de paridad verificada por pruebas automáticas.

### `src/core/`
- **`media.js`**: Inspección de formatos, formateo de tamaños y duraciones, sondeo de metadatos con tiempo de espera seguro, saneamiento de nombres de archivo y estimaciones de salida.
- **`queue.js`**: Máquina de estados `QueueItem` y `QueueManager` para altas de archivos, descarte de duplicados y liberación de memoria (`URL.revokeObjectURL`).
- **`processing.js`**: Motor de ejecución y concurrencia con cerrojo de cancelación, división de video por copia de stream y extracción de audio AAC en M4A.

### `src/ffmpeg/`
- **`wrapper.js`**: Subclase de `@ffmpeg/ffmpeg` que inyecta la URL del worker del mismo origen (`classWorkerURL`).
- **`worker.js`**: Web Worker de mismo origen que gestiona mensajes (`LOAD`, `EXEC`, `WRITE_FILE`, `READ_FILE`, `DELETE_FILE`, `PROGRESS`, `LOG`) para evitar bloqueos CORS en GitHub Pages.

---

## 3. Máquina de Estados de la Cola

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> preparing: Iniciar Motor
    preparing --> processing: Cargar Archivo
    processing --> completed: Éxito (Salidas > 0)
    processing --> cancelling: Cancelar Usuario
    preparing --> cancelling: Cancelar Usuario
    cancelling --> cancelled: Worker Detenido y Limpio
    processing --> failed: Error de Ejecución / OOM
    failed --> queued: Reintentar
    cancelled --> queued: Reintentar
```

---

## 4. Flujo de Cancelación

```mermaid
sequenceDiagram
    actor Usuario
    participant Motor as ProcessingEngine
    participant Item as QueueItem
    participant Worker as FFmpeg Worker

    Usuario->>Motor: Clic en Cancelar
    Motor->>Motor: Activar abortLatch = true
    Motor->>Item: Cambiar estado a 'cancelling'
    Motor->>Worker: runner.terminate()
    Worker-->>Motor: Worker detenido
    Motor->>Item: Cambiar estado a 'cancelled'
    Motor->>Motor: Restablecer abortLatch = false
    Motor->>Usuario: Actualizar UI y Mostrar Notificación
```
