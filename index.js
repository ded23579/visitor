// index.js (Versi Termux Lengkap dengan Evasi Fingerprinting)

// --- PERUBAHAN 1: Menggunakan puppeteer-extra dan plugin stealth ---
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');

// --- PERUBAHAN 2: Aktifkan plugin stealth ---
puppeteer.use(StealthPlugin());

// Fungsi untuk menunda eksekusi (helper)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fungsi untuk mensimulasikan gerakan mouse yang manusiawi dan melakukan klik.
 * @param {object} page - Halaman Puppeteer.
 * @param {string} selector - Selector CSS dari elemen yang akan diklik.
 */
async function humanClick(page, selector) {
    try {
        console.log(`    - Melakukan gerakan mouse manusiahi ke elemen: ${selector}`);
        
        const element = await page.$(selector);
        if (!element) {
            console.log(`    [!] Elemen dengan selector '${selector}' tidak ditemukan untuk diklik.`);
            return;
        }
        const boundingBox = await element.boundingBox();
        if (!boundingBox) {
            console.log(`    [!] Tidak bisa mendapatkan posisi elemen.`);
            return;
        }

        const viewport = page.viewport();
        const startX = Math.random() * viewport.width;
        const startY = Math.random() * viewport.height;
        const endX = boundingBox.x + boundingBox.width / 2;
        const endY = boundingBox.y + boundingBox.height / 2;

        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const controlX = midX + (Math.random() - 0.5) * 200;
        const controlY = midY + (Math.random() - 0.5) * 200;

        const steps = 25;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
            const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;
            
            const jitterX = (Math.random() - 0.5) * 2;
            const jitterY = (Math.random() - 0.5) * 2;

            await page.mouse.move(x + jitterX, y + jitterY);
            await delay(Math.random() * 15 + 5);
        }

        await delay(Math.random() * 200 + 100);
        await page.mouse.click(endX, endY);
        console.log(`    [✓] Elemen berhasil diklik dengan gerakan manusiahi.`);

    } catch (error) {
        console.error(`    [!] Gagal melakukan humanClick: ${error.message}`);
    }
}

async function visitWebsiteWithReferrer(targetUrl, totalVisits, sourceUrl) {
    console.log(`[*] Memulai ${totalVisits} kunjungan ke ${targetUrl} dari sumber ${sourceUrl}...`);

    for (let i = 1; i <= totalVisits; i++) {
        console.log(`\n[+] Kunjungan #${i}`);
        
        const userAgent = randomUseragent.getRandom();
        console.log(`    - Menggunakan User-Agent: ${userAgent.substring(0, 50)}...`);

        let browser;
        try {
            // --- PERUBAHAN 3: Tetap gunakan puppeteer.launch dengan executablePath Termux ---
            // Plugin stealth akan bekerja di atasnya.
            browser = await puppeteer.launch({
                executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--no-first-run',
                    '--single-process', // Argumen ini penting untuk stabilitas di Termux
                ]
            });

            const page = await browser.newPage();
            await page.setUserAgent(userAgent);
            await page.setViewport({ width: 1366, height: 768 + Math.floor(Math.random() * 200) });

            // --- LANGKAH 1: Kunjungi Halaman Sumber ---
            console.log(`    - Mengunjungi halaman sumber: ${sourceUrl}`);
            await page.goto(sourceUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            // --- LANGKAH 2: Cari dan Kunjungi Target ---
            const targetHostname = new URL(targetUrl).hostname;
            const linkSelector = `a[href*="${targetHostname}"]`;
            
            console.log(`    - Mencari link dengan selector: ${linkSelector}`);
            const linkElement = await page.$(linkSelector);

            if (linkElement) {
                console.log(`    - Link ditemukan, melakukan klik manusiahi...`);
                await humanClick(page, linkSelector);
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
                console.log(`    [✓] Link berhasil diklik! Halaman target dimuat dari referrer.`);
            } else {
                console.log(`    [!] Link tidak ditemukan di halaman sumber.`);
                console.log(`    [*] Mengunjungi target langsung dengan referrer palsu...`);
                await page.goto(targetUrl, { waitUntil: 'networkidle2', referrer: sourceUrl });
            }

            // --- LANGKAH 3: Tunggu dan Beri Interaksi Tambahan ---
            console.log(`    [*] Menunggu 3 detik agar halaman target sepenuhnya stabil...`);
            await delay(3000);

            // --- >>> FITUR BARU: KLIK DI TENGAH LAYAR <<< ---
            console.log(`    [*] Melakukan klik di tengah layar untuk simulasi interaksi...`);
            const viewport = page.viewport();
            const centerX = viewport.width / 2;
            const centerY = viewport.height / 2;
            
            await page.mouse.move(centerX, centerY);
            await delay(500);
            await page.mouse.click(centerX, centerY);
            console.log(`    [✓] Berhasil klik di tengah layar.`);

            const waitTime = Math.floor(Math.random() * 10) + 5; // 5-15 detik
            console.log(`    [*] Berinteraksi (scroll) selama ${waitTime} detik...`);
            
            try {
                await page.evaluate(() => {
                    const scrollTo = Math.random() * document.body.scrollHeight;
                    window.scrollTo(0, scrollTo);
                });
            } catch (e) {
                console.log(`    [!] Gagal melakukan scroll. Error: ${e.message}`);
            }

            await delay(waitTime * 1000);

        } catch (error) {
            console.error(`    [!] Terjadi error utama: ${error.message}`);
        } finally {
            if (browser) {
                await browser.close();
                console.log(`    [*] Browser ditutup.`);
            }
        }
    }
    console.log("\n[*] Semua kunjungan selesai.");
}

// --- Jalankan skrip ---
const args = process.argv.slice(2);
if (args.length !== 3) {
    console.log("Penggunaan: node index.js <URL_Target> <Jumlah_Kunjungan> <URL_Sumber>");
    console.log("Contoh: node index.js https://target.com 5 https://www.google.com/search?q=kata+kunci");
    process.exit(1);
}

const targetUrl = args[0];
const visitCount = parseInt(args[1], 10);
const sourceUrl = args[2];

if (isNaN(visitCount) || visitCount <= 0) {
    console.log("[!] Error: Jumlah kunjungan harus berupa angka positif.");
    process.exit(1);
}

// --- PERUBAHAN 4: Cek library yang diperlukan (termasuk yang baru) ---
const requiredLibraries = ['random-useragent', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth'];
let needsInstall = [];

for (const lib of requiredLibraries) {
    try {
        require.resolve(lib);
    } catch (e) {
        needsInstall.push(lib);
    }
}

if (needsInstall.length > 0) {
    console.log(`[!] Sedang menginstall library yang diperlukan: ${needsInstall.join(', ')}...`);
    const { execSync } = require('child_process');
    try {
        execSync(`npm install ${needsInstall.join(' ')}`, { stdio: 'inherit' });
        console.log('[*] Library berhasil diinstall. Silakan jalankan kembali skrip.');
        process.exit(0);
    } catch (installError) {
        console.error('[!] Gagal menginstall library. Error:', installError.message);
        console.log('[!] Silakan install manual dengan perintah: npm install ' + needsInstall.join(' '));
        process.exit(1);
    }
}

// Jika semua library sudah ada, jalankan fungsi utama
visitWebsiteWithReferrer(targetUrl, visitCount, sourceUrl);
