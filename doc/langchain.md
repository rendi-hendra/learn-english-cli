# Arsitektur LangChain & LangGraph

Dalam pengembangan aplikasi berbasis Large Language Models (LLM) seperti asisten otonom cerdas, **LangChain** dan kerangka kerja *low-level*-nya yaitu **LangGraph**, telah menjadi standar untuk mengorkestrasi eksekusi dari alur logika AI.

## Apa itu LangChain?
LangChain adalah kerangka kerja yang memudahkan pengembang untuk membuat aplikasi dari model bahasa AI. Awalnya LangChain terkenal dengan konsep **Chains** (Rantai), yaitu serangkaian komponen yang dijalankan secara linier. Namun, "rantai linier" seringkali tidak cukup tangguh untuk membangun agen *Agent* yang kompleks, yang harus bisa memanggil *tools*, mengevaluasi *error*, dan melakukan penalaran berulang secara siklikal hingga berhasil.

## Masuknya LangGraph
Untuk memecahkan batasan rantai linier, diciptakanlah **LangGraph**. LangGraph adalah library orkestrasi yang dirancang khusus untuk membangun alur kerja Agent AI yang *stateful* (menyimpan memori kondisi), multi-aktor, dan dapat berjalan secara non-linear (memiliki loop/putaran).

Daripada menggunakan pendekatan linier, LangGraph memodelkan alur logika Agent sebagai sebuah **Stateful Directed Graph** (Grafik Berarah Berbasis *State*).

### Komponen Inti Arsitektur LangGraph
1.  **State (Status Konteks):** 
    Ini adalah struktur data terpusat (mirip seperti *digital notebook*) yang dipertahankan terus-menerus selama eksekusi agen. *State* menyimpan riwayat percakapan, panggilan alat terakhir (*tool call*), output pesan sementara, dan lain-lain. Setiap tahapan agen membaca atau memperbarui *State* ini.
2.  **Nodes (Simpul / Langkah Eksekusi):**
    Sebuah *Node* adalah fungsi Python atau JavaScript yang mewakili satu langkah komputasi. *Node* menerima *State* saat ini, melakukan sebuah tindakan (misal: memanggil API LLM atau mengeksekusi sebuah MCP tool), dan kemudian mengembalikan pembaharuan (*update*) ke dalam *State*.
3.  **Edges (Tepi / Rute Transisi):**
    *Edge* mendefinisikan rute ke mana eksekusi berlanjut setelah sebuah *Node* selesai bekerja.
    *   *Normal Edges:* Bergerak statis dari *Node A* ke *Node B*.
    *   *Conditional Edges:* Menggunakan logika untuk memutuskan cabang mana yang harus diambil selanjutnya (misal: jika ada perintah *tool calling* oleh LLM, arahkan ke *Node Tool*; jika tidak ada, arahkan langsung ke pengguna). Ini yang memungkinkan terciptanya *looping*.
4.  **Checkpointer:**
    Sistem yang mencatat (*save*) *State* di setiap langkah transisi graf. Dengan *Checkpointer*, sebuah eksekusi agen dapat disimpan ke database untuk bisa dilanjutkan kembali (resume) nanti, atau memicu proses persetujuan manusia (*Human-in-the-Loop*).

## Cara Kerja LangGraph secara Umum
1.  **Definisi Rute:** Developer merancang *nodes* (misalnya "Node Panggil LLM" dan "Node Eksekusi Tools") dan menghubungkannya dengan *edges*.
2.  **Eksekusi:** Saat pengguna memberikan *prompt*, LangGraph memicu "Node LLM".
3.  **Pengambilan Keputusan Siklikal:** 
    * "Node LLM" memutuskan bahwa agen perlu memanggil *Filesystem MCP Tool* dan meng-_update_ *State*. 
    * Melalui *Conditional Edge*, LangGraph me-*routing* eksekusi ini ke "Node Tools" yang akan menjalankan alatnya sungguhan.
    * Setelah alat selesai, outputnya di-simpan lagi ke *State*, dan LangGraph kembali _looping_ (*routing* berputar) ke "Node LLM" agar LLM dapat membaca balasan dari *tool* dan menentukan jawaban akhir atau memanggil *tool* lain.

## Mengapa Proyek Ini Bermigrasi ke Sini?
Migrasi pemanggilan *streaming* LLM secara langsung ke ekosistem **LangChain/LangGraph** bertujuan untuk:
*   **Meningkatkan Stabilitas:** Penanganan *error* jaringan saat *streaming* dan orkestrasi alat (*tool-calling*) yang lebih sistematis ketimbang dikontrol oleh *While-loop* manual.
*   **Struktur yang Terprediksi:** Alur logika ke mana agen bergerak lebih transparan, pembuatan log lebih rapi (*structured logging*), dan agen yang lebih sulit untuk *stuck* atau kehilangan memori akibat *crash*.
