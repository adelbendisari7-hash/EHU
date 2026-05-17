import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))
CONFIDENCE_THRESHOLD_LOW = float(os.getenv("CONFIDENCE_THRESHOLD_LOW", "0.40"))
CONFIDENCE_THRESHOLD_MEDIUM = float(os.getenv("CONFIDENCE_THRESHOLD_MEDIUM", "0.60"))
USE_GPU = os.getenv("USE_GPU", "false").lower() == "true"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
