import { SvgIcon, SvgIconProps } from "@mui/material";

type Props = SvgIconProps<"svg", { active: boolean }>;

const getFills = (active: boolean) =>
  active
    ? {
        primaryFill: "#0348A2",
        secondaryFill: "#89B2FF",
      }
    : {
        primaryFill: "#747382",
        secondaryFill: "#CBCCCF",
      };

export const AccountsIcon = ({ active, ...props }: Props) => {
  const { primaryFill, secondaryFill } = getFills(active);

  return (
    <SvgIcon viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g>
        <path fill={secondaryFill} d="M6.5.5h15v15h-15z" />
        <path fill={primaryFill} d="M.5 6.5h15v15H.5z" />
      </g>
    </SvgIcon>
  );
};

export const AssetsIcon = ({ active, ...props }: Props) => {
  const { primaryFill, secondaryFill } = getFills(active);

  return (
    <SvgIcon viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g transform="translate(.5 .5)">
        <circle fill={primaryFill} cx="13.5" cy="7.5" r="7.5" />
        <circle fill={secondaryFill} cx="7.5" cy="13.5" r="7.5" />
      </g>
    </SvgIcon>
  );
};
