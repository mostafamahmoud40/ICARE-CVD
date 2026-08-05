import os
import sys
from pathlib import Path

from flask import Flask
from flask_cors import CORS
from mistral_ocr_provider import MistralOCRProvider
from file_upload_service import FileUploadService
from ocr_controller import OCRController
from medical_analyzer import MedicalAnalyzer

_here = Path(__file__).resolve().parent
for _root in (_here, _here.parent):
    if (_root / "ml_env.py").is_file():
        _s = str(_root)
        if _s not in sys.path:
            sys.path.insert(0, _s)
        break
from ml_env import load_ml_service_dotenv

load_ml_service_dotenv()

app = Flask(__name__)

# Allow the Next.js front-end (any origin in dev) to reach the API.
# Tighten origins to the production domain before going live.
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

# Dependency Injection
ocr_provider = MistralOCRProvider(api_key=MISTRAL_API_KEY)
file_service = FileUploadService(upload_folder=UPLOAD_FOLDER, allowed_extensions=ALLOWED_EXTENSIONS)
llm_analyzer = MedicalAnalyzer()
ocr_controller = OCRController(ocr_provider=ocr_provider, file_service=file_service, llm_analyzer=llm_analyzer)


@app.route('/health', methods=['GET'])
def health():
    from flask import jsonify
    return jsonify({"status": "ok", "service": "medical_analyzer"})


@app.route('/api/ocr', methods=['POST'])
def upload_file():
    return ocr_controller.handle_upload()


@app.route('/api/chat', methods=['POST'])
def chat():
    from flask import request, jsonify
    data = request.json
    if not data or 'history' not in data or 'context' not in data:
        return jsonify({"error": "Missing history or context"}), 400

    try:
        response = llm_analyzer.chat_with_context(data['history'], data['context'])
        return jsonify({"success": True, "reply": response})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, host='0.0.0.0', port=5000)
