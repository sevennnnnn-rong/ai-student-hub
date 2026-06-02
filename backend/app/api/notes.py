from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app.schemas.response import success_response

router = APIRouter()


@router.get("/")
def get_notes(task_id: int = None, keyword: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取笔记列表"""
    query = db.query(Note)
    if task_id:
        query = query.filter(Note.task_id == task_id)
    if keyword:
        query = query.filter(Note.title.contains(keyword) | Note.content.contains(keyword))
    notes = query.order_by(Note.created_at.desc()).offset(skip).limit(limit).all()
    return success_response([NoteResponse.model_validate(n).model_dump() for n in notes])


@router.post("/")
def create_note(note: NoteCreate, db: Session = Depends(get_db)):
    """创建笔记"""
    db_note = Note(**note.model_dump())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return success_response(NoteResponse.model_validate(db_note).model_dump(), code=201)


@router.get("/{note_id}")
def get_note(note_id: int, db: Session = Depends(get_db)):
    """获取单个笔记"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")
    return success_response(NoteResponse.model_validate(note).model_dump())


@router.put("/{note_id}")
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
    return success_response(NoteResponse.model_validate(db_note).model_dump())


@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """删除笔记"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")

    db.delete(note)
    db.commit()
    return success_response(None, message="笔记删除成功", code=204)
