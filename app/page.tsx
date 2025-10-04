import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="text-center max-w-4xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          習慣化×タスク管理アプリ
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          タスク管理と習慣化を組み合わせ、前日夜にタスクを設定し、<br />
          翌朝に優先順位付きスケジュールが自動生成されるアプリケーション
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/auth/signup"
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
          >
            新規登録
          </Link>
          <Link
            href="/auth/login"
            className="bg-white hover:bg-gray-50 text-primary-600 border border-primary-600 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
          >
            ログイン
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl mb-4">📅</div>
            <h3 className="text-lg font-semibold mb-2">スケジュール自動生成</h3>
            <p className="text-gray-600">前日夜のタスク設定で翌朝最適なスケジュールを生成</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">優先度システム</h3>
            <p className="text-gray-600">重要度×緊急度で効率的なタスク管理</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-lg font-semibold mb-2">習慣の見える化</h3>
            <p className="text-gray-600">レベルアップシステムでモチベーション向上</p>
          </div>
        </div>
      </div>
    </main>
  )
}