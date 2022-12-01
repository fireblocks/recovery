import { SvgIcon, SvgIconProps } from "@mui/material";

type Props = SvgIconProps;

export const EthereumIcon = (props: Props) => (
  <SvgIcon
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g fill="#595C98">
      <path d="m11.771 0-.159.54v15.663l.159.158 7.27-4.297z" />
      <path d="M11.771 0 4.5 12.064l7.271 4.297V8.759zm0 17.738-.09.109v5.579l.09.262 7.274-10.246z" />
      <path d="M11.771 23.688v-5.95L4.5 13.442zm0-7.327 7.27-4.297-7.27-3.305zM4.5 12.064l7.27 4.297V8.759z" />
    </g>
  </SvgIcon>
);
