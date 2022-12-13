import React from "react";
import { EMOTION_INSERTION_POINT_NAME } from "../../constants";

export const EmotionHeadTags = ({ styleTags }: any) => (
  <>
    <meta name={EMOTION_INSERTION_POINT_NAME} content="" />
    {styleTags}
  </>
);
