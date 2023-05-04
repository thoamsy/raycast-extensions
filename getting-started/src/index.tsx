import { ActionPanel, Action, Form, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { getResponse } from "./utils/initChat";

export default function Command() {
  const [improved, setImproved] = useState("");
  const [isSubmiting, setIsSubmiting] = useState(false);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Submit"
            onSubmit={async (value) => {
              if (isSubmiting) {
                return;
              }
              setIsSubmiting(true);
              const toast = await showToast({
                style: Toast.Style.Animated,
                title: "Asking…",
              });
              const completion = await getResponse(value.sentence);
              const res = JSON.parse(completion || "{}");
              setImproved(res.improved);
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
    >
      <Form.TextArea autoFocus id="sentence" title="Sentence" />
      {improved && <Form.Description title="Improved" text={improved} />}
    </Form>
  );
}
