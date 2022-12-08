import React from "react";
import { EMOTION_INSERTION_POINT_NAME } from "../../constants";

export const EmotionHeadTags = ({ emotionStyleTags }: any) => (
  <>
    <meta name={EMOTION_INSERTION_POINT_NAME} content="" />
    {emotionStyleTags}
  </>
);
