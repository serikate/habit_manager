import MainLayout from '@/components/layout/MainLayout'

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">設定</h1>
          <p className="mt-2 text-sm text-gray-700">
            アプリの設定をカスタマイズできます
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">作業時間上限設定</h2>
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-48 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">⏰</p>
                <p>曜日別時間上限設定を実装予定</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">通知設定</h2>
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-48 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">🔔</p>
                <p>Web Push通知設定を実装予定</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">称号モード</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">表示モード</span>
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="business">ビジネスモード</option>
                  <option value="light">ライトモード</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">
                ビジネスモード: シンプルで成長志向の称号<br />
                ライトモード: 遊び心のある日本語の称号
              </p>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">テーマ設定</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">テーマ</span>
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="light">ライト</option>
                  <option value="dark">ダーク</option>
                  <option value="system">システム設定に従う</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">
                ダークモード対応は今後実装予定
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}