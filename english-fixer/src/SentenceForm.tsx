import { Form, ActionPanel, Action, LaunchProps, Toast, showToast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { useCachedState } from "@raycast/utils";
import SentenceList, { Conversation } from "./SentenceList";

export interface FormValues {
  sentences: string;
}

const CONVERSATION_KEY = "CONVERSATION_KEY";

export default function Command(props: LaunchProps<{ draftValues: FormValues }>) {
  const { draftValues } = props;

  const [sentences, setSentences] = useState<string>(draftValues?.sentences || "");
  const { push } = useNavigation();

  const [conversationHistory] = useCachedState<Conversation[]>(CONVERSATION_KEY, []);

  return (
    <Form
      navigationTitle="Sentence Checker"
      enableDrafts
      actions={
        <ActionPanel>
          {sentences && (
            <Action.SubmitForm
              onSubmit={async (values: FormValues) => {
                if (!values.sentences) {
                  showToast({
                    title: "Please type something",
                    style: Toast.Style.Failure,
                  });
                  return;
                }

                push(<SentenceList askingSentences={values.sentences} />);
                // if (await onAskingChatGPT(values.sentences)) {
                //   setSentences("");
                // }
              }}
            />
          )}
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
        id="sentences"
        title="Sentence"
        value={sentences}
        onChange={setSentences}
      />
    </Form>
  );
}
