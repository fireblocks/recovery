import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Typography } from '@mui/material';
import { monospaceFontFamily } from '../../theme';
import { BaseModal } from '../BaseModal';
import { Button } from '../Button';

type Props = { children: ReactNode };

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = { error: null };
  }

  static onClose() {
    window.location.reload();
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error({ error, errorInfo });
  }

  render() {
    const { children } = this.props;
    const { error } = this.state;

    if (error) {
      return (
        <BaseModal
          open
          onClose={ErrorBoundary.onClose}
          title='Error'
          actions={
            <Button variant='text' onClick={ErrorBoundary.onClose}>
              Reload
            </Button>
          }
        >
          <Typography fontFamily={monospaceFontFamily} whiteSpace='pre-wrap'>
            {error.message}
          </Typography>
        </BaseModal>
      );
    }

    return children;
  }
}
