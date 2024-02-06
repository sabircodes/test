// require('dotenv').config({path:'./env'});
import { app } from './app.js';
import dotenv from 'dotenv';
import express from "express";

import connectDB from './database/index.js';

dotenv.config({
    path:'./.env'
})

connectDB().then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`listening on port ${process.env.PORT}`);
    });

})
.catch( (err) =>{
        console.error("Mongoose connection error ",err);
})



 




