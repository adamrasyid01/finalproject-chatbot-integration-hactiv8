# Bakuin

`Bakuin` adalah chatbot berbasis AI yang membantu pengguna mengecek apakah sebuah kata atau frasa bahasa Indonesia tergolong baku atau tidak baku, lalu memberikan saran bentuk penulisan yang lebih tepat.

Chatbot ini dibangun dengan `Node.js`, `Express`, dan model `Gemini` melalui package `@google/genai`.

## Use Case

Proyek ini dibuat untuk use case `education bot` atau `language assistant`, khususnya sebagai pendamping belajar bahasa Indonesia.

Contoh kebutuhan yang bisa dibantu:
- Mengecek apakah sebuah kata merupakan bentuk baku
- Membandingkan dua kata, misalnya `praktek` atau `praktik`
- Mengoreksi kata tidak baku dalam sebuah kalimat
- Memberi alasan singkat dan contoh penggunaan bentuk baku

## Fitur Utama

- Chatbot AI berbasis Gemini
- Fokus khusus pada kata baku dan tidak baku bahasa Indonesia
- Respons singkat, relevan, dan edukatif
- Mampu membaca input satu kata, dua kata pembanding, atau satu kalimat
- Tampilan web sederhana dengan tema gelap
- Dilengkapi beberapa kata tidak baku umum untuk membantu prompt tetap konsisten

## Contoh Input dan Output

### 1. Cek satu kata

Input:

```text
ijin
```

Output:

```text
Status: Tidak baku
Bentuk baku: izin
Alasan: Bentuk baku yang digunakan dalam bahasa Indonesia adalah "izin".
Contoh: Saya meminta izin kepada guru.
```

### 2. Bandingkan dua kata

Input:

```text
praktek atau praktik?
```

Output:

```text
Status: Tidak baku
Bentuk baku: praktik
Alasan: "praktik" adalah bentuk baku, sedangkan "praktek" adalah bentuk tidak baku.
Contoh: Ia sedang menjalani praktik kerja lapangan.
```

### 3. Koreksi kalimat

Input:

```text
Saya sudah menganalisa resiko usaha ini
```

Output:

```text
Status: Tidak baku
Bentuk baku: menganalisis, risiko
Alasan: Kata "menganalisa" dan "resiko" bukan bentuk baku.
Contoh: Saya sudah menganalisis risiko usaha ini.
```

## Konfigurasi AI

Chatbot ini menggunakan model:

- `gemini-2.5-flash-lite`

Parameter yang digunakan pada backend:

- `temperature: 0.2`
- `topK: 10`
- `topP: 0.8`
- `maxOutputTokens: 300`

Alasan pemilihan parameter:
- `temperature` rendah agar jawaban lebih konsisten
- `topK` dan `topP` dibatasi supaya respons tetap fokus
- `maxOutputTokens` dibatasi agar jawaban singkat dan rapi

## Struktur Proyek

```text
gemini-chatbot-api/
├── index.js
├── package.json
├── .env
└── public/
    ├── index.html
    ├── script.js
    └── style.css
```

Penjelasan singkat:
- `index.js` adalah backend Express sekaligus penghubung ke Gemini
- `public/index.html` adalah halaman utama chatbot
- `public/script.js` mengatur interaksi chat pada browser
- `public/style.css` mengatur tampilan antarmuka

## Cara Menjalankan Proyek

### 1. Install dependency

```bash
npm install
```

### 2. Buat file `.env`

Isi file `.env`:

```env
GEMINI_API_KEY=masukkan_api_key_anda
```

### 3. Jalankan server

```bash
npm start
```

### 4. Buka di browser

```text
http://localhost:3000
```

## Cara Kerja Singkat

1. Pengguna mengetik pesan di halaman web
2. Frontend mengirim riwayat percakapan ke endpoint `/api/chat`
3. Backend membaca pesan terakhir pengguna
4. Backend menambahkan instruksi agar model fokus pada analisis kata baku atau tidak baku
5. Gemini menghasilkan jawaban sesuai format yang telah ditentukan
6. Jawaban dikirim kembali ke frontend dan ditampilkan di chat

## Teknologi yang Digunakan

- Node.js
- Express.js
- Google Gemini API
- HTML
- CSS
- JavaScript

## Catatan

- Chatbot ini dirancang untuk membantu analisis bentuk baku dan tidak baku secara praktis.
- Untuk kasus bahasa yang sangat khusus, hasil tetap perlu dipertimbangkan bersama referensi kebahasaan resmi.

## Pengembangan Lanjutan

Beberapa pengembangan yang bisa ditambahkan:
- Menambah kamus kata tidak baku yang lebih lengkap
- Menambahkan referensi resmi atau sumber penjelasan kebahasaan
- Menyimpan riwayat pencarian pengguna
- Menambahkan mode pemeriksaan paragraf penuh
