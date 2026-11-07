import redis from "../../../shared/redis/redis.js";


const getMemory=async(conversationId)=>{
    const key=`messages-${conversationId}`
    await redis.get(key)
    if (cached){
        return  JSON.parse(cached)
    }
const messages=await getMessages(conversationId)
redis.set(key,JSON.stringify(messages),{EX:3600})
return messages
}
export const addMessage=async(conversationId,role,content)=>{
    const key=`messages-${conversationId}`
    const rawMessages=awaitredis.get(key)
    const messages=rawMessages?JSON.parse(rawMessages):[]
    messages.push({role,content})
    if(messages.length>20){
messages.shift()    }
await redis.set(key,JSON.stringify(messages),{EX:3600})
}