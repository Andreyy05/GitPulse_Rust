# ⚡ GitPulse

<div align="center">
  <p><strong>A high-performance, lightweight GitHub streak monitor & commit fuel companion</strong></p>
  <p>Engineered with native system precision using <strong>Tauri v2</strong>, <strong>Rust</strong>, <strong>React 18</strong>, and <strong>Tailwind CSS</strong>.</p>

  <br />

  [![macOS](https://img.shields.io/badge/Platform-macOS-000000?logo=apple&logoColor=white)](https://apple.com/macos)
  [![Windows](https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows&logoColor=white)](https://microsoft.com/windows)
  [![Rust 2021](https://img.shields.io/badge/Rust-2021_Edition-DEA584?logo=rust&logoColor=black)](https://rust-lang.org/)
  [![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-24C8D8?logo=tauri&logoColor=white)](https://v2.tauri.app/)
  [![React 18](https://img.shields.io/badge/React-18-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

  <br /><br />

  <img src="assets/preview.png" alt="GitPulse UI Preview" width="380" style="border-radius: 14px; box-shadow: 0 12px 40px rgba(0,0,0,0.25);" />

  <p><em>Sleek frameless floating widget with native vibrancy, real-time activity status, and 14-day contribution heatmap.</em></p>
</div>

---

##  Overview

**GitPulse** is a minimalist, native desktop companion that tracks your GitHub commit streaks, alerts you before streaks break, and sparks development velocity with integrated commit message authoring. 

Engineered from the ground up to replace heavy Chromium runtimes with a native **Rust core** and isolated system webviews (WebKit on macOS, WebView2 on Windows), GitPulse delivers instant start-up, sub-40MB memory usage, and zero system lag.

---

## ✨ Features

- **Activity & Streak Tracking**: Live tracking of daily commits against midnight local time with dynamic countdown timers.
- **🔥 Consecutive Streaks & Record**: Real-time streak tracking showing active consecutive days and your all-time best streak.
- **14-Day Contribution Heatmap**: Visual contribution density matrix mirroring GitHub's official activity palette.
- **📊 Extended Commit Insights**: Detailed statistics card with 30-day and 90-day volume, daily averages, and peak weekday rhythm breakdown.
- **📌 Repositories & Quicklinks**: Instant access to your recent and active repositories with stars, language tags, and custom pinning.
- **📡 Offline Mode & Local Cache**: Zero downtime with resilient local snapshot caching and seamless auto-reconnect synchronization.
- **Commit Fuel Generator & Editor**: Instant Conventional Commit generation (`feat:`, `fix:`, `docs:`, `hotfix:`, etc.) with in-place editable message drafting and length validation.
- **Segmented View Navigation**: Instant switching between `Pulse`, `Stats`, `Repos`, and `All` views with persistent tab preference.
- **Native System Tray**: Lives in your macOS menu bar / Windows system notification area with instant access to status and actions.
- **Global Accelerator**: Toggle instant window visibility system-wide with `Cmd + Shift + G` (macOS) or `Ctrl + Shift + G` (Windows).
- **PAT Rate-Limit Bypass**: Native HTTP client (`reqwest`) supporting GitHub Personal Access Tokens for private repo tracking and 5,000 req/hr quotas.
- **Adaptive Dark / Light Themes**: Respects macOS and Windows system appearance or manual dark/light toggle.
- **Desktop Alerts & Discord Webhooks**: Scheduled push notifications before midnight deadlines with optional Discord channel dispatch.
- **Native Window Vibrancy**: Translucent, glassmorphic HUD styling with native macOS vibrancy and Windows shadow rendering.

---

## ⚡ Technical Benchmarks

| Metric | Legacy Electron Stack | GitPulse (Tauri v2 + Rust) | Improvement |
| :--- | :--- | :--- | :--- |
| **Engine** | Bundled Chromium + Node.js | Native WebKit / WebView2 + Rust | Zero browser bloat |
| **Idle Memory (RSS)** | ~180 MB – 260 MB | **~30 MB – 45 MB** | **~80% reduction** |
| **Cold Startup** | ~2,500 – 3,500 ms | **< 200 ms** | **12x faster** |
| **Runtime Processes** | 4 – 6 heavy processes | **1 parent + system webview** | Minimal footprint |
| **Binary Size** | ~140 MB | **~12 MB** | **>90% lighter** |

---

## 🛠️ Prerequisites

Before installing or building GitPulse, verify your development environment meets the following requirements:

- **Node.js**: `v18.0.0` or higher
- **Rust & Cargo**: Rust `1.78+` (install via [rustup.rs](https://rustup.rs/))

### macOS Requirements
- Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```

### Windows Requirements
- **Microsoft Visual Studio C++ Build Tools** (selected during `rustup` setup or via Visual Studio Installer).
- **Microsoft Edge WebView2 Runtime** (preinstalled by default on Windows 10 version 1803+ and Windows 11).

---

## 🚀 Setup & Running

Clone the repository and install frontend dependencies:

```bash
git clone https://github.com/Andreyy05/GitPulse_Rust.git
cd GitPulse_Rust
npm install
```

### macOS

#### Run in Development Mode
```bash
npm run dev
# or: npx tauri dev
```

#### Build Release App & DMG Bundle
```bash
npm run build
# or: npx tauri build
```
The compiled macOS `.app` bundle and standalone `.dmg` installer will be generated in:
```
src-tauri/target/release/bundle/dmg/GitPulse_1.0.0_x64.dmg (or aarch64.dmg)
src-tauri/target/release/bundle/macos/GitPulse.app
```

---

### Windows

#### Run in Development Mode
```powershell
npm run dev
# or: npx tauri dev
```

#### Build Release Executable & MSI Bundle
```powershell
npm run build
# or: npx tauri build
```
The compiled standalone `.exe` and `.msi` installers will be located in:
```
src-tauri/target/release/gitpulse.exe
src-tauri/target/release/bundle/msi/GitPulse_1.0.0_x64_en-US.msi
```

---

## ⌨️ Controls & Shortcuts

| Action | macOS | Windows / Linux |
| :--- | :--- | :--- |
| **Toggle Window** | `Cmd + Shift + G` | `Ctrl + Shift + G` |
| **Move Window** | Click & drag header bar | Click & drag header bar |
| **Hide to Tray** | Traffic light Close button (`✕`) | Titlebar Close button (`✕`) |
| **Restore Window** | Click menu bar tray icon | Left-click system tray icon |
| **Force Activity Refresh** | Right-click tray -> *Refresh Activity Now* | Right-click tray -> *Refresh Activity Now* |

---

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph UI ["Presentation Layer (Vite 6 + React 18 + Tailwind CSS)"]
        direction TB
        Header["Header: macOS Traffic Lights & Drag Region"]
        Status["StatusCard: Streak Engine & 14-Day Heatmap"]
        Fuel["CommitFuel: Conventional Commit Generator"]
        Settings["SettingsModal: Token, Interval, Discord Webhooks"]
    end

    subgraph IPC ["Tauri v2 IPC Bridge"]
        Invoke["Type-Safe Command Invocation"]
        Events["Bi-directional Event Bus"]
    end

    subgraph Core ["Native Core (Rust 2021 / Tauri v2)"]
        direction TB
        Tray["System Tray / Menu Bar Service"]
        Shortcuts["Cross-Platform Global Accelerator"]
        SingleInst["Single Instance Mutex Guard"]
        HTTP["Native reqwest Async Scraper"]
        Notif["Native Notification & Discord Dispatcher"]
        AutoStart["LaunchAgent / Registry Autostart"]
    end

    UI <--> IPC <--> Core
```

---

## ⚙️ Configuration

All user preferences are managed directly from the in-app Settings modal and securely saved locally:

* **GitHub Username**: Target GitHub account handle for commit analysis.
* **Personal Access Token (PAT)**: Optional fine-grained or classic token (`read:user`, `repo`) for private repositories and higher API rate limits.
* **Refresh Cadence**: Automated background refresh cycle (15, 30, or 60 minutes).
* **Streak Alert Time**: Daily alert prompt time (default `18:00`) before your streak expires.
* **Discord Webhook**: Forward commit alerts to your personal Discord server.
* **Launch at Startup**: Automatically start GitPulse silently in the tray upon operating system boot.

---

<div align="center">
  Author: <b>Andrej Pavliščak</b> (<a href="https://github.com/Andreyy05">@Andreyy05</a>)
</div>
