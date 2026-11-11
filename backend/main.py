from __future__ import annotations

import os
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from backend.detection import compare_images, decode_image, detect

app = FastAPI(
    title="WasteWatch API",
    description="Satellite-image waste-dumping screening service",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
