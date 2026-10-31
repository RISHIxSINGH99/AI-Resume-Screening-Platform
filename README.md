# 🎯 AI-Powered Resume Screening & Candidate Ranking System

An intelligent, full-featured HR & Talent Acquisition dashboard that leverages Natural Language Processing (NLP) and multi-factor candidate scoring to automatically screen resumes, extract skills, and rank candidates against target job descriptions.

---

## 🖼️ Dashboard Preview

```
+---------------------------------------------------------------------------------------------------+
|  🎯 Talent Intelligence & Resume Screening System                                                |
|  Automated AI candidate evaluation, multi-factor skill matching, and instant resume ranking        |
+---------------------------------------------------------------------------------------------------+
|  [Uploaded Resumes: 5]  |  [Candidates Processed: 5]  |  [Avg Match: 78.4%]  |  [Top: Alex Dev]   |
+---------------------------------------------------------------------------------------------------+
|  Rank #1: Alex Dev (Score: 88.5%) - 🌟 Top Fit                                                   |
|  ✓ Matched: Python, PyTorch, Docker, AWS | ✗ Missing: Kubernetes                                  |
|  💡 Feedback: Strong alignment with key requirements. High match in Python, PyTorch, AWS.        |
+---------------------------------------------------------------------------------------------------+
```

---

## 🚀 Key Features

- **📄 Robust PDF Parsing**: Extracts text cleanly with fallback parsers and alerts users to scanned or unreadable PDFs.
- **🛠️ Automated Skill Taxonomy Extraction**: Extracts over 300+ technical, cloud, framework, database, and soft skills from both Job Descriptions and resumes.
- **⚖️ Multi-Factor Candidate Scoring Engine**:
  - **40% Skill Coverage Score**: Direct overlap percentage between required skills and candidate skills.
  - **40% TF-IDF Cosine Similarity**: Document-level semantic relevance baseline.
  - **20% Contextual Keyword Overlap**: Frequency ratio of domain-specific keywords and action verbs.
- **📊 HR Analytics Dashboard**:
  - Top Summary KPI cards (*Total Uploads, Processed Count, Pool Average Score, Top Candidate*).
  - Multi-view candidate results (*Card View, Table View, Interactive Charts*).
  - Filterable by match tier (*Top Fit ≥80%, Strong Fit ≥65%, Moderate Fit ≥50%, Low Fit <50%*).
  - CSV export for HR reporting.
- **⚡ Preset Job Descriptions**: Pre-loaded job descriptions (*Senior AI/ML Engineer, Full Stack Developer, Data Scientist*) for one-click testing.
- **🔒 Privacy & Security First**: No hardcoded API keys or external paid APIs required; operates completely locally or on lightweight free cloud instances.

---

## 🛠 Tech Stack

- **Frontend & Interface**: [Streamlit](https://streamlit.io/) (Python Web Application Framework)
- **Data & Dataframes**: [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
- **Machine Learning & NLP**: [Scikit-Learn](https://scikit-learn.org/) (`TfidfVectorizer`, `cosine_similarity`)
- **PDF Extraction**: `PyPDF2` / `pypdf`
- **Visualization**: Streamlit Analytics & Altair Charting Engine

---

## 📂 Project Architecture & Directory Structure

```
resumefinder/
├── Main.py                     # Main Streamlit Dashboard Application
├── requirements.txt            # Application dependencies
├── .gitignore                  # Git ignore rules for secrets and environments
├── README.md                   # Complete project documentation
└── modules/                    # Modular engine components
    ├── __init__.py
    ├── pdf_parser.py           # Text extraction, page validation & scanned PDF detection
    ├── text_processor.py       # Text cleaning, contact extraction (Email, Phone, Links)
    ├── skill_extractor.py      # Skill taxonomy & match differential engine
    ├── scoring_engine.py       # Multi-factor scoring pipeline & AI summary generator
    ├── sample_data.py          # Preset job descriptions for quick testing
    └── ui_components.py        # Custom CSS, KPI cards, badges, and dashboard layout
```

---

## 📐 How the Candidate Ranking Works

The evaluation engine processes every resume through a multi-stage NLP pipeline:

```
Resume PDF ➔ Text Extraction ➔ Term Normalization ➔ Skill Tagging
                                                        │
Job Description ➔ Skill & Keyphrase Extraction ─────────┼➔ Multi-Factor Scoring ➔ Final Rank
```

$$\text{Final Score} = (0.40 \times \text{Skill Score}) + (0.40 \times \text{TF-IDF Score}) + (0.20 \times \text{Keyword Overlap})$$

| Match Score Tier | Category | Description |
| :--- | :--- | :--- |
| **80.0% – 100%** | 🌟 Top Fit | High technical skill overlap and strong semantic alignment |
| **65.0% – 79.9%** | ✅ Strong Fit | Good candidate match with minor missing optional skills |
| **50.0% – 64.9%** | ⚠️ Moderate Fit | Partial alignment; requires additional screening |
| **Below 50.0%** | ❌ Low Fit | Missing critical required skills or core experience |

---

## 📌 Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/codewithshek/AI-powered-Resume-Screening-and-Ranking-System.git
cd AI-powered-Resume-Screening-and-Ranking-System/resumefinder
```

### 2. Create and Activate Virtual Environment
```bash
# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Streamlit Application
```bash
streamlit run Main.py
```

Open your web browser at `http://localhost:8501`.

---

## 🌐 Streamlit Community Cloud Deployment

To deploy this application for free on **Streamlit Community Cloud**:

1. Push your changes to your GitHub repository.
2. Log into [share.streamlit.io](https://share.streamlit.io/).
3. Click **New App** and select your repository and branch.
4. Set the **Main file path** to `Main.py` (or `resumefinder/Main.py` depending on repository root structure).
5. Click **Deploy**!

---

## 🔮 Future Enhancements

- [ ] Support for Microsoft Word (`.docx`) resume formats.
- [ ] Integration with HuggingFace transformer embeddings for semantic vector search.
- [ ] Candidate comparison side-by-side modal.
- [ ] Automated candidate feedback email generation.

---

## 📜 Attribution & License

This project was initially inspired by and built upon the foundational work by **D ABHISHEK YADAV** as part of the *AICTE - Internship on AI (TechSaksham)*.

This enhanced version features a complete structural refactoring, multi-factor scoring algorithm, custom skill taxonomy engine, error handling suite, and modern HR Talent Intelligence UI.
