/** 系统管理 mock 数据 */

export interface AdminUser {
  id: string
  name: string
  status: string
  phone: string
  email: string
  role: string
  assignedRoles: string[]
  createdAt: string
  remark: string
}

export interface Role {
  name: string
  code: string
  sortOrder: number
  remark: string
  createdAt: string
}

export interface MenuNode {
  id: string
  name: string
  menuType: string
  status: string
  sortOrder: number
  route: string
  requestPath: string
  permKey: string
  defaultShow: boolean | string
  children?: MenuNode[]
}

export interface Dictionary {
  id: string
  enumType: string
  pk: number
  value: string
  sort: number
  description: string
}

export interface Enterprise {
  id: string
  contact: string
  name: string
  status: string
  phone: string
  email: string
  registeredAt: string
  account: string
  industry: string
  remark: string
  licenses: boolean
  assignedRoles: string[]
}

export const adminUsers: AdminUser[] = [
  { id: 'ADM-001', name: '卢楠楠', status: '正常', phone: '138****1024', email: 'product-admin@example.com', role: '超级管理员', assignedRoles: ['超级管理员'], createdAt: '2026-04-01 09:00', remark: '值班主任' },
  { id: 'ADM-002', name: '周航', status: '正常', phone: '138****6789', email: 'ops@example.com', role: '普通管理员', assignedRoles: ['普通管理员'], createdAt: '2026-04-12 13:00', remark: '' },
  { id: 'ADM-003', name: '顾宇', status: '禁用', phone: '138****4567', email: 'finance@example.com', role: '财务管理员', assignedRoles: ['财务管理员'], createdAt: '2026-04-15 11:30', remark: '仅财务对账权限' },
]

export const roles: Role[] = [
  { name: '超级管理员', code: 'SUPER_ADMIN', sortOrder: 10, remark: '平台内置，拥有全部菜单与数据权限', createdAt: '2026-04-01 08:00:00' },
  { name: '商务管理员', code: 'COMMON_ADMIN', sortOrder: 20, remark: '管理端日常运维，权限可裁', createdAt: '2026-04-01 08:00:00' },
  { name: '大客户', code: 'CLIENT_ADMIN', sortOrder: 100, remark: '企业控制台 · 企业管理员默认角色', createdAt: '2026-04-01 08:00:00' },
  { name: '企业管理员', code: 'ENT_ADMIN', sortOrder: 110, remark: '单企业内管理与审批', createdAt: '2026-04-01 08:00:00' },
]

export const menuTree: MenuNode[] = [
  {
    id: 'menu-resource', name: '资源中心', menuType: '目录', status: '启用', sortOrder: 2,
    route: '', requestPath: '', permKey: '', defaultShow: true,
    children: [
      { id: 'menu-inst', name: '实例', menuType: '菜单', status: '启用', sortOrder: 1, route: '/admin/instances', requestPath: '/api/instances', permKey: 'resource:instance:list', defaultShow: true },
      { id: 'menu-pool', name: '资源池', menuType: '菜单', status: '启用', sortOrder: 2, route: '/admin/pool', requestPath: '/api/pool', permKey: 'resource:pool:list', defaultShow: true },
      { id: 'menu-sdk', name: 'SDK 资源', menuType: '菜单', status: '启用', sortOrder: 3, route: '/admin/resources/sdk', requestPath: '/api/sdk', permKey: 'resource:sdk:list', defaultShow: true },
      { id: 'menu-cors', name: 'CORS 账号', menuType: '菜单', status: '启用', sortOrder: 4, route: '/admin/resources/cors', requestPath: '/api/cors', permKey: 'resource:cors:list', defaultShow: true },
    ],
  },
  {
    id: 'menu-trade', name: '交易中心', menuType: '目录', status: '启用', sortOrder: 3,
    route: '', requestPath: '', permKey: '', defaultShow: true,
    children: [
      { id: 'menu-orders', name: '订单列表', menuType: '菜单', status: '启用', sortOrder: 1, route: '/admin/trade/orders', requestPath: '/api/orders', permKey: 'trade:order:list', defaultShow: true },
    ],
  },
  {
    id: 'menu-config', name: '配置中心', menuType: '目录', status: '启用', sortOrder: 4,
    route: '', requestPath: '', permKey: '', defaultShow: true,
    children: [
      { id: 'menu-nodes', name: '服务节点', menuType: '菜单', status: '启用', sortOrder: 1, route: '/admin/config/nodes', requestPath: '/api/nodes', permKey: 'config:node:list', defaultShow: true },
      { id: 'menu-packages', name: '服务套餐', menuType: '菜单', status: '启用', sortOrder: 2, route: '/admin/config/packages', requestPath: '/api/packages', permKey: 'config:package:list', defaultShow: true },
      { id: 'menu-products', name: '商品', menuType: '菜单', status: '启用', sortOrder: 3, route: '/admin/products', requestPath: '/api/products', permKey: 'config:product:list', defaultShow: true },
      { id: 'menu-specs', name: '商品规格', menuType: '菜单', status: '启用', sortOrder: 4, route: '/admin/specs', requestPath: '/api/specs', permKey: 'config:spec:list', defaultShow: true },
    ],
  },
  {
    id: 'menu-system', name: '系统管理', menuType: '目录', status: '启用', sortOrder: 5,
    route: '', requestPath: '', permKey: '', defaultShow: true,
    children: [
      { id: 'menu-ent', name: '企业用户', menuType: '菜单', status: '启用', sortOrder: 1, route: '/admin/enterprises', requestPath: '/api/enterprises', permKey: 'system:enterprise:list', defaultShow: true },
      { id: 'menu-admin', name: '管理用户', menuType: '菜单', status: '启用', sortOrder: 2, route: '/admin/system/admins', requestPath: '/api/admins', permKey: 'system:admin:list', defaultShow: true },
      { id: 'menu-role', name: '角色权限', menuType: '菜单', status: '启用', sortOrder: 3, route: '/admin/system/roles', requestPath: '/api/roles', permKey: 'system:role:list', defaultShow: true },
      { id: 'menu-menumgmt', name: '菜单管理', menuType: '菜单', status: '启用', sortOrder: 4, route: '/admin/system/menus', requestPath: '/api/menus', permKey: 'system:menu:list', defaultShow: true },
      { id: 'menu-dict', name: '字典管理', menuType: '菜单', status: '启用', sortOrder: 5, route: '/admin/system/dict', requestPath: '/api/dict', permKey: 'system:dict:list', defaultShow: true },
    ],
  },
]

export const dictionaries: Dictionary[] = [
  { id: 'dict-qt-1', enumType: 'questionType', pk: 1, value: '设备', sort: 1, description: '问题类型' },
  { id: 'dict-qt-2', enumType: 'questionType', pk: 2, value: '内置账号', sort: 2, description: '问题类型' },
  { id: 'dict-qt-3', enumType: 'questionType', pk: 3, value: '外置账号', sort: 3, description: '问题类型' },
  { id: 'dict-qt-4', enumType: 'questionType', pk: 4, value: '库存', sort: 4, description: '问题类型' },
  { id: 'dict-ai-1', enumType: 'accountIssuing', pk: 1, value: '3个月', sort: 1, description: '账号发放-强制时间' },
  { id: 'dict-ai-2', enumType: 'accountIssuing', pk: 2, value: '12个月', sort: 2, description: '账号发放-强制时间' },
  { id: 'dict-ai-3', enumType: 'accountIssuing', pk: 3, value: '无期限', sort: 3, description: '账号发放-强制时间' },
  { id: 'dict-as-1', enumType: 'algoStrategy', pk: 1, value: '策略1', sort: 3, description: '手簿RTK算法策略' },
  { id: 'dict-as-2', enumType: 'algoStrategy', pk: 2, value: '策略2', sort: 2, description: '手簿RTK算法策略' },
  { id: 'dict-as-3', enumType: 'algoStrategy', pk: 0, value: '策略0', sort: 1, description: '手簿RTK算法策略' },
  { id: 'dict-am-1', enumType: 'algoDefaultMode', pk: 0, value: '默认模式', sort: 1, description: '算法默认模式' },
  { id: 'dict-pt-1', enumType: 'productType', pk: 1, value: '标准商品', sort: 1, description: '商品形态枚举' },
]

export const enterprises: Enterprise[] = [
  { id: 'ENT-10001', contact: '陈海', name: '新加坡智联科技有限公司', status: '正常', phone: '+65 90001122', email: 'ops@sg-iot.com', registeredAt: '2026-04-20 09:32', account: 'sg_admin', industry: '测绘地理信息', remark: '重点客户', licenses: true, assignedRoles: ['企业管理员', '业务操作员'] },
  { id: 'ENT-10002', contact: '李哲', name: '欧洲智联科技有限公司', status: '正常', phone: '+44 78881122', email: 'admin@eu-iot.com', registeredAt: '2026-04-18 14:12', account: 'eu_admin', industry: '车联网', remark: '区域样板客户', licenses: true, assignedRoles: ['企业管理员'] },
  { id: 'ENT-10003', contact: 'Mila', name: 'NorthStar Mobility', status: '禁用', phone: '+1 2025558899', email: 'owner@northstar.com', registeredAt: '2026-04-09 11:04', account: 'ns_owner', industry: '', remark: '测试冻结', licenses: false, assignedRoles: ['企业管理员'] },
  { id: 'ENT-10004', contact: '赵磊', name: '山东省智联测绘科技有限公司', status: '正常', phone: '+86 53155501200', email: 'gis@sd-survey.com', registeredAt: '2026-04-17 08:40', account: 'sd_admin', industry: '智慧城市', remark: '省级示范项目', licenses: true, assignedRoles: ['企业管理员', '财务查看'] },
]

export const adminProfile = {
  name: '卢楠楠', role: '超级管理员', company: '平台运营中心', region: '全部区域',
  phone: '138****1024', email: 'product-admin@example.com',
}

export const clientProfile = {
  name: '卢楠楠-代理商', role: '企业管理员', company: '新加坡智联科技有限公司', region: '新加坡',
  phone: '176****8356', email: '17621518356@163.com', idCardMasked: '4****5',
  organization: '华测_卢楠楠-代理商',
}
