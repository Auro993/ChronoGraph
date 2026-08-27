from fastapi import APIRouter, HTTPException
from backend.services.mysql_service import MySQLService

router = APIRouter()

@router.get("/")
async def search_entities(q: str, limit: int = 10):
    """Search for entities by name or type"""
    try:
        mysql = MySQLService()
        if not mysql.connection:
            return {"status": "error", "message": "MySQL not connected"}
        
        cursor = mysql.connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, type, source, source_id
            FROM entities
            WHERE name LIKE %s OR type LIKE %s
            LIMIT %s
        """, (f"%{q}%", f"%{q}%", limit))
        
        results = cursor.fetchall()
        cursor.close()
        mysql.close()
        
        return {"status": "success", "results": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/suggest")
async def get_suggestions(q: str):
    """Get autocomplete suggestions for entity names"""
    try:
        mysql = MySQLService()
        if not mysql.connection:
            return {"status": "error", "message": "MySQL not connected"}
        
        cursor = mysql.connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT DISTINCT name
            FROM entities
            WHERE name LIKE %s
            LIMIT 10
        """, (f"%{q}%",))
        
        suggestions = [row['name'] for row in cursor.fetchall()]
        cursor.close()
        mysql.close()
        
        return {"status": "success", "suggestions": suggestions}
    except Exception as e:
        return {"status": "error", "message": str(e)}