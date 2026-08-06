from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_timeline():
    return {"events": [], "message": "Timeline endpoint - Coming soon!"}
