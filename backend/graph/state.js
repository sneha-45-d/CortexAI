import {Annotation} from "@langchain/langgraph";
import { search } from "../services/agent/search.agent";
    
        export  const agentState=Annotation.Root({
            prompt:Annotation(),
            pdf:Annotation(),
            aiResponse:Annotation(),
            agent:Annotation(),
            searchResults:Annotation(),
            conversationId:Annotation(),
            artifacts:Annotation()
        })
    
