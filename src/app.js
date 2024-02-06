import express from 'express';
import cors from "cors";
import { UserModel } from './models/User.model.js';
import { cloth } from './models/clothes.model.js'
import bcrypt from 'bcrypt';
import { hash, hashSync } from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieparser from 'cookie-parser';
import imageDownloader from 'image-downloader';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';



const __dirname = path.dirname(fileURLToPath(import.meta.url));


const app = express();
const bcryptSalt = bcrypt.genSaltSync(10);
// this thing her made it possible to upload photos , this line basicaaly saya that everything in upload should be displayed in the browser
// Combining these parts, the line essentially says: "Use the express.static middleware to serve static files from the 'uploads' directory when the URL path starts with '/uploads'." This is commonly used to make files in the 'uploads' directory accessible over the web, like images or user-uploaded files.
app.use('/uploads', express.static(__dirname + '/uploads'));
const jwtSecret = 'skjbasjkasdjjabdjkadbeajbdelddbeldbeadbubfwldfland';
app.use(express.json());
app.use(cookieparser());

app.use(express.urlencoded({ extended: true }));
var allowedOrigins = ['http://localhost:5173', 'https://fabeeno.onrender.com'];

app.use(cors({
    origin: ['https://fabeeno-ld6k.onrender.com',"http://localhost:5173"], // Specify the allowed origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }));
// app.use(cors({
//     credentials: true,
//     origin: 'http://localhost:5173'
// }));



app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const newuser = await UserModel.create({
            name,
            email,
            password: hashSync(password, bcryptSalt,),
        });
        res.status(200).json(newuser);

    }
    catch (e) {
        res.status(422).json("error occured while tryin to register user ", e);
    }
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const newuser = await UserModel.findOne({ email });
        if (newuser) {
            const passOK = bcrypt.compareSync(password, newuser.password);
            if (passOK) {
                jwt.sign({ email: newuser.email, id: newuser._id, name: newuser.name }, jwtSecret, {}, (err, token) => {
                    if (err) {
                        throw err;
                    }
                    res.cookie('token', token, { httpOnly: true,sameSite:'None',secure:true }).json(newuser);
                });
                
                
            }
            else {
                res.status(422).json('Password does not match');
            }

        }
        else {
            res.status(500).json('User does not exist');
        }



    } catch (error) {
        res.json(422).json("error occured while loging in ");
        console.log(error);

    }
})


app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, data) => {
            if (err) throw err;
            res.json(data);
        })

    } else {
        res.json(null);
    }

})


app.post('/logout', (req, res) => {
    res.cookie('token', '').status(200).json('You are logged out please login again')
})


app.post('/upload-by-link', async (req, res) => {
    const { link } = req.body;
    // console.log(link);
    const newName = 'Photo' + Date.now() + '.jpg';

    // Corrected destination path
    const destinationPath = __dirname + '/uploads/' + newName;

    try {
        await imageDownloader.image({
            url: link,
            dest: destinationPath,
        });

        res.json(newName);
    } catch (error) {
        console.error('Error downloading or saving the image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const photoMiddleware = multer({ dest: 'src/uploads' });
app.post('/upload', photoMiddleware.array('photos', 100), (req, res) => {
    const uploadedFiles = [];
    for (let i = 0; i < req.files.length; i++) {
        const { path, originalname } = req.files[i];
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newpath = path + '.' + ext;
        fs.renameSync(path, newpath);
         
        uploadedFiles.push(newpath.replace("src\\uploads\\", ""));
    }
   
    res.json(uploadedFiles);
})



app.post('/clothes', (req, res) => {
    const { token } = req.cookies;
    const { title, Material, addedPhoto, finish, Yarn, Width1, Width2, Weight, price } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, data) => {
        if (err) throw err;
        const clothdoc = await cloth.create({
            name: title, content: Material, photos: addedPhoto, finishing: finish, yarn: Yarn, width1: Width1, width2: Width2, weight: Weight, cost: price

        })
        res.json(clothdoc)
    })

})

app.get('/clothes', async (req, res) => {
    res.json(await cloth.find());

})

app.put('/clothes', async (req, res) => {
    const { token } = req.cookies;

    const { id, title, Material, addedPhoto, finish, Yarn, Width1, Width2, Weight, price } = req.body;
    const clothdoc = await cloth.findById(id);
    clothdoc.set({
        name: title, content: Material, photos: addedPhoto, finishing: finish, yarn: Yarn, width1: Width1, width2: Width2, weight: Weight, cost: price
    });

    await clothdoc.save()
    res.json(clothdoc)


})


app.post('/product-filter', async (req, res) => {
    try {
        const { material, yarn, weight, finishing } = req.body;
        let args = {}

        if (material.length) {
            args.content = material;
        }

        if (yarn.length) {
            args.yarn = yarn; // Exact match for yarn
        }

        if (weight.length) {
            args.weight = weight; // Exact match for weight
        }

        if (finishing.length) {
            args.finishing = finishing;
        }

        console.log(args);
        const products = await cloth.find(args)
        res.status(200).send({
            success: true,
            products,
        })

    } catch (error) {
        res.status(400).send({
            success: false,
            message: "error while filtering",
            error
        })

    }
})

app.get('/product-count', async (req, res) => {
    try {
        const total = await cloth.find({}).estimatedDocumentCount();
        res.status(200).send({
            success: true,
            total,
        });

    } catch (error) {
        res.status(400).send({
            message: "error in product count",
            error,
            success: false
        })

    }
})
app.get('/product-list/:page', async (req, res) => {
    try {
        const perPage = 4;
        const page = parseInt(req.params.page) || 1; // Convert to number with parseInt
        const products = await cloth
            .find({})
            .select("-photo")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .sort({ createdAt: -1 });

        res.status(200).send({
            success: true,
            products,
        });
    } catch (error) {
        res.status(400).send({
            success: false,
            message: "error in page count",
            error: error,
        });
    }
});

app.get('/search/:keyword', async (req, res) => {
    try {
        const { keyword } = req.params;
        const results = await cloth.find({
            $or: [
                { name: { $regex: keyword, $options: "i" } },
                { content: { $regex: keyword, $options: "i" } }
            ]
        });
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error in searching", error: err });
    }
});

// single product page
app.get('/collections/:id', async (req, res) => {
    const { id } = req.params;

    res.json(await cloth.findById(id));
    // res.json(id);
})





app.get('/', (req, res) => {
    res.json('Hey backend set up is done')
})

export { app }