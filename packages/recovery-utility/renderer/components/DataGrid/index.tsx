import { ReactNode } from "react";
import { Box } from "@mui/material";
import {
  DataGrid as MuiDataGrid,
  DataGridProps as MuiDataGridProps,
  GridValidRowModel,
  GridToolbarContainer,
  GridToolbarContainerProps,
} from "@mui/x-data-grid";

type Props<R extends GridValidRowModel = any> = MuiDataGridProps<R> & {
  heading?: ReactNode;
};

const GridToolbar = (props: GridToolbarContainerProps) => (
  <GridToolbarContainer
    sx={{
      padding: "8px 8px 16px",
      justifyContent: "space-between",
      ...props.sx,
    }}
    {...props}
  />
);

export const DataGrid = <R extends GridValidRowModel = any>({
  heading,
  ...props
}: Props<R>) => {
  return (
    <Box height="100%" display="flex" flexDirection="column">
      {heading}
      <Box
        height="100%"
        display="flex"
        flexDirection="column"
        padding="8px 8px 0 8px"
        borderRadius="6px"
        sx={{ background: "#FFF" }}
      >
        <MuiDataGrid<R>
          {...props}
          disableSelectionOnClick={props.disableSelectionOnClick ?? true}
          experimentalFeatures={{
            newEditingApi: true,
            ...props.experimentalFeatures,
          }}
          headerHeight={props.headerHeight ?? 0}
          components={{ Toolbar: GridToolbar, ...props.components }}
          sx={{
            background: "#FFF",
            border: 0,
            borderRadius: 0,
            "& .MuiDataGrid-row": {
              borderLeft: "solid 1px #FFF",
              borderRight: "solid 1px #FFF",
              transition: "none",
              ...(props.onRowClick
                ? {
                    cursor: "pointer",
                    "&:hover": {
                      background: "#FFF",
                      boxShadow: "0px 3px 10px 0 rgb(41 51 155 / 15%)",
                      borderRadius: "9px",
                    },
                  }
                : {
                    "&:hover": {
                      background: "rgb(251, 252, 255)",
                      borderLeft: "solid 1px #F0F4FA",
                      borderRight: "solid 1px #F0F4FA",
                      borderRadius: "4px",
                      "& .MuiDataGrid-cell": {
                        borderColor: "#F0F4FA",
                      },
                    },
                  }),
            },
            "& .MuiDataGrid-cell": {
              "&:focus": {
                outline: "none",
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};
