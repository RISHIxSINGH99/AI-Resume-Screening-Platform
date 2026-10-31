import streamlit as st
import pandas as pd
from typing import List, Dict, Any

from modules.pdf_parser import extract_text_from_pdf
from modules.text_processor import extract_candidate_info
from modules.skill_extractor import extract_skills_from_text
from modules.scoring_engine import rank_all_candidates
from modules.sample_data import SAMPLE_JOB_DESCRIPTIONS
from modules.ui_components import (
    apply_custom_css,
    render_header,
    render_kpi_metrics,
    render_skill_badges
)

# Set Streamlit Page Configuration
st.set_page_config(
    page_title="AI Resume Screening & Candidate Ranking",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Apply Custom CSS styling
apply_custom_css()


@st.cache_data(show_spinner=False)
def cached_process_pdf(file_name: str, file_bytes: bytes) -> Dict[str, Any]:
    """
    Cached PDF extraction function to prevent redundant processing when re-running UI.
    """
    parsed = extract_text_from_pdf(file_bytes)
    cand_info = extract_candidate_info(parsed["text"], file_name)
    return {
        "filename": file_name,
        "text": parsed["text"],
        "page_count": parsed["page_count"],
        "char_count": parsed["char_count"],
        "is_scanned": parsed["is_scanned"],
        "error": parsed["error"],
        "candidate_info": cand_info
    }


def main():
    render_header()

    # Sidebar Navigation & Information
    with st.sidebar:
        st.header("⚙️ Control Panel")
        st.markdown("---")
        st.subheader("💡 Presets & Quick Test")
        preset_choice = st.selectbox(
            "Load Sample Job Description",
            ["-- Select Preset --"] + list(SAMPLE_JOB_DESCRIPTIONS.keys()),
            help="Select a pre-configured Job Description to test the screening pipeline immediately."
        )

        st.markdown("---")
        st.subheader("📋 Evaluation Weights")
        st.markdown(
            """
            - **Skill Match**: `40%`
            - **TF-IDF Semantic Match**: `40%`
            - **Context Keyword Overlap**: `20%`
            """
        )

        st.markdown("---")
        st.info("ℹ️ Upload PDF resumes and enter a job description to calculate candidate fit scores.")

    # Main Layout: Two Columns for Inputs
    col_jd, col_files = st.columns([1, 1], gap="medium")

    with col_jd:
        st.subheader("1️⃣ Job Description")
        
        default_jd_text = ""
        if preset_choice and preset_choice != "-- Select Preset --":
            default_jd_text = SAMPLE_JOB_DESCRIPTIONS[preset_choice]

        job_description = st.text_area(
            "Enter or paste the target Job Description:",
            value=default_jd_text,
            height=280,
            placeholder="Paste job details, responsibilities, and key requirements here..."
        )

        if job_description.strip():
            jd_skills = extract_skills_from_text(job_description)
            st.caption(f"✓ Detected **{len(jd_skills)}** key skill requirements in Job Description.")

    with col_files:
        st.subheader("2️⃣ Upload Candidate Resumes")
        uploaded_files = st.file_uploader(
            "Upload PDF Resumes",
            type=["pdf"],
            accept_multiple_files=True,
            help="Select one or more PDF resumes to screen against the Job Description."
        )

        if uploaded_files:
            st.success(f"📁 **{len(uploaded_files)}** PDF resume(s) uploaded successfully.")

            # Check for duplicate filenames
            filenames = [f.name for f in uploaded_files]
            if len(filenames) != len(set(filenames)):
                st.warning("⚠️ Duplicate filenames detected in upload batch.")

    st.markdown("---")

    # Action Bar
    col_btn, col_info = st.columns([1, 3])
    with col_btn:
        analyze_clicked = st.button("🚀 Analyze & Rank Candidates", type="primary", use_container_width=True)

    # State Persistence for Results
    if analyze_clicked:
        st.session_state["has_run"] = True

    # Processing and Results Display
    if st.session_state.get("has_run", False):
        # Validation checks
        if not job_description.strip():
            st.error("❌ Please enter a Job Description before running analysis.")
            return

        if not uploaded_files:
            st.error("❌ Please upload at least one PDF resume to proceed.")
            return

        with st.spinner("🔍 Processing resumes, extracting skills, and calculating match scores..."):
            parsed_candidates = []
            errors = []

            for file in uploaded_files:
                file_bytes = file.read()
                file.seek(0)
                parsed = cached_process_pdf(file.name, file_bytes)

                if parsed["error"] and not parsed["text"]:
                    errors.append(f"**{file.name}**: {parsed['error']}")
                else:
                    parsed_candidates.append(parsed)
                    if parsed["is_scanned"]:
                        st.warning(f"⚠️ **{file.name}**: {parsed['error']}")

            if errors:
                for err in errors:
                    st.error(f"❌ {err}")

            if not parsed_candidates:
                st.error("No valid resumes could be processed. Please upload readable text PDFs.")
                return

            # Compute Candidate Rankings
            ranked_results = rank_all_candidates(job_description, parsed_candidates)

        # Render KPI Summary Metrics
        if ranked_results:
            scores = [r["final_score"] for r in ranked_results]
            avg_score = sum(scores) / len(scores) if scores else 0.0
            top_cand = ranked_results[0]["candidate_name"]
            top_score = ranked_results[0]["final_score"]

            st.header("📊 Candidate Ranking Results")
            render_kpi_metrics(
                uploaded_count=len(uploaded_files),
                analyzed_count=len(ranked_results),
                avg_score=avg_score,
                top_candidate=top_cand,
                top_score=top_score
            )

            st.markdown("<br>", unsafe_allow_html=True)

            # Filtering & Controls
            filter_col1, filter_col2 = st.columns([1, 1])
            with filter_col1:
                tier_filter = st.selectbox(
                    "Filter Candidates by Match Tier:",
                    ["All Candidates", "Top Candidates (≥80%)", "Strong Fit (≥65%)", "Moderate Fit (≥50%)", "Low Fit (<50%)"]
                )
            with filter_col2:
                sort_option = st.selectbox(
                    "Sort Candidates By:",
                    ["Score: High to Low", "Score: Low to High", "Candidate Name (A-Z)"]
                )

            # Filter Results
            filtered_results = list(ranked_results)
            if tier_filter == "Top Candidates (≥80%)":
                filtered_results = [r for r in filtered_results if r["final_score"] >= 80.0]
            elif tier_filter == "Strong Fit (≥65%)":
                filtered_results = [r for r in filtered_results if r["final_score"] >= 65.0]
            elif tier_filter == "Moderate Fit (≥50%)":
                filtered_results = [r for r in filtered_results if r["final_score"] >= 50.0]
            elif tier_filter == "Low Fit (<50%)":
                filtered_results = [r for r in filtered_results if r["final_score"] < 50.0]

            # Sort Results
            if sort_option == "Score: Low to High":
                filtered_results.sort(key=lambda x: x["final_score"])
            elif sort_option == "Candidate Name (A-Z)":
                filtered_results.sort(key=lambda x: x["candidate_name"])

            # Presentation Tabs
            tab_cards, tab_table, tab_charts = st.tabs(["📇 Candidate Cards", "📋 Ranking Table", "📈 Analytics & Charts"])

            # Tab 1: Detailed Cards View
            with tab_cards:
                if not filtered_results:
                    st.info("No candidates match the selected filter criteria.")
                else:
                    for cand in filtered_results:
                        rank = cand["rank"]
                        rank_class = f"rank-{rank}" if rank <= 3 else "rank-other"
                        
                        st.markdown(
                            f"""
                            <div class="candidate-card">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                    <div>
                                        <span class="rank-badge {rank_class}">Rank #{rank}</span>
                                        <span style="font-size: 1.3rem; font-weight: 700; margin-left: 0.8rem; color: #F8FAFC;">{cand['candidate_name']}</span>
                                        <span style="font-size: 0.85rem; color: #94A3B8; margin-left: 0.5rem;">({cand['filename']})</span>
                                    </div>
                                    <div style="text-align: right;">
                                        <span style="font-size: 1.6rem; font-weight: 800; color: {cand['badge_color']};">{cand['final_score']}%</span>
                                        <br>
                                        <span style="font-size: 0.85rem; font-weight: 600; color: {cand['badge_color']};">{cand['match_badge']}</span>
                                    </div>
                                </div>
                            </div>
                            """,
                            unsafe_allow_html=True
                        )

                        # Match Score Progress Bar
                        st.progress(cand["final_score"] / 100.0)

                        # Feedback Summary
                        st.markdown(f"💡 **AI Fit Summary:** {cand['feedback']}")

                        # Contact Info if Available
                        contact_items = []
                        if cand["email"]: contact_items.append(f"📧 {cand['email']}")
                        if cand["phone"]: contact_items.append(f"📞 {cand['phone']}")
                        if cand["linkedin"]: contact_items.append(f"🔗 {cand['linkedin']}")
                        if cand["github"]: contact_items.append(f"💻 {cand['github']}")
                        if contact_items:
                            st.caption(" | ".join(contact_items))

                        # Matched vs Missing Skills Badges
                        render_skill_badges(
                            cand["skill_analysis"]["matched_skills"],
                            cand["skill_analysis"]["missing_skills"]
                        )

                        # Expandable Technical Breakdown
                        with st.expander(f"🔍 Detailed Breakdown for {cand['candidate_name']}"):
                            c1, c2, c3 = st.columns(3)
                            with c1:
                                st.metric("Skill Coverage Score (40%)", f"{cand['skill_score']}%")
                            with c2:
                                st.metric("TF-IDF Similarity Score (40%)", f"{cand['tfidf_score']}%")
                            with c3:
                                st.metric("Keyword Overlap Score (20%)", f"{cand['keyword_score']}%")

                            st.markdown("---")
                            st.markdown(f"**Matched Skills ({cand['skill_analysis']['matched_count']}):**")
                            st.write(", ".join(cand["skill_analysis"]["matched_skills"]) if cand["skill_analysis"]["matched_skills"] else "None")

                            st.markdown(f"**Missing Required Skills ({cand['skill_analysis']['missing_count']}):**")
                            st.write(", ".join(cand["skill_analysis"]["missing_skills"]) if cand["skill_analysis"]["missing_skills"] else "None")

                            if cand["skill_analysis"]["extra_skills"]:
                                st.markdown(f"**Additional Candidate Skills ({len(cand['skill_analysis']['extra_skills'])}):**")
                                st.write(", ".join(cand["skill_analysis"]["extra_skills"]))

                        st.markdown("<br>", unsafe_allow_html=True)

            # Tab 2: Ranking Table View
            with tab_table:
                table_data = []
                for cand in filtered_results:
                    table_data.append({
                        "Rank": f"#{cand['rank']}",
                        "Candidate Name": cand["candidate_name"],
                        "Final Match Score (%)": cand["final_score"],
                        "Match Status": cand["match_tier"],
                        "Skill Match (%)": cand["skill_score"],
                        "TF-IDF Match (%)": cand["tfidf_score"],
                        "Matched Skills Count": cand["skill_analysis"]["matched_count"],
                        "Missing Skills Count": cand["skill_analysis"]["missing_count"],
                        "Filename": cand["filename"]
                    })
                
                df_results = pd.DataFrame(table_data)
                st.dataframe(df_results, use_container_width=True, hide_index=True)

                # Export to CSV
                csv_bytes = df_results.to_csv(index=False).encode('utf-8')
                st.download_button(
                    label="📥 Export Candidate Rankings (CSV)",
                    data=csv_bytes,
                    file_name="candidate_rankings_report.csv",
                    mime="text/csv",
                    type="secondary"
                )

            # Tab 3: Visual Analytics & Charts
            with tab_charts:
                st.subheader("📈 Candidate Score Comparison")
                chart_df = pd.DataFrame({
                    "Candidate": [c["candidate_name"] for c in filtered_results],
                    "Overall Match Score (%)": [c["final_score"] for c in filtered_results],
                    "Skill Match Score (%)": [c["skill_score"] for c in filtered_results],
                    "TF-IDF Match Score (%)": [c["tfidf_score"] for c in filtered_results]
                }).set_index("Candidate")

                st.bar_chart(chart_df, height=380)


if __name__ == "__main__":
    main()
