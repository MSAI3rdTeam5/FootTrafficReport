from celery import Celery
import os


BROKER_URL = os.environ.get("BROKER_URL")
RESULT_BACKEND = None

celery_app = Celery("foot_traffic", broker=BROKER_URL, backend=RESULT_BACKEND)

celery_app.conf.update(
    timezone="Asia/Seoul",
    enable_utc=False,
    broker_connection_retry_on_startup=True
)

from . import tasks
