export default function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 标签页骨架 */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 -mb-px">
          <div className="h-10 w-24 bg-gray-200 rounded-t"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-t"></div>
        </div>
      </div>

      {/* 订阅卡片骨架 */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              {/* 左侧：图标和信息 */}
              <div className="flex items-start gap-4 flex-1">
                {/* 图标骨架 */}
                <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0"></div>

                {/* 信息骨架 */}
                <div className="flex-1 space-y-3">
                  {/* 标题和状态徽章 */}
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-32 bg-gray-200 rounded"></div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                  </div>

                  {/* 有效期信息 */}
                  <div className="h-4 w-48 bg-gray-200 rounded"></div>

                  {/* 订阅 ID (小文本) */}
                  <div className="h-3 w-64 bg-gray-200 rounded"></div>
                </div>
              </div>

              {/* 右侧：价格和按钮 */}
              <div className="flex flex-col items-end gap-3 shrink-0">
                {/* 价格 */}
                <div className="text-right space-y-1">
                  <div className="h-6 w-24 bg-gray-200 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>

                {/* 按钮 */}
                <div className="h-9 w-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}