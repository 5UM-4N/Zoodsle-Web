# ZoodSle Web Edition 👁️🔊

> **The Web, Understood Aloud.**  
> *100% on-device visual accessibility assistant for blind and visually impaired users. Zero cloud tracking, zero latency, complete photo privacy.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![WCAG 2.2 AAA](https://img.shields.io/badge/WCAG%202.2-AAA%20Compliant-success.svg)](https://www.w3.org/WAI/WCAG22/quickref/)
[![Local AI](https://img.shields.io/badge/Local%20AI-LM%20Studio%20%7C%20Qwen3--VL--4B-purple.svg)](https://lmstudio.ai)

---

## 🌟 Overview

**ZoodSle Web Edition** is a privacy-first web application designed to help blind, low-vision, and accessibility-conscious users understand personal photos shared by friends and family. 

Instead of routing sensitive personal photos to third-party cloud vision APIs, ZoodSle performs **100% of its visual reasoning locally on your own computer** using the 4-billion parameter multimodal model `qwen/qwen3-vl-4b` running in [LM Studio](https://lmstudio.ai).

### Key Features
* 🎙️ **Rich Audio Narration:** Built-in speech synthesis with configurable speech rate, pitch, and voice selection.
* 📝 **Dual Narration Modes:**
  * **Concise:** 2 to 4 natural sentences focusing on subjects, layout, colors, and legible text.
  * **Detailed:** Structured breakdown across Overview, People & Subjects, Spatial Layout, Colors & Lighting, Legible Text, and Visual Uncertainties.
* 💬 **Conversational Follow-Up Q&A:** Ask questions about the photo (*"What color is the shirt on the person on the left?"*, *"What does the sign in the background say?"*).
* ♿ **Accessibility First (WCAG 2.2 AAA):**
  * Full keyboard navigation and hotkeys (`Space`/`K` to play/pause, `U` to upload, `/` to chat, `H` for high-contrast, `T` for font size).
  * High-contrast OLED dark theme with prominent 3:1 focus indicators.
  * Live ARIA regions for screen readers (NVDA, JAWS, VoiceOver).
* 🔒 **Absolute Privacy Guarantee:** No photos ever touch the internet. Works completely offline.

---

## 🚀 Step-by-Step Setup Guide (Day 1 Launch)

### Prerequisites

1. **Install LM Studio:** Download and install [LM Studio](https://lmstudio.ai) (Free for macOS, Windows, Linux).
2. **Download the Vision Model:** In LM Studio, search for and download:
   * **`qwen/qwen3-vl-4b`** (recommended 4-bit MLX or GGUF, ~3.1 GB).
3. **Start the Local Model Server:**
   * Go to the **Developer / Local Server** tab in LM Studio.
   * Select `qwen/qwen3-vl-4b` and click **Start Server** on port `1234` (`http://127.0.0.1:1234`).

---

### Running ZoodSle Web

#### Step 1: Start the Local Backend
Open your terminal and run:
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the local FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*The backend will be live at `http://127.0.0.1:8000`.*

#### Step 2: Start the Web App
In a second terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
```

#### Step 3: Open in Browser
Visit **`http://localhost:5173`** in your browser. 
Drop any photo in or press `U` to select an image, and listen to ZoodSle describe it aloud!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Space</kbd> or <kbd>K</kbd> | Toggle Play / Pause speech |
| <kbd>Esc</kbd> | Stop narration immediately |
| <kbd>U</kbd> | Jump to photo upload button |
| <kbd>/</kbd> | Jump to follow-up chat input |
| <kbd>H</kbd> | Toggle High Contrast Mode |
| <kbd>T</kbd> | Cycle typography font scale (100% / 125% / 150%) |
| <kbd>?</kbd> | Open Keyboard Shortcuts modal |

---

## 🛠️ Architecture

* **Frontend:** React 19, TypeScript, Vite, Lucide Icons, Web Speech API (`SpeechSynthesis`).
* **Backend:** FastAPI, Python 3.10+, Pillow, HTTPX, Pydantic v2.
* **Local AI:** OpenAI-compatible vision completion via LM Studio (`qwen/qwen3-vl-4b`).
* **Security:** Loopback IP binding (`127.0.0.1`, `::1`), zero telemetry, DoS concurrency semaphore.

---

## 👨‍💻 Creator & Contact

Created with ❤️ by **Suman Luitel** to make visual media accessible to everyone.

* **GitHub:** [@5UM-4N](https://github.com/5UM-4N)
* **X (Twitter):** [@auba9201](https://x.com/auba9201)
* **Project Discussions:** [GitHub Issues & Discussions](https://github.com/5UM-4N/AI_EYE/issues)

If you have feedback, ideas, or accessibility feature requests, feel free to open an issue or connect on social media!

---

## 📄 License

This project is open-source under the **[MIT License](LICENSE)**.
