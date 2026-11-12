# WasteWatch prototype

WasteWatch is a frontend/backend prototype for screening satellite images for
possible illegal waste dumping locations.

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

The normal browser frontend is in [frontend](./frontend). It does not
use Streamlit:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The backend API is available at
`http://localhost:8000/docs`. The frontend currently uses mock dashboard data
and is ready to connect to the backend in a future integration.

The Chennai legal-area page uses the supplied GCC information: Kodungaiyur
(approximately 342.91 acres, including approximately 252 acres of legacy
waste) and Perungudi (approximately 250 acres, including approximately 225
acres historically used for dumping) are shown once each as the two major
municipal disposal sites. These entries are informational and should be
validated against current municipal records before operational use.

## Frontend demo login

- ID: `admin`
- Password: `admin123`

The demo includes a landing page, authentication screen, monitoring dashboard,
searchable mock cities, satellite map markers, yearly trends, risk cards,
detection reports, evidence gallery, and coverage charts. Search currently
matches the mock locations Bengaluru, Chennai, and Pune.

Upload a current image, optionally upload an older image to calculate a change
metric, and provide the area coordinates for the map marker. The default
detector is a dataset-free visual-anomaly baseline intended only for
demonstrating the workflow.

## Dataset needed for a reliable AI model

Please provide a dataset with:

- High-resolution satellite or aerial images covering real dumping areas and
  visually similar non-dump areas.
- One annotation per dump region. YOLO detection labels are easiest initially:
  `class_id x_center y_center width height`, normalized to 0-1, with one `.txt`
  file per image.
- A `data.yaml` file containing image paths and class names, for example
  `names: [waste_dump]`.
- GPS coordinates or image georeferencing (GeoTIFF/sidecar metadata) so
  detections can be placed accurately on a map.
- Capture date/time for every image, plus earlier imagery for the same location
  when temporal growth monitoring is required.
- Negative examples: roads, construction, farms, bare soil, water, rooftops,
  and normal waste collection sites.
- A geographic train/validation/test split. Do not put nearby tiles from the
  same place into different splits.

As a practical starting point, aim for at least 500-1,000 labeled dump
instances across several regions, with 20% validation and 20% geographically
held-out test data. More important than the exact count is coverage of
different seasons, resolutions, lighting, terrain, and dump sizes. Do not
include sensitive personal data or imagery whose license does not permit model
training.

## Using a trained YOLO model

Install the optional dependency:

```powershell
pip install ultralytics
```

Then enter the path to a trained `.pt` model in the sidebar, or set
`WASTE_MODEL` before starting Streamlit. The model should be trained on
satellite imagery with a `waste_dump` class. Detection quality must be
validated against a held-out, geographically separate test set before use in
decision-making.

## Next steps for a production system

1. Collect and license sufficiently high-resolution imagery and GPS-accurate
   annotations.
2. Split data by geographic area, not only by image, to prevent leakage.
3. Train and compare YOLO detection and segmentation models.
4. Store detections as geospatial polygons in PostGIS and expose them through
   an API.
5. Add review workflows, confidence calibration, and temporal alerting.
