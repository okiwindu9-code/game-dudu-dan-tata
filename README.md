# Dudu & Tata — Tangkap Buah 2.5D

Game 2.5D berbasis **React + Three.js + Tailwind CSS** bergaya ilustrasi *cel-shaded* berborder cokelat espresso, di mana pemain membantu **Dudu** dan **Tata** menangkap buah & makanan lezat yang jatuh dari langit.

## Fitur Utama
- **Karakter 2.5D Three.js Berborder**: Dudu & Tata dirakit secara prosedural dengan efek *inverted-hull outline* (`#432B1D`), animasi *squash-and-stretch*, kedipan mata, dan partikel 3D.
- **Homescreen Lengkap**: Pilih karakter (**Dudu** / **Tata**), pilih waktu in-game (**45 / 60 / 90 Detik**), **Panduan**, **Tukar Poin ke Rupiah (Rp)**, dan **Toko Belanja**.
- **Toko Belanja & Kustomisasi 3D**: Beli dan pasang langsung ke karakter maupun arena 3D (*Topi*, *Kacamata*, *Baju Polos*, *Karpet Pola*), serta booster **Kecepatan +35%** dan **Waktu 2x Lipat**.
- **Audio & Haptik Prosedural**: Musik latar marimba, efek suara kombo harmonis, dan getaran haptik (`navigator.vibrate`) tanpa ketergantungan file eksternal.

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
```

## Push ke GitHub & Deploy ke Vercel

1. **Push ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Dudu & Tata 2.5D game"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```
2. **Deploy di Vercel**:
   - Buka [vercel.com](https://vercel.com) → **Add New Project** → impor repositori GitHub Anda.
   - Framework preset **Vite** (`vercel.json` sudah tersedia dengan `buildCommand: npm run build` dan `outputDirectory: dist`).
   - Klik **Deploy**.
