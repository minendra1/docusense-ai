from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil

from src.parser import extract_pdf_elements
from src.hf_client import generate_image_description
from src.vector_store import build_vector_store, load_local_vector_store
from src.rag_pipeline import get_rag_chain

app = FastAPI(title="Multimodal PDF RAG API Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

rag_chain = None

vector_db = load_local_vector_store()
if vector_db:
    rag_chain = get_rag_chain(vector_db)

class ChatRequest(BaseModel):
    message: str


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global rag_chain
    try:
        pdf_path = os.path.join("data", "source_pdfs", file.filename)
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
        with open(pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        parsed_data = extract_pdf_elements(pdf_path)

        image_captions_map = {}
        for page in parsed_data:
            for img_path in page["images"]:
                caption = generate_image_description(img_path)
                image_captions_map[img_path] = caption

        vector_db = build_vector_store(parsed_data, image_captions_map)
        
        rag_chain = get_rag_chain(vector_db)

        return {"status": "success", "message": f"Successfully parsed and indexed {file.filename}."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
async def chat_with_pdf(request: ChatRequest):
    global rag_chain
    if not rag_chain:
        raise HTTPException(status_code=400, detail="No document has been indexed yet. Please upload a PDF file first.")
    
    try:
        response = rag_chain.invoke({"input": request.message})
        
        if response is None:
            return {"answer": "I found matching reference frames but could not generate text. Please try refining your query."}
            
        if isinstance(response, dict):
            answer = response.get("answer", response.get("result", "No explicit answer generated."))
        else:
            answer = getattr(response, "content", str(response))
            
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)