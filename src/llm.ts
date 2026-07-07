import { config } from "./config";

type UserContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function callLLM(
  userContent: string,
  imageDataUrls: string[] = [],
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.llmApiKey) {
    headers.Authorization = `Bearer ${config.llmApiKey}`;
  }

  let userMessageContent: string | UserContentPart[] = userContent;
  if (imageDataUrls.length > 0) {
    const parts: UserContentPart[] = [];
    if (userContent.trim().length > 0) {
      parts.push({ type: "text", text: userContent });
    }
    for (const url of imageDataUrls) {
      parts.push({ type: "image_url", image_url: { url } });
    }
    userMessageContent = parts;
  }

  const response = await fetch(`${config.llmBaseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.llmModel,
      messages: [
        { role: "system", content: config.fbiSystemPrompt },
        { role: "user", content: userMessageContent },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `LLM request failed: ${response.status} ${response.statusText} - ${await response.text()}`,
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("LLM response did not contain any message content");
  }

  return content.trim();
}
