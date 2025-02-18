import json

# 주어진 데이터
data = [
    {
      "Column_1": "연번",
      "Column_2": "사업명",
      "Column_3": "사업개요",
      "Column_4": "지원내용",
      "Column_5": "지원대상",
      "Column_6": "예산 (억원)",
      "Column_7": "사업 공고일",
      "Column_8": "소관 부처",
      "Column_9": "전담(주관) 기관",
      "Column_10": "비고"
    },
    {
      "Column_1": ":unselected: 사업화 (35건)",
      "Column_3": ""
    },
    {
      "Column_1": "1",
      "Column_2": "• 예비창업 패키지",
      "Column_3": "혁신적인 기술창업 아이디어를 보유한 예비창업자의 성공 창업 및 사업화 지원을 통한 양질의 일자리 창출",
      "Column_4": "1사업화자금 2창업프로그램",
      "Column_5": "예비창업자 (공고일 기준 사업자 (개인, 법인) 등록 및 법인 설립등기를 하 지 않은 자)",
      "Column_6": "490",
      "Column_7": "'25.1월",
      "Column_8": "중소벤처 기업부 (신산업 기술창업과)",
      "Column_9": "창업진흥원 (예비초기팀)",
      "Column_10": ""
    },
    {
      "Column_1": "2",
      "Column_2": "• 초기창업 패키지",
      "Column_3": "유망 초기창업기업(창업 3 년 이내)을 대상으로 사업화 자금, 창업프로그램 등을 제 공하여 기술혁신 및 성장 지원",
      "Column_4": "1 사업화자금 2창업프로그램",
      "Column_5": "업력 3년 이내 초기 창업기업",
      "Column_6": "455",
      "Column_7": "'25.1월",
      "Column_8": "중소벤처 기업부 (신산업 기술창업과)",
      "Column_9": "창업진흥원 (예비초기팀)",
      "Column_10": ""
    },
    {
      "Column_1": "3",
      "Column_2": "• 창업도약 패키지",
      "Column_3": "창업도약기(3~7년) 기업이 사업모델 혁신, 제품.서비스 고도화 등을 통해 데스밸 리를 극복하고 스케일업 할 수 있도록 지원",
      "Column_4": "1사업화 자금 2 창업지원프로그램",
      "Column_5": "3년 초과 7년 이내",
      "Column_6": "593",
      "Column_7": "'25.2~3월",
      "Column_8": "중소벤처 기업부 (신산업 기술창업과)",
      "Column_9": "창업진흥원 (혁신도약팀)",
      "Column_10": ""
    },
    {
      "Column_1": "4",
      "Column_2": "• 초격차 스타 트업 1000+ 프로젝트",
      "Column_3": "시스템반도체, 바이오·헬스 등 10대 신산업 분야의 혁신 기술 및 글로벌 진출 역량을 보유한 유망 창업 기업을 선발하여 사업화 및 스케일업 지원",
      "Column_4": "1 사업화 자금 2특화 프로그램 3연계지원 (기술개발, 정책 지금, 기술보증 등)",
      "Column_5": "신산업 분야 업력 10 년 이내 창업기업",
      "Column_6": "1,310",
      "Column_7": "'25.2월",
      "Column_8": "중소벤처 기업부 (신산업 기술창업과)",
      "Column_9": "창업진흥원 (딥테크육성팀)",
      "Column_10": ""
    },
    {
      "Column_1": "5",
      "Column_2": "• 민관공동 창업자발굴 육성사업",
      "Column_3": "창업기획자, 초기전문VC 등 민간의 선별능력을 활용하여 발굴한 유망 기술창업기업",
      "Column_4": "1시제품 제작 2 해외진출, 마케팅 3 후속사업화 자금",
      "Column_5": "팁스(TIPS) R&D에 선정된 창업기업 중 업력 7년 이내 기업",
      "Column_6": "1,133",
      "Column_7": "'25.3월",
      "Column_8": "중소벤처 기업부 (신산업",
      "Column_9": "창업진흥원 (민관협력팀)",
      "Column_10": ""
    }
]

# 변환된 JSON 데이터를 저장할 리스트
json_result = []

# 데이터 처리
for row in data[1:]:
    json_entry = {
        "chapter_id": 3,
        "chapter_title": "사업별 주요 내용",
        "title": row["Column_2"].strip("•").strip(),
        "content": {
            "사업개요": row["Column_3"],
            "지원내용": [item for item in row["Column_4"].split() if item],
            "지원대상": row["Column_5"],
            "예산(억원)": row["Column_6"],
            "사업공고일": row["Column_7"],
            "소관부처": row["Column_8"],
            "전담(주관)기관": row["Column_9"]
        }
    }
    json_result.append(json_entry)

# 결과 출력
json_output = json.dumps(json_result, ensure_ascii=False, indent=2)
print(json_output)
