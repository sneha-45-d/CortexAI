import { getModel } from "./config/llmmodel.js";

export const codingAgent = async (state) => {
  try {
    const llm = await getModel("coding");
    const intentLLM = await getModel("intent");

    
    const intentResponse = await intentLLM.invoke(`
You are an intent classifier for a coding AI assistant.

Return ONLY ONE of these values:

CODE_GENERATION
CODE_REVIEW
DEBUGGING
OPTIMIZATION
CONVERSION
DOCUMENTATION

User Request:
${state.prompt}
`);

    const intent = String(intentResponse.content)
      .trim()
      .toUpperCase();

    //coding agent prompt 

    const codingPrompt = `
You are an expert full-stack software engineer.

Analyze the user's request and provide a production-quality solution.

Follow these rules:

- Understand the user's request carefully.
- Follow existing project architecture and coding conventions.
- Keep the solution minimal, clean, and maintainable.
- Do not introduce unnecessary dependencies.
- Do not perform unrelated refactoring.
- Use secure and scalable practices.
- Prefer practical implementation over theoretical explanations.
- If code is required, provide complete working code.
- Preserve existing functionality unless the user explicitly asks to change it.
- Clearly explain important changes.
- If debugging, identify the likely cause before providing the fix.
- If optimization is requested, explain what was inefficient and provide the optimized version.
- If conversion is requested, provide the converted code.
- If documentation is requested, produce clear developer-friendly documentation.

Detected Intent:
${intent}

User Request:
${state.prompt}

Return your response in Markdown.

Use this structure when appropriate:

# Overview

## Explanation

## Problems

## Improvements

## Best Practices

## Optimized Code

Only include sections that are relevant to the user's request.

Do not generate fake files.
Do not claim that files were modified.
Do not say that you executed code or tests unless you actually did so.
`;

    

    const response = await llm.invoke(codingPrompt);

    const content = String(response.content || "");

    

    const artifacts = [];

    
    const codeBlockMatch = content.match(
      /```(\w+)?\n([\s\S]*?)```/
    );

    if (codeBlockMatch) {
      const language = codeBlockMatch[1] || "text";
      const code = codeBlockMatch[2].trim();

      artifacts.push({
        type: "code",
        title: getArtifactTitle(intent, state.prompt),
        prompt: String(state.prompt || "").trim(),
        content: code,
        language,
        fileName: getFileName(language),
      });
    }

    
    return {
      ...state,

      intent,

      aiResponse: content,

      artifacts,
    };

  } catch (error) {
    console.error("Coding Agent Error:", error);

    return {
      ...state,

      aiResponse:
        "Sorry, I couldn't process your coding request.",

      artifacts: [],

      error: error.message,
    };
  }
};



const getArtifactTitle = (intent, request) => {
  switch (intent) {
    case "CODE_GENERATION":
      return "Generated Code";

    case "CODE_REVIEW":
      return "Code Review";

    case "DEBUGGING":
      return "Debugged Code";

    case "OPTIMIZATION":
      return "Optimized Code";

    case "CONVERSION":
      return "Converted Code";

    case "DOCUMENTATION":
      return "Code Documentation";

    default:
      return "Coding Artifact";
  }
};



const getFileName = (language) => {
  const extensions = {
    javascript: "generated.js",
    js: "generated.js",
    typescript: "generated.ts",
    ts: "generated.ts",
    jsx: "generated.jsx",
    tsx: "generated.tsx",
    python: "generated.py",
    py: "generated.py",
    java: "Generated.java",
    cpp: "generated.cpp",
    c: "generated.c",
    html: "index.html",
    css: "styles.css",
    json: "data.json",
    sql: "query.sql",
    bash: "script.sh",
    shell: "script.sh",
  };

  return extensions[language.toLowerCase()] || "generated.txt";
};