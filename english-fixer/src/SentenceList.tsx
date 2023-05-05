import { ActionPanel, Action, showToast, Toast, List, Icon } from "@raycast/api";
import { useState } from "react";
import { getResponse } from "./utils/initChat";
import { generateMarkdownDiff } from "./utils/diff";

export default function Command() {
  const [res, setRes] = useState<{ improved: string; reason: string }>({ improved: "", reason: "" });
  const [isSubmiting, setIsSubmiting] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [diff, setDiff] = useState("");

  return (
    <List
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Type the sentence you want to check"
      navigationTitle="English Teacher"
      isLoading={isSubmiting}
      isShowingDetail={!!res.improved || isSubmiting}
    >
      {searchText ? (
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
                  try {
                    const completion = await getResponse(searchText);
                    const res = JSON.parse(completion || "{}");
                    console.log(res);
                    setRes(res);
                    setDiff(generateMarkdownDiff(searchText, res.improved));
                  } finally {
                    setIsSubmiting(false);
                    toast.hide();
                  }
                }}
              />
              <Action.CopyToClipboard
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                title="Copy Improved"
                content={res.improved}
              />
            </ActionPanel>
          }
          detail={
            <List.Item.Detail
              isLoading={isSubmiting}
              markdown={isSubmiting ? "Waiting…" : `### Improved\n${diff}\n### Reason\n${res.reason}`}
            />
          }
        />
      ) : (
        <List.EmptyView icon={{ source: Icon.Hammer }} title="Type you sentence and let me fix it" />
      )}
    </List>
  );
}
