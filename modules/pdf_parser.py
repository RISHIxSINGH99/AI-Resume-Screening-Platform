import io
import re
from typing import Dict, Any

try:
    from PyPDF2 import PdfReader
except ImportError:
    try:
        from pypdf import PdfReader
    except ImportError:
        PdfReader = None


def extract_text_from_pdf(file_obj) -> Dict[str, Any]:
    """
    Extracts text and metadata from a PDF file object.
    Handles corrupt files, scanned PDFs without text, and empty documents.
    """
    result = {
        "success": False,
        "text": "",
        "page_count": 0,
        "char_count": 0,
        "is_scanned": False,
        "error": None
    }

    if PdfReader is None:
        result["error"] = "No PDF processing library found (PyPDF2/pypdf missing)."
        return result

    try:
        # If file_obj is bytes or BytesIO, handle gracefully
        if isinstance(file_obj, bytes):
            stream = io.BytesIO(file_obj)
        else:
            # Streamlit UploadedFile or file-like object
            file_bytes = file_obj.read()
            # Reset pointer for possible subsequent reads
            if hasattr(file_obj, "seek"):
                file_obj.seek(0)
            stream = io.BytesIO(file_bytes)

        if stream.getvalue() == b"":
            result["error"] = "File is empty (0 bytes)."
            return result

        pdf = PdfReader(stream)
        num_pages = len(pdf.pages)
        result["page_count"] = num_pages

        if num_pages == 0:
            result["error"] = "PDF file contains no pages."
            return result

        extracted_pages = []
        for i, page in enumerate(pdf.pages):
            try:
                page_text = page.extract_text() or ""
                extracted_pages.append(page_text)
            except Exception:
                extracted_pages.append("")

        full_text = "\n".join(extracted_pages).strip()
        # Clean excessive newlines/whitespace
        full_text = re.sub(r'\n{3,}', '\n\n', full_text)

        char_count = len(full_text)
        result["text"] = full_text
        result["char_count"] = char_count

        # Check if PDF appears to be a scanned document (very few readable characters per page)
        if char_count < 30 and num_pages > 0:
            result["is_scanned"] = True
            result["error"] = "PDF appears to be scanned or contains non-selectable image text. Text extraction yielded limited results."
            # Still mark success true if text > 0 so downstream handles warning appropriately
            result["success"] = True if char_count > 0 else False
        else:
            result["success"] = True

    except Exception as e:
        result["error"] = f"Failed to parse PDF document: {str(e)}"
        result["success"] = False

    return result
