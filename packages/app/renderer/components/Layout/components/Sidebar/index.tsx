import { useMemo, ReactNode } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { NextLinkComposed } from "../../../Link";
import { useRouter } from "next/router";
import { getAssetIcon, getAssetName } from "../../../../lib/assetInfo";

type AssetInfo = {
  assetId: string;
  name: string;
  icon: ReactNode;
};

const assetIds = ["BTC", "ETH", "SOL"];

const assetsInfo = assetIds.map<AssetInfo>((assetId) => ({
  assetId,
  name: getAssetName(assetId),
  icon: getAssetIcon(assetId),
}));

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
        {assetsInfo.map(({ assetId, name, icon }) => (
          <ListItem key={assetId} disablePadding>
            <ListItemButton
              component={NextLinkComposed}
              selected={selectedAssetId === assetId}
              to={{
                pathname: "/[assetId]",
                query: { assetId },
              }}
            >
              <ListItemIcon sx={{ minWidth: "42px" }}>{icon}</ListItemIcon>
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
