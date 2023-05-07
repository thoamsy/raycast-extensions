import {
  ActionPanel,
  Action,
  showToast,
  Toast,
  List,
  Icon,
  openCommandPreferences,
  confirmAlert,
  Alert,
  Color,
} from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { useState } from "react";
import { getResponse } from "./utils/initChat";
import { generateMarkdownDiff } from "./utils/diff";

const SEARCH_DRAFT_KEY = "SEARCH_DRAFT_KEY";
const CONVERSATION_KEY = "CONVERSATION_KEY";
const draftID = "draft";

type Conversation = {
  original: string;
  improved: string;
  explanation: string;
  diff: string;
  correct?: boolean;
};

export default function Command() {
  const [isSubmiting, setIsSubmiting] = useState(false);

  const [searchText, setSearchText] = useCachedState(SEARCH_DRAFT_KEY, "");
  const [conversationHistory, setConversationHistory] = useCachedState<Conversation[]>(CONVERSATION_KEY, []);

  const [isSelectingDraft, setSelectingDraft] = useState(false);
  const [showingDetail, setShowingDetail] = useState<boolean | undefined>();

  return (
    <List
      searchText={searchText}
      onSelectionChange={(id) => {
        setSelectingDraft(id === draftID);
      }}
      onSearchTextChange={(text) => {
        setSearchText(text);
      }}
      searchBarPlaceholder="Type the sentence you want to check"
      navigationTitle="English Teacher"
      isLoading={isSubmiting}
      isShowingDetail={
        typeof showingDetail === "boolean" ? showingDetail : !isSelectingDraft && conversationHistory.length > 0
      }
    >
      {!!searchText && (
        <List.Section title="Draft">
          <List.Item
            id={draftID}
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

                      setConversationHistory((history) => [
                        {
                          diff: generateMarkdownDiff(searchText, res.improved),
                          improved: res.improved,
                          original: searchText,
                          explanation: res.explanation,
                          correct: res.correct,
                        },
                        ...history,
                      ]);
                      setSearchText("");
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
      )}
      {conversationHistory.length > 0 ? (
        <List.Section title="History">
          {conversationHistory.map((conversation, index) => (
            <List.Item
              title={conversation.original}
              key={index}
              accessories={
                conversation.correct
                  ? [{ date: new Date() }, { icon: { tintColor: Color.Green, source: Icon.CheckCircle } }]
                  : []
              }
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                    title="Copy Improved"
                    content={conversation.improved}
                  />
                  <Action
                    title="Show Detail"
                    icon={Icon.AppWindowSidebarRight}
                    shortcut={{ key: "arrowRight", modifiers: ["cmd"] }}
                    onAction={() => {
                      setShowingDetail(true);
                    }}
                  />
                  <Action
                    icon={Icon.AppWindow}
                    title="Hide Detail"
                    shortcut={{ key: "arrowLeft", modifiers: ["cmd"] }}
                    onAction={() => {
                      setShowingDetail(false);
                    }}
                  />
                  <Action
                    shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
                    title="Delete All History"
                    icon={Icon.Trash}
                    onAction={() => {
                      confirmAlert({
                        title: "Are you sure to delete all the history?",
                        primaryAction: {
                          title: "Delete",
                          style: Alert.ActionStyle.Destructive,
                          onAction() {
                            setConversationHistory([]);
                          },
                        },
                      });
                    }}
                  />
                  <Action icon={Icon.Gear} title="Open Extension Preferences" onAction={openCommandPreferences} />
                </ActionPanel>
              }
              detail={
                <List.Item.Detail
                  isLoading={isSubmiting}
                  metadata={
                    conversation.correct ? (
                      <List.Item.Detail.Metadata>
                        <List.Item.Detail.Metadata.Label
                          title="Correct"
                          icon={{ tintColor: Color.Green, source: Icon.CheckCircle }}
                        />
                      </List.Item.Detail.Metadata>
                    ) : undefined
                  }
                  markdown={
                    isSubmiting
                      ? "Waiting…"
                      : `### Improved\n${conversation.diff}\n### Explanation\n${conversation.explanation}`
                  }
                />
              }
            />
          ))}
        </List.Section>
      ) : (
        <List.EmptyView icon={{ source: Icon.Hammer }} title="Type you sentence and let me fix it" />
      )}
    </List>
  );
}
