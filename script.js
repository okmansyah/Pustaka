// script.js

// 🚨 PENTING: GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA
// (Contoh: https://script.google.com/macros/s/AKfycbz_xxxxxxxxxxxxxxxxxxxxxx/exec)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_GANTI_DENGAN_URL_ANDA/exec'; 

/**
 * Fungsi untuk mengambil data dari Google Sheet melalui Apps Script
 * @param {string} action - Parameter untuk Apps Script (e.g., 'getStats', 'getBooks')
 */
async function fetchData(action) {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=${action}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Terjadi kesalahan saat mengambil data:', error);
        return { error: true, message: 'Gagal koneksi ke server data.' };
    }
}

/**
 * Halaman Beranda: Memuat Statistik
 */
if (document.getElementById('totalBuku')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const stats = await fetchData('getStats');
        
        if (!stats.error) {
            // Data yang benar-benar akan diambil dari Google Sheet
            const totalBuku = stats.totalBuku || 0;
            const tersedia = stats.bukuTersedia || 0;
            const dipinjam = stats.bukuDipinjam || 0;
            const anggota = stats.totalAnggota || 0;

            document.getElementById('totalBuku').textContent = totalBuku;
            document.getElementById('bukuTersedia').textContent = tersedia;
            document.getElementById('bukuDipinjam').textContent = dipinjam;
            document.getElementById('totalAnggota').textContent = anggota;
        } else {
             // Tampilkan pesan error jika gagal
             document.getElementById('totalBuku').textContent = 'Error';
             console.error(stats.message);
        }
    });
}

/**
 * Halaman Daftar Buku: Memuat Buku ke dalam Tampilan Card/Grid
 */
if (document.getElementById('bookListContainer')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const booksData = await fetchData('getBooks');
        const container = document.getElementById('bookListContainer');
        container.innerHTML = ''; // Kosongkan kontainer

        if (!booksData.error && Array.isArray(booksData.data)) {
            booksData.data.forEach(book => {
                const isAvailable = book.Status === 'Tersedia';
                const statusClass = isAvailable ? 'bg-success' : 'bg-danger';
                const borderClass = isAvailable ? 'border-info' : 'border-danger';
                const buttonHTML = isAvailable ? 
                    '<button class="btn btn-sm btn-outline-info w-100">Pinjam (Detail)</button>' : 
                    '<button class="btn btn-sm btn-outline-secondary w-100" disabled>Dipinjam</button>';
                
                const cardHTML = `
                    <div class="col">
                        <div class="card h-100 shadow-sm border-2 ${borderClass}">
                            <div class="card-body">
                                <span class="badge ${statusClass} float-end">${book.Status}</span>
                                <h5 class="card-title fw-bold" style="color: #0097A7;">${book.Judul}</h5>
                                <p class="card-text text-muted mb-1">Penulis ${book.Pengarang}</p>
                                <p class="card-text"><small class="text-secondary">Kategori: ${book.Kategori}</small></p>
                                ${buttonHTML}
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += cardHTML;
            });
        } else {
             container.innerHTML = '<div class="col-12"><div class="alert alert-danger" role="alert">Gagal memuat data buku. Periksa koneksi Apps Script Anda.</div></div>';
        }
    });
}

// Simulasi Data Buku (DIHAPUS atau diabaikan karena fokus pada koneksi)

// script.js (Logic Tambahan untuk Form)

/**
 * Logika Form Peminjaman
 */
const borrowForm = document.getElementById('borrowForm');
if (borrowForm) {
    borrowForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.action = 'addBorrow'; // Tambahkan action untuk Apps Script
        
        const messageBox = document.getElementById('borrowMessage');
        messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
        messageBox.textContent = 'Memproses peminjaman...';

        try {
            // ✅ KODE ASLI DIAMBIL: Menghapus komentar dan simulasi
            const response = await fetch(GOOGLE_SCRIPT_URL, { 
                method: 'POST', 
                body: JSON.stringify(data),
                // Penting: header ini diperlukan agar Apps Script dapat memproses JSON body.
                headers: { 'Content-Type': 'text/plain;charset=utf-8' } 
            });
            const result = await response.json(); // Mengambil respons dari Apps Script

            if (result.success) {
                messageBox.classList.add('alert-success');
                messageBox.textContent = result.message;
                form.reset();
            } else {
                messageBox.classList.add('alert-danger');
                messageBox.textContent = result.message || 'Gagal mencatat peminjaman. Respon Apps Script tidak sukses.';
            }
        } catch (error) {
            messageBox.classList.add('alert-danger');
            messageBox.textContent = 'Error koneksi server. Cek URL Apps Script atau jaringan.';
            console.error('Error submitting borrow form:', error);
        }
    });
}

// --------------------------------------------------------------------------------------------------

/**
 * Logika Form Pengembalian
 */
const returnForm = document.getElementById('returnForm');
if (returnForm) {
    returnForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        // Mengambil semua checkbox yang terpilih
        const booksToReturn = formData.getAll('booksToReturn[]');
        
        const messageBox = document.getElementById('feeNotification');
        messageBox.style.display = 'block';
        messageBox.classList.remove('alert-warning', 'alert-success', 'alert-danger');
        messageBox.classList.add('alert-info');
        messageBox.querySelector('h5').textContent = 'Memproses Pengembalian...';
        messageBox.querySelector('p').innerHTML = 'Mohon tunggu...';


        if (booksToReturn.length === 0) {
            messageBox.classList.remove('alert-info');
            messageBox.classList.add('alert-warning');
            messageBox.querySelector('h5').textContent = 'Peringatan';
            messageBox.querySelector('p').innerHTML = "Pilih minimal satu buku untuk dikembalikan.";
            return;
        }

        const data = {
            action: 'processReturn',
            memberID: formData.get('memberIDReturn'),
            books: booksToReturn // Array of book codes
        };
        
        try {
            // ✅ KODE ASLI DIAMBIL: Menghapus komentar dan simulasi
            const response = await fetch(GOOGLE_SCRIPT_URL, { 
                method: 'POST', 
                body: JSON.stringify(data),
                // Penting: header ini diperlukan agar Apps Script dapat memproses JSON body.
                headers: { 'Content-Type': 'text/plain;charset=utf-8' } 
            });
            const result = await response.json(); // Mengambil respons dari Apps Script

            if (result.success) {
                messageBox.classList.remove('alert-info');
                messageBox.classList.add('alert-success');
                messageBox.querySelector('h5').textContent = 'Pengembalian Berhasil!';
                // Gunakan result.denda yang dikirim dari Apps Script
                const totalDenda = result.denda || 0; 
                messageBox.querySelector('p').innerHTML = `${result.message}. Total Denda: <b>Rp ${totalDenda.toLocaleString('id-ID')}</b>.`;
            } else {
                messageBox.classList.remove('alert-info');
                messageBox.classList.add('alert-danger');
                messageBox.querySelector('h5').textContent = 'Pengembalian Gagal!';
                messageBox.querySelector('p').innerHTML = result.message || 'Gagal memproses pengembalian. Respon Apps Script tidak sukses.';
            }
        } catch (error) {
            messageBox.classList.remove('alert-info');
            messageBox.classList.add('alert-danger');
            messageBox.querySelector('h5').textContent = 'Error Koneksi!';
            messageBox.querySelector('p').innerHTML = 'Error koneksi server saat pengembalian. Cek URL atau jaringan Anda.';
            console.error('Error submitting return form:', error);
        }
    });
}
