/**
 * SHEETFLARE CORE SYSTEM v61.0 (The Grandmaster)
 * FINAL FIX: 9 Laporan Bug Diselesaikan + Endpoint 100% Utuh
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const jsonRes = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function normalizeRow(row) {
    if (!row) return null;
    
    // Pencari Kolom Tahan Banting (Fuzzy Exact Match)
    const getV = (possibleKeys) => {
        for (let k of possibleKeys) {
            const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (let rowKey in row) {
                if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanK) {
                    let val = row[rowKey];
                    if (val !== undefined && val !== null && String(val).toLowerCase() !== "null" && String(val).toLowerCase() !== "undefined") {
                        return val;
                    }
                }
            }
        }
        return "";
    };

    const out = {};
    out.id_produk = getV(['id_produk', 'kode_produk', 'sku', 'id']);
    out.title = getV(['title', 'nama_produk', 'produk', 'judul', 'nama']);
    out.desc = getV(['desc', 'deskripsi', 'description', 'keterangan']);
    out.url_akses = getV(['url_akses', 'akses', 'url', 'link']);
    out.harga = getV(['harga', 'price', 'biaya']);
    out.status = getV(['status', 'kondisi', 'state', 'status_produk']);
    out.lp_url = getV(['lp_url', 'landing_page', 'slug', 'path']);
    out.komisi = getV(['komisi', 'affiliate_fee', 'fee', 'bonus']);
    out.gambar = getV(['gambar', 'image', 'foto', 'thumbnail', 'img']);

    out.invoice = getV(['invoice', 'order_id', 'no_invoice', 'resi']);
    out.email = getV(['email', 'email_pembeli', 'alamat_email', 'surel']);
    out.nama = getV(['nama', 'nama_pembeli', 'nama_lengkap', 'customer']);
    out.whatsapp = getV(['whatsapp', 'wa', 'no_wa', 'phone', 'telepon']);
    out.harga_total = getV(['harga_total', 'total', 'tagihan', 'amount', 'total_bayar']);
    out.status_order = getV(['status_pembayaran', 'status_order', 'status_pesanan', 'status']);
    out.tanggal_order = getV(['tanggal_order', 'tanggal', 'date', 'created_at']);
    out.affiliate = getV(['affiliate', 'kode_affiliate', 'sponsor', 'ref']);

    out.id_user = getV(['id_user', 'user_id', 'id_member']);
    out.password = getV(['password', 'pass', 'sandi', 'pin']);
    out.role = getV(['role', 'akses', 'level', 'tipe']);

    out.kunci = getV(['config_name', 'kunci', 'key', 'pengaturan']);
    out.nilai = getV(['config_value', 'nilai', 'value', 'isi']);

    out.kode_promo = getV(['kode_promo', 'kupon', 'promo', 'code']);
    out.tipe = getV(['tipe', 'type', 'jenis']);
    out.berlaku_untuk_prod = getV(['berlaku_untuk_prod', 'berlaku_untuk', 'produk']);

    out.id_page = getV(['id_page', 'page_id']);
    out.slug = getV(['slug', 'url', 'permalink']);
    out.content = getV(['content', 'isi', 'html', 'konten']);

    out.videos = getV(['videos', 'video', 'materi', 'kurikulum']);
    out.cert_leader1 = getV(['cert_leader1', 'leader1', 'ttd1']);
    out.cert_role1 = getV(['cert_role1', 'role1', 'jabatan1']);
    out.cert_leader2 = getV(['cert_leader2', 'leader2', 'ttd2']);
    out.cert_role2 = getV(['cert_role2', 'role2', 'jabatan2']);
    out.cert_stamp = getV(['cert_stamp', 'stamp', 'stempel']);

    return out;
}

async function getTable(env, table) {
    try { const { results } = await env.DB.prepare(`SELECT * FROM ${table}`).all(); return (results || []).map(normalizeRow); } catch (e) { return []; }
}
async function safeRun(env, query, params=[]) {
    try { await env.DB.prepare(query).bind(...params).run(); return true; } catch(e){ return false; }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // 1. SISTEM HALAMAN & CMS ROUTER
    if (request.method === "GET") {
        let response = await env.ASSETS.fetch(request);
        const url = new URL(request.url);
        
        if (response.status === 404 && !url.pathname.includes('.')) {
            const slugTarget = url.pathname.replace(/^\/|\/$/g, '');
            try {
                const pages = await getTable(env, "pages");
                const targetPage = pages.find(p => String(p.slug).trim() === slugTarget);
                if (targetPage && targetPage.content) {
                    return new Response(targetPage.content, { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
                }
            } catch(e) {}

            const htmlResponse = await env.ASSETS.fetch(new Request(new URL(url.pathname + '.html', url.origin), request));
            if (htmlResponse.status !== 404) return htmlResponse;
        }
        return response;
    }

    try {
      const bodyText = await request.text();
      if (!bodyText) return jsonRes({ status: 'error', message: 'Body empty' }, 400);
      let body; try { body = JSON.parse(bodyText); } catch(e) { return jsonRes({ status: 'error', message: 'Invalid JSON' }, 400); }

      const action = body.action;

      if ((body.external_id || body.merchantOrderId) && !action) {
          const invId = body.external_id || body.merchantOrderId;
          const stat = body.status || body.resultCode;
          if (stat === "PAID" || stat === "SETTLED" || String(stat) === "00") { await safeRun(env, "UPDATE orders SET status = 'Lunas' WHERE invoice = ?", [invId]); }
          return jsonRes({ success: true, message: "WEBHOOK_OK" });
      }

      if (action === 'login' || action === 'admin_login') {
          const users = await getTable(env, "users");
          const u = users.find(x => x && String(x.email||"").toLowerCase().trim() === String(body.email||"").toLowerCase().trim() && String(x.password||"").trim() === String(body.password||"").trim());
          if (!u) return jsonRes({ status: 'error', message: 'Email/Password Salah' });
          if (action === 'admin_login' && String(u.role||"").toLowerCase().trim() !== 'admin') return jsonRes({ status: 'error', message: 'Anda Bukan Admin' });
          
          let namaAman = u.nama;
          if(!namaAman || namaAman === "undefined" || namaAman === "null" || namaAman === "") {
              namaAman = (action === 'admin_login') ? 'Master Admin' : 'Customer';
          }

          return jsonRes({ status: 'success', data: { id: u.id_user, nama: namaAman, email: u.email, role: u.role, wa: u.whatsapp } });
      }

      if (action === 'get_global_settings') {
          const res = await getTable(env, "settings"); const s = {}; res.forEach(x => { if(x && x.kunci) s[x.kunci] = x.nilai; });
          return jsonRes({ status: 'success', data: s });
      }

      if (action === 'get_admin_data') {
          const orders = await getTable(env, "orders"); const products = await getTable(env, "access_rules");
          const users = await getTable(env, "users"); const lms = await getTable(env, "lms");
          const coupons = await getTable(env, "coupons"); const pages = await getTable(env, "pages");
          const resSet = await getTable(env, "settings"); const s = {}; resSet.forEach(x => { if(x && x.kunci) s[x.kunci] = x.nilai; });
          
          let rev = 0; 
          orders.forEach(o => { 
              if(o && ['lunas','paid','success','aktif'].includes(String(o.status_order).toLowerCase().trim())) { 
                  // FIX REVENUE: Angka berapapun dengan titik/koma akan disedot murni
                  const bersihAngka = Number(String(o.harga_total||"0").replace(/\D/g, ''));
                  rev += bersihAngka; 
              }
          });

          return jsonRes({ 
              status: 'success', stats: { users: users.length, orders: orders.length, rev }, 
              orders: orders.map(o => o ? [o.invoice||"-", o.email||"-", o.nama||"Customer", o.whatsapp||"-", o.id_produk||"-", o.title||"Produk", o.harga_total||0, o.status_order||"Pending", o.tanggal_order||"-", o.affiliate||"-", o.komisi||0, ""] : []), 
              products: products.map(p => p ? [p.id_produk, p.title, p.desc, p.url_akses, p.harga, p.status||"Active", p.lp_url, p.komisi, "", "", 0, "", "", p.gambar] : []),
              lms: lms.map(l => l ? [l.id_produk, l.videos||"[]", l.deskripsi||"", l.cert_leader1, l.cert_role1, l.cert_leader2, l.cert_role2, l.cert_stamp] : []),
              coupons: coupons.map(c => c ? [c.kode_promo, c.tipe, c.nilai, c.status||"Active", c.berlaku_untuk_prod||"Semua Produk"] : []),
              pages: pages.map(pg => pg ? [pg.id_page, pg.slug, pg.title, pg.content, pg.status||"Active"] : []),
              settings: s 
          });
      }

      if (action === 'get_products') {
          const emailReq = String(body.email || "").trim().toLowerCase();
          const rules = await getTable(env, "access_rules"); const allOrders = await getTable(env, "orders");
          const userOrders = allOrders.filter(o => o && String(o.email||"").trim().toLowerCase() === emailReq);
          
          let lunasMap = {}; 
          userOrders.forEach(r => { if (['lunas','paid','success','aktif'].includes(String(r.status_order||"").trim().toLowerCase())) lunasMap[String(r.id_produk).toUpperCase()] = true; });
          
          let owned = [], available = [];
          rules.forEach(r => {
            if (r && ['active','aktif'].includes(String(r.status||"active").trim().toLowerCase())) {
                const pId = String(r.id_produk).toUpperCase(); const hasAccess = lunasMap[pId] || Number(r.harga||0) === 0;
                const pObj = { id: pId, title: r.title, desc: r.desc, url: hasAccess ? r.url_akses : '#', harga: r.harga, access: hasAccess, lp_url: r.lp_url, gambar: r.gambar, komisi: r.komisi };
                if (hasAccess && emailReq) owned.push(pObj); else available.push(pObj);
            }
          });
          
          let prospek = []; let total_komisi = 0;
          if (emailReq) {
              const users = await getTable(env, "users"); const usr = users.find(u => u && String(u.email).toLowerCase() === emailReq);
              if (usr) {
                  const pList = allOrders.filter(o => o && (String(o.affiliate) === usr.id_user || String(o.affiliate).toLowerCase() === emailReq));
                  prospek = pList.map(o => {
                      const kom = Number(String(o.komisi||"0").replace(/\D/g, '')); 
                      if(['lunas','paid','success','aktif'].includes(String(o.status_order).toLowerCase())) total_komisi += kom;
                      return { tanggal: o.tanggal_order, produk: o.title, nama: o.nama, komisi: kom, status: o.status_order||"Pending", harga_produk: o.harga_total };
                  });
              }
          }
          return jsonRes({ status: 'success', owned, available, prospek, total_komisi });
      }

      if (action === 'save_product') {
          const isEdit = String(body.is_edit) === "true"; const saveId = String(body.id).toUpperCase();
          if(isEdit) await safeRun(env, `UPDATE access_rules SET title=?, "desc"=?, url_akses=?, harga=?, status=?, lp_url=?, komisi=?, gambar=? WHERE UPPER(id_produk)=?`, [body.title, body.desc, body.url, body.harga, body.status, body.lp_url, body.komisi, body.gambar, saveId]);
          else await safeRun(env, `INSERT INTO access_rules (id_produk, title, "desc", url_akses, harga, status, lp_url, komisi, gambar) VALUES (?,?,?,?,?,?,?,?,?)`, [saveId, body.title, body.desc, body.url, body.harga, body.status, body.lp_url, body.komisi, body.gambar]);
          return jsonRes({ status: 'success' });
      }
      if (action === 'delete_product') { await safeRun(env, "DELETE FROM access_rules WHERE UPPER(id_produk) = ?", [String(body.id).toUpperCase()]); return jsonRes({ status: 'success' }); }
      
      // FIX KUPON: Cek old_code agar saat edit tidak hilang
      if (action === 'save_coupon') {
          const valProducts = body.products === "" ? "Semua Produk" : body.products;
          const kode = String(body.code).toUpperCase();
          
          if (String(body.is_edit) === 'true' && body.old_code) {
              await safeRun(env, "UPDATE coupons SET kode_promo=?, tipe=?, nilai=?, status=?, berlaku_untuk_prod=? WHERE kode_promo=?", [kode, body.type, body.val, body.status, valProducts, String(body.old_code).toUpperCase()]);
          } else {
              await safeRun(env, "INSERT INTO coupons (kode_promo, tipe, nilai, status, berlaku_untuk_prod) VALUES (?,?,?,?,?)", [kode, body.type, body.val, body.status, valProducts]);
          }
          return jsonRes({ status: 'success' });
      }
      if (action === 'delete_coupon') { await safeRun(env, "DELETE FROM coupons WHERE kode_promo = ?", [String(body.code).toUpperCase()]); return jsonRes({ status: 'success' }); }

      if (action === 'update_order_status') { await safeRun(env, "UPDATE orders SET status = 'Lunas' WHERE invoice = ?", [body.id]); return jsonRes({ status: 'success' }); }
      
      // FIX SETTINGS DB (Anti-RowID Loncat)
      if (action === 'update_settings') { 
          const payload = body.payload || {};
          for(let k in payload) {
              const safeKey = String(k).trim(); const safeVal = String(payload[k]).trim();
              const cek = await env.DB.prepare("SELECT config_name FROM settings WHERE config_name = ?").bind(safeKey).first();
              if (cek) { await safeRun(env, "UPDATE settings SET config_value = ? WHERE config_name = ?", [safeVal, safeKey]); } 
              else { await safeRun(env, "INSERT INTO settings (config_name, config_value) VALUES (?, ?)", [safeKey, safeVal]); }
          }
          return jsonRes({ status: 'success' }); 
      }

      // FIX AFFILIATE (Pencairan)
      if (action === 'reset_commission') {
          await safeRun(env, "UPDATE orders SET komisi = 0 WHERE affiliate = ?", [body.aff_id]);
          return jsonRes({ status: 'success' });
      }

      // FIX LMS
      if (action === 'save_lms_materi') {
          const cekLms = await env.DB.prepare("SELECT id_produk FROM lms WHERE id_produk = ?").bind(body.product_id).first();
          if(cekLms) { 
              await safeRun(env, "UPDATE lms SET videos=?, deskripsi=?, cert_leader1=?, cert_role1=?, cert_leader2=?, cert_role2=?, cert_stamp=? WHERE id_produk=?", [body.videos, body.desc, body.cert_leader1, body.cert_role1, body.cert_leader2, body.cert_role2, body.cert_stamp, body.product_id]); 
          } else { 
              await safeRun(env, "INSERT INTO lms (id_produk, videos, deskripsi, cert_leader1, cert_role1, cert_leader2, cert_role2, cert_stamp) VALUES (?,?,?,?,?,?,?,?)", [body.product_id, body.videos, body.desc, body.cert_leader1, body.cert_role1, body.cert_leader2, body.cert_role2, body.cert_stamp]); 
          }
          return jsonRes({ status: 'success' });
      }

      // FIX CMS PAGES
      if (action === 'save_page') {
          if(String(body.is_edit) === "true") { 
              await safeRun(env, "UPDATE pages SET slug=?, title=?, content=? WHERE id_page=?", [body.slug, body.title, body.content, body.id]); 
          } else { 
              await safeRun(env, "INSERT INTO pages (id_page, slug, title, content, status) VALUES (?,?,?,?,?)", [body.id, body.slug, body.title, body.content, 'Active']); 
          }
          return jsonRes({ status: 'success' });
      }
      if (action === 'delete_page') { await safeRun(env, "DELETE FROM pages WHERE id_page=?", [body.id]); return jsonRes({ status: 'success' }); }

      // FIX MEDIA CENTER (IMAGEKIT API)
      if (action === 'get_ik_auth') {
          const res = await getTable(env, "settings"); 
          const privKey = res.find(x => x.kunci === 'ik_private_key')?.nilai;
          if(!privKey) return jsonRes({status:'error', message:'Private key ImageKit belum diatur di Pengaturan Master'});
          
          const token = crypto.randomUUID(); 
          const expire = Math.floor(Date.now() / 1000) + 2400; 
          const str = token + expire;
          
          const enc = new TextEncoder();
          const key = await crypto.subtle.importKey("raw", enc.encode(privKey), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
          const sig = await crypto.subtle.sign("HMAC", key, enc.encode(str));
          const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
          
          return jsonRes({ status: 'success', token, expire, signature });
      }

      // FIX CLOUDFLARE PURGE CACHE
      if (action === 'purge_cf_cache') {
          const res = await getTable(env, "settings");
          const zoneId = res.find(x => x.kunci === 'cf_zone_id')?.nilai;
          const token = res.find(x => x.kunci === 'cf_api_token')?.nilai;
          
          if(!zoneId || !token) return jsonRes({status:'error', message:'Zone ID atau API Token Cloudflare belum disetting di Pengaturan Master'});
          
          try {
              const f = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, { 
                  method: 'POST', 
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
                  body: JSON.stringify({ purge_everything: true }) 
              });
              const r = await f.json();
              if(r.success) return jsonRes({status:'success', message:'Cache berhasil dibersihkan!'}); 
              return jsonRes({status:'error', message:r.errors[0].message});
          } catch(e) { return jsonRes({status:'error', message:e.message}); }
      }

      return jsonRes({ status: 'error', message: 'Action Unknown: ' + action });
    } catch (e) { return jsonRes({ status: 'error', message: e.message }); }
  }
};
