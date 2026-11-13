"""World Cup 2026 REST backend.

Loads the generated dataset (public/data/world-cup.json, produced from the CSVs
by `npm run data:build`) once at startup and serves it to the frontend.

Run from app/backend:
    uvicorn main:app --reload --port 8000
"""

import json
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.gzip import GZipMiddleware

DEFAULT_DATA_PATH = Path(__file__).resolve().parent.parent / "public" / "data" / "world-cup.json"
DATA_PATH = Path(os.environ.get("WORLD_CUP_DATA", DEFAULT_DATA_PATH))


def load_dataset(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise RuntimeError(f"Dataset not found at {path}. Run `npm run data:build` in app/ first.")
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


dataset: dict[str, Any] = load_dataset(DATA_PATH)

app = FastAPI(
    title="World Cup 2026 API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "sections": list(dataset.keys())}


@app.get("/api/dataset")
def get_dataset() -> dict[str, Any]:
    return dataset


@app.get("/api/{section}")
def get_section(section: str) -> Any:
    if section not in dataset:
        raise HTTPException(status_code=404, detail=f"Unknown section '{section}'")
    return dataset[section]
