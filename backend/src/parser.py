import fitz
import os
from src.config import IMAGE_EXTRACT_DIR

def extract_pdf_elements(pdf_path: str) -> list:
    doc = fitz.open(pdf_path)
    parsed_pages = []

    os.makedirs(IMAGE_EXTRACT_DIR, exist_ok=True)

    for page_num in range(len(doc)):
        page = doc[page_num]
        
        blocks = page.get_text("blocks")
        
        blocks.sort(key=lambda b: (b[1], b[0]))
        
        text_segments = []
        for block in blocks:
            block_text = block[4].strip()
            if block_text:
                text_segments.append(block_text)
                
        structured_text = "\n\n".join(text_segments)
        
        links = [link["uri"] for link in page.get_links() if "uri" in link]
                
        image_paths = []
        for img_idx, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            image_name = f"page_{page_num + 1}_img_{img_idx + 1}.{image_ext}"
            local_img_path = os.path.join(IMAGE_EXTRACT_DIR, image_name)
            
            with open(local_img_path, "wb") as f:
                f.write(image_bytes)
            image_paths.append(local_img_path)
            
        parsed_pages.append({
            "page_number": page_num + 1,
            "text": structured_text,
            "links": links,
            "images": image_paths
        })
        
    return parsed_pages