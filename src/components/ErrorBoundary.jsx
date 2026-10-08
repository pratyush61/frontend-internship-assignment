import { Component } from 'react';
import { clearSession } from '../lib/storage.js';

/** Last line of defence: a render bug shows a recovery screen instead of a blank page. */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Unhandled render error:', error);
  }

  reset = () => {
    clearSession(); // a bad saved session could be what keeps crashing the app
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app">
        <div className="panel status error" role="alert">
          <div>
            <h2>Something broke in the app</h2>
            <p>Reloading usually fixes it. If it keeps happening, reset your saved session.</p>
          </div>
          <button type="button" className="secondary" onClick={this.reset}>Reset and reload</button>
        </div>
      </div>
    );
  }
}
