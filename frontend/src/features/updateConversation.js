import api from "../../utils/axios"
export const createConversation=async()=>{
    try{
        const{data}=await api.get("/api/chat/update-conversation",payload)
 return data
    }catch(error){
        console.log(error)
return []
    }
}