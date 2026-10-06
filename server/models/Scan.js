const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema(
  {
    input: {
      companyName: {
        type: String,
        trim: true,
        default: ''
      },
      jobTitle: {
        type: String,
        trim: true,
        default: ''
      },
      jobUrl: {
        type: String,
        trim: true,
        default: ''
      },
      jobDescription: {
        type: String,
        default: ''
      },
      salary: {
        type: String,
        trim: true,
        default: ''
      },
      location: {
        type: String,
        trim: true,
        default: ''
      },
      recruiterContact: {
        type: String,
        trim: true,
        default: ''
      }
    },
    results: {
      summary: {
        assessment: {
          type: String,
          required: [true, 'Assessment is required in analysis summary'],
          enum: ['HIGH_RISK', 'ELEVATED_RISK', 'MODERATE_RISK', 'LOW_RISK', 'INSUFFICIENT_DATA']
        },
        headline: {
          type: String,
          default: ''
        },
        indicatorCounts: {
          critical: { type: Number, default: 0 },
          high: { type: Number, default: 0 },
          medium: { type: Number, default: 0 },
          low: { type: Number, default: 0 },
          total: { type: Number, default: 0 }
        },
        disclaimer: {
          type: String,
          default: ''
        },
        recommendations: [{ type: String }]
      },
      riskIndicators: [
        {
          id: { type: String },
          type: { type: String },
          severity: { type: String },
          title: { type: String },
          explanation: { type: String },
          evidence: { type: mongoose.Schema.Types.Mixed }
        }
      ],
      webEvidence: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      jobEvidence: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      newsEvidence: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      verificationSignals: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      metadata: {
        analyzedAt: { type: String },
        executionDurationMs: { type: Number },
        serpApiRequestsMade: { type: Number },
        rulesEvaluatedCount: { type: Number }
      }
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

// Index for chronological querying of recent scans
scanSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Scan', scanSchema);
