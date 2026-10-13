import { useEffect, useState } from 'react'
import { ArrowRight, Bookmark, ClipboardList, Settings2, Sparkles, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

const avatarPresets = ['sprout', 'sunrise', 'ocean', 'coral', 'violet', 'citrus']
const interestPresets = ['Web development', 'AI & machine learning', 'Mobile apps', 'IoT & hardware', 'Data & visualization', 'Cybersecurity']

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('')
}

export function ProfilePage({ user, savedCount, submissionCount, onAccount, onUpdated }) {
  const [avatar, setAvatar] = useState(user.avatar || 'sprout')
  const [interests, setInterests] = useState(user.interests || [])
  const [activity, setActivity] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([api('/users/activity'), api('/projects?limit=48')]).then(([timeline, catalog]) => {
      if (!active) return
      setActivity(timeline.items || [])
      const scored = (catalog.items || []).map((project) => ({ project, score: [project.category, ...(project.tags || []), ...(project.skills || [])].filter((item) => interests.some((interest) => interest.toLowerCase() === item.toLowerCase())).length }))
      setRecommendations(scored.filter((item) => item.score).sort((first, second) => second.score - first.score).slice(0, 3).map((item) => item.project))
    }).catch(() => {})
    return () => { active = false }
  }, [interests])

  async function savePreferences(nextAvatar = avatar, nextInterests = interests) {
    setAvatar(nextAvatar)
    setInterests(nextInterests)
    try { const result = await api('/users/me', { method: 'PATCH', body: { avatar: nextAvatar, interests: nextInterests } }); onUpdated(result.user); setMessage('Profile preferences saved.') }
    catch (error) { setMessage(error.message) }
  }

  const avatarColors = { sprout: '#477b61', sunrise: '#d1784f', ocean: '#39799a', coral: '#c75f5a', violet: '#796886', citrus: '#9b8a32' }

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <div className="profile-heading"><span className="section-kicker">YOUR PROJECTPOOL</span><h1 id="profile-title">Profile</h1><p>Keep your project ideas and account details in one place.</p></div>
      <div className="profile-identity">
        <div className="profile-avatar" style={{ background: avatarColors[avatar] || avatarColors.sprout }} aria-hidden="true">{initials(user.name) || <UserRound size={26} />}</div>
        <div className="profile-identity-copy"><span className="profile-role">{user.role}</span><h2>{user.name}</h2><p>{user.email}</p></div>
        <Button variant="outline" onClick={onAccount}><Settings2 size={16} /> Account settings</Button>
      </div>
      <section className="profile-personalization"><div className="profile-subheading"><div><span className="section-kicker">MAKE IT YOURS</span><h2>Profile & interests</h2></div>{message && <span role="status">{message}</span>}</div><div className="avatar-presets" aria-label="Choose a profile avatar">{avatarPresets.map((preset) => <button key={preset} type="button" className={`avatar-preset ${avatar === preset ? 'selected' : ''}`} style={{ '--avatar-color': avatarColors[preset] }} onClick={() => savePreferences(preset, interests)} aria-label={`Choose ${preset} avatar`} title={preset}><span>{initials(user.name) || <UserRound size={17} />}</span></button>)}</div><h3>Areas you want to explore</h3><div className="interest-badges">{interestPresets.map((interest) => <button type="button" key={interest} className={`interest-badge ${interests.includes(interest) ? 'selected' : ''}`} onClick={() => { const next = interests.includes(interest) ? interests.filter((item) => item !== interest) : [...interests, interest].slice(0, 12); savePreferences(avatar, next) }}>{interest}</button>)}</div>{recommendations.length > 0 && <div className="matched-skills"><h3>Skills in your recommendations</h3>{[...new Set(recommendations.flatMap((project) => project.skills || project.technology || []))].slice(0, 8).map((skill) => <span key={skill}>{skill}</span>)}</div>}</section>
      <dl className="profile-stats">
        <div><dt><Bookmark size={16} /> Saved ideas</dt><dd>{savedCount}</dd></div>
        <div><dt><ClipboardList size={16} /> Submitted ideas</dt><dd>{submissionCount}</dd></div>
        <div><dt><Sparkles size={16} /> Workspace role</dt><dd className="profile-role-value">{user.role}</dd></div>
      </dl>
      {recommendations.length > 0 && <section className="profile-recommendations"><span className="section-kicker">BASED ON YOUR INTERESTS</span><h2>Ideas with your name on them</h2><div>{recommendations.map((project) => <Link key={project.id || project._id} to={`/projects/${encodeURIComponent(project.id || project._id)}`}><span>{project.category}</span><strong>{project.title}</strong><ArrowRight size={15} /></Link>)}</div></section>}
      <section className="activity-timeline"><span className="section-kicker">RECENT ACTIVITY</span><h2>Your project timeline</h2>{activity.length ? <ol>{activity.map((item, index) => <li key={`${item.projectId}-${item.createdAt}-${index}`}><span className={`timeline-dot timeline-${item.type}`} /><div><strong>{item.type === 'save' ? 'Saved an idea' : 'Submitted a project'}</strong><Link to={`/projects/${encodeURIComponent(item.projectId)}`}>{item.title}</Link><small>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{item.status ? ` · ${item.status}` : ''}</small></div></li>)}</ol> : <p className="activity-empty">Saved ideas and submissions will appear here.</p>}</section>
      <nav className="profile-links" aria-label="Your workspace">
        <Link to="/saved"><span><Bookmark size={17} /><span><strong>Saved ideas</strong><small>Return to projects you bookmarked.</small></span></span><ArrowRight size={17} /></Link>
        <Link to="/submissions"><span><ClipboardList size={17} /><span><strong>My submissions</strong><small>See review status and update your ideas.</small></span></span><ArrowRight size={17} /></Link>
        <Link to="/submit"><span><Sparkles size={17} /><span><strong>Submit a project</strong><small>Share a new idea with the campus community.</small></span></span><ArrowRight size={17} /></Link>
      </nav>
    </section>
  )
}