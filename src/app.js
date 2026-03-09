import express from "express";
import mongoose from "mongoose";

import dotenv from "dotenv";

import userPlantRouter from './routes/userPlant.routes.js';
import siteRouter from './routes/site.routes.js';
import plantRouter from './routes/plant.routes.js';
import userRouter from './routes/user.routes.js';
import postRouter from './routes/post.routes.js';
dotenv.config();
const app = express();

const PORT = process.env.PORT || 8000;



app.use(express.json());

app.use('/api/users', userRouter);
app.use("/api/userplants", userPlantRouter);
app.use('/api/sites', siteRouter);
app.use('/api/plants', plantRouter);
app.use('/api/posts', postRouter);


app.get("/", (req, res) => {
    console.log("Plant api running");
    res.send("Plant api running");
})


const start = async () => {

    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("mongodb connected");
        app.listen(PORT, () => {
            console.log(`App is listening on port ${PORT}`);
        });
    } catch (err) {
        console.error("db connection failed");
        console.error(err);
    }


};

start();