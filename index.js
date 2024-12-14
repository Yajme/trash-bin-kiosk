import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import qrcode from "qrcode";
import path from 'path';
import axios from "axios";
import cookieParser from 'cookie-parser';

import session from "express-session";
import { initSupabase } from "./controller/supabase.js";

import firebase from './controller/firebase.js';
import {initSerial,initSerialUltrasonic,sendCommand} from './utils/serial.js';
import { initSocket,QRcodeScanned } from "./controller/socket.js";

import http from 'http';
import cors from 'cors';
import { runPythonScript,runConveyorBelt } from "./utils/tools.js";
import cache from 'memory-cache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

//Session Initialization
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized:true,
    cookie: {maxAge: 3600000}
}))

dotenv.config();
// Middleware to parse JSON and URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.set("view engine", "ejs");
app.use(cors()); 
app.use(cookieParser());
app.set(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
//firebase.initializeFirebase();
let server = http.createServer(app);
initSocket(server,
    {
        run : runPythonScript,
        runConveyorBelt : runConveyorBelt,
        sendCommand : sendCommand
    });
initSupabase(QRcodeScanned);
initSerial();
initSerialUltrasonic();



    
const test_mode = process.env.ENVIRONMENT === 'PRODUCTION' ? false : process.env.ENVIRONMENT === 'DEVELOPMENT' ? true : null;
app.get('/test',(req,res)=>{
    res.render('test');
})
app.get('/command',(req,res)=>{
    const command = req.query.category;
    const angle = Number(req.query.angle);

    
    sendCommand(`${command} ${angle} `);
    res.send(`${command} ${angle} `);
});
app.get('/stop',(req,res)=>{
    sendCommand('stop');
    res.send('stopped');
});
app.get('/go',(req,res,)=>{
    sendCommand('go');
res.send('started');
})
app.get("/", async (req, res, next) => {
    res.render('index', {
    });
});
app.get("/start", async (req, res, next) => {
    const request = await axios.get('https://trash-bin-api.vercel.app/waste/generate');
    const response = request.data;
    console.log(response);
    const code = response.qrcode;
    res.cookie('qrcode', code, {
        httpOnly: true, // Prevents client-side access to the cookie
        maxAge: 1000 * 60 * 60, // Expires in 1 hour
    });
    const qrCodeImage = await qrcode.toDataURL(code);
    res.render('started', {
        id: response.qr_code_id,
        qrcode : code,
        data: qrCodeImage,
        error: null
    });
});
app.get('/process', async (req,res,next)=>{
    const code = req.cookies.qrcode;
    if(!code) return res.redirect('/');
    const {user_id} = req.query;
    if(!user_id) return res.redirect('/');
    req.session.user_id = user_id;
    const qrCodeImage = await qrcode.toDataURL(code);
    res.render('process',
        {
            data : qrCodeImage
        }
    );
});



app.get('/done', async (req, res, next) => {
    try {
        const code = req.cookies.qrcode; // Retrieve the QR code from the cookie
        if(!code) return res.redirect('/');
        const qrCodeImage = await qrcode.toDataURL(code); // Generate the QR code image


        res.render('done', {
            data: qrCodeImage,
            message: 'Waste records have been successfully registered!',
            error: null
        });
    } catch (error) {
        const qrCodeImage = await qrcode.toDataURL(error.message);
        console.error("Error processing /done:", error);
        res.render('done', {
            data: qrCodeImage,
            error: 'Failed to register waste records.'
        });
    }
});
app.post('/done', async (req,res,next)=>{
    try {
        const jsonData = cache.get('records');
        console.log(jsonData);

        if (!jsonData) {
            throw new Error("No data available for registration.");
        }

        // Simulating waste record creation using jsonData from Python script
        const wasteRecordsData = {
            records : jsonData,
            user_id : req.session.user_id
        };

    // Call the registerWasteRecords function with the data
    await axios.post('https://trash-bin-api.vercel.app/waste/register', wasteRecordsData);
    // Respond with the 'done' page and the QR code image
    res.redirect('/thankyou');
    } catch (error) {
        console.log(error);
        const qrCodeImage = await qrcode.toDataURL(error.message);
        console.error("Error processing /done:", error);
        res.render('done', {
            data: qrCodeImage,
            error: 'Failed to register waste records.'
        });
    }
});
app.get('/thankyou',(req,res,next)=>{
    req.session.destroy(err => {
        if (err) {
          return res.status(500).send('Failed to destroy session');
        }
        res.clearCookie('qrcode'); 
        res.render('thankyou');
      });
});


const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log("Server is now running on http://localhost:" + PORT);
});

