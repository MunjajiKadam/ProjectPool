import { useEffect, useState } from 'react'
import { Check, Flag, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { projectBrief } from '@/lib/projectBrief'

function readLocalProgress(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') }
  catch { return [] }
}

export function ProjectProgressChecklist({ project, user }) {
  const projectId = project.id || project._id
  const milestones = projectBrief(project).milestones
  const storageKey = `projectpool-progress-${projectId}`
  const [savedProgress, setSavedProgress] = useState(() => ({ projectId, completed: readLocalProgress(storageKey) }))
  const completed = savedProgress.projectId === projectId ? savedProgress.completed : readLocalProgress(storageKey)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return undefined
    let active = true
    api(`/projects/${encodeURIComponent(projectId)}/progress`).then((result) => {
      if (active) setSavedProgress({ projectId, completed: result.completedMilestones || [] })
    }).catch(() => {})
    return () => { active = false }
  }, [projectId, storageKey, user])

  async function toggleMilestone(index) {
    const next = completed.includes(index) ? completed.filter((item) => item !== index) : [...completed, index].sort((first, second) => first - second)
    setSavedProgress({ projectId, completed: next })
    setMessage('')
    if (!user) { localStorage.setItem(storageKey, JSON.stringify(next)); return }
    setSaving(true)
    try {
      await api(`/projects/${encodeURIComponent(projectId)}/progress`, { method: 'PUT', body: { completedMilestones: next } })
    } catch (error) {
      setMessage(error.message)
      setSavedProgress({ projectId, completed })
    } finally { setSaving(false) }
  }

  return <section className="detail-section project-progress" aria-labelledby="project-progress-title">
    <div className="project-progress-heading"><div><span className="section-kicker">YOUR PLAN</span><h3 id="project-progress-title">Project progress</h3></div><span>{completed.length}/{milestones.length} complete</span></div>
    <ol>{milestones.map((milestone, index) => <li key={`${projectId}-${milestone}`}><label><input type="checkbox" checked={completed.includes(index)} disabled={saving} onChange={() => toggleMilestone(index)} /><span className="project-progress-check"><Check size={13} /></span><span className={completed.includes(index) ? 'is-complete' : ''}>{milestone}</span></label></li>)}</ol>
    <p>{user ? 'Progress is saved to your account.' : 'Progress is saved in this browser.'}</p>
    {message && <p className="project-progress-error" role="alert">{message}</p>}
  </section>
}

export function ProjectCorrectionForm({ project }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)

  async function submitCorrection(event) {
    event.preventDefault()
    setBusy(true)
    setFeedback('')
    try {
      const result = await api(`/projects/${encodeURIComponent(project.id || project._id)}/corrections`, { method: 'POST', body: { message, email } })
      setFeedback(result.message)
      setMessage('')
      setEmail('')
      setOpen(false)
    } catch (error) { setFeedback(error.message) }
    finally { setBusy(false) }
  }

  return <section className="project-correction">
    <div><Flag size={15} /><span>See something outdated or incorrect?</span></div>
    {!open ? <Button variant="ghost" onClick={() => { setFeedback(''); setOpen(true) }}>Suggest a correction</Button> : <form onSubmit={submitCorrection}>
      <label htmlFor="correction-message">What should we update?</label>
      <textarea id="correction-message" value={message} onChange={(event) => setMessage(event.target.value)} minLength="12" maxLength="1000" rows="3" placeholder="Describe the information that needs a correction." required />
      <label htmlFor="correction-email">Email for follow-up <span>Optional</span></label>
      <input id="correction-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength="254" autoComplete="email" placeholder="you@example.com" />
      <div><Button type="submit" disabled={busy || message.trim().length < 12}>{busy && <LoaderCircle className="spin-icon" size={15} />}Send correction</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
    </form>}
    {feedback && <p role="status">{feedback}</p>}
  </section>
}
