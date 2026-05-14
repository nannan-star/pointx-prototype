/** 配置中心 mock 数据 */

// ─── 服务节点 ───────────────────────────────────────────────────────────────────

export interface ServiceNode {
  name: string
  type: string
  code: string
  endpoint: string
  remark: string
  referenced: boolean
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export const SERVICE_NODE_TYPE_OPTIONS = [
  'VRS', '华测地基', '华测星基', '中移地基', '雨燕', '华测功能码',
] as const

export const serviceNodes: ServiceNode[] = [
  {
    name: 'VRS',
    type: 'VRS',
    code: 'NODE-VRS',
    endpoint: 'https://vrs.example.com',
    remark: '标准 VRS 节点',
    referenced: true,
    createdBy: 'SuperAdmin',
    createdAt: '2026-03-01 09:18:22',
    updatedBy: 'SuperAdmin',
    updatedAt: '2026-03-15 10:00:00',
  },
  {
    name: '华测地基',
    type: '华测地基',
    code: 'NODE-HCDJ',
    endpoint: 'https://hc-ground.example.com',
    remark: '华测地基节点',
    referenced: true,
    createdBy: 'SuperAdmin',
    createdAt: '2026-03-05 14:22:01',
    updatedBy: '运营-李四',
    updatedAt: '2026-04-02 09:30:00',
  },
  {
    name: '华测星基',
    type: '华测星基',
    code: 'NODE-HCXJ',
    endpoint: 'https://hc-satellite.example.com',
    remark: '华测星基节点',
    referenced: false,
    createdBy: 'SuperAdmin',
    createdAt: '2026-03-08 10:35:00',
    updatedBy: 'SuperAdmin',
    updatedAt: '2026-03-08 10:35:00',
  },
  {
    name: '中移地基',
    type: '中移地基',
    code: 'NODE-ZYDJ',
    endpoint: 'https://cm-ground.example.com',
    remark: '中移地基节点',
    referenced: false,
    createdBy: '运营-李四',
    createdAt: '2026-03-12 16:20:00',
    updatedBy: '运营-李四',
    updatedAt: '2026-03-12 16:20:00',
  },
  {
    name: '雨燕',
    type: '雨燕',
    code: 'NODE-RAIN',
    endpoint: 'https://rain-swallow.example.com',
    remark: '雨燕节点',
    referenced: false,
    createdBy: '运营-李四',
    createdAt: '2026-04-01 11:00:00',
    updatedBy: 'SuperAdmin',
    updatedAt: '2026-04-05 08:12:33',
  },
  {
    name: '华测功能码',
    type: '华测功能码',
    code: 'NODE-HCFNM',
    endpoint: 'https://hc-feature-code.example.com',
    remark: '华测功能码节点',
    referenced: false,
    createdBy: 'SuperAdmin',
    createdAt: '2026-04-10 11:00:00',
    updatedBy: 'SuperAdmin',
    updatedAt: '2026-04-10 11:00:00',
  },
]

// ─── 服务套餐 ───────────────────────────────────────────────────────────────────

export interface ServicePackage {
  name: string
  node: string
  spec: string
  port: string
  mount: string
  coord: string
  sources: string
  maxOnline: number
  tslEnabled: boolean
  compressEnabled: boolean
  status: '启用' | '停用'
  remark: string
  updatedBy: string
  updatedAt: string
}
export const servicePackages: ServicePackage[] = [
  {
    name: '乐动套餐-WGS84-5-16',
    node: 'swas地基',
    spec: 'SDK',
    port: '7101',
    mount: 'VS_GREC',
    coord: 'WGS84',
    sources: 'NTRIP:rtk.example.com:2101；省网 CORS 接入',
    maxOnline: 1,
    tslEnabled: false,
    compressEnabled: false,
    status: '启用',
    remark: '演示：地基接入套餐',
    updatedBy: 'SuperAdmin',
    updatedAt: '2026-04-01 10:00:00',
  },
  {
    name: 'PointSDK标准版2.0-AUTO3-非tls',
    node: 'swas地基',
    spec: 'SDK',
    port: '17103',
    mount: 'AUTO3',
    coord: 'ITRF2020',
    sources: 'L-Band 星基链路；PPP-RTK 融合源',
    maxOnline: 1,
    tslEnabled: false,
    compressEnabled: false,
    status: '启用',
    remark: '演示：非 TLS 端口说明见运维文档',
    updatedBy: '运营-李四',
    updatedAt: '2026-04-06 15:22:18',
  },
  {
    name: '全球定位增强标准包',
    node: 'swas地基',
    spec: 'SDK',
    port: '7102',
    mount: 'VS_GREC_MAIN',
    coord: 'CGCS2000',
    sources: '国家级 CORS；地基增强网络',
    maxOnline: 5,
    tslEnabled: true,
    compressEnabled: true,
    status: '启用',
    remark: '实例列表演示绑定：标准地基增强能力',
    updatedBy: 'SuperAdmin',
    updatedAt: '2026-04-20 09:10:00',
  },
  {
    name: '星基融合旗舰包',
    node: '华测星基',
    spec: 'SDK',
    port: '7103',
    mount: 'SAT_FUSION',
    coord: 'ITRF2020',
    sources: 'L-Band 星基；PPP-RTK；地基融合回退',
    maxOnline: 10,
    tslEnabled: true,
    compressEnabled: false,
    status: '启用',
    remark: '实例列表演示绑定：星基 + 地基融合',
    updatedBy: '运营-李四',
    updatedAt: '2026-04-21 14:30:00',
  },
]

// ─── 端口预设 ───────────────────────────────────────────────────────────────────

export interface PackagePortPreset {
  node: string
  port: string
  label: string
  coord: string
  mount: string
  tslEnabled: boolean
  compressEnabled: boolean
}
export const packagePortPresets: PackagePortPreset[] = [
  { node: 'VRS', port: '2101', label: '演示预设端口', coord: 'WGS84', mount: 'VRS_DEMO', tslEnabled: false, compressEnabled: false },
  { node: 'swas地基', port: '7101', label: '地基 VS_GREC', coord: 'WGS84', mount: 'VS_GREC', tslEnabled: false, compressEnabled: false },
  { node: 'swas地基', port: '17103', label: 'AUTO3 非 TLS', coord: 'ITRF2020', mount: 'AUTO3', tslEnabled: false, compressEnabled: false },
  { node: 'swas地基', port: '7102', label: 'CGCS2000 主链路', coord: 'CGCS2000', mount: 'VS_GREC_MAIN', tslEnabled: true, compressEnabled: true },
  { node: '华测星基', port: '7103', label: '星基融合', coord: 'ITRF2020', mount: 'SAT_FUSION', tslEnabled: true, compressEnabled: false },
  { node: 'swas地基', port: '443', label: 'HTTPS 方案 A', coord: 'WGS-84', mount: 'HTTPS_A', tslEnabled: true, compressEnabled: true },
  { node: 'swas地基', port: '443', label: 'HTTPS 方案 B', coord: 'CGCS2000', mount: 'HTTPS_B', tslEnabled: true, compressEnabled: false },
]

// ─── 商品 ───────────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  name: string
  image: string
  price: string
  type: string
  availablePackages: string
  serviceCombos: { productType: string; node: string; packageNames: string[] }[]
  billingMode: string
  productForm: string
  productLine: string
  region: string
  summary: string
  description: string
  remark: string
  line: string
  status: string
  referenced: boolean
  creatorEntries: { name: string; at: string }[]
  updatedBy: string
  updatedAt: string
}
export const products: Product[] = [
  {
    id: 'MFZWPGZGK',
    name: '导航SDK内置账号',
    image: '',
    price: '¥1',
    type: 'SDK',
    availablePackages: '乐动套餐-WGS84-5-16、PointSDK标准版2.0-AUTO3-非tls',
    serviceCombos: [{ productType: 'SDK', node: 'swas地基', packageNames: ['乐动套餐-WGS84-5-16', 'PointSDK标准版2.0-AUTO3-非tls'] }],
    billingMode: '连续计费',
    productForm: 'standard',
    productLine: '云芯产品线',
    region: '全球',
    summary: 'RTK/网络增强，适配测绘与精准农业场景。',
    description: '提供地基增强与网络 RTK 能力，可与实例 SI 绑定后按配额调用。',
    remark: '',
    line: '云芯产品线',
    status: '上架',
    referenced: true,
    creatorEntries: [{ name: '赵丽（产品经理）', at: '2026-03-12 09:18:22' }],
    updatedBy: '孙悦（运营）',
    updatedAt: '2026-04-08 11:05:33',
  },
  {
    id: 'M6TB87UQK',
    name: '外置帐号',
    image: '',
    price: '¥1',
    type: '外置账号',
    availablePackages: '乐动套餐-WGS84-5-16',
    serviceCombos: [{ productType: '外置账号', node: 'swas地基', packageNames: ['乐动套餐-WGS84-5-16'] }],
    billingMode: '连续计费',
    productForm: 'standard',
    productLine: '云芯产品线',
    region: '欧洲 · 亚太',
    summary: '星基 PPP 与融合定位订阅。',
    description: '面向高精度车载与海事场景的星基增强订阅商品。',
    remark: '演示数据',
    line: '云芯产品线',
    status: '上架',
    referenced: false,
    creatorEntries: [{ name: '产品经理甲', at: '2026-02-15 10:00:00' }, { name: '产品经理乙', at: '2026-02-16 15:30:00' }],
    updatedBy: '产品经理乙',
    updatedAt: '2026-03-01 09:15:40',
  },
]

// ─── 商品规格 ───────────────────────────────────────────────────────────────────

export interface Spec {
  id: string
  pn: string
  template: string
  product: string
  name: string
  currency: string
  agentPrice: string
  terminalPrice: string
  stock: number
  referenced: boolean
  creatorEntries: { name: string; at: string }[]
  updatedBy: string
  updatedAt: string
}
export const specs: Spec[] = [
  {
    id: 'PFOUQ1M8VQSCG',
    pn: '9010',
    template: '导航SDK内置账号',
    product: 'SDK内置账号-连续计费-5年',
    name: '5年',
    currency: 'CNY',
    agentPrice: '¥8,999',
    terminalPrice: '¥9,999',
    stock: 500,
    referenced: true,
    creatorEntries: [{ name: '赵丽（产品经理）', at: '2026-03-12 09:18:22' }],
    updatedBy: '孙悦（运营）',
    updatedAt: '2026-04-08 11:05:33',
  },
  {
    id: 'PY3RWGYTFKDGW',
    pn: '9009',
    template: '导航SDK内置账号',
    product: 'SDK内置账号-连续计费-3年',
    name: '5年',
    currency: 'CNY',
    agentPrice: '¥17,800',
    terminalPrice: '¥19,800',
    stock: 120,
    referenced: false,
    creatorEntries: [{ name: '产品经理甲', at: '2026-02-10 14:00:00' }],
    updatedBy: '产品经理乙',
    updatedAt: '2026-03-18 16:22:01',
  },
]
