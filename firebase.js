import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
const firebaseConfig={apiKey:"AIzaSyBHyjd6A6CKqMggLWfcK5itdnziWvE4gUU",authDomain:"ahmed-samir-portfolio.firebaseapp.com",projectId:"ahmed-samir-portfolio",storageBucket:"ahmed-samir-portfolio.firebasestorage.app",messagingSenderId:"39116009978",appId:"1:39116009978:web:cdf182cd681c1d53b8f443",measurementId:"G-WQC9GTLRGL"};
export const ADMIN_UID="bJbTUeWA8wV7KXZrfg0zRGlIWg62"; const app=initializeApp(firebaseConfig); export const auth=getAuth(app); export const db=getFirestore(app);
