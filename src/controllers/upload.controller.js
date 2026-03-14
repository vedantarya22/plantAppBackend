import cloudinary from "../config/cloudinary.js";

const uploadImage = async (req,res)=>{

    console.log('📦 Upload body size:', JSON.stringify(req.body).length, 'bytes');
console.log('📦 Image field present:', !!req.body.image);
    try{
        const {image} = req.body; //base 64 from swift
        if(!image){
            return res.status(400).json({message:"No image provided"});
        }

        const result = await cloudinary.uploader.upload(image,{
            folder: "user_plants",
            transformation:[
                {width:600,crop:"scale"},
                {quality:"auto"},
                {fetch_format:"auto"}
            ]
        });

        return res.status(200).json({url: result.secure_url});
    }catch(err){
        return res.status(500).json({message:`Upload failed ${err}`});
    }
}

export {uploadImage};