from celery.schedules import crontab
from .celery_app import celery_app
from .cleanup import clean_old_data
from .aggregate import aggregate_person_data

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # 1) 매 정각(매 1시간) cctv_data 집계
    sender.add_periodic_task(
        crontab(minute=0),  # hour='*' => 모든 시간대 0분(정시)
        aggregate_person_task.s(),
        name='aggregate every hour'
    )

    # 2) 매일 새벽 4시 오래된 데이터 삭제
    sender.add_periodic_task(
        crontab(hour=4, minute=0),
        clean_db_data.s(),
        name='cleanup old data daily at 4 AM'
    )

@celery_app.task
def clean_db_data():
    clean_old_data()
    return "old data cleaned"

@celery_app.task
def aggregate_person_task():
    return aggregate_person_data()
