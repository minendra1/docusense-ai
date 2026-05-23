from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from huggingface_hub import InferenceClient
from src.config import LLM_MODEL, HF_TOKEN
import time

def get_rag_chain(vector_db):
    client = InferenceClient(token=HF_TOKEN)

    def call_huggingface_via_chat(prompt_value) -> str:
        prompt_string = prompt_value.to_string()
        
        try:
            print(f"📡 Forwarding multimodal context matrix to Llama-3 using Conversational Chat API...")
            
            response = client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "user", "content": prompt_string}
                ],
                max_tokens=512,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            error_msg = str(e)
            if "503" in error_msg or "loading" in error_msg.lower():
                print("⏳ Model endpoint is warming up. Retrying execution loop in 10 seconds...")
                time.sleep(10)
                try:
                    response = client.chat.completions.create(
                        model=LLM_MODEL,
                        messages=[{"role": "user", "content": prompt_string}],
                        max_tokens=512,
                        temperature=0.3
                    )
                    return response.choices[0].message.content.strip()
                except Exception as retry_err:
                    return f"❌ Connection retry timeout: {str(retry_err)}"
                    
            return f"⚠️ HF Client Engine Error: {error_msg}"

    system_prompt = (
        "You are an expert open-source Multimodal PDF Document Analyzer.\n"
        "You are provided with highly detailed text chunks, embedded image descriptions, "
        "and page link metadata extracted directly from the document pages.\n\n"
        "CRITICAL EXECUTION RULES:\n"
        "1. CITATIONS: Always mention the source page number when discussing facts from the document.\n"
        "2. VISUAL ANALYSIS: If an answer relies on visual context or image descriptions, explicitly state it to the user (e.g., 'According to the visual content/diagram on Page X...').\n"
        "3. EMBEDDED LINKS: If relevant hyperlinks exist within the provided context metadata, you MUST provide them as clickable Markdown links exactly as written (e.g., [Source Description](URL)). Do not invent links.\n"
        "4. GROUNDEDNESS: Answer the question precisely based on the context. If the details aren't present, state that clearly.\n\n"
        "Context Matrix:\n{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    retriever = vector_db.as_retriever(search_kwargs={"k": 5}) 
    
    def format_docs(docs):
        if not docs:
            return "No relevant text fragments or visual context items found matching this query block."
        
        formatted_chunks = []
        for doc in docs:
            meta = doc.metadata
            page_num = meta.get("page", "Unknown")
            chunk_type = meta.get("type", "text").upper()
            links = meta.get("links", "None")
            
            chunk_header = f"--- [DOCUMENT SEGMENT | PAGE: {page_num} | TYPE: {chunk_type} | LINKS: {links}] ---"
            chunk_body = f"Content: {doc.page_content}"
            
            formatted_chunks.append(f"{chunk_header}\n{chunk_body}")
            
        return "\n\n".join(formatted_chunks)

    def parse_final_output(chain_output):
        return str(chain_output).strip()

    rag_chain = (
        {
            "context": lambda x: format_docs(retriever.invoke(x.get("input", str(x)))),
            "input": lambda x: x.get("input", str(x))
        }
        | prompt
        | RunnableLambda(call_huggingface_via_chat)
        | RunnableLambda(parse_final_output)
    )
    
    return rag_chain