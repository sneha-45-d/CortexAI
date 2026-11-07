import {Annotation} from "@langchain/langgraph";
import { search } from "../services/agent/search.agent";
    
        export  const agentState=Annotation.Root({
            prompt:Annotation(),
            aiResponse:Annotation(),
            agent:Annotation(),
            searchResults:Annotation(),
            images:Annotation(),
         
            conversationId:Annotation(),
            artifacts:Annotation()
        })
    
