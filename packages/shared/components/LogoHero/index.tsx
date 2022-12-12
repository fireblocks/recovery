import React from "react";
import { Box, BoxProps, Typography, SvgIcon } from "@mui/material";
import { Restore } from "@mui/icons-material";
import { Logo } from "../Logo";

type Props = Omit<BoxProps, "title"> & {
  title: string;
  description: string;
  icon?: typeof SvgIcon;
};

export const LogoHero = ({
  title,
  description,
  icon: Icon = Restore,
  ...props
}: Props) => (
  <Box {...props}>
    <Typography color={(theme) => theme.palette.primary.main}>
      <Logo width={150} />
    </Typography>
    <Box display="flex" alignItems="center" marginBottom="1rem">
      <Typography
        component="div"
        variant="h1"
        fontSize="30px"
        position="relative"
        left="-4px"
        margin="0 2px 0 0"
      >
        <Icon fontSize="inherit" sx={{ lineHeight: "0" }} />
      </Typography>
      <Typography variant="h1" margin="0" position="relative" top="-3px">
        {title}
      </Typography>
    </Box>
    <Typography variant="body1">{description}</Typography>
  </Box>
);
