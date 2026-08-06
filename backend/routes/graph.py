from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_graph():
    return {"nodes": [], "edges": [], "message": "Graph endpoint - Coming soon!"}
