from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.schedule import Course
from app.schemas.schedule import CourseCreate, CourseUpdate, CourseResponse

router = APIRouter()


@router.get("/", response_model=List[CourseResponse])
def get_courses(semester: str = None, db: Session = Depends(get_db)):
    """获取课程列表"""
    query = db.query(Course)
    if semester:
        query = query.filter(Course.semester == semester)
    return query.order_by(Course.day_of_week, Course.start_time).all()


@router.post("/", response_model=CourseResponse)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    """创建课程"""
    db_course = Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, course: CourseUpdate, db: Session = Depends(get_db)):
    """更新课程"""
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="课程不存在")

    update_data = course.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_course, key, value)

    db.commit()
    db.refresh(db_course)
    return db_course


@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """删除课程"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    db.delete(course)
    db.commit()
    return {"code": 200, "message": "课程删除成功", "data": None}
