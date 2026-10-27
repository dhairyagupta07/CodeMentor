import mongoose from 'mongoose'

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false },
)

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    topics: [{ type: String }],
    acceptance: { type: Number, default: 0 },
    description: { type: String, required: true },
    hints: [{ type: String }],
    examples: [{ input: String, output: String, explanation: String }],
    constraints: [{ type: String }],
    starterCode: {
      python: { type: String, default: '' },
      java: { type: String, default: '' },
      cpp: { type: String, default: '' },
    },
    testCases: { type: [testCaseSchema], required: true, select: false },
  },
  { timestamps: true },
)

export default mongoose.model('Problem', problemSchema)
