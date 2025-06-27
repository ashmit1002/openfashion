# OpenFashion

OpenFashion is a full-stack fashion discovery platform consisting of a **FastAPI** backend and a **Next.js** frontend. The backend exposes REST endpoints for features like image analysis and style quizzes, while the frontend provides a responsive interface for exploring fashion inspiration.

## Backend Setup

```bash
pip install -r backend/requirements.txt
```

Copy `.env.example` in both the `backend` and `frontend` folders and fill in your API keys.
These correspond to the variables defined in [`backend/app/config/settings.py`](backend/app/config/settings.py) and the Next.js app.

Start the API server:

```bash
uvicorn app.main:app --reload --app-dir backend/app
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Navigate to <http://localhost:3000> to view the app.

## Features

- **Image analysis** - analyze clothing images to generate search queries for similar items.
- **Style quiz** - interactive quiz that builds a style profile and personalizes recommendations.
- **Explore page** - browse recommended looks and save favorites.

## Running Tests

Install test dependencies and run `pytest`:

```bash
pip install mongomock pytest
pytest
```
