import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    problemTitle: { type: String, required: true },
    problemSlug: { type: String, required: true },
    language: { type: String, enum: ['python', 'java', 'cpp'], required: true },
    sourceCode: { type: String, required: true },
    verdict: {
      type: String,
      enum: ['Accepted', 'Wrong Answer', 'Compilation Error', 'Runtime Error', 'Time Limit Exceeded', 'Internal Error'],
      required: true,
    },
    passedTests: { type: Number, required: true },
    totalTests: { type: Number, required: true },
    failedTest: { type: Number, default: null },
    diagnostic: { type: String, default: '' },
    executionTime: { type: Number, default: 0 },
    reflection: {
      approach: { type: String, maxlength: 2000, default: '' },
      complexity: { type: String, maxlength: 120, default: '' },
      alternative: { type: String, maxlength: 2000, default: '' },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
)

submissionSchema.index({ user: 1, verdict: 1, createdAt: -1 })

export default mongoose.model('Submission', submissionSchema)
