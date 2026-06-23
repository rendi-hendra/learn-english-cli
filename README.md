# AI CLI Terminal & Translator

AI CLI Terminal adalah aplikasi TUI (Terminal User Interface) modern, interaktif, dan berkinerja tinggi yang dibangun menggunakan **React**, **TypeScript**, **Ink**, dan **OpenAI API**. Aplikasi ini menghadirkan pengalaman produktivitas terminal yang mulus (seperti Claude Code atau Gemini CLI) dengan fitur penerjemahan otomatis dwi-arah yang natural, riwayat perintah persisten, serta rendering Markdown premium menggunakan **Glow**.

---

## 🚀 Fitur Utama & Keunggulan

### 1. 🔄 Penerjemah Bahasa Otomatis Cerdas (Indonesia ↔ Inggris)
CLI ini dirancang sebagai asisten penerjemah dwi-arah yang sangat efisien:
*   **Deteksi Bahasa Otomatis**: AI mendeteksi bahasa masukan secara otomatis dan menerjemahkannya ke bahasa tujuan (Indonesia ke Inggris, Inggris ke Indonesia).
*   **Pantauan Clipboard Real-time**: Dalam **Mode Translator**, aplikasi akan memantau *clipboard* OS Anda dan **secara otomatis menerjemahkan teks baru yang Anda salin (copy)** tanpa perlu mengetik atau melakukan *paste* secara manual.
*   **Penyelarasan Ekspresi Native**: AI memilih kosakata dan struktur frasa yang paling sering digunakan oleh penutur asli (*native speaker*).
*   **Adaptasi Output Cerdas**:
    *   **Input Manual**: AI menyajikan 3 baris terjemahan terstruktur untuk membantu proses belajar Anda: `Direct` (literal), `Natural` (idiomatik/native), dan `Formal` (formal/sopan).
    *   **Input Clipboard (Otomatis)**: AI secara cerdas hanya menampilkan 1 baris terjemahan `Natural` yang ringkas agar tampilan terminal tetap bersih dan efisien.
    *   **Thinking Mode Aktif**: AI menyajikan analisis terjemahan yang lebih mendalam hingga 4 gaya bahasa presisi: `Direct`, `Natural`, `Slang` (informal), dan `Formal`.

### 2. 📝 Hybrid Rendering Markdown (Glow & Custom JS)
Untuk menjamin tampilan estetis tanpa mengorbankan performa:
*   **Real-time Streaming**: Saat respons mengalir dari API, parser kustom JS yang ringan akan langsung merender teks dan kode sumber tanpa *lag*.
*   **Glow Polishing**: Begitu respons lengkap diterima, aplikasi akan memanggil pustaka **Glow** (oleh Charmbracelet) di latar belakang untuk merapikan spasi, memformat daftar (*list*), dan menyajikan *syntax highlighting* premium.
*   **Pembersihan Tanda Markdown**: Karakter penanda judul Markdown (`#`, `##`, `###`) otomatis dibersihkan agar teks tetap nyaman dibaca di layar terminal, dengan tetap mempertahankan warna dan format tebal.
*   **Graceful Degradation**: Jika `glow` tidak terpasang di sistem, aplikasi akan otomatis beralih ke parser internal secara aman tanpa menyebabkan crash.

### 3. ⌨️ Input Bar & Navigasi Kursor Tingkat Lanjut
*   **Navigasi Presisi**: Gunakan tombol **Panah Kiri** dan **Panah Kanan** untuk memindahkan kursor dan mengedit teks di bagian mana pun pada kalimat.
*   **Penanganan Backspace & Delete**: Mendukung penghapusan karakter secara akurat di posisi kursor saat ini pada OS Windows maupun UNIX.
*   **Sinkronisasi Real-time**: Menggunakan referensi memori mutable (`useRef`) untuk melacak teks dan posisi kursor, menghindari bug *stale closure* saat mengetik cepat.

### 4. 📜 Riwayat Perintah Persisten (Command History)
*   **Navigasi Cepat**: Tekan **Panah Atas/Bawah** untuk menjelajahi daftar perintah sebelumnya.
*   **Penyimpanan Lokal**: Riwayat disimpan secara permanen di file `.ai_history` dalam folder proyek.
*   **Draft Preservation**: Tulisan yang sedang Anda ketik tidak akan hilang saat Anda mencari riwayat; draf tersebut akan dipulihkan secara otomatis ketika Anda kembali ke baris bawah.
*   **Anti-Duplikasi**: Perintah identik yang dikirim berturut-turut tidak akan disimpan berulang kali guna menjaga kebersihan riwayat.

### 5. ⚙️ Mode Penalaran (Thinking Mode) Dinamis
*   **Aktivasi Instan**: Jalankan aplikasi dengan parameter `--thinking` atau `-t` untuk mengaktifkan mode penalaran model AI (optimal untuk model *reasoning* seperti `qwen3.7-max` atau seri o1).
*   **Indikator Status UI**:
    *   *Thinking Aktif*: Spinner berwarna **kuning** dengan label `System Status: THINKING`.
    *   *Thinking Non-aktif*: Spinner berwarna **biru** dengan label `System Status: GENERATING`.
*   **Injeksi Prompt Khusus**: Sistem secara otomatis mengalihkan *system prompt* ke versi penalaran untuk menghasilkan gaya bahasa yang lebih komprehensif (termasuk terjemahan *Slang*).

### 6. 🤖 Mode Agen dengan Akses Filesystem (Filesystem MCP Server)
*   **Eksplorasi Lokal**: Izinkan AI untuk membantu Anda berinteraksi dengan berkas lokal secara langsung.
*   **Perintah Terintegrasi**: AI dapat membaca file, menulis file, dan menjelajahi direktori menggunakan perintah bawaan seperti `/read`, `/write`, `/ls`, dan `/pwd`.
*   **Filesystem MCP Server**: Menyediakan implementasi protokol komunikasi JSON-RPC standar yang aman dan terkontrol untuk memanipulasi file.

### 7. 🔗 Arsitektur LangChain & LangGraph
*   **Manajemen Status Tangguh**: Migrasi ke ekosistem **LangChain/LangGraph** meningkatkan stabilitas *streaming* data dan mengeliminasi kendala *Internal Server Error* pada API.
*   **Graf Eksekusi Agen**: Memungkinkan pengaturan alur kerja agen AI yang terstruktur, mempermudah pelacakan eksekusi *tool* serta penanganan kesalahan (*error handling*).

### 8. 🏗️ Desain Kode Modular & Bersih
*   **Pemisahan Tanggung Jawab**: Setiap mode aplikasi (Translator, Chat, Agent) dipisahkan menjadi komponen React tersendiri.
*   **MessageBuilder & ModelManager**: Konstruksi prompt terpusat (`PROMPT_MAP`) dan inisialisasi model di-*cache* (Singleton) untuk performa optimal.
*   **Lapisan Validasi Valid**: Membatasi panjang input (maks. 2000 karakter), menerapkan *rate limiting* (cooldown 1 detik), dan menyaring *path* file untuk menghindari celah keamanan *directory traversal*.

---

## 🛠️ Teknologi yang Digunakan

Aplikasi ini menggunakan teknologi JavaScript/TypeScript modern untuk antarmuka terminal terbaik:

*   **[Ink](https://github.com/vadimdemedes/ink) & [React](https://react.dev/)**: Membangun UI terminal dinamis menggunakan komponen berbasis *state* dan *hooks*.
*   **[LangChain](https://js.langchain.com/) & [LangGraph](https://langchain-ai.github.io/langgraphjs/)**: Framework utama untuk manajemen alur kerja LLM dan agen AI.
*   **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)**: Mengintegrasikan agen AI dengan sistem lokal menggunakan standar terbuka dari Anthropic.
*   **[Chalk](https://github.com/chalk/chalk) & [Ora](https://github.com/sindresorhus/ora)**: Mewarnai dan menganimasikan UI terminal agar tampak menarik dan responsif.
*   **[Glow](https://github.com/charmbracelet/glow)**: Pustaka CLI dari Charmbracelet untuk rendering Markdown berkualitas tinggi dengan gaya *modern code viewer*.
*   **[9Router](https://github.com/decolua/9router) *(Direkomendasikan)***: Digunakan sebagai *smart proxy gateway* untuk memotong biaya token lewat *Response Token Caching* (RTK) dan menyediakan *fallback routing* ke provider LLM.

---

## 📦 Prasyarat & Instalasi

1.  Pastikan Anda telah menginstal **Node.js** (v18 ke atas) dan **npm**.
2.  Pasang dependensi proyek:
    ```bash
    npm install
    ```
3.  **Instalasi Glow** (Sangat direkomendasikan):
    Aplikasi akan mendeteksi `glow` secara otomatis. Di Windows (Administrator), Anda dapat menginstalnya via:
    ```bash
    winget install Charmbracelet.Glow
    ```
4.  Siapkan konfigurasi berkas environment:
    ```bash
    copy .env.example .env
    ```
5.  Buka berkas `.env` dan isi OpenAI API Key Anda:
    ```env
    OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```

---

## 🛠️ Perintah Eksekusi

### 1. Jalankan Mode Pengembangan (Live Hot-Reload)
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
*   **Menggunakan Model Tertentu**:
    ```bash
    npm run dev -- -m gpt-4o
    ```

### 2. Kompilasi TypeScript (Build)
Sebelum menjalankan aplikasi dalam mode produksi, lakukan kompilasi:
```bash
npm run build
```

### 3. Menjalankan Filesystem MCP Server Secara Terpisah
```bash
npm run mcp-server
```
Secara bawaan, server akan mengizinkan akses ke direktori kerja saat ini. Anda juga bisa membatasi direktori yang diizinkan:
```bash
npm run mcp-server -- /path/ke/direktori/aman
```

---

## ⌨️ Perintah & Pintasan Aplikasi (TUI Shortcuts)

| Tombol / Perintah | Deskripsi |
| :--- | :--- |
| **`/help`** | Menampilkan menu bantuan dan informasi CLI. |
| **`/clear`** | Membersihkan riwayat percakapan dari memori visual. |
| **`/read [path]`** | Membaca file lokal ke dalam konteks obrolan (contoh: `/read src/App.tsx`). |
| **`/write [path] [content]`** | Menulis konten langsung ke file (contoh: `/write notes.txt Hello World`). |
| **`/ls [path]`** | Menampilkan daftar berkas dalam direktori (contoh: `/ls src`). |
| **`/pwd`** | Menampilkan direktori aktif saat ini. |
| **`/mode`** | Memilih salah satu dari 3 mode: **Translator**, **Chat**, atau **Agent**. |
| **`/model`** | Membuka menu interaktif untuk mengganti Model AI. |
| **`/model [nama]`** | Mengganti Model AI aktif secara instan via teks. |
| **`/exit`** | Menutup aplikasi secara aman. |
| **`Ctrl + L`** | Membersihkan layar terminal. |
| **`Ctrl + C`** | Keluar dari aplikasi secara instan. |
| **`Panah Atas / Bawah`** | Menelusuri riwayat pengetikan (Command History). |
| **`Panah Kiri / Kanan`** | Menggeser kursor teks saat mengetik. |
| **`Backspace / Delete`** | Menghapus karakter di posisi kursor. |

---

## 📚 Dokumentasi Arsitektur

Untuk mempelajari lebih dalam mengenai detail arsitektur pendukung proyek ini, silakan merujuk ke dokumen berikut:
*   [Arsitektur MCP (Model Context Protocol)](doc/mcp.md)
*   [Arsitektur LangChain & LangGraph](doc/langchain.md)
*   [Tutorial Integrasi 9Router & Alibaba Cloud Model Studio](doc/9router.md)

---

## 📂 Struktur Folder Proyek

```text
learn-english-cli/
├── doc/                        # Dokumentasi arsitektur dan panduan tambahan
├── src/
│   ├── components/             # Komponen antarmuka Terminal (React/Ink)
│   │   ├── AgentMode.tsx       # UI & logika untuk mode Agent
│   │   ├── ChatMode.tsx        # UI & logika untuk mode Chat
│   │   ├── ChatView.tsx        # Tampilan riwayat percakapan AI & User
│   │   ├── Header.tsx          # Panel informasi model dan status koneksi
│   │   ├── InputBar.tsx        # Kotak input teks interaktif dengan history kursor
│   │   ├── Message.tsx         # Komponen penampil pesan tunggal
│   │   ├── ModeSelector.tsx    # Menu ganti mode (Translator/Chat/Agent)
│   │   ├── ModelSelector.tsx   # Menu pemilihan model AI
│   │   ├── StatusBar.tsx       # Indikator status (Thinking/Generating) dan token
│   │   └── TranslatorMode.tsx  # UI & logika untuk mode Translator (dengan auto-clipboard)
│   ├── config/
│   │   └── prompts.ts          # Berkas penyimpanan sistem prompt terpusat
│   ├── hooks/                  # Logika khusus per-fitur berbasis React Hooks
│   │   ├── useAgentMode.ts     # Logika pemrosesan dan streaming Agen AI
│   │   ├── useChatMode.ts      # Logika streaming chat normal
│   │   ├── useClipboardWatcher.ts # Pemantau clipboard OS secara asinkron
│   │   └── useTranslatorMode.ts # Logika streaming translator dwi-arah
│   ├── services/               # Integrasi model LLM, MCP, dan pembangun pesan
│   │   ├── agentRouter.ts      # Routing perintah input untuk Agen AI
│   │   ├── langchain.ts        # Pustaka wrapper LangChain streaming chat & agent
│   │   ├── messageBuilder.ts   # Konstruktor format pesan terpusat
│   │   ├── modelManager.ts     # Singleton model cache instance ChatOpenAI
│   │   └── simpleMcpServer.ts  # Implementasi MCP Server JSON-RPC lokal
│   ├── store/
│   │   └── chatStore.ts        # Manajemen state global aplikasi
│   ├── tools/
│   │   └── index.ts            # Registrasi tools filesystem untuk Agen AI
│   ├── types/
│   │   ├── chat.ts             # Deklarasi tipe data chat dan status
│   │   └── modes.ts            # Deklarasi tipe data handler mode
│   ├── utils/                  # Kumpulan helper fungsional pendukung
│   │   ├── commandExecutor.ts  # Eksekutor utilitas filesystem lokal
│   │   ├── envConfig.ts        # Verifikasi berkas .env
│   │   ├── errors.ts           # Definisi standarisasi error
│   │   ├── logger.ts           # Logging aplikasi terstruktur ke berkas log
│   │   ├── markdown.ts         # Wrapper parser markdown (Marked & Glow)
│   │   ├── modelConfig.ts      # Cache model terakhir yang digunakan
│   │   └── validation.ts       # Validasi input pengguna dan sanitasi keamanan
│   ├── App.tsx                 # Komponen root aplikasi
│   ├── index.tsx               # Entry point utama aplikasi React Ink
│   └── mcp-server.ts           # Entry point mandiri untuk MCP server
├── .env.example                # Template berkas kredensial
└── package.json                # Dependensi proyek & konfigurasi skrip npm
```
