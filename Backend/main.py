from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS so your frontend can communicate with the backend
app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # Adjust this in production
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

@app.get("/")
def read_root():
    return {"message": "Welcome to the political tracker API!"}