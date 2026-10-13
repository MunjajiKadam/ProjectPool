import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './projectpool.css'
import App from './ProjectPool.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary><BrowserRouter><App /></BrowserRouter></ErrorBoundary>
  </StrictMode>,
)
