import { LaunchProps } from "@raycast/api";
import SentenceForm, { FormValues } from "./SentenceForm";

export default function Command(props: LaunchProps<{ draftValues: FormValues }>) {
  return <SentenceForm {...props} />;
}
