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
import { runAppleScript } from "run-applescript";
import { getResponse } from "./utils/initChat";
import { generateMarkdownDiff } from "./utils/diff";

const CONVERSATION_KEY = "CONVERSATION_KEY";

// const dateGroups = ["Today", "Last 3 days", "Last Week", "Older"];

// add date to supporting the section
export type Conversation = {
  original: string;
  improved: string;
  explanation: string;
  correct?: boolean;
  error?: string;
};

// need Date
export default function SentenceList() {
  const [isSubmiting, setIsSubmiting] = useState(false);

  // TODO: save up to 50 history
  const [conversationHistory, setConversationHistory] = useCachedState<Conversation[]>(CONVERSATION_KEY, []);

  const [selectedId, setSelectedId] = useState("");

  const [showingDetail, setShowingDetail] = useState(true);

  const onAskingChatGPT = async (originalText: string, index: number) => {
    if (isSubmiting) {
      return;
    }

    setIsSubmiting(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Rechecking…",
    });

    try {
      const completion = await getResponse(originalText);
      console.log(completion);
      const res = JSON.parse(completion || "{}");

      const newConversation = {
        original: originalText,
        improved: res.improved,
        explanation: res.explanation,
        correct: res.correct,
      };

      setConversationHistory((history) => {
        const copied = [...history];
        copied.splice(index ?? 0, 1, newConversation);
        return copied;
      });

      return true;
    } catch (error) {
      setConversationHistory((history) => {
        const copied = [...history];
        copied.splice(index ?? 0, 1, { ...copied[index], error: (error as Error).message });
        return copied;
      });
      return false;
    } finally {
      setIsSubmiting(false);
      toast.hide();
    }
  };

  const speakerIcon = { icon: { tintColor: Color.Blue, source: Icon.SpeakerHigh }, tooltip: "Speak" };

  return (
    <List
      onSelectionChange={(id) => {
        if (id) {
          setSelectedId(id);
        }
      }}
      navigationTitle="History"
      isLoading={isSubmiting}
      isShowingDetail={showingDetail}
    >
      {conversationHistory.length > 0 ? (
        <List.Section title="History">
          {conversationHistory.map((conversation, index) => {
            const diff = selectedId.endsWith("" + index)
              ? generateMarkdownDiff(conversation.original, conversation.improved)
              : "";
            return (
              <List.Item
                title={conversation.original}
                id={"history-" + index}
                key={index}
                accessories={
                  conversation.correct
                    ? [{ icon: { tintColor: Color.Green, source: Icon.CheckCircle } }, speakerIcon]
                    : [speakerIcon]
                }
                actions={
                  <ActionPanel>
                    <Action.CopyToClipboard
                      shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                      title="Copy Improved"
                      content={conversation.improved}
                    />
                    <Action
                      onAction={() => onAskingChatGPT(conversation.original, index)}
                      icon={Icon.RotateClockwise}
                      title="Recheck"
                    />
                    <ActionPanel.Section title="Speak">
                      <Action
                        shortcut={{ modifiers: ["cmd"], key: "s" }}
                        title="Speak Improved"
                        icon={Icon.SpeakerHigh}
                        onAction={() => {
                          runAppleScript(`say "${conversation.improved.replace(/"/g, "")}"`);
                        }}
                      />
                      <Action
                        shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
                        title="Speak Explanation"
                        icon={Icon.SpeakerHigh}
                        onAction={() => {
                          runAppleScript(`say "${conversation.explanation.replace(/"/g, "")}"`);
                        }}
                      />
                    </ActionPanel.Section>
                    <ActionPanel.Section title="Detail">
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
                    </ActionPanel.Section>
                    <ActionPanel.Section title="Delete">
                      <Action
                        onAction={() =>
                          setConversationHistory((history) => {
                            const copied = history.slice();
                            copied.splice(index, 1);
                            return copied;
                          })
                        }
                        shortcut={{ modifiers: ["cmd"], key: "delete" }}
                        icon={Icon.Trash}
                        title="Delete This Conversation"
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
                    </ActionPanel.Section>
                    <Action icon={Icon.Gear} title="Open Extension Preferences" onAction={openCommandPreferences} />
                  </ActionPanel>
                }
                detail={
                  <List.Item.Detail
                    isLoading={isSubmiting}
                    metadata={
                      conversation.correct && !isSubmiting ? (
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
                        : conversation.error || `### Improved\n${diff}\n### Explanation\n${conversation.explanation}`
                    }
                  />
                }
              />
            );
          })}
        </List.Section>
      ) : (
        <List.EmptyView icon={{ source: Icon.Hammer }} title="Type you sentence and let me fix it" />
      )}
    </List>
  );
}
