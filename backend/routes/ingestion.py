from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def ingest_data():
    return {"status": "success", "message": "Ingestion endpoint - Coming soon!"}
