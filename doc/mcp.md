# Model Context Protocol (MCP)

Model Context Protocol (MCP) adalah standar terbuka (*open standard*) yang diciptakan untuk menyediakan cara universal dan terstandarisasi bagi aplikasi AI agar dapat terhubung dengan sumber data, alat (*tools*), dan layanan eksternal. Anda bisa membayangkannya sebagai "port USB-C untuk AI"—di mana MCP memberikan antarmuka standar untuk menghubungkan model AI ke dunia luar tanpa perlu membuat integrasi kustom satu per satu.

## Arsitektur Inti: Model Client-Server

MCP menggunakan arsitektur **client-server** yang secara jelas memisahkan antara aplikasi AI (sebagai "host") dan data spesifik atau alat yang perlu diakses.

### 1. Komponen Utama
*   **MCP Host:** Aplikasi berbasis AI yang berinteraksi dengan pengguna (contoh: CLI Agent, Cursor, Claude Desktop). Host ini berisi program LLM (Large Language Model) dan mengelola jalannya percakapan.
*   **MCP Client:** Sebuah komponen yang berada di dalam Host yang tugasnya adalah membangun dan memelihara koneksi ke satu atau lebih MCP Server. Satu Host bisa memiliki banyak koneksi (klien) ke berbagai server sekaligus.
*   **MCP Server:** Sebuah proses ringan dan spesifik yang menyediakan akses langsung ke suatu sumber data atau aksi (contoh: Filesystem MCP Server untuk mengakses file lokal, server untuk Slack, atau server untuk database).

### 2. Bagaimana Komunikasi Bekerja
*   **Protokol Standar:** Semua komunikasi antara MCP Client dan MCP Server menggunakan standar **JSON-RPC**. Ini menjamin interoperabilitas yang tinggi sehingga host MCP manapun bisa bicara dengan server MCP manapun terlepas dari bahasa pemrograman yang digunakan.
*   **Siklus Request/Response:**
    1. **Host** menganalisis permintaan user dan menyimpulkan bahwa AI membutuhkan aksi eksternal (misal: "Baca isi file notes.txt").
    2. **Client** mengirimkan *request* RPC ke **Server** yang bersangkutan.
    3. **Server** mengeksekusi tugas tersebut (misal: membaca file) dan mengembalikan hasilnya.
    4. **Host** menerima data tersebut dan menggunakannya sebagai konteks (*context*) tambahan bagi LLM untuk memberikan jawaban atau melakukan tindakan selanjutnya.

## Komponen Utama (Primitives) yang Ditawarkan Server
Sebuah MCP Server bisa mengekspos tiga hal utama kepada AI Host:
1.  **Tools (Alat):** Fungsi yang dapat dipanggil dan dieksekusi oleh AI (misal: fungsi untuk menulis file, menampilkan *directory*, dsb).
2.  **Resources (Sumber Daya):** Data *read-only* yang bisa diimpor AI sebagai konteks.
3.  **Prompts (Template):** Template instruksi standar yang membantu AI bekerja pada alur kerja spesifik.

## Mengapa MCP Sangat Penting?
Sebelum adanya MCP, pengembang harus menulis kode integrasi API kustom secara terpisah untuk setiap sumber data yang berbeda. Dengan MCP, Anda cukup membangun atau menjalankan satu Server MCP, dan server tersebut bisa langsung diakses secara _plug-and-play_ oleh *semua* klien AI yang mematuhi standar MCP. Selain modular, MCP juga mendukung lapisan transport koneksi *lokal* (contoh: stdio) yang berjalan sepenuhnya di mesin Anda secara aman tanpa mengekspos data ke internet publik.
