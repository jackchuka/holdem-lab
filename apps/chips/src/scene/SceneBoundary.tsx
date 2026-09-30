import { Component, type ReactNode } from 'react';

// Context creation can still fail after the WebGL probe (blocklisted GPU, too many contexts); show the fallback instead of a blank page.
export class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
