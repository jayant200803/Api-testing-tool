# 🧪 API Testing Tool (Postman-Like Web App)

A full-stack API testing platform inspired by **Postman** and **Hoppscotch**, built using  
**React + Vite (Frontend)**, **Node.js + Express (Backend)**, and **Supabase (Database)**.

This tool allows users to send API requests, inspect responses, save history, create collections, and test REST APIs inside a clean professional UI.

---

## 🚀 Features

### ✔ API Request Builder  
- Choose HTTP method (GET, POST, PUT, PATCH, DELETE)  
- Add headers (JSON)  
- Add request body (JSON)  
- Send API requests and view JSON response  
- Response shown with Status, Headers, and Body  

### ✔ Response Viewer  
- Beautiful formatted JSON viewer  
- Status code + response time  
- Separate sections for headers and body  

### ✔ History (Saved automatically)  
- Every request + response is stored  
- Stored inside **Supabase**  
- Click history item to reload request  

### ✔ Collections (Like Postman)  
- Create collections  
- Add request items  
- View items inside collapsible folder UI  
- Click to load a saved request  

### ✔ Backend  
- Proxy server (axios) to safely call external APIs  
- History saving  
- Collections saving  
- CORS enabled  
- Deployed on **Render**  

### ✔ Deployment  
- Frontend: Render Static Site  
- Backend: Render Web Service  
- Database: Supabase  

---

## 🛠 Tech Stack

### **Frontend**
- React (Vite)
- Axios
- react18-json-view
- Supabase client
- Custom CSS (glass UI)

### **Backend**
- Node.js
- Express
- Axios (Proxy API)
- Supabase (using service key)

### **Database**
- Supabase (PostgreSQL)
- Tables:
  - `history`
  - `collections`
  - `collection_items`

---

## 📁 Project Structure

