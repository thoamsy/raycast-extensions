import { Configuration, OpenAIApi } from "openai";
import { key } from "./apikey";

const configuration = new Configuration({
  apiKey: key,
});
const openai = new OpenAIApi(configuration);

const getPrompt = (
  sentence: string
) => `I will send you some English statements which are delivered by triple backticks. And you should help me to find the grammar issues or word typo in it and returns the improved version which should be a string. If nothing is wrong, just return the original statement. You should only return the format as JSON, and which keys are "improved".
And also you can tell me the reason why you think it is wrong or not. I will learn from you, and the key in JSON is "reason".
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
