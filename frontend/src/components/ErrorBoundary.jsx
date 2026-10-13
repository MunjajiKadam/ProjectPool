import { Component } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return <main className="error-fallback"><span>PROJECTPOOL</span><h1>This page hit a snag.</h1><p>Your project ideas are still here. Reload the view to continue.</p><Button onClick={() => this.setState({ failed: false })}><RotateCcw size={15} /> Try again</Button></main>
    return this.props.children
  }
}