import { getPreferenceValues as get } from "@raycast/api";

export const DIFF_WAYS = ["words", "chars", "sentences"] as const;
export interface PreferenceValues {
  openAIKey: string;
  diffWay: (typeof DIFF_WAYS)[number];
  ignoreCase?: boolean;
}

export const getPreferenceValues = () => get<PreferenceValues>();
