import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css"; // Tailwind
<<<<<<< HEAD
import { GoogleOAuthProvider } from '@react-oauth/google';

=======
>>>>>>> parent of 80d4bb9e (Merge branch 'hotfix/urgent-bug' into HONG)

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
<<<<<<< HEAD
      <GoogleOAuthProvider 
        clientId="649549151225-agj4cnqnvrbn4r00581oliujgi58kqcb.apps.googleusercontent.com"
        onScriptLoadError={() => console.log('Script load error')}
        useOneTap={false}
      >
        <App />
      </GoogleOAuthProvider>
=======
      <App />
>>>>>>> parent of 80d4bb9e (Merge branch 'hotfix/urgent-bug' into HONG)
    </BrowserRouter>
  </React.StrictMode>
);
