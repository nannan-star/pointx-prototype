/** 实例 & 资源池 mock 数据 */

/** 实例详情页 · 绑定套餐展开明细（演示数据，按实例名索引） */
export interface BoundPackageDetail {
  name: string
  /** 标准 / 旗舰 — 对应设计稿标签色 */
  tier: 'standard' | 'premium'
  productType: string
  serviceNode: string
  coordSys: string
  mountPoint: string
  port: string
  maxOnline: string
  tsl: string
  compress: string
  dataSource: string
  remark: string
  updatedBy: string
  updatedAt: string
}

export const boundPackagesByInstance: Record<string, BoundPackageDetail[]> = {
  'SG-SI-001': [
    {
      name: '全球定位增强标准包',
      tier: 'standard',
      productType: 'SDK',
      serviceNode: 'SWAS地基',
      coordSys: 'CGCS2000',
      mountPoint: 'VS_GREC_MAIN',
      port: '7102',
      maxOnline: '5',
      tsl: '是',
      compress: '是',
      dataSource: '国家级 CORS；地基增强网络',
      remark: '实例列表演示绑定：标准地基增强能力',
      updatedBy: 'SuperAdmin',
      updatedAt: '2026-04-20 09:10:00',
    },
    {
      name: '星基融合旗舰包',
      tier: 'premium',
      productType: 'SDK',
      serviceNode: '星基融合节点',
      coordSys: 'CGCS2000',
      mountPoint: 'VS_SAT_MAIN',
      port: '7103',
      maxOnline: '20',
      tsl: '是',
      compress: '否',
      dataSource: '星基增强；地基融合',
      remark: '旗舰能力演示',
      updatedBy: 'SuperAdmin',
      updatedAt: '2026-04-21 11:00:00',
    },
  ],
  'SD-SI-001': [],
}

export interface Instance {
  name: string
  company: string
  packageNames: string[]
  owner: string
  createdAt: string
  secretVisible: boolean
  sik: string
  sis: string
  appKey: string
  appSecret: string
  deviceAutoStock: string
  activateMode: string
  accountPrefix: string
  resourceSharing: string
  serviceNodes: string[]
}

export interface ResourcePoolLine {
  enterpriseId: string
  company: string
  instance: string
  product: string
  spec: string
  /** 与实例绑定的服务节点（展示用） */
  serviceNodes: string[]
  /** 资源转发范围：列表角标「全球转发 / 区域限定」；未填视为区域限定 */
  forwardingScope?: 'global' | 'regional'
  isDefault: boolean
  total: number
  used: number
}

export interface PoolFilterState {
  company: string
  instance: string
  keyword: string
  hideEmpty: boolean
}

export interface PoolSummary {
  companyCount: number
  instanceCount: number
  lineCount: number
  total: number
  used: number
  unused: number
}

// --- Mock Data ---

export const instances: Instance[] = [
  { name: 'SG-SI-001', company: '新加坡智联科技有限公司', packageNames: ['全球定位增强标准包', '星基融合旗舰包'], owner: '卢楠楠', createdAt: '2026-04-22 09:20', secretVisible: false, sik: 'SIK-SG001-7f3a92c1d4e605b8', sis: 'SIS-SG001-b9014e8a2c7f301d', appKey: 'AKSGSI00101A2B3C4D5E6F708090A1B', appSecret: 'SKSGSI0019f8e7d6c5b4a39281f0e2d3c', deviceAutoStock: '是', activateMode: '设备SN绑定', accountPrefix: '', resourceSharing: '全球分发', serviceNodes: ['亚太', '欧洲'] },
  { name: 'SD-SI-001', company: '山东省智联测绘科技有限公司', packageNames: [], owner: '卢楠楠', createdAt: '2026-04-19 11:00', secretVisible: false, sik: 'SIK-SD101-fedcba9876543210', sis: 'SIS-SD101-0123456789abcdef', appKey: 'AKSDSI001AABBCCDDEEFF001122334455', appSecret: 'SKSDSI00166778899AABBCCDDEEFF0011', deviceAutoStock: '是', activateMode: '设备SN绑定', accountPrefix: 'cors_sd_', resourceSharing: '全球分发', serviceNodes: ['中国'] },
]

/** 与 `instances[].name` 对齐；资源池列表与实例详情页 enterpriseId 共用 */
export const resourcePools: ResourcePoolLine[] = [
  { enterpriseId: 'ENT-10001', company: '新加坡智联科技有限公司', instance: 'SG-SI-001', product: '定位增强服务', spec: 'SDK内置账号-连续计费-1月', serviceNodes: ['亚太', '欧洲'], forwardingScope: 'global', isDefault: true, total: 1000, used: 820 },
  { enterpriseId: 'ENT-10001', company: '新加坡智联科技有限公司', instance: 'SG-SI-001', product: '定位增强服务', spec: 'SDK内置账号-按次计费-1月', serviceNodes: ['亚太', '欧洲'], forwardingScope: 'global', isDefault: false, total: 500, used: 120 },
  { enterpriseId: 'ENT-10004', company: '山东省智联测绘科技有限公司', instance: 'SD-SI-001', product: '导航CGI-230SDK内置账号', spec: 'SDK内置账号-连续计费-1月', serviceNodes: ['中国'], forwardingScope: 'global', isDefault: true, total: 500, used: 0 },
  { enterpriseId: 'ENT-10005', company: '欧洲智联科技有限公司', instance: 'EU-SI-001', product: '定位增强服务', spec: 'SDK内置账号-连续计费-1月', serviceNodes: ['欧洲'], forwardingScope: 'regional', isDefault: true, total: 300, used: 60 },
]

// --- Helper functions ---

export function filterPoolLines(lines: ResourcePoolLine[], state: PoolFilterState): ResourcePoolLine[] {
  return lines.filter((line) => {
    if (state.company && line.company !== state.company) return false
    if (state.instance && line.instance !== state.instance) return false
    if (state.hideEmpty && !(line.total > 0 || line.used > 0)) return false
    if (!state.keyword.trim()) return true
    const haystack = [line.company, line.instance, line.product, line.spec, line.serviceNodes.join(' ')].join(' ').toLowerCase()
    return haystack.includes(state.keyword.trim().toLowerCase())
  })
}

export function summarizePoolLines(lines: ResourcePoolLine[]): PoolSummary {
  const companySet = new Set<string>()
  const instanceSet = new Set<string>()
  let total = 0
  let used = 0
  lines.forEach((line) => {
    if (line.company) companySet.add(line.company)
    if (line.instance) instanceSet.add(line.instance)
    total += line.total
    used += line.used
  })
  return {
    companyCount: companySet.size,
    instanceCount: instanceSet.size,
    lineCount: lines.length,
    total,
    used,
    unused: total - used,
  }
}
