import { Grid, Typography } from '@mui/material';
import { SigningAlgorithms } from '../../../reducers/rawSignReducer';

interface SignedMessageProps {
  selectedAlgorithm: SigningAlgorithms;
  signedMessage: string;
}

const SignedMessage: React.FC<SignedMessageProps> = (props) => {
  const { selectedAlgorithm, signedMessage } = props;
  return (
    <>
      {selectedAlgorithm === SigningAlgorithms.ECDSA ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant='h6'>ECDSA Signature Components:</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
              Full Signature:
            </Typography>
            <Typography
              variant='body2'
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                width: '100%',
                padding: 1,
                borderRadius: 1,
              }}
            >
              {JSON.parse(signedMessage).signature}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
              r:
            </Typography>
            <Typography
              variant='body2'
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                padding: 1,
                borderRadius: 1,
              }}
            >
              {JSON.parse(signedMessage).r}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
              s:
            </Typography>
            <Typography
              variant='body2'
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                padding: 1,
                borderRadius: 1,
              }}
            >
              {JSON.parse(signedMessage).s}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
              v:
            </Typography>
            <Typography
              variant='body2'
              sx={{
                padding: 1,
                borderRadius: 1,
              }}
            >
              {JSON.parse(signedMessage).v}
            </Typography>
          </Grid>
        </Grid>
      ) : selectedAlgorithm === SigningAlgorithms.EDDSA ? (
        <Typography
          variant='body1'
          sx={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            width: '100%',
          }}
          paragraph
        >
          {signedMessage}
        </Typography>
      ) : null}
    </>
  );
};

export default SignedMessage;
