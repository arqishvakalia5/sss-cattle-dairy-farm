# Free deployment plan

1. Create a MongoDB Atlas free database and obtain its connection string.
2. Put that string into backend environment variable MONGO_URL.
3. Deploy backend/server.py with:
   `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Deploy frontend as a React static site with:
   `npm install && npm run build`
5. Set REACT_APP_BACKEND_URL to the deployed backend URL.
6. Set backend CORS_ORIGINS to the deployed frontend URL.

Do not publish MongoDB credentials in GitHub.
