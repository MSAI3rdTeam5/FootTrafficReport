from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from .database import SessionLocal
from .models import CctvData, PersonCount

def aggregate_person_data():
    db: Session = SessionLocal()
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)

    try:
        results = (
            db.query(
                CctvData.cctv_id,
                CctvData.gender,
                CctvData.age,
                func.count(CctvData.id).label("cnt")
            )
            .filter(CctvData.detected_time >= one_hour_ago, CctvData.detected_time < now)
            .group_by(CctvData.cctv_id, CctvData.gender, CctvData.age)
            .all()
        )

        data_map = {}
        for row in results:
            c_id, gender, age, cnt = row
            if c_id not in data_map:
                data_map[c_id] = {
                    "male_young_adult": 0,
                    "female_young_adult": 0,
                    "male_middle_aged": 0,
                    "female_middle_aged": 0,
                    "male_minor": 0,
                    "female_minor": 0
                }
            # 여기서 gender+age -> 특정 컬럼 매핑
            # (간단 예, 실환경 맞게 조정)
            if gender == "male":
                if age =="adult":
                    data_map[c_id]["male_young_adult"] += cnt
                elif age == "old":
                    data_map[c_id]["male_middle_aged"] += cnt
                elif age == "young":
                    data_map[c_id]["male_minor"] += cnt
                else:
                    pass
            else:
                if age =="adult":
                    data_map[c_id]["female_young_adult"] += cnt
                elif age == "old":
                    data_map[c_id]["female_middle_aged"] += cnt
                elif age == "young":
                    data_map[c_id]["female_minor"] += cnt
                else:
                    pass

        for cctv_id, agg in data_map.items():
            pc = PersonCount(
                cctv_id=cctv_id,
                timestamp=now,
                male_young_adult=agg["male_young_adult"],
                female_young_adult=agg["female_young_adult"],
                male_middle_aged=agg["male_middle_aged"],
                female_middle_aged=agg["female_middle_aged"],
                male_minor=agg["male_minor"],
                female_minor=agg["female_minor"]
            )
            db.add(pc)

        db.commit()
        return f"Aggregated {len(data_map)} cctv(s) at {now}"

    finally:
        db.close()
