import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowDownRight, ArrowRight, Bookmark, Check, ChartNoAxesCombined, Clock3, Code2, Compass, Copy, Cpu, GraduationCap, Layers3, Lightbulb, LockKeyhole, LogIn, LogOut, Menu, Moon, Plus, Search, ShieldCheck, Shuffle, Sparkles, Sun, UserRound, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { projects as starterProjects } from '@/data/projects'
import { api } from '@/lib/api'
import { projectBrief } from '@/lib/projectBrief'
import { AccountDialog, AuthDialog, ManagementDialog, ProjectSubmissionDialog } from '@/components/ProjectWorkflows'
import { ProjectQuestionPanel } from '@/components/ProjectQuestionPanel'
import { ProfilePage } from '@/components/ProfilePage'
import { AboutPage, DashboardPage } from '@/components/PresentationPages'
import { useDialogFocus } from '@/hooks/useDialogFocus'

const categories = [
  { name: 'All projects', icon: Layers3 },
  { name: 'Web development', icon: Code2 },
  { name: 'AI & machine learning', icon: Sparkles },
  { name: 'Mobile apps', icon: Compass },
  { name: 'IoT & hardware', icon: Cpu },
  { name: 'Data & visualization', icon: ChartNoAxesCombined },
  { name: 'Cybersecurity', icon: LockKeyhole },
]
const categoryStyles = {
  'Web development': 'category-web',
  'AI & machine learning': 'category-ai',
  'Mobile apps': 'category-mobile',
  'IoT & hardware': 'category-iot',
  'Data & visualization': 'category-data',
  Cybersecurity: 'category-security',
}

function readSavedProjects() {
  try { return JSON.parse(localStorage.getItem('projectpool-saved') || '[]') }
  catch { return [] }
}

function ProjectImage({ src, alt, className }) {
  const [useFallback, setUseFallback] = useState(false)
  return <img className={className} src={useFallback || !src ? '/project-fallback.svg' : src} alt={alt || ''} loading="lazy" onError={() => setUseFallback(true)} />
}

function ProjectCard({ project, saved, onSave, onOpen, showStatus = false, index = 0 }) {
  const brief = projectBrief(project)
  return (
    <article className="project-card reveal-on-scroll" style={{ transitionDelay: `${Math.min(index % 6, 5) * 55}ms` }}>
      <button className="project-image-button" onClick={onOpen} aria-label={`View ${project.title}`}>
        <ProjectImage className="project-image" src={project.image} alt={project.imageAlt} />
        <span className={`image-category ${categoryStyles[project.category] || ''}`}>{project.category}</span>
        <span className="image-open"><ArrowDownRight size={17} /></span>
      </button>
      <div className="project-card-body">
        <div className="project-meta"><div className="project-meta-left"><span className={`difficulty difficulty-${project.difficulty.toLowerCase()}`}>{project.difficulty}</span>{showStatus && <span className={`status-label status-${project.status}`}>{project.status}</span>}</div><span className="duration"><Clock3 size={13} /> {project.duration}</span></div>
        <button className="project-title-button" onClick={onOpen}><h3>{project.title}</h3><ArrowRight size={17} /></button>
        <p className="project-description">{project.description}</p>
        <div className="project-card-skills" aria-label="Skills developed">{brief.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}</div>
        <div className="project-card-footer">
          <div className="tech-list">{project.technology.slice(0, 3).map((tech) => <span key={tech}>{tech}</span>)}</div>
          {(!project.status || project.status === 'approved') && <Button variant="ghost" size="icon" className={`save-button ${saved ? 'is-saved' : ''}`} onClick={onSave} aria-label={saved ? `Remove ${project.title} from saved projects` : `Save ${project.title}`} title={saved ? 'Remove saved project' : 'Save project'}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></Button>}
        </div>
      </div>
    </article>
  )
}

function ProjectDialog({ project, saved, onSave, onShare, onClose, page = false }) {
  const dialogRef = useDialogFocus(onClose, !page)
  const navigate = useNavigate()
  const [similar, setSimilar] = useState([])
  const [similarError, setSimilarError] = useState('')
  const complexity = project.difficulty === 'Beginner' ? 34 : project.difficulty === 'Intermediate' ? 66 : 92
  const brief = projectBrief(project)

  useEffect(() => {
    let active = true
    api(`/projects/similar/${encodeURIComponent(project.id || project._id)}`).then((items) => { if (active) setSimilar(items) }).catch((error) => { if (active) setSimilarError(error.message) })
    return () => { active = false }
  }, [project.id, project._id])

  async function downloadBrief() {
    const { jsPDF } = await import('jspdf')
    const document = new jsPDF()
    const text = [project.title, `${project.category} | ${project.difficulty} | ${project.duration}`, '', project.description, '', project.overview, '', 'WHAT YOU WILL BUILD', ...(project.features || []).map((item) => `- ${item}`), '', 'SUGGESTED TOOLKIT', (project.technology || []).join(', '), '', 'FINAL DELIVERABLES', ...(project.deliverables || []).map((item) => `- ${item}`)]
    document.setFont('helvetica', 'bold')
    document.setFontSize(20)
    document.text(project.title, 18, 22, { maxWidth: 174 })
    document.setFont('helvetica', 'normal')
    document.setFontSize(10)
    document.text(text.slice(1).join('\n'), 18, 38, { maxWidth: 174 })
    document.save(`${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-brief.pdf`)
  }

  return (
    <div className={page ? 'project-page-shell' : 'dialog-backdrop'} onMouseDown={(event) => !page && event.target === event.currentTarget && onClose()}>
      {page && <Button className="project-page-back" variant="ghost" onClick={onClose}><ArrowDownLeft size={16} /> Back to ideas</Button>}
      <section ref={dialogRef} tabIndex="-1" className={page ? 'project-detail-page' : 'project-dialog'} role={page ? 'region' : 'dialog'} aria-modal={page ? undefined : true} aria-labelledby="dialog-title">
        <div className="dialog-image-wrap"><ProjectImage src={project.image} alt={project.imageAlt} /><Button variant="ghost" size="icon" className="dialog-close" onClick={onClose} aria-label="Close project details"><X size={19} /></Button><span className={`image-category ${categoryStyles[project.category] || ''}`}>{project.category}</span></div>
        <div className="dialog-content">
          <div className="project-meta"><span className={`difficulty difficulty-${project.difficulty.toLowerCase()}`}>{project.difficulty}</span><span className="duration"><Clock3 size={13} /> {project.duration}</span></div>
          <h2 id="dialog-title">{project.title}</h2>
          <p className="dialog-overview">{project.overview}</p>
          <div className="project-fact-grid"><div><span>TEAM SIZE</span><strong>{brief.teamSize}</strong></div><div><span>ESTIMATED COST</span><strong>{brief.estimatedCost}</strong></div><div><span>TIME COMMITMENT</span><strong>{project.duration}</strong></div></div>
          <div className="complexity-meter"><div><span>PROJECT COMPLEXITY</span><strong>{project.difficulty}</strong></div><div className="complexity-track" role="meter" aria-label={`${project.difficulty} complexity`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={complexity}><span style={{ width: `${complexity}%` }} /></div><div className="complexity-scale"><span>Starter</span><span>Stretch</span></div></div>
          <div className="detail-section"><h3>Why it matters</h3><p className="project-impact">{brief.impact}</p></div>
          <div className="detail-section"><h3>What you’ll build</h3><ul className="feature-list">{project.features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}</ul></div>
          <div className="detail-section"><h3>Skills you’ll practice</h3><div className="detail-tech-list">{brief.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
          <div className="detail-section"><h3>Starting point</h3><ul className="deliverable-list">{brief.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="detail-section"><h3>What you’ll learn</h3><ul className="deliverable-list">{brief.learningOutcomes.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="detail-section"><h3>Suggested milestones</h3><ol className="project-milestones">{brief.milestones.map((milestone, index) => <li key={milestone}><span>{String(index + 1).padStart(2, '0')}</span>{milestone}</li>)}</ol></div>
          <div className="detail-section"><h3>Suggested toolkit</h3><div className="detail-tech-list">{project.technology.map((tech) => <span key={tech}>{tech}</span>)}</div></div>
          <div className="detail-section"><h3>Final deliverables</h3><ul className="deliverable-list">{project.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div>
          {(!project.status || project.status === 'approved') && <ProjectQuestionPanel project={project} />}
          {(!project.status || project.status === 'approved') ? <div className="dialog-actions"><Button className="dialog-save" variant={saved ? 'outline' : 'default'} onClick={onSave}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved to your ideas' : 'Save this idea'}</Button><Button className="dialog-share" variant="outline" onClick={onShare} aria-label="Copy link to this project" title="Copy project link"><Copy size={16} /></Button><Button className="dialog-share pdf-button" variant="outline" onClick={downloadBrief} aria-label="Download project brief PDF" title="Download project brief"><ArrowDownRight size={16} /></Button></div> : <p className="submission-dialog-status">This submission is {project.status} and is not yet available to save.</p>}
        </div>
      </section>
      {page && (!project.status || project.status === 'approved') && <section className="similar-projects"><div className="section-heading"><div><span className="section-kicker">KEEP EXPLORING</span><h2>Similar projects</h2></div></div>{similarError && <p className="dashboard-empty">Recommendations are unavailable right now.</p>}{similar.length > 0 && <div className="similar-grid">{similar.map((item) => <button type="button" className="similar-project" key={item.id || item._id} onClick={() => navigate(`/projects/${encodeURIComponent(item.id || item._id)}`)}><ProjectImage src={item.image} alt={item.imageAlt} /><span>{item.category}</span><strong>{item.title}</strong></button>)}</div>}</section>}
    </div>
  )
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const isProjectPage = pathname.startsWith('/projects/')
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const activeView = pathname === '/' ? 'discover' : pathname === '/saved' ? 'saved' : pathname === '/submissions' ? 'mine' : 'page'
  const projectRouteId = isProjectPage ? decodeURIComponent(pathname.slice('/projects/'.length)) : ''
  const [projects, setProjects] = useState(starterProjects)
  const [savedProjects, setSavedProjects] = useState(readSavedProjects)
  const [category, setCategory] = useState('All projects')
  const [difficulty, setDifficulty] = useState('all')
  const [tag, setTag] = useState('')
  const [sortBy, setSortBy] = useState('recommended')
  const [query, setQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [savedRecords, setSavedRecords] = useState([])
  const [myProjects, setMyProjects] = useState([])
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [catalogTotal, setCatalogTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('projectpool-theme') || 'light')
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)
  const [trendingProjects, setTrendingProjects] = useState([])
  const [reviewCount, setReviewCount] = useState(0)
  const [loadedRequest, setLoadedRequest] = useState('')
  const [toast, setToast] = useState('')
  const params = new URLSearchParams({ page: String(page), limit: '12', sort: sortBy === 'recommended' ? 'newest' : sortBy === 'beginner' ? 'difficulty' : 'shortest' })
  if (category !== 'All projects') params.set('category', category)
  if (difficulty !== 'all') params.set('difficulty', difficulty)
  if (tag) params.set('tag', tag)
  if (query.trim()) params.set('q', query.trim())
  const requestKey = params.toString()
  const loadingCatalog = loadedRequest !== requestKey
  const beginnerProjectCount = projects.filter((project) => project.difficulty === 'Beginner').length
  const availableTags = [...new Set(projects.flatMap((project) => project.tags || []))].sort().slice(0, 12)
  const suggestions = [...new Set(projects.flatMap((project) => [project.title, ...(project.technology || [])]))].slice(0, 24)

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('projectpool-theme', theme)
  }, [theme])

  useEffect(() => {
    const elements = document.querySelectorAll('.reveal-on-scroll')
    if (!('IntersectionObserver' in window)) { elements.forEach((element) => element.classList.add('is-visible')); return undefined }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
    }), { threshold: 0.12 })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [pathname, projects])

  useEffect(() => {
    let ignore = false
    api(`/projects?${requestKey}`)
      .then((result) => { if (!ignore) { setProjects(result.items || []); setPageCount(result.pages || 1); setCatalogTotal(result.total || 0); setLoadError(''); setLoadedRequest(requestKey) } })
      .catch((error) => { if (!ignore) { setProjects(starterProjects); setPageCount(1); setCatalogTotal(starterProjects.length); setLoadError(error.message); setLoadedRequest(requestKey) } })
    return () => { ignore = true }
  }, [refreshKey, requestKey])

  useEffect(() => {
    if (pathname !== '/') return undefined
    let active = true
    api('/projects/analytics').then((result) => { if (active) setTrendingProjects(result.trendingThisWeek || []) }).catch(() => {})
    return () => { active = false }
  }, [pathname, refreshKey])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    let ignore = false
    api('/auth/me').then(async (result) => {
      if (ignore) return
      setUser(result.user)
      const saved = await api('/users/saved')
      if (!ignore) {
        setSavedRecords(saved.items || [])
        setSavedProjects((saved.items || []).map((project) => project.id || project._id))
      }
    }).catch(() => {}).finally(() => { if (!ignore) setAuthChecked(true) })
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    if (!user || !['admin', 'moderator'].includes(user.role)) return undefined
    let active = true
    api('/projects/moderation').then((items) => { if (active) setReviewCount(items.length) }).catch(() => {})
    return () => { active = false }
  }, [refreshKey, user])

  useEffect(() => {
    const protectedPage = ['/saved', '/submissions', '/profile', '/submit', '/account', '/manage'].includes(pathname)
    if (authChecked && protectedPage && !user) navigate('/login', { replace: true, state: { from: pathname } })
    if (authChecked && pathname === '/manage' && user && !['admin', 'moderator'].includes(user.role)) navigate('/', { replace: true })
  }, [authChecked, navigate, pathname, user])

  useEffect(() => { if (authChecked && !user) localStorage.setItem('projectpool-saved', JSON.stringify(savedProjects)) }, [authChecked, savedProjects, user])

  useEffect(() => {
    if ((activeView !== 'mine' && pathname !== '/profile') || !user) return
    api('/projects/mine').then((result) => setMyProjects(result)).catch((error) => setLoadError(error.message))
  }, [activeView, pathname, refreshKey, user])

  useEffect(() => {
    let active = true
    async function restoreProjectFromUrl() {
      if (!projectRouteId) { setSelectedProject(null); return }
      const knownProject = [...projects, ...savedRecords, ...myProjects].find((item) => (item.id || item._id) === projectRouteId)
      if (knownProject) { setSelectedProject(knownProject); return }
      try {
        const project = await api(`/projects/${encodeURIComponent(projectRouteId)}`)
        if (active) setSelectedProject(project)
      } catch {
        if (active) { setToast('That project link is unavailable.'); setSelectedProject(null) }
      }
    }
    restoreProjectFromUrl()
    return () => { active = false }
  }, [myProjects, projectRouteId, projects, savedRecords])

  const sourceProjects = activeView === 'mine' ? myProjects : activeView === 'saved' && user ? savedRecords : projects
  const visibleProjects = sourceProjects.filter((project) => {
    const matchesCategory = category === 'All projects' || project.category === category
    const matchesDifficulty = difficulty === 'all' || project.difficulty === difficulty
    const matchesTag = !tag || (project.tags || []).includes(tag)
    const matchesView = activeView !== 'saved' || savedProjects.includes(project.id || project._id)
    const searchText = `${project.title} ${project.description} ${project.category} ${project.technology.join(' ')}`.toLowerCase()
    return matchesCategory && matchesDifficulty && matchesTag && matchesView && searchText.includes(query.trim().toLowerCase())
  })
  if (sortBy === 'shortest') visibleProjects.sort((first, second) => Number.parseInt(first.duration, 10) - Number.parseInt(second.duration, 10))
  if (sortBy === 'beginner') {
    const difficultyOrder = { Beginner: 0, Intermediate: 1, Advanced: 2 }
    visibleProjects.sort((first, second) => difficultyOrder[first.difficulty] - difficultyOrder[second.difficulty])
  }

  function toggleSaved(project) {
    const projectId = project.id || project._id
    const wasSaved = savedProjects.includes(projectId)
    setToast(wasSaved ? 'Removed from saved ideas.' : 'Saved to your ideas.')
    setSavedProjects((current) => wasSaved ? current.filter((id) => id !== projectId) : [...current, projectId])
    setSavedRecords((current) => wasSaved ? current.filter((item) => (item.id || item._id) !== projectId) : [...current, project])
    if (user) api(`/users/saved/${encodeURIComponent(projectId)}`, { method: wasSaved ? 'DELETE' : 'POST' }).catch((error) => {
      setSavedProjects((current) => wasSaved ? [...current, projectId] : current.filter((id) => id !== projectId))
      setSavedRecords((current) => wasSaved ? [...current, project] : current.filter((item) => (item.id || item._id) !== projectId))
      setToast(error.message)
    })
  }

  function selectView(view) {
    if ((view === 'mine' || view === 'saved') && !user) { navigate('/login', { state: { from: view === 'mine' ? '/submissions' : '/saved' } }); return }
    const routes = { discover: '/', saved: '/saved', mine: '/submissions' }
    navigate(routes[view])
    setCategory('All projects'); setDifficulty('all'); setPage(1)
  }

  async function handleAuthenticated(nextUser) {
    setUser(nextUser)
    setAuthChecked(true)
    setToast(`Signed in as ${nextUser.name}.`)
    const previousSaves = readSavedProjects()
    if (previousSaves.length) await Promise.all(previousSaves.map((id) => api(`/users/saved/${encodeURIComponent(id)}`, { method: 'POST' }).catch(() => {})))
    try {
      const saved = await api('/users/saved')
      setSavedRecords(saved.items || [])
      setSavedProjects((saved.items || []).map((project) => project.id || project._id))
      localStorage.removeItem('projectpool-saved')
    } catch (error) { setToast(error.message) }
  }

  function signOut() {
    api('/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
    setSavedRecords([])
    navigate('/')
    setToast('You are signed out.')
  }

  function changed(message = 'Your changes are saved.') {
    setRefreshKey((current) => current + 1)
    setToast(message)
  }

  function openProject(project) {
    const projectId = project.id || project._id
    navigate(`/projects/${encodeURIComponent(projectId)}`)
    setSelectedProject(project)
  }

  function closeProject() { navigate('/') }

  async function shareProject(project) {
    const url = new URL(window.location.href)
    url.pathname = `/projects/${encodeURIComponent(project.id || project._id)}`
    url.searchParams.delete('project')
    try {
      await navigator.clipboard.writeText(url.toString())
      setToast('Project link copied.')
    } catch { setToast('Clipboard access is unavailable in this browser.') }
  }

  function openRandomProject() {
    if (visibleProjects.length) openProject(visibleProjects[Math.floor(Math.random() * visibleProjects.length)])
  }

  return (
    <div className={`app-shell ${isAuthPage ? 'app-shell-auth' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-brand-row"><Link className="brand" to="/" aria-label="ProjectPool home"><span className="brand-mark"><Lightbulb size={20} /></span><span>project<span>pool</span></span></Link><Button className="mobile-nav-toggle" variant="ghost" size="icon" onClick={() => setMobileCategoriesOpen((open) => !open)} aria-expanded={mobileCategoriesOpen} aria-controls="mobile-category-navigation" aria-label={mobileCategoriesOpen ? 'Close category navigation' : 'Open category navigation'} title={mobileCategoriesOpen ? 'Close categories' : 'Browse categories'}>{mobileCategoriesOpen ? <X size={18} /> : <Menu size={18} />}</Button></div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          <button className={`nav-item ${activeView === 'discover' ? 'active' : ''}`} onClick={() => selectView('discover')}><Compass size={17} /><span>Discover ideas</span></button>
          <button className={`nav-item ${activeView === 'saved' ? 'active' : ''}`} onClick={() => selectView('saved')}><Bookmark size={17} /><span>Saved ideas</span><span className="nav-count">{savedProjects.length}</span></button>
          {user && <button className={`nav-item ${activeView === 'mine' ? 'active' : ''}`} onClick={() => selectView('mine')}><Lightbulb size={16} /><span>My submissions</span><span className="nav-count">{myProjects.length}</span></button>}
          <Link className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`} to="/dashboard"><ChartNoAxesCombined size={17} /><span>Analytics</span></Link>
          <Link className={`nav-item ${pathname === '/about' ? 'active' : ''}`} to="/about"><Layers3 size={17} /><span>About ProjectPool</span></Link>
        </nav>
        <div className={`sidebar-label category-label ${mobileCategoriesOpen ? 'mobile-category-label-open' : ''}`}>BROWSE BY FIELD</div>
        <nav id="mobile-category-navigation" className={`category-nav ${mobileCategoriesOpen ? 'mobile-category-nav-open' : ''}`} aria-label="Filter by project field">
          {categories.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${category === name ? 'active' : ''}`} onClick={() => { setCategory(name); navigate('/'); setPage(1); setMobileCategoriesOpen(false) }}><Icon size={16} /><span>{name}</span></button>)}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-note-icon"><GraduationCap size={19} /></div><p>Made for curious minds.</p><span>Good luck with your next build.</span></div>
      </aside>

      <main id="top" className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>Library</span><span className="breadcrumb-slash">/</span><strong>{isProjectPage ? 'Project details' : isAuthPage ? pathname === '/register' ? 'Create account' : 'Sign in' : pathname === '/profile' ? 'Profile' : pathname === '/account' ? 'Account settings' : pathname === '/submit' ? 'Submit idea' : pathname === '/manage' ? 'Manage projects' : pathname === '/dashboard' ? 'Analytics' : pathname === '/about' ? 'About' : activeView === 'saved' ? 'Saved ideas' : activeView === 'mine' ? 'My submissions' : 'Explore'}</strong></div><div className="topbar-right topbar-actions">
          <Button variant="ghost" size="icon" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</Button>
          {user ? <><Button variant="ghost" className="account-button" onClick={() => navigate('/profile')}><UserRound size={15} /><span>{user.name}</span></Button><Button variant="ghost" size="icon" title="Sign out" aria-label="Sign out" onClick={signOut}><LogOut size={16} /></Button></> : <Button variant="outline" className="account-button" onClick={() => navigate('/login')}><LogIn size={15} /> Sign in</Button>}
          {user && <Button className="topbar-action" onClick={() => navigate('/submit')}><Plus size={15} /> Submit idea</Button>}
          {(user?.role === 'moderator' || user?.role === 'admin') && <Button variant="outline" className="topbar-action" onClick={() => navigate('/manage')}><ShieldCheck size={15} /> {user.role === 'admin' ? 'Manage catalog' : 'Review ideas'}{reviewCount > 0 && <span className="review-count-badge">{reviewCount}</span>}</Button>}
          {!user && <span className="student-label"><span className="online-dot" /> STUDENT EDITION</span>}
        </div></header>
        {activeView === 'discover' && <section className="hero-band">
          <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" />
          <div className="hero-copy"><div className="eyebrow"><span /> THE COLLEGE PROJECT LIBRARY</div><h1>Find your next<br />big idea.</h1><p>Thoughtful project concepts, with a clear path from first sketch to final demo.</p><a className="hero-link" href="#project-list">Explore the collection <ArrowRight size={15} /></a></div>
          <div className="hero-photo" role="img" aria-label="A student workspace with a laptop and notebook" />
          <div className="hero-index"><span>CURATED FOR</span><strong>the curious</strong><ArrowDownRight size={18} /></div>
        </section>}

        {activeView === 'discover' && <section className="library-stats" aria-label="Project library overview">
          <div className="library-stat"><span className="stat-icon stat-icon-green"><Layers3 size={17} /></span><div><strong>{catalogTotal || projects.length}</strong><span>project ideas</span></div></div>
          <div className="library-stat"><span className="stat-icon stat-icon-gold"><GraduationCap size={18} /></span><div><strong>{beginnerProjectCount}</strong><span>beginner friendly</span></div></div>
          <div className="library-stat"><span className="stat-icon stat-icon-coral"><Bookmark size={16} /></span><div><strong>{savedProjects.length}</strong><span>saved for later</span></div></div>
          <span className="stats-note"><Sparkles size={14} /> Your next idea is in here</span>
        </section>}

        {activeView === 'discover' && trendingProjects.length > 0 && <section className="trending-strip"><div><span className="section-kicker">THIS WEEK ON PROJECTPOOL</span><h2>Trending this week</h2></div><div className="trending-items">{trendingProjects.slice(0, 4).map((project, index) => <button className="trending-item" key={project.id} onClick={() => openProject(project)}><span>0{index + 1}</span><strong>{project.title}</strong><small>{project.saves} saves</small></button>)}</div></section>}
        {['discover', 'saved', 'mine'].includes(activeView) && <section className="collection-section" id="project-list">
            <div className="section-heading"><div><span className="section-kicker">START WITH A SPARK</span><h2>{activeView === 'saved' ? 'Your saved ideas' : activeView === 'mine' ? 'Your project submissions' : 'Ideas worth building'}</h2><p className="section-subtitle">{activeView === 'mine' ? 'Track review status and update drafts that need another pass.' : 'Explore practical concepts made for your next semester project.'}</p></div><span className="result-count">{loadingCatalog ? 'LOADING' : `${activeView === 'discover' ? catalogTotal : visibleProjects.length} PROJECTS`}</span></div>
          <div className="collection-toolbar">
            <div className="filter-pills" role="group" aria-label="Filter project categories">
              {categories.map(({ name }) => <button key={name} className={`filter-pill ${category === name ? 'selected' : ''}`} onClick={() => { setCategory(name); navigate('/'); setPage(1) }}>{name === 'All projects' ? 'All ideas' : name}</button>)}
            </div>
            <div className="discovery-controls">
              <label className="select-field"><span className="sr-only">Filter by difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="Filter by difficulty"><option value="all">Any level</option><option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option></select></label>
              <label className="select-field sort-field"><span className="sr-only">Sort projects</span><select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1) }} aria-label="Sort projects"><option value="recommended">Newest</option><option value="shortest">Shortest timeline</option><option value="beginner">Beginner first</option></select></label>
              <label className="search-field"><Search size={17} /><input list="project-suggestions" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search ideas or tools" aria-label="Search project ideas" /></label>
              <datalist id="project-suggestions">{suggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist>
              <Button className="surprise-button" variant="outline" onClick={openRandomProject} disabled={!visibleProjects.length}><Shuffle size={15} /> Surprise me</Button>
            </div>
          </div>
          {loadError && <div className="inline-error" role="status"><span>{loadError} {projects.length ? 'Showing available starter ideas.' : ''}</span><Button variant="outline" onClick={() => setRefreshKey((current) => current + 1)}>Retry</Button></div>}
          <div className="tag-filter-row" aria-label="Filter by tags">{availableTags.map((value) => <button key={value} type="button" className={`tag-chip ${tag === value ? 'selected' : ''}`} onClick={() => { setTag(tag === value ? '' : value); setPage(1) }}>{value}</button>)}</div>
          {loadingCatalog && (!loadedRequest || !visibleProjects.length) ? <div className="project-grid skeleton-grid" aria-live="polite">{Array.from({ length: 6 }, (_, index) => <div className="project-skeleton" key={index}><span /><div><i /><i /><i /></div></div>)}</div> : visibleProjects.length ? <div className="project-grid" aria-busy={loadingCatalog}>{visibleProjects.map((project, index) => { const projectId = project.id || project._id; return <ProjectCard key={projectId} project={project} saved={savedProjects.includes(projectId)} showStatus={activeView === 'mine'} onSave={() => toggleSaved(project)} onOpen={() => openProject(project)} index={index} /> })}</div> : <div className="empty-state"><div className="empty-icon"><Search size={21} /></div><h3>{activeView === 'mine' ? 'No submissions yet' : 'No ideas found'}</h3><p>{activeView === 'mine' ? 'Submit an idea and follow its review status here.' : 'Try another search or choose a different field.'}</p>{activeView === 'mine' ? <Button onClick={() => navigate('/submit')}><Plus size={15} /> Submit an idea</Button> : <Button variant="outline" onClick={() => { setQuery(''); setCategory('All projects'); setDifficulty('all'); setTag(''); navigate('/'); setPage(1) }}>Clear filters</Button>}</div>}
          {activeView === 'discover' && pageCount > 1 && <nav className="pagination" aria-label="Project pages"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button variant="outline" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button></nav>}
          <div className="collection-end"><span>YOU’RE ALL CAUGHT UP</span><span className="end-line" /><Sparkles size={15} /></div>
        </section>}
        {activeView === 'discover' && <footer className="page-footer"><span>PROJECTPOOL · BUILT FOR WHAT’S NEXT</span><button type="button" onClick={() => user ? navigate('/submit') : navigate('/login')}>Share an idea <ArrowRight size={13} /></button></footer>}
        {pathname === '/dashboard' && <DashboardPage />}
        {pathname === '/about' && <AboutPage />}
        {pathname === '/profile' && user && <ProfilePage user={user} savedCount={savedProjects.length} submissionCount={myProjects.length} onAccount={() => navigate('/account')} onUpdated={setUser} />}
      {isProjectPage && selectedProject && <ProjectDialog page project={selectedProject} saved={savedProjects.includes(selectedProject.id || selectedProject._id)} onSave={() => toggleSaved(selectedProject)} onShare={() => shareProject(selectedProject)} onClose={closeProject} />}
      {isProjectPage && !selectedProject && <section className="standalone-page-message" aria-live="polite">Loading project details...</section>}
      {isAuthPage && <AuthDialog initialMode={pathname === '/register' ? 'register' : 'login'} theme={theme} onThemeToggle={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} onModeChange={(mode) => navigate(mode === 'register' ? '/register' : '/login', { replace: true, state: location.state })} onClose={() => navigate(location.state?.from || '/')} onAuthenticated={handleAuthenticated} />}
      {pathname === '/account' && user && <AccountDialog asPage user={user} onClose={() => navigate('/profile')} onUpdated={setUser} onDeleted={() => { setUser(null); setSavedProjects([]); setSavedRecords([]); navigate('/') }} />}
      {pathname === '/submit' && user && <ProjectSubmissionDialog asPage admin={user.role === 'admin'} project={location.state?.project || null} onClose={() => navigate(location.state?.returnTo || '/')} onSubmitted={changed} />}
      {pathname === '/manage' && user && <ManagementDialog asPage mode={user.role === 'admin' ? 'admin' : 'moderation'} onClose={() => navigate('/')} onChanged={changed} onEdit={(project, admin) => navigate('/submit', { state: { project, admin, returnTo: '/manage' } })} />}
      {!isProjectPage && !isAuthPage && !['/', '/saved', '/submissions', '/profile', '/account', '/submit', '/manage', '/dashboard', '/about'].includes(pathname) && <section className="standalone-page-message"><h2>Page not found</h2><p>This ProjectPool page does not exist.</p><Button onClick={() => navigate('/')}>Back to ideas</Button></section>}
      </main>
      {toast && <div className="showcase-toast" role="status" aria-live="polite"><span>{toast}</span><button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  )
}

export default App