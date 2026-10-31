import React from 'react';
import { FileText, RotateCcw } from 'lucide-react';

const PRESETS = [
  {
    role: 'Senior Full-Stack Engineer',
    title: 'Full-Stack Engineer',
    text: `We are seeking an experienced Senior Full-Stack Developer to design and build scalable web applications.
Key Requirements:
- 4+ years of professional experience in Python, FastAPI, and Flask.
- Strong proficiency in modern JavaScript, TypeScript, React.js, and Tailwind CSS.
- Extensive experience designing RESTful APIs, microservices, and PostgreSQL database schemas.
- Familiarity with Docker, Kubernetes, CI/CD pipelines, and AWS cloud deployments.
- Solid understanding of Git version control, unit testing, agile methodologies, and clean code principles.`,
  },
  {
    role: 'Machine Learning Specialist',
    title: 'Machine Learning',
    text: `Looking for a Senior Machine Learning Engineer to design and deploy state-of-the-art predictive models and NLP applications.
Key Requirements:
- Strong programming background in Python, NumPy, Pandas, Scipy, and Scikit-Learn.
- Proven hands-on experience in Deep Learning with PyTorch, TensorFlow, and HuggingFace Transformers.
- Knowledge of NLP, Large Language Models (LLM), Generative AI, RAG pipelines, and Vector Databases.
- Experience with MLOps, Model Deployment, Docker, and AWS SageMaker.
- Solid background in feature engineering, model evaluation, and statistical analysis.`,
  },
  {
    role: 'Cloud & DevOps Architect',
    title: 'Cloud & DevOps',
    text: `Seeking a skilled DevOps & Cloud Engineer to manage our high-availability cloud infrastructure and CI/CD pipelines.
Key Requirements:
- Deep expertise with AWS or GCP cloud environments (EC2, S3, ECS, EKS, Lambda).
- Strong experience with containerization using Docker, Docker Compose, and Kubernetes orchestration.
- Infrastructure as Code (IaC) experience using Terraform and Ansible.
- Proficient in Python and Bash scripting for automation.
- Setup and optimization of CI/CD pipelines via GitHub Actions and GitLab CI.
- System monitoring experience with Prometheus, Grafana, and ELK stack.`,
  },
];

export default function JobDescription({
  jobTitle,
  onJobTitleChange,
  value,
  onChange,
  disabled,
}) {
  const charCount = value ? value.length : 0;
  const wordCount = value && value.trim() ? value.trim().split(/\s+/).length : 0;

  const handleSelectPreset = (preset) => {
    if (onJobTitleChange) {
      onJobTitleChange(preset.role);
    }
    onChange(preset.text);
  };

  const handleClear = () => {
    onChange('');
    if (onJobTitleChange) {
      onJobTitleChange('');
    }
  };

  return (
    <div className="flex h-full flex-col border border-slate-800 bg-slate-900/50 p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-blue-400" />
            <h2 className="text-sm font-semibold tracking-tight text-slate-100">
              Job Requirements
            </h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Describe the role, required skills, experience, and qualifications.
          </p>
        </div>

        {value && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 border border-slate-700 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Target Role Title */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Role Title <span className="text-slate-500 font-normal">(Optional reference)</span>
        </label>
        <input
          type="text"
          value={jobTitle || ''}
          onChange={(e) => onJobTitleChange && onJobTitleChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g. Senior Full-Stack Engineer"
          className="w-full border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Role Presets */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-medium text-slate-500">Sample roles:</span>
        {PRESETS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => handleSelectPreset(preset)}
            className="border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Job Description Textarea */}
      <div className="flex min-h-[220px] flex-1 flex-col">
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Job Description & Qualifications <span className="text-rose-400">*</span>
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Paste the complete job description, technical requirements, required tools, and responsibilities..."
          className="min-h-[220px] w-full flex-1 resize-none border border-slate-700 bg-slate-950 p-3 text-xs leading-6 text-slate-200 placeholder:text-slate-600 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Footer Metrics */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3 text-[11px] text-slate-500">
        <div className="flex gap-3">
          <span>{charCount} characters</span>
          <span>•</span>
          <span>{wordCount} words</span>
        </div>
        {!value.trim() && (
          <span className="text-amber-500/90 font-medium">Job description required</span>
        )}
      </div>
    </div>
  );
}
