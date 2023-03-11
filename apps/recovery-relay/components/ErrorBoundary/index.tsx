import { Component, ReactNode, ErrorInfo } from 'react';
import { Dialog, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

type Props = { children: ReactNode };

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error({ error, errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <Dialog open aria-labelledby='error-dialog-title' aria-describedby='error-dialog-description'>
          <DialogTitle sx={{ typography: 'h4' }} id='error-dialog-title'>
            Error
          </DialogTitle>
          <DialogContent sx={{ minWidth: '400px' }}>
            <DialogContentText id='error-dialog-description'>{this.state.error.message}</DialogContentText>
          </DialogContent>
        </Dialog>
      );
    }

    return this.props.children;
  }
}
