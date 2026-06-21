# Tutorial Konfigurasi 9Router dengan Alibaba Cloud Model Studio

Tutorial ini memandu Anda untuk menghubungkan model AI dari Alibaba Cloud Model Studio menggunakan **9Router** ke dalam project AI CLI Terminal. 9Router berfungsi sebagai smart router yang membantu menghemat penggunaan token hingga 40% (via fitur RTK) dan menawarkan integrasi berbagai provider AI.

## 1. Buat Akun & Login Alibaba Cloud Model Studio
1. Buka website [Alibaba Cloud Model Studio](https://modelstudio.console.alibabacloud.com).
2. Lakukan pendaftaran atau login menggunakan akun Alibaba Cloud Anda.
3. Setelah masuk, pastikan layanan Model Studio sudah aktif untuk workspace Anda.

## 2. Dapatkan API Key
1. Di dalam konsol Model Studio, navigasikan ke menu **API-KEY**.
2. Klik tombol untuk membuat API Key baru.
3. Salin API Key tersebut dan simpan di tempat yang aman.

## 3. Install 9Router
Buka terminal Anda dan instal 9Router secara global menggunakan npm:

```bash
npm install -g 9router
```

## 4. Konfigurasi 9Router
1. Jalankan dashboard 9Router dengan mengetikkan:
   ```bash
   9router
   ```
2. Browser akan otomatis membuka dashboard di `http://localhost:20128`.
3. Pada menu **Providers**, tambahkan provider baru untuk **Alibaba Cloud** (atau custom provider yang kompatibel) dan masukkan API Key Model Studio Anda yang telah disalin sebelumnya.
4. Anda dapat mengkonfigurasi fallback dan fitur hemat token (RTK Token Saver) sesuai kebutuhan di menu **Endpoint**.
5. Buka dashboard 9Router dan salin **API Key 9Router** milik Anda yang akan digunakan untuk disambungkan ke project.

## 5. Sambungkan ke Project Ini
Agar AI CLI menggunakan 9Router, sesuaikan pengaturan environment variables di project ini.

1. Buka file `.env` di root direktori project Anda.
2. Tambahkan atau ubah konfigurasi berikut:
   ```env
   # Endpoint API 9Router (default lokal)
   OPENAI_BASE_URL=http://localhost:20128/v1
   
   # Gunakan API Key yang didapat dari Dashboard 9Router (bukan langsung API key alibaba cloud)
   OPENAI_API_KEY=api_key_9router_anda
   
   # Tentukan nama model dari Model Studio (misalnya qwen-max, qwen-turbo, dll)
   OPENAI_MODEL=nama_model_yang_diinginkan
   ```
3. Selesai! Saat Anda menjalankan `npm run dev`, aplikasi CLI Anda sekarang akan menggunakan model dari Alibaba Cloud melalui 9Router dengan menggunakan format API yang kompatibel dengan standar OpenAI.
