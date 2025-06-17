import { Grid, Typography } from '@mui/material';
import { SigningAlgorithms } from '../../../reducers/rawSignReducer';
import { TextField } from '../../TextField';

interface SignatureProps {
  selectedAlgorithm: SigningAlgorithms;
  signature: string;
}

const Signature: React.FC<SignatureProps> = (props) => {
  const { selectedAlgorithm, signature } = props;
  return (
    <Grid
      item
      xs={12}
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexGrow: 1,
        width: '100%',
      }}
    >
      {selectedAlgorithm === SigningAlgorithms.ECDSA ? (
        <Grid
          container
          spacing={2}
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Grid item xs={12}>
            <Typography variant='h6'>ECDSA Signature Components:</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
              Full Signature:
            </Typography>
            <TextField
              id='full-signed'
              enableCopy={true}
              multiline
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                width: '100%',
                padding: 1,
                borderRadius: 1,
              }}
              value={JSON.parse(signature).signature}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
              r:
            </Typography>
            <TextField
              id='r-signed'
              enableCopy={true}
              multiline
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                width: '100%',
                padding: 1,
                borderRadius: 1,
              }}
              value={JSON.parse(signature).r}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
              s:
            </Typography>
            <TextField
              id='s-signed'
              enableCopy={true}
              multiline
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                width: '100%',
                padding: 1,
                borderRadius: 1,
              }}
              value={JSON.parse(signature).s}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
              v:
            </Typography>
            <TextField
              id='v-signed'
              enableCopy={true}
              multiline
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                width: '100%',
                padding: 1,
                borderRadius: 1,
              }}
              value={JSON.parse(signature).v}
            />
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
          <Typography variant='h2' display='flex' alignItems='center'>
            Signature
          </Typography>
          <TextField
            id='signed'
            enableCopy={true}
            multiline
            sx={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              width: '100%',
              padding: 1,
              borderRadius: 1,
            }}
            value={signature}
          />
        </Typography>
      ) : null}
    </Grid>
  );
};

export default Signature;
