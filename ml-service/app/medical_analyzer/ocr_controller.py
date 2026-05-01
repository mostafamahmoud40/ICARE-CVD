from flask import jsonify, request
from ocr_provider import IOCRProvider
from file_upload_service import FileUploadService
from medical_analyzer import MedicalAnalyzer

class OCRController:
    def __init__(self, ocr_provider: IOCRProvider, file_service: FileUploadService, llm_analyzer: MedicalAnalyzer):
        self.ocr_provider = ocr_provider
        self.file_service = file_service
        self.llm_analyzer = llm_analyzer

    def handle_upload(self):
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        file_path = self.file_service.save_file(file)
        if not file_path:
            return jsonify({"error": "File type not allowed"}), 400
        
        # Process with OCR
        result = self.ocr_provider.process_document(file_path)
        
        # Clean up the uploaded file after processing (optional)
        # os.remove(file_path)
        
        if result.get("success") and result.get("markdown"):
            try:
                # Process with LLM Agent
                intelligent_analysis = self.llm_analyzer.analyze(result["markdown"])
                result["markdown"] = intelligent_analysis
            except Exception as e:
                # If LLM fails, we log it and just return the raw Mistral OCR text
                print(f"LLM Analysis failed: {str(e)}")
                result["llm_error"] = str(e)
        
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify({"error": result["error"]}), 500
