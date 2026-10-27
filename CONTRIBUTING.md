# Contributing to Seevia

Thank you for your interest in contributing to Seevia. This is a 100% local, privacy-first vision accessibility project.

## Guiding Principles

1. **Zero Cloud Dependencies:** All inference must remain strictly on-device (via LM Studio or local OpenAI-compatible endpoints). Never introduce external analytics, tracking pixels, or remote AI APIs.
2. **Accessibility First:** Every UI element must support keyboard navigation, ARIA live regions, visible focus rings, and high-contrast color ratios (WCAG 2.2 AAA standard).
3. **Non-destructive Alt Text:** Do not overwrite author alt text with synthetic AI predictions. Always isolate generated descriptions into accessible announcements or dedicated visual cards.

---

## Repository Structure

```text
├── backend/      # FastAPI server bridging LM Studio with web clients
└── frontend/     # React 19 + Vite web studio (drag-and-drop, speech, chat)
```

*(Note: Browser extensions are hosted in their own dedicated repositories: [Seevia Safari](https://github.com/5UM-4N/seevia-safari) and [Seevia Chrome](https://github.com/5UM-4N/seevia-chromium)).*

---

## Local Development Setup

### 1. Prerequisites
- macOS (Apple Silicon recommended for local VLMs) or Linux/Windows with a local LLM runner.
- [LM Studio](https://lmstudio.ai) with `qwen/qwen3-vl-4b` loaded and running on `http://127.0.0.1:1234`.
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
# Set up virtual environment
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt

# Run backend tests
PYTHONPATH=backend pytest -v backend/tests/

# Start development server
PYTHONPATH=backend uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend Web App Setup
```bash
cd frontend
npm install
npm run test
npm run dev
```

---

## Pull Request Checklist

Before submitting a PR:
- [ ] Automated tests pass across modified packages (`pytest` for backend, `npm run test` for frontend).
- [ ] TypeScript type checks pass with zero errors (`tsc --noEmit`).
- [ ] No hardcoded absolute system paths or personal credentials.
- [ ] No external network calls added to the extension content scripts or service workers.
- [ ] Documentation updated to reflect any behavioral or configuration changes.
