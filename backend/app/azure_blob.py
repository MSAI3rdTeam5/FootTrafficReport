from azure.storage.blob import BlobServiceClient
import os
import uuid

AZURE_CONNECTION_STRING = os.environ.get("AZURE_CONNECTION_STRING", "")
CONTAINER_NAME = "foottraffic-images"
AZURE_SAS_TOKEN=os.environ.get("AZURE_SAS_TOKEN", "")
blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
container_client = blob_service_client.get_container_client(CONTAINER_NAME)


def upload_image_to_azure(file_bytes: bytes, cctv_id: int) -> str:
    blob_name = f"cctv-{cctv_id}-{uuid.uuid4()}.jpg"
    blob_client = container_client.get_blob_client(blob_name)

    blob_client.upload_blob(file_bytes, overwrite=True)

    # public container라면 blob_client.url 로 접근 가능
    # private라면 SAS Token 필요
    return f"{blob_client.url}?{AZURE_SAS_TOKEN}"


def upload_video_to_azure(file_bytes: bytes, cctv_id: int) -> str:
    """
    cctv_id: DB내 고유 식별자
    file_bytes: 업로드된 동영상 파일 (예: .mp4, .webm)
    returns: blob URL + SAS
    """
    # 확장자는 실제 프론트에서 받은 파일명 or .mp4, .webm 등으로 지정
    blob_name = f"video-{cctv_id}-{uuid.uuid4()}.mp4"
    
    blob_client = container_client.get_blob_client(blob_name)
    blob_client.upload_blob(file_bytes, overwrite=True)

    # SAS가 필요한 경우
    return f"{blob_client.url}?{AZURE_SAS_TOKEN}"