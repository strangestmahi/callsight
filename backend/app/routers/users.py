from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User
from ..schemas.schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/search", response_model=List[UserResponse])
def search_users(q: str = "", db: Session = Depends(get_db)):
    if not q:
        users = db.query(User).limit(20).all()
    else:
        pattern = f"%{q}%"
        users = db.query(User).filter(
            (User.name.ilike(pattern)) | (User.email.ilike(pattern))
        ).limit(20).all()
    return [UserResponse.from_orm(u) for u in users]
