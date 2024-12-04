import express, { json } from "express";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import qrcode from "qrcode";
import path from 'path';
import axios from "axios";
import cookieParser from 'cookie-parser';
import { spawn } from 'child_process';
import session from "express-session";



import firebase from './controller/firebase.js';
import { SerialPort, ReadlineParser } from 'serialport';


// Configure the serial port
const port = new SerialPort({
  path: '/dev/ttyACM0', // Replace with your serial port path
  baudRate: 9600,       // Match the baud rate with your Arduino
});

// Set up a parser to read data line by line
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Function to send commands to the serial port
function sendCommand(command) {
  console.log(`Sending: ${command}`);
  port.write(`${command}\n`, (err) => {
    if (err) {
      console.error('Error writing to serial port:', err.message);
    }
  });
}

// Open the port and handle events
port.on('open', () => {
  console.log('Serial Port Opened');

  
});

// Listen for data from the Arduino
parser.on('data', (data) => {
  console.log(`Arduino: ${data.trim()}`);
});

// Handle errors
port.on('error', (err) => {
  console.error('Serial Port Error:', err.message);
});
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
app.use(cookieParser());
app.set(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
//firebase.initializeFirebase();
const test_mode = true;
app.get('/command',(req,res)=>{
    const command = req.query.category;
    const angle = req.query.angle;

    sendCommand(`${command} ${angle} `);
    res.send(`${command} ${angle} `);
});
app.get('/stop',(req,res)=>{
    sendCommand('stop');
    res.send('stopped');
});
app.get('/go',(req,res,)=>{
    sendCommand('go');
    sendCommand('plastic 90');
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
    console.log(req.cookies);
    const code= req.cookies.qrcode;
    console.log(code);
    const qrCodeImage = await qrcode.toDataURL(code);
    res.render('process',
        {
            data : qrCodeImage
        }
    );

    // Run the Python script
    if(!test_mode){
        runPythonScript('/home/pi/Desktop/picam_test.py')
        .then((jsonData) => {
            // Store the JSON data in session
            req.session.jsonData = jsonData;
            console.log(req.session.jsonData);
            const category = jsonData[0].category;
            sendCommand(`${category} 125`);
            sendCommand('go');

            setInterval(()=>{
                sendCommand('stop');
            },10000);
            console.log(jsonData);
        })
        .catch((error) => {
            console.error('Error running Python script:', error);
            res.render('process', {
                error: 'Failed to retrieve data from Python script.'
            });
        });

    }
    

});

// Function to run Python script
function runPythonScript(scriptPath) {
    return new Promise((resolve, reject) => {
        // Run the command in a bash shell to properly source the virtual environment
        const pythonProcess = spawn('bash', ['-c', `source /home/pi/pytorch/bin/activate && python ${scriptPath}`]);

        let resultString = '';
        let errorString = '';

        // Capture output from the Python script
        pythonProcess.stdout.on('data', (data) => {
            resultString += data.toString();
        });

        // Capture errors from the Python script
        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        // Handle process close event
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(`Python script exited with code ${code}: ${errorString}`);
                return;
            }

            try {
                const jsonData = JSON.parse(resultString);
                resolve(jsonData);
            } catch (parseError) {
                reject(`Failed to parse JSON: ${parseError.message}`);
            }
        });
    });
}

app.get('/done', async (req, res, next) => {
    try {
        console.log(req.session);
        const code = req.cookies.qrcode; // Retrieve the QR code from the cookie
        const qrCodeImage = await qrcode.toDataURL(code); // Generate the QR code image

        // Get the JSON data that was stored in the session
        const jsonData = req.session.jsonData;

        if (!jsonData) {
            throw new Error("No data available for registration.");
        }

        // Simulating waste record creation using jsonData from Python script
        const wasteRecordsData = {
            category: jsonData.category, 
            created_at: jsonData.records,
            points: jsonData.points,
            user: jsonData.user,
            weight: jsonData.weight
        };

        // Call the registerWasteRecords function with the data
        //await registerWasteRecords(wasteRecordsData, res, next);
        //await axios.post('https://trash-bin-api.vercel.app/waste/register', wasteRecordsData);
        // Respond with the 'done' page and the QR code image
        res.render('done', {
            data: qrCodeImage,
            message: 'Waste records have been successfully registered!'
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

app.get('/thankyou',(req,res,next)=>{
    res.render('thankyou');
})
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
                res.redirect('/process');
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