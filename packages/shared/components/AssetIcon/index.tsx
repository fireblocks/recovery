import React from "react";
import { SvgIcon, SvgIconProps } from "@mui/material";
import { AssetId } from "../../types";

export const FILL_COLOR = "#595C98";

export const rootProps = (
  width = 24,
  height = 24
): Omit<SvgIconProps, "width" | "height"> => ({
  viewBox: `0 0 ${width} ${height}`,
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
});

type IconData = {
  path: string | string[];
  width?: number;
  height?: number;
};

const iconDataMap: Record<AssetId, IconData> = {
  BTC: {
    path: "M20.843 9.646c-.269 1.846-1.271 2.74-2.605 3.054 1.83.972 2.761 2.46 1.874 5.043-1.1 3.207-3.715 3.478-7.191 2.808L12.076 24l-2.039-.518.833-3.404a69.39 69.39 0 0 1-1.625-.43l-.835 3.42-2.037-.519.845-3.456c-.477-.124-.96-.256-1.454-.383l-2.653-.674 1.013-2.38s1.503.408 1.482.378c.578.146.834-.238.934-.494l2.288-9.36c.026-.44-.124-.999-.95-1.208.032-.022-1.48-.375-1.48-.375l.542-2.222 2.812.717-.003.01c.424.107.859.21 1.303.313L11.887 0l2.038.518-.82 3.348c.548.127 1.099.256 1.635.393l.814-3.327 2.038.519-.836 3.417c2.574.9 4.456 2.256 4.087 4.778Zm-8.274-2.465-.871 3.559c.986.25 4.028 1.273 4.52-.74.514-2.1-2.662-2.568-3.65-2.819Zm-1.31 5.355-.96 3.924c1.185.3 4.84 1.497 5.38-.717.564-2.308-3.235-2.905-4.42-3.207Z",
  },
  ETH: {
    path: [
      "m11.771 0-.159.54v15.663l.159.158 7.27-4.297z",
      "M11.771 0 4.5 12.064l7.271 4.297V8.759zm0 17.738-.09.109v5.579l.09.262 7.274-10.246z",
      "M11.771 23.688v-5.95L4.5 13.442zm0-7.327 7.27-4.297-7.27-3.305zM4.5 12.064l7.27 4.297V8.759z",
    ],
    width: 26,
  },
  SOL: {
    path: "M4.898 16.951a.785.785 0 0 1 .556-.229h19.154c.35 0 .525.423.277.67l-3.783 3.784a.785.785 0 0 1-.556.23H1.392a.392.392 0 0 1-.277-.67l3.783-3.785ZM4.898 2.824c.151-.145.35-.229.556-.229h19.154c.35 0 .525.422.277.67l-3.783 3.784a.785.785 0 0 1-.556.229H1.392a.392.392 0 0 1-.277-.67l3.783-3.784ZM21.102 9.843a.785.785 0 0 0-.556-.23H1.392a.392.392 0 0 0-.277.67l3.783 3.784c.145.145.344.23.556.23h19.154c.35 0 .525-.423.277-.67l-3.783-3.784Z",
  },
};

type Props = Omit<SvgIconProps, "width" | "height"> & {
  assetId: AssetId;
};

export const AssetIcon = ({ assetId, ...props }: Props) => {
  const iconData = iconDataMap[assetId];

  if (!iconData) {
    return (
      <SvgIcon {...rootProps()} {...props}>
        <g transform="translate(.5 .5)">
          <circle fill="#595C98" cx="13.5" cy="7.5" r="7.5" />
          <circle fill="#595C98" opacity="0.5" cx="7.5" cy="13.5" r="7.5" />
        </g>
      </SvgIcon>
    );
  }

  const { path, width, height } = iconData;

  return (
    <SvgIcon {...rootProps(width, height)} {...props}>
      {typeof path === "string" ? (
        <path fill={FILL_COLOR} d={path} />
      ) : (
        <g fill={FILL_COLOR}>
          {path.map((path, index) => (
            <path key={index} d={path} />
          ))}
        </g>
      )}
    </SvgIcon>
  );
};
