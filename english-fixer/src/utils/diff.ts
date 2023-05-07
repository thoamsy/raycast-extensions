import { diffChars, diffWords } from "diff";
import { getPreferenceValues } from "./getPreferenceValues";

export function generateMarkdownDiff(text1: string, text2: string) {
  const { diffWay } = getPreferenceValues();
  const diffMethod = diffWay === "words" ? diffWords : diffChars;
  console.log(diffWay);

  const diff = diffMethod(text1, text2, {
    ignoreCase: true,
  });

  let markdown = "";

  diff.forEach((part) => {
    if (part.added) {
      markdown += `**${part.value}**`;
    } else if (part.removed) {
      markdown += `~~${part.value}~~`;
    } else {
      markdown += part.value;
    }
  });

  console.log(diff);

  return markdown;
}
