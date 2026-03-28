// _worker.js - Super SaaS API Gateway (Cloudflare Proxy)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 1. TANGANI CORS PREFLIGHT (Sangat penting untuk form POST)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // 2. TANGANI JALUR /api (Proxy ke Google Apps Script)
    if (url.pathname === "/api") {
      // URL Rahasia GAS Anda
      const gasUrl = new URL("https://script.google.com/macros/s/AKfycbzR5CgdfZ-1pzFxcK1bZIGWQoHqUnrHNG93D2Rwgw5hgZ4D6GSi7JmjQkjq9k2jlqcl/exec");
      
      // Teruskan semua parameter Query String (Penting untuk metode GET)
      url.searchParams.forEach((value, key) => {
        gasUrl.searchParams.append(key, value);
      });

      const fetchInit = {
        method: request.method,
        headers: {
          // Gunakan text/plain agar GAS tidak protes saat menerima body JSON mentah
          "Content-Type": "text/plain;charset=utf-8", 
        }
      };

      // Hanya tambahkan body jika bukan GET atau HEAD (Mencegah Crash)
      if (request.method !== "GET" && request.method !== "HEAD") {
        fetchInit.body = await request.text();
      }

      try {
        // Tembak ke Server Google
        const response = await fetch(gasUrl.toString(), fetchInit);
        const data = await response.text();
        
        // Kembalikan ke Frontend dengan Header CORS lengkap
        return new Response(data, {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        // Fallback jika Google Down / Timeout
        return new Response(JSON.stringify({ 
          status: "error", 
          message: "API Gateway Error: Tidak dapat terhubung ke server database." 
        }), {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        });
      }
    }

    // 3. JIKA BUKAN /api, LAYANI FILE STATIS BISA (HTML/CSS/JS)
    return env.ASSETS.fetch(request);
  }
};
