import { Configuration, OpenAIApi } from "openai";
import { getPreferenceValues } from "./getPreferenceValues";

const configuration = new Configuration({
  apiKey: getPreferenceValues().openAIKey,
});
const openai = new OpenAIApi(configuration);

const getPrompt = (
  sentence: string
) => `I will send you some English statements which are delivered by triple backticks. And you should help me to find the grammar issues or word typo in it and returns the improved version which should be a string, and just ignore the case, you can consider and A as the same characters. If nothing is wrong, just return the original statement. So the steps should be:
1. add a key "improved" which is the improved version of the original statement
2. add a key "explanation" which is the explanation why you think it is wrong or not. I will learn from you
3. if my sentence is correct, you should add a key "correct" which is true

NOTE: Please don't add any extra text in the response, only returns the JSON format
\`\`\`${sentence}\`\`\`
`;

export const getResponse = async (sentence: string) => {
  try {
    const response = await openai.createChatCompletion({
      messages: [{ role: "user", content: getPrompt(sentence) }],
      model: "gpt-3.5-turbo",
    });
    return response.data.choices[0].message?.content ?? "{}";
  } catch (error: any) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
};
