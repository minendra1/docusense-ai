import os
from dotenv import load_dotenv


load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

EMBEDDING_MODEL = "BAAI/bge-large-en-v1.5"
LLM_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"

VISION_MODEL = "CohereLabsCommunity/afri-aya"


BASE_DATA_DIR = "data"
IMAGE_EXTRACT_DIR = os.path.join(BASE_DATA_DIR, "extracted_images")
VECTORSTORE_DIR = os.path.join(BASE_DATA_DIR, "vectorstore")