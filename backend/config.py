import os

# Default to SQLite for quick start; set DATABASE_URL env var for MySQL in production
# e.g. DATABASE_URL=mysql+pymysql://root:123456@localhost:3306/dr_diagnosis
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///" + os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")), "dr_diagnosis.db"))
JWT_SECRET = os.getenv("JWT_SECRET", "dr-diagnosis-secret-key-2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
UPLOAD_DIR = os.path.join(PROJECT_ROOT, "uploads")
HEATMAP_DIR = os.path.join(PROJECT_ROOT, "heatmaps")
REPORT_DIR = os.path.join(PROJECT_ROOT, "reports")
MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "classifier.pt")

for d in [UPLOAD_DIR, HEATMAP_DIR, REPORT_DIR]:
    os.makedirs(d, exist_ok=True)
