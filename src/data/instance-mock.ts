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
  'EU-SI-009': [
    {
      name: '星基融合旗舰包',
      tier: 'premium',
      productType: 'SDK',
      serviceNode: '欧洲地基节点',
      coordSys: 'ETRS89',
      mountPoint: 'EU_GREC_MAIN',
      port: '7102',
      maxOnline: '10',
      tsl: '是',
      compress: '是',
      dataSource: '欧洲 CORS 网络',
      remark: 'EU 演示绑定',
      updatedBy: '周航',
      updatedAt: '2026-04-21 16:20:00',
    },
  ],
  'SD-SI-001': [
    {
      name: '全球定位增强标准包',
      tier: 'standard',
      productType: 'SDK',
      serviceNode: '华北地基',
      coordSys: 'CGCS2000',
      mountPoint: 'SD_GREC_MAIN',
      port: '7102',
      maxOnline: '8',
      tsl: '否',
      compress: '是',
      dataSource: '省级 CORS',
      remark: 'SD 演示',
      updatedBy: '卢楠楠',
      updatedAt: '2026-04-19 14:00:00',
    },
  ],
  'SD-SI-002': [
    {
      name: '星基融合旗舰包',
      tier: 'premium',
      productType: 'SDK',
      serviceNode: '全国融合节点',
      coordSys: 'CGCS2000',
      mountPoint: 'CN_SAT_MAIN',
      port: '7103',
      maxOnline: '50',
      tsl: '是',
      compress: '是',
      dataSource: '星基 + 地基',
      remark: '大批量授权演示',
      updatedBy: '周航',
      updatedAt: '2026-04-18 10:35:00',
    },
  ],
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
}

export interface ResourcePoolLine {
  enterpriseId: string
  company: string
  instance: string
  product: string
  spec: string
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
  { name: 'SG-SI-001', company: '新加坡智联科技有限公司', packageNames: ['全球定位增强标准包', '星基融合旗舰包'], owner: '卢楠楠', createdAt: '2026-04-22 09:20', secretVisible: false, sik: 'SIK-SG001-7f3a92c1d4e605b8', sis: 'SIS-SG001-b9014e8a2c7f301d', appKey: 'AKSGSI00101A2B3C4D5E6F708090A1B', appSecret: 'SKSGSI0019f8e7d6c5b4a39281f0e2d3c', deviceAutoStock: '是', activateMode: '设备SN绑定', accountPrefix: '' },
  { name: 'US-SI-DRAFT', company: '新加坡智联科技有限公司', packageNames: [], owner: '卢楠楠', createdAt: '2026-04-28 10:15', secretVisible: false, sik: 'SIK-USDRAFT-pending000001', sis: 'SIS-USDRAFT-pending000002', appKey: 'AKUSDRAFT000102030405060708090A', appSecret: 'SKUSDRAFT00112233445566778899AA', deviceAutoStock: '是', activateMode: '手动激活', accountPrefix: '' },
  { name: 'EU-SI-009', company: '欧洲智联科技有限公司', packageNames: ['星基融合旗舰包'], owner: '周航', createdAt: '2026-04-21 15:10', secretVisible: false, sik: 'SIK-EU009-a1b2c3d4e5f60789', sis: 'SIS-EU009-0a1b2c3d4e5f6789', appKey: 'AKEUSI00911223344556677889900AB', appSecret: 'SKEUSI009ccddeeff0011223344556677', deviceAutoStock: '是', activateMode: '设备SN绑定', accountPrefix: 'cors_eu_' },
  { name: 'SD-SI-001', company: '山东省智联测绘科技有限公司', packageNames: ['全球定位增强标准包'], owner: '卢楠楠', createdAt: '2026-04-19 11:00', secretVisible: false, sik: 'SIK-SD101-fedcba9876543210', sis: 'SIS-SD101-0123456789abcdef', appKey: 'AKSDSI001AABBCCDDEEFF001122334455', appSecret: 'SKSDSI00166778899AABBCCDDEEFF0011', deviceAutoStock: '是', activateMode: '设备SN绑定', accountPrefix: 'cors_sd_' },
  { name: 'SD-SI-002', company: '山东省智联测绘科技有限公司', packageNames: ['星基融合旗舰包'], owner: '周航', createdAt: '2026-04-18 10:30', secretVisible: false, sik: 'SIK-SD102-9988776655443322', sis: 'SIS-SD102-1100FFEEDDCCBBAA', appKey: 'AKSDSI0025060708090A0B0C0D0E0F1011', appSecret: 'SKSDSI00212131415161718191A1B1C1D', deviceAutoStock: '否', activateMode: '在线激活', accountPrefix: '' },
]

export const resourcePools: ResourcePoolLine[] = [
  // 上海盛路信息技术有限公司 (EU-IS-ADM) — 4 个商品, 3/4 已配置
  { enterpriseId: 'EU-IS-ADM', company: '上海盛路信息技术有限公司', instance: 'EU-IS-ADM', product: '企业服务 EU 款-100次-CS地基', spec: 'CORS · 单频', isDefault: true, total: 100, used: 45 },
  { enterpriseId: 'EU-IS-ADM', company: '上海盛路信息技术有限公司', instance: 'EU-IS-ADM', product: '专用 CS-200SDK 10次包', spec: 'GNSS · 差分网', isDefault: false, total: 200, used: 32 },
  { enterpriseId: 'EU-IS-ADM', company: '上海盛路信息技术有限公司', instance: 'EU-IS-ADM', product: '地基增强包接入组件', spec: 'RTCM · 增强', isDefault: false, total: 150, used: 85 },
  { enterpriseId: 'EU-IS-ADM', company: '上海盛路信息技术有限公司', instance: 'EU-IS-ADM', product: '高精度定位组件 v2', spec: 'RTK · 高精度', isDefault: false, total: 80, used: 18 },
  // 深圳北斗精测科技有限公司 (EU-BD-001) — 2 个商品, 已配置
  { enterpriseId: 'EU-BD-001', company: '深圳北斗精测科技有限公司', instance: 'EU-BD-001', product: '北斗差分定位标准服务', spec: 'BDS · 差分', isDefault: true, total: 300, used: 210 },
  { enterpriseId: 'EU-BD-001', company: '深圳北斗精测科技有限公司', instance: 'EU-BD-001', product: '地基增强接入包', spec: 'RTCM · 增强', isDefault: false, total: 150, used: 88 },
  // 新加坡智联科技有限公司 (SG-ADM-01) — 3 个商品, 已配置
  { enterpriseId: 'SG-ADM-01', company: '新加坡智联科技有限公司', instance: 'SG-ADM-01', product: '定位增强服务', spec: 'SDK · 定位', isDefault: true, total: 1000, used: 820 },
  { enterpriseId: 'SG-ADM-01', company: '新加坡智联科技有限公司', instance: 'SG-ADM-01', product: '高精度地图账号包', spec: 'MAP · 年付', isDefault: false, total: 200, used: 188 },
  { enterpriseId: 'SG-ADM-01', company: '新加坡智联科技有限公司', instance: 'SG-ADM-01', product: '星基服务订阅', spec: 'SAT · 标准', isDefault: false, total: 100, used: 68 },
  // 北京星云导航科技有限公司 (BJ-XY-001) — 2 个商品, 已配置
  { enterpriseId: 'BJ-XY-001', company: '北京星云导航科技有限公司', instance: 'BJ-XY-001', product: '高精度定位SDK接入服务', spec: 'SDK · 高精度', isDefault: true, total: 500, used: 320 },
  { enterpriseId: 'BJ-XY-001', company: '北京星云导航科技有限公司', instance: 'BJ-XY-001', product: 'CORS 账号包', spec: 'CORS · 单频', isDefault: false, total: 100, used: 56 },
  // 广州天河测绘有限公司 (GZ-TH-001) — 2 个商品, 1/2 已配置
  { enterpriseId: 'GZ-TH-001', company: '广州天河测绘有限公司', instance: 'GZ-TH-001', product: '差分增强服务', spec: 'RTCM · 增强', isDefault: true, total: 200, used: 145 },
  { enterpriseId: 'GZ-TH-001', company: '广州天河测绘有限公司', instance: 'GZ-TH-001', product: '星基快速接入包', spec: 'SAT · 标准', isDefault: false, total: 0, used: 0 },
  // 成都西部导航有限公司 (CD-XB-001) — 1 个商品, 已配置
  { enterpriseId: 'CD-XB-001', company: '成都西部导航有限公司', instance: 'CD-XB-001', product: 'CORS 企业账号', spec: 'CORS · 单频', isDefault: true, total: 50, used: 41 },
  // 杭州云图科技有限公司 (HZ-YT-001) — 2 个商品, 已配置
  { enterpriseId: 'HZ-YT-001', company: '杭州云图科技有限公司', instance: 'HZ-YT-001', product: '导航SDK内置账号', spec: 'SDK · 连续', isDefault: true, total: 800, used: 530 },
  { enterpriseId: 'HZ-YT-001', company: '杭州云图科技有限公司', instance: 'HZ-YT-001', product: '地基增强包接入', spec: 'RTK · 高精度', isDefault: false, total: 120, used: 67 },
  // 武汉光谷科技有限公司 (WH-GG-001) — 1 个商品, 已配置
  { enterpriseId: 'WH-GG-001', company: '武汉光谷科技有限公司', instance: 'WH-GG-001', product: '企业导航资源池', spec: 'NAV · 大批量', isDefault: true, total: 5000, used: 2100 },
  // Legacy instance references (used by InstanceDetailPage)
  { enterpriseId: 'ENT-10001', company: '新加坡智联科技有限公司', instance: 'SG-SI-001', product: '定位增强服务', spec: 'SDK内置账号-连续计费-1月', isDefault: true, total: 1000, used: 820 },
  { enterpriseId: 'ENT-10002', company: '欧洲智联科技有限公司', instance: 'EU-SI-009', product: '星基服务订阅', spec: '星基标准版-100设备并发', isDefault: true, total: 100, used: 68 },
  { enterpriseId: 'ENT-10004', company: '山东省智联测绘科技有限公司', instance: 'SD-SI-001', product: '导航CGI-230SDK内置账号', spec: 'SDK内置账号-连续计费-1月', isDefault: true, total: 500, used: 0 },
  { enterpriseId: 'ENT-10004', company: '山东省智联测绘科技有限公司', instance: 'SD-SI-002', product: '企业导航资源池', spec: '大批量授权-连续计费', isDefault: true, total: 100000, used: 99500 },
]

// --- Helper functions ---

export function filterPoolLines(lines: ResourcePoolLine[], state: PoolFilterState): ResourcePoolLine[] {
  return lines.filter((line) => {
    if (state.company && line.company !== state.company) return false
    if (state.instance && line.instance !== state.instance) return false
    if (state.hideEmpty && !(line.total > 0 || line.used > 0)) return false
    if (!state.keyword.trim()) return true
    const haystack = [line.company, line.instance, line.product, line.spec].join(' ').toLowerCase()
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
