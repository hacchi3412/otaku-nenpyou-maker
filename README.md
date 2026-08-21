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

リポジトリの初期セットアップ段階です。プロジェクト構成・Tailwind導入・レスポンシブレイアウトの土台（PC：左右並び／スマホ：タブ切り替え）・データ型・localStorage連携用フックまでを用意しています。年カードの入力UI、年表画像の描画、画像保存／Xシェア機能は今後実装します。
