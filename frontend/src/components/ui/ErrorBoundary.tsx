import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-container flex flex-col items-center justify-center min-h-dvh gap-4 px-6 text-center bg-[#FAF9F6]">
          <div className="text-5xl">😕</div>
          <h2 className="font-manrope font-bold text-xl text-[#24332F]">Something went wrong</h2>
          <p className="text-sm text-[#77817C]">{this.state.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.href = '/discover' }}
            className="mt-2 px-6 py-2.5 bg-[#236B63] text-white rounded-2xl text-sm font-semibold font-manrope"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
