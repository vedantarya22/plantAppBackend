import express from "express";
import mongoose from "mongoose";

import dotenv from "dotenv";

import userPlantRouter from './routes/userPlant.routes.js';
import siteRouter from './routes/site.routes.js';
dotenv.config();
const app = express();

const PORT = process.env.PORT || 8000;



app.use(express.json());

app.use("/api/userplants",userPlantRouter);
app.use('/api/sites', siteRouter);


app.get("/",(req,res)=>{
    console.log("home route");
    res.send("get home route");
})


const start = async()=>{

    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("mongodb connected");
        app.listen(PORT,()=>{
            console.log(`App is listening on port ${PORT}`);
        });
    }catch(err){
        console.error("db connection failed");
        console.error(err);
    }
    

};

start();