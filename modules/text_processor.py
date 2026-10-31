import re
from typing import Dict, Any, List

# Common stop words for clean TF-IDF preprocessing if needed
STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as',
    'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t',
    'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down',
    'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t',
    'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself',
    'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
    'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not',
    'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
    'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s',
    'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
    'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
    'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s',
    'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re',
    'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
}

# Key tech terms to normalize so variations match cleanly
TERM_NORMALIZATION_MAP = {
    r'\breact(?:\.js)?\b': 'react',
    r'\bnode(?:\.js)?\b': 'nodejs',
    r'\bvue(?:\.js)?\b': 'vuejs',
    r'\bangular(?:\.js)?\b': 'angular',
    r'\bpython\s*3(?:\.\d+)?\b': 'python',
    r'\bamazon\s*web\s*services\b': 'aws',
    r'\bgoogle\s*cloud(?:\s*platform)?\b': 'gcp',
    r'\bmicrosoft\s*azure\b': 'azure',
    r'\bpostgres(?:ql)?\b': 'postgresql',
    r'\bmongo(?:db)?\b': 'mongodb',
    r'\bmachine\s*learning\b': 'machine_learning',
    r'\bdeep\s*learning\b': 'deep_learning',
    r'\bartificial\s*intelligence\b': 'artificial_intelligence',
    r'\bnatural\s*language\s*processing\b': 'nlp',
    r'\bci\s*/\s*cd\b': 'cicd',
    r'\bdev\s*ops\b': 'devops',
    r'\bfront\s*end\b': 'frontend',
    r'\bback\s*end\b': 'backend',
    r'\bfull\s*stack\b': 'fullstack',
}


def clean_text(text: str) -> str:
    """
    Cleans raw text for NLP comparison: lowercases, normalizes terms, removes punctuation & extra spaces.
    """
    if not text:
        return ""

    cleaned = text.lower()

    # Term normalization
    for pattern, replacement in TERM_NORMALIZATION_MAP.items():
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

    # Replace special characters and punctuation with space (keep letters, numbers, underscores)
    cleaned = re.sub(r'[^a-z0-9_\s]', ' ', cleaned)

    # Normalize whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    return cleaned


def extract_candidate_info(raw_text: str, filename: str) -> Dict[str, Any]:
    """
    Extracts contact metadata (name, email, phone, links) from raw resume text.
    Fallback to formatted filename if candidate name cannot be extracted.
    """
    info = {
        "name": "",
        "email": None,
        "phone": None,
        "linkedin": None,
        "github": None
    }

    if not raw_text:
        info["name"] = format_filename_as_name(filename)
        return info

    # Extract Email
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', raw_text)
    if email_match:
        info["email"] = email_match.group(0)

    # Extract Phone
    phone_match = re.search(r'\(?\+?\d{1,3}\)?[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}', raw_text)
    if phone_match:
        info["phone"] = phone_match.group(0).strip()

    # Extract LinkedIn
    linkedin_match = re.search(r'(?:linkedin\.com/in/|linkedin:?\s*)([a-zA-Z0-9_-]+)', raw_text, re.IGNORECASE)
    if linkedin_match:
        info["linkedin"] = f"linkedin.com/in/{linkedin_match.group(1)}"

    # Extract GitHub
    github_match = re.search(r'(?:github\.com/|github:?\s*)([a-zA-Z0-9_-]+)', raw_text, re.IGNORECASE)
    if github_match:
        info["github"] = f"github.com/{github_match.group(1)}"

    # Heuristic Candidate Name Extraction
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    candidate_name = None

    skip_words = {
        'resume', 'curriculum', 'vitae', 'cv', 'profile', 'summary', 'contact',
        'experience', 'education', 'skills', 'projects', 'page', 'email', 'phone'
    }

    for line in lines[:8]:  # Check first 8 non-empty lines
        clean_line = re.sub(r'[^a-zA-Z\s]', '', line).strip()
        words = clean_line.split()

        # Name candidate line if 2-4 words, capitalized, no generic headers
        if 2 <= len(words) <= 4:
            if not any(w.lower() in skip_words for w in words):
                if all(w[0].isupper() for w in words if w):
                    candidate_name = " ".join(words)
                    break

    if not candidate_name:
        info["name"] = format_filename_as_name(filename)
    else:
        info["name"] = candidate_name

    return info


def format_filename_as_name(filename: str) -> str:
    """
    Converts filename like 'john_doe_resume.pdf' to 'John Doe'.
    """
    name = re.sub(r'\.(pdf|docx|doc|txt)$', '', filename, flags=re.IGNORECASE)
    name = re.sub(r'[-_]', ' ', name)
    name = re.sub(r'\b(resume|cv|profile|doc)\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+', ' ', name).strip()
    return name.title() if name else filename
