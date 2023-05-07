import { diffChars, diffWords, diffSentences } from "diff";
import { getPreferenceValues, PreferenceValues } from "./getPreferenceValues";

const diffMethods: Record<PreferenceValues["diffWay"], typeof diffChars> = {
  chars: diffChars,
  sentences: diffSentences,
  words: diffWords,
};

export function generateMarkdownDiff(text1: string, text2: string) {
  if (!text1 || !text2) {
    return "";
  }
  const { diffWay, ignoreCase = true } = getPreferenceValues();
  const diffMethod = diffMethods[diffWay];

  const diff = diffMethod(text1, text2, {
    ignoreCase,
  });

  let markdown = "";

  diff.forEach((part) => {
    const prefixSymbol = part.value.match(/^\s+/)?.[0] ?? "";
    const suffixSymbol = part.value.match(/\s+$/)?.[0] ?? "";

    if (part.value.length === 1 && /\p{P}/u.test(part.value)) {
      markdown += part.value;
    } else if (part.added) {
      markdown += prefixSymbol + `**${part.value.trim()}**` + suffixSymbol;
    } else if (part.removed) {
      markdown += prefixSymbol + `~~${part.value.trim()}~~` + suffixSymbol;
    } else {
      markdown += part.value;
    }
  });

  return markdown;
}
