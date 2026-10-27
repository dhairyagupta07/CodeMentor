import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/db.js'
import Problem from '../models/Problem.js'
import { problems } from '../data/problems.js'
import { additionalProblems } from '../data/additionalProblems.js'

const allProblems = [...problems, ...additionalProblems]

try {
  await connectDatabase()
  await Problem.bulkWrite(allProblems.map((problem) => ({
    updateOne: {
      filter: { slug: problem.slug },
      update: { $set: problem },
      upsert: true,
    },
  })))
  console.log(`Seeded ${allProblems.length} CodeMentor problems`)
} catch (error) {
  console.error('Failed to seed problems:', error)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
