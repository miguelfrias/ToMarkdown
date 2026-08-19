# ToMarkdown — Build & Development Guide

This guide details the prerequisites, development workflow, and standalone build procedures for **ToMarkdown** on macOS.

---

## 1. Prerequisites

Ensure the following tools are installed on your host system:

* **Node.js:** v18+ (`node -v` & `npm -v`)
* **Rust:** Rust 1.77+ with Cargo (`rustc --version` & `cargo --version`)
* **Conversion Engine:** Microsoft MarkItDown CLI (`pip install markitdown` or `pipx install markitdown`)
* **Xcode Command Line Tools:** `xcode-select --install` (required on macOS for native compilation)

---

## 2. Running in Development Mode

Development mode starts the Vite React frontend with Hot Module Replacement (HMR) and compiles the Rust backend with live reload.

### Full Desktop App (Frontend + Rust Backend)

```bash
npm run tauri:dev
```
*or directly with the Tauri CLI:*
```bash
npx tauri dev
```

* **What happens:** 
  - Vite launches the local dev server on `http://localhost:1420`.
  - Tauri compiles the debug Rust binary and opens the native macOS window.
  - Changes to React components or CSS update instantly via HMR.
  - Changes to Rust files in `src-tauri/` automatically trigger incremental backend recompilation and window reload.

### Frontend-Only Browser Preview

To test UI components and layout styling in a standard web browser without launching the Tauri desktop shell:

```bash
npm run dev
```
Open `http://localhost:1420` in Chrome/Safari. A built-in mock mode simulates file conversions in the browser.

---

## 3. Building Standalone macOS App (`.app` & `.dmg`)

To produce a production-ready, standalone macOS application bundle:

### Default Production Build (Current Machine Architecture)

```bash
npm run tauri:build
```

* **Output Artifacts:**
  - **Standalone Application:** `src-tauri/target/release/bundle/macos/ToMarkdown.app`
  - **Disk Image Installer:** `src-tauri/target/release/bundle/dmg/ToMarkdown_0.1.0_*.dmg`

---

### Architecture-Specific Builds

| Command | Target Architecture | Description |
| :--- | :--- | :--- |
| `npm run tauri:build` | Host Architecture | Builds for the current machine (Apple Silicon or Intel) |
| `npm run tauri:build:universal` | Universal (`universal-apple-darwin`) | Single fat binary supporting both Apple Silicon (M1/M2/M3/M4) & Intel Macs |
| `npm run tauri:build:arm64` | Apple Silicon (`aarch64-apple-darwin`) | Optimized for Apple Silicon Macs |
| `npm run tauri:build:x64` | Intel (`x86_64-apple-darwin`) | Optimized for Intel-based Macs |
| `npm run tauri:build:debug` | Host (Debug) | Builds standalone `.app` with debug symbols (unminified) |

> **Note on Universal Builds:** Before running `npm run tauri:build:universal`, ensure both Rust targets are installed:
> ```bash
> rustup target add aarch64-apple-darwin x86_64-apple-darwin
> ```

---

## 4. Testing & Verification Commands

### Run Rust Unit Tests (Collision Resolution & Paths)

```bash
npm run test:rust
```
*or inside the `src-tauri` directory:*
```bash
cargo test
```

### TypeScript Type-Check & Frontend Bundle Build

```bash
npm run build
```

---

## 5. Summary of `package.json` Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Start frontend Vite development server |
| `npm run build` | `tsc && vite build` | Type-check and compile frontend bundle to `dist/` |
| `npm run tauri:dev` | `tauri dev` | Launch desktop app in development mode with HMR |
| `npm run tauri:build` | `tauri build` | Build standalone `.app` and `.dmg` for current architecture |
| `npm run tauri:build:universal` | `tauri build --target universal-apple-darwin` | Build universal macOS binary (ARM64 + x86_64) |
| `npm run tauri:build:arm64` | `tauri build --target aarch64-apple-darwin` | Build for Apple Silicon |
| `npm run tauri:build:x64` | `tauri build --target x86_64-apple-darwin` | Build for Intel Macs |
| `npm run tauri:build:debug` | `tauri build --debug` | Build standalone binary with debug symbols |
| `npm run test:rust` | `cargo test --manifest-path src-tauri/Cargo.toml` | Run Rust backend unit tests |
