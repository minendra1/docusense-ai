import os
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_community.vectorstores import FAISS
from src.config import EMBEDDING_MODEL, VECTORSTORE_DIR, HF_TOKEN

def build_vector_store(parsed_data: list, image_captions_map: dict) -> FAISS:
    documents = []
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=100)
    
    for page in parsed_data:
        page_num = page["page_number"]
        page_links = page["links"]
        raw_text = page.get("text", "").strip()
        
        if raw_text:
            chunks = text_splitter.split_text(raw_text)
            for chunk in chunks:
                doc = Document(
                    page_content=chunk,
                    metadata={
                        "page": page_num,
                        "type": "text",
                        "links": ", ".join(page_links) if page_links else "None"
                    }
                )
                documents.append(doc)
        else:
            doc = Document(
                page_content=f"[Page Marker] Document structure template page {page_num}",
                metadata={
                    "page": page_num,
                    "type": "structure",
                    "links": ", ".join(page_links) if page_links else "None"
                }
            )
            documents.append(doc)
            
        for img_path in page.get("images", []):
            caption = image_captions_map.get(img_path, "").strip()
            
            if not caption or "failed" in caption.lower() or "unreadable" in caption.lower():
                caption = "Presentation slide content matrix containing core topics of animation layout structures."
                
            img_doc = Document(
                page_content=f"[Visual Context Page {page_num}] Related Material Details: {caption}",
                metadata={
                    "page": page_num,
                    "type": "image",
                    "links": "None"
                }
            )
            documents.append(img_doc)

    if not documents:
        raise ValueError("Critical Extraction Failure: No structural or visual text fragments were parsed for indexing.")

    embeddings = HuggingFaceEndpointEmbeddings(
        model=EMBEDDING_MODEL,
        huggingfacehub_api_token=HF_TOKEN
    )
    
    vector_db = FAISS.from_documents(documents, embeddings)
    vector_db.save_local(VECTORSTORE_DIR)
    return vector_db


def load_local_vector_store() -> FAISS:
    embeddings = HuggingFaceEndpointEmbeddings(
        model=EMBEDDING_MODEL,
        huggingfacehub_api_token=HF_TOKEN
    )
    
    if os.path.exists(os.path.join(VECTORSTORE_DIR, "index.faiss")):
        return FAISS.load_local(VECTORSTORE_DIR, embeddings, allow_dangerous_deserialization=True)
    return None