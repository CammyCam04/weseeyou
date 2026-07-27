# region Imports
import sys
import os
# Add backend directory to sys.path so nested imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.politicians import router as politicians_router
from routes.committees import router as committees_router
from routes.local import router as local_router
from routes.candidates import router as candidates_router
from services.legislator_service import load_congress_data
from services.committee_service import load_committees
# endregion

# region Lifespan Handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load and cache Congress data & committees on startup
    load_congress_data()
    load_committees()
    yield
# endregion

# region App Initialization
app = FastAPI(title="We See You API", version="1.0.0", lifespan=lifespan)

# Allowed local dev origins for CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# endregion

# region Include Routers
app.include_router(politicians_router, prefix="/api")
app.include_router(committees_router, prefix="/api")
app.include_router(local_router, prefix="/api")
app.include_router(candidates_router, prefix="/api")
# endregion

# region Base Routes
@app.get("/")
def read_root():
    return {"message": "Welcome to the political tracker API!"}
# endregion
