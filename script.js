// script.js

// 🚨 PENTING: GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA YANG TELAH DIDEPLOY
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_XXXXXXXXX/exec'; 

/**
 * Fungsi untuk mengambil data dari Google Sheet melalui Apps Script (GET request)
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
 * Fungsi untuk mengirim data ke Google Sheet melalui Apps Script (POST request)
 * @param {object} data - Objek data yang akan dikirim (termasuk properti 'action')
 */
async function postData(data) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            // PENTING: Set Content-Type: application/json agar Apps Script bisa memproses JSON
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;

    } catch (error) {
        console.error('Terjadi kesalahan saat mengirim data:', error);
        return { success: false, message: `Error koneksi server: ${error.message}` };
    }
}


// =========================================================
// Halaman Beranda: Memuat Statistik
// =========================================================
if (document.getElementById('totalBuku')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const stats = await fetchData('getStats');
        
        if (!stats.error && stats.success) {
            // Mapping data dari Apps Script ke elemen HTML
            document.getElementById('totalBuku').textContent = stats.data.TotalBuku || 0;
            document.getElementById('bukuTersedia').textContent = stats.data.BukuTersedia || 0;
            document.getElementById('bukuDipinjam').textContent = stats.data.BukuDipinjam || 0;
            document.getElementById('totalAnggota').textContent = stats.data.TotalAnggota || 0;
        } else {
             // Tampilkan pesan error jika gagal
             document.getElementById('totalBuku').textContent = 'Error';
             console.error('Gagal memuat statistik:', stats.message);
        }
    });
}

// =========================================================
// Halaman Daftar Buku: Memuat Buku ke dalam Tampilan Card/Grid
// =========================================================
if (document.getElementById('bookListContainer')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const booksData = await fetchData('getBooks');
        const container = document.getElementById('bookListContainer');
        container.innerHTML = ''; // Kosongkan kontainer

        if (!booksData.error && booksData.success && Array.isArray(booksData.data)) {
            booksData.data.forEach(book => {
                const isAvailable = book.Status.toLowerCase() === 'tersedia';
                const statusClass = isAvailable ? 'bg-success' : 'bg-danger';
                const borderClass = isAvailable ? 'border-info' : 'border-danger';
                const buttonHTML = isAvailable ? 
                    '<a href="borrow.html" class="btn btn-sm btn-outline-info w-100">Pinjam (Detail)</a>' : // Ganti ke tag a
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


// =========================================================
// Logika Form Peminjaman (Borrow.html)
// =========================================================
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
        messageBox.classList.add('alert-info');
        messageBox.textContent = 'Memproses peminjaman...';

        const result = await postData(data); // Panggil fungsi POST yang sudah diperbaiki

        if (result.success) {
            messageBox.classList.remove('alert-info', 'alert-danger');
            messageBox.classList.add('alert-success');
            messageBox.textContent = result.message;
            form.reset();
        } else {
            messageBox.classList.remove('alert-info', 'alert-success');
            messageBox.classList.add('alert-danger');
            messageBox.textContent = result.message || 'Gagal mencatat peminjaman.';
        }
    });
}


// =========================================================
// Logika Form Pengembalian (Return.html)
// =========================================================
const returnForm = document.getElementById('returnForm');
if (returnForm) {
    returnForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        // Menggunakan getAll untuk checkbox yang namanya sama
        const booksToReturn = formData.getAll('booksToReturn[]'); 
        
        const messageBox = document.getElementById('feeNotification');
        messageBox.style.display = 'block';
        messageBox.classList.remove('alert-warning', 'alert-success', 'alert-danger');
        messageBox.classList.add('alert-info');
        messageBox.querySelector('p').innerHTML = 'Memproses pengembalian...';


        if (booksToReturn.length === 0) {
            alert("Pilih minimal satu buku untuk dikembalikan.");
            messageBox.style.display = 'none';
            return;
        }

        const data = {
            action: 'processReturn',
            memberID: formData.get('memberIDReturn'),
            books: booksToReturn // Array of book codes
        };
        
        const result = await postData(data); // Panggil fungsi POST yang sudah diperbaiki

        if (result.success) {
            messageBox.classList.remove('alert-info', 'alert-danger');
            messageBox.classList.add('alert-success');
            messageBox.querySelector('h5').textContent = 'Pengembalian Berhasil!';
            // Tampilkan denda jika ada
            const dendaText = result.denda > 0 
                ? `Total Denda: <b>Rp ${result.denda.toLocaleString('id-ID')}</b>.` 
                : `Tidak ada denda.`;
            messageBox.querySelector('p').innerHTML = `${result.message} ${dendaText}`;
        } else {
            messageBox.classList.remove('alert-info', 'alert-success');
            messageBox.classList.add('alert-danger');
            messageBox.querySelector('p').innerHTML = result.message || 'Gagal memproses pengembalian.';
        }
    });
}

// Catatan: Anda perlu mengimplementasikan logika 'Cek Peminjaman' (tombol di Return.html) secara terpisah
// menggunakan `fetchData` dengan action baru (misalnya: `getBorrowedBooks`) dan memuat hasilnya ke #booksToReturnList.
