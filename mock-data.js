window.PROTOTYPE_DATA = {
  users: {
    admin: {
      name: '卢楠楠',
      role: '超级管理员',
      company: '平台运营中心',
      region: '全部区域',
      phone: '138****1024',
      email: 'product-admin@example.com'
    },
    client: {
      name: '卢楠楠-代理商',
      role: '企业管理员',
      company: '新加坡智联科技有限公司',
      region: '新加坡',
      phone: '17621518356',
      email: '17621518356@163.com',
      idCardMasked: '4****5',
      organization: '华测_卢楠楠-代理商'
    },
    regionalClient: {
      name: '王越',
      role: '企业管理员',
      company: '欧洲智联科技有限公司',
      region: '欧洲',
      phone: '136****8871',
      email: 'regional-admin@example.com'
    }
  },
  stats: {
    kpis: [
      { label: '新增设备（近 7 日）', value: '128' },
      { label: '新增帐号（近 7 日）', value: '56' },
      { label: '日活帐号（昨日）', value: '3,842' }
    ],
    resourceCards: [
      { name: '千寻定位增强包', used: 820, total: 1000 },
      { name: '高精度地图账号包', used: 188, total: 200 },
      { name: '星基订阅套餐', used: 68, total: 100 },
      { name: 'CORS 企业账号包', used: 41, total: 60 }
    ],
    regionUsage: [
      { region: '新加坡', spec: '千寻定位增强包', active: 382, updatedAt: '2026-04-27 18:20' },
      { region: '欧洲', spec: '高精度地图账号包', active: 119, updatedAt: '2026-04-27 18:16' },
      { region: '北美', spec: '星基订阅套餐', active: 64, updatedAt: '2026-04-27 18:11' },
      { region: '中东', spec: 'CORS 企业账号包', active: 28, updatedAt: '2026-04-27 17:59' }
    ],
    trend: {
      day: [42, 55, 61, 58, 76, 82, 79],
      week: [230, 260, 310, 280, 360, 390, 420],
      month: [1200, 1420, 1510, 1660, 1750, 1820, 1960]
    }
  },
  enterprises: [
    {
      id: 'ENT-10001',
      contact: '陈海',
      name: '新加坡智联科技有限公司',
      status: '正常',
      phone: '+65 90001122',
      email: 'ops@sg-iot.com',
      registeredAt: '2026-04-20 09:32',
      account: 'sg_admin',
      industry: '测绘地理信息',
      remark: '重点客户',
      licenses: true,
      assignedRoles: ['企业管理员', '业务操作员']
    },
    {
      id: 'ENT-10002',
      contact: '李哲',
      name: '欧洲智联科技有限公司',
      status: '正常',
      phone: '+44 78881122',
      email: 'admin@eu-iot.com',
      registeredAt: '2026-04-18 14:12',
      account: 'eu_admin',
      industry: '车联网',
      remark: '区域样板客户',
      licenses: true,
      assignedRoles: ['企业管理员']
    },
    {
      id: 'ENT-10003',
      contact: 'Mila',
      name: 'NorthStar Mobility',
      status: '禁用',
      phone: '+1 2025558899',
      email: 'owner@northstar.com',
      registeredAt: '2026-04-09 11:04',
      account: 'ns_owner',
      remark: '测试冻结',
      licenses: false,
      assignedRoles: ['企业管理员']
    },
    {
      id: 'ENT-10004',
      contact: '赵磊',
      name: '山东省智联测绘科技有限公司',
      status: '正常',
      phone: '+86 53155501200',
      email: 'gis@sd-survey.com',
      registeredAt: '2026-04-17 08:40',
      account: 'sd_admin',
      industry: '智慧城市',
      remark: '省级示范项目',
      licenses: true,
      assignedRoles: ['企业管理员', '财务查看']
    }
  ],
  adminUsers: [
    {
      id: 'ADM-001',
      name: '卢楠楠',
      status: '正常',
      phone: '13800001024',
      email: 'product-admin@example.com',
      role: '超级管理员',
      assignedRoles: ['超级管理员'],
      createdAt: '2026-04-01 09:00',
      remark: '值班主任'
    },
    {
      id: 'ADM-002',
      name: '周航',
      status: '正常',
      phone: '13800006789',
      email: 'ops@example.com',
      role: '普通管理员',
      assignedRoles: ['普通管理员'],
      createdAt: '2026-04-12 13:00',
      remark: ''
    },
    {
      id: 'ADM-003',
      name: '顾宇',
      status: '禁用',
      phone: '13800004567',
      email: 'finance@example.com',
      role: '财务管理员',
      assignedRoles: ['财务管理员'],
      createdAt: '2026-04-15 11:30',
      remark: '仅财务对账权限'
    }
  ],
  roles: [
    { name: '超级管理员', code: 'SUPER_ADMIN', sortOrder: 10, remark: '平台内置，拥有全部菜单与数据权限', createdAt: '2026-04-01 08:00:00' },
    { name: '商务管理员', code: 'COMMON_ADMIN', sortOrder: 20, remark: '管理端日常运维，权限可裁', createdAt: '2026-04-01 08:00:00' },
    { name: '大客户', code: 'CLIENT_ADMIN', sortOrder: 100, remark: '企业控制台 · 企业管理员默认角色', createdAt: '2026-04-01 08:00:00' },
    { name: '企业管理员', code: 'ENT_ADMIN', sortOrder: 110, remark: '单企业内管理与审批', createdAt: '2026-04-01 08:00:00' },
 ],
  menuTree: [
    { name: '资源中心', checked: true, children: ['实例', '资源池', 'SDK 资源', 'CORS 账号'] },
    { name: '交易中心', checked: true, children: ['订单列表'] },
    { name: '配置中心', checked: true, children: ['服务节点', '服务套餐'] },
    { name: '商品中心', checked: false, children: ['商品', '商品规格'] },
    { name: '系统管理', checked: true, children: ['企业用户管理', '角色权限管理', '菜单管理'] }
  ],
  dictionaries: [
    {
      id: 'dict-qt-1',
      enumType: 'questionType',
      pk: 1,
      value: '设备',
      sort: 1,
      description: '问题类型'
    },
    {
      id: 'dict-qt-2',
      enumType: 'questionType',
      pk: 2,
      value: '内置账号',
      sort: 2,
      description: '问题类型'
    },
    {
      id: 'dict-qt-3',
      enumType: 'questionType',
      pk: 3,
      value: '外置账号',
      sort: 3,
      description: '问题类型'
    },
    {
      id: 'dict-qt-4',
      enumType: 'questionType',
      pk: 4,
      value: '库存',
      sort: 4,
      description: '问题类型'
    },
    {
      id: 'dict-ai-1',
      enumType: 'accountIssuing',
      pk: 1,
      value: '3个月',
      sort: 1,
      description: '账号发放-强制时间'
    },
    {
      id: 'dict-ai-2',
      enumType: 'accountIssuing',
      pk: 2,
      value: '12个月',
      sort: 2,
      description: '账号发放-强制时间'
    },
    {
      id: 'dict-ai-3',
      enumType: 'accountIssuing',
      pk: 3,
      value: '无期限',
      sort: 3,
      description: '账号发放-强制时间'
    },
    {
      id: 'dict-as-1',
      enumType: 'algoStrategy',
      pk: 1,
      value: '策略1',
      sort: 3,
      description: '手簿RTK算法策略'
    },
    {
      id: 'dict-as-2',
      enumType: 'algoStrategy',
      pk: 2,
      value: '策略2',
      sort: 2,
      description: '手簿RTK算法策略'
    },
    {
      id: 'dict-as-3',
      enumType: 'algoStrategy',
      pk: 0,
      value: '策略0',
      sort: 1,
      description: '手簿RTK算法策略'
    },
    {
      id: 'dict-am-1',
      enumType: 'algoDefaultMode',
      pk: 0,
      value: '默认模式',
      sort: 1,
      description: '算法默认模式'
    },
    {
      id: 'dict-pt-1',
      enumType: 'productType',
      pk: 1,
      value: '标准商品',
      sort: 1,
      description: '商品形态枚举'
    }
  ],
  serviceNodes: [
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
      updatedAt: '2026-03-15 10:00:00'
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
      updatedAt: '2026-04-02 09:30:00'
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
      updatedAt: '2026-03-08 10:35:00'
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
      updatedAt: '2026-03-12 16:20:00'
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
      updatedAt: '2026-04-05 08:12:33'
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
      updatedAt: '2026-04-10 11:00:00'
    }
  ],
  packages: [
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
      updatedAt: '2026-04-01 10:00:00'
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
      updatedAt: '2026-04-06 15:22:18'
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
      updatedAt: '2026-04-20 09:10:00'
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
      updatedAt: '2026-04-21 14:30:00'
    }
  ],
  /** 服务套餐·端口预设（按服务节点 + 端口匹配；演示「带出」坐标系/挂载点/TLS/压缩） */
  packagePortPresets: [
    {
      node: 'VRS',
      port: '2101',
      label: '演示预设端口',
      coord: 'WGS84',
      mount: 'VRS_DEMO',
      tslEnabled: false,
      compressEnabled: false
    },
    {
      node: 'swas地基',
      port: '7101',
      label: '地基 VS_GREC',
      coord: 'WGS84',
      mount: 'VS_GREC',
      tslEnabled: false,
      compressEnabled: false
    },
    {
      node: 'swas地基',
      port: '17103',
      label: 'AUTO3 非 TLS',
      coord: 'ITRF2020',
      mount: 'AUTO3',
      tslEnabled: false,
      compressEnabled: false
    },
    {
      node: 'swas地基',
      port: '7102',
      label: 'CGCS2000 主链路',
      coord: 'CGCS2000',
      mount: 'VS_GREC_MAIN',
      tslEnabled: true,
      compressEnabled: true
    },
    {
      node: '华测星基',
      port: '7103',
      label: '星基融合',
      coord: 'ITRF2020',
      mount: 'SAT_FUSION',
      tslEnabled: true,
      compressEnabled: false
    },
    {
      node: 'swas地基',
      port: '443',
      label: 'HTTPS 方案 A',
      coord: 'WGS-84',
      mount: 'HTTPS_A',
      tslEnabled: true,
      compressEnabled: true
    },
    {
      node: 'swas地基',
      port: '443',
      label: 'HTTPS 方案 B',
      coord: 'CGCS2000',
      mount: 'HTTPS_B',
      tslEnabled: true,
      compressEnabled: false
    }
  ],
  products: [
    {
      id: 'MFZWPGZGK',
      name: '导航SDK内置账号',
      image: '',
      price: '¥1',
      authMethod: 'SDK',
      availablePackages: '乐动套餐-WGS84-5-16、PointSDK标准版2.0-AUTO3-非tls',
      serviceCombos: [
        {
          productType: 'SDK',
          node: 'swas地基',
          packageNames: ['乐动套餐-WGS84-5-16', 'PointSDK标准版2.0-AUTO3-非tls']
        }
      ],
      billingMode: '连续计费',
      productForm: 'standard',
      productLine: '云芯产品线',
      region: '全球',
      summary: 'RTK/网络增强，适配测绘与精准农业场景。',
      description: '提供地基增强与网络 RTK 能力，可与实例 SI 绑定后按配额调用。',
      remark: '',
      type: 'SDK',
      line: '云芯产品线',
      status: '上架',
      referenced: true,
      creatorEntries: [{ name: '赵丽（产品经理）', at: '2026-03-12 09:18:22' }],
      updatedBy: '孙悦（运营）',
      updatedAt: '2026-04-08 11:05:33'
    },
    {
      id: 'M6TB87UQK',
      name: '外置帐号',
      image: '',
      price: '¥1',
      authMethod: '外置账号',
      availablePackages: '乐动套餐-WGS84-5-16',
      serviceCombos: [
        {
          productType: '外置账号',
          node: 'swas地基',
          packageNames: ['乐动套餐-WGS84-5-16']
        }
      ],
      billingMode: '连续计费',
      productForm: 'standard',
      productLine: '云芯产品线',
      region: '欧洲 · 亚太',
      summary: '星基 PPP 与融合定位订阅。',
      description: '面向高精度车载与海事场景的星基增强订阅商品。',
      remark: '演示数据',
      type: '外置账号',
      line: '云芯产品线',
      status: '上架',
      referenced: false,
      creatorEntries: [
        { name: '产品经理甲', at: '2026-02-15 10:00:00' },
        { name: '产品经理乙', at: '2026-02-16 15:30:00' }
      ],
      updatedBy: '产品经理乙',
      updatedAt: '2026-03-01 09:15:40'
    },
  ],
  specs: [
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
      updatedAt: '2026-04-08 11:05:33'
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
      updatedAt: '2026-03-18 16:22:01'
    },
    {
      id: 'PLUSNBK7CON9Z',
      pn: '4109020365',
      template: 'CORS账号',
      product: 'CORS账号-连续计费-5年',
      name: '5年',
      currency: 'CNY',
      agentPrice: '¥5,400',
      terminalPrice: '¥6,000',
      stock: 80,
      referenced: true,
      creatorEntries: [{ name: '运营-李四', at: '2026-03-25 11:30:00' }],
      updatedBy: 'SuperAdmin',
      updatedAt: '2026-04-01 09:15:44'
    }
  ],
  instances: [
    { name: 'SG-SI-001', company: '新加坡智联科技有限公司', packageNames: ['全球定位增强标准包', '星基融合旗舰包'], owner: '卢楠楠', createdAt: '2026-04-22 09:20', secretVisible: false, sik: 'SIK-SG001-7f3a92c1d4e605b8', sis: 'SIS-SG001-b9014e8a2c7f301d', appKey: 'AKSGSI00101A2B3C4D5E6F708090A1B', appSecret: 'SKSGSI0019f8e7d6c5b4a39281f0e2d3c', deviceAutoStock: '是', activateMode: '设备SN绑定', accountPrefix: '' },
    { name: 'US-SI-DRAFT', company: '新加坡智联科技有限公司', packageNames: [], owner: '卢楠楠', createdAt: '2026-04-28 10:15', secretVisible: false, sik: 'SIK-USDRAFT-pending000001', sis: 'SIS-USDRAFT-pending000002', appKey: 'AKUSDRAFT000102030405060708090A', appSecret: 'SKUSDRAFT00112233445566778899AA', deviceAutoStock: '是', activateMode: '手动激活', accountPrefix: '' },
    { name: 'EU-SI-009', company: '欧洲智联科技有限公司', packageNames: ['星基融合旗舰包'], owner: '周航', createdAt: '2026-04-21 15:10', secretVisible: false, sik: 'SIK-EU009-a1b2c3d4e5f60789', sis: 'SIS-EU009-0a1b2c3d4e5f6789', appKey: 'AKEUSI00911223344556677889900AB', appSecret: 'SKEUSI009ccddeeff0011223344556677', deviceAutoStock: '是', activateMode: '设备SN绑定', accountPrefix: 'cors_eu_' },
    { name: 'SD-SI-001', company: '山东省智联测绘科技有限公司', packageNames: ['全球定位增强标准包'], owner: '卢楠楠', createdAt: '2026-04-19 11:00', secretVisible: false, sik: 'SIK-SD101-fedcba9876543210', sis: 'SIS-SD101-0123456789abcdef', appKey: 'AKSDSI001AABBCCDDEEFF001122334455', appSecret: 'SKSDSI00166778899AABBCCDDEEFF0011', deviceAutoStock: '是', activateMode: '设备SN绑定', accountPrefix: 'cors_sd_' },
    { name: 'SD-SI-002', company: '山东省智联测绘科技有限公司', packageNames: ['星基融合旗舰包'], owner: '周航', createdAt: '2026-04-18 10:30', secretVisible: false, sik: 'SIK-SD102-9988776655443322', sis: 'SIS-SD102-1100FFEEDDCCBBAA', appKey: 'AKSDSI0025060708090A0B0C0D0E0F1011', appSecret: 'SKSDSI00212131415161718191A1B1C1D', deviceAutoStock: '否', activateMode: '在线激活', accountPrefix: '' }
  ],
  /**
   * 超管资源池主表：按企业 → 实例 → 商品规格展开；用于合并单元格统计全量大客户已购资源。
   * company + instance + product + spec 唯一标识一行；total/used 为配额口径。
   */
  resourcePools: [
    {
      enterpriseId: 'ENT-10001',
      company: '新加坡智联科技有限公司',
      instance: 'SG-SI-001',
      product: '定位增强服务',
      spec: 'SDK内置账号-连续计费-1月',
      isDefault: true,
      total: 1000,
      used: 820
    },
    {
      enterpriseId: 'ENT-10001',
      company: '新加坡智联科技有限公司',
      instance: 'SG-SI-001',
      product: '高精度地图账号包',
      spec: '地图账号-年付-200席',
      isDefault: false,
      total: 200,
      used: 188
    },
    {
      enterpriseId: 'ENT-10002',
      company: '欧洲智联科技有限公司',
      instance: 'EU-SI-009',
      product: '星基服务订阅',
      spec: '星基标准版-100设备并发',
      isDefault: true,
      total: 100,
      used: 68
    },
    {
      enterpriseId: 'ENT-10002',
      company: '欧洲智联科技有限公司',
      instance: 'EU-SI-009',
      product: 'CORS 企业账号',
      spec: 'CORS 账号-50个',
      isDefault: false,
      total: 50,
      used: 41
    },
    {
      enterpriseId: 'ENT-10004',
      company: '山东省智联测绘科技有限公司',
      instance: 'SD-SI-001',
      product: '导航CGI-230SDK内置账号',
      spec: 'SDK内置账号-连续计费-1月',
      isDefault: true,
      total: 0,
      used: 0
    },
    {
      enterpriseId: 'ENT-10004',
      company: '山东省智联测绘科技有限公司',
      instance: 'SD-SI-001',
      product: '地基差分增强',
      spec: '差分服务-按量-1月',
      isDefault: false,
      total: 0,
      used: 0
    },
    {
      enterpriseId: 'ENT-10004',
      company: '山东省智联测绘科技有限公司',
      instance: 'SD-SI-001',
      product: '高精度定位服务',
      spec: 'RTK账号-试用',
      isDefault: false,
      total: 500,
      used: 0
    },
    {
      enterpriseId: 'ENT-10004',
      company: '山东省智联测绘科技有限公司',
      instance: 'SD-SI-001',
      product: '星基快速接入包',
      spec: '星基标准-季付',
      isDefault: false,
      total: 200,
      used: 120
    },
    {
      enterpriseId: 'ENT-10004',
      company: '山东省智联测绘科技有限公司',
      instance: 'SD-SI-001',
      product: 'CORS 外置账号',
      spec: '外置账号-10个',
      isDefault: false,
      total: 10,
      used: 3
    },
    {
      enterpriseId: 'ENT-10004',
      company: '山东省智联测绘科技有限公司',
      instance: 'SD-SI-002',
      product: '企业导航资源池',
      spec: '大批量授权-连续计费',
      isDefault: true,
      total: 100000,
      used: 99500
    }
  ],
  resourceOrders: [
    {
      no: 'POOL-20260427001',
      type: 'SDK',
      company: '新加坡智联科技有限公司',
      product: '定位增强服务',
      spec: '定位增强服务 · 1000次/月',
      quantity: 300,
      deviceAutoStock: '是',
      activateMode: '设备SN绑定',
      importSn: 'SN-SG-240001\nSN-SG-240002',
      accountPrefix: '',
      sapRef: 'SAP-440012',
      remark: '标准开通',
      status: '已完成'
    },
    {
      no: 'POOL-20260427002',
      type: 'CORS账号',
      company: '欧洲智联科技有限公司',
      product: 'CORS 企业账号',
      spec: 'CORS 企业账号 · 50个账号额度',
      quantity: 20,
      deviceAutoStock: '',
      activateMode: '',
      importSn: '',
      accountPrefix: 'cors_eu_',
      sapRef: '',
      remark: '',
      status: '待处理'
    }
  ],
  sdkResources: [
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
      line: '地基业务'
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
      line: '星基业务'
    }
  ],
  corsResources: [
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
      line: 'CORS业务'
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
      line: 'CORS业务'
    }
  ],
  orders: [
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
      remark: '标准开通'
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
      remark: ''
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
      remark: '海外项目采购'
    }
  ],
  reconciliation: [
    { month: '2026-04', region: '新加坡', spec: '定位增强 1000次/月', active: 382, price: '¥8', amount: '¥3,056' },
    { month: '2026-04', region: '欧洲', spec: '星基标准版', active: 119, price: '¥20', amount: '¥2,380' },
    { month: '2026-04', region: '北美', spec: 'CORS 账号 50个', active: 41, price: '¥15', amount: '¥615' }
  ],
  exports: [
    { name: '2026年4月对账导出', type: '对账报表', scope: '按月/按区域/按规格', progress: '100%', status: '已完成' },
    { name: '资源使用报表', type: '资源报表', scope: '企业+区域', progress: '56%', status: '生成中' }
  ],
  /** 大客户 · 公司与账号信息（概要 §3） */
  clientCompanyProfile: {
    companyName: '新加坡智联科技有限公司',
    companyId: 'ENT-10001',
    ak: 'AK_SG_******',
    as: '********',
    si: 'SG-SI-001',
    sik: '********',
    entryMode: '手动入库',
    activateMode: '设备使用激活',
    billingMode: '连续计费',
    reconcileMode: '先付后用'
  },
  /** 大客户 · 企业资源中心：服务节点维度（资源信息卡片 / 资源列表共用） */
  clientEnterpriseResources: {
    rows: [
      {
        serviceNode: '全球总量',
        product: 'SDK 账号-连续计费-1个月',
        total: 5000,
        used: 234,
        unused: 4766,
        isGlobal: true
      },
      {
        serviceNode: 'NA（北美）',
        product: 'SDK 账号-连续计费-1个月',
        total: 1200,
        used: 89,
        unused: 1111,
        isGlobal: false
      },
      {
        serviceNode: 'EU（欧洲）',
        product: 'SDK 账号-连续计费-1个月',
        total: 1800,
        used: 67,
        unused: 1733,
        isGlobal: false
      },
      {
        serviceNode: '亚太',
        product: 'SDK 账号-连续计费-1个月',
        total: 2000,
        used: 78,
        unused: 1922,
        isGlobal: false
      }
    ]
  }
};
