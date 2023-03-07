import React, { ReactNode } from "react";
import { EMOTION_INSERTION_POINT_NAME } from "../../constants";

type Props = {
  styleTags: ReactNode;
};

export function EmotionHeadTags({ styleTags }: Props) {
  return (
    <>
      <meta name={EMOTION_INSERTION_POINT_NAME} content="" />
      {styleTags}
    </>
  );
}
