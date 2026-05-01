from abc import ABC, abstractmethod

class IOCRProvider(ABC):
    @abstractmethod
    def process_document(self, file_path: str):
        """
        Process a document and return the OCR results.
        """
        pass
