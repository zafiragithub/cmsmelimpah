// engine.js

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? (typeof SCRIPT_URL !== 'undefined' ? SCRIPT_URL : '') 
                : '/api';

document.addEventListener('DOMContentLoaded', async () => {
    const spinner = document.getElementById('loading-spinner');
    const pageBody = document.getElementById('page-body');
    const errorBox = document.getElementById('error-box');
    const contentBox = document.getElementById('app-content');

    if (!API_URL) { showError(); return; }

    try {
        // 1. Ambil Pengaturan
        const settingsRes = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_global_settings' }) });
        const settingsData = await settingsRes.json();
        let homePageSlug = '';

        if (settingsData.status === 'success') {
            const s = settingsData.data;
            if (s.site_name) {
                document.getElementById('site-name').textContent = s.site_name;
                document.getElementById('footer-site-name').textContent = s.site_name;
                document.title = s.site_name;
            }
            if (s.site_tagline) { document.getElementById('site-tagline').textContent = s.site_tagline; document.getElementById('site-tagline').classList.remove('hidden'); }
            if (s.site_logo) { document.getElementById('site-logo').src = s.site_logo; document.getElementById('site-logo').classList.remove('hidden'); }
            if (s.site_favicon) { document.getElementById('dynamic-favicon').href = s.site_favicon; }
            if (s.home_page) { homePageSlug = s.home_page; }
        }

        // 2. Baca URL & Rute (Routing)
        let currentPath = window.location.pathname.replace(/\/$/, ''); 
        
        // Skenario A: Halaman Beranda Utama
        if (currentPath === '' || currentPath === '/' || currentPath === '/index.html') {
            if(!homePageSlug) {
                spinner.classList.add('hidden');
                pageBody.innerHTML = `<h2 class="text-2xl font-black">Selamat Datang!</h2><p>Silakan set beranda di Admin Panel.</p>`;
                return;
            }
            await fetchAndRenderPage(homePageSlug);
        } 
        
        // Skenario B: Halaman Daftar Blog (/blog)
        else if (currentPath === '/blog') {
            document.title = `Blog & Artikel - ${document.getElementById('site-name').textContent}`;
            const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_public_posts' }) });
            const data = await res.json();
            spinner.classList.add('hidden');
            
            if (data.status === 'success') {
                let html = `<div class="mb-10 border-b pb-4"><h1 class="text-3xl font-black text-slate-800">Artikel Terbaru</h1><p class="text-slate-500">Baca wawasan dan info terkini dari kami.</p></div>`;
                html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-8">`;
                
                if (data.data.length === 0) {
                    html += `<p class="text-slate-500 italic">Belum ada artikel yang dipublikasikan.</p>`;
                } else {
                    data.data.forEach(p => {
                        let imgTag = p.image ? `<img src="${p.image}" class="w-full h-48 object-cover rounded-2xl mb-4">` : `<div class="w-full h-48 bg-slate-100 rounded-2xl mb-4 flex items-center justify-center text-slate-300"><i data-lucide="image" class="w-8 h-8"></i></div>`;
                        html += `
                        <div class="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer" onclick="window.location.href='/blog/${p.slug}'">
                            ${imgTag}
                            <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">${p.category || 'Info'}</span>
                            <h3 class="text-xl font-black text-slate-800 mt-4 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">${p.title}</h3>
                            <p class="text-sm text-slate-500 line-clamp-3 mb-4">${p.excerpt}</p>
                            <span class="text-xs font-bold text-slate-400">${p.date}</span>
                        </div>`;
                    });
                }
                html += `</div>`;
                pageBody.innerHTML = html;
                
                // Panggil ulang ikon lucide jika ada (karena render dinamis)
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else { showError(); }
        }

        // Skenario C: Baca Satu Artikel Penuh (/blog/slug-artikel)
        else if (currentPath.startsWith('/blog/')) {
            const slug = currentPath.split('/')[2]; // Ambil bagian ke-3 dari URL
            const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_public_post_detail', slug: slug }) });
            const data = await res.json();
            spinner.classList.add('hidden');

            if (data.status === 'success') {
                const post = data.data;
                document.title = `${post.title} - ${document.getElementById('site-name').textContent}`;
                
                let imgHTML = post.image ? `<img src="${post.image}" class="w-full h-[300px] md:h-[400px] object-cover rounded-[2rem] mb-8 shadow-md">` : '';
                
                pageBody.innerHTML = `
                    <div class="mb-8">
                        <a href="/blog" class="text-xs font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-700 flex items-center gap-1 mb-6">&larr; Kembali ke Blog</a>
                        <span class="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">${post.category || 'Info'}</span>
                        <h1 class="text-3xl md:text-5xl font-black text-slate-800 mt-4 mb-4 leading-tight">${post.title}</h1>
                        <p class="text-slate-400 font-medium text-sm">Diterbitkan pada: ${post.date}</p>
                    </div>
                    ${imgHTML}
                    <div class="cms-content text-lg">
                        ${post.content}
                    </div>
                `;
            } else { showError(); }
        }
        
        // Skenario D: Halaman Statis Biasa (/tentang-kami)
        else {
            const slug = currentPath.substring(1);
            await fetchAndRenderPage(slug);
        }

    } catch (error) { spinner.classList.add('hidden'); showError(); }

    // Fungsi Ambil Halaman Statis
    async function fetchAndRenderPage(slug) {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'get_public_page', slug: slug }) });
        const data = await res.json();
        spinner.classList.add('hidden');
        if (data.status === 'success') {
            document.title = `${data.data.title} - ${document.getElementById('site-name').textContent}`;
            pageBody.innerHTML = data.data.content;
        } else { showError(); }
    }

    function showError() { contentBox.classList.add('hidden'); errorBox.classList.remove('hidden'); document.title = "404 - Halaman Tidak Ditemukan"; }
});
