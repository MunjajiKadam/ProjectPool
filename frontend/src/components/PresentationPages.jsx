import { useEffect, useState } from 'react'
import { Activity, ArrowRight, Database, GitBranch, Layers3, Server, ShieldCheck } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

const chartColors = ['#0f766e', '#f59e0b', '#475569', '#5b8c72', '#9a6c32', '#64748b']

export function DashboardPage() {
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api('/projects/analytics').then((data) => { if (active) setAnalytics(data) }).catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [])

  return <section className="presentation-page dashboard-page">
    <div className="presentation-heading"><span className="section-kicker">THE PROJECTPOOL PULSE</span><h1>Ideas in motion.</h1><p>A live look at the projects students are exploring and building.</p></div>
    {error && <p className="inline-error" role="status">Analytics are temporarily unavailable. {error}</p>}
    {!analytics ? <div className="chart-grid" aria-label="Loading analytics"><div className="chart-panel chart-skeleton" /><div className="chart-panel chart-skeleton" /><div className="chart-panel chart-skeleton" /><div className="chart-panel chart-skeleton" /></div> : <>
      <div className="dashboard-metrics"><div><span>Approved ideas</span><strong>{analytics.totalProjects}</strong></div><div><span>Categories represented</span><strong>{analytics.categories.length}</strong></div><div><span>Saved by students</span><strong>{analytics.totalSaves}</strong></div><div><span>Submissions in review</span><strong>{analytics.submissions.pending}</strong></div></div>
      <div className="chart-grid">
        <article className="chart-panel"><div className="chart-title"><div><span>CATALOG MIX</span><h2>Projects by category</h2></div><Layers3 size={18} /></div><div className="chart-canvas"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.categories} dataKey="count" nameKey="name" innerRadius="56%" outerRadius="82%" paddingAngle={3}>{analytics.categories.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="chart-legend">{analytics.categories.map((item, index) => <span key={item.name}><i style={{ background: chartColors[index % chartColors.length] }} />{item.name} <b>{item.count}</b></span>)}</div></article>
        <article className="chart-panel"><div className="chart-title"><div><span>ACTIVITY</span><h2>Submissions over time</h2></div><Activity size={18} /></div><div className="chart-canvas"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.submissionsOverTime} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="#e8ece6" vertical={false} /><XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={10} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#187c68" strokeWidth={3} dot={{ r: 3, fill: '#187c68' }} /></LineChart></ResponsiveContainer></div></article>
        <article className="chart-panel"><div className="chart-title"><div><span>PROJECT SCOPE</span><h2>Difficulty distribution</h2></div><Activity size={18} /></div><div className="chart-canvas"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.difficulties} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="#e8ece6" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} /><Tooltip /><Bar dataKey="count" radius={[4, 4, 0, 0]}>{analytics.difficulties.map((item, index) => <Cell key={item.name} fill={chartColors[index + 1]} />)}</Bar></BarChart></ResponsiveContainer></div></article>
        <article className="chart-panel leaderboard-panel"><div className="chart-title"><div><span>COMMUNITY PICKS</span><h2>Most saved</h2></div><span className="leaderboard-total">{analytics.totalSaves} saves</span></div>{analytics.mostSaved.length ? analytics.mostSaved.map((project, index) => <Link className="leaderboard-row" key={project.id} to={`/projects/${encodeURIComponent(project.id)}`}><span className="leaderboard-rank">{String(index + 1).padStart(2, '0')}</span><span className="leaderboard-copy"><strong>{project.title}</strong><small>{project.category}</small></span><b>{project.saves}</b><ArrowRight size={15} /></Link>) : <p className="dashboard-empty">Saved ideas will appear here as students explore.</p>}</article>
      </div>
    </>}
  </section>
}

const architecture = [
  { icon: Layers3, title: 'React + Vite', text: 'Responsive discovery, profiles, project workflows, and charts.' },
  { icon: Server, title: 'Express API', text: 'Authentication, catalog search, moderation, and analytics endpoints.' },
  { icon: Database, title: 'MongoDB', text: 'Projects, roles, saved ideas, and submission lifecycle data.' },
]

export function AboutPage() {
  return <section className="presentation-page about-page">
    <div className="presentation-heading"><span className="section-kicker">BUILT FOR COLLEGE CREATORS</span><h1>Good ideas deserve a way forward.</h1><p>ProjectPool brings students, practical project briefs, and a thoughtful review process into one shared library.</p></div>
    <div className="about-intro"><div className="about-mark"><GitBranch size={26} /></div><div><span>THE PLATFORM</span><h2>From first spark to final demo.</h2><p>Browse achievable project concepts, save the ideas worth revisiting, and share new work with your campus community. Clear scopes and deliverables make it easier to turn curiosity into a semester plan.</p></div></div>
    <div className="architecture-heading"><div><span className="section-kicker">SYSTEM OVERVIEW</span><h2>A small stack with a clear job at every layer.</h2></div><ShieldCheck size={20} /></div>
    <div className="architecture-flow">{architecture.map(({ icon: Icon, title, text }, index) => <div className="architecture-node" key={title}><span className="architecture-icon"><Icon size={20} /></span><div><span>LAYER 0{index + 1}</span><h3>{title}</h3><p>{text}</p></div>{index < architecture.length - 1 && <ArrowRight className="architecture-arrow" size={18} />}</div>)}</div>
    <div className="about-stack"><span>FRONTEND</span><b>React 19 · Vite · React Router · Recharts</b><span>BACKEND</span><b>Node.js · Express · Mongoose · MongoDB</b><span>SECURITY</span><b>HTTP-only auth cookies · role-based review access · input validation</b></div>
  </section>
}