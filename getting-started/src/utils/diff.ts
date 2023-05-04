import { diffChars } from "diff";

export function generateMarkdownDiff(text1: string, text2: string) {
  const diff = diffChars(text1, text2, {
    ignoreCase: true,
  });
  console.log(diff);

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

  return markdown;
}
