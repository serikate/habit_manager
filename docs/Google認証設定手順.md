# Google OAuth認証 設定手順書

**作成日**: 2025-11-15
**対象**: 習慣化×タスク管理アプリ

---

## 概要

このドキュメントでは、Google OAuth認証を設定する手順を説明します。

## 前提条件

- Googleアカウントを持っていること
- Supabaseプロジェクトが作成済みであること

---

## Step 1: Google Cloud Consoleでの設定

### 1-1. Google Cloud Consoleにアクセス

1. https://console.cloud.google.com/ にアクセス
2. Googleアカウントでログイン

### 1-2. プロジェクトの作成

1. 画面上部の「プロジェクトを選択」をクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を入力（例: `Habit Task App`）
4. 「作成」をクリック

### 1-3. OAuth同意画面の設定

1. 左側のメニューから「APIとサービス」→「OAuth同意画面」を選択
2. **ユーザータイプ**: 「外部」を選択 → 「作成」をクリック
3. **アプリ情報**を入力:
   - アプリ名: `習慣化×タスク管理アプリ`（または任意の名前）
   - ユーザーサポートメール: あなたのメールアドレス
   - デベロッパーの連絡先情報: あなたのメールアドレス
4. 「保存して次へ」をクリック
5. **スコープ**: そのまま「保存して次へ」
6. **テストユーザー**:
   - 開発中は「+ ADD USERS」でテスト用のGoogleアカウントを追加
   - あなた自身のメールアドレスを追加
7. 「保存して次へ」→「ダッシュボードに戻る」

### 1-4. 認証情報（OAuth 2.0クライアントID）の作成

1. 左側のメニューから「APIとサービス」→「認証情報」を選択
2. 「+ 認証情報を作成」→「OAuth 2.0 クライアントID」を選択
3. **アプリケーションの種類**: 「ウェブアプリケーション」を選択
4. **名前**: `Habit Task App Web Client`（任意）
5. **承認済みのJavaScript生成元**:
   - `http://localhost:3001`（開発環境）
6. **承認済みのリダイレクトURI**: ⚠️ **重要**

   以下の2つを追加してください:

   ```
   http://localhost:3001/auth/callback
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

   ※ `<your-project-ref>`はSupabaseプロジェクトのURLに含まれる部分です
   （例: `https://abcdefghijklmnop.supabase.co` の場合、`abcdefghijklmnop`）

7. 「作成」をクリック

### 1-5. クライアントIDとシークレットをコピー

作成後に表示されるダイアログから:
- **クライアントID**: コピーして保存（例: `123456789-abc...apps.googleusercontent.com`）
- **クライアントシークレット**: コピーして保存（例: `GOCSPX-abc...`）

⚠️ これらは後で使用するので、安全な場所にメモしておいてください。

---

## Step 2: Supabaseダッシュボードでの設定

### 2-1. Supabaseダッシュボードにアクセス

1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択

### 2-2. Google Providerの有効化

1. 左側のメニューから「Authentication」を選択
2. 「Providers」タブをクリック
3. プロバイダー一覧から「Google」を探してクリック

### 2-3. Google認証情報を設定

1. **Enable Sign in with Google**: トグルをON（緑色）にする
2. **Client ID (for OAuth)**: Google Cloud ConsoleでコピーしたクライアントIDを貼り付け
3. **Client Secret (for OAuth)**: Google Cloud Consoleでコピーしたクライアントシークレットを貼り付け
4. 「Save」をクリック

### 2-4. Callback URLの確認

画面に表示されている「Callback URL (for OAuth)」をコピーします:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

このURLが、Google Cloud Consoleの「承認済みのリダイレクトURI」に追加されていることを確認してください。

---

## Step 3: フロントエンドコードの確認

すでに実装済みですが、以下のファイルが正しく設定されているか確認してください。

### 3-1. AuthFormコンポーネント

`components/auth/AuthForm.tsx` に以下が実装されています:
- ✅ Googleログインボタン
- ✅ `handleGoogleSignIn` 関数
- ✅ OAuth リダイレクト処理

### 3-2. 認証コールバックルート

`app/auth/callback/route.ts` が作成されています:
- ✅ 認証コードをセッションに交換
- ✅ ダッシュボードへリダイレクト

---

## Step 4: 動作確認

### 4-1. 開発サーバーの起動

```bash
cd "C:\Users\Owner\Desktop\習慣化×タスク管理アプリ開発\habit-task-app"
npm run dev
```

### 4-2. ログインページにアクセス

ブラウザで以下のURLにアクセス:
```
http://localhost:3001/auth/login
```

### 4-3. Googleログインのテスト

1. 「Googleでログイン」ボタンをクリック
2. Googleのログイン画面が表示される
3. テストユーザーとして登録したGoogleアカウントでログイン
4. 権限の確認画面で「許可」をクリック
5. ダッシュボード (`/dashboard`) にリダイレクトされる

### 4-4. トラブルシューティング

**エラー: 「redirect_uri_mismatch」**
- Google Cloud Consoleの「承認済みのリダイレクトURI」に以下が正しく追加されているか確認:
  - `http://localhost:3001/auth/callback`
  - `https://<your-project-ref>.supabase.co/auth/v1/callback`

**エラー: 「Access blocked: This app's request is invalid」**
- OAuth同意画面が正しく設定されているか確認
- テストユーザーにあなたのGoogleアカウントが追加されているか確認

**ログイン後にエラーが出る**
- Supabaseの設定で「Client ID」と「Client Secret」が正しく入力されているか確認
- ブラウザのコンソールでエラーメッセージを確認

---

## Step 5: 本番環境への移行（将来）

### 5-1. OAuth同意画面の公開

開発中は「テスト」モードですが、本番公開時には:

1. Google Cloud Consoleの「OAuth同意画面」
2. 「アプリを公開」をクリック
3. Googleの審査を受ける（通常数日〜数週間）

### 5-2. 本番URLの追加

本番環境のURLを追加:

**Google Cloud Console**:
- 承認済みのJavaScript生成元: `https://your-production-domain.com`
- 承認済みのリダイレクトURI: `https://your-production-domain.com/auth/callback`

**Supabase**: 特に変更不要（既にCallback URLが設定済み）

---

## まとめ

以下の手順でGoogle OAuth認証が完了します:

1. ✅ Google Cloud Consoleでプロジェクト・OAuth認証情報を作成
2. ✅ SupabaseダッシュボードでGoogle Providerを有効化
3. ✅ フロントエンドにGoogleログインボタンを実装（完了済み）
4. ✅ 動作確認

## 参考リンク

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Next.js + Supabase Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

**完**

設定手順書 バージョン 1.0
2025-11-15
