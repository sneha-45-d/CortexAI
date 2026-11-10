import dotenv from "dotenv";
import { ChatGroq } from "@langchain/groq";
import { buildMemoryContext } from "../../shared/memory/memory.js";

dotenv.config({ path: new URL("./.env", import.meta.url) });

const AGENT_SYSTEM_PROMPTS = {
  chat: `You are CortexAI, a smart, student-friendly learning assistant designed to make difficult topics simple, clear, and memorable.

Your job:
- Give answers in a natural ChatGPT-style way: direct, clear, and easy to understand.
- Explain ideas with short, clean points rather than long dense paragraphs.
- Prefer pointwise explanations in 2-3 line chunks for each subtopic.
- Do not force tables unless the user explicitly asks for a comparison or structured matrix.
- When the user does not ask for a table, respond with plain headings, bullets, and short explanations.
- Keep each subtopic to a few concise lines, not big paragraphs.
- Start with the main idea in one sentence, then give a few short supporting points.
- Use simple examples when helpful, but keep the answer crisp and readable.
- If the user replies with a short follow-up like "yes", "yes please", or "no", and the previous message was a deeper-dive invitation, continue the same topic instead of changing topics.
- If the user says yes, continue with a focused deeper explanation of the same topic and keep the same learning thread.
- If the user says no, politely end the deeper dive and optionally offer a related but different topic.
- Add a brief "Key characteristics" section only when it adds value, not for every answer.
- End with a friendly follow-up like: "Want to know more related to this?"
- Always use clean Markdown formatting.
- Include clickable Markdown links only when they are real and relevant; never invent URLs.
- If something is uncertain, say so honestly.`,

  coding: `You are the CortexAI coding agent.

Focus on:
- Writing clean, production-ready code and fix explanations.
- Breaking down implementation steps clearly and in a way that helps the user understand why each step matters.
- Suggesting exact code with minimal but relevant snippets.
- Explaining errors, debugging strategies, and architecture decisions in detail.
- When a user asks for a comparison or list of options, use a Markdown table.
- Use headings, short explanations, and examples so the answer is easy to understand.
- Format answers with clean Markdown, a table when needed, a key-characteristics section, and clickable documentation links when relevant.`,

  search: `You are the CortexAI search agent.

Focus on:
- Summarize findings clearly and directly.
- Answer the user's question with current, useful information.
- If the user asks for current time, date, or live facts, give an exact answer and keep it concise.
- Use clean headings, bullets, and short explanations.
- When a source is useful, include a Markdown link if it is real.
- End with a follow-up question like: "Want to know more related to this?"`,

  research: `You are the CortexAI research agent.

Focus on:
- Summarizing complex topics into clear, structured insights that are easy to understand.
- Comparing options and trade-offs in detail.
- Providing actionable recommendations with evidence-based reasoning.
- Keeping bullets, headings, and examples easy to scan.
- Avoiding speculation or unsupported claims.
- If the user asks for a table, create one with proper columns and values.
- Return source names as clickable Markdown links when reliable URLs are available.
- Use a comparison table when presenting multiple results and add a "Key characteristics" section.`,

  pdf: `You are the CortexAI document analysis agent.

Focus on:
- Extracting the key ideas from PDFs or long documents.
- Summarizing accurately and highlighting important details.
- Organizing findings into clear sections with practical takeaways.
- Preserving the original meaning and context.
- Use a table for structured facts and include a "Key characteristics" section.`,

  ppt: `You are the CortexAI presentation agent.

Focus on:
- Turning ideas into clear presentation narratives.
- Structuring slides with concise headlines and strong storytelling.
- Recommending layouts, key points, and speaker notes.
- Returning polished, presentation-ready content.
- Use clean Markdown with tables for slide plans and a "Key characteristics" section.`,

};

const getGroqModel = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  return new ChatGroq({
    apiKey,
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  });
};

const getGrokModelResponse = async ({ history, prompt, systemPrompt }) => {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROK_MODEL || "grok-2-latest",
      messages: [
        { role: "system", content: String(systemPrompt || "You are CortexAI.") },
        ...history.map((message) => ({
          role: message?.role === "assistant" ? "assistant" : "user",
          content: String(message?.content ?? ""),
        })),
        { role: "user", content: String(prompt).trim() },
      ],
      temperature: 0.6,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || "I am here to help.";

  return { aiResponse: String(text).trim() };
};

const getCurrentTimeResponse = (prompt) => {
  const query = String(prompt || "").toLowerCase();
  if (!/(current time|what time is it|time now|current date|today(?:'s)? date|date today|what is the date|what date is it)/i.test(query)) {
    return null;
  }

  const timeZone = process.env.APP_TIME_ZONE || "Asia/Kolkata";
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const localTime = time.format(now);

  return {
    aiResponse: `## Current time\n\nThe current time is **${localTime}** (${timeZone}).\n\n**Date:** ${date}.\n\nWant to know more related to this?`,
    images: [],
  };
};

const getRequestedImageCount = (prompt, fallback = 5) => {
  const text = String(prompt || "");
  const explicitMatch = text.match(/(?:show|give|provide|find|display|return|fetch|need|want|i want|list)\s+(?:me\s+)?(?:up\s+to\s+)?(\d+)\s*(?:images?|photos?|pics?)/i);
  const countMatch = text.match(/(?:how many|what is the number of|count)\s+(?:images?|photos?|pics?)/i);

  if (explicitMatch?.[1]) {
    return Math.max(1, Math.min(10, Number.parseInt(explicitMatch[1], 10)));
  }

  if (countMatch) {
    return fallback;
  }

  return fallback;
};

const getSearchResponse = async (prompt) => {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      aiResponse: "I could not find a reliable live result for that search right now. Try a more specific query.",
      images: [],
    };
  }

  const requestedImageCount = getRequestedImageCount(prompt, 5);
  const isCountingImagesRequest = /(how many|what is the number of|count).*images?/i.test(String(prompt || ""));

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: String(prompt || "").trim(),
      max_results: 3,
      include_answer: true,
      include_images: true,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily search failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const items = Array.isArray(data?.results) ? data.results : [];
  const answer = data?.answer && String(data.answer).trim();
  const extractedImages = [
    ...(Array.isArray(data?.images) ? data.images : []),
    ...items.flatMap((item) => {
      const urls = [];
      if (typeof item?.image === "string") urls.push(item.image);
      if (typeof item?.thumbnail === "string") urls.push(item.thumbnail);
      if (typeof item?.url === "string") urls.push(item.url);
      if (Array.isArray(item?.images)) {
        urls.push(...item.images.filter((value) => typeof value === "string"));
      }
      return urls;
    }),
  ].filter((value, index, list) => typeof value === "string" && /^(https?:)?\/\//i.test(value) && list.indexOf(value) === index);

  const limitedImages = extractedImages.slice(0, Math.min(requestedImageCount, extractedImages.length || requestedImageCount));

  if (!items.length && !answer) {
    return {
      aiResponse: "I could not find a reliable live result for that search right now. Try a more specific query.",
      images: limitedImages,
    };
  }

  const summary = items.length
    ? items
        .map((item, index) => `${index + 1}. **${item.title || "Result"}**\n   ${item.content || item.snippet || item.url || ""}\n   ${item.url ? `[Open source](${item.url})` : ""}`)
        .join("\n\n")
    : answer;

  if (isCountingImagesRequest) {
    return {
      aiResponse: `I found **${limitedImages.length} relevant image${limitedImages.length === 1 ? "" : "s"}** for this topic.`,
      images: limitedImages,
    };
  }

  return {
    aiResponse: `## Search results\n\n${summary}\n\nWant to know more related to this?`,
    images: limitedImages,
  };
};

export const chatAgent = async ({
  prompt,
  messages = [],
  agentId = "chat",
  userId = "anonymous",
}) => {
  if (!prompt || !String(prompt).trim()) {
    throw new Error("Prompt is required");
  }

  const normalizedAgentId = agentId === "research" ? "search" : agentId;

  const currentTimeResponse = getCurrentTimeResponse(prompt);
  if (currentTimeResponse) {
    return currentTimeResponse;
  }

  if (normalizedAgentId === "search") {
    if (process.env.TAVILY_API_KEY) {
      try {
        return await getSearchResponse(String(prompt).trim());
      } catch (error) {
        console.warn("Tavily search failed, falling back to model search:", error?.message || error);
      }
    }

    return {
      aiResponse: `## Search\n\nI can help search, but the live search API is not configured right now. Try again with a more specific query or switch back to Chat mode.\n\nWant to know more related to this?`,
      images: [],
    };
  }

  const history = Array.isArray(messages) ? messages.slice(-8) : [];
  const memoryContext = await buildMemoryContext(userId);
  const baseAgentPrompt = AGENT_SYSTEM_PROMPTS[normalizedAgentId] || AGENT_SYSTEM_PROMPTS.chat;
  const agentPrompt = memoryContext
    ? `${baseAgentPrompt}\n\n${memoryContext}\n\nUse this memory to personalize the answer without repeating it too much.`
    : baseAgentPrompt;

  if (process.env.GROK_API_KEY) {
    try {
      const grokResult = await getGrokModelResponse({
        history,
        prompt: String(prompt).trim(),
        systemPrompt: agentPrompt,
      });

      if (grokResult) {
        return grokResult;
      }
    } catch (error) {
      console.warn("Grok API request failed, falling back to Groq:", error?.message || error);
    }
  }

  const model = getGroqModel();
  if (!model) {
    return {
      aiResponse: "I?m ready to help. Add GROK_API_KEY or GROQ_API_KEY to enable live AI responses.",
      images: [],
    };
  }

  const response = await model.invoke([
    {
      role: "system",
      content: agentPrompt,
    },
    ...history.map((message) => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      content: String(message?.content ?? ""),
    })),
    { role: "user", content: String(prompt).trim() },
  ]);

  const aiResponse =
  
    typeof response?.content === "string"
      ? response.content
      : Array.isArray(response?.content)
        ? response.content
            .map((part) => (typeof part === "string" ? part : part?.text || ""))
            .join("")
        : "I Am here to help .";

  return {
    aiResponse: String(aiResponse || "I am here to help.").trim(),
    images: [],
  };
};
