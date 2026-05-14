/** 订单模块 mock 数据 */

export interface Order {
  title: string
  no: string
  customer: string
  seller: string
  status: string
  type: string
  source: string
  sourceChannel: string
  product: string
  spec: string
  quantity: number
  targetObject: string
  sapRef: string
  forceActivateAt: string
  amount: string
  payAt: string
  paySerial: string
  creator: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  remark: string
}

export const ordersMock: Order[] = [
  {
    title: '新加坡智联_定位增强-连续计费_202604271030001',
    no: 'ORD-20260427031',
    customer: '新加坡智联科技有限公司',
    seller: '渠道平台管理_卢楠楠',
    status: '已付款',
    type: '续费',
    source: '资源池',
    sourceChannel: 'platform',
    product: '定位增强服务',
    spec: '定位增强 1000次/月',
    quantity: 300,
    targetObject: 'SG-SI-001',
    sapRef: 'SAP-440012',
    forceActivateAt: '',
    amount: '¥2,999',
    payAt: '2026-04-27 10:00:43',
    paySerial: '',
    creator: '卢楠楠',
    createdAt: '2026-04-27 10:00:43',
    updatedBy: '卢楠楠',
    updatedAt: '2026-04-27 10:00:43',
    remark: '标准开通',
  },
  {
    title: '欧洲智联_星基标准版开通_202604261630002',
    no: 'ORD-20260426017',
    customer: '欧洲智联科技有限公司',
    seller: '渠道平台管理_周航',
    status: '已完成',
    type: '新购',
    source: 'OpenAPI',
    sourceChannel: 'openapi',
    product: '星基服务订阅',
    spec: '星基标准版',
    quantity: 100,
    targetObject: 'EU-SI-002',
    sapRef: '',
    forceActivateAt: '',
    amount: '¥19,800',
    payAt: '2026-04-26 16:30:00',
    paySerial: 'PAY-202604261630889',
    creator: '周航',
    createdAt: '2026-04-26 16:30:00',
    updatedBy: '周航',
    updatedAt: '2026-04-26 16:30:00',
    remark: '',
  },
  {
    title: 'NorthStar_CORS企业账号_202604250920003',
    no: 'ORD-20260425006',
    customer: 'NorthStar Mobility',
    seller: '渠道平台管理_顾宇',
    status: '已完成',
    type: '新购',
    source: '交易中心',
    sourceChannel: 'platform',
    product: 'CORS 企业账号',
    spec: 'CORS 账号 50个',
    quantity: 50,
    targetObject: 'NS-SI-003',
    sapRef: '333',
    forceActivateAt: '',
    amount: '¥6,000',
    payAt: '2026-04-25 09:20:00',
    paySerial: 'PAY-202604250920012',
    creator: '顾宇',
    createdAt: '2026-04-25 09:20:00',
    updatedBy: '顾宇',
    updatedAt: '2026-04-25 10:05:00',
    remark: '海外项目采购',
  },
]
