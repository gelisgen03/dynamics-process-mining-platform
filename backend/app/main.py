from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Router'ı import et
from .routes import router

# FastAPI uygulamasını oluştur
app = FastAPI(
    title="Process Mining API",
    description="Supabase + PM4Py ile süreç analizi",
    version="1.0.0"
)

# --- CORS Middleware (Frontend'den çağrı yapabilsin) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Router'ı kaydet ---
app.include_router(router)

# --- StaticFiles: outputs klasörünü servis et (PNG görselleri için) ---
outputs_dir = os.path.join(os.path.dirname(__file__), "outputs")
os.makedirs(outputs_dir, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=outputs_dir), name="outputs")

# --- Root endpoint ---
@app.get("/")
def root():
    return {
        "message": "Process Mining Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)