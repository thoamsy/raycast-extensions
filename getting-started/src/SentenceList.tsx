import { ActionPanel, Action, showToast, Toast, List, Detail } from "@raycast/api";
import { useState } from "react";
import { getResponse } from "./utils/initChat";
import { generateMarkdownDiff } from "./utils/diff";

export default function Command() {
  const [improved, setImproved] = useState("");
  const [isSubmiting, setIsSubmiting] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [diff, setDiff] = useState("");

  return (
    <List
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Type the sentence you want to check"
      navigationTitle="English Teacher"
      isLoading={isSubmiting}
      isShowingDetail={!!improved || isSubmiting}
      // actions={
      //   <ActionPanel>
      //   </ActionPanel>
      // }
    >
      {searchText && (
        <List.Item
          title={searchText}
          actions={
            <ActionPanel>
              <Action.SubmitForm
                title="Submit"
                onSubmit={async () => {
                  if (isSubmiting) {
                    return;
                  }
                  setIsSubmiting(true);
                  const toast = await showToast({
                    style: Toast.Style.Animated,
                    title: "Asking…",
                  });
                  const completion = await getResponse(searchText);
                  const res = JSON.parse(completion || "{}");
                  setImproved(res.improved);
                  console.log(generateMarkdownDiff(searchText, res.improved));
                  setDiff(generateMarkdownDiff(searchText, res.improved));
                  setIsSubmiting(false);
                  toast.hide();
                }}
              />
              <Action.CopyToClipboard
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                title="Copy Improved"
                content={improved}
              />
            </ActionPanel>
          }
          detail={
            <List.Item.Detail isLoading={isSubmiting} markdown={`### Improved\n${improved}\n### Diff\n${diff}\n`} />
          }
        />
      )}
    </List>
  );
}
