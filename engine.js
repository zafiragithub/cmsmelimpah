// engine.js - VERSI CANVAS MODE (v7)

const SHEET_ID = '15_W4a5iyC7zhjvoTVVNNnK-_nxGFbKty2onOukyL76A';

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
    const appCanvas = document.getElementById('app-canvas');
    const errorBox = document.getElementById('error-box');

    try {
        let currentPath = window.location.pathname.replace(/\/$/, '');
        let isBlogList = currentPath === '/blog';
        let isPostDetail = currentPath.startsWith('/blog/');
        let isHome = currentPath === '' || currentPath === '/' || currentPath === '/index.html';
        
        let fetchPromises = [fetchSheet('Settings')];
        if (isBlogList || isPostDetail) fetchPromises.push(fetchSheet('Posts'));
        else fetchPromises.push(fetchSheet('Pages'));

        const results = await Promise.all(fetchPromises);
        const settingsData = results[0];
        const contentData = results[1] || [];

        let s = {};
        settingsData.forEach(row => { if(row && row[0]) s[row[0]] = row[1]; });
        
        if (s.site_name) document.title = s.site_name;
        if (s.site_favicon) document.getElementById('dynamic-favicon').href = s.site_favicon;
        
        let homePageSlug = s.home_page || '';

        // --- SKENARIO A: HALAMAN STATIS (MODE CANVAS 100% BEBAS) ---
        if (isHome || (!isBlogList && !isPostDetail)) {
            const slug = isHome ? homePageSlug : currentPath.substring(1);
            if (!slug && isHome) {
                showCanvas(`<div class="text-center p-20"><h2 class="text-2xl font-black">Canvas Siap!</h2><p>Set Beranda di Admin Panel.</p></div>`);
                return;
            }
            const page = contentData.find(p => p[1] === slug);
            if (page) {
                document.title = `${page[2] || 'Halaman'} - ${s.site_name || 'Web'}`;
                // Render Murni Tanpa Pembatas!
                showCanvas(page[3] || '');
            } else { showError(); }
        } 
        
        // --- SKENARIO B: DAFTAR ARTIKEL (/BLOG) ---
        else if (isBlogList) {
            document.title = `Blog & Artikel - ${s.site_name || 'Web'}`;
            let posts = [...contentData].reverse(); 

            // Kita buatkan Header & Pembatas khusus untuk Blog agar tetap rapi dibaca
            let html = `
            <header class="bg-white border-b border-slate-200 py-6 mb-10 shadow-sm sticky top-0 z-50">
                <div class="max-w-5xl mx-auto px-6 flex justify-between items-center">
                    <a href="/" class="text-2xl font-black tracking-tighter text-slate-800">${s.site_name || 'BeritaKita'}</a>
                    <a href="/" class="text-sm font-bold text-slate-500 hover:text-indigo-600">Beranda</a>
                </div>
            </header>
            <div class="max-w-5xl mx-auto px-6 mb-20">
                <div class="mb-10 border-b border-slate-200 pb-4"><h1 class="text-4xl font-black text-slate-800 tracking-tight">Artikel Terbaru</h1><p class="text-slate-500 mt-2">Baca wawasan dan info terkini dari kami.</p></div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">`;
            
            if (posts.length === 0) {
                html += `<p class="text-slate-500 italic">Belum ada artikel.</p>`;
            } else {
                posts.forEach(p => {
                    let contentRaw = p[5] ? String(p[5]) : '';
                    let excerpt = contentRaw.replace(/<[^>]+>/g, '').substring(0, 100) + '...';
                    let imgTag = p[4] ? `<img src="${p[4]}" class="w-full h-48 object-cover rounded-2xl mb-4 shadow-sm">` : `<div class="w-full h-48 bg-slate-100 rounded-2xl mb-4 flex items-center justify-center text-slate-300">Gambar</div>`;
                    
                    html += `
                    <div class="group cursor-pointer" onclick="window.location.href='/blog/${p[1] || ''}'">
                        <div class="overflow-hidden rounded-2xl">${imgTag}</div>
                        <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-2 mt-4">${p[3] || 'Info'}</span>
                        <h3 class="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors leading-snug">${p[2] || 'Tanpa Judul'}</h3>
                        <p class="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">${excerpt}</p>
                        <span class="text-[11px] font-medium text-slate-400">${p[6] || ''}</span>
                    </div>`;
                });
            }
            html += `</div></div>`;
            showCanvas(html);
        } 
        
        // --- SKENARIO C: BACA ARTIKEL (/BLOG/SLUG) ---
        else if (isPostDetail) {
            const slug = currentPath.split('/')[2];
            const post = contentData.find(p => p[1] === slug);

            if (post) {
                document.title = `${post[2] || 'Artikel'} - ${s.site_name || 'Web'}`;
                let imgHTML = post[4] ? `<img src="${post[4]}" class="w-full h-[400px] object-cover rounded-3xl mb-10 shadow-lg">` : '';
                
                // Layout khusus Baca Artikel agar elegan di tengah layar
                let html = `
                <header class="bg-white border-b border-slate-200 py-6 mb-10 shadow-sm sticky top-0 z-50">
                    <div class="max-w-3xl mx-auto px-6 flex justify-between items-center">
                        <a href="/" class="text-2xl font-black tracking-tighter text-slate-800">${s.site_name || 'BeritaKita'}</a>
                        <a href="/blog" class="text-sm font-bold text-slate-500 hover:text-indigo-600">Lihat Semua Artikel</a>
                    </div>
                </header>
                <article class="max-w-3xl mx-auto px-6 mb-20">
                    <div class="mb-8 text-center">
                        <span class="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">${post[3] || 'Info'}</span>
                        <h1 class="text-4xl md:text-5xl font-black text-slate-900 mt-6 mb-6 leading-[1.1] tracking-tight">${post[2] || ''}</h1>
                        <p class="text-slate-400 font-medium text-sm">Diterbitkan pada: ${post[6] || ''}</p>
                    </div>
                    ${imgHTML}
                    <div class="cms-content text-lg text-slate-700 leading-relaxed">
                        ${post[5] || ''}
                    </div>
                </article>`;
                showCanvas(html);
            } else { showError(); }
        } 

    } catch (error) { 
        console.error(error);
        showError(); 
    }

    // Fungsi Pembantu Transisi Tampilan Halus
    function showCanvas(htmlContent) {
        spinner.classList.add('opacity-0'); // Hilangkan loading pelan-pelan
        setTimeout(() => {
            spinner.classList.add('hidden');
            appCanvas.innerHTML = htmlContent;
            appCanvas.classList.remove('hidden');
            // Sedikit delay agar transisi fade-in berjalan mulus
            setTimeout(() => appCanvas.classList.remove('opacity-0'), 50); 
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 300);
    }

    function showError() { 
        spinner.classList.add('hidden');
        appCanvas.classList.add('hidden'); 
        errorBox.classList.remove('hidden'); 
        document.title = "404 - Halaman Tidak Ditemukan"; 
    }
});
