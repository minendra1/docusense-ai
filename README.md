# DocuSense AI 📄🤖

DocuSense AI is a full-stack Multimodal Retrieval-Augmented Generation (RAG) engine. It allows users to upload PDF documents and instantly interact with their content. Unlike standard text-only RAG systems, DocuSense extracts both structural text layouts and embedded imagery, passing visual data through a vision model to generate a comprehensive, multimodal context matrix.

## 🏗️ Architecture & Pipeline Flow

The system is separated into a Vite/React frontend and a FastAPI backend. Below is the data flow pipeline for document ingestion and query processing.

```mermaid
graph TD
    %% Styling
    classDef user fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef front fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef back fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff;
    classDef db fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;

    %% Ingestion Flow
    U((User)):::user -->|Uploads PDF| F[React Frontend]:::front
    F -->|Multipart File| B[FastAPI Backend]:::back
    B --> P{PyMuPDF Parser}:::back
    
    P -->|Extracts Text| T[Text Chunks]:::back
    P -->|Extracts Images| I[Image Binaries]:::back
    
    I --> V[Vision Model<br>afri-aya]:::back
    V --> C[Visual Captions]:::back
    
    T --> E[Embedding Model<br>bge-large]:::back
    C --> E
    
    E --> DB[(FAISS Vector Store)]:::db

    %% Query Flow
    U -->|Asks Question| F
    F -->|JSON Query| B
    B --> R[LangChain Retriever]:::back
    DB --> R
    R --> CM[Context Matrix<br>Text + Visuals + Links]:::back
    CM --> LLM[LLM<br>Llama-3-8B-Instruct]:::back
<<<<<<< HEAD
    LLM -->|Streamed Response| F## 
    🛠️ Tech Stack

**Frontend:**
* React 19 + Vite
* Tailwind CSS v4 (Native Dark Mode)
* Lucide React Icons

**Backend:**
* Python + FastAPI
* LangChain Core & Community
* Hugging Face Inference API
* FAISS (Vector Storage)
* PyMuPDF (Document Parsing)

## 🚀 Getting Started

### Prerequisites
* Python 3.10+
* Node.js 18+
* A Hugging Face API Token

### 1. Backend Setup
Navigate to the backend directory and set up your Python environment:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt

Create a .env file in the backend directory:

Code snippet
HF_TOKEN=your_huggingface_token_here
Start the FastAPI server:

Bash
python main.py
The API will be available at http://127.0.0.1:8000

2. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and start the Vite dev server:

Bash
cd frontend
npm install
npm run dev
The UI will be available at http://localhost:5173

🧠 How It Works
Document Parsing: Uploaded PDFs are parsed using PyMuPDF. Text is extracted maintaining reading order, and embedded images are saved locally.

Visual Captioning: Extracted images are passed to a lightweight vision model (afri-aya) to generate descriptive text representations of diagrams and charts.

Vectorization: Text chunks and visual captions are embedded using bge-large-en-v1.5 and stored in a local FAISS vector index.

Retrieval & Generation: User queries trigger a similarity search in FAISS. The retrieved context (containing exact page numbers and image metadata) is sent to Meta-Llama-3-8B-Instruct to formulate a precise, grounded answer.
=======
    LLM -->|Streamed Response| F

>>>>>>> 5955ad43528eba768f6bee300d13e94f7ab9aa7d
