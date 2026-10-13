import { useEffect, useState } from 'react'
import { Copy, FolderHeart, Plus, Share2, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export function ProjectCollectionPicker({ project }) {
  const projectId = project.id || project._id
  const [collections, setCollections] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    api('/collections').then((result) => {
      if (!active) return
      const items = result.items || []
      setCollections(items)
      setSelectedId(items[0]?.id || '')
    }).catch((error) => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [])

  async function addProject() {
    if (!selectedId) return
    setBusy(true)
    setMessage('')
    try {
      const result = await api(`/collections/${encodeURIComponent(selectedId)}/projects/${encodeURIComponent(projectId)}`, { method: 'POST' })
      setCollections((current) => current.map((item) => item.id === result.id ? result : item))
      setMessage(`Added to ${result.name}.`)
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  return <section className="project-collection-picker" aria-label="Add project to a collection">
    <div><FolderHeart size={16} /><strong>Add to a collection</strong></div>
    {collections.length ? <form onSubmit={(event) => { event.preventDefault(); addProject() }}><label className="sr-only" htmlFor="project-collection-select">Choose a project collection</label><select id="project-collection-select" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select><Button variant="outline" type="submit" disabled={busy || !selectedId}><Plus size={15} /> Add</Button></form> : <Link to="/collections">Create a collection</Link>}
    {message && <p role="status">{message}</p>}
  </section>
}

export function ProjectCollectionsPage() {
  const [collections, setCollections] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    api('/collections').then((result) => { if (active) setCollections(result.items || []) }).catch((error) => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [])

  async function createCollection(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const collection = await api('/collections', { method: 'POST', body: { name, description } })
      setCollections((current) => [...current, collection])
      setName('')
      setDescription('')
      setMessage(`Created ${collection.name}.`)
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  async function updateVisibility(collection) {
    try {
      const result = await api(`/collections/${encodeURIComponent(collection.id)}`, { method: 'PATCH', body: { isPublic: !collection.isPublic } })
      setCollections((current) => current.map((item) => item.id === result.id ? result : item))
      setMessage(result.isPublic ? 'Share link is ready.' : 'Collection is private again.')
    } catch (error) { setMessage(error.message) }
  }

  async function copyShareLink(collection) {
    try {
      await navigator.clipboard.writeText(new URL(`/collections/shared/${collection.shareId}`, window.location.origin).toString())
      setMessage('Collection link copied.')
    } catch { setMessage('Clipboard access is unavailable in this browser.') }
  }

  async function deleteCollection(collection) {
    try {
      await api(`/collections/${encodeURIComponent(collection.id)}`, { method: 'DELETE' })
      setCollections((current) => current.filter((item) => item.id !== collection.id))
      setMessage(`${collection.name} deleted.`)
    } catch (error) { setMessage(error.message) }
  }

  async function removeProject(collection, project) {
    try {
      const result = await api(`/collections/${encodeURIComponent(collection.id)}/projects/${encodeURIComponent(project.id || project._id)}`, { method: 'DELETE' })
      setCollections((current) => current.map((item) => item.id === result.id ? result : item))
    } catch (error) { setMessage(error.message) }
  }

  return <section className="project-collections-page" aria-labelledby="collections-title">
    <div className="project-collections-heading"><span className="section-kicker">YOUR PROJECT LIBRARY</span><h1 id="collections-title">Project collections</h1><p>Group ideas by semester, course, or what you want to learn next.</p></div>
    <form className="collection-create-form" onSubmit={createCollection}>
      <div><label htmlFor="collection-name">Collection name</label><input id="collection-name" value={name} onChange={(event) => setName(event.target.value)} maxLength="60" placeholder="Semester Project" required /></div>
      <div><label htmlFor="collection-description">Description <span>Optional</span></label><input id="collection-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength="240" placeholder="Ideas for this term" /></div>
      <Button type="submit" disabled={busy}><Plus size={16} /> Create collection</Button>
    </form>
    {message && <p className="collection-feedback" role="status">{message}</p>}
    {collections.length ? <div className="collection-list">{collections.map((collection) => <article className="project-collection-item" key={collection.id}>
      <div className="project-collection-item-heading"><div><span className="collection-visibility"><i className={collection.isPublic ? 'is-public' : ''} />{collection.isPublic ? 'SHARED' : 'PRIVATE'}</span><h2>{collection.name}</h2>{collection.description && <p>{collection.description}</p>}</div><Button variant="ghost" size="icon" onClick={() => deleteCollection(collection)} aria-label={`Delete ${collection.name}`} title="Delete collection"><Trash2 size={16} /></Button></div>
      <div className="project-collection-projects">{collection.projects.length ? collection.projects.map((project) => <div className="project-collection-entry" key={project.id || project._id}><Link to={`/projects/${encodeURIComponent(project.id || project._id)}`}><span>{project.category} · {project.difficulty}</span><strong>{project.title}</strong></Link><Button variant="ghost" size="icon" onClick={() => removeProject(collection, project)} aria-label={`Remove ${project.title} from ${collection.name}`} title="Remove from collection"><Trash2 size={14} /></Button></div>) : <p>No projects yet. Add ideas from any project page.</p>}</div>
      <div className="project-collection-actions"><span>{collection.projects.length} {collection.projects.length === 1 ? 'project' : 'projects'}</span><Button variant="outline" onClick={() => updateVisibility(collection)}><Share2 size={15} /> {collection.isPublic ? 'Make private' : 'Create share link'}</Button>{collection.isPublic && <Button variant="ghost" onClick={() => copyShareLink(collection)}><Copy size={15} /> Copy link</Button>}</div>
    </article>)}</div> : <div className="collections-empty"><FolderHeart size={22} /><h2>Your project collections start here.</h2><p>Create a collection, then add ideas from their project pages.</p></div>}
  </section>
}

export function SharedCollectionPage({ shareId }) {
  const [collection, setCollection] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api(`/collections/shared/${encodeURIComponent(shareId)}`).then((result) => { if (active) setCollection(result) }).catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [shareId])

  if (error) return <section className="standalone-page-message"><h2>Collection unavailable</h2><p>{error}</p><Button asChild variant="outline"><Link to="/">Browse ideas</Link></Button></section>
  if (!collection) return <section className="standalone-page-message" aria-live="polite">Loading collection...</section>

  return <section className="project-collections-page shared-collection-page" aria-labelledby="shared-collection-title">
    <div className="project-collections-heading"><span className="section-kicker">SHARED PROJECT COLLECTION</span><h1 id="shared-collection-title">{collection.name}</h1>{collection.description && <p>{collection.description}</p>}</div>
    {collection.projects.length ? <div className="project-collection-projects shared-collection-projects">{collection.projects.map((project) => <Link key={project.id || project._id} to={`/projects/${encodeURIComponent(project.id || project._id)}`}><span>{project.category} · {project.difficulty} · {project.duration}</span><strong>{project.title}</strong><p>{project.description}</p></Link>)}</div> : <div className="collections-empty"><FolderHeart size={22} /><h2>This collection is empty.</h2></div>}
  </section>
}
