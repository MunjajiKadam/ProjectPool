import { useId, useState } from 'react'
import { ArrowUpRight, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { answerProjectQuestion, projectQuestionAnswers } from '@/data/projectQuestions'

export function ProjectQuestionPanel({ project }) {
  const inputId = useId()
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState(null)

  function askQuestion(value = question) {
    const asked = value.trim()
    if (!asked) return
    setResult({ asked, ...answerProjectQuestion(project, asked) })
    setQuestion('')
  }

  function submitQuestion(event) {
    event.preventDefault()
    askQuestion()
  }

  return <section className="project-question-panel" aria-labelledby="project-question-title">
    <div className="project-question-heading">
      <span className="project-question-icon"><MessageCircleQuestion size={17} /></span>
      <div><span className="section-kicker">PROJECT GUIDE</span><h3 id="project-question-title">Questions about this idea?</h3><p>Quick answers drawn from this project brief.</p></div>
      <Sparkles className="project-question-sparkle" size={17} aria-hidden="true" />
    </div>
    <form className="project-question-form" onSubmit={submitQuestion}>
      <label className="sr-only" htmlFor={inputId}>Ask a question about {project.title}</label>
      <input id={inputId} value={question} onChange={(event) => setQuestion(event.target.value)} maxLength="300" placeholder="e.g. What tools should I use?" />
      <Button type="submit" disabled={!question.trim()}><span>Ask</span><ArrowUpRight size={15} /></Button>
    </form>
    <div className="project-question-suggestions" role="group" aria-label="Suggested questions">
      {projectQuestionAnswers.slice(0, 5).map((item) => <button type="button" key={item.question} onClick={() => askQuestion(item.question)}>{item.question}</button>)}
    </div>
    {result && <div className="project-question-answer" aria-live="polite"><span>You asked: {result.asked}</span><strong>{result.question}</strong><p>{result.answer}</p></div>}
  </section>
}
