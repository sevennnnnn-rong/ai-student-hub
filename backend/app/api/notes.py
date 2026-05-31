from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter()


@router.get("/", response_model=List[NoteResponse])
def get_notes(task_id: int = None, keyword: str = None, db: Session = Depends(get_db)):
    """获取笔记列表"""
    query = db.query(Note)
    if task_id:
        query = query.filter(Note.task_id == task_id)
    if keyword:
        query = query.filter(Note.title.contains(keyword) | Note.content.contains(keyword))
    return query.order_by(Note.created_at.desc()).all()


@router.post("/", response_model=NoteResponse)
def create_note(note: NoteCreate, db: Session = Depends(get_db)):
    """创建笔记"""
    db_note = Note(**note.model_dump())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    """获取单个笔记"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")
    return note


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note: NoteUpdate, db: Session = Depends(get_db)):
    """更新笔记"""
    db_note = db.query(Note).filter(Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="笔记不存在")

    update_data = note.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_note, key, value)

    db.commit()
    db.refresh(db_note)
    return db_note


@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """删除笔记"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")

    db.delete(note)
    db.commit()
    return {"code": 200, "message": "笔记删除成功", "data": None}
