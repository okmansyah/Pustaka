// script.js - File JavaScript Lengkap untuk E-Perpus MTs

// ========================================================
// 🚨 PENTING: GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA
// ========================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_XXXXXXXXX/exec'; 


// ========================================================
// 1. FUNGSI DASAR KONEKSI DATA
// ========================================================

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
 * @param {Object} data - Objek data yang berisi 'action' dan data formulir
 */
async function sendData(data) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Penting untuk Apps Script sebagai backend
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        // Karena mode: 'no-cors', respons tidak bisa di-parse sebagai JSON.
        // Kita hanya bisa berasumsi sukses jika tidak ada error jaringan.
        return { success: true, message: "Operasi berhasil dipicu. Periksa Google Sheet Anda." };

    } catch (error) {
        console.error('Terjadi kesalahan saat mengirim data:', error);
        return { error: true, message: 'Gagal koneksi ke server atau Apps Script.' };
    }
}


// ========================================================
// 2. LOGIKA ADMIN (LOGIN/CRUD)
// ========================================================

const ADMIN_USERNAME = 'adminperpus';
const ADMIN_PASSWORD = 'passwordkuat123';
let currentBookData = []; // Menyimpan data buku yang dimuat untuk admin

// --- Login/Logout ---

function updateLoginStatus(isLoggedIn) {
    const logoutNav = document.getElementById('logoutNavItem');
    const loginContainer = document.getElementById('loginContainer');
    const adminContent = document.getElementById('adminContent');
    
    if (isLoggedIn) {
        if (loginContainer) loginContainer.classList.add('d-none');
        if (adminContent) {
            adminContent.classList.remove('d-none');
            loadAdminData(); // Muat data hanya setelah login berhasil
        }
        
        logoutNav.classList.remove('d-none');
        logoutNav.innerHTML = `<a class="nav-link btn btn-danger text-white ms-2" onclick="logoutAdmin()" style="cursor: pointer;"><i class="bi bi-box-arrow-right"></i> Logout</a>`;
    } else {
        if (loginContainer) loginContainer.classList.remove('d-none');
        if (adminContent) adminContent.classList.add('d-none');
        logoutNav.classList.add('d-none');
        logoutNav.innerHTML = '';
    }
}

function checkLogin() {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    updateLoginStatus(isLoggedIn);
    return isLoggedIn;
}

function loginAdmin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageBox = document.getElementById('loginMessage');

    messageBox.classList.add('d-none');

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem('isAdminLoggedIn', 'true');
        messageBox.classList.remove('alert-danger');
        messageBox.classList.add('alert-success');
        messageBox.textContent = 'Login berhasil! Memuat data admin...';
        messageBox.classList.remove('d-none');
        
        setTimeout(() => {
            updateLoginStatus(true);
        }, 500);
    } else {
        messageBox.classList.remove('alert-success');
        messageBox.classList.add('alert-danger');
        messageBox.textContent = 'Username atau Password salah.';
        messageBox.classList.remove('d-none');
    }
}

function logoutAdmin() {
    if (confirm('Anda yakin ingin keluar dari sesi admin?')) {
        localStorage.removeItem('isAdminLoggedIn');
        window.location.reload(); 
    }
}

// --- CRUD ---

async function loadAdminData() {
    const tableBody = document.getElementById('dataTable');
    const tableLoading = document.getElementById('tableLoading');
    if (!tableBody || !tableLoading) return; // Pastikan elemen ada

    tableBody.innerHTML = '';
    tableLoading.classList.remove('d-none');

    const data = await fetchData('getBooksAdmin'); 
    tableLoading.classList.add('d-none');

    if (data.error || !Array.isArray(data.data)) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-danger text-center">Gagal memuat data.</td></tr>`;
        return;
    }
    
    currentBookData = data.data; 
    
    if (currentBookData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-muted text-center">Belum ada data buku.</td></tr>`;
        return;
    }

    currentBookData.forEach(book => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${book.Kode}</td>
            <td>${book.Judul}</td>
            <td>${book.Pengarang}</td>
            <td>${book.Kategori}</td>
            <td>${book.Stok}</td>
            <td>
                <button class="btn btn-sm btn-info text-white me-2" onclick="editBook('${book.Kode}')">
                    <i class="bi bi-pencil-square"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteBook('${book.Kode}')">
                    <i class="bi bi-trash"></i> Hapus
                </button>
            </td>
        `;
    });
}

function editBook(bookCode) {
    const book = currentBookData.find(b => b.Kode === bookCode);
    if (!book) return alert('Buku tidak ditemukan.');

    document.getElementById('formTitle').innerHTML = '<i class="bi bi-pencil"></i> Edit Data Buku: ' + bookCode;
    document.getElementById('submitButton').textContent = 'Update Data';
    document.getElementById('bookId').value = bookCode;
    document.getElementById('kode').value = book.Kode;
    document.getElementById('judul').value = book.Judul;
    document.getElementById('pengarang').value = book.Pengarang;
    document.getElementById('kategori').value = book.Kategori;
    document.getElementById('stok').value = book.Stok;
    document.getElementById('kode').disabled = true;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    document.getElementById('bookForm').reset();
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-file-earmark-plus"></i> Tambah Buku Baru';
    document.getElementById('submitButton').textContent = 'Simpan Data';
    document.getElementById('bookId').value = '';
    document.getElementById('kode').disabled = false;
    document.getElementById('formMessage').classList.add('d-none');
}

async function deleteBook(bookCode) {
    if (!confirm(`Yakin ingin menghapus buku dengan Kode: ${bookCode}?`)) return;

    const messageBox = document.getElementById('formMessage');
    messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
    messageBox.classList.add('alert-info');
    messageBox.textContent = `Memproses penghapusan data buku ${bookCode}...`;

    const data = { action: 'deleteBook', kode: bookCode };
    const result = await sendData(data);

    if (result.success) {
        messageBox.classList.remove('alert-info');
        messageBox.classList.add('alert-success');
        messageBox.textContent = result.message;
        loadAdminData();
    } else {
        messageBox.classList.remove('alert-info');
        messageBox.classList.add('alert-danger');
        messageBox.textContent = result.message || 'Gagal menghapus data.';
    }
}


// ========================================================
// 3. LOGIKA HALAMAN LAIN (STATISTIK & DAFTAR BUKU)
// ========================================================

/**
 * Halaman Beranda: Memuat Statistik
 */
async function loadHomeStats() {
    if (!document.getElementById('totalBuku')) return;
    const stats = await fetchData('getStats');
    
    if (!stats.error) {
        // Asumsi struktur respons Apps Script: {totalBuku: N, bukuTersedia: N, ...}
        document.getElementById('totalBuku').textContent = stats.totalBuku || 'N/A';
        document.getElementById('bukuTersedia').textContent = stats.bukuTersedia || 'N/A';
        document.getElementById('bukuDipinjam').textContent = stats.bukuDipinjam || 'N/A';
        document.getElementById('totalAnggota').textContent = stats.totalAnggota || 'N/A';
    } else {
         document.getElementById('totalBuku').textContent = 'Error';
         console.error(stats.message);
    }
}

let allBooksData = []; // Data mentah untuk filtering

/**
 * Memuat dan menampilkan data buku di halaman Daftar Buku
 */
async function loadBooksPage() {
    if (!document.getElementById('bookListContainer')) return;
    
    const booksData = await fetchData('getBooks');
    if (booksData.error || !Array.isArray(booksData.data)) {
        document.getElementById('bookListContainer').innerHTML = '<div class="col-12"><div class="alert alert-danger" role="alert">Gagal memuat data buku.</div></div>';
        return;
    }
    
    allBooksData = booksData.data;
    filterAndDisplayBooks(); // Tampilkan semua saat pertama load
    
    // Setup filter listener
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        filterAndDisplayBooks();
    });
}

function filterAndDisplayBooks() {
    const container = document.getElementById('bookListContainer');
    if (!container) return;

    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value.toLowerCase();

    const filtered = allBooksData.filter(book => {
        const matchTitle = book.Judul.toLowerCase().includes(searchInput);
        const matchAuthor = book.Pengarang.toLowerCase().includes(searchInput);
        const matchCategory = categoryFilter === '' || book.Kategori.toLowerCase() === categoryFilter;
        
        return (matchTitle || matchAuthor) && matchCategory;
    });

    container.innerHTML = '';

    if (filtered.length === 0) {
        container.innerHTML = '<div class="col-12 text-center mt-5"><p class="lead text-muted">Tidak ada buku yang ditemukan.</p></div>';
        return;
    }

    filtered.forEach(book => {
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
}


// ========================================================
// 4. LOGIKA FORM PEMINJAMAN & PENGEMBALIAN
// ========================================================

/**
 * Logika Form Peminjaman (borrow.html)
 */
async function handleBorrowSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.action = 'addBorrow';
    
    const messageBox = document.getElementById('borrowMessage');
    messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
    messageBox.classList.add('alert-info');
    messageBox.textContent = 'Memproses peminjaman...';

    const result = await sendData(data);

    if (result.success) {
        messageBox.classList.remove('alert-info');
        messageBox.classList.add('alert-success');
        messageBox.textContent = result.message;
        form.reset();
    } else {
        messageBox.classList.remove('alert-info');
        messageBox.classList.add('alert-danger');
        messageBox.textContent = result.message || 'Gagal mencatat peminjaman.';
    }
}

/**
 * Logika Form Pengembalian (return.html)
 */
async function handleReturnSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const booksToReturn = formData.getAll('booksToReturn[]');
    
    const feeNotification = document.getElementById('feeNotification');
    
    if (booksToReturn.length === 0) {
        alert("Pilih minimal satu buku untuk dikembalikan.");
        feeNotification.style.display = 'none';
        return;
    }

    feeNotification.style.display = 'block';
    feeNotification.classList.remove('alert-success', 'alert-danger');
    feeNotification.classList.add('alert-info');
    feeNotification.querySelector('p').innerHTML = 'Memproses pengembalian...';

    const data = {
        action: 'processReturn',
        memberID: formData.get('memberIDReturn'),
        books: booksToReturn 
    };
    
    const result = await sendData(data); // Di Apps Script, Anda akan menghitung denda

    if (result.success) {
        // SIMULASI Denda (Apps Script harus mengembalikan data denda riil)
        const dendaRiil = (booksToReturn.length > 1) ? 5000 : 0; 

        feeNotification.classList.remove('alert-info');
        feeNotification.classList.add('alert-success');
        feeNotification.querySelector('h5').textContent = 'Pengembalian Berhasil!';
        feeNotification.querySelector('p').innerHTML = `${result.message}. Total Denda (Simulasi): <b>Rp ${dendaRiil.toLocaleString('id-ID')}</b>.`;
        form.reset(); // Reset form setelah sukses
    } else {
        feeNotification.classList.remove('alert-info');
        feeNotification.classList.add('alert-danger');
        feeNotification.querySelector('p').innerHTML = result.message || 'Gagal memproses pengembalian.';
    }
}


// ========================================================
// 5. INIALISASI SEMUA HALAMAN
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Beranda
    loadHomeStats();
    
    // Inisialisasi Daftar Buku
    loadBooksPage();
    
    // Inisialisasi Peminjaman
    const borrowForm = document.getElementById('borrowForm');
    if (borrowForm) {
        borrowForm.addEventListener('submit', handleBorrowSubmit);
    }

    // Inisialisasi Pengembalian
    const returnForm = document.getElementById('returnForm');
    if (returnForm) {
        returnForm.addEventListener('submit', handleReturnSubmit);
    }
    
    // Inisialisasi Admin (Login & CRUD Submit)
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', loginAdmin);
        checkLogin(); // Cek status saat halaman admin dimuat
    }
    
    const bookForm = document.getElementById('bookForm');
    if (bookForm) {
        bookForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(bookForm);
            const isEditing = formData.get('bookId') !== '';
            
            const data = Object.fromEntries(formData.entries());
            data.action = isEditing ? 'editBook' : 'addBook';
            
            const messageBox = document.getElementById('formMessage');
            messageBox.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-info');
            messageBox.classList.add('alert-info');
            messageBox.textContent = `Memproses ${isEditing ? 'pembaruan' : 'penambahan'} data...`;

            const result = await sendData(data);

            if (result.success) {
                messageBox.classList.remove('alert-info');
                messageBox.classList.add('alert-success');
                messageBox.textContent = result.message;
                resetForm();
                loadAdminData();
            } else {
                messageBox.classList.remove('alert-info');
                messageBox.classList.add('alert-danger');
                messageBox.textContent = result.message || 'Gagal menyimpan data.';
            }
        });
    }

});
        
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.action = 'addBorrow'; // Tambahkan action untuk Apps Script
        
        const messageBox = document.getElementById('borrowMessage');
        messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
        messageBox.textContent = 'Memproses peminjaman...';

        try {
            // 🚨 Ganti dengan fetch asli ke GOOGLE_SCRIPT_URL
            // const response = await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
            // const result = await response.json();
            
            // --- SIMULASI RESPONS ---
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulasi delay jaringan
            const result = { success: true, message: `Peminjaman buku ${data.bookCode} untuk NIS ${data.memberID} berhasil dicatat!` };
            // ------------------------

            if (result.success) {
                messageBox.classList.add('alert-success');
                messageBox.textContent = result.message;
                form.reset();
            } else {
                messageBox.classList.add('alert-danger');
                messageBox.textContent = result.message || 'Gagal mencatat peminjaman.';
            }
        } catch (error) {
            messageBox.classList.add('alert-danger');
            messageBox.textContent = 'Error koneksi server. Cek jaringan atau Apps Script.';
            console.error('Error submitting borrow form:', error);
        }
    });
}


/**
 * Logika Form Pengembalian
 */
const returnForm = document.getElementById('returnForm');
if (returnForm) {
    returnForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const booksToReturn = formData.getAll('booksToReturn[]');
        
        const messageBox = document.getElementById('feeNotification');
        messageBox.style.display = 'block';
        messageBox.classList.remove('alert-warning', 'alert-success');
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
        
        try {
            // 🚨 Ganti dengan fetch asli ke GOOGLE_SCRIPT_URL
            // const response = await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
            // const result = await response.json();
            
            // --- SIMULASI RESPONS ---
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            const totalDenda = (booksToReturn.includes('B-002')) ? 7000 : 0;
            const result = { success: true, denda: totalDenda, message: `${booksToReturn.length} buku berhasil dikembalikan.` };
            // ------------------------

            if (result.success) {
                messageBox.classList.remove('alert-info');
                messageBox.classList.add('alert-success');
                messageBox.querySelector('h5').textContent = 'Pengembalian Berhasil!';
                messageBox.querySelector('p').innerHTML = `${result.message} Total Denda: <b>Rp ${result.denda.toLocaleString('id-ID')}</b>.`;
            } else {
                messageBox.classList.remove('alert-info');
                messageBox.classList.add('alert-danger');
                messageBox.querySelector('p').innerHTML = result.message || 'Gagal memproses pengembalian.';
            }
        } catch (error) {
            messageBox.classList.remove('alert-info');
            messageBox.classList.add('alert-danger');
            messageBox.querySelector('p').innerHTML = 'Error koneksi server saat pengembalian.';
        }
    });
}
// script.js (Tambahan Logika untuk Halaman Admin)

// Asumsi: GOOGLE_SCRIPT_URL sudah didefinisikan di awal file

let currentBookData = []; // Menyimpan data buku yang dimuat untuk keperluan edit/hapus

/**
 * Memuat data buku ke dalam tabel admin
 */
async function loadAdminData() {
    const tableBody = document.getElementById('dataTable');
    const tableLoading = document.getElementById('tableLoading');
    tableBody.innerHTML = '';
    tableLoading.classList.remove('d-none');

    // Menggunakan fungsi fetchData yang sudah ada, dengan action yang disiapkan untuk Apps Script
    const data = await fetchData('getBooksAdmin'); 
    tableLoading.classList.add('d-none');

    if (data.error || !Array.isArray(data.data)) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-danger text-center">Gagal memuat data.</td></tr>`;
        return;
    }
    
    currentBookData = data.data; // Simpan data untuk manipulasi
    
    if (currentBookData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-muted text-center">Belum ada data buku.</td></tr>`;
        return;
    }

    currentBookData.forEach(book => {
        // Asumsi data dari Apps Script memiliki properti: Kode, Judul, Pengarang, Kategori, Stok
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${book.Kode}</td>
            <td>${book.Judul}</td>
            <td>${book.Pengarang}</td>
            <td>${book.Kategori}</td>
            <td>${book.Stok}</td>
            <td>
                <button class="btn btn-sm btn-info text-white me-2" onclick="editBook('${book.Kode}')">
                    <i class="bi bi-pencil-square"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteBook('${book.Kode}')">
                    <i class="bi bi-trash"></i> Hapus
                </button>
            </td>
        `;
    });
}

/**
 * Mengisi formulir untuk proses Edit Data
 * @param {string} bookCode - Kode unik buku yang akan diedit
 */
function editBook(bookCode) {
    const book = currentBookData.find(b => b.Kode === bookCode);
    if (!book) return alert('Buku tidak ditemukan.');

    // Isi Form
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-pencil"></i> Edit Data Buku: ' + bookCode;
    document.getElementById('submitButton').textContent = 'Update Data';
    document.getElementById('bookId').value = bookCode; // Menyimpan kode buku lama (sebagai ID)
    document.getElementById('kode').value = book.Kode; // Nilai baru (jika kode buku boleh diubah)
    document.getElementById('judul').value = book.Judul;
    document.getElementById('pengarang').value = book.Pengarang;
    document.getElementById('kategori').value = book.Kategori;
    document.getElementById('stok').value = book.Stok;
    
    // Nonaktifkan field Kode saat Edit (jika Anda ingin KodeBuku tidak bisa diubah)
    document.getElementById('kode').disabled = true;
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas (Form)
}

/**
 * Mereset formulir ke mode Entri Baru
 */
function resetForm() {
    document.getElementById('bookForm').reset();
    document.getElementById('formTitle').innerHTML = '<i class="bi bi-file-earmark-plus"></i> Tambah Buku Baru';
    document.getElementById('submitButton').textContent = 'Simpan Data';
    document.getElementById('bookId').value = '';
    document.getElementById('kode').disabled = false;
    document.getElementById('formMessage').classList.add('d-none');
}

/**
 * Menghapus Data Buku
 * @param {string} bookCode - Kode unik buku yang akan dihapus
 */
async function deleteBook(bookCode) {
    if (!confirm(`Yakin ingin menghapus buku dengan Kode: ${bookCode}? Tindakan ini tidak dapat dibatalkan.`)) return;

    const messageBox = document.getElementById('formMessage');
    messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
    messageBox.classList.add('alert-info');
    messageBox.textContent = `Memproses penghapusan data buku ${bookCode}...`;

    const data = { action: 'deleteBook', kode: bookCode };

    try {
        // 🚨 GANTI dengan fetch asli ke GOOGLE_SCRIPT_URL
        // const response = await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
        // const result = await response.json();
        
        // --- SIMULASI RESPONS ---
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        const result = { success: true, message: `Buku ${bookCode} berhasil dihapus.` };
        // ------------------------

        if (result.success) {
            messageBox.classList.remove('alert-info');
            messageBox.classList.add('alert-success');
            messageBox.textContent = result.message;
            loadAdminData(); // Muat ulang tabel
        } else {
            messageBox.classList.remove('alert-info');
            messageBox.classList.add('alert-danger');
            messageBox.textContent = result.message || 'Gagal menghapus data.';
        }
    } catch (error) {
        messageBox.classList.remove('alert-info');
        messageBox.classList.add('alert-danger');
        messageBox.textContent = 'Error koneksi server saat penghapusan.';
    }
}


/**
 * Event Listener untuk Form Entri/Edit (Simpan Data)
 */
if (document.getElementById('bookForm')) {
    document.addEventListener('DOMContentLoaded', async () => {
        // Muat data tabel saat halaman Admin terbuka
        loadAdminData(); 

        document.getElementById('bookForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const form = e.target;
            const formData = new FormData(form);
            const isEditing = formData.get('bookId') !== '';
            
            const data = Object.fromEntries(formData.entries());
            data.action = isEditing ? 'editBook' : 'addBook';
            
            const messageBox = document.getElementById('formMessage');
            messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
            messageBox.classList.add('alert-info');
            messageBox.textContent = `Memproses ${isEditing ? 'pembaruan' : 'penambahan'} data...`;

            try {
                // 🚨 GANTI dengan fetch asli ke GOOGLE_SCRIPT_URL
                // const response = await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
                // const result = await response.json();
                
                // --- SIMULASI RESPONS ---
                await new Promise(resolve => setTimeout(resolve, 1500)); 
                const result = { success: true, message: `Data buku ${data.kode} berhasil di${isEditing ? 'perbarui' : 'simpan'}!` };
                // ------------------------

                if (result.success) {
                    messageBox.classList.remove('alert-info');
                    messageBox.classList.add('alert-success');
                    messageBox.textContent = result.message;
                    resetForm();
                    loadAdminData(); // Muat ulang tabel setelah sukses
                } else {
                    messageBox.classList.remove('alert-info');
                    messageBox.classList.add('alert-danger');
                    messageBox.textContent = result.message || 'Gagal menyimpan data.';
                }
            } catch (error) {
                messageBox.classList.remove('alert-info');
                messageBox.classList.add('alert-danger');
                messageBox.textContent = 'Error koneksi server. Cek Apps Script Anda.';
            }
        });
    });
}

