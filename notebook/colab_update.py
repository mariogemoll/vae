import os
import sys

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload


def run():
    if len(sys.argv) != 3:
        print("Usage: python colab_update.py <file_id> <file_path>")
        sys.exit(1)

    file_id = sys.argv[1]
    source_path = sys.argv[2]

    credentials = service_account.Credentials.from_service_account_file(
        os.environ["SERVICE_ACCOUNT_FILE"], scopes=["https://www.googleapis.com/auth/drive"]
    )

    drive_service = build("drive", "v3", credentials=credentials)

    media = MediaFileUpload(source_path, mimetype="application/ipynb")

    drive_service.files().update(fileId=file_id, media_body=media).execute()

    print("Revision uploaded.")


if __name__ == "__main__":
    run()
