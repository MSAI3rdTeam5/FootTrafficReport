from fastapi import FastAPI
from .routes import router

app = FastAPI(debug=True)

# 라우터 등록 => 이거 다른 사람들 파일에 넣어야함함
app.include_router(router, prefix="/api")

# 단순 헬스체크 엔드포인트
@app.get("/health")
def health_check():
    return {"status": "ok"}

# uvicorn 직접 실행 시 (로컬 개발 용도)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
