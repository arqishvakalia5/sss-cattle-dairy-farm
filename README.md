# SSS Cattle & Dairy Farm

A reconstructed deployment-ready version of the farm dashboard from the code supplied from Emergent.

## Stack
- React
- FastAPI
- MongoDB
- OpenPyXL

## Important
The Emergent-specific Google OAuth flow was intentionally removed from this reconstruction. The app is suitable for a public demo, but the write endpoints are not authenticated yet. Before using it for real farm records, add authentication/authorization.

## Backend
```bash
cd backend
python -m venv .venv
# activate the environment
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

Set MONGO_URL, DB_NAME and CORS_ORIGINS in the environment.

## Frontend
Create the frontend with the normal React tooling and copy the supplied App.js/App.css/index.css into src/. Set:
REACT_APP_BACKEND_URL=http://localhost:8000

## Deployment
Deploy the backend to a service that supports FastAPI and the frontend to a static React host. Use MongoDB Atlas for the database. Update CORS_ORIGINS to the deployed frontend URL.
