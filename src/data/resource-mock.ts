/** 资源中心 mock 数据 */

export interface SdkResource {
  sdkResKey: string
  company: string
  instance: string
  ak: string
  regCode: string
  sn: string
  deviceType: string
  ntripAccount: string
  activateMode: string
  entryMode: string
  activateStatus: string
  status: string
  billingMode: string
  product: string
  spec: string
  activatedAt: string
  expireAt: string
  remaining: string
  remark: string
  region: string
  line: string
}

export interface CorsResource {
  company: string
  account: string
  password: string
  status: string
  startAt: string
  expireAt: string
  remaining: string
  forceActivateAt: string
  activateStatus: string
  product: string
  billingMode: string
  platformLogin: string
  usageRemaining: string
  owner: string
  remark: string
  region: string
  spec: string
  line: string
}

export interface ClientCompanyProfile {
  companyName: string
  companyId: string
  ak: string
  as: string
  si: string
  sik: string
  entryMode: string
  activateMode: string
  billingMode: string
  reconcileMode: string
}

export interface ResourceNodeRow {
  serviceNode: string
  product: string
  total: number
  used: number
  unused: number
  isGlobal: boolean
}

export const sdkResources: SdkResource[] = [
  {
    sdkResKey: 'sdkres-demo-sg-001',
    company: '新加坡智联科技有限公司',
    instance: 'SG-SI-001',
    ak: 'AKc3e1b8d4f201',
    regCode: 'REG-2026-SG-88901',
    sn: 'SN-001',
    deviceType: '车载高精度终端',
    ntripAccount: 'ntrip_sg_240001',
    activateMode: '设备SN绑定',
    entryMode: '自动入库',
    activateStatus: '已激活',
    status: '服务中',
    billingMode: '连续计费',
    product: '定位增强服务',
    spec: '定位增强 1000次/月',
    activatedAt: '2026-03-15 10:22',
    expireAt: '2026-12-31',
    remaining: '248 天',
    remark: '',
    region: '新加坡',
    line: '地基业务',
  },
  {
    sdkResKey: 'sdkres-demo-eu-002',
    company: '欧洲智联科技有限公司',
    instance: 'EU-SI-002',
    ak: 'AK4f608301',
    regCode: '',
    sn: 'SN288',
    deviceType: '测绘型接收机',
    ntripAccount: '',
    activateMode: '手动激活',
    entryMode: '手动入库',
    activateStatus: '未激活',
    status: '已过期',
    billingMode: '按量计费',
    product: '星基服务订阅',
    spec: '星基标准版',
    activatedAt: '',
    expireAt: '2025-12-31',
    remaining: '—',
    remark: '待客户补传 SN 凭证',
    region: '欧洲',
    line: '星基业务',
  },
]

export const corsResources: CorsResource[] = [
  {
    company: '新加坡智联科技有限公司',
    account: 'cors_sg_001',
    password: '******',
    status: '启用',
    startAt: '2026-01-01 08:00:00',
    expireAt: '2026-12-31 23:59:59',
    remaining: '247 天',
    forceActivateAt: '2026-06-01 00:00:00',
    activateStatus: '已激活',
    product: 'CORS 企业账号',
    billingMode: '按量计费',
    platformLogin: '允许',
    usageRemaining: '12,450 次',
    owner: '赵丽',
    remark: '',
    region: '新加坡',
    spec: 'CORS 账号 50个',
    line: 'CORS业务',
  },
  {
    company: '欧洲智联科技有限公司',
    account: 'cors_eu_001',
    password: '******',
    status: '禁用',
    startAt: '2025-11-15 10:00:00',
    expireAt: '2026-06-30 23:59:59',
    remaining: '64 天',
    forceActivateAt: '',
    activateStatus: '待激活',
    product: 'CORS 企业账号',
    billingMode: '连续计费',
    platformLogin: '禁止',
    usageRemaining: '',
    owner: '周航',
    remark: '对账争议暂停',
    region: '欧洲',
    spec: 'CORS 账号 50个',
    line: 'CORS业务',
  },
]

export const clientCompanyProfile: ClientCompanyProfile = {
  companyName: '新加坡智联科技有限公司',
  companyId: 'ENT-10001',
  ak: 'AK_SG_******',
  as: '********',
  si: 'SG-SI-001',
  sik: '********',
  entryMode: '手动入库',
  activateMode: '设备使用激活',
  billingMode: '连续计费',
  reconcileMode: '先付后用',
}

export const clientEnterpriseResources: ResourceNodeRow[] = [
  { serviceNode: '全球总量', product: 'SDK 账号-连续计费-1个月', total: 5000, used: 234, unused: 4766, isGlobal: true },
  { serviceNode: 'NA（北美）', product: 'SDK 账号-连续计费-1个月', total: 1200, used: 89, unused: 1111, isGlobal: false },
  { serviceNode: 'EU（欧洲）', product: 'SDK 账号-连续计费-1个月', total: 1800, used: 67, unused: 1733, isGlobal: false },
  { serviceNode: '亚太', product: 'SDK 账号-连续计费-1个月', total: 2000, used: 78, unused: 1922, isGlobal: false },
]
