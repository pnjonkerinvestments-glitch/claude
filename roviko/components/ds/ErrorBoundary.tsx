'use client';
import React from 'react';
import { ErrorState } from './States';

/**
 * A safety net (1.39): when a piece of the page fails to load (a lazy chunk after a new release, a bad network)
 * or throws while drawing, the player sees Roviko with "Reload" instead of an empty screen. `resetKey` (the path)
 * clears the error when the player moves to another page.
 */
export class ErrorBoundary extends React.Component<{ resetKey: string; title: string; copy: string; retry: string; children: React.ReactNode }, { failed: boolean; key: string }> {
  state = { failed: false, key: this.props.resetKey };
  static getDerivedStateFromError() { return { failed: true }; }
  static getDerivedStateFromProps(props: { resetKey: string }, state: { failed: boolean; key: string }) { return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null; }
  componentDidCatch(error: unknown) { try { console.error('Roviko screen failed', error); } catch { /* ignore */ } }
  render() {
    if (!this.state.failed) return this.props.children;
    return <ErrorState title={this.props.title} copy={this.props.copy} onRetry={() => window.location.reload()} retryLabel={this.props.retry}/>;
  }
}
