import axios from "axios";

// Using Vite's environment variables. 
// When deploying to Netlify, set VITE_API_URL to the Vercel app URL (e.g. https://your-backend.vercel.app/api)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export default API;
