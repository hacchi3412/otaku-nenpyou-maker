import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages（プロジェクトサイト）はリポジトリ名のサブパス配下で配信されるため、
  // ビルド時のみbaseを合わせる（開発サーバーはルートのままにしておく）
  base: command === 'build' ? '/otaku-nenpyou-maker/' : '/',
  plugins: [react(), tailwindcss()],
}))
