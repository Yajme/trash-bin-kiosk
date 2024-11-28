// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, getToken,isSupported} from "firebase/messaging";
import dotenv from "dotenv";
dotenv.config();

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};
//console.log(firebaseConfig);
// Initialize Firebase
let app;


const initializeFirebase = ()=>{
  try{
      app = initializeApp(firebaseConfig);
      return app;
  }catch(err){
      console.log(`${err}`);
  }
}

export default{
initializeFirebase
};