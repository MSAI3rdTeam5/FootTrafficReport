from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv
import os

# .env 파일 로드
load_dotenv()

# Azure Cognitive Search 설정
SEARCH_SERVICE_NAME = os.getenv("SEARCH_SERVICE_NAME")
SEARCH_INDEX_NAME = os.getenv("SEARCH_INDEX_NAME")
SEARCH_API_KEY = os.getenv("SEARCH_API_KEY")

def get_monthly_sales(region, industry):
    # Search 클라이언트 생성
    endpoint = f"https://{SEARCH_SERVICE_NAME}.search.windows.net"
    client = SearchClient(endpoint=endpoint, index_name=SEARCH_INDEX_NAME, credential=AzureKeyCredential(SEARCH_API_KEY))

    # 쿼리 생성
    filter_query = f"region eq '{region}' and industry eq '{industry}'"

    # 검색 실행
    results = client.search(search_text="*", filter=filter_query)

    # 결과에서 monthly_sales 추출
    for result in results:
        return result["monthly_sales"]  # 첫 번째 결과의 monthly_sales 반환

    # 결과가 없는 경우
    return None

# 사용 예시
region = "이북5도청사"
industry = "한식음식점"
monthly_sales = get_monthly_sales(region, industry)

if monthly_sales:
    print(f"Region: {region}, Industry: {industry}, Monthly Sales: {monthly_sales}")
else:
    print(f"No sales data found for Region: {region}, Industry: {industry}")
