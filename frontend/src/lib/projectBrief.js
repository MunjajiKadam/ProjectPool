export function projectBrief(project) {
  const technology = project.technology || []
  const skills = project.skills?.length ? project.skills : technology.slice(0, 4)
  const advanced = project.difficulty === 'Advanced'
  const beginner = project.difficulty === 'Beginner'

  return {
    teamSize: project.teamSize || (beginner ? '1–2 students' : advanced ? '2–4 students' : '2–3 students'),
    estimatedCost: project.estimatedCost || (project.category === 'IoT & hardware' ? '$25–$80 for optional hardware' : 'Free with open-source tools'),
    impact: project.impact || `A practical ${project.category} concept designed around a real student or campus need.`,
    prerequisites: project.prerequisites?.length ? project.prerequisites : [
      beginner ? 'No specialist experience required' : advanced ? 'Comfort with APIs, data structures, or prototyping' : 'Familiarity with one listed language or framework',
      'A laptop and access to the suggested tools',
    ],
    learningOutcomes: project.learningOutcomes?.length ? project.learningOutcomes : [
      `Plan and build a focused prototype for ${project.category}`,
      `Apply ${technology.slice(0, 2).join(' and ') || 'appropriate tools'} to a student-centered problem`,
      'Test a core workflow and present design tradeoffs',
    ],
    milestones: project.milestones?.length ? project.milestones : [
      'Define the target user and a small first release',
      'Design the data model and primary user flow',
      'Build the core experience and add realistic sample data',
      'Test, refine, and prepare the final walkthrough',
    ],
    skills,
  }
}