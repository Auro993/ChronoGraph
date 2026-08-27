from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import chat
from backend.routes import search

app = FastAPI(title="ChronoGraph API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])

@app.get("/")
async def root():
    return {"message": "ChronoGraph API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
