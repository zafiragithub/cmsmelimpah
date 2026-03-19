// engine.js

// Tentukan Jalur API (Menggunakan trik rahasia _worker.js di Cloudflare)
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? (typeof SCRIPT_URL !== 'undefined' ? SCRIPT_URL : '') 
                : '/api';

document.addEventListener('DOMContentLoaded', async () => {
    const spinner = document.getElementById('loading-spinner');
    const pageBody = document.getElementById('page-body');
    const errorBox = document.getElementById('error-box');
    const contentBox = document.getElementById('app-content');

    if (!API_URL) {
        showError();
        return;
    }

    try {
        // 1. Ambil Pengaturan Global (Branding & Info Beranda)
        const settingsRes = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_global_settings' })
        });
        const settingsData = await settingsRes.json();
        
        let homePageSlug = '';

        if (settingsData.status === 'success') {
            const s = settingsData.data;
            
            // Terapkan Pengaturan ke Elemen HTML
            if (s.site_name) {
                document.getElementById('site-name').textContent = s.site_name;
                document.getElementById('footer-site-name').textContent = s.site_name;
                document.title = s.site_name; // Judul sementara
            }
            if (s.site_tagline) {
                const taglineEl = document.getElementById('site-tagline');
                taglineEl.textContent = s.site_tagline;
                taglineEl.classList.remove('hidden');
            }
            if (s.site_logo) {
                const logoEl = document.getElementById('site-logo');
                logoEl.src = s.site_logo;
                logoEl.classList.remove('hidden');
            }
            if (s.site_favicon) {
                document.getElementById('dynamic-favicon').href = s.site_favicon;
            }
            if (s.home_page) {
                homePageSlug = s.home_page;
            }
        }

        // 2. Baca URL untuk Menentukan Halaman Apa yang Sedang Dibuka
        let currentPath = window.location.pathname.replace(/\/$/, ''); // Buang slash '/' di akhir jika ada
        let slug = currentPath.substring(1); // Buang slash '/' di awal (Contoh: /tentang-kami menjadi tentang-kami)

        // Jika pengunjung berada di halaman utama (domain.com/), gunakan slug Beranda dari Pengaturan
        if (currentPath === '' || currentPath === '/' || currentPath === '/index.html') {
            slug = homePageSlug;
        }

        // Jika tidak ada slug sama sekali (misal admin lupa set Beranda)
        if (!slug) {
            spinner.classList.add('hidden');
            pageBody.innerHTML = `
                <h2 class="text-2xl font-black text-slate-800">Selamat Datang di Web CMS Murni! 🎉</h2>
                <p class="text-slate-500 mt-2 font-medium">Sistem berjalan dengan baik. Silakan login ke 
                <a href="/admin.html" class="text-indigo-600 font-bold hover:underline">Panel Admin</a> 
                untuk membuat halaman dan mengatur Beranda Utama Anda.</p>`;
            return;
        }

        // 3. Minta Konten Halaman ke Database berdasarkan Slug tersebut
        const pageRes = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_public_page', slug: slug })
        });
        const pageData = await pageRes.json();

        // Sembunyikan Animasi Loading
        spinner.classList.add('hidden');

        if (pageData.status === 'success') {
            // Render Konten jika berhasil
            const siteName = document.getElementById('site-name').textContent;
            document.title = `${pageData.data.title} - ${siteName}`; // Update Judul Tab Browser
            pageBody.innerHTML = pageData.data.content; // Suntikkan HTML dari Admin
        } else {
            // Jika halaman tidak ada di database, tampilkan 404
            showError();
        }

    } catch (error) {
        console.error("Gagal terhubung ke server:", error);
        spinner.classList.add('hidden');
        showError();
    }

    // Fungsi Pembantu untuk Menampilkan Error
    function showError() {
        contentBox.classList.add('hidden');
        errorBox.classList.remove('hidden');
        document.title = "404 - Halaman Tidak Ditemukan";
    }
});
