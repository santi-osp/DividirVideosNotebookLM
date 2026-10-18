# Primeros Pasos con Splitly

Splitly no requiere registro de usuario, ni claves de API, ni base de datos. Se ejecuta directamente en navegadores web modernos compatibles con WebAssembly.

---

## 1. Uso desde la Web (Recomendado)

Puedes usar Splitly inmediatamente desde GitHub Pages:

👉 **[https://santi-osp.github.io/DividirVideosNotebookLM/](https://santi-osp.github.io/DividirVideosNotebookLM/)**

No se requieren extensiones de navegador ni software adicional.

---

## 2. Ejecución Local desde el Código Fuente

Si deseas ejecutar Splitly en tu propio equipo o contribuir al proyecto:

### Requisitos previos
- [Node.js](https://nodejs.org) (v20 o superior)
- Navegador web moderno (Chrome, Edge, Firefox, Safari)

### Comandos de inicio rápido
```bash
# Clonar el repositorio
git clone https://github.com/santi-osp/DividirVideosNotebookLM.git
cd DividirVideosNotebookLM

# Instalar dependencias de forma reproducible
npm ci

# Iniciar servidor de desarrollo Vite
npm run dev
```
Abre `http://localhost:5173/` en tu navegador.

### Previsualizar la Compilación de Producción
```bash
npm run build
npm run preview
```
Abre `http://localhost:4173/` para probar la versión final de producción.

---

## 3. Servidores Estáticos Alternativos

Dado que Splitly compila a HTML, CSS y JavaScript estático, puedes servir la carpeta raíz o `dist/` con cualquier servidor HTTP:

```bash
# Con Python 3
python -m http.server 8080

# Con Node npx
npx serve .
```

> [!NOTE]
> No abras `index.html` directamente mediante el protocolo `file://`. Los navegadores modernos bloquean los workers de WebAssembly y los módulos ES cuando no se cargan bajo un origen HTTP/HTTPS.
