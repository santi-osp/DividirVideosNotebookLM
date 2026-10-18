# Contributing to Splitly

Thank you for your interest in contributing to **Splitly**! We welcome community contributions from both English and Spanish speaking developers.

*¡Gracias por tu interés en contribuir a Splitly! Aceptamos contribuciones de desarrolladores que hablen inglés o español.*

---

## 1. Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

---

## 2. Ways to Contribute

- **Reporting Bugs**: Open an issue using the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml).
- **Proposing Features**: Submit ideas via the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.yml).
- **Improving Translations**: Add or refine translations in `src/i18n/locales/en.json` and `src/i18n/locales/es.json`.
- **Code & Performance**: Optimize WebAssembly processing, memory management, accessibility, or UI design.
- **Documentation**: Improve guides in `docs/en/` or `docs/es/`.

---

## 3. Development Workflow

### Prerequisites
- **Node.js**: version `20.x` or later (tested on v24).
- **npm**: version `10.x` or later.
- Modern browser with WebAssembly support (Chrome, Edge, Firefox, Safari).

### Local Setup
```bash
# 1. Clone the repository
git clone https://github.com/santi-osp/DividirVideosNotebookLM.git
cd DividirVideosNotebookLM

# 2. Install reproducible dependencies
npm ci

# 3. Start development server
npm run dev
```

### Running Tests and Linters
Always run the validation suite before submitting a Pull Request:
```bash
# Run unit test suite (Vitest)
npm run test

# Validate i18n translation parity
npm run check:i18n

# Validate documentation parity & asset integrity
npm run check:docs

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

### Capturing Screenshots & Generating Media Fixtures
```bash
# Generate synthetic media fixtures (requires local ffmpeg)
npm run fixtures

# Capture automated authentic UI screenshots & demo GIF/MP4
npm run screenshots
```

---

## 4. Internationalization (i18n) Guidelines

Splitly is 100% bilingual. When introducing a new user-facing string:
1. Add the key and text to `src/i18n/locales/en.json`.
2. Add the corresponding Spanish translation to `src/i18n/locales/es.json`.
3. Ensure parameter tokens (e.g. `{count}`) match exactly in both files.
4. Run `npm run check:i18n` to verify 100% parity.

---

## 5. Pull Request Guidelines

1. **Branch Naming**: Use descriptive prefixes:
   - `feat/feature-name`
   - `fix/bug-description`
   - `docs/guide-name`
   - `refactor/module-cleanup`
2. **Commit Messages**: Follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
3. **Automated Checks**: Ensure `npm run test`, `npm run check:i18n`, and `npm run build` pass without warnings.
4. **Documentation**: Update both English and Spanish documentation if user-visible behavior changes.
5. **No Force Push**: Avoid force pushing to shared review branches.
