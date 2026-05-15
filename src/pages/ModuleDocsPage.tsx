import { BookOpen } from 'lucide-react'

const sections = [
  {
    title: '资源中心',
    items: [
      {
        title: 'SDK 资源',
        bullets: [
          '管理端视图：SDK 履约资源明细；注册码仅已激活账号具备，列表默认密文，请点击眼睛图标显示明文。',
          '大客户（租户端）视图：大客户视图不展示企业名称、实例名称；注册码仅已激活账号具备，列表默认遮挡，请点击眼睛图标查看完整码。',
        ],
      },
      {
        title: 'CORS 账号',
        bullets: [
          '管理端视图：CORS 外置账号资源明细；本页可开通 CORS 账号，并查看账号消耗情况。',
          '大客户（租户端）视图：外置 CORS 账号明细；大客户视图不展示企业名称列。',
        ],
      },
      {
        title: 'CORS 开通抽屉',
        bullets: [
          '大客户视角下企业选择固定为当前登录企业。',
          '数量字段：会查询该客户当前选中规格下面实际可用资源数量然后显示。',
          '演示规则：账号名将使用该客户在实例模块配置的帐号前缀自动生成。',
        ],
      },
      {
        title: '实例管理',
        bullets: ['实例创建后提示：建议尽快配置 SDK 服务套餐，便于资源池履约与开通。'],
      },
      {
        title: '实例详情',
        bullets: [
          '基本信息：包含企业、实例、履约参数。',
          '接入凭证：重置后旧密钥立即失效；明文仅在重置时展示一次。',
          '应用标识 AK：公钥，可用于客户端识别。',
          '应用密钥 SK：私钥，切勿泄露，仅重置时可见一次。',
          '实例标识 SIK：实例唯一标识，随实例同生命周期。',
          '实例密钥 SIS：实例签名密钥，服务端签名校验。',
          '空绑定套餐状态：暂无绑定套餐，可点击「+ 绑定套餐」在编辑实例中完成配置（演示）。',
          '解绑套餐：演示操作，未实际修改数据。',
        ],
      },
    ],
  },
  {
    title: '配置中心',
    items: [
      {
        title: '服务套餐',
        bullets: ['端口选择：选定后坐标系、挂载点、TLS 与压缩自动带出并置灰不可编辑。'],
      },
      {
        title: '服务节点',
        bullets: ['删除确认：节点被引用时，删除后相关套餐将失去关联。'],
      },
    ],
  },
  {
    title: '交易中心',
    items: [
      {
        title: '订单列表',
        bullets: ['交易中心：线下履约与资源池发起订单的汇总视图。'],
      },
      {
        title: '订单详情',
        bullets: ['超管侧仅展示订单信息（演示，不调用真实支付）。'],
      },
    ],
  },
  {
    title: '系统管理',
    items: [
      {
        title: '企业详情',
        bullets: [
          '证照与证件影像：原型占位，生产见 PRD。',
          '关联实例数：详见资源中心各模块。',
          '账号类型：一期仅主账号。',
        ],
      },
      {
        title: '管理端个人中心',
        bullets: [
          '登录密码：定期更换保障账户安全。',
          '修改密码：为保障账户安全，修改密码需验证身份。支持手机号或邮箱验证码校验。',
        ],
      },
    ],
  },
  {
    title: '租户端',
    items: [
      {
        title: '资源看板',
        bullets: ['企业资源总览：余量、区域激活与活跃趋势。'],
      },
      {
        title: '资源信息',
        bullets: [
          '企业资源池配置与各服务节点用量概览。',
          '敏感字段在生产环境需脱敏展示与审计。',
        ],
      },
      {
        title: '个人中心',
        bullets: [
          '登录密码：定期更换保障账户安全。',
          '法人身份证：上传法人身份证正反面，支持 JPG/PNG，不超过 5MB。',
          '修改密码：为保障账户安全，修改密码需验证身份。支持手机号或邮箱验证码校验。',
        ],
      },
    ],
  },
  {
    title: '公共组件',
    items: [
      {
        title: '组合筛选（SearchFilterBar）',
        bullets: ['多项同时填写时为「且」关系；点「筛选」后生效。'],
      },
      {
        title: '演示角色切换（DemoPersonaSwitcher）',
        bullets: [
          '可在下拉切换管理员 / 企业租户演示视角。',
          '演示：多客户角色切换。',
        ],
      },
    ],
  },
]

export default function ModuleDocsPage() {
  return (
    <div className="space-y-6 -m-6 min-h-full bg-[#f9f9f9] p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#ff7f32]/10">
          <BookOpen className="size-5 text-[#ff7f32]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#323232]">模块功能说明</h1>
          <p className="mt-0.5 text-sm text-[#969696]">
            各页面/模块的非功能性说明汇总
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]"
          >
            <div className="border-b border-[#e9ebec] px-5 py-3.5">
              <h2 className="text-sm font-semibold text-[#323232]">{section.title}</h2>
            </div>
            <div className="divide-y divide-[#e9ebec]">
              {section.items.map((item) => (
                <div key={item.title} className="px-5 py-4">
                  <h3 className="text-[13px] font-medium text-[#323232] mb-2">{item.title}</h3>
                  <ul className="space-y-1.5">
                    {item.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="text-[13px] text-[#646464] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#969696]"
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
