// engine.js - 0-100% Loader (Sheetflare Style) & Fast Render

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzR5CgdfZ-1pzFxcK1bZIGWQoHqUnrHNG93D2Rwgw5hgZ4D6GSi7JmjQkjq9k2jlqcl/exec';

document.addEventListener('DOMContentLoaded', async () => {
    const spinner = document.getElementById('loading-spinner');
    const appCanvas = document.getElementById('app-canvas');
    const errorBox = document.getElementById('error-box');
    const percEl = document.getElementById('loading-percentage');
    const barEl = document.getElementById('loading-bar');

    // 1. SISTEM SIMULASI PROGRESS 0-90%
    let simProgress = 0;
    let progressInterval = setInterval(() => {
        simProgress += Math.random() * 15;
        if (simProgress > 90) simProgress = 90; // Mentok di 90% sampai data benar-benar turun
        if (percEl) percEl.innerText = Math.floor(simProgress) + '%';
        if (barEl) barEl.style.width = simProgress + '%';
    }, 150);

    // 2. FUNGSI PENYELESAIAN LOADING (100% & HANCURKAN SPINNER)
    function finishLoading(html) {
        clearInterval(progressInterval);
        if (percEl) percEl.innerText = '100%';
        if (barEl) barEl.style.width = '100%';
        
        setTimeout(() => {
            if(spinner) spinner.style.opacity = '0'; // Pudar perlahan
            setTimeout(() => {
                if(spinner) spinner.style.display = 'none'; // Hancurkan kaca bening!
                renderHTML(html);
            }, 400); // Waktu pudarnya
        }, 200); // Jeda diam di 100% sejenak biar elegan
    }

    // 3. FUNGSI TAMPILKAN KANVAS WEBSITE
    function renderHTML(htmlContent) {
        if(!htmlContent) { forceError(); return; }
        
        const isFullDocument = htmlContent.match(/<html/i) || htmlContent.match(/<!DOCTYPE html>/i);

        if (isFullDocument) {
            let iframeHtml = htmlContent;
            // Cegah klik nyangkut di dalam iframe
            if (!iframeHtml.includes('<base target=')) {
                iframeHtml = iframeHtml.replace('<head>', '<head><base target="_parent">');
            }
            appCanvas.innerHTML = ''; 
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100vh'; 
            iframe.style.border = 'none';
            appCanvas.appendChild(iframe);
            
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(iframeHtml);
            iframe.contentWindow.document.close();
        } else {
            appCanvas.innerHTML = htmlContent;
            initIcons();
        }

        // Tampilkan web
        appCanvas.classList.remove('hidden');
        setTimeout(() => appCanvas.style.opacity = '1', 50); 
    }

    function initIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        } else {
            setTimeout(initIcons, 50);
        }
    }

    function forceError() {
        clearInterval(progressInterval);
        if(spinner) spinner.style.display = 'none';
        if(errorBox) {
            errorBox.classList.remove('hidden');
            errorBox.style.display = 'flex';
        }
    }

    // ===============================================
    // JANTUNG UTAMA SISTEM SAAS & CACHE
    // ===============================================
    try {
        let currentPath = window.location.pathname.replace(/\/$/, '');
        let isHome = currentPath === '' || currentPath === '/' || currentPath === '/index.html';
        let isBlogList = currentPath === '/blog';
        let isPostDetail = currentPath.startsWith('/blog/');
        
        const currentDomain = window.location.hostname; 
        const urlParams = new URLSearchParams(window.location.search);
        let previewSite = urlParams.get('web');

        if (previewSite) {
            sessionStorage.setItem('preview_web', previewSite);
        } else {
            previewSite = sessionStorage.getItem('preview_web');
        }

        if (!currentDomain.includes('pages.dev') && !currentDomain.includes('localhost') && !currentDomain.includes('127.0.0.1')) {
            sessionStorage.removeItem('preview_web');
            previewSite = null;
        }

        let fetchUrl = `${SCRIPT_URL}?action=get_public_data&domain=${currentDomain}`;
        if (previewSite) fetchUrl += `&web=${previewSite}`; 

        let res;
        const cacheKey = 'saas_data_' + (previewSite || currentDomain);
        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData) {
            // Jika sudah ada cache, loading langsung lari ke 95%
            simProgress = 95;
            res = JSON.parse(cachedData); 
        } else {
            const response = await fetch(fetchUrl);
            res = await response.json(); 
            if (res.status === 'success') {
                sessionStorage.setItem(cacheKey, JSON.stringify(res));
            }
        }

        if (res.status !== 'success') {
            throw new Error('Data tidak ditemukan');
        }

        const settingsData = res.data.settings || {};
        const postsData = res.data.posts || [];
        const pagesData = res.data.pages || [];

        const s = settingsData; 
        const siteName = s.site_name || 'BERITAKITA';
        const tagline = s.site_tagline || 'Tajam & Terpercaya';
        
        if (s.site_name) document.title = s.site_name;
        if (s.site_favicon) {
            let fav = document.getElementById('dynamic-favicon');
            if(fav) fav.href = s.site_favicon;
        }

        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const todayStr = new Date().toLocaleDateString('id-ID', dateOptions);
        let homePageSlug = s.home_page || '';

        const htmlTop = `
            <style>.headline-card:hover img { transform: scale(1.05); } .headline-card img { transition: transform 0.5s ease; }</style>
            <div class="bg-slate-900 text-slate-300 text-xs py-2 hidden md:block">
                <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <div class="font-medium">${todayStr}</div>
                    <div class="flex items-center gap-4">
                        <span class="font-bold text-rose-500 flex items-center gap-1"><i data-lucide="trending-up" class="w-3 h-3"></i> LINK CEPAT:</span>
                        <a href="/" class="hover:text-white transition-colors">Beranda</a>
                        <a href="/admin.html" class="hover:text-white transition-colors">Panel Redaksi</a>
                    </div>
                </div>
            </div>
            <header class="bg-white">
                <div class="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                    <a href="/blog" class="flex-shrink-0">
                        <h1 class="text-4xl font-black text-slate-900 tracking-tighter uppercase">${siteName.substring(0, Math.ceil(siteName.length/2))}<span class="text-rose-600">${siteName.substring(Math.ceil(siteName.length/2))}</span></h1>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">${tagline}</p>
                    </a>
                </div>
            </header>
            <nav class="bg-white border-y border-slate-200 sticky top-0 z-50 shadow-sm">
                <div class="max-w-7xl mx-auto px-4">
                    <ul class="flex items-center gap-6 overflow-x-auto whitespace-nowrap text-[13px] font-bold uppercase tracking-wider text-slate-600 py-4 custom-scroll hide-scrollbar">
                        <li><a href="/blog" class="text-rose-600 border-b-2 border-rose-600 pb-4">Terkini</a></li>
                        <li><a href="#" class="hover:text-rose-600">Nasional</a></li>
                        <li><a href="#" class="hover:text-rose-600">Ekonomi</a></li>
                        <li><a href="#" class="hover:text-rose-600">Teknologi</a></li>
                        <li><a href="#" class="hover:text-rose-600">Olahraga</a></li>
                    </ul>
                </div>
            </nav>
        `;

        const htmlFooter = `
            <footer class="bg-slate-900 text-slate-300 py-12 border-t-4 border-rose-600 mt-10">
                <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <div><h1 class="text-3xl font-black text-white mb-4 uppercase">${siteName}</h1><p class="text-sm text-slate-400">${tagline}</p></div>
                    <div><h4 class="text-white font-bold uppercase text-sm mb-4">Akses Cepat</h4><ul class="space-y-2 text-sm text-slate-400"><li><a href="/" class="hover:text-rose-500">Beranda Web</a></li><li><a href="/admin.html" class="hover:text-rose-500">Panel Admin</a></li></ul></div>
                    <div><h4 class="text-white font-bold uppercase text-sm mb-4">Ikuti Kami</h4><div class="flex justify-center md:justify-start gap-4"><a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-rose-600"><i data-lucide="instagram" class="w-4 h-4"></i></a><a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-rose-600"><i data-lucide="twitter" class="w-4 h-4"></i></a></div></div>
                </div>
                <div class="max-w-7xl mx-auto px-4 mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">&copy; ${new Date().getFullYear()} ${siteName} Network. All rights reserved.</div>
            </footer>
        `;

        function buildPortalHtml() {
            let posts = [...postsData].reverse(); 
            const safeImg = (url) => url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80';
            const safeExcerpt = (c) => c ? String(c).replace(/<[^>]+>/g, '').substring(0, 150) + '...' : '';

            let popular = posts.slice(0, 5);
            let html = htmlTop + `<main class="max-w-7xl mx-auto px-4 py-8 text-slate-800">`;

            if (posts.length === 0) {
                html += `<div class="text-center py-20"><p class="text-slate-500 text-xl italic">Belum ada berita.</p></div>`;
            } else {
                html += `
                <section class="grid grid-cols-1 lg:grid-cols-12 gap-2 mb-12">
                    <a href="/blog/${posts[0][1]}" class="lg:col-span-8 relative rounded-2xl overflow-hidden h-[400px] lg:h-[500px] group block">
                        <img src="${safeImg(posts[0][4])}" class="w-full h-full object-cover group-hover:scale-105 transition-all">
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                        <div class="absolute bottom-0 p-6 md:p-10 w-full">
                            <span class="bg-rose-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase mb-3 inline-block">${posts[0][3] || 'Nasional'}</span>
                            <h2 class="text-2xl md:text-4xl font-black text-white leading-tight mb-2">${posts[0][2]}</h2>
                            <p class="text-slate-300 text-sm hidden md:block line-clamp-2">${safeExcerpt(posts[0][5])}</p>
                        </div>
                    </a>
                    <div class="lg:col-span-4 flex flex-col gap-2">
                        ${[1, 2].map(i => posts[i] ? `
                        <a href="/blog/${posts[i][1]}" class="relative rounded-2xl overflow-hidden h-[200px] lg:h-[246px] group block">
                            <img src="${safeImg(posts[i][4])}" class="w-full h-full object-cover group-hover:scale-105 transition-all">
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
                            <div class="absolute bottom-0 p-5 w-full">
                                <span class="text-emerald-400 text-[10px] font-black uppercase mb-1 block">${posts[i][3] || 'Ekonomi'}</span>
                                <h3 class="text-lg font-bold text-white leading-tight line-clamp-2">${posts[i][2]}</h3>
                            </div>
                        </a>` : '').join('')}
                    </div>
                </section>
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div class="lg:col-span-8">
                        <h3 class="text-xl font-black border-b-2 border-slate-800 pb-2 mb-6 uppercase tracking-tight">BERITA TERKINI</h3>
                        <div class="space-y-6">
                            ${posts.slice(3, 10).map(p => `
                            <article class="flex flex-col sm:flex-row gap-5 cursor-pointer border-b border-slate-200 pb-6" onclick="location.href='/blog/${p[1]}'">
                                <img src="${safeImg(p[4])}" class="w-full sm:w-1/3 aspect-[4/3] rounded-xl object-cover">
                                <div class="w-full sm:w-2/3">
                                    <span class="text-rose-600 font-bold text-[10px] uppercase mb-2 block">${p[3] || 'Info'}</span>
                                    <h4 class="text-xl font-black mb-2 hover:text-rose-600 transition-colors">${p[2]}</h4>
                                    <p class="text-sm text-slate-500 line-clamp-2">${safeExcerpt(p[5])}</p>
                                </div>
                            </article>`).join('')}
                        </div>
                    </div>
                    <aside class="lg:col-span-4">
                        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 class="text-lg font-black border-b border-slate-200 pb-3 mb-5 uppercase">TERPOPULER</h3>
                            <div class="space-y-5">
                                ${popular.map((p, idx) => `<a href="/blog/${p[1]}" class="flex gap-4 group">
                                    <div class="text-4xl font-black text-slate-200 group-hover:text-rose-500">${idx+1}</div>
                                    <div><h4 class="font-bold leading-snug group-hover:text-rose-600 line-clamp-2">${p[2]}</h4></div>
                                </a>`).join('')}
                            </div>
                        </div>
                    </aside>
                </div>`;
            }
            html += `</main>` + htmlFooter;
            return html;
        }

        // ===============================================
        // ROUTING SYSTEM DENGAN FINISHE LOADING
        // ===============================================
        if (isHome) {
            if (homePageSlug) {
                const page = pagesData.find(p => p[1] === homePageSlug);
                if (page) {
                    document.title = `${page[2]} - ${siteName}`;
                    finishLoading(page[3]);
                } else { finishLoading(buildPortalHtml()); }
            } else { finishLoading(buildPortalHtml()); }
        } 
        else if (isBlogList) { 
            finishLoading(buildPortalHtml()); 
        } 
        else if (isPostDetail) {
            const slug = currentPath.split('/')[2];
            const post = postsData.find(p => p[1] === slug);
            if (post) {
                document.title = `${post[2]} - ${siteName}`;
                let popular = postsData.slice(0, 5);
                let html = htmlTop + `
                <main class="max-w-7xl mx-auto px-4 py-8"><div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <article class="lg:col-span-8 bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100">
                        <span class="text-rose-600 font-black text-[10px] uppercase mb-4 block">${post[3] || 'Nasional'}</span>
                        <h1 class="text-3xl md:text-5xl font-black mb-6 leading-tight">${post[2]}</h1>
                        <div class="text-slate-400 text-xs mb-8 border-y py-4 italic">Diterbitkan pada: ${post[6]}</div>
                        ${post[4] ? `<img src="${post[4]}" class="w-full rounded-2xl mb-8">` : ''}
                        <div class="cms-content text-lg leading-relaxed text-slate-700">${post[5]}</div>
                    </article>
                    <aside class="lg:col-span-4">
                        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 class="text-lg font-black border-b border-slate-200 pb-3 mb-5 uppercase">BACA JUGA</h3>
                            <div class="space-y-5">
                                ${popular.map((p, idx) => `<a href="/blog/${p[1]}" class="flex gap-4 group">
                                    <div class="text-4xl font-black text-slate-200 group-hover:text-rose-500">${idx+1}</div>
                                    <div><h4 class="font-bold leading-snug group-hover:text-rose-600 line-clamp-2">${p[2]}</h4></div>
                                </a>`).join('')}
                            </div>
                        </div>
                    </aside>
                </div></main>` + htmlFooter;
                finishLoading(html);
            } else { forceError(); }
        } else {
            const slug = currentPath.substring(1); 
            const page = pagesData.find(p => p[1] === slug);
            if (page) { 
                document.title = `${page[2]} - ${siteName}`;
                finishLoading(page[3]); 
            } else { forceError(); }
        }

    } catch (error) { 
        console.error("Error Sistem:", error); 
        forceError(); 
    }
});
