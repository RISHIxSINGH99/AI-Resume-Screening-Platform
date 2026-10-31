import streamlit as st
import pandas as pd


def apply_custom_css():
    """
    Injects modern HR Dashboard styling with glassmorphism, responsive grid,
    and polished typography.
    """
    css = """
    <style>
    /* Main Layout Styling */
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 3rem;
        max-width: 1250px;
    }
    
    /* Header Card */
    .header-card {
        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
        border-radius: 16px;
        padding: 2.2rem 2.5rem;
        color: #FFFFFF;
        margin-bottom: 2rem;
        box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .header-card h1 {
        color: #F8FAFC !important;
        font-weight: 700 !important;
        font-size: 2.2rem !important;
        margin-bottom: 0.5rem !important;
        letter-spacing: -0.02em;
    }
    .header-card p {
        color: #94A3B8 !important;
        font-size: 1.05rem !important;
        margin-bottom: 0 !important;
    }

    /* Metric Cards */
    .kpi-card {
        background: #1E293B;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.25rem;
        text-align: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.2);
    }
    .kpi-label {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94A3B8;
        margin-bottom: 0.3rem;
        font-weight: 600;
    }
    .kpi-value {
        font-size: 1.8rem;
        font-weight: 800;
        color: #F8FAFC;
    }
    .kpi-value.highlight {
        color: #38BDF8;
    }
    .kpi-sub {
        font-size: 0.8rem;
        color: #64748B;
        margin-top: 0.2rem;
    }

    /* Badge Pills */
    .badge-pill {
        display: inline-block;
        padding: 0.25rem 0.65rem;
        border-radius: 9999px;
        font-size: 0.78rem;
        font-weight: 600;
        margin-right: 0.4rem;
        margin-bottom: 0.4rem;
    }
    .badge-matched {
        background-color: rgba(16, 185, 129, 0.15);
        color: #10B981;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-missing {
        background-color: rgba(245, 158, 11, 0.15);
        color: #F59E0B;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .badge-extra {
        background-color: rgba(148, 163, 184, 0.15);
        color: #94A3B8;
        border: 1px solid rgba(148, 163, 184, 0.3);
    }

    /* Rank Badge */
    .rank-badge {
        font-size: 1.1rem;
        font-weight: 700;
        padding: 0.3rem 0.8rem;
        border-radius: 8px;
        color: #FFFFFF;
        display: inline-block;
    }
    .rank-1 { background: linear-gradient(135deg, #F59E0B, #D97706); }
    .rank-2 { background: linear-gradient(135deg, #94A3B8, #64748B); }
    .rank-3 { background: linear-gradient(135deg, #B45309, #78350F); }
    .rank-other { background: #334155; }

    /* Custom Buttons */
    div.stButton > button {
        border-radius: 8px !important;
        font-weight: 600 !important;
        transition: all 0.2s ease !important;
    }

    /* Card Box */
    .candidate-card {
        background-color: #1E293B;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1rem;
    }
    </style>
    """
    st.markdown(css, unsafe_allow_html=True)


def render_header():
    """Renders the top dashboard title banner."""
    st.markdown(
        """
        <div class="header-card">
            <h1>🎯 Talent Intelligence & Resume Screening System</h1>
            <p>Automated AI candidate evaluation, multi-factor skill matching, and instant resume ranking dashboard.</p>
        </div>
        """,
        unsafe_allow_html=True
    )


def render_kpi_metrics(uploaded_count: int, analyzed_count: int, avg_score: float, top_candidate: str, top_score: float):
    """
    Displays summary KPI metric cards at the top of the dashboard results.
    """
    c1, c2, c3, c4 = st.columns(4)

    with c1:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Uploaded Resumes</div>
                <div class="kpi-value">{uploaded_count}</div>
                <div class="kpi-sub">PDF files queued</div>
            </div>
            """,
            unsafe_allow_html=True
        )

    with c2:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Candidates Analyzed</div>
                <div class="kpi-value highlight">{analyzed_count}</div>
                <div class="kpi-sub">Processed successfully</div>
            </div>
            """,
            unsafe_allow_html=True
        )

    with c3:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Average Match Score</div>
                <div class="kpi-value">{avg_score:.1f}%</div>
                <div class="kpi-sub">Across processed pool</div>
            </div>
            """,
            unsafe_allow_html=True
        )

    with c4:
        top_name_display = top_candidate if top_candidate else "N/A"
        if len(top_name_display) > 16:
            top_name_display = top_name_display[:14] + "..."
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">Top Candidate</div>
                <div class="kpi-value highlight" style="font-size: 1.3rem;">{top_name_display}</div>
                <div class="kpi-sub">Score: {top_score:.1f}%</div>
            </div>
            """,
            unsafe_allow_html=True
        )


def render_skill_badges(matched_skills: list, missing_skills: list):
    """
    Renders styled badge pills for matched and missing skills.
    """
    html = '<div style="margin-top: 0.5rem; margin-bottom: 0.8rem;">'

    if matched_skills:
        for s in matched_skills:
            html += f'<span class="badge-pill badge-matched">✓ {s}</span>'

    if missing_skills:
        for s in missing_skills:
            html += f'<span class="badge-pill badge-missing">✗ {s}</span>'

    if not matched_skills and not missing_skills:
        html += '<span class="badge-pill badge-extra">No specific skills tagged</span>'

    html += '</div>'
    st.markdown(html, unsafe_allow_html=True)
