from azure.storage.blob import BlobServiceClient
import os
import uuid

AZURE_CONNECTION_STRING = os.environ.get("AZURE_CONNECTION_STRING", "")
CONTAINER_NAME = "foottraffic-images"

blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
container_client = blob_service_client.get_container_client(CONTAINER_NAME)


def upload_image_to_azure(file_bytes: bytes, cctv_id: int) -> str:
    blob_name = f"cctv-{cctv_id}-{uuid.uuid4()}.jpg"
    blob_client = container_client.get_blob_client(blob_name)

    blob_client.upload_blob(file_bytes, overwrite=True)

    # public container라면 blob_client.url 로 접근 가능
    # private라면 SAS Token 필요
    return blob_client.url