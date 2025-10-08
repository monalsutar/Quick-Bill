import mongoose from "mongoose";

const connection = async() => {
    try{

        await mongoose.connect(process.env.MongoURL)
        console.log("Database Connected...")
    }catch(e){
        console.log(e)
    }
}

export default connection