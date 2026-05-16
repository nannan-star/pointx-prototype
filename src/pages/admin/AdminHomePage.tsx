import { Link } from 'react-router-dom'

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-[#1a1a1a]">首页</h1>
      <p className="mt-1 text-sm text-[#64748b]">
        需求概要 · 超管默认首页；以下为演示主链路入口。
      </p>

      {/* 主链路快捷入口 */}
      <div className="mt-6 rounded-lg border border-[#e9ebec] bg-white px-5 py-4">
        <p className="text-sm font-semibold text-[#323232]">主链路快捷入口</p>
        <p className="mb-5 mt-1 text-[13px] leading-relaxed text-[#64748b]">
          按角色拆分主链路；按钮顺序与步骤一致。「新增」交互统一为
          <strong className="font-semibold text-[#323232]">右侧抽屉</strong>。
        </p>

        <div className="space-y-5">
          {/* 商务管理员 */}
          <div>
            <p className="mb-1 text-xs font-semibold text-[#64748b]">商务管理员</p>
            <p className="mb-3 text-[13px] leading-relaxed text-[#64748b]">
              创建企业用户 → 创建实例 SI → 配置 SDK
              服务套餐 → 资源池下单履约 → 资源中心查看 SDK / CORS
              明细（<strong className="text-[#323232]">SDK 资源</strong>与
              <strong className="text-[#323232]">CORS 账号</strong>列表均可
              <strong className="text-[#323232]">开通账号</strong>）
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/enterprises"
                className="inline-flex items-center rounded-md bg-[#ff7f32] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#e8712d]"
              >
                企业用户
              </Link>
              <Link
                to="/admin/instances"
                className="inline-flex items-center rounded-md border border-[#e9ebec] bg-white px-3 py-1.5 text-sm text-[#323232] transition-colors hover:bg-[#f5f5f5]"
              >
                实例 SI
              </Link>
              <Link
                to="/admin/instances"
                className="inline-flex items-center rounded-md border border-[#e9ebec] bg-white px-3 py-1.5 text-sm text-[#323232] transition-colors hover:bg-[#f5f5f5]"
              >
                SDK 服务套餐
              </Link>
              <Link
                to="/admin/pool"
                className="inline-flex items-center rounded-md border border-[#e9ebec] bg-white px-3 py-1.5 text-sm text-[#323232] transition-colors hover:bg-[#f5f5f5]"
              >
                资源池下单履约
              </Link>
              <Link
                to="/admin/resources/sdk"
                className="inline-flex items-center rounded-md border border-[#e9ebec] bg-white px-3 py-1.5 text-sm text-[#323232] transition-colors hover:bg-[#f5f5f5]"
              >
                SDK 资源
              </Link>
              <Link
                to="/admin/resources/cors"
                className="inline-flex items-center rounded-md border border-[#e9ebec] bg-white px-3 py-1.5 text-sm text-[#323232] transition-colors hover:bg-[#f5f5f5]"
              >
                CORS 账号
              </Link>
            </div>
          </div>

          {/* 超级管理员 */}
          <div>
            <p className="mb-1 text-xs font-semibold text-[#64748b]">超级管理员</p>
            <p className="mb-3 text-[13px] leading-relaxed text-[#64748b]">
              配置中心：在<strong className="text-[#323232]">商品</strong>页配置 SDK
              商品 / 外置帐号商品（需选择
              <strong className="text-[#323232]">节点</strong>与
              <strong className="text-[#323232]">对应商品类型</strong>）→ 配置
              <strong className="text-[#323232]">商品规格</strong> → 配置
              <strong className="text-[#323232]">服务节点</strong>及
              <strong className="text-[#323232]">服务套餐</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/products"
                className="inline-flex items-center rounded-md bg-[#ff7f32] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#e8712d]"
              >
                商品
              </Link>
              <Link
                to="/admin/specs"
                className="inline-flex items-center rounded-md border border-[#e9ebec] bg-white px-3 py-1.5 text-sm text-[#323232] transition-colors hover:bg-[#f5f5f5]"
              >
                商品规格
              </Link>
              <Link
                to="/admin/config/nodes"
                className="inline-flex items-center rounded-md border border-[#e9ebec] bg-white px-3 py-1.5 text-sm text-[#323232] transition-colors hover:bg-[#f5f5f5]"
              >
                服务节点
              </Link>
              <Link
                to="/admin/config/packages"
                className="inline-flex items-center rounded-md border border-[#e9ebec] bg-white px-3 py-1.5 text-sm text-[#323232] transition-colors hover:bg-[#f5f5f5]"
              >
                服务套餐
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
