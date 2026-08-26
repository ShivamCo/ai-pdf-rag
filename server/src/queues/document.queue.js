import { queue } from "../config/qdrant";
import { Worker } from "bullmq";


const worker = new Worker(
    'pdf-upload-queue',

    async (job) =>{
        try {



            
        } catch (err){
            
        }
    }

)

export {worker}