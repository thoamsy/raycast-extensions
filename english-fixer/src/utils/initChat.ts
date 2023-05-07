import { Configuration, OpenAIApi } from "openai";
import { getPreferenceValues } from "./getPreferenceValues";

const configuration = new Configuration({
  apiKey: getPreferenceValues().openAIKey,
});
const openai = new OpenAIApi(configuration);

const getPrompt = (
  sentence: string
) => `I will send you some English statements which are delivered by triple backticks. And you should help me to find the grammar issues or word typo in it and returns the improved version which should be a string, and just ignore the case, you can consider and A as the same characters. If nothing is wrong, just return the original statement. You should only return the format as JSON, and which keys are "improved".
And also you can tell me the explanation why you think it is wrong or not. I will learn from you, and its key in JSON is "explanation".
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
