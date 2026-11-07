
import { chatAgent } from "../services/agent/chat.agent";
import { codingAgent } from "../services/agent/coding.agent";
import { visionAgent } from "../services/agent/vision.agent.js";
import { pdfAgent } from "../services/agent/pdf.agent";
import { pptAgent } from "../services/agent/ppt.agent";

import { router } from "./router";
import { agentState } from "./state";

import { StateGraph, START } from "@langchain/langgraph";

const workflow = new StateGraph(agentState);

workflow.addNode("router", router);
workflow.addNode("chat", chatAgent);
workflow.addNode("coding", codingAgent);
workflow.addNode("pdf", pdfAgent);
workflow.addNode("ppt", pptAgent);
workflow.addNode("vision", visionAgent);

workflow.addEdge(START, "router");

workflow.addConditionalEdges(
  "router",
  (state) => {
    switch (state.agent) {
      case "chat":
        return "chat";

      case "search":
        return "search";

      case "coding":
        return "coding";

      case "pdf":
        return "pdf";

      case "ppt":
        return "ppt";

      case "vision":
        return "vision";

      default:
        return "chat";
    }
  },
  {
    chat: "chat",
    search: "search",
    coding: "coding",
    pdf: "pdf",
    ppt: "ppt",
    vision: "vision",
  }
);
workflow.addEdge("search","chat")
workflow.addEdge("coding","_end_")
workflow.addEdge("pdf","_end_")
workflow.addEdge("ppt","_end_")
workflow.addEdge("vision","_end_")

 export const graph=workflow.compile()


