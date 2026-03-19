// engine.js - VERSI CANVAS (v8) + DEFAULT HOMEPAGE PREMIUM

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

        // --- SKENARIO A: HALAMAN STATIS / BERANDA ---
        if (isHome || (!isBlogList && !isPostDetail)) {
            const slug = isHome ? homePageSlug : currentPath.substring(1);
            
            // JIKA BERANDA BELUM DIATUR, TAMPILKAN DESAIN PREMIUM INI:
            if (!slug && isHome) {
                const defaultLandingPage = `
                <div class="min-h-screen bg-slate-50 font-sans">
                    <nav class="absolute top-0 w-full p-6 md:px-12 flex justify-between items-center z-10">
                        <div class="text-white font-black text-2xl tracking-tighter">${s.site_name || 'CMS<span class="text-indigo-400">PRO</span>'}</div>
                        <a href="/admin.html" class="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md transition-all border border-white/20">Login Admin</a>
                    </nav>

                    <main class="relative pt-32 pb-24 lg:pt-48 lg:pb-40 overflow-hidden bg-slate-900">
                        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
                            <div class="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-[100px] mix-blend-screen"></div>
                        </div>
                        
                        <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
                            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-8">
                                <span class="relative flex h-2.5 w-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
                                Sistem Berhasil Online
                            </div>
                            
                            <h1 class="text-5xl md:text-7xl font-black text-white tracking-tight mb-8 leading-tight">
                                Kanvas Kosong <br>
                                <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Menunggu Mahakarya.</span>
                            </h1>
                            
                            <p class="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                                Website Anda sudah berjalan dengan kecepatan kilat. Saat ini Anda melihat halaman bawaan karena <b class="text-slate-200">Beranda Utama</b> belum diatur.
                            </p>
                            
                            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <a href="/admin.html" class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-1 flex justify-center items-center gap-2">
                                    <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Buka Panel Admin
                                </a>
                            </div>
                        </div>
                    </main>

                    <section class="max-w-6xl mx-auto px-6 py-20 -mt-16 relative z-20">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
                                <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                    <i data-lucide="zap" class="w-8 h-8"></i>
                                </div>
                                <h3 class="text-xl font-black text-slate-800 mb-3">Super Cepat</h3>
                                <p class="text-slate-500 text-sm leading-relaxed font-medium">Tidak ada lagi loading lambat. Sistem membypass antrean database tradisional menggunakan data cache statis.</p>
                            </div>
                            <div class="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
                                <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                    <i data-lucide="database" class="w-8 h-8"></i>
                                </div>
                                <h3 class="text-xl font-black text-slate-800 mb-3">Google Sheets DB</h3>
                                <p class="text-slate-500 text-sm leading-relaxed font-medium">Kelola semua konten web Anda semudah mengisi tabel Excel. Otomatis tersimpan dan tersinkronisasi.</p>
                            </div>
                            <div class="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
                                <div class="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                                    <i data-lucide="paint-bucket" class="w-8 h-8"></i>
                                </div>
                                <h3 class="text-xl font-black text-slate-800 mb-3">Kanvas Bebas</h3>
                                <p class="text-slate-500 text-sm leading-relaxed font-medium">Desain 100% di tangan Anda. Gunakan editor HTML untuk mem-paste template apapun seperti Elementor.</p>
                            </div>
                        </div>
                    </section>
                    
                    <footer class="text-center pb-10 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-10">
                        &copy; 2026 CMS LITE ENGINE
                    </footer>
                </div>`;
                showCanvas(defaultLandingPage);
                return;
            }
            
            // JIKA BERANDA SUDAH DIATUR, TAMPILKAN HALAMAN ASLINYA:
            const page = contentData.find(p => p[1] === slug);
            if (page) {
                document.title = `${page[2] || 'Halaman'} - ${s.site_name || 'Web'}`;
                showCanvas(page[3] || '');
            } else { showError(); }
        } 
        
        // --- SKENARIO B: DAFTAR ARTIKEL (/BLOG) ---
        else if (isBlogList) {
            document.title = `Blog & Artikel - ${s.site_name || 'Web'}`;
            let posts = [...contentData].reverse(); 

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

    function showCanvas(htmlContent) {
        spinner.classList.add('opacity-0');
        setTimeout(() => {
            spinner.classList.add('hidden');
            appCanvas.innerHTML = htmlContent;
            appCanvas.classList.remove('hidden');
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
