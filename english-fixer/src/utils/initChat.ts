import { Configuration, OpenAIApi } from "openai";
import { getPreferenceValues } from "./getPreferenceValues";

const configuration = new Configuration({
  apiKey: getPreferenceValues().openAIKey,
});
const openai = new OpenAIApi(configuration);

const getJSONPrompt = (sentence: string) => `
I will send you some English statements which are delivered by triple backticks. And you should help me to find the grammar issues or word typo in it and returns the improved version which should be a string. If nothing is wrong, just return the original statement. So the steps should be:
1. add a key "improved" which is the improved version of the original statement
2. add a key "explanation" which is the explanation why you think it is wrong or not. I will learn from you
3. if my sentence is correct, you should add a key "correct" which is true

NOTE: Please don't add any extra text in the response, only returns the JSON format
\`\`\`${sentence}\`\`\`
`;

const getStreamTextPrompt = (sentence: string) => `
I will send you some English statements which are delivered by triple backticks. And you should help me to find the grammar issues or word typo in it and returns the improved version which should be a string. If nothing is wrong, just return the original statement. You should give me a markdown format text which contains the following information:
1. ### Improved
2. after the the it, you should break a new line, and add the improved version of the original statement. Do not wrap the content with triple backticks
3. ### Explanation
4. after the the it, you should break a new line, and add the explanation why you think it is wrong or not. I will learn from you. Do not wrap the content with triple backticks
5. If my sentence is correct and no any issues,  you should add \`\`\`correct\`\`\` in the end of the text. So I will know that you think it is correct.
6. if you can't identified what's the language I sent to you, you should break a new line and tell me the error message.
NOTE: Please do not criticize the correct use of punctuation.

Here is my sentence:
\`\`\`${sentence}\`\`\`
`;

export const getResponse = async (sentence: string) => {
  try {
    const response = await openai.createChatCompletion({
      messages: [{ role: "user", content: getJSONPrompt(sentence) }],
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

export const getResponseStream = async function* (sentence: string) {
  try {
    const response = await openai.createChatCompletion(
      {
        messages: [{ role: "user", content: getStreamTextPrompt(sentence) }],
        model: "gpt-3.5-turbo",
        stream: true,
      },
      {
        responseType: "stream",
      }
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    for await (const chunk of response.data) {
      const lines = chunk
        .toString("utf8")
        .split("\n")
        .filter((line: string) => line.trim().startsWith("data"));
      for (const line of lines) {
        const message = line.replace(/^data: /, "");
        if (message === "[DONE]") {
          return;
        }
        const json = JSON.parse(message);
        const token = json.choices[0].delta.content;
        if (token) {
          yield token;
        }
      }
    }
  } catch (error: any) {
    if (error.response) {
      console.error("Error: ", error.response.status);
      console.error("Error: ", error.response.data);
    } else {
      console.error("Error: ", error.message);
    }
  }
};
