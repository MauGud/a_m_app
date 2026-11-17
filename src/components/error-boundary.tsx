'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useOpsStore } from '@/stores/ops-store';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('Recoverable UI error:', error.message);
    try {
      if (useAuthStore.getState().memberSlot === 'MEMBER_B') {
        useOpsStore.getState().report(`Se trabó la pantalla: ${error.message.slice(0, 160)}`);
      }
    } catch {
      // keep the UI recoverable even if ops is unavailable
    }
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.setState({ hasError: false }), 1200);
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="page-container text-center space-y-4">
        <p className="text-4xl">💕</p>
        <p className="text-gray-600">Algo se trabó, pero ya se puede reintentar.</p>
        <Button
          onClick={() => {
            this.setState({ hasError: false });
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }
}
