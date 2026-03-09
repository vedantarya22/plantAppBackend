import express from "express";
import mongoose from "mongoose";

import dotenv from "dotenv";

import userPlantRouter from './routes/userPlant.routes.js';
import siteRouter from './routes/site.routes.js';
import plantRouter from './routes/plant.routes.js';
import userRouter from './routes/user.routes.js';
import uploadRouter from "./routes/upload.routes.js"
import authRouter from './routes/auth.routes.js';
import protect from './middlewares/auth.middleware.js';
import postRouter from "./routes/post.routes.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 8000;



app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/plants', plantRouter);

// MARK: Protected — JWT required
app.use('/api/userplants', protect, userPlantRouter);
app.use('/api/sites',      protect, siteRouter);
app.use('/api/upload',     protect, uploadRouter);
app.use('/api/users',      protect, userRouter);
app.use('/api/posts', protect,postRouter);



app.get("/",(req,res)=>{
    console.log("Plant api running");
    res.send("Plant api running");
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