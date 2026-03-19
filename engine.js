// engine.js - VERSI TURBO FINAL (SUPER NGEBUT)

const SHEET_ID = '15_W4a5iyC7zhjvoTVVNNnK-_nxGFbKty2onOukyL76A';

// Fungsi sakti untuk menyedot data langsung dari Sheet tanpa antre
async function fetchSheet(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}&headers=1`;
    try {
        const res = await fetch(url);
        const text = await res.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/);
        if (match && match[1]) {
            const data = JSON.parse(match[1]);
            if (!data.table || !data.table.rows) return [];
            return data.table.rows.map(row => row.c ? row.c.map(col => (col && col.v !== null && col.v !== undefined) ? col.v : '') : []);
        }
    } catch (e) { console.error(e); }
    return [];
}

document.addEventListener('DOMContentLoaded', async () => {
    const spinner = document.getElementById('loading-spinner');
    const pageBody = document.getElementById('page-body');
    const errorBox = document.getElementById('error-box');
    const contentBox = document.getElementById('app-content');

    try {
        // Deteksi Rute URL Pengunjung
        let currentPath = window.location.pathname.replace(/\/$/, '');
        let isBlogList = currentPath === '/blog';
        let isPostDetail = currentPath.startsWith('/blog/');
        let isHome = currentPath === '' || currentPath === '/' || currentPath === '/index.html';
        
        // JURUS PARALEL: Tarik Pengaturan dan Konten SECARA BERSAMAAN
        let fetchPromises = [fetchSheet('Settings')];
        if (isBlogList || isPostDetail) {
            fetchPromises.push(fetchSheet('Posts')); // Tarik Blog
        } else {
            fetchPromises.push(fetchSheet('Pages')); // Tarik Halaman Statis
        }

        // Eksekusi Tarik Data (Hanya butuh sekian milidetik)
        const results = await Promise.all(fetchPromises);
        const settingsData = results[0];
        const contentData = results[1] || [];

        // 1. Terapkan Pengaturan Branding
        let s = {};
        settingsData.forEach(row => { if(row && row[0]) s[row[0]] = row[1]; });
        
        if (s.site_name) {
            document.getElementById('site-name').textContent = s.site_name;
            document.getElementById('footer-site-name').textContent = s.site_name;
            document.title = s.site_name;
        }
        if (s.site_tagline) { document.getElementById('site-tagline').textContent = s.site_tagline; document.getElementById('site-tagline').classList.remove('hidden'); }
        if (s.site_logo) { document.getElementById('site-logo').src = s.site_logo; document.getElementById('site-logo').classList.remove('hidden'); }
        if (s.site_favicon) { document.getElementById('dynamic-favicon').href = s.site_favicon; }
        
        let homePageSlug = s.home_page || '';

        // 2. Tampilkan Konten Sesuai URL
        
        // Skenario A: Halaman Beranda
        if (isHome) {
            if(!homePageSlug) {
                spinner.classList.add('hidden');
                pageBody.innerHTML = `<h2 class="text-2xl font-black">Selamat Datang!</h2><p>Silakan set beranda di Admin Panel.</p>`;
                return;
            }
            renderPage(contentData, homePageSlug, s.site_name);
        } 
        
        // Skenario B: Daftar Artikel Blog
        else if (isBlogList) {
            document.title = `Blog & Artikel - ${s.site_name || 'Web'}`;
            spinner.classList.add('hidden');
            
            let posts = [...contentData].reverse(); // Terbaru di atas

            let html = `<div class="mb-10 border-b pb-4"><h1 class="text-3xl font-black text-slate-800">Artikel Terbaru</h1><p class="text-slate-500">Baca wawasan dan info terkini dari kami.</p></div>`;
            html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-8">`;
            
            if (posts.length === 0) {
                html += `<p class="text-slate-500 italic">Belum ada artikel yang dipublikasikan.</p>`;
            } else {
                posts.forEach(p => {
                    let contentRaw = p[5] ? String(p[5]) : '';
                    let excerpt = contentRaw.replace(/<[^>]+>/g, '').substring(0, 120) + '...';
                    let imgTag = p[4] ? `<img src="${p[4]}" class="w-full h-48 object-cover rounded-2xl mb-4">` : `<div class="w-full h-48 bg-slate-100 rounded-2xl mb-4 flex items-center justify-center text-slate-300"><i data-lucide="image" class="w-8 h-8"></i></div>`;
                    
                    html += `
                    <div class="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer" onclick="window.location.href='/blog/${p[1] || ''}'">
                        ${imgTag}
                        <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">${p[3] || 'Info'}</span>
                        <h3 class="text-xl font-black text-slate-800 mt-4 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">${p[2] || 'Tanpa Judul'}</h3>
                        <p class="text-sm text-slate-500 line-clamp-3 mb-4">${excerpt}</p>
                        <span class="text-xs font-bold text-slate-400">${p[6] || ''}</span>
                    </div>`;
                });
            }
            html += `</div>`;
            pageBody.innerHTML = html;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } 
        
        // Skenario C: Baca Satu Artikel Penuh
        else if (isPostDetail) {
            const slug = currentPath.split('/')[2];
            spinner.classList.add('hidden');
            const post = contentData.find(p => p[1] === slug);

            if (post) {
                document.title = `${post[2] || 'Artikel'} - ${s.site_name || 'Web'}`;
                let imgHTML = post[4] ? `<img src="${post[4]}" class="w-full h-[300px] md:h-[400px] object-cover rounded-[2rem] mb-8 shadow-md">` : '';
                
                pageBody.innerHTML = `
                    <div class="mb-8">
                        <a href="/blog" class="text-xs font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-700 flex items-center gap-1 mb-6">&larr; Kembali ke Blog</a>
                        <span class="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">${post[3] || 'Info'}</span>
                        <h1 class="text-3xl md:text-5xl font-black text-slate-800 mt-4 mb-4 leading-tight">${post[2] || ''}</h1>
                        <p class="text-slate-400 font-medium text-sm">Diterbitkan pada: ${post[6] || ''}</p>
                    </div>
                    ${imgHTML}
                    <div class="cms-content text-lg">
                        ${post[5] || ''}
                    </div>
                `;
            } else { showError(); }
        } 
        
        // Skenario D: Halaman Statis Biasa
        else {
            const slug = currentPath.substring(1);
            renderPage(contentData, slug, s.site_name);
        }

    } catch (error) { 
        console.error(error);
        spinner.classList.add('hidden'); 
        showError(); 
    }

    // Helper Fungsi Render Halaman
    function renderPage(pagesData, slug, siteName) {
        spinner.classList.add('hidden');
        const page = pagesData.find(p => p[1] === slug);
        if (page) {
            document.title = `${page[2] || 'Halaman'} - ${siteName || 'Web'}`;
            pageBody.innerHTML = page[3] || '';
        } else { showError(); }
    }

    function showError() { 
        contentBox.classList.add('hidden'); 
        errorBox.classList.remove('hidden'); 
        document.title = "404 - Halaman Tidak Ditemukan"; 
    }
});
