import re
from typing import Set, Dict, Any, List

# Extensive Skill Taxonomy
SKILL_TAXONOMY = {
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "c", "go", "golang", "rust",
    "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "perl", "bash", "shell", "sql", "html", "css",

    # Frameworks & Libraries
    "react", "react native", "next.js", "vue", "vuejs", "angular", "django", "flask", "fastapi",
    "spring", "spring boot", "express", "node.js", "nodejs", "asp.net", "laravel", "rails",
    "tailwind", "bootstrap", "jquery", "pandas", "numpy", "scipy", "scikit-learn", "sklearn",
    "tensorflow", "keras", "pytorch", "opencv", "spacy", "nltk", "huggingface", "transformers",
    "langchain", "llama-index", "streamlit", "gradio",

    # AI, ML & Data Science
    "machine learning", "deep learning", "artificial intelligence", "nlp", "natural language processing",
    "computer vision", "generative ai", "llm", "large language models", "rag", "neural networks",
    "data science", "data analysis", "data mining", "predictive modeling", "time series",
    "feature engineering", "reinforcement learning", "model deployment", "mlops",

    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes",
    "terraform", "ansible", "jenkins", "gitlab ci", "github actions", "circleci", "helm",
    "serverless", "lambda", "ecs", "eks", "s3", "ec2", "cloudformation", "prometheus", "grafana",

    # Databases & Big Data
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
    "oracle", "dynamodb", "cassandra", "snowflake", "bigquery", "redshift", "spark", "hadoop",
    "pyspark", "kafka", "airflow", "dbt", "neo4j",

    # Architecture & Concepts
    "rest", "restful api", "graphql", "microservices", "system design", "object oriented programming",
    "oop", "functional programming", "design patterns", "agile", "scrum", "kanban", "tdd", "bdd",
    "unit testing", "cicd", "version control", "git",

    # Tools & Methodologies
    "jira", "confluence", "figma", "postman", "docker-compose", "linux", "unix", "vite", "webpack",

    # Soft Skills & Management
    "leadership", "project management", "problem solving", "communication", "teamwork",
    "critical thinking", "collaboration", "analytical skills", "adaptability", "time management"
}

# Synonyms and mapping for standardized display
SKILL_DISPLAY_MAP = {
    "python": "Python",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "java": "Java",
    "c++": "C++",
    "c#": "C#",
    "go": "Go",
    "golang": "Go",
    "rust": "Rust",
    "sql": "SQL",
    "react": "React.js",
    "next.js": "Next.js",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "spring": "Spring Boot",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express": "Express.js",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "keras": "Keras",
    "huggingface": "HuggingFace",
    "transformers": "Transformers",
    "langchain": "LangChain",
    "streamlit": "Streamlit",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "artificial intelligence": "AI",
    "nlp": "NLP",
    "natural language processing": "NLP",
    "computer vision": "Computer Vision",
    "generative ai": "Generative AI",
    "llm": "LLM",
    "mlops": "MLOps",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "google cloud": "GCP",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "terraform": "Terraform",
    "jenkins": "Jenkins",
    "github actions": "GitHub Actions",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "elasticsearch": "Elasticsearch",
    "snowflake": "Snowflake",
    "bigquery": "BigQuery",
    "spark": "Apache Spark",
    "kafka": "Apache Kafka",
    "airflow": "Apache Airflow",
    "rest": "REST APIs",
    "restful api": "REST APIs",
    "graphql": "GraphQL",
    "microservices": "Microservices",
    "system design": "System Design",
    "git": "Git",
    "linux": "Linux",
    "agile": "Agile/Scrum",
    "leadership": "Leadership",
    "problem solving": "Problem Solving",
    "communication": "Communication"
}


def extract_skills_from_text(text: str) -> Set[str]:
    """
    Extracts known skills from input text using regex boundary matching.
    """
    if not text:
        return set()

    found_skills = set()
    cleaned = text.lower()

    for skill in SKILL_TAXONOMY:
        # Escape special chars like c++, c#
        pattern = r'(?<![a-zA-Z0-9#+])' + re.escape(skill) + r'(?![a-zA-Z0-9#+])'
        if re.search(pattern, cleaned):
            found_skills.add(skill)

    return found_skills


def format_skill_name(skill: str) -> str:
    """
    Formats a raw skill key into a clean display label (e.g. 'pytorch' -> 'PyTorch').
    """
    return SKILL_DISPLAY_MAP.get(skill.lower(), skill.title())


def analyze_skill_match(jd_skills: Set[str], candidate_skills: Set[str]) -> Dict[str, Any]:
    """
    Compares candidate skills against job description required skills.
    Returns matched, missing, extra skills, and skill coverage ratio score.
    """
    if not jd_skills:
        # If no explicit skills found in JD, coverage defaults to candidate skill density
        matched = candidate_skills
        missing = set()
        extra = set()
        coverage_score = 100.0 if candidate_skills else 50.0
    else:
        matched = jd_skills.intersection(candidate_skills)
        missing = jd_skills - candidate_skills
        extra = candidate_skills - jd_skills
        coverage_score = round((len(matched) / len(jd_skills)) * 100, 2)

    return {
        "matched_skills": [format_skill_name(s) for s in sorted(matched)],
        "missing_skills": [format_skill_name(s) for s in sorted(missing)],
        "extra_skills": [format_skill_name(s) for s in sorted(extra)],
        "matched_count": len(matched),
        "missing_count": len(missing),
        "jd_skill_count": len(jd_skills),
        "candidate_skill_count": len(candidate_skills),
        "coverage_score": coverage_score
    }
