import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { AssetIcon, NextLinkComposed, assets } from "shared";
import { useRouter } from "next/router";
import { pythonServerUrlParams } from "../../../../lib/pythonClient";

export const Sidebar = () => {
  const router = useRouter();

  const selectedAssetId = router.query.assetId as string | undefined;

  return (
    <Box
      component="aside"
      gridArea="sidebar"
      sx={{ backgroundColor: "#FFFFFF" }}
    >
      <List component="nav" disablePadding>
        {assets.map(({ id, name }) => (
          <ListItem key={id} disablePadding>
            <ListItemButton
              component={NextLinkComposed}
              selected={selectedAssetId === id}
              to={{
                pathname: "/assets/[assetId]",
                query: { ...pythonServerUrlParams, assetId: id },
              }}
            >
              <ListItemIcon sx={{ minWidth: "42px" }}>
                <AssetIcon assetId={id} />
              </ListItemIcon>
              <ListItemText
                primary={name}
                primaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
