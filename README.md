# AI CLI Terminal & Translator

AI CLI Terminal adalah aplikasi TUI (Terminal User Interface) modern, interaktif, dan berkinerja tinggi yang dibangun menggunakan **React**, **TypeScript**, **Ink**, dan **OpenAI API**. Aplikasi ini menawarkan pengalaman seperti Claude Code, Gemini CLI, atau OpenCode dengan fitur penerjemahan otomatis dwi-arah yang natural, riwayat perintah persisten, dan rendering Markdown premium menggunakan **Glow**.

---

## 🚀 Fitur Utama & Keunggulan

### 1. 🔄 Penerjemah Bahasa Otomatis (Indonesia ↔ Inggris)
Secara default, CLI diprogram sebagai asisten penerjemah dwi-arah yang sangat efisien:
*   **Deteksi Bahasa Otomatis**: Mendeteksi bahasa masukan secara otomatis dan menerjemahkannya ke bahasa tujuan (Indonesia ke Inggris, Inggris ke Indonesia).
*   **Penyelarasan Ekspresi Native**: AI akan memilih frasa dan terjemahan paling natural yang biasa digunakan oleh penutur asli (*native speaker*).
*   **Output Format Ketat**: AI patuh tanpa basa-basi untuk langsung mengeluarkan output dalam format:
    1.  `Direct`: Terjemahan literal/harfiah kata demi kata.
    2.  `natural`: Terjemahan paling umum dan kasual menurut penutur asli.
    3.  `formal`: Terjemahan formal/sopan, atau untuk keperluan bisnis/akademik.

### 2. 📝 Hybrid Rendering Markdown (Glow & Custom JS)
Untuk menjamin tampilan yang luar biasa tanpa memperlambat aplikasi:
*   **Real-time Streaming**: Selama teks mengalir dari API, aplikasi menggunakan parser kustom JS yang ringan untuk merender teks dan kode sumber secara instan tanpa lag.
*   **Glow Polishing**: Begitu respons selesai dikirim secara penuh, aplikasi akan memanggil utility **Glow** (oleh Charmbracelet) di latar belakang untuk merapikan spasi, memformat list, dan menyajikan *syntax highlighting* berkualitas premium.
*   **Pembersihan Tanda Markdown (`#`)**: Aplikasi secara otomatis menyaring dan menghapus tanda pagar (`#`, `##`, `###`) dari judul di terminal, tetapi tetap mempertahankan warna dan format tebal yang dihasilkan.
*   **Graceful Degradation**: Jika `glow` tidak terpasang di sistem, aplikasi akan otomatis jatuh kembali (*fallback*) ke parser internal secara aman tanpa menyebabkan crash.

### 3. ⌨️ Input Bar & Navigasi Kursor Tingkat Lanjut
*   **Navigasi Kiri-Kanan**: Gunakan tombol **Panah Kiri** dan **Panah Kanan** untuk memindahkan kursor dan mengedit teks di tengah kalimat.
*   **Hapus Teks Presisi**: Menekan **Backspace** atau **Delete** akan menghapus karakter tepat di posisi kursor saat ini. Masalah pemetaan kode keyboard Windows (`DEL` vs `BS`) telah disatukan secara internal demi kenyamanan pengguna.
*   **Sinkronisasi Real-time**: Menggunakan referensi memori mutable (`useRef`) untuk melacak posisi kursor dan teks secara sinkron, menghindari bug *stale closure* akibat pengetikan cepat atau tombol Backspace yang ditahan.

### 4. 📜 Riwayat Perintah Persisten (Command History)
*   **Navigasi Panah Atas/Bawah**: Tekan **Panah Atas** untuk melihat perintah sebelumnya dan **Panah Bawah** untuk kembali ke perintah yang lebih baru.
*   **Penyimpanan File Lokal**: Riwayat disimpan secara permanen di file `.ai_history` di folder proyek sehingga riwayat Anda tidak hilang walaupun terminal ditutup.
*   **Penyelamatan Draf**: Jika Anda sedang mengetik lalu menekan Panah Atas untuk melihat riwayat, tulisan yang sedang Anda ketik tidak akan hilang dan akan dipulihkan jika Anda kembali ke bawah.
*   **Anti-Duplikasi**: Perintah duplikat yang dikirim berturut-turut tidak akan disimpan berulang kali untuk menjaga kebersihan riwayat.

### 5. ⚙️ Mode Penalaran (Thinking Mode) Dinamis
*   **Opsi Jalur Pintas CLI**: Menjalankan aplikasi dengan parameter `--thinking` atau `-t` akan mengaktifkan mode penalaran model AI (seperti `qwen3.7-max` atau seri model reasoning).
*   **Informasi Status Detail**:
    *   **Thinking Mode Aktif**: Spinner status akan berwarna **kuning** dengan label **`System Status: THINKING`** dan detail status **`Thinking: true`**.
    *   **Thinking Mode Non-aktif**: Spinner status akan berwarna **biru** dengan label **`System Status: GENERATING`** dan detail status **`Thinking: false`**.

### 6. 🤖 Mode Agen dengan Akses Filesystem (Filesystem MCP Server)
*   **Akses Filesystem**: Mode agen memungkinkan AI untuk berinteraksi dengan sistem file lokal melalui perintah-perintah khusus.
*   **Perintah Filesystem**: Dalam mode agen, AI dapat membaca file, menulis file, dan menjelajahi direktori menggunakan perintah `/read`, `/write`, `/ls`, dan `/pwd`.
*   **Filesystem MCP Server**: Aplikasi menyertakan implementasi sederhana dari Filesystem MCP Server yang memungkinkan AI untuk berinteraksi dengan file sistem secara aman dan terkontrol.

---

## 📦 Prasyarat & Instalasi

1.  Pastikan Anda telah menginstal **Node.js** (v18 ke atas) dan **npm**.
2.  Install seluruh dependencies node:
    ```bash
    npm install
    ```
3.  **Instalasi Glow** (Opsional, sangat disarankan):
    Aplikasi akan mendeteksi `glow` secara otomatis jika terpasang. Pada Windows, Anda bisa menginstalnya lewat command prompt administrator dengan:
    ```bash
    winget install Charmbracelet.Glow
    ```
4.  Salin template berkas environment variables:
    ```bash
    copy .env.example .env
    ```
5.  Buka file `.env` dan masukkan OpenAI API Key atau provider kompatibel Anda:
    ```env
    OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```

---

## 🛠️ Perintah Eksekusi

### 1. Mode Pengembangan (Live Hot-Reload)
*   **Default (Normal Mode, Tanpa Thinking)**:
    ```bash
    npm run dev
    ```
*   **Dengan Thinking Mode Aktif**:
    ```bash
    npm run dev -- --thinking
    ```
    *atau:*
    ```bash
    npm run dev -- -t
    ```
*   **Mengganti Model Default secara Manual**:
    ```bash
    npm run dev -- -m gpt-4o
    ```

### 2. Kompilasi TypeScript (Build)
Sebelum menjalankan mode produksi, Anda wajib melakukan kompilasi file TypeScript:
```bash
npm run build
```

### 4. Menjalankan Filesystem MCP Server
Untuk menjalankan Filesystem MCP Server yang memungkinkan akses ke sistem file:
```bash
npm run mcp-server
```
Secara default, server akan mengizinkan akses ke direktori kerja saat ini. Anda dapat menentukan direktori yang diizinkan dengan:
```bash
npm run mcp-server -- /path/to/allowed/directory
```

---

## 🛠️ Perintah & Pintasan di Dalam Aplikasi (TUI Shortcuts)

| Tombol / Perintah | Deskripsi |
| :--- | :--- |
| **`/help`** | Menampilkan panduan bantuan CLI. |
| **`/clear`** | Menghapus seluruh riwayat obrolan dari memori. |
| **`/read [path]`** | Membaca dan memuat isi berkas lokal ke dalam konteks obrolan (contoh: `/read src/App.tsx`). |
| **`/write [path] [content]`** | Menulis konten ke file (contoh: `/write notes.txt Hello World`). |
| **`/ls [path]`** | Menampilkan daftar isi direktori (contoh: `/ls src`). |
| **`/pwd`** | Menampilkan direktori kerja saat ini. |
| **`/mode`** | Menampilkan menu interaktif untuk beralih antara 3 mode: **Translator**, **Chat**, atau **Agent**. |
| **`/model`** | Menampilkan menu antarmuka interaktif untuk memilih model AI. |
| **`/model [nama]`** | Mengubah model AI aktif secara langsung tanpa menu interaktif. |
| **`/exit`** | Keluar dari aplikasi. |
| **`Ctrl + L`** | Membersihkan layar terminal. |
| **`Ctrl + C`** | Keluar dari aplikasi secara instan. |
| **`Panah Atas / Bawah`** | Menjelajahi riwayat prompt (Command History). |
| **`Panah Kiri / Kanan`** | Memindahkan kursor input teks ke kiri dan ke kanan. |
| **`Backspace / Delete`** | Menghapus karakter di posisi kursor. |

---

## 📂 Struktur File Utama

*   [`src/components/InputBar.tsx`](file:///d:/Coding/Javascript/NodeJs/learn-english-cli/src/components/InputBar.tsx): Mengatur input teks, visualisasi kursor, navigasi kursor, penghapusan presisi, dan navigasi command history.
*   [`src/components/StatusBar.tsx`](file:///d:/Coding/Javascript/NodeJs/learn-english-cli/src/components/StatusBar.tsx): Menampilkan status sistem (`THINKING` atau `GENERATING`), estimasi token, animasi loader spinner, dan detail mode thinking.
*   [`src/utils/markdown.ts`](file:///d:/Coding/Javascript/NodeJs/learn-english-cli/src/utils/markdown.ts): Mengatur rendering markdown built-in, deteksi otomatis path `glow.exe` dari winget, serta regex pembersih tanda heading (`#`).
*   [`src/App.tsx`](file:///d:/Coding/Javascript/NodeJs/learn-english-cli/src/App.tsx): Komponen pengikat utama aplikasi, menangani input, perintah `/`, dan orkestrasi pemanggilan API OpenAI.
*   [`src/store/chatStore.ts`](file:///d:/Coding/Javascript/NodeJs/learn-english-cli/src/store/chatStore.ts): State management global (Flux-like) untuk mengelola data pesan chat, status, model aktif, dan konfigurasi thinking.
