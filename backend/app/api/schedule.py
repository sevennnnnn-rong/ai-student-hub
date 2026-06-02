from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.database import get_db
from app.models.schedule import Course
from app.schemas.schedule import CourseCreate, CourseUpdate, CourseResponse
from app.schemas.response import success_response
from app.services.ics_parser import parse_ics_file

router = APIRouter()


class ImportPreviewRequest(BaseModel):
    """导入预览请求"""
    content: str  # ICS 文件内容


@router.get("/")
def get_courses(semester: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取课程列表"""
    query = db.query(Course)
    if semester:
        query = query.filter(Course.semester == semester)
    courses = query.order_by(Course.day_of_week, Course.start_time).offset(skip).limit(limit).all()
    return success_response([CourseResponse.model_validate(c).model_dump() for c in courses])


@router.post("/")
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    """创建课程"""
    db_course = Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return success_response(CourseResponse.model_validate(db_course).model_dump(), code=201)


@router.put("/{course_id}")
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
    return success_response(CourseResponse.model_validate(db_course).model_dump())


@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """删除课程"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    db.delete(course)
    db.commit()
    return success_response(None, message="课程删除成功", code=204)


@router.post("/import/preview")
def preview_import(request: ImportPreviewRequest):
    """预览 ICS 文件导入"""
    try:
        courses = parse_ics_file(request.content)
        return success_response({
            "courses": courses,
            "count": len(courses)
        })
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/import/confirm")
def confirm_import(courses: List[CourseCreate], semester: str = None, db: Session = Depends(get_db)):
    """确认导入课程"""
    imported = []
    for course_data in courses:
        db_course = Course(**course_data.model_dump(), semester=semester)
        db.add(db_course)
        imported.append(db_course)

    db.commit()

    # 刷新所有记录
    for course in imported:
        db.refresh(course)

    return success_response({
        "imported": [CourseResponse.model_validate(c).model_dump() for c in imported],
        "count": len(imported)
    }, code=201)
