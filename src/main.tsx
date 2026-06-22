import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept fetch requests for Google Apps Script deployment
const isAppsScriptEnv = typeof window !== "undefined" && (
  (window as any).google?.script?.run || 
  window.location.hostname.includes("googleusercontent.com") ||
  window.location.hostname.includes("script.google.com")
);

if (isAppsScriptEnv) {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === "string" ? input : (input instanceof URL ? input.toString() : (input as Request).url);
    
    // Only intercept local API requests
    if (urlStr.startsWith("/api/")) {
      const path = urlStr;
      const method = init?.method || "GET";
      const body = init?.body ? String(init.body) : "";
      
      return new Promise<Response>((resolve) => {
        const executeCall = (retries = 0) => {
          const googleObj = (window as any).google;
          if (googleObj?.script?.run) {
            googleObj.script.run
              .withSuccessHandler((result: any) => {
                const responseText = typeof result === "object" ? JSON.stringify(result) : String(result);
                resolve(new Response(responseText, {
                  status: 200,
                  headers: { "Content-Type": "application/json" }
                }));
              })
              .withFailureHandler((err: any) => {
                const errorMsg = err?.message || String(err);
                resolve(new Response(JSON.stringify({ success: false, message: errorMsg }), {
                  status: 500,
                  headers: { "Content-Type": "application/json" }
                }));
              })
              .api_handler(path, method, body);
          } else {
            if (retries < 40) {
              setTimeout(() => executeCall(retries + 1), 100);
            } else {
              resolve(new Response(JSON.stringify({ 
                success: false, 
                message: "Apps Script API (google.script.run) tidak ditemukan. Pastikan web app dijalankan di lingkungan Google Apps Script." 
              }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
              }));
            }
          }
        };
        executeCall();
      });
    }
    
    return originalFetch(input, init);
  } as any;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
