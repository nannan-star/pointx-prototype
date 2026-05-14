import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { instances } from '@/data/instance-mock'
import { enterprises } from '@/data/admin-system-mock'

type TabKey = 'base' | 'res' | 'acct'

export default function EnterpriseDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState<TabKey>('base')

  const ent = enterprises.find(e => e.id === id)
  if (!ent) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">未找到企业</p>
        <Link to="/admin/enterprises" className="text-blue-600 hover:underline">返回列表</Link>
      </div>
    )
  }

  const relatedInstances = instances.filter(i => i.company === ent.name)

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'base', label: '基本信息' },
    { key: 'res', label: '资源概况' },
    { key: 'acct', label: '关联账号' },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-sm text-muted-foreground">
        <Link to="/admin/enterprises" className="text-blue-600 hover:underline">企业用户</Link>
        <span className="mx-1">/</span>
        <span>{ent.name}</span>
      </nav>

      <h1 className="text-xl font-semibold">{ent.name}</h1>

      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'base' && (
        <div className="rounded-lg border bg-white p-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '联系人', value: ent.contact },
              { label: '状态', value: ent.status },
              { label: '手机', value: ent.phone },
              { label: '邮箱', value: ent.email },
              { label: '所属行业', value: ent.industry || '—' },
              { label: '主账号', value: ent.account },
              { label: '备注', value: ent.remark || '-' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs text-muted-foreground">{f.label}</label>
                <div className="mt-0.5 text-sm">
                  {f.label === '状态' ? (
                    <Badge variant="outline" className={ent.status === '正常' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{f.value}</Badge>
                  ) : f.value}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">证照与证件影像：原型占位，生产见 PRD。</p>
        </div>
      )}

      {activeTab === 'res' && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-semibold mb-3">资源概况（演示）</h3>
          <p className="text-sm">关联实例数：<strong>{relatedInstances.length}</strong></p>
          <p className="text-xs text-muted-foreground mt-1">详见资源中心各模块。</p>
        </div>
      )}

      {activeTab === 'acct' && (
        <div className="border rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-medium">类型</th>
                <th className="text-left p-3 font-medium">账号</th>
                <th className="text-left p-3 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3">主账号 / 企业管理员</td>
                <td className="p-3">{ent.account}</td>
                <td className="p-3">一期仅主账号</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
