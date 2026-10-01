# Splitly — Divisor y Extractor de Video para NotebookLM

Aplicación web 100% del lado del cliente para dividir videos grandes o extraer únicamente la pista de audio optimizada para **NotebookLM**, Discord, WhatsApp o correo, sin subir archivos a ningún servidor.

![Splitly](https://raw.githubusercontent.com/santi-osp/DividirVideosNotebookLM/main/index.html)

---

## ✨ Características principales

- 🔒 **100% Privado y Local:** Todo el procesamiento ocurre en tu navegador mediante WebAssembly (`@ffmpeg/ffmpeg`). Tus archivos nunca se suben a ningún servidor externo.
- 🎙️ **Modo NotebookLM (Solo Audio):** Extrae la pista de audio en formato M4A/AAC de alta fidelidad y peso pluma. Una grabación de 1.5 horas (~1 GB de video) se convierte en un único archivo de ~30–45 MB listo para NotebookLM, ahorrando cuota de fuentes y tiempo.
- 🎬 **División de Video por Tamaño:** Divide videos en partes según el límite en MB que configures, conservando los streams originales sin pérdida de calidad siempre que sea posible.
- ⚡ **Presets Rápidos:**
  - **NotebookLM:** 190 MB (con margen sobre el límite oficial de 200 MB).
  - **Discord:** 25 MB.
  - **WhatsApp:** 16 MB / 64 MB.
  - **Email:** 25 MB.
  - **Personalizado:** Configura cualquier valor entre 10 MB y 2000 MB.
- 🛑 **Botón de Cancelar:** Detén cualquier proceso en curso de forma inmediata sin tener que recargar la pestaña.
- 📊 **Estimación en tiempo real:** Conoce cuántas partes aproximadas se generarán antes de iniciar el procesamiento.
- 🔊 **Notificación sonora:** Aviso sonoro al finalizar las tareas en segundo plano.

---

## 🚀 Uso inmediato

No necesita backend ni base de datos. Puedes servir esta carpeta con cualquier servidor estático HTTP local:

```bash
# Con Python
python -m http.server 8080

# O con Node / npx
npx serve .
```

Luego abre en tu navegador `http://localhost:8080`.

### Desarrollo y Build con Vite

Si prefieres usar Vite para desarrollo o empaquetado:

```bash
npm install
npm run dev      # Servidor de desarrollo
npm run build    # Compila a /dist
npm run preview  # Previsualiza la build de producción
```

---

## 🌐 Compatibilidad con GitHub Pages

Esta versión incluye `src/ffmpeg-worker.js` y `src/ffmpeg-wrapper.js` para que el Web Worker de `@ffmpeg/ffmpeg` se cargue desde el mismo origen de GitHub Pages. Esto evita el error de seguridad CORS del navegador:

```text
Failed to construct 'Worker': Script at 'https://cdn.jsdelivr.net/.../worker.js' cannot be accessed from origin 'https://<usuario>.github.io'
```

El core y el WASM se descargan directamente desde jsDelivr vía CDN la primera vez, pero tus videos **nunca se transmiten a internet ni salen de tu equipo**.

---

## 📝 Licencia

MIT
