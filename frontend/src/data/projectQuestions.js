import { projectBrief } from '../lib/projectBrief.js'

export const projectQuestionAnswers = [
  {
    question: 'What will I build?',
    keywords: ['build', 'make', 'create', 'scope', 'overview', 'idea'],
    answer: (project) => project.overview || project.description,
  },
  {
    question: 'What skills will I practice?',
    keywords: ['skill', 'learn', 'practice', 'learning', 'experience'],
    answer: (project, brief) => `You can practice ${brief.skills.join(', ') || 'the tools listed in this brief'}. ${brief.learningOutcomes.join(' ')}`,
  },
  {
    question: 'What tools should I use?',
    keywords: ['tool', 'technology', 'technologies', 'framework', 'language', 'stack'],
    answer: (project) => project.technology?.length ? `Suggested tools: ${project.technology.join(', ')}.` : 'This brief does not list specific tools yet. Choose tools that fit the project scope.',
  },
  {
    question: 'How long will it take?',
    keywords: ['long', 'time', 'timeline', 'duration', 'weeks', 'schedule'],
    answer: (project, brief) => `The suggested timeline is ${project.duration}. ${brief.milestones.length ? `Break the work into milestones: ${brief.milestones.join('; ')}.` : ''}`,
  },
  {
    question: 'How difficult is it?',
    keywords: ['difficult', 'difficulty', 'hard', 'easy', 'beginner', 'intermediate', 'advanced', 'level'],
    answer: (project, brief) => `This project is marked ${project.difficulty}. To get started, ${brief.prerequisites.join(' and ').toLowerCase()}.`,
  },
  {
    question: 'What do I need to get started?',
    keywords: ['start', 'begin', 'first step', 'prerequisite', 'requirement', 'need'],
    answer: (project, brief) => `Start with: ${brief.prerequisites.join('; ')}. A useful first milestone is: ${brief.milestones[0] || 'define a small first version.'}`,
  },
  {
    question: 'What might it cost?',
    keywords: ['cost', 'price', 'budget', 'expensive', 'free', 'hardware'],
    answer: (_project, brief) => `Estimated cost: ${brief.estimatedCost}. Treat this as a planning estimate and check current prices for any hardware or services.`,
  },
  {
    question: 'What should I deliver?',
    keywords: ['deliver', 'deliverable', 'finish', 'result', 'final', 'complete'],
    answer: (project) => project.deliverables?.length ? `Suggested deliverables: ${project.deliverables.join('; ')}.` : 'The brief does not list deliverables yet. Define a small working prototype and a short demo.',
  },
  {
    question: 'Why does this project matter?',
    keywords: ['impact', 'why', 'benefit', 'problem', 'matter', 'useful'],
    answer: (project, brief) => brief.impact || project.description,
  },
]

export function answerProjectQuestion(project, question) {
  const normalizedQuestion = String(question || '').trim().toLowerCase()
  const matches = projectQuestionAnswers.map((item) => ({
    item,
    score: item.keywords.reduce((score, keyword) => score + (normalizedQuestion.includes(keyword) ? 1 : 0), 0),
  })).sort((first, second) => second.score - first.score)
  const match = matches[0]

  if (!match?.score) {
    return {
      question: 'What can I help with?',
      answer: 'Try asking about what you will build, skills, tools, timeline, difficulty, getting started, cost, deliverables, or project impact.',
    }
  }

  return {
    question: match.item.question,
    answer: match.item.answer(project, projectBrief(project)),
  }
}
