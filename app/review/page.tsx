import MainLayout from '@/components/layout/MainLayout'

export default function ReviewPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">習慣レビュー</h1>
          <p className="mt-2 text-sm text-gray-700">
            月1回、習慣を見直して最適化しましょう
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">今月のレビュー</h2>
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">🔍</p>
              <p className="mb-4">習慣レビュー機能を実装予定</p>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">続ける / 見直す / やめる の選択</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">休止リスト管理</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">レビュー履歴</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}