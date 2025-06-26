# OpenFashion

OpenFashion is a full-stack fashion discovery platform consisting of a **FastAPI** backend and a **Next.js** frontend. The backend exposes REST endpoints for features like image analysis and style quizzes, while the frontend provides a responsive interface for exploring fashion inspiration.

## Backend Setup

```bash
pip install -r backend/requirements.txt
```

Set the required environment variables (see [`backend/app/config/settings.py`](backend/app/config/settings.py)) for settings such as `SECRET_KEY`, `MONGO_URI`, `S3_BUCKET_NAME`, `OPENAI_API_KEY` and other API keys.

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
