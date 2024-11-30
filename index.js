import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import qrcode from "qrcode";
import path from 'path';
import axios from "axios";



import firebase from './controller/firebase.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
dotenv.config();
// Middleware to parse JSON and URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.set("view engine", "ejs");
app.set(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
firebase.initializeFirebase();

app.get("/", async (req, res, next) => {
    res.render('index', {
    });
});
app.get("/start", async (req, res, next) => {
    const request = await axios.get('http://localhost:9000/waste/generate');
    const response = request.data;
    console.log(response);
    const code = response.qrcode;
    const qrCodeImage = await qrcode.toDataURL(code);
    res.render('started', {
        id: response.qr_code_id,
        data: qrCodeImage,
        error: null
    });
});

app.post("/start", async (req,res,next)=>{
    //Replace the url to real link
    const url = 'https://trash-bin-api.vercel.app/waste/check-scan?id=' + req.body.id;
    const scanned = pollScanStatus(url,24,res);

});

async function pollScanStatus(url, limit=24,res,count=0) {
    try {
        count++;
        console.log(url);
        console.log("attempt :" + count);
        
        const response = await fetch(url);
        const data = await response.json();
        if(count <= limit){
            if (data.scanned) {
                console.log('QR Code was scanned!');
                res.redirect('/');
            } else {
                setTimeout(() => pollScanStatus(url,limit,res,count), 10000); // Poll every second
            }
        }else{
            throw new Error('poll reached its limit');
        }
    } catch (error) {
        res.render('started',{
            error: error,
            id: ''
        })
    } 
}
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log("Server is now running on http://localhost:" + PORT);
});