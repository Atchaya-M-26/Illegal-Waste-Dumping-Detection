from __future__ import annotations

import io
from dataclasses import asdict, dataclass
from typing import Any

import cv2
import numpy as np
from PIL import Image


@dataclass(frozen=True)
class Detection:
    x: int
    y: int
    width: int
    height: int
    confidence: float
    source: str

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def decode_image(data: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(data)).convert("RGB")
    return np.asarray(image)


def detect_with_baseline(image: np.ndarray, min_area: int = 250) -> list[Detection]:
    """Find visually unusual, compact regions as a dataset-free baseline."""
    hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
    saturation = hsv[:, :, 1]
    value = hsv[:, :, 2]
    unusual = ((saturation < 45) & (value < 150)) | (saturation > 175)
    mask = unusual.astype(np.uint8) * 255
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    count, _, stats, _ = cv2.connectedComponentsWithStats(mask)
    detections: list[Detection] = []
    image_area = image.shape[0] * image.shape[1]
    for index in range(1, count):
        x, y, width, height, area = stats[index]
        if area < min_area or area > image_area * 0.3:
            continue
        confidence = min(0.95, 0.35 + area / max(1, width * height) * 0.6)
        detections.append(
            Detection(
                x=int(x),
                y=int(y),
                width=int(width),
                height=int(height),
                confidence=float(confidence),
                source="baseline",
            )
        )
    return sorted(detections, key=lambda item: item.confidence, reverse=True)


def detect_with_yolo(image: np.ndarray, model_path: str) -> list[Detection]:
    """Run an optional Ultralytics model when a trained model is available."""
    from ultralytics import YOLO

    model = YOLO(model_path)
    result = model.predict(image, verbose=False)[0]
    detections: list[Detection] = []
    if result.boxes is None:
        return detections
    for box, confidence in zip(result.boxes.xyxy.cpu().numpy(), result.boxes.conf.cpu().numpy()):
        x1, y1, x2, y2 = [int(value) for value in box]
        detections.append(
            Detection(
                x=x1,
                y=y1,
                width=max(1, x2 - x1),
                height=max(1, y2 - y1),
                confidence=float(confidence),
                source="YOLO",
            )
        )
    return detections


def detect(image: np.ndarray, model_path: str | None, threshold: float) -> list[Detection]:
    detections = detect_with_yolo(image, model_path) if model_path else detect_with_baseline(image)
    return [item for item in detections if item.confidence >= threshold]


def compare_images(previous: np.ndarray, current: np.ndarray) -> tuple[float, np.ndarray]:
    height, width = current.shape[:2]
    previous_resized = cv2.resize(previous, (width, height))
    difference = cv2.absdiff(previous_resized, current)
    gray = cv2.cvtColor(difference, cv2.COLOR_RGB2GRAY)
    changed = (gray > 30).astype(np.uint8) * 255
    changed = cv2.medianBlur(changed, 5)
    changed_fraction = float(np.count_nonzero(changed) / changed.size)
    return changed_fraction, cv2.cvtColor(changed, cv2.COLOR_GRAY2RGB)
