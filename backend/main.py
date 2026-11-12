from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from backend.detection import compare_images, decode_image, detect


def load_local_env() -> None:
    """Load simple KEY=VALUE settings from backend/.env without overriding real environment values."""
    env_path = Path(__file__).with_name(".env")
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_local_env()

app = FastAPI(
    title="WasteWatch API",
    description="Satellite-image waste-dumping screening service",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/detect")
async def detect_image(
    image: Annotated[UploadFile, File(description="Current satellite image")],
    confidence_threshold: Annotated[float, Form(ge=0.0, le=1.0)] = 0.35,
) -> dict[str, object]:
    try:
        image_array = decode_image(await image.read())
        detections = detect(image_array, os.getenv("WASTE_MODEL"), confidence_threshold)
    except (OSError, ValueError, RuntimeError, ImportError) as error:
        raise HTTPException(status_code=422, detail=f"Image detection failed: {error}") from error
    return {
        "width": image_array.shape[1],
        "height": image_array.shape[0],
        "detector": "YOLO" if os.getenv("WASTE_MODEL") else "baseline",
        "detections": [item.as_dict() for item in detections],
    }


@app.post("/api/v1/compare")
async def compare_images_endpoint(
    previous: Annotated[UploadFile, File(description="Earlier satellite image")],
    current: Annotated[UploadFile, File(description="Current satellite image")],
) -> dict[str, float]:
    try:
        previous_array = decode_image(await previous.read())
        current_array = decode_image(await current.read())
        changed_fraction, _ = compare_images(previous_array, current_array)
    except (OSError, ValueError, RuntimeError) as error:
        raise HTTPException(status_code=422, detail=f"Image comparison failed: {error}") from error
    return {"changed_fraction": changed_fraction}


COMPLAINT_RECIPIENT = "atchayam265@gmail.com"
ALLOWED_COMPLAINT_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_COMPLAINT_IMAGE_BYTES = 10 * 1024 * 1024


@app.post("/api/v1/complaints")
async def create_complaint(
    location: Annotated[str, Form(...)],
    message: Annotated[str, Form(...)],
    images: Annotated[list[UploadFile] | None, File()] = None,
) -> dict[str, object]:
    """Prepare a public waste-dumping complaint and email it when SMTP is configured."""
    clean_location = location.strip()
    clean_message = message.strip()
    if not clean_location or not clean_message:
        raise HTTPException(status_code=400, detail="Location and message are required.")

    attachments: list[tuple[str, str, bytes]] = []
    for upload in images or []:
        if not upload.filename:
            continue
        if upload.content_type not in ALLOWED_COMPLAINT_IMAGE_TYPES:
            raise HTTPException(status_code=415, detail="Only common image files can be attached.")
        content = await upload.read()
        if len(content) > MAX_COMPLAINT_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Each image must be 10 MB or smaller.")
        attachments.append((upload.filename, upload.content_type, content))

    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    if not all((smtp_host, smtp_user, smtp_password)):
        return {
            "sent": False,
            "recipient": COMPLAINT_RECIPIENT,
            "message": "Complaint prepared. Configure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD on the backend to deliver it by email.",
        }

    email = EmailMessage()
    email["From"] = smtp_user
    email["To"] = COMPLAINT_RECIPIENT
    email["Subject"] = f"Illegal waste dumping complaint — {clean_location}"
    email.set_content(
        f"Reported location: {clean_location}\n\n"
        f"Message from resident:\n{clean_message}\n\n"
        f"Attached images: {len(attachments)}"
    )
    for filename, content_type, content in attachments:
        maintype, subtype = content_type.split("/", 1)
        email.add_attachment(content, maintype=maintype, subtype=subtype, filename=filename)

    try:
        with smtplib.SMTP_SSL(smtp_host, int(os.getenv("SMTP_PORT", "465")), timeout=20) as server:
            server.login(smtp_user, smtp_password)
            server.send_message(email)
    except (OSError, smtplib.SMTPException, ValueError) as error:
        raise HTTPException(status_code=502, detail=f"Email delivery failed: {error}") from error

    return {"sent": True, "recipient": COMPLAINT_RECIPIENT, "message": "Complaint emailed successfully."}
