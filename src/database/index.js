import mongoose from 'mongoose';

const url = process.env.MONGODB_URI;


const connectDB = async()=>{
    try{
        const connectioninstance = await mongoose.connect(url)
        console.log(`Mongoodb is connected and running `)
    }catch(err){
        console.log('Error connecting to Mongoose databse',err);
        process.exit(1);
    }
}

export default connectDB