import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FieldStandardRow = {
  /** 与界面 Label 一致 */
  field: string
  /** 是 / 否 / 条件必填（+ 条件说明） */
  required: string
  /** 校验、长度、格式、默认值、只读 */
  rules: string
  /** 枚举、接口、mock、计算字段 */
  dataSource: string
  /** 演示口径、新建/编辑差异、后续迭代 */
  notes: string
}

type ModuleDocsItem = {
  title: string
  bullets: string[]
  fieldStandards?: FieldStandardRow[]
}

type ModuleDocsSection = {
  title: string
  items: ModuleDocsItem[]
}

/** 与 AdminLayout.navEntries 分组顺序、组内子项顺序一致（不含「模块说明」自身） */
const ADMIN_SECTION_ORDER = [
  '资源中心',
  '交易中心',
  '配置中心',
  '系统管理',
  '个人中心',
  '公共组件',
] as const

const ADMIN_ITEM_ORDER: Record<(typeof ADMIN_SECTION_ORDER)[number], string[]> = {
  资源中心: ['实例', '资源池', 'SDK 资源', 'CORS 账号', 'CORS 开通抽屉', '实例详情'],
  交易中心: ['订单列表', '订单详情'],
  配置中心: ['服务节点', '服务套餐', '商品', '商品规格'],
  系统管理: ['企业用户', '管理用户', '角色权限', '菜单管理', '字典管理'],
  个人中心: ['账号与安全'],
  公共组件: ['组合筛选（SearchFilterBar）', '演示角色切换（DemoPersonaSwitcher）'],
}

/** 与 ClientLayout.navEntries 顺序一致：资源看板 → 资源中心子项 → 交易中心子项 → 个人信息；公共组件置底 */
const CLIENT_DOC_SECTION_ORDER = ['资源看板', '资源中心', '交易中心', '个人信息', '公共组件'] as const

const sections: ModuleDocsSection[] = [
  {
    title: '资源中心',
    items: [
      {
        title: '实例',
        fieldStandards: [
          {
            field: '企业名称',
            required: '是',
            rules: '请选择企业',
            dataSource: '下拉选项，企业下拉列表',
            notes: '已创建实例的企业过滤掉；多实例后策略另述。',
          },
          {
            field: '实例名称',
            required: '是',
            rules: '请输入2～50 个字符',
            dataSource: '文本输入框',
            notes: '',
          },
          {
            field: '资源共享情况',
            required: '是',
            rules: '请选择资源',
            dataSource: '下拉选项，枚举：全球分发、区域限定',
            notes: '',
          },
          {
            field: '服务节点',
            required: '是',
            rules: '请选择',
            dataSource: '多选下拉，枚举，中国、亚太、南美、日本、北美、欧洲、土耳其',
            notes: '与抽屉内 SERVICE_NODES 一致；当前原型提交未强制校验至少一项。',
          },
          {
            field: '设备自动入库',
            required: '是',
            rules: '请选择服务节点，默认值「是」。',
            dataSource: '下拉选项，枚举：是、否',
            notes: '',
          },
          {
            field: '激活方式',
            required: '是',
            rules: '须选择一项',
            dataSource: '枚举：设备 SN 绑定、手动激活、在线激活',
            notes: '',
          },
          {
            field: '账号前缀',
            required: '否',
            rules: '请输入4位小写字母',
            dataSource: '文本输入框',
            notes: '',
          },
        ],
        bullets: ['实例创建后提示：建议尽快配置 SDK 服务套餐，便于资源池履约与开通。'],
      },
      {
        title: '资源池',
        bullets: [
          '管理端：按企业聚合查看资源池履约行；支持新套餐下单、续费与开发联调配置（演示）。',
        ],
      },
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
          '大客户视角下企业选择固定为当前登录企业。',
          '数量字段：会查询该客户当前选中规格下面实际可用资源数量然后显示。',
          '演示规则：账号名将使用该客户在实例模块配置的帐号前缀自动生成。',
        ],
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
        title: '对账管理',
        bullets: ['租户端：对账列表与明细查看（演示，不接入真实账务）。'],
      },
      {
        title: '订单详情',
        bullets: ['超管侧仅展示订单信息（演示，不调用真实支付）。'],
      },
    ],
  },
  {
    title: '配置中心',
    items: [
      {
        title: '服务节点',
        bullets: ['删除确认：节点被引用时，删除后相关套餐将失去关联。'],
      },
      {
        title: '服务套餐',
        bullets: ['端口选择：选定后坐标系、挂载点、TLS 与压缩自动带出并置灰不可编辑。'],
      },
      {
        title: '商品',
        bullets: ['管理端：商品主数据维护（演示）；与套餐、规格联动见配置中心相关页。'],
      },
      {
        title: '商品规格',
        bullets: ['管理端：规格维度与价格等配置（演示）；下单与资源池流程中引用规格信息。'],
      },
    ],
  },
  {
    title: '系统管理',
    items: [
      {
        title: '企业用户',
        bullets: [
          '证照与证件影像：原型占位，生产见 PRD。',
          '关联实例数：详见资源中心各模块。',
          '账号类型：一期仅主账号。',
        ],
      },
      {
        title: '管理用户',
        bullets: ['管理端：管理员账号列表与维护（演示）；权限与角色见「角色权限」。'],
      },
      {
        title: '角色权限',
        bullets: ['管理端：角色与权限点配置（演示）；与菜单可见性配合使用。'],
      },
      {
        title: '菜单管理',
        bullets: ['管理端：控制台菜单树维护（演示）；影响侧栏与路由入口展示。'],
      },
      {
        title: '字典管理',
        bullets: ['管理端：数据字典项维护（演示）；供表单与筛选等下拉枚举引用。'],
      },
    ],
  },
  {
    title: '个人中心',
    items: [
      {
        title: '账号与安全',
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

function sectionsByTitle(list: ModuleDocsSection[]): Map<string, ModuleDocsSection> {
  return new Map(list.map((s) => [s.title, s]))
}

/** 仅保留 order 中列出的子项，顺序与 order 一致（用于与侧栏严格对齐） */
function orderItemsExclusive(section: ModuleDocsSection, order: string[]): ModuleDocsSection {
  const map = new Map(section.items.map((i) => [i.title, i]))
  return {
    ...section,
    items: order.map((t) => map.get(t)).filter((x): x is ModuleDocsItem => x != null),
  }
}

function buildAdminSections(): ModuleDocsSection[] {
  const by = sectionsByTitle(sections)
  return ADMIN_SECTION_ORDER.map((title) => {
    const s = by.get(title)
    if (!s) return null
    const ord = ADMIN_ITEM_ORDER[title]
    return ord ? orderItemsExclusive(s, ord) : s
  }).filter((x): x is ModuleDocsSection => x != null)
}

function buildClientSections(): ModuleDocsSection[] {
  const by = sectionsByTitle(sections)
  const tenant = by.get('租户端')
  const res = by.get('资源中心')
  const trade = by.get('交易中心')
  const common = by.get('公共组件')

  const out: ModuleDocsSection[] = []
  for (const title of CLIENT_DOC_SECTION_ORDER) {
    if (title === '资源看板') {
      const dashItem = tenant?.items.find((i) => i.title === '资源看板')
      if (dashItem) out.push({ title: '资源看板', items: [dashItem] })
    } else if (title === '资源中心') {
      const resourceInfo = tenant?.items.find((i) => i.title === '资源信息')
      const tail = res ? orderItemsExclusive(res, ['SDK 资源', 'CORS 账号', 'CORS 开通抽屉']).items : []
      const items = resourceInfo ? [resourceInfo, ...tail] : tail
      if (items.length) out.push({ title: '资源中心', items })
    } else if (title === '交易中心') {
      if (trade) out.push(orderItemsExclusive(trade, ['订单列表', '对账管理']))
    } else if (title === '个人信息') {
      const profile = tenant?.items.find((i) => i.title === '个人中心')
      if (profile) {
        out.push({
          title: '个人信息',
          items: [{ title: '个人信息', bullets: profile.bullets }],
        })
      }
    } else if (title === '公共组件' && common) {
      out.push(orderItemsExclusive(common, ADMIN_ITEM_ORDER['公共组件']))
    }
  }
  return out
}

function fnv1aHex(input: string): string {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

function docSectionAnchorId(sectionTitle: string): string {
  return `doc-sec-${fnv1aHex(sectionTitle)}`
}

function docItemAnchorId(sectionTitle: string, itemTitle: string): string {
  return `doc-mod-${fnv1aHex(`${sectionTitle}\0${itemTitle}`)}`
}

/** 管理端 / 租户端：分组与子项顺序与对应 Layout 侧栏一致 */
function sectionsForView(isAdminView: boolean): ModuleDocsSection[] {
  return isAdminView ? buildAdminSections() : buildClientSections()
}

function FieldStandardsTable({ rows }: { rows: FieldStandardRow[] }) {
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full min-w-[760px] border-collapse border border-[#e9ebec] text-[13px] text-[#646464]">
        <thead>
          <tr className="bg-[#f9f9f9]">
            <th className="min-w-[168px] w-[22%] border border-[#e9ebec] px-3 py-2 text-left font-semibold text-[#323232]">
              字段
            </th>
            <th className="min-w-[104px] w-[12%] border border-[#e9ebec] px-3 py-2 text-left font-semibold text-[#323232]">
              必填
            </th>
            <th className="border border-[#e9ebec] px-2.5 py-2 text-left font-semibold text-[#323232]">
              规则与说明
            </th>
            <th className="border border-[#e9ebec] px-2.5 py-2 text-left font-semibold text-[#323232]">
              数据/选项来源
            </th>
            <th className="border border-[#e9ebec] px-2.5 py-2 text-left font-semibold text-[#323232]">
              备注
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="min-w-[168px] w-[22%] border border-[#e9ebec] px-3 py-2 align-top text-[#323232]">
                {row.field}
              </td>
              <td className="min-w-[104px] w-[12%] border border-[#e9ebec] px-3 py-2 align-top">
                {row.required}
              </td>
              <td className="border border-[#e9ebec] px-2.5 py-2 align-top">{row.rules}</td>
              <td className="border border-[#e9ebec] px-2.5 py-2 align-top">{row.dataSource}</td>
              <td className="border border-[#e9ebec] px-2.5 py-2 align-top">{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ModuleDocsPage() {
  const { pathname } = useLocation()
  const isAdminView = pathname.startsWith('/admin')
  const filteredSections = useMemo(() => sectionsForView(isAdminView), [isAdminView])

  const itemAnchorIds = useMemo(
    () =>
      filteredSections.flatMap((section) =>
        section.items.map((item) => docItemAnchorId(section.title, item.title)),
      ),
    [filteredSections],
  )

  const [activeItemId, setActiveItemId] = useState<string>(() => itemAnchorIds[0] ?? '')

  useEffect(() => {
    setActiveItemId((prev) => (itemAnchorIds.includes(prev) ? prev : itemAnchorIds[0] ?? ''))
  }, [itemAnchorIds])

  const bodyScrollRef = useRef<HTMLDivElement | null>(null)

  const scrollToAnchor = useCallback((id: string) => {
    const el = document.getElementById(id)
    const root = bodyScrollRef.current
    if (!el || !root) return
    const pad = 8
    const nextTop =
      el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - pad
    root.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (itemAnchorIds.length === 0) return

    const rafOnScroll = () => {
      requestAnimationFrame(updateActiveFromScroll)
    }

    function updateActiveFromScroll() {
      const scrollRoot = bodyScrollRef.current
      if (!scrollRoot) return
      const rootTop = scrollRoot.getBoundingClientRect().top
      const line = rootTop + 20
      let bestId: string | null = null
      let bestTop = -Infinity
      for (const id of itemAnchorIds) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top <= line && top > bestTop) {
          bestTop = top
          bestId = id
        }
      }
      if (bestId) {
        setActiveItemId(bestId)
        return
      }
      const firstId = itemAnchorIds[0]
      const firstEl = firstId ? document.getElementById(firstId) : null
      if (firstId && firstEl && firstEl.getBoundingClientRect().top > line) {
        setActiveItemId(firstId)
        return
      }
      const lastId = itemAnchorIds[itemAnchorIds.length - 1]
      if (lastId) setActiveItemId(lastId)
    }

    const t0 = window.setTimeout(() => {
      const root = bodyScrollRef.current
      if (!root) return
      root.addEventListener('scroll', rafOnScroll, { passive: true })
      updateActiveFromScroll()
    }, 0)

    return () => {
      window.clearTimeout(t0)
      bodyScrollRef.current?.removeEventListener('scroll', rafOnScroll)
    }
  }, [itemAnchorIds])

  return (
    <div className="flex min-h-0 flex-1 flex-col -m-6 bg-[#f9f9f9]">
      <div className="shrink-0 px-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#ff7f32]/10">
            <BookOpen className="size-5 text-[#ff7f32]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#323232]">需求文档说明</h1>
            <p className="mt-0.5 text-sm text-[#969696]">
              {isAdminView
                ? '管理端各页面/模块的非功能性说明汇总'
                : '租户端各页面/模块的非功能性说明汇总'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 pb-6 pt-6 lg:flex-row lg:gap-8">
        <div
          ref={bodyScrollRef}
          className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain"
        >
          {filteredSections.map((section) => (
            <div
              key={section.title}
              id={docSectionAnchorId(section.title)}
              className="scroll-mt-6 rounded-lg border border-[#e9ebec] bg-white shadow-[2px_2px_8px_-2px_rgba(0,0,0,0.05)]"
            >
              <div className="border-b border-[#e9ebec] px-5 py-3.5">
                <h2 className="text-sm font-semibold text-[#323232]">{section.title}</h2>
              </div>
              <div className="divide-y divide-[#e9ebec]">
                {section.items.map((item) => {
                  const itemId = docItemAnchorId(section.title, item.title)
                  return (
                    <div key={item.title} id={itemId} className="scroll-mt-6 px-5 py-4">
                      <h3 className="text-[13px] font-medium text-[#323232] mb-2">{item.title}</h3>
                      {item.fieldStandards?.length ? (
                        <FieldStandardsTable rows={item.fieldStandards} />
                      ) : null}
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
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <aside className="hidden shrink-0 lg:block lg:w-[220px] lg:self-start xl:w-[240px]">
          <nav
            aria-label="本页导读"
            className="max-h-[calc(100vh-7.5rem)] overflow-y-auto border-l border-[#e9ebec] pl-5"
          >
            <p className="text-[13px] font-semibold text-[#323232]">本页导读</p>
            <ul className="mt-3 space-y-4">
              {filteredSections.map((section) => {
                const sectionAnyActive = section.items.some(
                  (item) => docItemAnchorId(section.title, item.title) === activeItemId,
                )
                return (
                  <li key={section.title}>
                    <button
                      type="button"
                      onClick={() => scrollToAnchor(docSectionAnchorId(section.title))}
                      className={cn(
                        'flex w-full cursor-pointer items-start gap-2 rounded-sm text-left text-[13px] leading-snug transition-colors',
                        sectionAnyActive ? 'font-medium text-[#2563eb]' : 'text-[#323232] hover:text-[#2563eb]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 size-1.5 shrink-0 rounded-full border',
                          sectionAnyActive
                            ? 'border-[#2563eb] bg-[#2563eb]'
                            : 'border-[#c8c8c8] bg-transparent',
                        )}
                        aria-hidden
                      />
                      <span>{section.title}</span>
                    </button>
                    <ul className="mt-2 space-y-1.5 border-l border-[#ececec] pl-3 ml-[5px]">
                      {section.items.map((item) => {
                        const id = docItemAnchorId(section.title, item.title)
                        const active = id === activeItemId
                        return (
                          <li key={item.title}>
                            <button
                              type="button"
                              onClick={() => scrollToAnchor(id)}
                              className={cn(
                                'block w-full cursor-pointer rounded-sm py-0.5 text-left text-[12px] leading-snug transition-colors',
                                active
                                  ? 'font-medium text-[#2563eb]'
                                  : 'text-[#969696] hover:text-[#323232]',
                              )}
                            >
                              {item.title}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  )
}
