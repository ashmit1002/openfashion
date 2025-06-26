# OpenFashion

## Development Setup

### Backend
1. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Install the required dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
   This installs packages such as `openai`, `python-jose` and `passlib[bcrypt]` used by the API.
3. Start the API server:
   ```bash
   uvicorn app.main:app --reload --app-dir backend/app
   ```

### Frontend
See [`frontend/README.md`](frontend/README.md) for instructions on running the Next.js frontend.
