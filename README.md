# オタク年表メーカー

自分がハマってきたもの（作品・アイドル・趣味など）を年別に入力すると、1枚の年表画像を生成できるWebアプリです。生成した画像はX（旧Twitter）などでシェアできます。

詳細な仕様は [`docs/SPEC.md`](./docs/SPEC.md) を参照してください。

## 技術構成

- [React](https://react.dev/) + [Vite](https://vite.dev/)（TypeScript）
- [Tailwind CSS](https://tailwindcss.com/)
- データ保存は `localStorage` のみ（サーバー不要）
- Lintには [oxlint](https://oxc.rs/docs/guide/usage/linter.html) を使用

## セットアップ

```bash
npm install
npm run dev
```

`http://localhost:5173` で開発サーバーが起動します。

## コマンド一覧

| コマンド               | 内容                               |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | 開発サーバーを起動                 |
| `npm run build`        | 型チェック＋本番ビルド             |
| `npm run preview`      | ビルド結果をローカルでプレビュー   |
| `npm run lint`         | oxlintによる静的解析               |
| `npm run format`       | Prettierでコード整形               |
| `npm run format:check` | フォーマット崩れのチェック（CI用） |

## ディレクトリ構成

```
src/
  components/      共通UIコンポーネント（Headerなど）
  features/        機能単位のコンポーネント
    input-form/     入力フォーム（年カード一覧）
    preview/        年表画像プレビュー
  hooks/           カスタムフック（useLocalStorageなど）
  types/           型定義
  constants/       定数（色スウォッチ・上限値など）
  utils/           ユーティリティ関数
docs/
  SPEC.md          仕様書
```

## 現在の状況

仕様書のMVP要件（年ごとの入力フォーム、年表プレビュー描画、画像として保存／Xでシェア）は一通り実装済みです。テストコードの整備やデザインの細部の磨き込みは今後の課題です。

## デプロイ

`main`にpushされると、GitHub Actions（`.github/workflows/deploy.yml`）が自動でビルドしてGitHub Pagesにデプロイします。

- 公開URL: https://hacchi3412.github.io/otaku-nenpyou-maker/
- 初回のみ、リポジトリの Settings → Pages → Build and deployment → Source を **GitHub Actions** に設定してください

## License

[MIT](./LICENSE)
