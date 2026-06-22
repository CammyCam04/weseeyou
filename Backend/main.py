# region Imports
import sys
import os
# Add current directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.politicians import router as politicians_router
from services.congress_service import load_congress_data
# endregion

# region Lifespan Handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load data on startup
    load_congress_data()
    yield
# endregion

# region App Initialization
app = FastAPI(title="We See You API", version="1.0.0", lifespan=lifespan)

# Explicit list of origins to fix the CORS credentials mismatch issue
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Configure CORS
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
# endregion

# region Base Routes
@app.get("/")
def read_root():
    return {"message": "Welcome to the political tracker API!"}
# endregion
