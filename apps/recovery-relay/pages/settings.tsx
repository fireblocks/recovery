import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, settingsInput, getLogger, DataGrid, useWrappedState } from '@fireblocks/recovery-shared';
import { Alert, Box, Grid, Typography } from '@mui/material';
import { LOGGER_NAME_RELAY } from '@fireblocks/recovery-shared/constants';
import { shell, ipcRenderer } from 'electron';
import { BaseModal, EditIcon, KeyIcon, TextField } from '@fireblocks/recovery-shared/components';
import { GridActionsCellItem, GridCellParams, GridColDef, GridToolbar } from '@mui/x-data-grid';
import React, { useMemo, useState } from 'react';
import { useSettings } from '../context/Settings';
import { defaultRPCs } from '../lib/defaultRPCs';

type FormData = z.infer<(typeof settingsInput)['RELAY']>;

type RowData = {
  id: string;
  bc: string;
  url: string | undefined | null;
  name: string;
  enabled: boolean;
  allowedEmptyValue: boolean;
  requiresApiKey?: boolean;
  apiKey?: string | null;
};

const logger = getLogger(LOGGER_NAME_RELAY);

const Settings = () => {
  const { saveSettings, RPCs: currentRPCs } = useSettings();
  const [editModalData, setEditModalData] = useWrappedState<RowData | undefined>('settingsRpc-editModalData', undefined);
  const [addAPIKeyModalData, setAddAPIKeyModalData] = useWrappedState<RowData | undefined>(
    'settingsRpc-addAPIKeyModalData',
    undefined,
  );
  const [rpcs, setRPCs] = useState<
    Record<
      string,
      {
        name: string;
        enabled: boolean;
        allowedEmptyValue: boolean;
        url?: string | null | undefined;
        requiresApiKey?: boolean;
        apiKey?: string | null;
      }
    >
  >(currentRPCs);
  const downloadLogs = async () => {
    shell.openPath(await ipcRenderer.invoke('logs/get_path'));
  };

  // Form for URL editing
  const {
    register: registerUrl,
    handleSubmit: handleSubmitUrl,
    formState: { errors: urlErrors },
  } = useForm<FormData>({
    resolver: zodResolver(settingsInput.RELAY),
    defaultValues: {
      RPCs: currentRPCs,
    },
  });

  // Form for API Key editing
  const {
    register: registerApiKey,
    handleSubmit: handleSubmitApiKey,
    formState: { errors: apiKeyErrors },
  } = useForm<FormData>({
    resolver: zodResolver(settingsInput.RELAY),
    defaultValues: {
      RPCs: currentRPCs,
    },
  });

  const rows = useMemo(
    () =>
      Object.keys(rpcs)
        .map((chain) => {
          const { url, name, enabled, allowedEmptyValue, requiresApiKey, apiKey } = rpcs[chain];
          if (name === undefined) {
            throw new Error(`Blockchain without name`);
          }
          return [
            {
              id: `${chain}`,
              bc: name,
              url: enabled ? url : 'No support for this network',
              enabled,
              allowedEmptyValue,
              requiresApiKey,
              apiKey,
            },
          ];
        })
        .reduce((last, current) => {
          current.forEach((x) => last.push(x));
          return last;
        }, [])
        .sort((a, b) => a.bc.localeCompare(b.id)),
    [rpcs],
  );

  const handleOpenEditModal = (rowInfo: RowData | undefined) => {
    console.log(rowInfo);
    setEditModalData(rowInfo);
  };

  const handleAddAPIKeyModal = (rowInfo: RowData | undefined) => {
    console.log(rowInfo);
    setAddAPIKeyModalData(rowInfo);
  };

  const handleCloseEditModal = () => {
    setEditModalData(undefined);
  };

  const handleCloseAddAPIKeyModal = () => {
    setAddAPIKeyModalData(undefined);
  };

  const onSubmitModal = async (formData: FormData) => {
    handleCloseEditModal();
    handleCloseAddAPIKeyModal();
    setRPCs(formData.RPCs);
    await saveSettings(formData);
  };

  const getReactHookDotNotationPropertyAccess = (): `RPCs` | `RPCs.${string}` => {
    if (editModalData === undefined) return 'RPCs';
    const blockchain = editModalData.id;
    return `RPCs.${blockchain}.url`;
  };

  const getApiKeyReactHookDotNotationPropertyAccess = (): `RPCs` | `RPCs.${string}` => {
    if (addAPIKeyModalData === undefined) return 'RPCs';
    const blockchain = addAPIKeyModalData.id;
    return `RPCs.${blockchain}.apiKey`;
  };

  const getApiKeyErrorMessage = (): string | undefined => {
    if (addAPIKeyModalData === undefined) return undefined;
    const blockchain = addAPIKeyModalData.id;
    const apiKeyError = apiKeyErrors.RPCs?.[blockchain]?.apiKey;
    return apiKeyError?.message;
  };

  const getErrorMessage = (): string | undefined => {
    const dotNotationPropertyAccess = getReactHookDotNotationPropertyAccess().replace('.url', '.root');
    let currentProperty: any = urlErrors;
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const property of dotNotationPropertyAccess.split('.')) {
      currentProperty = currentProperty[property];
      if (currentProperty === undefined) {
        return undefined;
      }
    }
    return currentProperty.message;
  };
  return (
    <Box component='form' display='flex' height='100%' flexDirection='column'>
      <Typography variant='h1'>Settings</Typography>
      <Grid container spacing={2} paddingBottom='1rem'>
        <Grid item xs={12}>
          <Typography variant='h2'>Logs</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button type='submit' size='large' variant='outlined' fullWidth color='primary' onClick={downloadLogs}>
                Show Logs
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography variant='h2'>Blockchain RPCs</Typography>
          <Box
            sx={{
              '& .disabled': {
                backgroundColor: '#d9d9d9',
              },
            }}
          >
            <DataGrid
              rows={rows}
              rowSelection={false}
              disableColumnMenu
              disableColumnFilter
              disableColumnSelector
              disableDensitySelector
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  csvOptions: { disableToolbarButton: true },
                  printOptions: { disableToolbarButton: true },
                  showQuickFilter: true,
                },
              }}
              columns={
                [
                  {
                    field: 'bc',
                    headerName: 'Blockchain',
                    type: 'string',
                    editable: false,
                    sortable: true,
                    filterable: true,
                    flex: 1,
                    cellClassName: 'bc-name',
                    getApplyQuickFilterFn: (search: string) => (params) =>
                      params.row.bc.toLowerCase().includes(search.toLowerCase()) ||
                      params.row.id.toLowerCase().includes(search.toLowerCase()),
                  },
                  {
                    field: 'url',
                    headerName: 'URL',
                    type: 'string',
                    editable: false,
                    sortable: false,
                    flex: 1,
                    cellClassName: (params: GridCellParams<any, number>) => (params.row.enabled ? '' : 'disabled'),
                  },
                  {
                    field: 'edit',
                    headerName: '',
                    type: 'actions',
                    editable: false,
                    sortable: false,
                    getActions: (params) => [
                      <GridActionsCellItem
                        key={`update-${params.row.id}`}
                        id={`update-${params.row.id}`}
                        icon={<EditIcon />}
                        disabled={!params.row.enabled}
                        label='Edit'
                        onClick={() => handleOpenEditModal(params.row as RowData)}
                      />,
                    ],
                  },
                  {
                    field: 'api-key',
                    headerName: '',
                    type: 'actions',
                    editable: false,
                    sortable: false,
                    getActions: (params) => [
                      <GridActionsCellItem
                        key={`update-api-key-${params.row.id}`}
                        id={`update-api-key-${params.row.id}`}
                        icon={<KeyIcon />}
                        disabled={!params.row.enabled || !params.row.requiresApiKey}
                        label='Edit Api Key'
                        onClick={() => handleAddAPIKeyModal(params.row as RowData)}
                      />,
                    ],
                  },
                ] as GridColDef[]
              }
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 5 },
                },
              }}
              pageSizeOptions={[5, 10, 20]}
            />{' '}
          </Box>
        </Grid>
      </Grid>
      <BaseModal
        open={editModalData !== undefined}
        onClose={handleCloseEditModal}
        title={`Edit ${editModalData?.bc} RPC Data`}
        actions={
          <>
            <Button variant='text' onClick={handleCloseEditModal}>
              Cancel
            </Button>
            <Button type='submit'>Save</Button>
          </>
        }
        // eslint-disable-next-line react/no-unstable-nested-components
        WrapperComponent={(props) => <form onSubmit={handleSubmitUrl(onSubmitModal)} {...props} />}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Grid item xs={12}>
              {editModalData?.allowedEmptyValue && (
                <Alert severity='info' style={{ borderRadius: '2em' }}>
                  URL can be left empty, but if withdrawal is attempted we will request a URL or relevant API key to use
                </Alert>
              )}
              <TextField
                id={`edit-${editModalData?.id}`}
                label={`${editModalData?.bc} RPC URL`}
                defaultValue={editModalData?.url}
                error={getErrorMessage()}
                {...registerUrl(getReactHookDotNotationPropertyAccess())}
              />
            </Grid>
          </Grid>
        </Grid>
      </BaseModal>

      <BaseModal
        open={addAPIKeyModalData !== undefined}
        onClose={handleCloseAddAPIKeyModal}
        title={`Add ${addAPIKeyModalData?.bc} API Key`}
        actions={
          <>
            <Button variant='text' onClick={handleCloseAddAPIKeyModal}>
              Cancel
            </Button>
            <Button type='submit'>Save</Button>
          </>
        }
        WrapperComponent={(props) => <form onSubmit={handleSubmitApiKey(onSubmitModal)} {...props} />}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              id={`edit-api-key-${addAPIKeyModalData?.id}`}
              label={`${addAPIKeyModalData?.bc} API Key`}
              defaultValue={addAPIKeyModalData?.apiKey || ''}
              error={getApiKeyErrorMessage()}
              {...registerApiKey(getApiKeyReactHookDotNotationPropertyAccess())}
            />
          </Grid>
        </Grid>
      </BaseModal>
    </Box>
  );
};

export default Settings;
