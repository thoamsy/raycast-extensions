import { ActionPanel, Action, showToast, Toast, List, Icon, openCommandPreferences, LocalStorage } from "@raycast/api";
import { useState, useEffect } from "react";
import { getResponse } from "./utils/initChat";
import { generateMarkdownDiff } from "./utils/diff";

const searchDraft = "SEARCH_DRAFT";

export default function Command() {
  const [res, setRes] = useState<{ improved: string; reason: string }>({ improved: "", reason: "" });
  const [isSubmiting, setIsSubmiting] = useState(false);

  const [searchText, setSearchText] = useState(() => "");
  const [diff, setDiff] = useState("");

  useEffect(() => {
    async function getDraftSearchText() {
      const draft = (await LocalStorage.getItem(searchDraft)) || "";
      if (draft) {
        setSearchText(String(draft));
      }
    }
    getDraftSearchText();
  }, []);

  const hasDraftButNotSubmit = searchText && !res.improved;

  return (
    <List
      searchText={searchText}
      onSearchTextChange={(text) => {
        setSearchText(text);
        LocalStorage.setItem(searchDraft, text);
      }}
      searchBarPlaceholder="Type the sentence you want to check"
      navigationTitle="English Teacher"
      isLoading={isSubmiting}
      isShowingDetail={!!res.improved || isSubmiting}
    >
      {hasDraftButNotSubmit ? (
        <List.Section title="Draft">
          <List.Item
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
                      console.log(completion);
                      const res = JSON.parse(completion || "{}");
                      setRes(res);
                      setDiff(generateMarkdownDiff(searchText, res.improved));
                      LocalStorage.setItem(searchDraft, "");
                    } finally {
                      setIsSubmiting(false);
                      toast.hide();
                    }
                  }}
                />
              </ActionPanel>
            }
            title={searchText}
          />
        </List.Section>
      ) : searchText ? (
        <List.Section title="History">
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
                    LocalStorage.setItem(searchDraft, searchText);

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
                      LocalStorage.setItem(searchDraft, "");
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
                <Action icon={Icon.Gear} title="Open Extension Preferences" onAction={openCommandPreferences} />
              </ActionPanel>
            }
            detail={
              <List.Item.Detail
                isLoading={isSubmiting}
                markdown={isSubmiting ? "Waiting…" : `### Improved\n${diff}\n### Reason\n${res.reason}`}
              />
            }
          />
        </List.Section>
      ) : (
        <List.EmptyView icon={{ source: Icon.Hammer }} title="Type you sentence and let me fix it" />
      )}
    </List>
  );
}
