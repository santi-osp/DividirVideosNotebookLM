# Guía de Desarrollo de Splitly

Este documento proporciona instrucciones para desarrolladores que deseen compilar, probar, contribuir y publicar mejoras en Splitly.

---

## 1. Referencia de Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo Vite con Hot Module Replacement (HMR). |
| `npm run build` | Compila los recursos de producción en el directorio `dist/`. |
| `npm run preview` | Inicia un servidor local para previsualizar los archivos de `dist/`. |
| `npm run test` | Ejecuta la suite de pruebas unitarias automatizadas con Vitest. |
| `npm run check:i18n` | Comprueba la paridad exacta entre `en.json` y `es.json`. |
| `npm run check:docs` | Verifica la integridad y paridad de la documentación bilingüe. |
| `npm run fixtures` | Genera archivos sintéticos MP4 y WebM usando FFmpeg y FFprobe. |
| `npm run screenshots` | Ejecuta Playwright para capturar las vistas de la UI y generar el GIF/MP4. |

---

## 2. Estructura de Directorios

```text
DividirVideosNotebookLM/
├── assets/
│   └── branding/              # Logotipos vectoriales, iconos y guía de marca
├── docs/
│   ├── assets/                # Capturas de pantalla reales y demostración GIF/MP4
│   ├── development/           # AUDIT.md, DESIGN_DECISIONS.md, TESTING.md
│   ├── en/                    # Documentación técnica y de usuario en inglés
│   └── es/                    # Documentación técnica y de usuario en español
├── public/                    # Favicons, iconos táctiles y tarjeta Open Graph
├── scripts/                   # Scripts de verificación y automatización
├── src/
│   ├── core/                  # Utilidades de medios, gestor de colas y motor
│   ├── ffmpeg/                # Wrapper y worker de mismo origen
│   ├── i18n/                  # Almacén reactivo de traducciones y archivos JSON
│   ├── main.js                # Punto de entrada de la aplicación y renderizado
│   └── styles.css             # Estilos de tema, diseño y accesibilidad
└── tests/
    ├── fixtures/              # Medios sintéticos de prueba generados con FFmpeg
    └── unit/                  # Pruebas unitarias (media, queue, i18n)
```

---

## 3. Flujo para Nuevas Funcionalidades o Correcciones

1. Escribe pruebas unitarias en `tests/unit/` para cualquier cálculo de medios o lógica de estado.
2. Si añades textos visibles, actualiza tanto `src/i18n/locales/en.json` como `src/i18n/locales/es.json`.
3. Ejecuta `npm run test && npm run check:i18n && npm run check:docs` antes de confirmar cambios.
4. Mantén todo el procesamiento en el cliente. No introduzcas llamadas a servidores remotos ni telemetría.
