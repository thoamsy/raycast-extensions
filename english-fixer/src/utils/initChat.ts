import { AxiosError } from "axios";
import { Configuration, OpenAIApi } from "openai";
import { getPreferenceValues } from "./getPreferenceValues";

const configuration = new Configuration({
  apiKey: getPreferenceValues().openAIKey,
});
const openai = new OpenAIApi(configuration);
export const IMPROVED_HEADLINE = "Improved";
const DELIMITER = "```";

const getJSONPrompt = (sentence: string) => `
I will send you some English statements which are delivered by ${DELIMITER} And you task is help me to find the grammar issues or word typo in it and returns the improved version which should be a string. If nothing is wrong, just return the original statement. So the steps should be:
1. add a key "${IMPROVED_HEADLINE.toLowerCase()}" which is the improved version of the original statement
2. add a key "explanation" which is the explanation why you think it is wrong or not. I will learn from you
3. if my sentence is correct, you should add a key "correct" which is true

NOTE: Please don't add any extra text in the response, only returns the JSON format
${DELIMITER}${sentence}${DELIMITER}
`;

const getStreamTextSystem = `
I will send you some English statements which will be delivered by ${DELIMITER} And you task is help me to find the grammar issues or word typo, and return an improved version which should be a string. If nothing is wrong, just return the original statement. You should give me a markdown format text which contains the following information:
1. ### ${IMPROVED_HEADLINE}
2. you should break a new line, and add the improved version of the original statement. And the improved version should be return as markdown which will compare to the previous sentence, wrap the deleted part in the original sentence with ~~ and wrap the added part in improved sentence with **, ignoring the case.
3. ### Explanation
4. you should break a new line, and add the explanation why you think it is wrong or not. I will learn from you. Do not wrap the content with triple backticks
5. If my sentence is correct and no any issues,  you should add \`\`\`correct\`\`\` in the end of the text. So I will know that you think it is correct.
6. if you can't identified what's the language I sent to you, you should break a new line and tell me the error message.

NOTE: Please do not criticize the correct use of punctuation
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
        messages: [
          { role: "system", content: getStreamTextSystem },
          {
            role: "user",
            content: `${DELIMITER}${sentence}${DELIMITER}`,
          },
        ],
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
  } catch (error) {
    const { response } = error as AxiosError;
    console.error(response?.data);
    return response?.statusText ?? "Unknown error";
  }
};
