import os
import time
from huggingface_hub import InferenceClient
from src.config import HF_TOKEN, VISION_MODEL

client = InferenceClient(token=HF_TOKEN)

def generate_image_description(image_path: str) -> str:
    """
    Transmits local image binaries over the wire to create a textual visual description.
    Includes fallback error catching and a 503 warmup buffer to prevent RAG dropouts.
    """
    try:
        if not os.path.exists(image_path) or os.path.getsize(image_path) == 0:
            return "Visual asset placeholder. Image file missing or unreadable."

        with open(image_path, "rb") as img_file:
            image_data = img_file.read()
            
        response = client.image_to_text(image=image_data, model=VISION_MODEL)
        
        if hasattr(response, "generated_text"):
            return response.generated_text
        elif isinstance(response, dict) and "generated_text" in response:
            return response["generated_text"]
        elif isinstance(response, list) and len(response) > 0 and "generated_text" in response[0]:
            return response[0]["generated_text"]
            
        return str(response)
        
    except Exception as e:
        error_msg = str(e)
        if "503" in error_msg or "loading" in error_msg.lower():
            try:
                print(f"🔄 Vision model warming up. Retrying request for {image_path}...")
                time.sleep(4)
                with open(image_path, "rb") as img_file:
                    image_data = img_file.read()
                response = client.image_to_text(image=image_data, model=VISION_MODEL)
                return response.generated_text if hasattr(response, 'generated_text') else str(response)
            except Exception as retry_err:
                print(f"⚠️ Retry failed: {retry_err}")

        print(f"⚠️ Log Error: Vision pipeline failed on {image_path}. Context details: {e}")
        return "Slide layout diagram graphic asset component containing system descriptions."


def generate_text_response(model_id: str, system_context: str, user_query: str) -> str:
    """
    Fallback Helper: Routes raw text requests through conversational endpoints 
    to bypass provider restrictions when not using LangChain.
    """
    try:
        response = client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "system", "content": system_context},
                {"role": "user", "content": user_query}
            ],
            max_tokens=1024,
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"⚠️ Log Error: Conversational pipeline failure. Context details: {e}")
        return "An error occurred while generating a response from the text model."