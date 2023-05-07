import { Form, ActionPanel, Action, LaunchProps, Toast, showToast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { getResponse } from "./utils/initChat";
import { useCachedState } from "@raycast/utils";
import SentenceList, { Conversation } from "./SentenceList";

export interface FormValues {
  sentences: string;
}

const CONVERSATION_KEY = "CONVERSATION_KEY";

export default function Command(props: LaunchProps<{ draftValues: FormValues }>) {
  const { draftValues } = props;

  const [sentences, setSentences] = useState<string>(draftValues?.sentences || "");
  const [isSubmiting, setIsSubmiting] = useState(false);
  const { push } = useNavigation();
  const [error, setError] = useState("");

  const [conversationHistory, setConversationHistory] = useCachedState<Conversation[]>(CONVERSATION_KEY, []);

  const onAskingChatGPT = async (originalText: string) => {
    if (isSubmiting) {
      return;
    }

    setIsSubmiting(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Asking…",
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
      setError("");

      setConversationHistory((history) => {
        return [newConversation, ...history];
      });

      push(<SentenceList />);
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setIsSubmiting(false);
      toast.hide();
    }
  };
  const [sentenceError, setSentenceError] = useState("");

  return (
    <Form
      isLoading={isSubmiting}
      navigationTitle="Sentence Checker"
      enableDrafts
      actions={
        <ActionPanel>
          <Action.SubmitForm
            onSubmit={async (values: FormValues) => {
              if (!values.sentences) {
                showToast({
                  title: "Please type something",
                  style: Toast.Style.Failure,
                });
                return;
              }

              if (await onAskingChatGPT(values.sentences)) {
                setSentences("");
              }
            }}
          />
          {conversationHistory.length > 0 ? (
            <Action.Push title="Show History" shortcut={{ modifiers: ["cmd"], key: "d" }} target={<SentenceList />} />
          ) : (
            <Action
              title="Show History"
              shortcut={{ modifiers: ["cmd"], key: "d" }}
              onAction={() => {
                showToast({
                  title: "No history yet",
                  style: Toast.Style.Failure,
                });
              }}
            />
          )}
        </ActionPanel>
      }
    >
      <Form.TextArea
        placeholder="Type the sentence you want to check"
        enableMarkdown
        onBlur={() => {
          if (!sentences) {
            setSentenceError("Please type something");
          }
        }}
        id="sentences"
        title="Sentence"
        value={sentences}
        onChange={setSentences}
        error={sentenceError}
      />
      {error && <Form.Description title="Error Message" text={error} />}
    </Form>
  );
}
