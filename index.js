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

app.set("view engine", "ejs");
app.set(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
firebase.initializeFirebase();

app.get("/", async (req, res, next) => {
    const request = await axios.get('https://trash-bin-api.vercel.app/waste/generate');
    const response = request.data;
    const code = response.qrcode;
    const qrCodeImage = await qrcode.toDataURL(code);
    res.send(`<img src="${qrCodeImage}" alt="QR Code"/>`);
});
app.get("/start", async (req, res, next) => {
    const request = await axios.get('https://trash-bin-api.vercel.app/waste/generate');
    const response = request.data;
    const code = response.qrcode;
    const qrCodeImage = await qrcode.toDataURL(code);
    res.render('started', {
        data: qrCodeImage
    });
});
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log("Server is now running on http://localhost:" + PORT);
});