// _worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Jika frontend memanggil jalur /api, teruskan ke Google Apps Script
    if (url.pathname === "/api") {
      // URL rahasia database Anda
      const gasUrl = "https://script.google.com/macros/s/AKfycbzR5CgdfZ-1pzFxcK1bZIGWQoHqUnrHNG93D2Rwgw5hgZ4D6GSi7JmjQkjq9k2jlqcl/exec";
      
      const reqBody = await request.text();
      const response = await fetch(gasUrl, {
        method: request.method,
        body: reqBody,
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
      });
      
      const data = await response.text();
      return new Response(data, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Jika bukan /api, layani file statis HTML/CSS/JS seperti biasa
    return env.ASSETS.fetch(request);
  }
};
