// engine.js - VERSI CANVAS (v9) + PORTAL BERITA DINAMIS

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
        
        const siteName = s.site_name || 'BERITAKITA';
        if (s.site_name) document.title = s.site_name;
        if (s.site_favicon) document.getElementById('dynamic-favicon').href = s.site_favicon;
        let homePageSlug = s.home_page || '';

        // Helper Tanggal Hari Ini
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const todayStr = new Date().toLocaleDateString('id-ID', dateOptions);

        // --- SKENARIO A: HALAMAN STATIS / BERANDA ---
        if (isHome || (!isBlogList && !isPostDetail)) {
            const slug = isHome ? homePageSlug : currentPath.substring(1);
            if (!slug && isHome) {
                // Tampilan Landing Page Default (Tetap Dipertahankan)
                showCanvas(`<div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-6"><h1 class="text-4xl text-white font-black mb-4">Web Online!</h1><p class="text-slate-400 mb-8">Silakan set beranda di Panel Admin.</p><a href="/admin.html" class="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">Ke Admin Panel</a><br><a href="/blog" class="text-indigo-400 mt-4 underline font-bold">Atau Lihat Portal Berita</a></div>`);
                return;
            }
            const page = contentData.find(p => p[1] === slug);
            if (page) {
                document.title = `${page[2] || 'Halaman'} - ${siteName}`;
                showCanvas(page[3] || '');
            } else { showError(); }
        } 
        
        // --- SKENARIO B: PORTAL BERITA NASIONAL DINAMIS (/BLOG) ---
        else if (isBlogList) {
            document.title = `Portal Berita - ${siteName}`;
            let posts = [...contentData].reverse(); 

            // Helper Data untuk Artikel
            const safeImg = (url) => url ? url : 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80'; // Gambar Default jika lupa pasang
            const safeCat = (cat) => cat || 'Nasional';
            const safeTitle = (title) => title || 'Tanpa Judul';
            const safeDate = (date) => date || 'Baru Saja';
            const safeExcerpt = (content) => content ? String(content).replace(/<[^>]+>/g, '').substring(0, 120) + '...' : 'Tidak ada ringkasan teks untuk berita ini...';

            // Memecah Artikel untuk Layout Grid
            let headlineMain = posts[0]; // Berita Paling Baru
            let headlineSub1 = posts[1]; // Berita ke-2
            let headlineSub2 = posts[2]; // Berita ke-3
            let latestPosts = posts.slice(3, 10); // Sisa berita (maks 7)
            let popularPosts = posts.slice(0, 5); // Ambil 5 teratas untuk sidebar

            let html = `
            <div class="bg-slate-900 text-slate-300 text-xs py-2 hidden md:block">
                <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <div class="font-medium">${todayStr}</div>
                    <div class="flex items-center gap-4">
                        <span class="font-bold text-rose-500 flex items-center gap-1"><i data-lucide="trending-up" class="w-3 h-3"></i> LINK CEPAT:</span>
                        <a href="/" class="hover:text-white transition-colors">Beranda Web</a>
                        <a href="/admin.html" class="hover:text-white transition-colors">Tulis Berita (Admin)</a>
                    </div>
                </div>
            </div>

            <header class="bg-white">
                <div class="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                    <a href="/blog" class="flex-shrink-0">
                        <h1 class="text-4xl font-black text-slate-900 tracking-tighter uppercase">${siteName.substring(0, siteName.length/2)}<span class="text-rose-600">${siteName.substring(siteName.length/2)}</span></h1>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">${s.site_tagline || 'Tajam & Terpercaya'}</p>
                    </a>
                    <div class="hidden lg:flex w-[728px] h-[90px] bg-slate-100 border border-slate-200 rounded-xl items-center justify-center text-slate-400 font-bold text-sm tracking-widest uppercase">Space Iklan Leaderboard (728x90)</div>
                </div>
            </header>

            <nav class="bg-white border-y border-slate-200 sticky top-0 z-50 shadow-sm">
                <div class="max-w-7xl mx-auto px-4">
                    <ul class="flex items-center gap-6 overflow-x-auto whitespace-nowrap text-[13px] font-bold uppercase tracking-wider text-slate-600 py-4 custom-scroll hide-scrollbar">
                        <li><a href="/blog" class="text-rose-600 border-b-2 border-rose-600 pb-4">Terkini</a></li>
                        <li><a href="#" class="hover:text-rose-600 transition-colors">Nasional</a></li>
                        <li><a href="#" class="hover:text-rose-600 transition-colors">Ekonomi</a></li>
                        <li><a href="#" class="hover:text-rose-600 transition-colors">Teknologi</a></li>
                        <li><a href="#" class="hover:text-rose-600 transition-colors">Olahraga</a></li>
                    </ul>
                </div>
            </nav>

            <main class="max-w-7xl mx-auto px-4 py-8 bg-[#f8fafc]">`;
            
            if (posts.length === 0) {
                html += `<div class="text-center py-20"><p class="text-slate-500 italic text-xl">Belum ada berita yang dipublikasikan.</p></div>`;
            } else {
                html += `
                <section class="grid grid-cols-1 lg:grid-cols-12 gap-2 mb-12">
                    ${headlineMain ? `
                    <a href="/blog/${headlineMain[1]}" class="lg:col-span-8 relative rounded-2xl overflow-hidden h-[400px] lg:h-[500px] group block">
                        <img src="${safeImg(headlineMain[4])}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                        <div class="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                            <span class="bg-rose-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-3 inline-block">${safeCat(headlineMain[3])}</span>
                            <h2 class="text-2xl md:text-4xl font-black text-white leading-tight mb-2 group-hover:underline decoration-rose-500 decoration-4 underline-offset-4">${safeTitle(headlineMain[2])}</h2>
                            <p class="text-slate-300 text-sm hidden md:block line-clamp-2 w-4/5">${safeExcerpt(headlineMain[5])}</p>
                            <div class="text-xs text-slate-400 mt-4 font-medium flex items-center gap-2"><i data-lucide="clock" class="w-3 h-3"></i> ${safeDate(headlineMain[6])}</div>
                        </div>
                    </a>` : ''}
                    
                    <div class="lg:col-span-4 flex flex-col gap-2">
                        ${headlineSub1 ? `
                        <a href="/blog/${headlineSub1[1]}" class="relative rounded-2xl overflow-hidden h-[200px] lg:h-[246px] group block">
                            <img src="${safeImg(headlineSub1[4])}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                            <div class="absolute bottom-0 left-0 p-5 w-full">
                                <span class="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1 block">${safeCat(headlineSub1[3])}</span>
                                <h3 class="text-lg font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">${safeTitle(headlineSub1[2])}</h3>
                            </div>
                        </a>` : ''}
                        
                        ${headlineSub2 ? `
                        <a href="/blog/${headlineSub2[1]}" class="relative rounded-2xl overflow-hidden h-[200px] lg:h-[246px] group block">
                            <img src="${safeImg(headlineSub2[4])}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                            <div class="absolute bottom-0 left-0 p-5 w-full">
                                <span class="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1 block">${safeCat(headlineSub2[3])}</span>
                                <h3 class="text-lg font-bold text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">${safeTitle(headlineSub2[2])}</h3>
                            </div>
                        </a>` : ''}
                    </div>
                </section>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    <div class="lg:col-span-8">
                        <div class="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-6">
                            <h3 class="text-xl font-black uppercase tracking-tight text-slate-800 flex items-center gap-2"><i data-lucide="zap" class="text-rose-600"></i> BERITA TERKINI</h3>
                        </div>
                        
                        <div class="space-y-6">
                            ${latestPosts.map(p => `
                            <article class="flex flex-col sm:flex-row gap-5 group cursor-pointer border-b border-slate-200 pb-6" onclick="window.location.href='/blog/${p[1]}'">
                                <div class="w-full sm:w-1/3 aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0">
                                    <img src="${safeImg(p[4])}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                </div>
                                <div class="w-full sm:w-2/3 flex flex-col justify-center">
                                    <span class="text-rose-600 font-bold text-[10px] uppercase tracking-widest mb-2">${safeCat(p[3])}</span>
                                    <h4 class="text-xl font-black text-slate-800 mb-2 leading-tight group-hover:text-rose-600 transition-colors">${safeTitle(p[2])}</h4>
                                    <p class="text-sm text-slate-500 line-clamp-2 mb-3">${safeExcerpt(p[5])}</p>
                                    <div class="text-xs font-medium text-slate-400">${safeDate(p[6])}</div>
                                </div>
                            </article>
                            `).join('')}
                        </div>
                    </div>

                    <aside class="lg:col-span-4">
                        <div class="w-full aspect-square bg-slate-200 border border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">Space Iklan (300x300)</div>

                        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 class="text-lg font-black uppercase tracking-tight text-slate-800 border-b border-slate-200 pb-3 mb-5 flex items-center gap-2">
                                <i data-lucide="bar-chart-2" class="text-rose-600"></i> TERPOPULER
                            </h3>
                            <div class="space-y-5">
                                ${popularPosts.map((p, idx) => `
                                <a href="/blog/${p[1]}" class="flex gap-4 group">
                                    <div class="text-4xl font-black text-slate-200 group-hover:text-rose-500 transition-colors">${idx + 1}</div>
                                    <div>
                                        <h4 class="font-bold text-slate-800 leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">${safeTitle(p[2])}</h4>
                                        <span class="text-[10px] text-slate-400 font-medium">${safeCat(p[3])}</span>
                                    </div>
                                </a>
                                `).join('')}
                            </div>
                        </div>
                    </aside>
                </div>`;
            }

            html += `
            </main>
            <footer class="bg-slate-900 text-slate-300 py-12 border-t-4 border-rose-600 mt-10">
                <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <div>
                        <h1 class="text-3xl font-black text-white tracking-tighter mb-4">${siteName}</h1>
                        <p class="text-sm text-slate-400 leading-relaxed mb-6">${s.site_tagline || 'Portal berita paling kencang di Indonesia.'}</p>
                    </div>
                    <div><h4 class="text-white font-bold uppercase tracking-widest text-sm mb-4">Akses Cepat</h4><ul class="space-y-2 text-sm text-slate-400"><li><a href="/" class="hover:text-rose-500">Beranda Web</a></li><li><a href="/admin.html" class="hover:text-rose-500">Login Redaksi</a></li></ul></div>
                    <div><h4 class="text-white font-bold uppercase tracking-widest text-sm mb-4">Media Sosial</h4><div class="flex justify-center md:justify-start gap-4"><a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-rose-600 text-white"><i data-lucide="facebook" class="w-4 h-4"></i></a><a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-rose-600 text-white"><i data-lucide="instagram" class="w-4 h-4"></i></a></div></div>
                </div>
                <div class="max-w-7xl mx-auto px-4 mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">&copy; 2026 ${siteName} Network. All rights reserved.</div>
            </footer>`;

            showCanvas(html);
        } 
        
        // --- SKENARIO C: BACA ARTIKEL (/BLOG/SLUG) ---
        else if (isPostDetail) {
            const slug = currentPath.split('/')[2];
            const post = contentData.find(p => p[1] === slug);

            if (post) {
                document.title = `${post[2] || 'Artikel'} - ${siteName}`;
                let imgHTML = post[4] ? `<img src="${post[4]}" class="w-full h-[300px] md:h-[500px] object-cover rounded-3xl mb-10 shadow-xl">` : '';
                
                let html = `
                <nav class="bg-white border-b border-slate-200 py-4 shadow-sm sticky top-0 z-50">
                    <div class="max-w-4xl mx-auto px-6 flex justify-between items-center">
                        <a href="/blog" class="text-2xl font-black tracking-tighter text-slate-800">${siteName}</a>
                        <a href="/blog" class="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1"><i data-lucide="arrow-left" class="w-4 h-4"></i> Indeks Berita</a>
                    </div>
                </nav>
                <article class="max-w-4xl mx-auto px-6 py-12 mb-20 bg-[#f8fafc]">
                    <div class="mb-8 text-center md:text-left">
                        <span class="bg-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-4">${post[3] || 'Nasional'}</span>
                        <h1 class="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-[1.2] tracking-tight">${post[2] || ''}</h1>
                        <div class="flex items-center justify-center md:justify-start gap-4 text-slate-400 font-medium text-xs border-y border-slate-200 py-4">
                            <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-4 h-4"></i> ${post[6] || ''}</span>
                            <span class="flex items-center gap-1"><i data-lucide="user" class="w-4 h-4"></i> Redaksi</span>
                        </div>
                    </div>
                    ${imgHTML}
                    <div class="cms-content text-lg text-slate-700 leading-relaxed font-serif">
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
