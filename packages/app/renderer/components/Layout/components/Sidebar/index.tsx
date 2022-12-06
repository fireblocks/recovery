import { ComponentType, ReactNode } from "react";
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
import { assets } from "../../../../lib/assetInfo";

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
        {assets.map(({ id, name, Icon }) => (
          <ListItem key={id} disablePadding>
            <ListItemButton
              component={NextLinkComposed}
              selected={selectedAssetId === id}
              to={{
                pathname: "/assets/[assetId]",
                query: { assetId: id },
              }}
            >
              <ListItemIcon sx={{ minWidth: "42px" }}>
                <Icon />
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
