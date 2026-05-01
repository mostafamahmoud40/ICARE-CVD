import os
import base64
from mistralai.client import Mistral
from ocr_provider import IOCRProvider

class MistralOCRProvider(IOCRProvider):
    def __init__(self, api_key: str):
        self.client = Mistral(api_key=api_key)
        self.model = "mistral-ocr-latest"

    def _encode_image(self, image_path):
        """Encode the image to base64."""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def process_document(self, file_path: str):
        file_extension = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_extension in ['.pdf']:
                # For PDF, we use document_url with base64 (simplified for this example)
                # Note: Mistral SDK supports direct base64 for documents too
                with open(file_path, "rb") as f:
                    encoded_file = base64.b64encode(f.read()).decode('utf-8')
                
                response = self.client.ocr.process(
                    model=self.model,
                    document={
                        "type": "document_url",
                        "document_url": f"data:application/pdf;base64,{encoded_file}"
                    }
                )
            else:
                # For images
                encoded_image = self._encode_image(file_path)
                mime_type = "image/png" if file_extension == ".png" else "image/jpeg"
                
                response = self.client.ocr.process(
                    model=self.model,
                    document={
                        "type": "image_url",
                        "image_url": f"data:{mime_type};base64,{encoded_image}"
                    }
                )
            
            # Return the markdown content from all pages
            return {
                "success": True,
                "markdown": "\n\n".join([page.markdown for page in response.pages]),
                "raw": response.dict() if hasattr(response, 'dict') else str(response)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
