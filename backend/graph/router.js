import { getModel } from "../services/agent/config/llmmodel"

export const router=async (state)=>{
    if (state.agent && state.agent!=="auto"){

    return{
        ...state,
        agent:state.agent
    }}


    const llm=  await getModel("router")
    const prompt = `you are an agent router.

Classify the user's query into ONE of the following categories:

chat:
General conversation,
greetings,
casual questions,
normal discussion.

search:
Current events,
latest information,
news,
recent developments,
internet lookup.

coding:
Generate code,
debug code,
build projects,
architecture,
API design.

pdf:
Questions about an attached PDF,
summarizing or extracting information from documents,
answering questions using a document.

ppt:
Questions about generating PPTs,
PowerPoint presentations,
PPT content or context.

Return ONLY ONE word:

chat
search
coding
pdf
ppt

User Query:
${state.prompt}`
const response=await llm.invoke(prompt)
return{
    ...state,
    agent:response.content
    .trim()
    .toLowerCase()
}
}