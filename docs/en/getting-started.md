# Getting Started with Splitly

Splitly requires no user registration, no API keys, and no database. It runs directly inside modern web browsers supporting WebAssembly.

---

## 1. Web Deployment (Recommended)

You can run Splitly immediately in your browser via GitHub Pages:

👉 **[https://santi-osp.github.io/DividirVideosNotebookLM/](https://santi-osp.github.io/DividirVideosNotebookLM/)**

No software installation or browser extensions are required.

---

## 2. Running Locally from Source

If you want to run Splitly on your own computer or contribute to its development:

### Prerequisites
- [Node.js](https://nodejs.org) (v20 or later)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### Quick Start Commands
```bash
# Clone the repository
git clone https://github.com/santi-osp/DividirVideosNotebookLM.git
cd DividirVideosNotebookLM

# Install dependencies deterministically
npm ci

# Start the Vite development server
npm run dev
```
Open `http://localhost:5173/` in your browser.

### Serving Production Build
```bash
npm run build
npm run preview
```
Open `http://localhost:4173/` to test the production build.

---

## 3. Alternative Local Static Servers

Since Splitly compiles to static HTML, CSS, and JS, you can also serve the root or `dist/` directory with any static HTTP server:

```bash
# Using Python 3
python -m http.server 8080

# Using Node npx
npx serve .
```

> [!NOTE]
> Do not open `index.html` directly using the `file://` protocol. Modern browsers restrict WebAssembly workers and ES Modules when loaded without an HTTP/HTTPS origin.
