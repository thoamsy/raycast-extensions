import { getPreferenceValues as get } from "@raycast/api";

export interface PreferenceValues {
  openAIKey: string;
  diffWay: "words" | "chars" | "sentences";
  ignoreCase?: boolean;
}

export const getPreferenceValues = () => get<PreferenceValues>();
