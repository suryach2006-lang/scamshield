import React from 'react';
import { Search, Building2, Briefcase, Link2, MapPin, DollarSign, FileText, Send, Sparkles, RotateCcw } from 'lucide-react';

const PRESETS = {
  scam: {
    companyName: 'Apex Data Solutions',
    jobTitle: 'Home Based Data Entry Operator',
    location: 'Remote',
    salary: '₹6,000 / day',
    jobUrl: '',
    jobDescription:
      'Immediate joining without any interview! Simple copy paste and typing work from home. Earn ₹6,000 to ₹8,000 daily with only 1-2 hours work guaranteed daily payout. Candidate must pay a refundable registration fee of ₹1,500 for the typing software kit before starting.',
    recruiterContact: 'Contact HR via Telegram @apex_data_hire or apexwork@gmail.com'
  },
  legitimate: {
    companyName: 'Tata Consultancy Services',
    jobTitle: 'Senior Cloud Solutions Architect',
    location: 'Bangalore, India',
    salary: '₹28,00,000 - ₹40,00,000 per annum',
    jobUrl: 'https://www.tcs.com/careers',
    jobDescription:
      'We are looking for a Senior Cloud Solutions Architect to join our enterprise cloud practice. The candidate will design scalable cloud platforms using AWS and Azure, containerized microservices, and Terraform. Requires at least 5 years of relevant cloud architecture experience.',
    recruiterContact: 'careers@tcs.com'
  },
  impersonation: {
    companyName: 'Wipro',
    jobTitle: 'Part-Time Media Rating Specialist',
    location: 'Hyderabad, India',
    salary: '₹4,000 / day',
    jobUrl: 'https://wipro-careers-portal.xyz/apply',
    jobDescription:
      'Direct selection guaranteed! Complete daily task orders by liking YouTube videos and rating Google maps for commission. Selected candidates must top-up wallet balance to unlock tasks and earn high commission upon depositing.',
    recruiterContact: 'wipro-recruitment-team@gmail.com'
  }
};

export default function JobForm({ formData, setFormData, onSubmit, isLoading }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyPreset = (key) => {
    if (PRESETS[key]) {
      setFormData(PRESETS[key]);
    }
  };

  const handleReset = () => {
    setFormData({
      companyName: '',
      jobTitle: '',
      jobUrl: '',
      jobDescription: '',
      salary: '',
      location: '',
      recruiterContact: ''
    });
  };

  return (
    <div className="form-card">
      <div className="form-header">
        <div className="form-title-wrap">
          <h2>Job Listing Inspection</h2>
          <p>Submit job details to identify warning indicators and verify web evidence.</p>
        </div>

        <div className="preset-pills">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quick Demos:</span>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleApplyPreset('scam')}
            disabled={isLoading}
            title="Load sample advance-fee scam"
          >
            <Sparkles size={13} /> Fee Scam
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleApplyPreset('impersonation')}
            disabled={isLoading}
            title="Load brand impersonation task scam"
          >
            <Sparkles size={13} /> Spoof Scam
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleApplyPreset('legitimate')}
            disabled={isLoading}
            title="Load authentic enterprise posting"
          >
            <Sparkles size={13} /> Legit Job
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={isLoading}
            title="Clear all fields"
          >
            <RotateCcw size={13} /> Clear
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="companyName">
              <Building2 size={16} /> Company Name
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              placeholder="e.g. Tata Consultancy Services, Acme Corp"
              value={formData.companyName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="jobTitle">
              <Briefcase size={16} /> Job Title
            </label>
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              placeholder="e.g. Data Entry Specialist, Software Engineer"
              value={formData.jobTitle}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="jobUrl">
              <Link2 size={16} /> Job Application URL
            </label>
            <input
              id="jobUrl"
              name="jobUrl"
              type="text"
              placeholder="https://company.com/careers/job123"
              value={formData.jobUrl}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">
              <MapPin size={16} /> Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="e.g. Bangalore, India or Remote"
              value={formData.location}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="salary">
              <DollarSign size={16} /> Stated Salary / Compensation
            </label>
            <input
              id="salary"
              name="salary"
              type="text"
              placeholder="e.g. ₹50,000 / month or ₹5,000 / day"
              value={formData.salary}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="recruiterContact">
              <Send size={16} /> Recruiter / Contact Info
            </label>
            <input
              id="recruiterContact"
              name="recruiterContact"
              type="text"
              placeholder="e.g. hr@company.com or Telegram @recruiter"
              value={formData.recruiterContact}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="jobDescription">
              <FileText size={16} /> Job Description & Requirements
            </label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              rows={4}
              placeholder="Paste the full job description, task expectations, fees, or communication instructions here..."
              value={formData.jobDescription}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              <Search size={18} />
              {isLoading ? 'Analyzing Listing...' : 'Analyze Job'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
