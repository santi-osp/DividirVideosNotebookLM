# Third-Party Notices and Open Source Attributions

Splitly incorporates or links to several open source libraries and assets. This document acknowledges the original authors and provides the required licensing notices.

---

## 1. FFmpeg & FFmpeg WebAssembly

### FFmpeg
- **Project**: FFmpeg ([ffmpeg.org](https://ffmpeg.org))
- **License**: GNU Lesser General Public License (LGPL) version 2.1 or later (or GPL version 2 or later depending on build configurations).
- **Notice**: Splitly interacts with FFmpeg compiled to WebAssembly via `@ffmpeg/ffmpeg` and `@ffmpeg/core`. Splitly does not alter FFmpeg source code. The WebAssembly binaries are dynamically loaded from CDN or local origin at runtime. FFmpeg is a trademark of Fabrice Bellard and the FFmpeg development team.
- **Source Code**: Full upstream source code for FFmpeg is available at [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html).

### @ffmpeg/ffmpeg & @ffmpeg/util
- **Project**: ffmpeg.wasm ([github.com/ffmpegwasm/ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm))
- **Author**: Jerome Wu and contributors
- **License**: MIT
- **Notice**:
```text
MIT License

Copyright (c) 2019 Jerome Wu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 2. Web Fonts

### Manrope
- **Authors**: Mikhail Sharanda and contributors
- **License**: SIL Open Font License (OFL) version 1.1
- **Notice**: Reserved Font Name "Manrope".

### DM Sans
- **Authors**: Colophon Foundry, Jonny Pinhorn, Indian Type Foundry
- **License**: SIL Open Font License (OFL) version 1.1
- **Notice**: Reserved Font Name "DM Sans".

---

## 3. Tooling and Development Libraries

### Vite
- **Project**: Vite ([vite.dev](https://vite.dev))
- **Author**: Evan You and Vite contributors
- **License**: MIT

### Vitest
- **Project**: Vitest ([vitest.dev](https://vitest.dev))
- **Author**: Anthony Fu and Vitest contributors
- **License**: MIT

### Playwright
- **Project**: Playwright ([playwright.dev](https://playwright.dev))
- **Author**: Microsoft Corporation
- **License**: Apache License 2.0
