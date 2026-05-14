/** 对账管理 mock 数据 */

export interface ReconciliationRow {
  month: string
  region: string
  spec: string
  active: number
  price: string
  amount: string
}

export const reconciliationData: ReconciliationRow[] = [
  { month: '2026-04', region: '新加坡', spec: '定位增强 1000次/月', active: 382, price: '¥8', amount: '¥3,056' },
  { month: '2026-04', region: '欧洲', spec: '星基标准版', active: 119, price: '¥20', amount: '¥2,380' },
  { month: '2026-04', region: '北美', spec: 'CORS 账号 50个', active: 41, price: '¥15', amount: '¥615' },
  { month: '2026-03', region: '新加坡', spec: '定位增强 1000次/月', active: 356, price: '¥8', amount: '¥2,848' },
  { month: '2026-03', region: '欧洲', spec: '星基标准版', active: 108, price: '¥20', amount: '¥2,160' },
  { month: '2026-02', region: '新加坡', spec: '定位增强 1000次/月', active: 312, price: '¥8', amount: '¥2,496' },
]
