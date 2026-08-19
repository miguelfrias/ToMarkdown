# ToMarkdown Desktop

<div align="center">

**A lightweight, local-first macOS desktop application to convert heterogeneous documents into clean Markdown (`.md`) files via drag-and-drop.**

[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Rust](https://img.shields.io/badge/Rust-1.77+-orange?logo=rust)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Features

* **Local-First & Private:** 100% local processing. Zero data or documents ever leave your machine.
* **In-Place File Conversion:** Converted `.md` files are placed in the exact same directory alongside their source files (e.g. `/path/to/report.pdf` $\rightarrow$ `/path/to/report.md`).
* **Drag-and-Drop Ingestion:** The entire window acts as an active drop zone receiving native macOS filesystem paths directly from the OS.
* **Batch Processing & Concurrency Pool:** Multi-file drops are queued and processed concurrently with a configurable Tokio worker pool (default: 4 concurrent jobs) to prevent CPU spikes.
* **Collision Resolution Policies:** Choose between **Overwriting** existing `.md` files or automatically generating **Numbered Variants** (e.g. `report (1).md`).
* **One-Click Actions:** Open the converted Markdown file or reveal its location directly in macOS Finder.
* **Missing Dependency Detection:** Built-in health check verifies the conversion engine status and provides one-click instructions if setup is required.

---

## 📄 Supported Document Formats

Powered by Microsoft's `markitdown` conversion engine:

| Category | Supported Extensions | Output Format |
| :--- | :--- | :--- |
| **Documents** | `.pdf`, `.docx`, `.doc` | Clean GitHub Flavored Markdown |
| **Presentations** | `.pptx`, `.ppt` | Slides structured with headers & bullets |
| **Spreadsheets** | `.xlsx`, `.xls`, `.csv`, `.tsv` | Formatted Markdown tables |
| **Web & Structured** | `.html`, `.htm`, `.json`, `.xml` | Extracted text & semantic hierarchy |
| **Archives** | `.zip` | Recursive file extraction & conversion |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (UI Layer)                      │
│             TypeScript + React 19 + Tailwind CSS            │
│            (@tauri-apps/api, Lucide React Icons)            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Tauri IPC (Commands / Event Streaming)
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend Core (Rust)                      │
│        tauri (v2), tokio (semaphore pool), std::process     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Secure Process Spawn / CLI I/O
┌──────────────────────────────▼──────────────────────────────┐
│                   CLI / Conversion Engine                   │
│           Microsoft markitdown CLI (or Bundled Sidecar)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Prerequisites

* **Node.js:** v18+ (`node -v`)
* **Rust:** Rust 1.77+ with Cargo (`rustc --version`)
* **Conversion Engine:** Microsoft MarkItDown CLI
  ```bash
  pip install markitdown
  # or with pipx:
  pipx install markitdown
  ```

### 2. Installation & Development

```bash
# Clone the repository
git clone https://github.com/your-username/ToMarkdown.git
cd ToMarkdown

# Install frontend dependencies
npm install

# Run the app in development mode (with Vite HMR + Rust live reload)
npm run tauri:dev
```

---

## 📦 Building Standalone macOS App (`.app` & `.dmg`)

To build a standalone macOS application bundle:

```bash
# Build for host machine architecture
npm run tauri:build

# Build universal binary (Apple Silicon M1/M2/M3/M4 + Intel)
npm run tauri:build:universal

# Build for Apple Silicon only
npm run tauri:build:arm64

# Build for Intel Macs only
npm run tauri:build:x64
```

### Build Artifact Locations
* **macOS Application:** `src-tauri/target/release/bundle/macos/ToMarkdown.app`
* **Installer Disk Image:** `src-tauri/target/release/bundle/dmg/ToMarkdown_0.1.0_*.dmg`

For detailed build targets and toolchain configuration, see [**`BUILD.md`**](file:///Users/miguelfrias/projects/ToMarkdown/BUILD.md).

---

## 🧪 Testing

```bash
# Run Rust backend unit tests (path resolution & collision variants)
npm run test:rust

# Run TypeScript typecheck & bundle verification
npm run build
```

---

## ⚙️ Configuration & Settings

Click the **⚙ Settings** button in the app header to configure:
1. **Collision Policy:** Toggle between *Overwrite existing .md* and *Generate numbered variants*.
2. **Concurrent Workers:** Adjust worker pool limit between 1 (low memory) and 8 (high throughput).
3. **Engine Path:** Specify a custom binary path to `markitdown` or auto-detect from `$PATH` / bundled sidecars.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
