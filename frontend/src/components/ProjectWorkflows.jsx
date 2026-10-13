import { useEffect, useState } from 'react'
import { ArrowLeft, Check, LoaderCircle, ShieldCheck, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useDialogFocus } from '@/hooks/useDialogFocus'

function DialogFrame({ title, children, onClose, wide = false, asPage = false }) {
  const dialogRef = useDialogFocus(onClose, !asPage)

  return (
    <div className={asPage ? 'workflow-page-shell' : 'workflow-backdrop'} onMouseDown={(event) => !asPage && event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} tabIndex="-1" className={`workflow-dialog ${asPage ? 'workflow-page' : ''} ${wide ? 'workflow-dialog-wide' : ''}`} role={asPage ? 'region' : 'dialog'} aria-modal={asPage ? undefined : true} aria-labelledby="workflow-title">
        <header className="workflow-header"><div><span className="workflow-kicker">PROJECTPOOL</span><h2 id="workflow-title">{title}</h2></div>{asPage ? <Button variant="ghost" className="workflow-back" onClick={onClose}><ArrowLeft size={15} /> Back</Button> : <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X size={18} /></Button>}</header>
        {children}
      </section>
    </div>
  )
}

export function AuthDialog({ onClose, onAuthenticated, onModeChange, initialMode = 'login', asPage = false }) {
  const [mode, setMode] = useState(initialMode)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = Object.fromEntries(form.entries())
    setBusy(true)
    setMessage('')
    try {
      const result = await api(`/auth/${mode === 'login' ? 'login' : 'register'}`, { method: 'POST', body })
      onAuthenticated(result.user)
      onClose()
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  return <DialogFrame title={mode === 'login' ? 'Welcome back' : 'Create your account'} onClose={onClose} asPage={asPage}>
    <form className="workflow-form" onSubmit={submit}>
      {mode === 'register' && <label>Your name<input name="name" autoComplete="name" minLength="2" maxLength="80" required /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" maxLength="254" required /></label>
      <label>Password<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="12" maxLength="128" required /><small>Use at least 12 characters.</small></label>
      {message && <p className="workflow-error" role="alert">{message}</p>}
      <Button type="submit" disabled={busy}>{busy && <LoaderCircle className="spin-icon" size={16} />}{mode === 'login' ? 'Sign in' : 'Create account'}</Button>
      <button className="workflow-text-button" type="button" onClick={() => { const nextMode = mode === 'login' ? 'register' : 'login'; setMode(nextMode); setMessage(''); onModeChange?.(nextMode) }}>{mode === 'login' ? 'New to ProjectPool? Create an account' : 'Already have an account? Sign in'}</button>
    </form>
  </DialogFrame>
}

const projectListFields = ['features', 'technology', 'deliverables', 'prerequisites', 'learningOutcomes', 'milestones', 'skills', 'tags']
const blankProject = { title: '', category: 'Web development', difficulty: 'Beginner', duration: '', teamSize: '', estimatedCost: '', description: '', overview: '', impact: '', features: '', technology: '', deliverables: '', prerequisites: '', learningOutcomes: '', milestones: '', skills: '', tags: '', image: '', imageAlt: '' }

export function ProjectSubmissionDialog({ onClose, onSubmitted, admin = false, project = null, asPage = false }) {
  const initial = project ? { ...project, ...Object.fromEntries(projectListFields.map((field) => [field, (project[field] || []).join(', ')])) } : blankProject
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const editing = Boolean(project)

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = Object.fromEntries(form.entries())
    for (const field of projectListFields) body[field] = String(body[field] || '').split(',').map((item) => item.trim()).filter(Boolean)
    setBusy(true)
    setMessage('')
    try {
      const path = editing ? `/projects/${project.id || project._id}${admin ? '/admin' : ''}` : admin ? '/projects/admin' : '/projects'
      await api(path, { method: editing ? 'PATCH' : 'POST', body })
      onSubmitted(editing ? 'Project changes saved.' : admin ? 'Project published to the catalog.' : 'Project sent for review.')
      onClose()
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  return <DialogFrame title={editing ? 'Edit project' : admin ? 'Add catalog idea' : 'Submit a project idea'} onClose={onClose} wide asPage={asPage}>
    <form className="workflow-form project-form" onSubmit={submit}>
      <label>Project title<input name="title" defaultValue={initial.title} maxLength="120" required /></label>
      <div className="workflow-form-row"><label>Field<select name="category" defaultValue={initial.category} required><option>Web development</option><option>AI &amp; machine learning</option><option>Mobile apps</option><option>IoT &amp; hardware</option><option>Data &amp; visualization</option><option>Cybersecurity</option></select></label><label>Difficulty<select name="difficulty" defaultValue={initial.difficulty} required><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Timeline<input name="duration" defaultValue={initial.duration} maxLength="60" placeholder="3-4 weeks" required /></label></div>
      <div className="workflow-form-row"><label>Team size<input name="teamSize" defaultValue={initial.teamSize} maxLength="100" placeholder="2-3 students" /></label><label>Estimated cost<input name="estimatedCost" defaultValue={initial.estimatedCost} maxLength="100" placeholder="Free with open-source tools" /></label></div>
      <label>Short description<textarea name="description" defaultValue={initial.description} minLength="20" maxLength="300" rows="2" required /></label>
      <label>Project overview<textarea name="overview" defaultValue={initial.overview} minLength="20" maxLength="2000" rows="4" required /></label>
      <label>Why it matters<textarea name="impact" defaultValue={initial.impact} maxLength="300" rows="2" placeholder="Who benefits and what changes?" /></label>
      <div className="workflow-form-row"><label>Features, comma separated<input name="features" defaultValue={initial.features} /></label><label>Tools and technology, comma separated<input name="technology" defaultValue={initial.technology} /></label></div>
      <div className="workflow-form-row"><label>Deliverables, comma separated<input name="deliverables" defaultValue={initial.deliverables} /></label><label>Skills and tags, comma separated<input name="skills" defaultValue={initial.skills} /></label></div>
      <label>Prerequisites, comma separated<input name="prerequisites" defaultValue={initial.prerequisites} /></label>
      <label>Learning outcomes, comma separated<input name="learningOutcomes" defaultValue={initial.learningOutcomes} /></label>
      <label>Project milestones, comma separated<input name="milestones" defaultValue={initial.milestones} /></label>
      <div className="workflow-form-row"><label>Tags, comma separated<input name="tags" defaultValue={initial.tags} /></label><label>Image URL (HTTPS)<input name="image" type="url" defaultValue={initial.image} /></label></div>
      <label>Image description<input name="imageAlt" defaultValue={initial.imageAlt} maxLength="300" /></label>
      {message && <p className="workflow-error" role="alert">{message}</p>}
      <Button type="submit" disabled={busy}>{busy && <LoaderCircle className="spin-icon" size={16} />}{editing ? 'Save changes' : admin ? 'Publish to catalog' : 'Send for review'}</Button>
    </form>
  </DialogFrame>
}

export function ManagementDialog({ mode, onClose, onChanged, onEdit, asPage = false }) {
  const [projects, setProjects] = useState([])
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const title = mode === 'moderation' ? 'Review submissions' : mode === 'admin' ? 'Catalog management' : 'Your submissions'
  const endpoint = mode === 'moderation' ? '/projects/moderation' : mode === 'admin' ? '/projects/admin/all' : '/projects/mine'

  async function load() {
    try { setProjects(await api(endpoint)) }
    catch (error) { setMessage(error.message) }
  }
  useEffect(() => {
    let active = true
    api(endpoint).then((result) => { if (active) setProjects(result) }).catch((error) => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [endpoint])

  useEffect(() => {
    if (mode === 'admin') api('/projects/analytics').then(setAnalytics).catch(() => {})
  }, [mode])

  async function bulkReview(decision) {
    setBusyId('bulk')
    setMessage('')
    try {
      const result = await api('/projects/moderation/bulk', { method: 'PATCH', body: { ids: selectedIds, decision } })
      setSelectedIds([])
      await load()
      onChanged(`${result.updated} submission${result.updated === 1 ? '' : 's'} ${decision}.`)
    } catch (error) { setMessage(error.message) }
    finally { setBusyId('') }
  }

  async function act(project, action) {
    const id = project.id || project._id
    setBusyId(id)
    setMessage('')
    try {
      if (action === 'approve' || action === 'reject') await api(`/projects/${id}/review`, { method: 'PATCH', body: { decision: action === 'approve' ? 'approved' : 'rejected' } })
      else if (action === 'archive') await api(`/projects/${id}/admin`, { method: 'PATCH', body: { status: 'archived' } })
      else await api(`/projects/${id}`, { method: 'DELETE' })
      await load()
      onChanged(action === 'approve' ? 'Project approved.' : action === 'reject' ? 'Project sent back for changes.' : action === 'archive' ? 'Project archived.' : 'Project deleted.')
    } catch (error) { setMessage(error.message) }
    finally { setBusyId('') }
  }

  return <DialogFrame title={title} onClose={onClose} wide asPage={asPage}>
    <div className="management-list">
      {message && <p className="workflow-error" role="alert">{message}</p>}
      {mode === 'moderation' && projects.length > 0 && <div className="bulk-review-toolbar"><label><input type="checkbox" checked={selectedIds.length === projects.length} onChange={(event) => setSelectedIds(event.target.checked ? projects.map((project) => project.id || project._id) : [])} /> Select all <span>{selectedIds.length} selected</span></label><div><Button variant="outline" disabled={!selectedIds.length || busyId === 'bulk'} onClick={() => bulkReview('approved')}><Check size={14} /> Approve selected</Button><Button variant="outline" disabled={!selectedIds.length || busyId === 'bulk'} onClick={() => bulkReview('rejected')}>Reject selected</Button></div></div>}
      {!projects.length && !message && <p className="management-empty">Nothing to review yet.</p>}
      {projects.map((project) => <article className="management-row" key={project._id || project.id}>
        <div className="management-copy">{mode === 'moderation' && <label className="review-select"><input type="checkbox" checked={selectedIds.includes(project.id || project._id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, project.id || project._id] : current.filter((id) => id !== (project.id || project._id)))} aria-label={`Select ${project.title}`} /></label>}<div className="management-row-title"><h3>{project.title}</h3><span className={`status-label status-${project.status}`}>{project.status}</span></div><p>{project.description}</p><small>{project.category} · {project.difficulty}{project.createdBy?.name ? ` · submitted by ${project.createdBy.name}` : ''}</small>{project.reviewNote && <p className="management-note">Review note: {project.reviewNote}</p>}</div>
        <div className="management-actions">
          {mode === 'moderation' && <><Button variant="outline" size="icon" title="Approve" aria-label={`Approve ${project.title}`} disabled={busyId === (project.id || project._id)} onClick={() => act(project, 'approve')}><Check size={16} /></Button><Button variant="outline" onClick={() => act(project, 'reject')} disabled={busyId === (project.id || project._id)}>Reject</Button></>}
          {mode === 'admin' && project.status === 'pending' && <><Button variant="outline" size="icon" title="Approve" aria-label={`Approve ${project.title}`} disabled={busyId === (project.id || project._id)} onClick={() => act(project, 'approve')}><Check size={16} /></Button><Button variant="outline" onClick={() => act(project, 'reject')} disabled={busyId === (project.id || project._id)}>Reject</Button></>}
          {mode === 'mine' && <><Button variant="outline" onClick={() => onEdit(project, false)}>Edit</Button><Button variant="ghost" size="icon" title="Delete submission" aria-label={`Delete ${project.title}`} onClick={() => act(project, 'delete')}><Trash2 size={16} /></Button></>}
          {mode === 'admin' && <><Button variant="outline" onClick={() => onEdit(project, true)}>Edit</Button>{project.status !== 'archived' && <Button variant="outline" onClick={() => act(project, 'archive')}>Archive</Button>}<Button variant="ghost" size="icon" title="Delete project" aria-label={`Delete ${project.title}`} onClick={() => act(project, 'delete')}><Trash2 size={16} /></Button></>}
          {busyId === (project.id || project._id) && <LoaderCircle className="spin-icon" size={16} />}
        </div>
      </article>)}
    </div>
    {mode === 'admin' && <>{analytics && <div className="submission-analytics"><div className="submission-analytics-heading"><span>SUBMISSION HEALTH</span><strong>{analytics.submissions.pending + analytics.submissions.approved + analytics.submissions.rejected} total</strong></div><div className="submission-ratio"><i className="ratio-approved" style={{ flex: Math.max(analytics.submissions.approved, 0.1) }} /><i className="ratio-pending" style={{ flex: Math.max(analytics.submissions.pending, 0.1) }} /><i className="ratio-rejected" style={{ flex: Math.max(analytics.submissions.rejected, 0.1) }} /></div><div className="submission-ratio-labels"><span>Approved {analytics.submissions.approved}</span><span>Pending {analytics.submissions.pending}</span><span>Rejected {analytics.submissions.rejected}</span></div></div>}<div className="management-footer"><span><ShieldCheck size={15} /> Catalog administrator</span><Button onClick={() => onEdit(null, true)}>Add project idea</Button></div></>}
  </DialogFrame>
}

export function AccountDialog({ user, onClose, onUpdated, onDeleted, asPage = false }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function updateName(event) {
    event.preventDefault()
    setBusy(true)
    try { const result = await api('/users/me', { method: 'PATCH', body: { name: new FormData(event.currentTarget).get('name') } }); onUpdated(result.user); setMessage('Name updated.') }
    catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  async function changePassword(event) {
    event.preventDefault()
    setBusy(true)
    try { await api('/users/me/password', { method: 'PATCH', body: Object.fromEntries(new FormData(event.currentTarget).entries()) }); onDeleted(); onClose() }
    catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  async function deleteAccount(event) {
    event.preventDefault()
    if (!window.confirm('Permanently delete your account and submitted project ideas?')) return
    setBusy(true)
    try { await api('/users/me', { method: 'DELETE', body: { password: new FormData(event.currentTarget).get('password') } }); onDeleted(); onClose() }
    catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  return <DialogFrame title="Account settings" onClose={onClose} asPage={asPage}>
    <div className="workflow-form">
      <p className="account-email">{user.email} · {user.role}</p>
      <form onSubmit={updateName}><label>Display name<input name="name" defaultValue={user.name} minLength="2" maxLength="80" required /></label><Button type="submit" disabled={busy}>Update name</Button></form>
      <form onSubmit={changePassword}><h3>Change password</h3><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label><label>New password<input name="newPassword" type="password" minLength="12" maxLength="128" autoComplete="new-password" required /></label><Button variant="outline" type="submit" disabled={busy}>Change password</Button></form>
      <form onSubmit={deleteAccount} className="delete-account-form"><h3>Delete account</h3><label>Confirm with your password<input name="password" type="password" autoComplete="current-password" required /></label><Button variant="outline" type="submit" disabled={busy}>Delete account</Button></form>
      {message && <p className="workflow-error" role="status">{message}</p>}
    </div>
  </DialogFrame>
}