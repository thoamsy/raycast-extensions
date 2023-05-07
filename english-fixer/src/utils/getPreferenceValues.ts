import { getPreferenceValues as get } from "@raycast/api";

interface PreferenceValues {
  openAIKey: string;
  diffWay: "words" | "chars";
}

export const getPreferenceValues = () => get<PreferenceValues>();
