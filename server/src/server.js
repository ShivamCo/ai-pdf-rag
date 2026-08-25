import app from './app.js';
import {env} from './config/env.js'

console.log(env.PORT)


app.listen(env.PORT, ()=>{
    console.log(`Server is Live on Port ${env.PORT}`)
})