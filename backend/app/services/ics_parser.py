"""ICS 文件解析器"""
import re
from datetime import datetime, timedelta
from typing import List, Dict
from icalendar import Calendar


def parse_ics_file(file_content: str) -> List[Dict]:
    """
    解析 ICS 文件内容，返回课程列表

    Args:
        file_content: ICS 文件内容

    Returns:
        课程列表，每个课程包含 name, teacher, location, day_of_week, start_time, end_time
    """
    courses = []

    try:
        cal = Calendar.from_ical(file_content)

        for component in cal.walk():
            if component.name == "VEVENT":
                summary = str(component.get('SUMMARY', ''))
                location = str(component.get('LOCATION', ''))
                description = str(component.get('DESCRIPTION', ''))

                # 解析时间
                dtstart = component.get('DTSTART')
                dtend = component.get('DTEND')

                if not dtstart or not dtend:
                    continue

                # 转换为 datetime 对象
                if hasattr(dtstart, 'dt'):
                    start_dt = dtstart.dt
                    end_dt = dtend.dt
                else:
                    continue

                # 如果是 date 对象，跳过（全天事件）
                if not isinstance(start_dt, datetime):
                    continue

                # 获取星期几（1-7，1=周一）
                day_of_week = start_dt.isoweekday()

                # 格式化时间
                start_time = start_dt.strftime('%H:%M')
                end_time = end_dt.strftime('%H:%M')

                # 尝试从 summary 中提取教师和课程名
                teacher = ''
                course_name = summary

                # 常见格式：课程名@教师名 或 课程名-教师名
                if '@' in summary:
                    parts = summary.split('@')
                    course_name = parts[0].strip()
                    teacher = parts[1].strip()
                elif '-' in summary and len(summary.split('-')) == 2:
                    parts = summary.split('-')
                    course_name = parts[0].strip()
                    teacher = parts[1].strip()

                # 从 location 提取教室
                classroom = location

                course = {
                    'name': course_name,
                    'teacher': teacher,
                    'location': classroom,
                    'day_of_week': day_of_week,
                    'start_time': start_time,
                    'end_time': end_time,
                    'color': generate_color(course_name),
                    'semester': None
                }

                courses.append(course)

    except Exception as e:
        raise ValueError(f"解析 ICS 文件失败: {str(e)}")

    return courses


def generate_color(name: str) -> str:
    """根据课程名生成固定颜色"""
    colors = [
        '#3b82f6',  # blue
        '#10b981',  # emerald
        '#f59e0b',  # amber
        '#ef4444',  # red
        '#8b5cf6',  # violet
        '#06b6d4',  # cyan
        '#f97316',  # orange
        '#84cc16',  # lime
    ]

    # 使用课程名的哈希值选择颜色
    hash_value = sum(ord(c) for c in name)
    return colors[hash_value % len(colors)]


def parse_time_range(time_str: str) -> tuple[str, str]:
    """
    解析时间范围字符串，如 "8:00-9:30" 或 "08:00-09:30"

    Returns:
        (start_time, end_time) 元组
    """
    match = re.match(r'(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})', time_str)
    if not match:
        raise ValueError(f"无效的时间格式: {time_str}")

    start_h, start_m, end_h, end_m = map(int, match.groups())

    start_time = f"{start_h:02d}:{start_m:02d}"
    end_time = f"{end_h:02d}:{end_m:02d}"

    return start_time, end_time


def parse_week_range(week_str: str) -> List[int]:
    """
    解析周次范围字符串，如 "1-16周" 或 "1,3,5-8周"

    Returns:
        周次列表
    """
    weeks = []

    # 移除 "周" 字
    week_str = week_str.replace('周', '').replace('周次', '')

    # 按逗号分割
    parts = week_str.split(',')

    for part in parts:
        part = part.strip()

        if '-' in part:
            # 范围，如 "5-8"
            start, end = part.split('-')
            weeks.extend(range(int(start), int(end) + 1))
        elif part.isdigit():
            weeks.append(int(part))

    return weeks
