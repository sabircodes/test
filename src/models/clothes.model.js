import mongoose , {Schema} from 'mongoose';

const clothesSchema = new Schema({
    name:{
        type: String,
        
    },
    photos:[String],
    content:[String],
    finishing:{
        type: String,
        
    },
    width1:{
        type:Number,
    },
    width2:{
        type:Number,
    },
    weight:{
        type:Number,

    },
    yarn:{
        type:Number,
       
    },
    cost:{
        type:Number,
    }
},{timestamps:true});


export const cloth = mongoose.model('Clothes',clothesSchema);