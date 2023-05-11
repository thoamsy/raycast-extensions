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
import { useState, useEffect } from "react";
import { getResponseStream, IMPROVED_HEADLINE } from "./utils/initChat";
import { PreferenceValues, DIFF_WAYS } from "./utils/getPreferenceValues";

import { generateMarkdownDiff } from "./utils/diff";
// import { runAppleScript } from "run-applescript";

const CONVERSATION_KEY = "CONVERSATION_KEY";

// const dateGroups = ["Today", "Last 3 days", "Last Week", "Older"];

// add date to supporting the section
export type Conversation = {
  original: string;
  improved?: string;
  explanation?: string;
  responseMarkdown: string;
  correct?: boolean;
  error?: string;
  diffWay?: PreferenceValues["diffWay"];
};

const improvedPattern = new RegExp(`^### ${IMPROVED_HEADLINE}\\n([\\s\\S]*?)(?=\\n###|$)`);
const isCorrectPattern = new RegExp("```correct```", "i");

// need Date
export default function SentenceList({ askingSentences }: { askingSentences?: string }) {
  const [isSubmiting, setIsSubmiting] = useState(false);

  // TODO: save up to 50 history
  const [conversationHistory, setConversationHistory] = useCachedState<Conversation[]>(CONVERSATION_KEY, []);

  const [selectedId, setSelectedId] = useState("");
  const [showingDetail, setShowingDetail] = useState(true);
  const [chatGPTResponse, setChatGPTResponse] = useState("");

  const fetchChatGPTResponse = async ({
    sentences,
    toastTitle,
    onSuccess,
    onError,
  }: {
    sentences: string;
    toastTitle: string;
    onSuccess: (c: Conversation) => void;
    onError?(e: Error): void;
  }) => {
    setIsSubmiting(true);
    const toast = showToast({
      style: Toast.Style.Animated,
      title: toastTitle,
    });
    try {
      const generator = await getResponseStream(sentences);
      let result = "";
      for await (const token of generator) {
        result += token;
        setChatGPTResponse((prev) => prev + token);
      }

      setChatGPTResponse(result.replace(isCorrectPattern, ""));
      onSuccess({
        responseMarkdown: result.replace(isCorrectPattern, ""),
        original: sentences,
        correct: /```correct```$/i.test(result),
      });
    } catch (error) {
      onError?.(error as Error);
    } finally {
      (await toast).hide();
      setIsSubmiting(false);
    }
  };

  const onAskingChatGPT = (originalText: string, index: number) => {
    if (isSubmiting) {
      return;
    }

    return fetchChatGPTResponse({
      sentences: originalText,
      toastTitle: "Rechecking…",
      onSuccess: (updatedConversation) => {
        setConversationHistory((history) => {
          const copied = [...history];
          copied.splice(index ?? 0, 1, updatedConversation);
          return copied;
        });
      },
      onError(error) {
        setConversationHistory((history) => {
          const copied = [...history];
          copied.splice(index ?? 0, 1, { ...copied[index], error: error.message });
          return copied;
        });
      },
    });
  };

  const speakerIcon = { icon: { tintColor: Color.Blue, source: Icon.SpeakerHigh }, tooltip: "Speak" };

  useEffect(() => {
    async function updateDetail() {
      if (!askingSentences) {
        return;
      }
      return fetchChatGPTResponse({
        sentences: askingSentences,
        toastTitle: "Asking…",
        onSuccess(newConversation) {
          setConversationHistory((history) => [newConversation, ...history]);
        },
      });
    }
    updateDetail();
  }, [askingSentences]);

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
      {askingSentences && (
        <List.Section title="Asking…">
          <List.Item
            title={askingSentences}
            detail={
              <List.Item.Detail
                isLoading={isSubmiting}
                markdown={`### Original\n${askingSentences}\n${chatGPTResponse}`}
              />
            }
          />
        </List.Section>
      )}
      {conversationHistory.length > 0 ? (
        <List.Section title="History">
          {conversationHistory.map((conversation, index) => {
            let matchImproved = "";
            let diff = "";
            let markdown = "";

            if (selectedId.endsWith("" + index)) {
              if (conversation.responseMarkdown) {
                const matched = conversation.responseMarkdown.match(improvedPattern);
                if (matched) {
                  matchImproved = matched[1];
                  diff = selectedId.endsWith("" + index)
                    ? generateMarkdownDiff(conversation.original, matchImproved, {
                        diffWay: conversation.diffWay,
                      })
                    : "";

                  markdown = `\n${conversation.responseMarkdown
                    .replace(matchImproved, diff)
                    .replace(isCorrectPattern, "")}`;
                }
              } else if (conversation.explanation) {
                markdown = `### Improved\n${diff}\n### Explanation\n${conversation.explanation}`;
              }
            }

            const onUpdateDiffWay = (diffWay: PreferenceValues["diffWay"]) => () => {
              setConversationHistory((history) =>
                history.map((item, i) =>
                  i === index
                    ? {
                        ...item,
                        diffWay,
                      }
                    : item
                )
              );
            };

            return (
              <List.Item
                title={conversation.original}
                id={"history-" + index}
                key={index + (conversation.diffWay ?? "words")}
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
                      content={matchImproved}
                    />
                    <Action
                      onAction={() => onAskingChatGPT(conversation.original, index)}
                      icon={Icon.RotateClockwise}
                      title="Recheck"
                    />
                    <ActionPanel.Submenu
                      shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
                      icon={Icon.Switch}
                      title="Update Diff Way"
                    >
                      {DIFF_WAYS.map((way) => (
                        <Action
                          title={way[0].toUpperCase() + way.slice(1).toLowerCase()}
                          key={way}
                          onAction={onUpdateDiffWay(way)}
                        />
                      ))}
                    </ActionPanel.Submenu>
                    {/* <ActionPanel.Section title="Speak">
                      <Action
                        shortcut={{ modifiers: ["cmd"], key: "s" }}
                        title="Speak Improved"
                        icon={Icon.SpeakerHigh}
                        // need find a way to stop it
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
                    </ActionPanel.Section> */}
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
                    markdown={`### Original\n${conversation.original}${markdown}` || conversation.error}
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
