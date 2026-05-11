(function () {
  'use strict';

  var SESSION_KEY = 'prototype:session';
  var OVERLAY_KEY = 'prototype:overlay';

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 极简 Markdown：**加粗**、行内 code，先做 HTML 转义再替换 */
  function formatMarkdownInlineRaw(line) {
    var parts = String(line || '').split('`');
    var i;
    var out = '';
    for (i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        out += String(parts[i])
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      } else {
        out += '<code>' + escapeHtml(parts[i]) + '</code>';
      }
    }
    return out;
  }

  /** 块级：## / ### 标题、- 无序、1. 有序、空行分段，供静态说明页 */
  function renderSimpleMarkdown(markdown) {
    var lines = String(markdown || '')
      .replace(/\r\n/g, '\n')
      .split('\n');
    var html = [];
    var i = 0;
    var inUl = false;
    var inOl = false;
    function closeLists() {
      if (inUl) {
        html.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        html.push('</ol>');
        inOl = false;
      }
    }
    while (i < lines.length) {
      var trimmed = String(lines[i] || '').trim();
      if (trimmed === '') {
        closeLists();
        i++;
        continue;
      }
      if (/^###\s+/.test(trimmed)) {
        closeLists();
        html.push('<h3>' + formatMarkdownInlineRaw(trimmed.replace(/^###\s+/, '')) + '</h3>');
        i++;
        continue;
      }
      if (/^##\s+/.test(trimmed)) {
        closeLists();
        html.push('<h2>' + formatMarkdownInlineRaw(trimmed.replace(/^##\s+/, '')) + '</h2>');
        i++;
        continue;
      }
      if (/^-\s+/.test(trimmed)) {
        if (inOl) {
          html.push('</ol>');
          inOl = false;
        }
        if (!inUl) {
          html.push('<ul>');
          inUl = true;
        }
        html.push('<li>' + formatMarkdownInlineRaw(trimmed.replace(/^-\s+/, '')) + '</li>');
        i++;
        continue;
      }
      if (/^\d+\.\s+/.test(trimmed)) {
        if (inUl) {
          html.push('</ul>');
          inUl = false;
        }
        if (!inOl) {
          html.push('<ol>');
          inOl = true;
        }
        html.push('<li>' + formatMarkdownInlineRaw(trimmed.replace(/^\d+\.\s+/, '')) + '</li>');
        i++;
        continue;
      }
      closeLists();
      html.push('<p>' + formatMarkdownInlineRaw(trimmed) + '</p>');
      i++;
    }
    closeLists();
    return html.join('');
  }

  /** 列表/只读展示：去掉 leading +国别号（其后须有空格/横线，避免误伤 +86138… 连体存储） */
  function displayPhoneNoCountryCode(phone) {
    if (phone == null || String(phone).trim() === '') return '—';
    var s = String(phone).trim();
    var after = s.replace(/^\+\d{1,4}[\s\-]+/, '');
    if (after !== s) return (after.trim() || '—');
    return s;
  }

  /** 详情展示用：创建人、创建时间（优先 creatorEntries 首条，否则 createdBy / createdAt） */
  function primaryCreatedMeta(o) {
    if (!o) return { by: '—', at: '—' };
    if (Array.isArray(o.creatorEntries) && o.creatorEntries.length) {
      var c = o.creatorEntries[0];
      return { by: (c && c.name) || '—', at: (c && c.at) || '—' };
    }
    if (o.createdBy || o.createdAt) {
      return { by: o.createdBy || '—', at: o.createdAt || '—' };
    }
    return { by: '—', at: '—' };
  }

  var SERVICE_NODE_TYPE_OPTIONS = ['VRS', '华测地基', '华测星基', '中移地基', '雨燕', '华测功能码'];
  var CURRENCY_OPTIONS = ['CNY', 'USD'];

  /** resourcePools 行主键（与 overlay patches 对齐） */
  function poolRowKey(line) {
    if (!line) return '';
    return [line.enterpriseId || '', line.company || '', line.instance || '', line.product || '', line.spec || ''].join('\u0001');
  }

  /** 商品列表「商品图片」列：有 URL 则缩略图，否则占位 */
  function productImageCell(imageUrl, name) {
    var u = imageUrl && String(imageUrl).trim();
    if (u) {
      return (
        '<img class="product-thumb" src="' +
        escapeHtml(u) +
        '" alt="' +
        escapeHtml(name || '') +
        '" loading="lazy" />'
      );
    }
    return '<span class="product-thumb product-thumb--placeholder">无图</span>';
  }

  var PRODUCT_IMG_MAX_BYTES = 2 * 1024 * 1024;

  /** 上传校验：JPEG/PNG，不超过 2MB（仅本地演示） */
  function validateProductImageFile(file) {
    if (!file) return { ok: false, message: '请选择图片文件' };
    var t = String(file.type || '').toLowerCase();
    var extOk = /\.(jpe?g|png)$/i.test(file.name || '');
    if (t !== 'image/jpeg' && t !== 'image/png' && !extOk) {
      return { ok: false, message: '仅支持 JPG、PNG 格式' };
    }
    if (!file.size) return { ok: false, message: '请选择有效的图片文件' };
    if (file.size > PRODUCT_IMG_MAX_BYTES) return { ok: false, message: '图片不能超过 2MB' };
    return { ok: true };
  }

  /** 新建/编辑商品 · 可选图片上传（值写入隐藏的 #prefix-img，可为 data URL 或既有 http URL） */
  function buildProductImageUploadFieldHtml(prefix) {
    var lbl = prefix + '-img-lbl';
    var svgPlus =
      '<svg class="product-img-upload__plus" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    return (
      '<div class="form-field product-img-upload-field">' +
      '<span class="drawer-field-label" id="' +
      lbl +
      '">商品图片</span>' +
      '<div class="product-img-upload" id="' +
      prefix +
      '-img-upload">' +
      '<input type="hidden" id="' +
      prefix +
      '-img" value="" autocomplete="off" />' +
      '<input type="file" id="' +
      prefix +
      '-img-file" class="product-img-upload__input" accept="image/jpeg,image/png,.jpg,.jpeg,.png" aria-labelledby="' +
      lbl +
      '" tabindex="-1" />' +
      '<div class="product-img-upload__row">' +
      '<button type="button" class="product-img-upload__zone" id="' +
      prefix +
      '-img-zone">' +
      svgPlus +
      '<span class="product-img-upload__zone-text">上传</span>' +
      '</button>' +
      '<p class="product-img-upload__hint">支持格式：jpg/png，不能超过2MB</p>' +
      '</div>' +
      '<div class="product-img-upload__preview-wrap" hidden>' +
      '<img id="' +
      prefix +
      '-img-preview" class="product-img-upload__thumb" alt="" decoding="async" />' +
      '<button type="button" class="link-btn product-img-upload__clear" id="' +
      prefix +
      '-img-clear">移除</button>' +
      '</div>' +
      '</div></div>'
    );
  }

  function syncProductImageUploadUi(dr, prefix) {
    var wrap = dr.querySelector('#' + prefix + '-img-upload');
    if (!wrap) return;
    var hidden = dr.querySelector('#' + prefix + '-img');
    var file = dr.querySelector('#' + prefix + '-img-file');
    var row = wrap.querySelector('.product-img-upload__row');
    var previewWrap = wrap.querySelector('.product-img-upload__preview-wrap');
    var previewImg = dr.querySelector('#' + prefix + '-img-preview');
    var v = hidden && hidden.value ? String(hidden.value).trim() : '';
    var hasPic = !!(v && (v.indexOf('data:image') === 0 || v.indexOf('http') === 0 || v.indexOf('https') === 0 || v.indexOf('blob:') === 0 || v.charAt(0) === '/'));
    if (hasPic && previewImg && row && previewWrap) {
      previewImg.src = v;
      previewImg.alt = '商品图片预览';
      previewWrap.hidden = false;
      row.hidden = true;
    } else {
      if (previewImg) {
        previewImg.removeAttribute('src');
        previewImg.alt = '';
      }
      if (previewWrap) previewWrap.hidden = true;
      if (row) row.hidden = false;
      if (!v && file) file.value = '';
      if (!v && hidden) hidden.value = '';
    }
  }

  function wireProductImageUploadField(dr, prefix) {
    var wrap = dr.querySelector('#' + prefix + '-img-upload');
    if (!wrap) return;
    var hidden = dr.querySelector('#' + prefix + '-img');
    var file = dr.querySelector('#' + prefix + '-img-file');
    var zone = dr.querySelector('#' + prefix + '-img-zone');
    var btnClear = dr.querySelector('#' + prefix + '-img-clear');
    if (!hidden || !file || !zone) return;

    zone.addEventListener('click', function () {
      if (!wrap.classList.contains('product-img-upload--busy')) file.click();
    });

    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var vr = validateProductImageFile(f);
      if (!vr.ok) {
        toast(vr.message, 'error');
        file.value = '';
        return;
      }
      wrap.classList.add('product-img-upload--busy');
      var reader = new FileReader();
      reader.onload = function () {
        wrap.classList.remove('product-img-upload--busy');
        var res = reader.result;
        if (typeof res === 'string') {
          hidden.value = res;
          syncProductImageUploadUi(dr, prefix);
        }
      };
      reader.onerror = function () {
        wrap.classList.remove('product-img-upload--busy');
        toast('图片读取失败，请重试', 'error');
        file.value = '';
      };
      reader.readAsDataURL(f);
    });

    if (btnClear) {
      btnClear.addEventListener('click', function () {
        hidden.value = '';
        file.value = '';
        syncProductImageUploadUi(dr, prefix);
      });
    }
  }

  /** 商品绑定的服务套餐名称列表（汇总全部 serviceCombos.packageNames；兼容旧数据 availablePackages） */
  function productPackageNames(p) {
    if (!p) return [];
    var raw = [];
    if (Array.isArray(p.serviceCombos) && p.serviceCombos.length) {
      p.serviceCombos.forEach(function (c) {
        if (c && Array.isArray(c.packageNames)) {
          c.packageNames.forEach(function (nm) {
            var t = String(nm || '').trim();
            if (t) raw.push(t);
          });
        }
      });
    }
    var names = uniqValues(raw);
    if (!names.length && p.availablePackages && String(p.availablePackages).trim()) {
      names = uniqValues(
        String(p.availablePackages)
          .split(/[、,]/g)
          .map(function (x) {
            return String(x).trim();
          })
          .filter(Boolean)
      );
    }
    return names;
  }

  /** 商品详情：单个套餐卡片（展示配置中心关键字段） */
  function buildProductDetailPackageCardHtml(pkg, fallbackName) {
    var title = (pkg && pkg.name) || fallbackName || '—';
    function kv(k, v) {
      var display = v != null && String(v).trim() !== '' ? String(v).trim() : '';
      if (!display) return '';
      return (
        '<div class="product-detail-pkg-card__kv">' +
        '<span class="product-detail-pkg-card__k">' +
        escapeHtml(k) +
        '</span>' +
        '<span class="product-detail-pkg-card__v">' +
        escapeHtml(display) +
        '</span></div>'
      );
    }
    if (!pkg || !pkg.node) {
      return (
        '<article class="product-detail-pkg-card product-detail-pkg-card--missing" aria-label="套餐 ' +
        escapeHtml(title) +
        '">' +
        '<header class="product-detail-pkg-card__head">' +
        '<span class="product-detail-pkg-card__title">' +
        escapeHtml(title) +
        '</span>' +
        '</header>' +
        '<p class="product-detail-pkg-card__missing-hint">未在配置中心找到该套餐定义（演示）。</p>' +
        '</article>'
      );
    }
    var tsl = pkg.tslEnabled === true ? '是' : '否';
    var cmp = pkg.compressEnabled === true ? '是' : '否';
    var kvs =
      kv('服务节点', pkg.node) +
      kv('商品类型', pkg.spec || pkg.auth) +
      kv('挂载点', pkg.mount) +
      kv('端口', pkg.port != null ? String(pkg.port) : '') +
      kv('坐标系', pkg.coord) +
      kv('最大在线', pkg.maxOnline != null ? String(pkg.maxOnline) : '') +
      kv('TSL', tsl) +
      kv('压缩', cmp);
    var src = pkg.sources && String(pkg.sources).trim() ? pkg.sources : '';
    var srcBlock = src
      ? '<p class="product-detail-pkg-card__sources"><span class="product-detail-pkg-card__k">数据源</span>' +
        escapeHtml(src) +
        '</p>'
      : '';
    return (
      '<article class="product-detail-pkg-card" aria-label="套餐 ' +
      escapeHtml(pkg.name) +
      '">' +
      '<header class="product-detail-pkg-card__head">' +
      '<span class="product-detail-pkg-card__title">' +
      escapeHtml(pkg.name) +
      '</span>' +
      '</header>' +
      '<div class="product-detail-pkg-card__grid">' +
      kvs +
      '</div>' +
      srcBlock +
      '</article>'
    );
  }

  function buildProductAvailablePackagesSectionHtml(p) {
    var names = productPackageNames(p);
    if (!names.length) {
      return (
        '<section class="drawer-detail__section">' +
        '<h3 class="drawer-detail__section-title">可用服务套餐</h3>' +
        '<p class="drawer-detail__note drawer-detail__note--empty">暂无绑定套餐</p>' +
        '</section>'
      );
    }
    var all = getData().packages || [];
    var cards = names.map(function (nm) {
      var found = all.find(function (x) {
        return x.name === nm;
      });
      return buildProductDetailPackageCardHtml(found, nm);
    });
    return (
      '<section class="drawer-detail__section">' +
      '<h3 class="drawer-detail__section-title">可用服务套餐</h3>' +
      '<p class="product-detail-pkg-intro">按套餐展示关键参数，便于与配置中心定义核对；一商品可绑定多个套餐。</p>' +
      '<div class="product-detail-pkg-stack">' +
      cards.join('') +
      '</div></section>'
    );
  }

  /** 商品列表「可用服务套餐」列：多套餐名称标签 */
  function formatProductPackagesListCell(r) {
    var names = productPackageNames(r);
    if (!names.length) return '—';
    return (
      '<div class="product-list-pkg-cell">' +
      names
        .map(function (n) {
          return '<span class="product-list-pkg-chip">' + escapeHtml(n) + '</span>';
        })
        .join('') +
      '</div>'
    );
  }

  /** 商品详情抽屉（与节点/套餐详情统一的 drawer-detail 信息页风格） */
  function buildProductDetailDrawerHtml(p) {
    if (!p) return '';
    var createdMeta = primaryCreatedMeta(p);

    var stOk = (p.status || '') === '上架';
    var statusTag =
      '<span class="tag ' +
      (stOk ? 'tag--ok' : 'tag--off') +
      '">' +
      escapeHtml(p.status || '—') +
      '</span>';
    var refTag =
      '<span class="tag ' +
      (p.referenced ? 'tag--warn' : 'tag--ok') +
      '">' +
      (p.referenced ? '已引用' : '未引用') +
      '</span>';

    var lead =
      '<header class="drawer-detail__lead">' +
      '<p class="drawer-detail__title-inline">' +
      escapeHtml(p.name || '—') +
      '</p>' +
      '<div class="drawer-detail__lead-meta">' +
      '<span class="drawer-detail__pill">' +
      escapeHtml(p.type || '—') +
      '</span>' +
      '<span class="drawer-detail__code">' +
      escapeHtml(p.id || '—') +
      '</span>' +
      statusTag +
      refTag +
      '</div>' +
      '</header>';

    var formLabel = p.productForm === 'bundle' ? '组合商品' : '标准商品';
    var sellSection = drawerDetailSection(
      '售卖与属性',
      drawerDetailDlRow('产品线', p.productLine || p.line) +
        drawerDetailDlRow('国家/地区', p.region) +
        drawerDetailDlRow('价格', p.price) +
        drawerDetailDlRow('计费方式', p.billingMode) +
        drawerDetailDlRow('鉴权方式', p.authMethod) +
        drawerDetailDlRow('商品形态', formLabel)
    );

    var packagesSection = buildProductAvailablePackagesSectionHtml(p);

    var comboSection = '';
    if (Array.isArray(p.serviceCombos) && p.serviceCombos.length && p.serviceCombos[0]) {
      var c = p.serviceCombos[0];
      comboSection = drawerDetailSection(
        '接入配置',
        drawerDetailDlRow('商品类型', c.productType) + drawerDetailDlRow('服务节点', c.node)
      );
    }

    var updateSection = drawerDetailSection(
      '更新信息',
      drawerDetailDlRow('更新人', p.updatedBy) + drawerDetailDlRow('更新时间', p.updatedAt)
    );

    var createSection = drawerDetailSection(
      '创建信息',
      drawerDetailDlRow('创建人', createdMeta.by) + drawerDetailDlRow('创建时间', createdMeta.at)
    );

    return (
      '<div class="drawer-detail">' +
      lead +
      sellSection +
      comboSection +
      packagesSection +
      drawerDetailNoteBlock('商品摘要', p.summary) +
      drawerDetailNoteBlock('商品描述', p.description) +
      drawerDetailNoteBlock('备注', p.remark) +
      updateSection +
      createSection +
      '</div>'
    );
  }

  function openProductDetailDrawer(productId) {
    var p = getData().products.find(function (x) {
      return x.id === productId;
    });
    if (!p) {
      toast('未找到商品', 'error');
      return;
    }
    openDrawer('商品详情 · ' + p.name, buildProductDetailDrawerHtml(p), null, { readonly: true });
  }

  function findProductById(productId) {
    return (getData().products || []).find(function (x) {
      return x.id === productId;
    });
  }

  function buildProductEditReadonlySummaryHtml(p) {
    function row(label, value, mono) {
      var raw = value != null && String(value).trim() !== '' ? String(value) : '—';
      var monoCls = mono ? ' drawer-readonly-summary__value--mono' : '';
      return (
        '<div class="drawer-readonly-summary__row">' +
        '<span class="drawer-readonly-summary__label">' +
        escapeHtml(label) +
        '</span>' +
        '<span class="drawer-readonly-summary__value' +
        monoCls +
        '">' +
        escapeHtml(raw) +
        '</span></div>'
      );
    }
    return (
      '<div class="drawer-readonly-summary" role="region" aria-label="商品标识（只读）">' +
      '<div class="drawer-readonly-summary__head">' +
      '<span class="drawer-readonly-summary__title">商品标识</span>' +
      '<span class="drawer-readonly-summary__badge">只读</span>' +
      '</div>' +
      '<p class="drawer-readonly-summary__hint">商品名称不可修改；编码用于列表与关联，如需调整请联系管理员（演示）。</p>' +
      '<div class="drawer-readonly-summary__list">' +
      row('商品名称', p.name, false) +
      row('商品编码', p.id, true) +
      '</div></div>'
    );
  }

  function initialCombosForProductEdit(p) {
    if (!p) return [];
    if (Array.isArray(p.serviceCombos) && p.serviceCombos.length) {
      return p.serviceCombos.map(function (c) {
        return {
          productType: (c && c.productType) || '',
          node: (c && c.node) || '',
          packageNames: Array.isArray(c && c.packageNames) ? c.packageNames.slice() : []
        };
      });
    }
    if (p.productForm === 'bundle') return [];
    var pt = p.type || p.authMethod || '';
    var pkgs = productPackageNames(p);
    return [{ productType: pt, node: '', packageNames: pkgs }];
  }

  function mountProductEditDrawerForm(dr, p) {
    if (!dr.querySelector('#pe-svc-rows')) return;

    wireProductServiceConfigBlock(dr, {
      rowsSelector: '#pe-svc-rows',
      addButtonSelector: '#pe-svc-add',
      rowIdPrefix: 'pe-svc',
      initialCombos: initialCombosForProductEdit(p)
    });

    wireProductImageUploadField(dr, 'pe');
    var peImgH = dr.querySelector('#pe-img');
    var pePl = dr.querySelector('#pe-pl');
    var peRegion = dr.querySelector('#pe-region');
    var pePrice = dr.querySelector('#pe-price');
    var peSum = dr.querySelector('#pe-sum');
    var peDesc = dr.querySelector('#pe-desc');
    var peRemark = dr.querySelector('#pe-remark');
    if (peImgH) peImgH.value = p.image || '';
    syncProductImageUploadUi(dr, 'pe');
    if (pePl) pePl.value = p.productLine || p.line || '云芯产品线';
    if (peRegion) peRegion.value = p.region || '';
    if (pePrice) pePrice.value = p.price || '';
    if (peSum) peSum.value = p.summary || '';
    if (peDesc) peDesc.value = p.description || '';
    if (peRemark) peRemark.value = p.remark || '';
  }

  function openProductEditDrawer(productId) {
    var p = findProductById(productId);
    if (!p) {
      toast('未找到商品', 'error');
      return;
    }
    var stableName = p.name;
    openDrawer(
      '编辑商品 · ' + p.name,
      '<div class="drawer-form-stack drawer-form-stack--node-edit">' +
        buildProductEditReadonlySummaryHtml(p) +
        '<div class="drawer-edit-editable">' +
        '<div class="drawer-edit-editable__head">' +
        '<span class="drawer-edit-editable__title">商品配置</span>' +
        '<span class="drawer-edit-editable__hint">字段与新增商品一致</span>' +
        '</div>' +
        '<div class="drawer-edit-editable__form">' +
        '<div class="form-field"><label for="pe-pl"><span class="field-required-mark">*</span>产品线</label>' +
        '<select id="pe-pl" required>' +
        '<option value="">请选择</option>' +
        '<option value="云芯产品线">云芯产品线</option>' +
        '<option value="星基产品线">星基产品线</option>' +
        '<option value="账号与接入">账号与接入</option>' +
        '</select></div>' +
        '<div class="product-service-config">' +
        '<div class="product-service-config__head">' +
        '<p class="product-service-config__title">服务配置</p>' +
        '<button type="button" class="link-btn product-service-config__add" id="pe-svc-add">添加</button>' +
        '</div>' +
        '<div class="drawer-callout drawer-callout--warn product-service-config__tip" role="note">' +
        '<svg class="product-service-config__tip-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 8v5M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<p class="drawer-callout__text">提示：配置时不能添加相同服务节点</p>' +
        '</div>' +
        '<div id="pe-svc-rows" class="product-service-config__rows"></div>' +
        '</div>' +
        buildProductImageUploadFieldHtml('pe') +
        '<div class="form-field"><label for="pe-region">国家/地区</label>' +
        '<input id="pe-region" placeholder="如：全球 / 中国大陆" /></div>' +
        '<div class="form-field"><label for="pe-price"><span class="field-required-mark">*</span>价格</label>' +
        '<input id="pe-price" required placeholder="如：¥9,999 或面议" /></div>' +
        '<div class="form-field"><label for="pe-billing">计费方式</label>' +
        '<select id="pe-billing"><option value="连续计费" selected>连续计费</option></select></div>' +
        '<div class="form-field"><label for="pe-sum">商品摘要</label>' +
        '<input id="pe-sum" placeholder="一行摘要，用于列表或卡片副标题" /></div>' +
        '<div class="form-field"><label for="pe-desc">商品描述</label>' +
        '<textarea id="pe-desc" rows="4" placeholder="详细介绍"></textarea></div>' +
        '<div class="form-field"><label for="pe-remark">备注</label>' +
        '<input id="pe-remark" placeholder="内部备注" /></div>' +
        '</div></div></div>',
      function (dr, close) {
        var plVal = dr.querySelector('#pe-pl').value.trim();
        if (!plVal) {
          toast('请选择产品线', 'error');
          return;
        }
        var collected = collectProductServiceRowsFromDrawer(dr, '#pe-svc-rows');
        if (!collected.ok) {
          toast(collected.message, 'error');
          return;
        }
        var serviceCombos = collected.combos;
        var authMethod = uniqValues(
          serviceCombos.map(function (c) {
            return c.productType;
          })
        ).join(' / ');
        var pkgFlat = [];
        serviceCombos.forEach(function (c) {
          (c.packageNames || []).forEach(function (n) {
            if (n && pkgFlat.indexOf(n) < 0) pkgFlat.push(n);
          });
        });
        var availablePackages = pkgFlat.length ? pkgFlat.join('、') : '—';
        var primaryType = (serviceCombos[0] && serviceCombos[0].productType) || '软件服务';

        var pr = dr.querySelector('#pe-price').value.trim();
        if (!pr) {
          toast('请填写价格', 'error');
          return;
        }

        var ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
        saveProductPatchByName(stableName, {
          image: dr.querySelector('#pe-img').value.trim(),
          productLine: plVal,
          region: dr.querySelector('#pe-region').value.trim(),
          price: pr,
          billingMode: '连续计费',
          summary: dr.querySelector('#pe-sum').value.trim(),
          description: dr.querySelector('#pe-desc').value.trim(),
          remark: dr.querySelector('#pe-remark').value.trim(),
          authMethod: authMethod || '—',
          availablePackages: availablePackages || '—',
          productForm: 'standard',
          serviceCombos: serviceCombos,
          type: primaryType,
          line: plVal,
          updatedBy: 'SuperAdmin',
          updatedAt: ts
        });
        toast('已保存', 'success');
        close();
        render();
      },
      { primaryLabel: '保存' },
      function (dr) {
        setTimeout(function () {
          mountProductEditDrawerForm(dr, p);
        }, 0);
      }
    );
  }

  /** 商品规格详情（只读抽屉，布局对齐商品详情 drawer-detail） */
  function buildSpecDetailDrawerHtml(s) {
    if (!s) return '';
    var createdMeta = primaryCreatedMeta(s);
    var agent = s.agentPrice || s.price || '—';
    var term = s.terminalPrice || s.price || '—';
    var stock = s.stock != null ? String(s.stock) : '—';
    var refTag =
      '<span class="tag ' +
      (s.referenced ? 'tag--warn' : 'tag--ok') +
      '">' +
      (s.referenced ? '已引用' : '未引用') +
      '</span>';
    var leadTitle = s.template || s.product || s.name || '—';
    var lead =
      '<header class="drawer-detail__lead">' +
      '<p class="drawer-detail__title-inline">' +
      escapeHtml(leadTitle) +
      '</p>' +
      '<div class="drawer-detail__lead-meta">' +
      '<span class="drawer-detail__pill">' +
      escapeHtml(s.name || '—') +
      '</span>' +
      '<span class="drawer-detail__code">' +
      escapeHtml(s.id || '—') +
      '</span>' +
      refTag +
      '</div>' +
      '<p class="drawer-detail__endpoint">' +
      escapeHtml(s.product || '—') +
      '</p>' +
      '</header>';

    var specSection = drawerDetailSection(
      '规格信息',
      drawerDetailDlRow('规格名称', s.template) +
        drawerDetailDlRow('PN号', s.pn, { mono: true }) +
        drawerDetailDlRow('商品名称', s.product) +
        drawerDetailDlRow('商品规格', s.name) +
        drawerDetailDlRow('规格编码', s.id, { mono: true })
    );

    var priceSection = drawerDetailSection(
      '价格与库存',
      drawerDetailDlRow('币种', s.currency || '—') +
        drawerDetailDlRow('代理商价格', agent) +
        drawerDetailDlRow('终端价格', term) +
        drawerDetailDlRow('库存', stock)
    );

    var updateSection = drawerDetailSection(
      '更新信息',
      drawerDetailDlRow('更新人', s.updatedBy) + drawerDetailDlRow('更新时间', s.updatedAt)
    );

    var createSection = drawerDetailSection(
      '创建信息',
      drawerDetailDlRow('创建人', createdMeta.by) + drawerDetailDlRow('创建时间', createdMeta.at)
    );

    return (
      '<div class="drawer-detail">' +
      lead +
      specSection +
      priceSection +
      updateSection +
      createSection +
      '</div>'
    );
  }

  function openSpecDetailDrawer(specId) {
    var s = getData().specs.find(function (x) {
      return x.id === specId;
    });
    if (!s) {
      toast('未找到商品规格', 'error');
      return;
    }
    var sub = s.template || s.product || s.name || '规格';
    openDrawer('商品规格详情 · ' + sub, buildSpecDetailDrawerHtml(s), null, { readonly: true });
  }

  /** 规格下拉：含当前商品不在商品列表时的回填 */
  function buildProductOptionsForSpecSelect(products, selectedProductName) {
    var names = products.map(function (p) {
      return p.name;
    });
    var extra =
      selectedProductName && names.indexOf(selectedProductName) < 0
        ? '<option selected>' + escapeHtml(selectedProductName) + '</option>'
        : '';
    var opts = products
      .map(function (p) {
        var sel = p.name === selectedProductName ? ' selected' : '';
        return '<option' + sel + '>' + escapeHtml(p.name) + '</option>';
      })
      .join('');
    return extra + opts;
  }

  /** 规格名称：支持“数值 + 天/月/年”拆分编辑 */
  function parseSpecNameParts(name) {
    var raw = String(name || '').trim();
    var m = raw.match(/^(.*?)(\d+)\s*(天|月|年)$/);
    if (!m) return { value: raw, unit: '月' };
    return { value: m[1] + m[2], unit: m[3] };
  }

  function buildSpecName(value, unit) {
    var v = String(value || '').trim();
    var u = String(unit || '').trim() || '月';
    return v ? v + u : '';
  }

  /** 商品规格编辑抽屉顶部：PN / 绑定商品 / 规格时长 / 编码不可改 */
  function buildSpecEditReadonlySummaryHtml(s) {
    function row(label, value, mono) {
      var raw = value != null && String(value).trim() !== '' ? String(value) : '—';
      var monoCls = mono ? ' drawer-readonly-summary__value--mono' : '';
      return (
        '<div class="drawer-readonly-summary__row">' +
        '<span class="drawer-readonly-summary__label">' +
        escapeHtml(label) +
        '</span>' +
        '<span class="drawer-readonly-summary__value' +
        monoCls +
        '">' +
        escapeHtml(raw) +
        '</span></div>'
      );
    }
    return (
      '<div class="drawer-readonly-summary" role="region" aria-label="规格标识（只读）">' +
      '<div class="drawer-readonly-summary__head">' +
      '<span class="drawer-readonly-summary__title">规格标识</span>' +
      '<span class="drawer-readonly-summary__badge">只读</span>' +
      '</div>' +
      '<p class="drawer-readonly-summary__hint">PN号、商品名称与商品规格在创建后不可修改；规格编码用于列表与关联（演示）。</p>' +
      '<div class="drawer-readonly-summary__list">' +
      row('PN号', s.pn, true) +
      row('商品名称', s.product, false) +
      row('商品规格', s.name, false) +
      row('规格编码', s.id, true) +
      '</div></div>'
    );
  }

  /** 商品规格编辑：可改字段（与列表业务字段一致） */
  function buildSpecEditEditableFormHtml(preset) {
    preset = preset || {};
    var currencyVal = preset.currency || 'CNY';
    if (currencyVal && CURRENCY_OPTIONS.indexOf(currencyVal) < 0) currencyVal = 'CNY';
    var currencyOptionsHtml = CURRENCY_OPTIONS.map(function (c) {
      return (
        '<option value="' +
        escapeHtml(c) +
        '"' +
        (String(c) === String(currencyVal) ? ' selected' : '') +
        '>' +
        escapeHtml(c) +
        '</option>'
      );
    }).join('');
    var stockVal = preset.stock != null && preset.stock !== '' ? String(preset.stock) : '0';
    return (
      '<div class="drawer-edit-editable">' +
      '<div class="drawer-edit-editable__head">' +
      '<span class="drawer-edit-editable__title">可编辑信息</span>' +
      '<span class="drawer-edit-editable__hint">价格与库存可在此维护</span>' +
      '</div>' +
      '<div class="drawer-edit-editable__form">' +
      '<div class="form-field"><label for="stemplate"><span class="field-required-mark">*</span>规格名称</label>' +
      '<input id="stemplate" required placeholder="如 导航SDK内置账号" value="' +
      escapeHtml(preset.template || '') +
      '" /></div>' +
      '<div class="form-field"><label for="scur">币种</label><select id="scur">' +
      currencyOptionsHtml +
      '</select></div>' +
      '<div class="form-field"><label for="sagent">代理商价格</label><input id="sagent" value="' +
      escapeHtml(preset.agentPrice || preset.price || '¥0') +
      '" /></div>' +
      '<div class="form-field"><label for="sterm">终端价格</label><input id="sterm" value="' +
      escapeHtml(preset.terminalPrice || preset.price || '¥0') +
      '" /></div>' +
      '<div class="form-field"><label for="sstock">库存</label><input id="sstock" type="number" value="' +
      escapeHtml(stockVal) +
      '" min="0" step="1" /></div>' +
      '</div></div>'
    );
  }

  /** 商品规格新增：右侧抽屉表单 */
  function buildSpecDrawerFormHtml(products, preset) {
    preset = preset || {};
    var fp = products[0] && products[0].name;
    var currencyVal = preset.currency || 'CNY';
    if (currencyVal && CURRENCY_OPTIONS.indexOf(currencyVal) < 0) currencyVal = 'CNY';
    var currencyOptionsHtml = CURRENCY_OPTIONS
      .map(function (c) {
        return (
          '<option value="' +
          escapeHtml(c) +
          '"' +
          (String(c) === String(currencyVal) ? ' selected' : '') +
          '>' +
          escapeHtml(c) +
          '</option>'
        );
      })
      .join('');
    var prodSel = preset.product != null && preset.product !== '' ? preset.product : fp;
    var po = buildProductOptionsForSpecSelect(products, prodSel);
    var stockVal = preset.stock != null && preset.stock !== '' ? String(preset.stock) : '0';
    var specParts = parseSpecNameParts(preset.name || '');
    return (
      '<div class="drawer-form-stack">' +
      '<div class="form-field"><label><span class="field-required-mark">*</span>商品</label><select id="sprod" required>' +
      po +
      '</select></div>' +
      '<div class="form-field"><label><span class="field-required-mark">*</span>规格</label><div style="display:flex;gap:0.5rem">' +
      '<input id="sn" required placeholder="如 5" value="' +
      escapeHtml(specParts.value || '') +
      '" style="flex:1" />' +
      '<select id="sn-unit" style="width:96px">' +
      '<option value="天"' +
      (specParts.unit === '天' ? ' selected' : '') +
      '>天</option>' +
      '<option value="月"' +
      (specParts.unit === '月' ? ' selected' : '') +
      '>月</option>' +
      '<option value="年"' +
      (specParts.unit === '年' ? ' selected' : '') +
      '>年</option>' +
      '</select></div></div>' +
      '<div class="form-field"><label><span class="field-required-mark">*</span>规格名称</label><input id="stemplate" required placeholder="如 导航SDK内置账号" value="' +
      escapeHtml(preset.template || '') +
      '" /></div>' +
      '<div class="form-field"><label><span class="field-required-mark">*</span>PN号</label><input id="spn" required placeholder="Part Number，用于标识该规格的物料编码" value="' +
      escapeHtml(preset.pn || '') +
      '" /></div>' +
      '<div class="form-field"><label>币种</label><select id="scur">' +
      currencyOptionsHtml +
      '</select></div>' +
      '<div class="form-field"><label>代理商价格</label><input id="sagent" value="' +
      escapeHtml(preset.agentPrice || preset.price || '¥0') +
      '" /></div>' +
      '<div class="form-field"><label>终端价格</label><input id="sterm" value="' +
      escapeHtml(preset.terminalPrice || preset.price || '¥0') +
      '" /></div>' +
      '<div class="form-field"><label>库存</label><input id="sstock" type="number" value="' +
      escapeHtml(stockVal) +
      '" min="0" step="1" /></div>' +
      '</div>'
    );
  }

  function openSpecFormDrawer(products, preset, editId) {
    var cur =
      editId &&
      getData().specs &&
      getData().specs.find(function (x) {
        return x.id === editId;
      });
    if (editId && !cur) {
      toast('未找到商品规格', 'error');
      return;
    }
    var seed = cur || preset || {};
    var title = editId ? '编辑商品规格 · ' + (seed.template || seed.name || '规格') : '新增商品规格';
    var html = editId
      ? '<div class="drawer-form-stack drawer-form-stack--node-edit">' +
        buildSpecEditReadonlySummaryHtml(seed) +
        buildSpecEditEditableFormHtml(seed) +
        '</div>'
      : buildSpecDrawerFormHtml(products, preset);
    openDrawer(
      title,
      html,
      function (dr, close) {
        var stockRaw = dr.querySelector('#sstock').value;
        var stockNum = stockRaw === '' ? 0 : Number(stockRaw);
        if (Number.isNaN(stockNum) || stockNum < 0) {
          toast('库存需为不小于 0 的数字', 'error');
          return;
        }
        var currency = (dr.querySelector('#scur').value || '').trim() || 'CNY';
        var agentPrice = dr.querySelector('#sagent').value.trim() || '¥0';
        var termPrice = dr.querySelector('#sterm').value.trim() || '¥0';
        var remark = (dr.querySelector('#sremark').value || '').trim();
        var template = dr.querySelector('#stemplate').value.trim();

        if (editId) {
          if (!cur) {
            toast('未找到规格', 'error');
            return;
          }
          if (!template) {
            toast('请填写规格名称', 'error');
            return;
          }
          var merged = Object.assign({}, cur, {
            template: template,
            currency: currency,
            agentPrice: agentPrice,
            terminalPrice: termPrice,
            stock: stockNum
          });
          delete merged.discount;
          delete merged.remark;
          delete merged.reviewedBy;
          delete merged.reviewedAt;
          var tsSave = new Date().toISOString().slice(0, 19).replace('T', ' ');
          merged.updatedBy = 'SuperAdmin';
          merged.updatedAt = tsSave;
          saveOverlaySpecPatch(editId, merged);
          toast('已保存规格', 'success');
        } else {
          var specNameBase = dr.querySelector('#sn').value.trim();
          var specUnit = dr.querySelector('#sn-unit').value;
          var specName = buildSpecName(specNameBase, specUnit);
          var prod = dr.querySelector('#sprod').value;
          var pn = dr.querySelector('#spn').value.trim();
          if (!specName || !prod || !template || !pn) {
            toast('请填写商品、商品规格、规格名称与 PN 号', 'error');
            return;
          }
          var tsNew = new Date().toISOString().slice(0, 19).replace('T', ' ');
          appendOverlay('specs', {
            id: 'SPEC-' + Date.now(),
            name: specName,
            product: prod,
            pn: pn,
            template: template,
            currency: currency,
            agentPrice: agentPrice,
            terminalPrice: termPrice,
            stock: stockNum,
            referenced: false,
            updatedBy: '当前登录用户',
            updatedAt: tsNew,
            creatorEntries: [{ name: '当前登录用户', at: tsNew }]
          });
          toast('已添加规格', 'success');
        }
        close();
        render();
      },
      { primaryLabel: '保存' }
    );
  }

  function getSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setSession(sess) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function isDemoClientAdmin() {
    var s = getSession();
    return !!(s && s.loggedIn && s.demoRole === 'client_admin');
  }

  /** 演示大客户登录对应的企业名称（PROTOTYPE_DATA.users.client） */
  function demoClientCompanyName() {
    if (!isDemoClientAdmin()) return '';
    var u = window.PROTOTYPE_DATA && window.PROTOTYPE_DATA.users && window.PROTOTYPE_DATA.users.client;
    return u && u.company ? String(u.company).trim() : '';
  }

  function getOverlay() {
    try {
      var raw = sessionStorage.getItem(OVERLAY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveOverlay(overlay) {
    sessionStorage.setItem(OVERLAY_KEY, JSON.stringify(overlay));
  }

  function appendOverlay(arrayKey, item) {
    var o = getOverlay();
    if (!o[arrayKey]) o[arrayKey] = [];
    o[arrayKey].push(item);
    saveOverlay(o);
  }

  /** 会话内按 id 覆盖规格行（编辑种子或 overlay 追加行） */
  function saveOverlaySpecPatch(specId, fullRow) {
    var overlay = getOverlay();
    if (!overlay.specPatches) overlay.specPatches = {};
    overlay.specPatches[specId] = fullRow;
    saveOverlay(overlay);
  }

  function clearOverlay() {
    sessionStorage.removeItem(OVERLAY_KEY);
  }

  /** 合并种子 + overlay：overlay 中各数组为追加行 */
  function getData() {
    var base = deepClone(window.PROTOTYPE_DATA || {});
    var o = getOverlay();
    var keys = [
      'enterprises',
      'instances',
      'resourceOrders',
      'serviceNodes',
      'packages',
      'products',
      'specs',
      'sdkResources',
      'corsResources',
      'reconciliation',
      'resourcePools',
      'dictionaries'
    ];
    keys.forEach(function (k) {
      if (Array.isArray(o[k]) && o[k].length) {
        base[k] = (base[k] || []).concat(o[k]);
      }
    });
    if (o.specPatches && typeof o.specPatches === 'object') {
      base.specs = (base.specs || []).map(function (s) {
        var patch = o.specPatches[s.id];
        return patch ? Object.assign({}, s, patch) : s;
      });
    }
    if (o.enterpriseRoles && typeof o.enterpriseRoles === 'object') {
      base.enterprises = (base.enterprises || []).map(function (e) {
        var patch = o.enterpriseRoles[e.id];
        return patch && Array.isArray(patch) ? Object.assign({}, e, { assignedRoles: patch.slice() }) : e;
      });
    }
    if (o.adminUserRoles && typeof o.adminUserRoles === 'object') {
      base.adminUsers = (base.adminUsers || []).map(function (u) {
        var key = u.id || u.email;
        var patch = o.adminUserRoles[key];
        return patch && Array.isArray(patch) ? Object.assign({}, u, { assignedRoles: patch.slice() }) : u;
      });
    }
    if (o.instancePatches && typeof o.instancePatches === 'object') {
      base.instances = (base.instances || []).map(function (inst) {
        var patch = o.instancePatches[inst.name];
        return patch ? Object.assign({}, inst, patch) : inst;
      });
    }
    if (o.sdkResourcePatches && typeof o.sdkResourcePatches === 'object') {
      base.sdkResources = (base.sdkResources || []).map(function (row) {
        var k = row.sdkResKey || row.regCode;
        var patch =
          k && o.sdkResourcePatches[k]
            ? o.sdkResourcePatches[k]
            : row.regCode && o.sdkResourcePatches[row.regCode]
              ? o.sdkResourcePatches[row.regCode]
              : null;
        return patch ? Object.assign({}, row, patch) : row;
      });
    }
    if (o.corsResourcePatches && typeof o.corsResourcePatches === 'object') {
      base.corsResources = (base.corsResources || []).map(function (row) {
        var k = row.account;
        var patch = k ? o.corsResourcePatches[k] : null;
        return patch ? Object.assign({}, row, patch) : row;
      });
    }
    if (o.resourcePoolPatches && typeof o.resourcePoolPatches === 'object') {
      base.resourcePools = (base.resourcePools || []).map(function (line) {
        var patch = o.resourcePoolPatches[poolRowKey(line)];
        return patch ? Object.assign({}, line, patch) : line;
      });
    }
    if (o.packagePatches && typeof o.packagePatches === 'object') {
      base.packages = (base.packages || []).map(function (p) {
        var patch = o.packagePatches[p.name];
        return patch ? Object.assign({}, p, patch) : p;
      });
    }
    if (o.dictionaryPatches && typeof o.dictionaryPatches === 'object') {
      base.dictionaries = (base.dictionaries || []).map(function (d) {
        var patch = d.id ? o.dictionaryPatches[d.id] : null;
        return patch ? Object.assign({}, d, patch) : d;
      });
    }
    var svcNodes = base.serviceNodes || [];
    if (o.serviceNodesDeletedCodes && o.serviceNodesDeletedCodes.length) {
      var snDel = {};
      o.serviceNodesDeletedCodes.forEach(function (c) {
        snDel[c] = true;
      });
      svcNodes = svcNodes.filter(function (n) {
        return !snDel[n.code];
      });
    }
    if (o.serviceNodePatches && typeof o.serviceNodePatches === 'object') {
      svcNodes = svcNodes.map(function (n) {
        var patch = o.serviceNodePatches[n.code];
        return patch ? Object.assign({}, n, patch) : n;
      });
    }
    base.serviceNodes = svcNodes;
    if (o.productPatchesByName && typeof o.productPatchesByName === 'object') {
      base.products = (base.products || []).map(function (p) {
        var patch = o.productPatchesByName[p.name];
        return patch ? Object.assign({}, p, patch) : p;
      });
    }
    return base;
  }

  function saveServiceNodeDeletion(code) {
    var overlay = getOverlay();
    if (!overlay.serviceNodesDeletedCodes) overlay.serviceNodesDeletedCodes = [];
    if (overlay.serviceNodesDeletedCodes.indexOf(code) < 0) overlay.serviceNodesDeletedCodes.push(code);
    if (Array.isArray(overlay.serviceNodes)) {
      overlay.serviceNodes = overlay.serviceNodes.filter(function (n) {
        return n.code !== code;
      });
    }
    saveOverlay(overlay);
  }

  function saveServiceNodePatch(code, fields) {
    var overlay = getOverlay();
    if (!overlay.serviceNodePatches) overlay.serviceNodePatches = {};
    overlay.serviceNodePatches[code] = Object.assign({}, overlay.serviceNodePatches[code] || {}, fields || {});
    saveOverlay(overlay);
  }

  function savePackagePatch(packageName, fields) {
    var overlay = getOverlay();
    if (!overlay.packagePatches) overlay.packagePatches = {};
    overlay.packagePatches[packageName] = Object.assign({}, overlay.packagePatches[packageName] || {}, fields || {});
    saveOverlay(overlay);
  }

  function saveDictionaryPatch(rowId, fields) {
    if (!rowId) return;
    var overlay = getOverlay();
    if (!overlay.dictionaryPatches) overlay.dictionaryPatches = {};
    overlay.dictionaryPatches[rowId] = Object.assign({}, overlay.dictionaryPatches[rowId] || {}, fields || {});
    saveOverlay(overlay);
  }

  /** 套餐「最大在线数」：留空表示不维护；有值则须为 [1,100000] 正整数 */
  function parseOptionalMaxOnlineInput(raw) {
    var maxRaw = raw != null ? String(raw).trim() : '';
    if (maxRaw === '') return { ok: true, value: null };
    if (!/^\d+$/.test(maxRaw)) return { ok: false };
    var n = parseInt(maxRaw, 10);
    if (n < 1 || n > 100000) return { ok: false };
    return { ok: true, value: n };
  }

  /** 商品补丁按名称合并（名称不可在原型中修改，作为稳定键） */
  function saveProductPatchByName(productName, fields) {
    var overlay = getOverlay();
    if (!overlay.productPatchesByName) overlay.productPatchesByName = {};
    overlay.productPatchesByName[productName] = Object.assign(
      {},
      overlay.productPatchesByName[productName] || {},
      fields || {}
    );
    saveOverlay(overlay);
  }

  function saveInstancePatch(instanceName, fields) {
    var overlay = getOverlay();
    if (!overlay.instancePatches) overlay.instancePatches = {};
    overlay.instancePatches[instanceName] = Object.assign(
      {},
      overlay.instancePatches[instanceName] || {},
      fields || {}
    );
    saveOverlay(overlay);
  }

  /** SDK 资源行补丁（按 sdkResKey 关联；演示会话内持久；兼容历史按 regCode 存的补丁） */
  function saveSdkResourcePatch(sdkResKey, fields) {
    if (!sdkResKey) return;
    var overlay = getOverlay();
    if (!overlay.sdkResourcePatches) overlay.sdkResourcePatches = {};
    overlay.sdkResourcePatches[sdkResKey] = Object.assign(
      {},
      overlay.sdkResourcePatches[sdkResKey] || {},
      fields || {}
    );
    saveOverlay(overlay);
  }

  function findSdkResourceBySdkResKey(sdkResKey) {
    if (!sdkResKey) return null;
    var list = getData().sdkResources || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].sdkResKey === sdkResKey) return list[i];
    }
    return null;
  }

  /** 激活时生成演示用注册码（仅已激活账号具备注册码） */
  function generateDemoSdkRegCode(seed) {
    var base = String(seed || 'X')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 10);
    if (!base) base = 'X';
    var t = Date.now().toString(36).toUpperCase().slice(-4);
    var r = Math.random().toString(36).toUpperCase().slice(2, 6);
    return 'REG-' + base + '-' + t + r;
  }

  /** CORS 账号行补丁（按账号名关联；演示会话内持久） */
  function saveCorsResourcePatch(account, fields) {
    if (!account) return;
    var overlay = getOverlay();
    if (!overlay.corsResourcePatches) overlay.corsResourcePatches = {};
    overlay.corsResourcePatches[account] = Object.assign(
      {},
      overlay.corsResourcePatches[account] || {},
      fields || {}
    );
    saveOverlay(overlay);
  }

  function findCorsResourceByAccount(account) {
    if (!account) return null;
    var list = getData().corsResources || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].account === account) return list[i];
    }
    return null;
  }

  function saveOverlayEnterpriseRoles(entId, roles) {
    var overlay = getOverlay();
    if (!overlay.enterpriseRoles) overlay.enterpriseRoles = {};
    overlay.enterpriseRoles[entId] = roles.slice();
    saveOverlay(overlay);
  }

  function saveOverlayAdminRoles(adminKey, roles) {
    var overlay = getOverlay();
    if (!overlay.adminUserRoles) overlay.adminUserRoles = {};
    overlay.adminUserRoles[adminKey] = roles.slice();
    saveOverlay(overlay);
  }

  /** 企业侧可选角色（大客户控制台账号） */
  var ENTERPRISE_ASSIGNABLE_ROLES = ['企业管理员', '业务操作员', '财务查看'];

  function formatAssignedRoles(arr, fallbackSingle) {
    if (arr && arr.length) return arr.join('、');
    return fallbackSingle || '—';
  }

  function platformAssignableRoleLabels() {
    var roles = (window.PROTOTYPE_DATA && window.PROTOTYPE_DATA.roles) || [];
    return roles
      .filter(function (r) {
        return r.code !== 'CLIENT_ADMIN';
      })
      .map(function (r) {
        return r.name;
      });
  }

  function buildEnterpriseRoleConfigDrawerHtml(entId, row) {
    var selected = row && Array.isArray(row.assignedRoles) && row.assignedRoles.length ? row.assignedRoles.slice() : ['企业管理员'];
    var boxes = ENTERPRISE_ASSIGNABLE_ROLES.map(function (rn) {
      var chk = selected.indexOf(rn) >= 0 ? ' checked' : '';
      return (
        '<label class="role-picker__item">' +
        '<input type="checkbox" name="ent-assign-role" value="' +
        escapeHtml(rn) +
        '"' +
        chk +
        ' />' +
        '<span>' +
        escapeHtml(rn) +
        '</span></label>'
      );
    }).join('');
    return (
      '<div class="drawer-form-stack">' +
      '<p class="role-picker-scope">企业：<strong>' +
      escapeHtml(row ? row.name : entId) +
      '</strong></p>' +
      '<fieldset class="role-picker-fieldset">' +
      '<legend class="role-picker-legend">绑定角色（可多选）</legend>' +
      '<div class="role-picker__list">' +
      boxes +
      '</div></fieldset>' +
      '<p class="role-picker-hint">至少勾选一项；权限合并规则以下发后端为准。</p></div>'
    );
  }

  function buildAdminRoleConfigDrawerHtml(adminKey, row) {
    var labels = platformAssignableRoleLabels();
    var selected =
      row && Array.isArray(row.assignedRoles) && row.assignedRoles.length
        ? row.assignedRoles.slice()
        : row && row.role
          ? [row.role]
          : [];
    var boxes = labels
      .map(function (rn) {
        var chk = selected.indexOf(rn) >= 0 ? ' checked' : '';
        return (
          '<label class="role-picker__item">' +
          '<input type="checkbox" name="adm-assign-role" value="' +
          escapeHtml(rn) +
          '"' +
          chk +
          ' />' +
          '<span>' +
          escapeHtml(rn) +
          '</span></label>'
        );
      })
      .join('');
    return (
      '<div class="drawer-form-stack">' +
      '<p class="role-picker-scope">管理员：<strong>' +
      escapeHtml(row ? row.name : adminKey) +
      '</strong></p>' +
      '<fieldset class="role-picker-fieldset">' +
      '<legend class="role-picker-legend">绑定角色（可多选）</legend>' +
      '<div class="role-picker__list">' +
      boxes +
      '</div></fieldset>' +
      '<p class="role-picker-hint">至少勾选一项；超级管理员约束仍适用。</p></div>'
    );
  }

  function openEnterpriseRoleConfigDrawer(entId) {
    var row = getData().enterprises.find(function (x) {
      return x.id === entId;
    });
    openDrawer(
      '角色配置',
      buildEnterpriseRoleConfigDrawerHtml(entId, row),
      function (dr, close) {
        var checks = dr.querySelectorAll('input[name="ent-assign-role"]:checked');
        var vals = [];
        checks.forEach(function (c) {
          vals.push(c.value);
        });
        if (!vals.length) {
          toast('请至少选择一个角色', 'error');
          return;
        }
        saveOverlayEnterpriseRoles(entId, vals);
        toast('角色已更新（演示）', 'success');
        close();
        render();
      }
    );
  }

  function openAdminRoleConfigDrawer(adminKey, row) {
    openDrawer(
      '角色配置',
      buildAdminRoleConfigDrawerHtml(adminKey, row),
      function (dr, close) {
        var checks = dr.querySelectorAll('input[name="adm-assign-role"]:checked');
        var vals = [];
        checks.forEach(function (c) {
          vals.push(c.value);
        });
        if (!vals.length) {
          toast('请至少选择一个角色', 'error');
          return;
        }
        saveOverlayAdminRoles(adminKey, vals);
        toast('角色已更新（演示）', 'success');
        close();
        render();
      }
    );
  }

  function toast(msg, type) {
    type = type || 'default';
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className =
      'toast' +
      (type === 'success' ? ' toast--success' : '') +
      (type === 'error' ? ' toast--error' : '') +
      (type === 'warn' ? ' toast--warn' : '');
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 3200);
  }

  function confirmDialog(title, body, onOk, opts) {
    opts = opts || {};
    var okLabel = opts.okLabel != null ? String(opts.okLabel) : '确定';
    var okBtnClass = opts.okDanger ? 'btn btn-modal-danger' : 'btn btn--primary';
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="c-title">' +
      '<div class="modal__head" id="c-title">' +
      escapeHtml(title) +
      '</div>' +
      '<div class="modal__body">' +
      escapeHtml(body) +
      '</div>' +
      '<div class="modal__foot">' +
      '<button type="button" class="btn" data-act="cancel">取消</button>' +
      '<button type="button" class="' +
      okBtnClass +
      '" data-act="ok">' +
      escapeHtml(okLabel) +
      '</button>' +
      '</div></div>';
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
    backdrop.querySelector('[data-act="cancel"]').addEventListener('click', close);
    backdrop.querySelector('[data-act="ok"]').addEventListener('click', function () {
      close();
      if (onOk) onOk();
    });
    function close() {
      backdrop.remove();
    }
    document.body.appendChild(backdrop);
    var okBtn = backdrop.querySelector('[data-act="ok"]');
    if (okBtn) okBtn.focus();
  }

  function navigate(hash) {
    if (hash.indexOf('#') !== 0) hash = '#' + hash;
    location.hash = hash;
  }

  function parseHash() {
    var raw = (location.hash || '').replace(/^#/, '') || '/login';
    var q = {};
    var path = raw;
    var qi = raw.indexOf('?');
    if (qi >= 0) {
      path = raw.slice(0, qi);
      raw
        .slice(qi + 1)
        .split('&')
        .forEach(function (pair) {
          var p = pair.split('=');
          q[decodeURIComponent(p[0] || '')] = decodeURIComponent(p[1] || '');
        });
    }
    var segs = path.split('/').filter(Boolean);
    return { path: '/' + segs.join('/'), segs: segs, query: q };
  }

  /** ---- Side nav config (PRD §14.1) ---- */
  var ADMIN_NAV = [
    { type: 'item', label: '首页', path: '/admin/home', icon: 'home' },
    {
      type: 'group',
      label: '资源中心',
      icon: 'resource',
      items: [
        { label: '实例', path: '/admin/instances' },
        { label: '资源池', path: '/admin/pool' },
        { label: 'SDK 资源', path: '/admin/resources/sdk' },
        { label: 'CORS 账号', path: '/admin/resources/cors' }
      ]
    },
    {
      type: 'group',
      label: '交易中心',
      icon: 'trade',
      items: [{ label: '订单列表', path: '/admin/trade/orders' }]
    },
    {
      type: 'group',
      label: '配置中心',
      icon: 'config',
      items: [
        { label: '服务节点', path: '/admin/config/nodes' },
        { label: '服务套餐', path: '/admin/config/packages' },
        { label: '商品', path: '/admin/products' },
        { label: '商品规格', path: '/admin/specs' }
      ]
    },
    {
      type: 'group',
      label: '系统管理',
      icon: 'system',
      items: [
        { label: '企业用户', path: '/admin/enterprises' },
        { label: '管理用户', path: '/admin/system/admins' },
        { label: '角色权限', path: '/admin/system/roles' },
        { label: '菜单管理', path: '/admin/system/menus' },
        { label: '字典管理', path: '/admin/system/dict' },
        { label: '个人中心', path: '/admin/profile' },
      ]
    },
  ];

  var CLIENT_NAV = [
    { type: 'item', label: '首页', path: '/client/dashboard', icon: 'home' },
    {
      type: 'group',
      label: '资源中心',
      icon: 'resource',
      items: [
        { label: '资源信息', path: '/client/resource/info' },
        { label: 'SDK 资源', path: '/client/resource/sdk' },
        { label: 'CORS 账号', path: '/client/resource/cors' }
      ]
    },
    {
      type: 'group',
      label: '交易中心',
      icon: 'trade',
      items: [
        { label: '订单列表', path: '/client/trade/orders' },
        { label: '对账管理', path: '/client/trade/reconciliation' }
      ]
    },
    {
      type: 'group',
      label: '个人中心',
      icon: 'user',
      items: [{ label: '个人信息', path: '/client/profile' }]
    }
  ];

  /** 菜单管理表格数据：与超级管理员侧栏 ADMIN_NAV 同源，导航变更时此处同步 */
  function buildMenuCatalogFromSuperAdminNav() {
    function pathToPermKey(p) {
      return String(p || '')
        .replace(/^\//, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'root';
    }
    var catalog = [];
    ADMIN_NAV.forEach(function (entry, gi) {
      var rootOrder = (gi + 1) * 10;
      if (entry.type === 'item') {
        catalog.push({
          id: 'adm-nav-item-' + pathToPermKey(entry.path),
          name: entry.label,
          menuType: '一级菜单',
          status: '启用',
          sortOrder: rootOrder,
          route: entry.path,
          requestPath: '#',
          permKey: pathToPermKey(entry.path),
          defaultShow: true,
          children: []
        });
        return;
      }
      var gid = 'adm-nav-g-' + (entry.icon || 'grp') + '-' + gi;
      var subs = (entry.items || []).map(function (it, ci) {
        return {
          id: gid + '-sub-' + ci + '-' + pathToPermKey(it.path),
          name: it.label,
          menuType: '二级菜单',
          status: '启用',
          sortOrder: rootOrder * 100 + ci + 1,
          route: it.path,
          requestPath: '#',
          permKey: pathToPermKey(it.path),
          defaultShow: true,
          children: []
        };
      });
      catalog.push({
        id: gid,
        name: entry.label,
        menuType: '一级菜单',
        status: '启用',
        sortOrder: rootOrder,
        route: '',
        requestPath: '#',
        permKey: (entry.icon || 'nav') + '_center',
        defaultShow: true,
        children: subs
      });
    });
    return catalog;
  }

  /** 侧栏分组展开状态（会话内）；含当前路由的分组强制展开 */
  if (typeof window.__navOpenGroups !== 'object' || window.__navOpenGroups === null) {
    window.__navOpenGroups = {};
  }

  function navGroupKey(role, label) {
    return String(role || '') + ':' + String(label || '');
  }

  function navItemIsActive(it, currentPath) {
    var linkBase = String(it.path || '').split('?')[0];
    var curBase = String(currentPath || '').split('?')[0];
    var active = curBase === linkBase || curBase.indexOf(linkBase + '/') === 0;
    if (
      !active &&
      ((it.path === '/admin/trade/orders' && currentPath === '/admin/trade/detail') ||
        (it.path === '/client/trade/orders' && currentPath === '/client/trade/detail'))
    ) {
      active = true;
    }
    return active;
  }

  function navGroupHasActiveChild(entry, currentPath) {
    return (entry.items || []).some(function (it) {
      return navItemIsActive(it, currentPath);
    });
  }

  function navGroupIsOpen(role, entry, currentPath) {
    if (navGroupHasActiveChild(entry, currentPath)) return true;
    var k = navGroupKey(role, entry.label);
    return window.__navOpenGroups[k] === true;
  }

  /** 侧栏图标（深色底浅色描边） */
  function sidebarIconSvg(kind) {
    var common = 'class="sidebar__ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    var paths = {
      home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/>',
      resource: '<path d="M12 3 2 9l10 6 10-6-10-6Z"/><path d="m2 15 10 6 10-6"/>',
      trade: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
      config: '<circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 18v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m18 0h2M4.9 19.1l1.4-1.4m11.4-11.4L19.1 4.9"/>',
      system: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>',
      data: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'
    };
    var d = paths[kind] || paths.home;
    return '<svg ' + common + '>' + d + '</svg>';
  }

  function navSublink(it, currentPath) {
    var active = navItemIsActive(it, currentPath);
    var cls = 'sidebar__sublink' + (active ? ' sidebar__sublink--active' : '');
    if (it.placeholder) cls += ' sidebar__sublink--muted';
    return (
      '<a class="' +
      cls +
      '" href="#' +
      it.path +
      '">' +
      escapeHtml(it.label) +
      (it.placeholder ? ' · 占位' : '') +
      '</a>'
    );
  }

  function navHtml(items, currentPath, role) {
    var html = '';
    items.forEach(function (entry) {
      if (entry.type === 'group') {
        var gkey = escapeHtml(navGroupKey(role, entry.label));
        var open = navGroupIsOpen(role, entry, currentPath);
        var locked = navGroupHasActiveChild(entry, currentPath);
        var iconKind = entry.icon || 'resource';
        html +=
          '<div class="sidebar__group' +
          (open ? ' sidebar__group--open' : '') +
          (locked ? ' sidebar__group--locked' : '') +
          '" data-nav-group="' +
          gkey +
          '">' +
          '<button type="button" class="sidebar__node" aria-expanded="' +
          (open ? 'true' : 'false') +
          '" data-sidebar-toggle="1"' +
          (locked ? ' disabled title="当前路由在本分组内，保持展开"' : '') +
          '>' +
          '<span class="sidebar__node-icon">' +
          sidebarIconSvg(iconKind) +
          '</span>' +
          '<span class="sidebar__node-label">' +
          escapeHtml(entry.label) +
          '</span>' +
          '<span class="sidebar__node-chevron" aria-hidden="true">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg>' +
          '</span>' +
          '</button>' +
          '<div class="sidebar__panel"' +
          (open ? '' : ' hidden') +
          '>' +
          '<nav class="sidebar__panel-inner" aria-label="' +
          escapeHtml(entry.label) +
          '">';
        (entry.items || []).forEach(function (it) {
          html += navSublink(it, currentPath);
        });
        html += '</nav></div></div>';
      } else {
        var ik = entry.icon || 'home';
        html +=
          '<div class="sidebar__solo">' +
          '<a class="sidebar__node sidebar__node--leaf' +
          (navItemIsActive(entry, currentPath) ? ' sidebar__node--active' : '') +
          '" href="#' +
          entry.path +
          '">' +
          '<span class="sidebar__node-icon">' +
          sidebarIconSvg(ik) +
          '</span>' +
          '<span class="sidebar__node-label">' +
          escapeHtml(entry.label) +
          '</span>' +
          '</a></div>';
      }
    });
    return html;
  }

  function renderShell(mainHtml, role, currentPath) {
    var sidebarCollapsed = false;
    try {
      sidebarCollapsed = sessionStorage.getItem('prototype_sidebar_collapsed') === '1';
    } catch (e) {}
    var nav = role === 'super_admin' ? ADMIN_NAV : CLIENT_NAV;
    return (
      '<div class="app-shell">' +
      '<header class="app-bar">' +
      '<div class="app-bar__brand">' +
      '<span>多租户管理后台 · 原型</span>' +
      '<span class="app-bar__badge">MVP 演示</span>' +
      '</div>' +
      '<div class="app-bar__actions">' +
      '<label style="font-size:13px;color:#64748b">演示角色</label>' +
      '<select id="demo-role" class="btn" style="padding:0.35rem 0.6rem">' +
      '<option value="super_admin"' +
      (role === 'super_admin' ? ' selected' : '') +
      '>超级管理员</option>' +
      '<option value="client_admin"' +
      (role === 'client_admin' ? ' selected' : '') +
      '>大客户</option>' +
      '</select>' +
      '<button type="button" class="btn btn--ghost" id="btn-logout">退出</button>' +
      '</div></header>' +
      '<div class="app-body">' +
      '<aside class="sidebar' +
      (sidebarCollapsed ? ' sidebar--collapsed' : '') +
      '" id="app-sidebar">' +
      '<div class="sidebar__brand">' +
      '<div class="sidebar__brand-mark" aria-label="CHCNAV">' +
      '<span class="sidebar__brand-chunk">CHCN</span>' +
      '<svg class="sidebar__brand-loc" width="14" height="18" viewBox="0 0 24 32" aria-hidden="true">' +
      '<path fill="#f97316" d="M12 2C7.6 2 4 5.4 4 9.5c0 5.5 8 14.5 8 14.5s8-9 8-14.5C20 5.4 16.4 2 12 2Zm0 12.8a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6Z"/>' +
      '</svg>' +
      '<span class="sidebar__brand-chunk">V</span>' +
      '</div>' +
      '<div class="sidebar__brand-tag">控制台 · 原型</div>' +
      '</div>' +
      '<div class="sidebar__scroll">' +
      navHtml(nav, currentPath, role) +
      '<div class="sidebar__footer-block">' +
      '<div class="sidebar__footer-cap">数据</div>' +
      '<button type="button" class="sidebar__footer-action" id="btn-clear-overlay">' +
      '<span class="sidebar__node-icon">' +
      sidebarIconSvg('data') +
      '</span>' +
      '<span class="sidebar__footer-action-text">清除演示写入（恢复种子）</span>' +
      '</button>' +
      (role === 'super_admin'
        ? '<div class="sidebar__footer-cap">原型说明</div>' +
          '<a class="sidebar__footer-action sidebar__footer-action--link" href="#/admin/data/form-validation-rules">' +
          '<span class="sidebar__node-icon">' +
          '<svg class="sidebar__ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
          '<path d="M14 2v6h6"/>' +
          '<path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>' +
          '</svg></span>' +
          '<span class="sidebar__footer-action-text">系统表单校验规则</span>' +
          '</a>'
        : '') +
      '</div></div>' +
      '<div class="sidebar__rail">' +
      '<button type="button" class="sidebar__pin" id="btn-sidebar-collapse" title="收起 / 展开侧栏" aria-label="收起或展开侧栏">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M9 6 15 12 9 18"/>' +
      '<path d="M4 5h3v14H4z" opacity=".35"/>' +
      '</svg>' +
      '</button></div>' +
      '</aside>' +
      '<main class="main">' +
      mainHtml +
      '</main>' +
      '</div></div>'
    );
  }

  function renderPlaceholder(title, ref) {
    return (
      '<h1 class="page-title">' +
      escapeHtml(title) +
      '</h1>' +
      '<p class="page-sub">PRD ' +
      escapeHtml(ref || '§14.1') +
      ' · 浅层占位。约定见《前端设计》§3.2：正式落地的列表页「新增 / 创建」统一为<strong>右侧抽屉</strong>，不单独开整页表单；本页为概念占位。</p>' +
      '<div class="panel"><p style="margin:0;color:#64748b;font-size:13px">双旅程主链路：超管侧企业 → 配置 / 商品 → 实例 → 资源池 → 资源列表；大客户侧看板 → 对账。</p></div>'
    );
  }

  function renderLogin() {
    return (
      '<div class="login-page">' +
      '<div class="login-card">' +
      '<h1>控制台一期 MVP</h1>' +
      '<p class="muted">可交互原型</p>' +
      '<form id="form-login">' +
      '<div class="role-pills">' +
      '<label><input type="radio" name="demoRole" value="super_admin" checked /><span>超级管理员</span></label>' +
      '<label><input type="radio" name="demoRole" value="client_admin" /><span>大客户</span></label>' +
      '</div>' +
      '<div class="form-field" style="margin-bottom:1rem">' +
      '<label for="acc">账号</label>' +
      '<input id="acc" name="account" autocomplete="username" required placeholder="任意非空" />' +
      '</div>' +
      '<div class="form-field" style="margin-bottom:1rem">' +
      '<label for="pwd">密码</label>' +
      '<input id="pwd" name="password" type="password" autocomplete="current-password" required placeholder="任意非空" />' +
      '</div>' +
      '<button type="submit" class="btn btn--primary" style="width:100%">登录</button>' +
      '</form>' +
      '<p class="login-hint">原型不校验真实账号；顶栏可切换演示角色。各业务列表的「新增」交互为<strong>右侧抽屉</strong>（与设计稿 §3.2 一致）。侧栏底部可清除演示写入。</p>' +
      '</div></div>'
    );
  }

  function renderAdminHome() {
    var data = getData();
    var homePoolLines = normalizeResourcePoolLines(data.resourcePools || []);
    var homePoolSummary = summarizePoolLines(homePoolLines);
    return (
      '<h1 class="page-title">首页</h1>' +
      '<p class="page-sub">需求概要 · 超管默认首页；以下为演示指标与主链路入口。</p>' +
      '<p class="panel__title" style="margin:0 0 0.5rem">资源池汇总</p>' +
      '<p style="margin:0 0 0.75rem;font-size:13px;color:var(--text-muted)">基于全量大客户资源池数据；明细筛选与表格请前往资源池页面。</p>' +
      '<div class="card-grid">' +
      '<div class="stat-card"><div class="stat-card__label">覆盖企业</div><div class="stat-card__value">' +
      homePoolSummary.companyCount +
      '</div><div class="stat-card__meta">全量资源池中的企业数</div></div>' +
      '<div class="stat-card"><div class="stat-card__label">覆盖实例</div><div class="stat-card__value">' +
      homePoolSummary.instanceCount +
      '</div><div class="stat-card__meta">全量资源池中的实例数</div></div>' +
      '<div class="stat-card"><div class="stat-card__label">规格明细</div><div class="stat-card__value">' +
      homePoolSummary.lineCount +
      '</div><div class="stat-card__meta">按商品规格展开后的行数</div></div>' +
      '<div class="stat-card"><div class="stat-card__label">剩余配额</div><div class="stat-card__value">' +
      homePoolSummary.unused +
      '</div><div class="stat-card__meta">总量 ' +
      homePoolSummary.total +
      ' · 已用 ' +
      homePoolSummary.used +
      '</div></div>' +
      '</div>' +
      '<div class="panel"><p class="panel__title">主链路快捷入口</p>' +
      '<p style="margin:0 0 1rem;font-size:13px;color:var(--text-muted)">按角色拆分主链路；按钮顺序与步骤一致。「新增」交互统一为<strong>右侧抽屉</strong>。</p>' +
      '<div style="display:grid;grid-template-columns:1fr;gap:1.25rem">' +
      '<div>' +
      '<p style="margin:0 0 0.35rem;font-size:12px;font-weight:600;color:var(--text-muted)">商务管理员</p>' +
      '<p style="margin:0 0 0.75rem;font-size:13px;color:var(--text-muted);line-height:1.55">创建企业用户 → 创建实例 SI → 配置 SDK 服务套餐 → 资源池下单履约 → 资源中心查看 SDK / CORS 明细（<strong>SDK 资源</strong>与<strong>CORS 账号</strong>列表均可<strong>开通账号</strong>）</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:0.5rem">' +
      '<a class="btn btn--primary" href="#/admin/enterprises">企业用户</a>' +
      '<a class="btn" href="#/admin/instances">实例 SI</a>' +
      '<a class="btn" href="#/admin/instances">SDK 服务套餐</a>' +
      '<a class="btn" href="#/admin/pool">资源池下单履约</a>' +
      '<a class="btn" href="#/admin/resources/sdk">SDK 资源</a>' +
      '<a class="btn" href="#/admin/resources/cors">CORS 账号</a>' +
      '</div></div>' +
      '<div>' +
      '<p style="margin:0 0 0.35rem;font-size:12px;font-weight:600;color:var(--text-muted)">超级管理员</p>' +
      '<p style="margin:0 0 0.75rem;font-size:13px;color:var(--text-muted);line-height:1.55">配置中心：在<strong>商品</strong>页配置 SDK 商品 / 外置帐号商品（需选择<strong>节点</strong>与<strong>对应商品类型</strong>）→ 配置<strong>商品规格</strong> → 配置<strong>服务节点</strong>及<strong>服务套餐</strong></p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:0.5rem">' +
      '<a class="btn btn--primary" href="#/admin/products">商品</a>' +
      '<a class="btn" href="#/admin/specs">商品规格</a>' +
      '<a class="btn" href="#/admin/config/nodes">服务节点</a>' +
      '<a class="btn" href="#/admin/config/packages">服务套餐</a>' +
      '</div></div>' +
      '</div></div>'
    );
  }

  function renderEnterprises() {
    var rows = getData().enterprises;
    var body = rows
      .map(function (e) {
        return (
          '<tr>' +
          '<td>' +
          escapeHtml(e.contact) +
          '</td>' +
          '<td>' +
          escapeHtml(e.name) +
          '</td>' +
          '<td><span class="tag' +
          (e.status === '正常' ? ' tag--ok' : ' tag--off') +
          '">' +
          escapeHtml(e.status) +
          '</span></td>' +
          '<td>' +
          escapeHtml(displayPhoneNoCountryCode(e.phone)) +
          '</td>' +
          '<td>' +
          escapeHtml(e.email) +
          '</td>' +
          '<td>' +
          escapeHtml(e.registeredAt) +
          '</td>' +
          '<td>' +
          escapeHtml(formatAssignedRoles(e.assignedRoles, '企业管理员')) +
          '</td>' +
          '<td>' +
          escapeHtml(e.remark || '') +
          '</td>' +
          '<td class="cell-actions">' +
          '<div class="row-action-links">' +
          '<button type="button" class="link-btn" data-ent-edit="' +
          escapeHtml(e.id) +
          '">编辑</button>' +
          '<span class="row-action-sep" aria-hidden="true">|</span>' +
          '<button type="button" class="link-btn" data-ent-role="' +
          escapeHtml(e.id) +
          '">角色配置</button>' +
          '<span class="row-action-sep" aria-hidden="true">|</span>' +
          '<details class="action-more">' +
          '<summary class="link-btn action-more__summary">更多</summary>' +
          '<div class="action-more__menu" role="menu">' +
          '<button type="button" class="action-more__item" role="menuitem" data-ent-enable="' +
          escapeHtml(e.id) +
          '">启用</button>' +
          '<button type="button" class="action-more__item" role="menuitem" data-ent-disable="' +
          escapeHtml(e.id) +
          '">禁用</button>' +
          '<button type="button" class="action-more__item" role="menuitem" data-ent-reset-pwd="' +
          escapeHtml(e.id) +
          '">重置密码</button>' +
          '</div></details></div></td>' +
          '</tr>'
        );
      })
      .join('');
    return (
      '<h1 class="page-title">企业用户</h1>' +
      '<div class="toolbar">' +
      '<span style="font-size:13px;color:#64748b">共 ' +
      rows.length +
      ' 条</span>' +
      '<div class="toolbar-spacer"></div>' +
      '<button type="button" class="btn btn--primary" id="btn-new-ent">新增</button></div>' +
      '<div class="table-wrap"><table class="data-table">' +
      '<thead><tr>' +
      '<th>姓名</th><th>企业名称</th><th>状态</th><th>手机号</th><th>邮箱</th><th>注册时间</th><th>角色</th><th>备注</th><th class="cell-actions">操作</th>' +
      '</tr></thead><tbody>' +
      body +
      '</tbody></table></div>'
    );
  }

  function renderEnterpriseDetail(id) {
    var e = getData().enterprises.find(function (x) {
      return x.id === id;
    });
    if (!e)
      return '<p class="page-sub">未找到企业</p><a href="#/admin/enterprises">返回列表</a>';
    var inst = getData().instances.filter(function (i) {
      return i.company === e.name;
    });
    return (
      '<div class="breadcrumb"><a href="#/admin/enterprises">企业用户</a> / ' +
      escapeHtml(e.name) +
      '</div>' +
      '<h1 class="page-title">' +
      escapeHtml(e.name) +
      '</h1>' +
      '<div class="tabs" id="ent-tabs">' +
      '<button type="button" class="is-active" data-tab="base">基本信息</button>' +
      '<button type="button" data-tab="res">资源概况</button>' +
      '<button type="button" data-tab="acct">关联账号</button>' +
      '</div>' +
      '<div id="tab-base" class="tab-panel">' +
      '<div class="panel"><div class="form-grid">' +
      '<div class="form-field"><label>联系人</label><div>' +
      escapeHtml(e.contact) +
      '</div></div>' +
      '<div class="form-field"><label>状态</label><div>' +
      escapeHtml(e.status) +
      '</div></div>' +
      '<div class="form-field"><label>手机</label><div>' +
      escapeHtml(displayPhoneNoCountryCode(e.phone)) +
      '</div></div>' +
      '<div class="form-field"><label>邮箱</label><div>' +
      escapeHtml(e.email) +
      '</div></div>' +
      '<div class="form-field"><label>所属行业</label><div>' +
      escapeHtml(e.industry || '—') +
      '</div></div>' +
      '<div class="form-field"><label>主账号</label><div>' +
      escapeHtml(e.account) +
      '</div></div>' +
      '<div class="form-field"><label>备注</label><div>' +
      escapeHtml(e.remark || '-') +
      '</div></div>' +
      '</div><p style="font-size:12px;color:#64748b;margin:0.75rem 0 0">证照与证件影像：原型占位，生产见 PRD。</p></div></div>' +
      '<div id="tab-res" class="tab-panel" hidden>' +
      '<div class="panel"><p class="panel__title">资源概况（演示）</p>' +
      '<p>关联实例数：<strong>' +
      inst.length +
      '</strong></p>' +
      '<p style="font-size:13px;color:#64748b">详见资源中心各模块。</p></div></div>' +
      '<div id="tab-acct" class="tab-panel" hidden>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>类型</th><th>账号</th><th>说明</th></tr></thead><tbody>' +
      '<tr><td>主账号 / 企业管理员</td><td>' +
      escapeHtml(e.account) +
      '</td><td>一期仅主账号</td></tr>' +
      '</tbody></table></div></div>'
    );
  }

  function findServiceNodeByCode(code) {
    return (getData().serviceNodes || []).find(function (n) {
      return n.code === code;
    });
  }

  /** 抽屉详情：分组定义列表（非表单样式） */
  function drawerDetailDlRow(label, value, opts) {
    opts = opts || {};
    var mono = opts.mono ? ' drawer-detail__dd--mono' : '';
    var inner;
    if (opts.html) {
      inner = value != null ? String(value) : '—';
    } else {
      var v = value != null && String(value).trim() !== '' ? String(value) : '—';
      inner = escapeHtml(v);
    }
    return (
      '<dt class="drawer-detail__dt">' +
      escapeHtml(label) +
      '</dt>' +
      '<dd class="drawer-detail__dd' +
      mono +
      '">' +
      inner +
      '</dd>'
    );
  }

  function drawerDetailSection(title, rowsInner) {
    return (
      '<section class="drawer-detail__section">' +
      '<h3 class="drawer-detail__section-title">' +
      escapeHtml(title) +
      '</h3>' +
      '<dl class="drawer-detail__dl">' +
      rowsInner +
      '</dl></section>'
    );
  }

  function drawerDetailNoteBlock(title, text) {
    var raw = text != null ? String(text).trim() : '';
    var empty = raw === '';
    var cls = 'drawer-detail__note' + (empty ? ' drawer-detail__note--empty' : '');
    var body = empty ? '暂无备注' : escapeHtml(raw);
    return (
      '<section class="drawer-detail__section">' +
      '<h3 class="drawer-detail__section-title">' +
      escapeHtml(title) +
      '</h3>' +
      '<p class="' +
      cls +
      '">' +
      body +
      '</p></section>'
    );
  }

  function buildServiceNodeDetailDrawerHtml(node) {
    if (!node) return '';
    var refTag =
      '<span class="tag ' +
      (node.referenced ? 'tag--warn' : 'tag--ok') +
      '">' +
      (node.referenced ? '已被引用' : '未被引用') +
      '</span>';
    var lead =
      '<header class="drawer-detail__lead">' +
      '<p class="drawer-detail__title-inline">' +
      escapeHtml(node.name || '—') +
      '</p>' +
      '<div class="drawer-detail__lead-meta">' +
      '<span class="drawer-detail__pill">' +
      escapeHtml(node.type || '—') +
      '</span>' +
      '<span class="drawer-detail__code">' +
      escapeHtml(node.code || '—') +
      '</span>' +
      '</div>' +
      '<p class="drawer-detail__endpoint">' +
      escapeHtml(node.endpoint || '—') +
      '</p>' +
      '</header>';
    return (
      '<div class="drawer-detail">' +
      lead +
      drawerDetailSection(
        '引用与说明',
        drawerDetailDlRow('引用状态', refTag, { html: true })
      ) +
      drawerDetailNoteBlock('备注', node.remark) +
      drawerDetailSection(
        '创建与更新',
        drawerDetailDlRow('创建人', node.createdBy) +
          drawerDetailDlRow('创建时间', node.createdAt) +
          drawerDetailDlRow('更新人', node.updatedBy) +
          drawerDetailDlRow('更新时间', node.updatedAt)
      ) +
      '</div>'
    );
  }

  function openServiceNodeDetailDrawer(code) {
    var node = findServiceNodeByCode(code);
    if (!node) {
      toast('未找到该节点', 'error');
      return;
    }
    openDrawer('节点详情 · ' + node.name, buildServiceNodeDetailDrawerHtml(node), null, { readonly: true });
  }

  function buildServiceNodeEditReadonlySummaryHtml(node) {
    function row(label, value, mono) {
      var raw = value != null && String(value).trim() !== '' ? String(value) : '—';
      var monoCls = mono ? ' drawer-readonly-summary__value--mono' : '';
      return (
        '<div class="drawer-readonly-summary__row">' +
        '<span class="drawer-readonly-summary__label">' +
        escapeHtml(label) +
        '</span>' +
        '<span class="drawer-readonly-summary__value' +
        monoCls +
        '">' +
        escapeHtml(raw) +
        '</span></div>'
      );
    }
    return (
      '<div class="drawer-readonly-summary" role="region" aria-label="节点信息（只读）">' +
      '<div class="drawer-readonly-summary__head">' +
      '<span class="drawer-readonly-summary__title">节点信息</span>' +
      '<span class="drawer-readonly-summary__badge">只读</span>' +
      '</div>' +
      '<p class="drawer-readonly-summary__hint">名称、类型、编号与地址由系统维护，如需变更请联系管理员或通过配置流程处理。</p>' +
      '<div class="drawer-readonly-summary__list">' +
      row('节点名称', node.name, false) +
      row('节点类型', node.type, false) +
      row('业务编号', node.code, true) +
      row('服务地址', node.endpoint, true) +
      '</div></div>'
    );
  }

  function openServiceNodeEditDrawer(code) {
    var node = findServiceNodeByCode(code);
    if (!node) {
      toast('未找到该节点', 'error');
      return;
    }
    openDrawer(
      '编辑节点 · ' + node.name,
      '<div class="drawer-form-stack drawer-form-stack--node-edit">' +
        buildServiceNodeEditReadonlySummaryHtml(node) +
        '<div class="drawer-edit-editable">' +
        '<div class="drawer-edit-editable__head">' +
        '<label class="drawer-edit-editable__title" for="sn-edit-remark">备注</label>' +
        '<span class="drawer-edit-editable__hint">仅此字段可编辑</span>' +
        '</div>' +
        '<textarea id="sn-edit-remark" class="drawer-edit-editable__textarea" rows="5" placeholder="填写对内说明、接入注意事项等（可选）">' +
        escapeHtml(node.remark || '') +
        '</textarea></div>' +
        '</div>',
      function (dr, close) {
        var ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
        saveServiceNodePatch(node.code, {
          remark: dr.querySelector('#sn-edit-remark').value.trim(),
          updatedBy: 'SuperAdmin',
          updatedAt: ts
        });
        toast('已保存', 'success');
        close();
        render();
      },
      { primaryLabel: '保存' }
    );
  }

  function openServiceNodeDeleteConfirmDrawers(code, name, referenced) {
    if (referenced) {
      confirmDialog(
        '无法删除',
        '节点「' + name + '」已被业务引用，请先解除引用后再删除（演示规则）。',
        function () {}
      );
      return;
    }
    confirmDialog(
      '删除确认',
      '即将删除节点「' + name + '」（' + code + '）。删除后不可恢复（演示）。',
      function () {
        confirmDialog(
          '再次确认删除',
          '请再次确认：是否删除节点「' + name + '」？',
          function () {
            saveServiceNodeDeletion(code);
            toast('已删除（演示）', 'success');
            render();
          },
          { okLabel: '确认删除', okDanger: true }
        );
      },
      { okLabel: '继续' }
    );
  }

  function renderServiceNodes() {
    var rows = getData().serviceNodes;
    var body = rows
      .map(function (r) {
        var c = encodeURIComponent(r.code);
        return (
          '<tr><td>' +
          escapeHtml(r.name) +
          '</td><td>' +
          escapeHtml(r.type) +
          '</td><td>' +
          escapeHtml(r.code) +
          '</td><td>' +
          escapeHtml(r.endpoint || '—') +
          '</td><td>' +
          escapeHtml(r.createdBy || '—') +
          '</td><td>' +
          escapeHtml(r.createdAt || '—') +
          '</td><td class="cell-actions"><div class="row-action-btns">' +
          '<button type="button" class="link-btn" data-node-edit="' +
          c +
          '">编辑</button> ' +
          '<button type="button" class="link-btn link-btn--danger" data-node-delete="' +
          c +
          '">删除</button> ' +
          '<button type="button" class="link-btn" data-node-detail="' +
          c +
          '">详情</button></div></td></tr>'
        );
      })
      .join('');
    return (
      '<h1 class="page-title">服务节点</h1>' +
      '<div class="toolbar toolbar--end"><button type="button" class="btn btn--primary" id="btn-new-node">新增</button></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>节点名称</th><th>节点类型</th><th>业务编号</th><th>服务地址</th><th>创建人</th><th>创建时间</th><th class="cell-actions">操作</th></tr></thead><tbody>' +
      body +
      '</tbody></table></div>'
    );
  }

  function findPackageByName(name) {
    return (getData().packages || []).find(function (p) {
      return p.name === name;
    });
  }

  function packageBoolYesNo(v) {
    return v === true ? '是' : '否';
  }

  function buildPackageDetailDrawerHtml(p) {
    if (!p) return '';
    var maxStr =
      p.maxOnline != null && p.maxOnline !== '' && !isNaN(Number(p.maxOnline))
        ? String(p.maxOnline)
        : '—';
    var stOk = (p.status || '') === '启用';
    var statusTag =
      '<span class="tag ' +
      (stOk ? 'tag--ok' : 'tag--off') +
      '">' +
      escapeHtml(p.status || '—') +
      '</span>';
    var lead =
      '<header class="drawer-detail__lead">' +
      '<p class="drawer-detail__title-inline">' +
      escapeHtml(p.name || '—') +
      '</p>' +
      '<div class="drawer-detail__lead-meta">' +
      '<span class="drawer-detail__pill">' +
      escapeHtml(p.spec || p.auth || '—') +
      '</span>' +
      '<span class="drawer-detail__code">' +
      escapeHtml(p.node || '—') +
      '</span>' +
      statusTag +
      '</div>' +
      '</header>';
    return (
      '<div class="drawer-detail">' +
      lead +
      drawerDetailSection(
        '接入与配额',
        drawerDetailDlRow('坐标系', p.coord) +
          drawerDetailDlRow('可用挂载点', p.mount) +
          drawerDetailDlRow('端口', p.port != null && p.port !== '' ? String(p.port) : '', { mono: true }) +
          drawerDetailDlRow('源列表', p.sources) +
          drawerDetailDlRow('最大在线数', maxStr) +
          drawerDetailDlRow('启用 TSL', packageBoolYesNo(p.tslEnabled)) +
          drawerDetailDlRow('启用压缩', packageBoolYesNo(p.compressEnabled))
      ) +
      drawerDetailNoteBlock('备注', p.remark) +
      drawerDetailSection(
        '最近更新',
        drawerDetailDlRow('更新人', p.updatedBy) + drawerDetailDlRow('更新时间', p.updatedAt)
      ) +
      '</div>'
    );
  }

  function buildPackageEditReadonlySummaryHtml(p) {
    function row(label, value, mono) {
      var raw = value != null && String(value).trim() !== '' ? String(value) : '—';
      var monoCls = mono ? ' drawer-readonly-summary__value--mono' : '';
      return (
        '<div class="drawer-readonly-summary__row">' +
        '<span class="drawer-readonly-summary__label">' +
        escapeHtml(label) +
        '</span>' +
        '<span class="drawer-readonly-summary__value' +
        monoCls +
        '">' +
        escapeHtml(raw) +
        '</span></div>'
      );
    }
    return (
      '<div class="drawer-readonly-summary" role="region" aria-label="套餐信息（只读）">' +
      '<div class="drawer-readonly-summary__head">' +
      '<span class="drawer-readonly-summary__title">套餐信息</span>' +
      '<span class="drawer-readonly-summary__badge">只读</span>' +
      '</div>' +
      '<p class="drawer-readonly-summary__hint">套餐核心参数由系统或配置流程维护；<strong>源列表</strong>与<strong>最大在线数</strong>请在下方可编辑区维护。</p>' +
      '<div class="drawer-readonly-summary__list">' +
      row('套餐名称', p.name, false) +
      row('商品类型', p.spec || p.auth || '—', false) +
      row('服务节点', p.node, false) +
      row('坐标系', p.coord, false) +
      row('挂载点', p.mount, false) +
      row('端口', p.port != null && p.port !== '' ? String(p.port) : '', false) +
      row('启用 TSL', packageBoolYesNo(p.tslEnabled), false) +
      row('启用压缩', packageBoolYesNo(p.compressEnabled), false) +
      row('状态', p.status, false) +
      '</div></div>'
    );
  }

  function openPackageDetailDrawer(name) {
    var p = findPackageByName(name);
    if (!p) {
      toast('未找到该套餐', 'error');
      return;
    }
    openDrawer('套餐详情 · ' + p.name, buildPackageDetailDrawerHtml(p), null, { readonly: true });
  }

  function openPackageEditDrawer(name) {
    var p = findPackageByName(name);
    if (!p) {
      toast('未找到该套餐', 'error');
      return;
    }
    var maxOnlineInputVal =
      p.maxOnline != null && p.maxOnline !== '' && !isNaN(Number(p.maxOnline))
        ? String(Number(p.maxOnline))
        : '';
    openDrawer(
      '编辑套餐 · ' + p.name,
      '<div class="drawer-form-stack drawer-form-stack--node-edit">' +
        buildPackageEditReadonlySummaryHtml(p) +
        '<div class="drawer-edit-editable">' +
        '<div class="drawer-edit-editable__head">' +
        '<span class="drawer-edit-editable__title" id="pkg-edit-editable-legend">可编辑字段</span>' +
        '<span class="drawer-edit-editable__hint">源列表 · 最大在线数 · 备注</span>' +
        '</div>' +
        '<div class="drawer-edit-editable__form" role="group" aria-labelledby="pkg-edit-editable-legend">' +
        '<div class="form-field">' +
        '<label for="pkg-edit-sources">源列表</label>' +
        '<textarea id="pkg-edit-sources" class="drawer-edit-editable__textarea" rows="4" placeholder="按实际接入源填写，多条可换行">' +
        escapeHtml(p.sources || '') +
        '</textarea>' +
        '<p class="drawer-field-hint" style="margin:0.35rem 0 0">与履约环境一致；修改后列表与详情将同步展示。</p>' +
        '</div>' +
        '<div class="form-field">' +
        '<label for="pkg-edit-max">最大在线数</label>' +
        '<input id="pkg-edit-max" type="number" min="1" max="999" step="1" placeholder="1–999，可为空" value="' +
        escapeHtml(maxOnlineInputVal) +
        '" />' +
        '<p class="drawer-field-hint" style="margin:0.35rem 0 0">留空表示不在此维护配额（演示）；填写须为 1–999 的整数。</p>' +
        '</div>' +
        '<div class="form-field">' +
        '<label for="pkg-edit-remark">备注</label>' +
        '<textarea id="pkg-edit-remark" class="drawer-edit-editable__textarea" rows="5" placeholder="填写对内说明、接入与配额说明等（可选）">' +
        escapeHtml(p.remark || '') +
        '</textarea></div>' +
        '</div></div>' +
        '</div>',
      function (dr, close) {
        var maxParsed = parseOptionalMaxOnlineInput(dr.querySelector('#pkg-edit-max').value);
        if (!maxParsed.ok) {
          toast('请输入[1,999]之间的整数', 'error');
          return;
        }
        var maxOnline = maxParsed.value;
        var ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
        savePackagePatch(p.name, {
          sources: dr.querySelector('#pkg-edit-sources').value.trim(),
          maxOnline: maxOnline,
          remark: dr.querySelector('#pkg-edit-remark').value.trim(),
          updatedBy: 'SuperAdmin',
          updatedAt: ts
        });
        toast('已保存', 'success');
        close();
        render();
      },
      { primaryLabel: '保存' }
    );
  }

  /**
   * 新增服务套餐抽屉：「基础套餐」下拉按服务节点列出 packagePortPresets；
   * 选定后带出端口及坐标系/挂载点/TLS/压缩四项并置灰不可编辑；业务参数区仍可手填。
   */
  function wireNewPackageDrawerPortPresets(dr) {
    var presets = getData().packagePortPresets || [];
    var pnode = dr.querySelector('#pnode');
    var pport = dr.querySelector('#pport');
    var live = dr.querySelector('#pkg-port-live');
    var statusEl = dr.querySelector('#pkg-port-status');
    var derivedWrap = dr.querySelector('#pkg-derived-fields');
    var pcoord = dr.querySelector('#pcoord');
    var pmount = dr.querySelector('#pmount');
    var ptsl = dr.querySelector('#ptsl');
    var pcompress = dr.querySelector('#pcompress');
    if (!pnode || !pport || !pcoord || !pmount || !ptsl || !pcompress) return;

    function listingsForNode(node) {
      return presets
        .map(function (pr, globalIdx) {
          return { pr: pr, idx: globalIdx };
        })
        .filter(function (x) {
          return x.pr.node === node;
        });
    }

    function clearDerived() {
      pcoord.value = '';
      pmount.value = '';
      ptsl.value = '否';
      pcompress.value = '否';
    }

    function setDerivedLocked(locked) {
      pcoord.readOnly = locked;
      pmount.readOnly = locked;
      ptsl.disabled = locked;
      pcompress.disabled = locked;
      if (derivedWrap) {
        derivedWrap.classList.toggle('pkg-derived-fields--locked', locked);
      }
    }

    function setDerived(pr) {
      pcoord.value = pr.coord != null ? String(pr.coord) : '';
      pmount.value = pr.mount != null ? String(pr.mount) : '';
      ptsl.value = pr.tslEnabled ? '是' : '否';
      pcompress.value = pr.compressEnabled ? '是' : '否';
    }

    function applyPresetGlobalIndex(globalIdx) {
      var pr = presets[globalIdx];
      if (!pr) {
        clearDerived();
        setDerivedLocked(true);
        return;
      }
      setDerived(pr);
      setDerivedLocked(true);
      var label = pr.label || pr.mount || '预设';
      if (statusEl) {
        statusEl.textContent =
          '端口 ' +
          String(pr.port || '') +
          ' · ' +
          label +
          '：坐标系、挂载点、TLS 与压缩已由基础套餐带出，不可修改。';
      }
      if (live) {
        live.textContent = '已同步基础套餐网络参数';
      }
    }

    function rebuildPortSelect() {
      var node = pnode.value || '';
      var list = listingsForNode(node);
      if (statusEl) {
        statusEl.textContent = '';
      }
      if (live) {
        live.textContent = '';
      }

      var optsHtml =
        '<option value="" class="pkg-base-placeholder">' +
        (!node ? '请先选择服务节点' : '请选择基础套餐（端口预设）') +
        '</option>';
      for (var i = 0; i < list.length; i++) {
        var row = list[i];
        var pr = row.pr;
        var lbl = escapeHtml(pr.label || pr.mount || '预设');
        optsHtml +=
          '<option value="' +
          row.idx +
          '">' +
          escapeHtml(String(pr.port || '')) +
          ' · ' +
          lbl +
          '</option>';
      }
      pport.innerHTML = optsHtml;

      if (!node) {
        pport.disabled = true;
        clearDerived();
        setDerivedLocked(true);
        return;
      }
      pport.disabled = list.length === 0;
      clearDerived();
      setDerivedLocked(true);
      if (list.length === 0) {
        if (statusEl) {
          statusEl.textContent = '当前服务节点下暂无基础套餐预设，无法在演示数据中新增套餐。';
        }
        return;
      }
      pport.value = String(list[0].idx);
      applyPresetGlobalIndex(list[0].idx);
    }

    pnode.addEventListener('change', rebuildPortSelect);

    pport.addEventListener('change', function () {
      var v = pport.value;
      if (v === '') {
        clearDerived();
        setDerivedLocked(true);
        if (statusEl && pnode.value) {
          statusEl.textContent = '请选择一项基础套餐。';
        }
        if (live) {
          live.textContent = '';
        }
        return;
      }
      applyPresetGlobalIndex(parseInt(v, 10));
    });

    rebuildPortSelect();
  }

  function renderPackages() {
    var rows = getData().packages;
    var body = rows
      .map(function (r) {
        var n = encodeURIComponent(r.name);
        return (
          '<tr><td>' +
          escapeHtml(r.name) +
          '</td><td>' +
          escapeHtml(r.spec || r.auth || '—') +
          '</td><td>' +
          escapeHtml(r.node) +
          '</td><td>' +
          escapeHtml(r.coord || '—') +
          '</td><td>' +
          escapeHtml(r.mount || '—') +
          '</td><td>' +
          escapeHtml(r.port != null && r.port !== '' ? String(r.port) : '—') +
          '</td><td class="table-tabular">' +
          escapeHtml(r.maxOnline != null && r.maxOnline !== '' ? String(r.maxOnline) : '—') +
          '</td><td>' +
          escapeHtml(r.tslEnabled === true ? '是' : '否') +
          '</td><td>' +
          escapeHtml(r.compressEnabled === true ? '是' : '否') +
          '</td><td class="cell-actions"><div class="row-action-btns">' +
          '<button type="button" class="link-btn" data-pkg-edit="' +
          n +
          '">编辑</button> ' +
          '<button type="button" class="link-btn" data-pkg-detail="' +
          n +
          '">详情</button></div></td></tr>'
        );
      })
      .join('');
    return (
      '<h1 class="page-title">服务套餐</h1>' +
      '<div class="toolbar toolbar--end"><button type="button" class="btn btn--primary" id="btn-new-pkg">新增</button></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>套餐名称</th><th>商品类型</th><th>服务节点</th><th>坐标系</th><th>可用挂载点</th><th>端口</th><th class="table-tabular">最大在线数</th><th>是否启用tsl</th><th>是否启用压缩</th><th class="cell-actions">操作</th>' +
      '</tr></thead><tbody>' +
      body +
      '</tbody></table></div>'
    );
  }

  function renderProducts() {
    var rows = getData().products;
    var body = rows
      .map(function (r) {
        return (
          '<tr><td>' +
          escapeHtml(r.name) +
          '</td><td class="cell-product-image">' +
          productImageCell(r.image, r.name) +
          '</td><td>' +
          escapeHtml(r.type || r.authMethod || '—') +
          '</td><td>' +
          escapeHtml(r.price) +
          '</td><td>' +
          formatProductPackagesListCell(r) +
          '</td><td>' +
          escapeHtml(r.billingMode || '—') +
          '</td><td>' +
          escapeHtml(r.id) +
          '</td><td class="cell-actions">' +
          '<div class="row-action-btns">' +
          '<button type="button" class="link-btn" data-product-edit="' +
          encodeURIComponent(r.id) +
          '">编辑</button> ' +
          '<button type="button" class="link-btn" data-product-detail="' +
          encodeURIComponent(r.id) +
          '">详情</button>' +
          '</div></td></tr>'
        );
      })
      .join('');
    return (
      '<h1 class="page-title">商品</h1>' +
      '<div class="toolbar toolbar--end"><button type="button" class="btn btn--primary" id="btn-new-product">新增</button></div>' +
      '<div class="table-wrap"><table class="data-table">' +
      '<thead><tr>' +
      '<th>商品名称</th><th>商品图片</th><th>商品类型</th><th>价格</th><th>可用服务套餐</th><th>计费方式</th><th>商品编码</th><th class="cell-actions">操作</th>' +
      '</tr></thead><tbody>' +
      body +
      '</tbody></table></div>'
    );
  }

  function renderSpecs() {
    var rows = getData().specs;
    var body = rows
      .map(function (r) {
        return (
          '<tr><td>' +
          escapeHtml(r.template || '—') +
          '</td><td>' +
          escapeHtml(r.pn || '—') +
          '</td><td>' +
          escapeHtml(r.product) +
          '</td><td>' +
          escapeHtml(r.name) +
          '</td><td>' +
          escapeHtml(r.id) +
          '</td><td>' +
          escapeHtml(r.currency || '—') +
          '</td><td class="table-tabular">' +
          escapeHtml(r.agentPrice || r.price || '—') +
          '</td><td class="table-tabular">' +
          escapeHtml(r.terminalPrice || r.price || '—') +
          '</td><td class="table-tabular">' +
          escapeHtml(String(r.stock != null ? r.stock : '—')) +
          '</td><td class="cell-actions">' +
          '<div class="row-action-btns">' +
          '<button type="button" class="link-btn" data-spec-edit="' +
          encodeURIComponent(r.id) +
          '">编辑</button> ' +
          '<button type="button" class="link-btn" data-spec-detail="' +
          encodeURIComponent(r.id) +
          '">详情</button>' +
          '</div></td></tr>'
        );
      })
      .join('');
    return (
      '<h1 class="page-title">商品规格</h1>' +
      '<div class="toolbar toolbar--end"><button type="button" class="btn btn--primary" id="btn-new-spec">新增</button></div>' +
      '<div class="table-wrap"><table class="data-table">' +
      '<thead><tr>' +
      '<th>规格名称</th><th>PN号</th><th>商品</th><th>商品规格</th><th>规格编码</th>' +
      '<th>币种</th><th class="table-tabular">代理商价格</th><th class="table-tabular">终端价格</th><th class="table-tabular">库存</th><th class="cell-actions">操作</th>' +
      '</tr></thead><tbody>' +
      body +
      '</tbody></table></div>'
    );
  }

  function instancePackageNames(row) {
    if (!row) return [];
    if (Array.isArray(row.packageNames) && row.packageNames.length) {
      return row.packageNames
        .map(function (x) {
          return String(x || '').trim();
        })
        .filter(Boolean);
    }
    if (row.packageName != null && String(row.packageName).trim() !== '') {
      return [String(row.packageName).trim()];
    }
    return [];
  }

  function instanceHasPackage(row) {
    return instancePackageNames(row).length > 0;
  }

  /** 布尔字段展示：与服务套餐列表「是否启用 tsl / 压缩」口径一致 */
  function packageBoolLabel(v) {
    return v === true ? '是' : '否';
  }

  /** 实例详情 / 抽屉：套餐明细字段与服务套餐（配置中心）列表对齐并补充备注与审计信息 */
  function buildServicePackageDetailSection(pkg, cardIndex) {
    var cid = 'inst-pkg-detail-' + String(cardIndex != null ? cardIndex : 0);
    var title = pkg && pkg.name ? pkg.name : '—';
    function dlItem(label, innerHtml) {
      return (
        '<div class="inst-pkg-detail-dl__cell">' +
        '<dt>' +
        escapeHtml(label) +
        '</dt><dd>' +
        innerHtml +
        '</dd></div>'
      );
    }
    function ddText(val) {
      var v = val != null && String(val).trim() !== '' ? String(val).trim() : '—';
      return escapeHtml(v);
    }
    if (!pkg || !pkg.node) {
      return (
        '<section class="inst-pkg-detail-card inst-pkg-detail-card--missing" aria-labelledby="' +
        cid +
        '-title">' +
        '<header class="inst-pkg-detail-card__head">' +
        '<h4 class="inst-pkg-detail-card__title" id="' +
        cid +
        '-title">' +
        escapeHtml(title) +
        '</h4></header>' +
        '<p class="inst-pkg-detail-card__empty table-muted">未在配置中心找到该套餐定义，无法展开字段（演示）。</p></section>'
      );
    }
    var statusTag =
      pkg.status === '启用'
        ? '<span class="tag tag--ok">' + escapeHtml(pkg.status) + '</span>'
        : pkg.status
          ? '<span class="tag">' + escapeHtml(pkg.status) + '</span>'
          : '<span class="tag tag--off">—</span>';
    var specShow = pkg.spec || pkg.auth || '—';
    var innerDl =
      dlItem('商品类型', ddText(specShow)) +
      dlItem('服务节点', ddText(pkg.node)) +
      dlItem('坐标系', ddText(pkg.coord)) +
      dlItem('可用挂载点', ddText(pkg.mount)) +
      dlItem('端口', ddText(pkg.port != null && pkg.port !== '' ? String(pkg.port) : '')) +
      dlItem(
        '最大在线数',
        ddText(pkg.maxOnline != null && pkg.maxOnline !== '' ? String(pkg.maxOnline) : '')
      ) +
      dlItem('是否启用 TSL', ddText(packageBoolLabel(pkg.tslEnabled === true))) +
      dlItem('是否启用压缩', ddText(packageBoolLabel(pkg.compressEnabled === true))) +
      dlItem('数据源', ddText(pkg.sources)) +
      dlItem('备注', ddText(pkg.remark)) +
      dlItem('更新人', ddText(pkg.updatedBy)) +
      dlItem('更新时间', ddText(pkg.updatedAt));
    return (
      '<section class="inst-pkg-detail-card" aria-labelledby="' +
      cid +
      '-title">' +
      '<header class="inst-pkg-detail-card__head">' +
      '<h4 class="inst-pkg-detail-card__title" id="' +
      cid +
      '-title">' +
      escapeHtml(pkg.name) +
      '</h4>' +
      '<div class="inst-pkg-detail-card__badges">' +
      statusTag +
      '</div></header>' +
      '<dl class="desc-list inst-pkg-detail-dl">' +
      innerDl +
      '</dl></section>'
    );
  }

  /** 实例详情页内联：绑定套餐逐项展开（原抽屉内容与配置中心套餐对齐） */
  function buildInstancePackagesExpandedHtml(instName) {
    var r = getData().instances.find(function (x) {
      return x.name === instName;
    });
    if (!r) return '<p class="table-muted">未找到实例。</p>';
    var names = instancePackageNames(r);
    if (!names.length) {
      return '<p class="table-muted" style="margin:0">当前实例未绑定 SDK 服务套餐。</p>';
    }
    var all = getData().packages || [];
    var blocks = names.map(function (nm, idx) {
      var p = all.find(function (x) {
        return x.name === nm;
      });
      return buildServicePackageDetailSection(p || { name: nm }, idx);
    });
    return '<div class="inst-pkg-detail-stack">' + blocks.join('') + '</div>';
  }

  function renderInstances() {
    var rows = getData().instances;
    var guide = window.__instanceSetupGuide || null;
    var banner =
      guide && guide.name
        ? '<div class="instance-setup-banner" id="inst-setup-banner" role="status">' +
          '<div class="instance-setup-banner__text">' +
          '<strong class="instance-setup-banner__title">实例「' +
          escapeHtml(guide.name) +
          '」已创建</strong>' +
          '<span class="instance-setup-banner__desc">建议尽快配置 <strong>SDK 服务套餐</strong>，便于资源池履约与开通。</span>' +
          '</div>' +
          '<div class="instance-setup-banner__actions">' +
          '<button type="button" class="btn btn--primary btn--sm" id="btn-inst-setup-go">去配置 SDK 套餐</button>' +
          '<button type="button" class="btn btn--ghost btn--sm" id="btn-inst-setup-dismiss">知道了</button>' +
          '</div></div>'
        : '';
    var body = rows
      .map(function (r) {
        var pnames = instancePackageNames(r);
        var pkgCell;
        if (!pnames.length) {
          pkgCell = '<span class="table-muted">—</span>';
        } else {
          pkgCell =
            '<div class="cell-bound-pkgs">' +
            pnames
              .map(function (n) {
                return '<span class="tag tag--pkg">' + escapeHtml(n) + '</span>';
              })
              .join('') +
            '</div>';
        }
        var st = instanceHasPackage(r)
          ? '<span class="tag tag--ok">已配置</span>'
          : '<span class="tag tag--warn">待配置</span>';
        var autoStock = escapeHtml(r.deviceAutoStock || '—');
        var actMode = escapeHtml((r.activateMode && String(r.activateMode).trim()) || '—');
        var pref =
          r.accountPrefix != null && String(r.accountPrefix).trim() !== ''
            ? escapeHtml(String(r.accountPrefix).trim())
            : '<span class="table-muted">—</span>';
        return (
          '<tr><td>' +
          escapeHtml(r.company) +
          '</td><td><a class="table-link" href="#/admin/instances/detail?name=' +
          encodeURIComponent(r.name) +
          '">' +
          escapeHtml(r.name) +
          '</a></td><td>' +
          autoStock +
          '</td><td>' +
          actMode +
          '</td><td>' +
          pref +
          '</td><td>' +
          st +
          '</td><td>' +
          pkgCell +
          '</td><td class="cell-actions">' +
          '<div class="row-action-btns">' +
          '<button type="button" class="link-btn" data-inst-edit="' +
          encodeURIComponent(r.name) +
          '">编辑</button> ' +
          '<a class="link-btn" href="#/admin/instances/detail?name=' +
          encodeURIComponent(r.name) +
          '">详情</a></div></td></tr>'
        );
      })
      .join('');
    return (
      '<h1 class="page-title">实例</h1>' +
      '<p class="page-sub">新增实例仅需填写企业与履约参数；绑定 SDK 服务套餐请在<strong>编辑实例</strong>中完成。</p>' +
      banner +
      '<div class="toolbar toolbar--end">' +
      '<button type="button" class="btn btn--primary" id="btn-new-instance">新增实例</button></div>' +
      '<div class="table-wrap" id="inst-list-wrap"><table class="data-table"><thead><tr><th>企业名称</th><th>实例名称</th><th>设备自动入库</th><th>激活方式</th><th>帐号前缀</th><th>SDK套餐状态</th><th>绑定套餐</th><th class="cell-actions">操作</th></tr></thead><tbody>' +
      body +
      '</tbody></table></div>'
    );
  }

  function instanceCredMask(val) {
    if (val == null || String(val).trim() === '') return '—';
    var s = String(val).trim();
    if (s.length <= 4) return '******';
    if (s.length <= 12) return s.slice(0, 3) + '******';
    return s.slice(0, 10) + '******' + s.slice(-2);
  }

  var INST_SECRET_EYE_SVG =
    '<svg class="inst-secret__icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />' +
    '</svg>';

  /** SK / SIS：默认秘文，点击眼睛切换明文（演示） */
  function buildInstSecretToggleCell(fullRaw) {
    var full = fullRaw != null ? String(fullRaw).trim() : '';
    if (!full) return '<span class="table-muted">—</span>';
    var masked = instanceCredMask(full);
    return (
      '<div class="inst-secret">' +
      '<span class="inst-secret__text desc-list__mono">' +
      escapeHtml(masked) +
      '</span>' +
      '<button type="button" class="inst-secret__toggle"' +
      ' data-inst-secret-toggle' +
      ' data-full="' +
      encodeURIComponent(full) +
      '" data-masked="' +
      encodeURIComponent(masked) +
      '" aria-label="显示完整秘文" aria-pressed="false">' +
      INST_SECRET_EYE_SVG +
      '</button></div>'
    );
  }

  function ensureInstSecretToggleHandlers() {
    if (window.__instSecretToggleBound) return;
    window.__instSecretToggleBound = true;
    document.body.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-inst-secret-toggle]');
      if (!btn) return;
      var wrap = btn.closest('.inst-secret');
      if (!wrap) return;
      var textEl = wrap.querySelector('.inst-secret__text');
      if (!textEl) return;
      var fullEnc = btn.getAttribute('data-full');
      var maskEnc = btn.getAttribute('data-masked');
      var pressed = btn.getAttribute('aria-pressed') === 'true';
      try {
        if (pressed) {
          textEl.textContent = maskEnc != null ? decodeURIComponent(maskEnc) : '—';
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', '显示完整秘文');
        } else {
          textEl.textContent = fullEnc != null ? decodeURIComponent(fullEnc) : '—';
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('aria-label', '隐藏完整秘文');
        }
      } catch (err) {
        textEl.textContent = '—';
      }
    });
  }

  function sdkRegCodeCipherDisplay(fullRaw) {
    var full = fullRaw != null ? String(fullRaw).trim() : '';
    if (!full) return '';
    var n = Math.max(12, Math.min(full.length, 28));
    var i;
    var out = '';
    for (i = 0; i < n; i++) out += '•';
    return out;
  }

  /** SDK 资源列表：注册码默认密文，点击眼睛查看明文（仅已激活账号具备注册码） */
  function buildSdkRegCodeListCell(r) {
    var activated = String(r.activateStatus || '').trim() === '已激活';
    var full = r.regCode != null ? String(r.regCode).trim() : '';
    if (!activated || !full) {
      return '<span class="table-muted">激活后生成</span>';
    }
    var masked = sdkRegCodeCipherDisplay(full);
    return (
      '<div class="inst-secret">' +
      '<span class="inst-secret__text desc-list__mono">' +
      escapeHtml(masked) +
      '</span>' +
      '<button type="button" class="inst-secret__toggle"' +
      ' data-sdk-regcode-toggle' +
      ' data-full="' +
      encodeURIComponent(full) +
      '" data-masked="' +
      encodeURIComponent(masked) +
      '" aria-label="显示完整注册码" aria-pressed="false">' +
      INST_SECRET_EYE_SVG +
      '</button></div>'
    );
  }

  function ensureSdkRegCodeToggleHandlers() {
    if (window.__sdkRegCodeToggleBound) return;
    window.__sdkRegCodeToggleBound = true;
    document.body.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-sdk-regcode-toggle]');
      if (!btn) return;
      var wrap = btn.closest('.inst-secret');
      if (!wrap) return;
      var textEl = wrap.querySelector('.inst-secret__text');
      if (!textEl) return;
      var fullEnc = btn.getAttribute('data-full');
      var maskEnc = btn.getAttribute('data-masked');
      var pressed = btn.getAttribute('aria-pressed') === 'true';
      try {
        if (pressed) {
          textEl.textContent = maskEnc != null ? decodeURIComponent(maskEnc) : '—';
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', '显示完整注册码');
        } else {
          textEl.textContent = fullEnc != null ? decodeURIComponent(fullEnc) : '—';
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('aria-label', '隐藏完整注册码');
        }
      } catch (err2) {
        textEl.textContent = '—';
      }
    });
  }

  function lookupEnterpriseIdByCompany(companyName) {
    var ent = getData().enterprises.find(function (e) {
      return e.name === companyName;
    });
    return ent ? ent.id : '—';
  }

  /** 按企业名称解析企业 ID（用于链接至公司详情）；无匹配时返回空字符串 */
  function lookupEnterpriseIdForHref(companyName) {
    var c = companyName != null ? String(companyName).trim() : '';
    if (!c) return '';
    var ent = getData().enterprises.find(function (e) {
      return e.name === c;
    });
    return ent && ent.id != null ? String(ent.id) : '';
  }

  /** 详情页顶部返回（满宽平铺，与资源信息列表页一致） */
  function entityDetailBackToolbar(href, label) {
    var icon =
      '<svg class="entity-detail-back-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return (
      '<div class="entity-detail-toolbar">' +
      '<a class="btn btn--ghost entity-detail-back-btn" href="' +
      escapeHtml(href) +
      '">' +
      icon +
      escapeHtml(label || '返回') +
      '</a></div>'
    );
  }

  /** 超管 · 实例详情页（与订单详情共用 entity-detail-*；对齐资源信息分区卡片） */
  function renderInstanceDetailPage(instNameRaw) {
    var instName = String(instNameRaw || '').trim();
    var r = getData().instances.find(function (x) {
      return x.name === instName;
    });
    if (!r) {
      return (
        '<div class="entity-detail-page">' +
        entityDetailBackToolbar('#/admin/instances', '返回实例列表') +
        '<p class="page-sub">未找到实例「' +
        escapeHtml(instName || '（未指定）') +
        '」。</p></div>'
      );
    }
    var pkgNames = instancePackageNames(r);
    var pkgDd =
      !pkgNames.length
        ? '<span class="table-muted">—</span>'
        : pkgNames
            .map(function (n) {
              return '<span class="tag tag--pkg">' + escapeHtml(n) + '</span>';
            })
            .join(' ');
    var entId = lookupEnterpriseIdByCompany(r.company);
    var pref =
      r.accountPrefix != null && String(r.accountPrefix).trim() !== ''
        ? escapeHtml(String(r.accountPrefix).trim())
        : '<span class="table-muted">—</span>';
    var pkgStatusTag = instanceHasPackage(r)
      ? '<span class="tag tag--ok">SDK 套餐已配置</span>'
      : '<span class="tag tag--warn">待配置套餐</span>';
    return (
      '<div class="entity-detail-page">' +
      entityDetailBackToolbar('#/admin/instances', '返回实例列表') +
      '<nav class="breadcrumb entity-detail-page__crumb" aria-label="面包屑">' +
      '<a href="#/admin/instances">实例列表</a> / ' +
      escapeHtml(r.name) +
      '</nav>' +
      '<div class="panel entity-detail-summary" role="region" aria-label="实例概要">' +
      '<div class="entity-detail-summary__top">' +
      '<div class="entity-detail-summary__main">' +
      '<p class="entity-detail-summary__eyebrow">实例详情</p>' +
      '<h1 class="page-title entity-detail-summary__title">' +
      escapeHtml(r.name) +
      '</h1>' +
      '<p class="page-sub entity-detail-summary__desc">实例接入标识与履约参数；以下为演示数据，生产环境需脱敏与审计。</p>' +
      '<div class="entity-detail-summary__meta">' +
      pkgStatusTag +
      '<span class="entity-detail-pill">' +
      escapeHtml(r.company) +
      '</span>' +
      '<span class="entity-detail-pill entity-detail-pill--muted">公司 ID ' +
      escapeHtml(entId) +
      '</span></div></div>' +
      '<div class="entity-detail-summary__aside">' +
      '<button type="button" class="btn btn--primary" id="btn-inst-detail-edit" data-inst-name="' +
      encodeURIComponent(r.name) +
      '">编辑实例</button></div></div></div>' +
      '<div class="entity-detail-body">' +
      '<div class="entity-detail-grid entity-detail-grid--stack">' +
      '<section class="panel entity-detail-card" id="admin-inst-detail-panel">' +
      '<div class="panel__head-row entity-detail-card__head">' +
      '<h3 class="section-title-accent section-title-accent--order">基本信息</h3></div>' +
      '<dl class="desc-list entity-detail-kv">' +
      '<div class="entity-detail-kv__item"><dt>企业名称</dt><dd>' +
      escapeHtml(r.company) +
      '</dd></div>' +
      '<div class="entity-detail-kv__item"><dt>实例名称</dt><dd>' +
      escapeHtml(r.name) +
      '</dd></div>' +
      '<div class="entity-detail-kv__item"><dt>公司 ID</dt><dd>' +
      escapeHtml(entId) +
      '</dd></div>' +
      '<div class="entity-detail-kv__item"><dt>SDK 套餐状态</dt><dd>' +
      (instanceHasPackage(r)
        ? '<span class="tag tag--ok">已配置</span>'
        : '<span class="tag tag--warn">待配置</span>') +
      '</dd></div>' +
      '<div class="entity-detail-kv__item"><dt>绑定套餐</dt><dd>' +
      pkgDd +
      '</dd></div>' +
      '<div class="entity-detail-kv__item"><dt>创建人</dt><dd>' +
      escapeHtml(r.owner || '—') +
      '</dd></div>' +
      '<div class="entity-detail-kv__item"><dt>创建时间</dt><dd>' +
      escapeHtml(r.createdAt || '—') +
      '</dd></div>' +
      '</dl></section>' +
      '<section class="panel entity-detail-card">' +
      '<div class="panel__head-row entity-detail-card__head">' +
      '<h3 class="section-title-accent section-title-accent--order">接入凭证</h3></div>' +
      '<dl class="desc-list entity-detail-kv">' +
      '<div class="entity-detail-kv__item"><dt>应用标识 AK</dt><dd class="desc-list__mono">' +
      escapeHtml(r.appKey != null && String(r.appKey).trim() !== '' ? String(r.appKey).trim() : '—') +
      '</dd></div>' +
      '<div class="entity-detail-kv__item"><dt>应用密钥 SK</dt><dd>' +
      buildInstSecretToggleCell(r.appSecret) +
      '</dd></div>' +
      '<div class="entity-detail-kv__item"><dt>实例标识 SIK</dt><dd class="desc-list__mono">' +
      escapeHtml(r.sik != null && String(r.sik).trim() !== '' ? String(r.sik).trim() : '—') +
      '</dd></div>' +
      '<div class="entity-detail-kv__item"><dt>实例密钥 SIS</dt><dd>' +
      buildInstSecretToggleCell(r.sis) +
      '</dd></div>' +
      '</dl></section>' +
      '<section class="panel entity-detail-card">' +
      '<div class="panel__head-row entity-detail-card__head">' +
      '<h3 class="section-title-accent section-title-accent--order">履约参数</h3></div>' +
      '<dl class="desc-list entity-detail-kv">' +
      '<div class="entity-detail-kv__item"><dt>设备自动入库</dt><dd>' +
      escapeHtml(r.deviceAutoStock || '—') +
      '</dd></div>' +
      '<div class="entity-detail-kv__item"><dt>激活方式</dt><dd>' +
      escapeHtml((r.activateMode && String(r.activateMode).trim()) || '—') +
      '</dd></div>' +
      '<div class="entity-detail-kv__item"><dt>帐号前缀</dt><dd class="desc-list__mono">' +
      pref +
      '</dd></div>' +
      '</dl></section>' +
      '<section class="panel entity-detail-card">' +
      '<div class="panel__head-row entity-detail-card__head">' +
      '<h3 class="section-title-accent section-title-accent--order">绑定套餐明细</h3></div>' +
      '<p class="inst-pkg-expanded__hint table-muted entity-detail-inst-pkg-hint">字段与<strong>配置中心 · 服务套餐</strong>列表一致，并展示备注与更新记录。</p>' +
      '<div class="inst-pkg-expanded-section entity-detail-inst-pkg-body">' +
      buildInstancePackagesExpandedHtml(r.name) +
      '</div>' +
      '<p class="panel__hint entity-detail-card__footnote">应用密钥 SK、实例密钥 SIS 默认秘文展示，点击旁侧图标可切换明文；应用标识 AK、实例标识 SIK 为明文。生产环境需审计与权限控制。</p>' +
      '</section></div></div></div>'
    );
  }

  function buildInstanceDetailDrawerHtml(name) {
    var r = getData().instances.find(function (x) {
      return x.name === name;
    });
    if (!r) return '';
    function cred(val) {
      return val != null && String(val).length ? val : '—';
    }
    var needPkg = !instanceHasPackage(r);
    var pkgCallout = needPkg
      ? '<div class="drawer-callout drawer-callout--warn" role="note">' +
        '<p class="drawer-callout__title">尚未配置 SDK 服务套餐</p>' +
        '<p class="drawer-callout__text">绑定后可用于资源池履约与开通；可在下方「编辑实例」中完成配置。</p>' +
        '</div>'
      : '';
    var pkgNames = instancePackageNames(r);
    var pkgLine = !pkgNames.length
      ? '—'
      : pkgNames
          .map(function (n) {
            return escapeHtml(n);
          })
          .join('、');
    return (
      '<div class="drawer-form-stack">' +
      pkgCallout +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">企业名称</span>' +
      '<div class="drawer-field-value">' +
      escapeHtml(r.company) +
      '</div></div>' +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">实例名称</span>' +
      '<div class="drawer-field-value">' +
      escapeHtml(r.name) +
      '</div></div>' +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">应用标识 AK</span>' +
      '<div class="drawer-field-value drawer-field-value--mono">' +
      escapeHtml(cred(r.appKey)) +
      '</div></div>' +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">应用密钥 SK</span>' +
      '<div class="drawer-field-value drawer-field-value--mono inst-secret-drawer">' +
      buildInstSecretToggleCell(r.appSecret) +
      '</div></div>' +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">实例标识 SIK</span>' +
      '<div class="drawer-field-value drawer-field-value--mono">' +
      escapeHtml(cred(r.sik)) +
      '</div></div>' +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">实例密钥 SIS</span>' +
      '<div class="drawer-field-value drawer-field-value--mono inst-secret-drawer">' +
      buildInstSecretToggleCell(r.sis) +
      '</div></div>' +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">SDK 服务套餐</span>' +
      '<div class="drawer-field-value">' +
      pkgLine +
      '</div></div>' +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">设备自动入库</span>' +
      '<div class="drawer-field-value">' +
      escapeHtml(r.deviceAutoStock || '—') +
      '</div></div>' +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">激活方式</span>' +
      '<div class="drawer-field-value">' +
      escapeHtml((r.activateMode && String(r.activateMode).trim()) || '—') +
      '</div></div>' +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">帐号前缀</span>' +
      '<div class="drawer-field-value drawer-field-value--mono">' +
      escapeHtml(cred(r.accountPrefix)) +
      '</div></div>' +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">创建人</span>' +
      '<div class="drawer-field-value">' +
      escapeHtml(r.owner) +
      '</div></div>' +
      '<div class="drawer-field-row">' +
      '<span class="drawer-field-label">创建时间</span>' +
      '<div class="drawer-field-value">' +
      escapeHtml(r.createdAt) +
      '</div></div>' +
      '<div class="drawer-detail-actions">' +
      '<button type="button" class="btn-drawer-primary" data-open-inst-edit="' +
      encodeURIComponent(r.name) +
      '">编辑实例</button></div></div>'
    );
  }

  /** 编辑实例抽屉顶部：对齐「编辑服务套餐」只读摘要样式 */
  function buildInstanceEditReadonlySummaryHtml(d) {
    function row(label, value, mono) {
      var raw = value != null && String(value).trim() !== '' ? String(value) : '—';
      var monoCls = mono ? ' drawer-readonly-summary__value--mono' : '';
      return (
        '<div class="drawer-readonly-summary__row">' +
        '<span class="drawer-readonly-summary__label">' +
        escapeHtml(label) +
        '</span>' +
        '<span class="drawer-readonly-summary__value' +
        monoCls +
        '">' +
        escapeHtml(raw) +
        '</span></div>'
      );
    }
    return (
      '<div class="drawer-readonly-summary" role="region" aria-label="实例信息（只读）">' +
      '<div class="drawer-readonly-summary__head">' +
      '<span class="drawer-readonly-summary__title">实例信息</span>' +
      '<span class="drawer-readonly-summary__badge">只读</span>' +
      '</div>' +
      '<p class="drawer-readonly-summary__hint">企业与客户实例标识由开通流程确定，此处不可修改；下方可维护履约参数与 SDK 服务套餐绑定。</p>' +
      '<div class="drawer-readonly-summary__list">' +
      row('企业名称', d.company, false) +
      row('实例名称', d.name, true) +
      '</div></div>'
    );
  }

  /** 实例 · SDK 服务套餐：下拉多选（编辑 / 新增共用） */
  function instSdkPkgMultiSelectSync(wrap) {
    if (!wrap || !wrap.classList.contains('inst-sdk-pkg-ms')) return;
    var summary = wrap.querySelector('.multi-select-dropdown__value');
    var cbs = wrap.querySelectorAll('input[type="checkbox"][name="inst-e-pkg"], input[type="checkbox"][name="inst-f-pkg"]');
    var picked = [];
    cbs.forEach(function (cb) {
      if (cb.checked) picked.push(cb.value);
    });
    if (!summary) return;
    if (!cbs.length) {
      summary.textContent = '暂无可选套餐';
      summary.classList.remove('multi-select-dropdown__value--placeholder');
      return;
    }
    summary.classList.toggle('multi-select-dropdown__value--placeholder', picked.length === 0);
    if (!picked.length) {
      summary.textContent = '请选择 SDK 服务套餐';
      return;
    }
    if (picked.length <= 2) {
      summary.textContent = picked.join('、');
      return;
    }
    summary.textContent = '已选 ' + picked.length + ' 项 · ' + picked.slice(0, 2).join('、') + '…';
  }

  function closeAllInstSdkPkgMultiSelects(exceptWrap) {
    document.querySelectorAll('.inst-sdk-pkg-ms.is-open').forEach(function (w) {
      if (exceptWrap && w === exceptWrap) return;
      w.classList.remove('is-open');
      var t = w.querySelector('.multi-select-dropdown__trigger');
      var p = w.querySelector('.multi-select-dropdown__panel');
      if (t) t.setAttribute('aria-expanded', 'false');
      if (p) p.hidden = true;
    });
  }

  function closeAllProdPkgMultiSelects(exceptWrap) {
    document.querySelectorAll('.prod-pkg-ms.is-open').forEach(function (w) {
      if (exceptWrap && w === exceptWrap) return;
      w.classList.remove('is-open');
      var t = w.querySelector('.multi-select-dropdown__trigger');
      var p = w.querySelector('.multi-select-dropdown__panel');
      if (t) t.setAttribute('aria-expanded', 'false');
      if (p) p.hidden = true;
    });
  }

  /** 商品表单 · 配置项内「可用服务套餐」下拉多选（样式对齐实例 SDK 套餐） */
  function prodRowPkgMultiSelectSync(wrap) {
    if (!wrap || !wrap.classList.contains('prod-pkg-ms')) return;
    var summary = wrap.querySelector('.multi-select-dropdown__value');
    var cbs = wrap.querySelectorAll('.multi-select-dropdown__inner input[type="checkbox"]');
    var picked = [];
    cbs.forEach(function (cb) {
      if (cb.checked) picked.push(cb.value);
    });
    if (!summary) return;
    if (!cbs.length) {
      summary.textContent = '暂无可选套餐';
      summary.classList.remove('multi-select-dropdown__value--placeholder');
      return;
    }
    summary.classList.toggle('multi-select-dropdown__value--placeholder', picked.length === 0);
    if (!picked.length) {
      summary.textContent = '请选择可用服务套餐';
      return;
    }
    if (picked.length <= 2) {
      summary.textContent = picked.join('、');
      return;
    }
    summary.textContent = '已选 ' + picked.length + ' 项 · ' + picked.slice(0, 2).join('、') + '…';
  }

  function buildProductSvcRowPkgMultiSelectHtml(rowBaseId, pkgNames, selectedNames, ariaLabelledby) {
    var selMap = {};
    (selectedNames || []).forEach(function (n) {
      if (n != null && String(n).trim()) selMap[String(n).trim()] = true;
    });
    var inputName = rowBaseId + '-pkg';
    var opts = (pkgNames || [])
      .map(function (name) {
        var ck = selMap[name] ? ' checked' : '';
        return (
          '<label class="multi-select-dropdown__opt">' +
          '<input type="checkbox" name="' +
          escapeHtml(inputName) +
          '" value="' +
          escapeHtml(name) +
          '"' +
          ck +
          ' />' +
          '<span class="multi-select-dropdown__opt-text">' +
          escapeHtml(name) +
          '</span></label>'
        );
      })
      .join('');
    var inner =
      opts ||
      '<p class="multi-select-dropdown__empty table-muted">暂无「启用」状态的服务套餐，请先在配置中心维护。</p>';
    var wrapId = rowBaseId + '-pkg-ms';
    var trigId = rowBaseId + '-pkg-trigger';
    var panelId = rowBaseId + '-pkg-panel';
    var sumId = rowBaseId + '-pkg-summary';
    var chevron =
      '<svg class="multi-select-dropdown__chevron-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var ariaLbl =
      ariaLabelledby && String(ariaLabelledby).trim()
        ? ' aria-labelledby="' + escapeHtml(String(ariaLabelledby).trim()) + '"'
        : '';
    return (
      '<div class="multi-select-dropdown prod-pkg-ms" id="' +
      wrapId +
      '">' +
      '<button type="button" class="multi-select-dropdown__trigger" id="' +
      trigId +
      '"' +
      ariaLbl +
      ' aria-expanded="false" aria-haspopup="listbox" aria-controls="' +
      panelId +
      '">' +
      '<span class="multi-select-dropdown__value" id="' +
      sumId +
      '"></span>' +
      '<span class="multi-select-dropdown__chevron">' +
      chevron +
      '</span></button>' +
      '<div class="multi-select-dropdown__panel" id="' +
      panelId +
      '" hidden role="listbox" aria-multiselectable="true">' +
      '<div class="multi-select-dropdown__inner">' +
      inner +
      '</div></div></div>'
    );
  }

  function productTypeSelectOptionsHtml(selectedValue, extraOptions) {
    var productTypeOptions = ['SDK', '一键固定', '外置账号', 'VRS', '功能码'];
    var merged = (extraOptions || []).concat(productTypeOptions);
    var uniq = [];
    merged.forEach(function (v) {
      if (v && uniq.indexOf(v) < 0) uniq.push(v);
    });
    var h = '<option value="">请选择</option>';
    uniq.forEach(function (v) {
      h += '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>';
    });
    if (selectedValue && uniq.indexOf(selectedValue) < 0 && String(selectedValue).trim()) {
      h +=
        '<option value="' + escapeHtml(selectedValue) + '" selected>' + escapeHtml(selectedValue) + '</option>';
    }
    return h;
  }

  function serviceNodesNamesForProductForm() {
    return (getData().serviceNodes || []).map(function (n) {
      return n.name;
    });
  }

  /** 与实例编辑抽屉一致：下拉仅展示配置中心「启用」套餐 */
  function enabledPackageNamesForProductForm() {
    return (getData().packages || [])
      .filter(function (x) {
        return x.status === '启用';
      })
      .map(function (x) {
        return x.name;
      });
  }

  /** 有 maxRows / addBtn 时在达到上限禁用「添加」 */
  function refreshProductSvcRowChrome(rowsRoot, addBtn, maxRows) {
    if (!rowsRoot) return;
    var rows = rowsRoot.querySelectorAll('.product-svc-row');
    rows.forEach(function (row, i) {
      var title = row.querySelector('.product-svc-row__title');
      if (title) title.textContent = '配置项' + (i + 1);
      var rm = row.querySelector('.product-svc-row__remove');
      if (rm) rm.hidden = rows.length <= 1;
    });
    if (addBtn) {
      var atCap = maxRows != null && rows.length >= maxRows;
      addBtn.disabled = !!atCap;
      addBtn.classList.toggle('link-btn--disabled', !!atCap);
      addBtn.setAttribute('aria-disabled', atCap ? 'true' : 'false');
    }
  }

  function buildProductSvcRowHtml(rowBaseId, opt) {
    opt = opt || {};
    var pkgNames = opt.pkgNames || [];
    var nodes = opt.nodes || [];
    var selectedType = opt.selectedType || '';
    var selectedNode = opt.selectedNode || '';
    var selectedPkgs = opt.selectedPkgs || [];
    var extraTypes = opt.extraTypes || [];
    var typeOptsHtml = productTypeSelectOptionsHtml(selectedType, extraTypes);
    function nodeOptionHtml(values, placeholder) {
      var h = '<option value="">' + escapeHtml(placeholder || '请选择') + '</option>';
      h += (values || [])
        .map(function (v) {
          return '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>';
        })
        .join('');
      return h;
    }
    var nodesHtml = nodeOptionHtml(nodes, '请选择');
    var pkgLblId = rowBaseId + '-pkg-lbl';
    var mergedPkgNames = uniqValues((pkgNames || []).concat(selectedPkgs || []));
    var pkgMs = buildProductSvcRowPkgMultiSelectHtml(rowBaseId, mergedPkgNames, selectedPkgs, pkgLblId);
    return (
      '<div class="product-svc-row">' +
      '<div class="product-svc-row__head">' +
      '<span class="product-svc-row__title">配置项</span>' +
      '<button type="button" class="link-btn product-svc-row__remove">删除</button>' +
      '</div>' +
      '<div class="form-grid">' +
      '<div class="form-field">' +
      '<label class="drawer-field-label drawer-field-label--required" for="' +
      rowBaseId +
      '-type">商品类型</label>' +
      '<select id="' +
      rowBaseId +
      '-type" class="drawer-select product-svc-row__type" required>' +
      typeOptsHtml +
      '</select></div>' +
      '<div class="form-field">' +
      '<label class="drawer-field-label drawer-field-label--required" for="' +
      rowBaseId +
      '-node">服务节点</label>' +
      '<select id="' +
      rowBaseId +
      '-node" class="drawer-select product-svc-row__node" required>' +
      nodesHtml +
      '</select></div>' +
      '<div class="drawer-field-row product-svc-pkg-field">' +
      '<span class="drawer-field-label drawer-field-label--required" id="' +
      pkgLblId +
      '">可用服务套餐</span>' +
      pkgMs +
      '</div></div></div>'
    );
  }

  function collectProductServiceRowsFromDrawer(dr, rowsSelector) {
    var root = dr.querySelector(rowsSelector);
    if (!root) return { ok: false, message: '服务配置加载失败', combos: [] };
    var rows = root.querySelectorAll('.product-svc-row');
    var combos = [];
    var nodesSeen = {};
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var typeSel = row.querySelector('.product-svc-row__type');
      var nodeSel = row.querySelector('.product-svc-row__node');
      var ms = row.querySelector('.prod-pkg-ms');
      var stdType = typeSel ? typeSel.value.trim() : '';
      var stdNode = nodeSel ? nodeSel.value.trim() : '';
      var pkgValues = [];
      if (ms) {
        ms.querySelectorAll('.multi-select-dropdown__inner input[type="checkbox"]:checked').forEach(function (cb) {
          pkgValues.push(cb.value);
        });
      }
      if (!stdType || !stdNode || !pkgValues.length) {
        return {
          ok: false,
          message: '请完整填写每条服务配置（商品类型、服务节点与至少 1 个可用服务套餐）',
          combos: []
        };
      }
      if (nodesSeen[stdNode]) {
        return { ok: false, message: '提示：配置时不能添加相同服务节点', combos: [] };
      }
      nodesSeen[stdNode] = true;
      combos.push({ productType: stdType, node: stdNode, packageNames: pkgValues });
    }
    if (!combos.length) {
      return { ok: false, message: '请至少添加一条服务配置', combos: [] };
    }
    return { ok: true, message: '', combos: combos };
  }

  function wireProductServiceConfigBlock(dr, opts) {
    opts = opts || {};
    var rowsRoot = dr.querySelector(opts.rowsSelector);
    var btnAdd = dr.querySelector(opts.addButtonSelector);
    if (!rowsRoot || !btnAdd) return;
    var rowPrefix = opts.rowIdPrefix || 'prod-svc';
    var seqKey = '__prodSvcSeq_' + rowPrefix;
    var maxRows = opts.maxRows;
    if (dr[seqKey] == null) dr[seqKey] = 0;

    function pkgNames() {
      return opts.getPackageNames ? opts.getPackageNames() : enabledPackageNamesForProductForm();
    }
    function nodeNames() {
      return opts.getNodeNames ? opts.getNodeNames() : serviceNodesNamesForProductForm();
    }

    function syncChrome() {
      refreshProductSvcRowChrome(rowsRoot, btnAdd, maxRows);
    }

    function appendRow(partial) {
      if (maxRows != null && rowsRoot.querySelectorAll('.product-svc-row').length >= maxRows) return;
      partial = partial || {};
      var id = rowPrefix + '-' + dr[seqKey]++;
      var html = buildProductSvcRowHtml(id, {
        pkgNames: pkgNames(),
        nodes: nodeNames(),
        selectedType: partial.selectedType || '',
        selectedNode: partial.selectedNode || '',
        selectedPkgs: partial.selectedPkgs || [],
        extraTypes: partial.extraTypes || []
      });
      rowsRoot.insertAdjacentHTML('beforeend', html);
      var row = rowsRoot.lastElementChild;
      var typeEl = row && row.querySelector('.product-svc-row__type');
      var nodeEl = row && row.querySelector('.product-svc-row__node');
      if (typeEl && partial.selectedType) typeEl.value = partial.selectedType;
      if (nodeEl && partial.selectedNode) nodeEl.value = partial.selectedNode;
      var ms = row && row.querySelector('.prod-pkg-ms');
      if (ms) prodRowPkgMultiSelectSync(ms);
      syncChrome();
      ensureInstSdkPkgMultiSelectHandlers();
    }

    btnAdd.addEventListener('click', function () {
      if (maxRows != null && rowsRoot.querySelectorAll('.product-svc-row').length >= maxRows) {
        toast('服务配置最多添加 ' + maxRows + ' 条', 'error');
        return;
      }
      appendRow({});
    });

    rowsRoot.addEventListener('click', function (e) {
      var rm = e.target.closest('.product-svc-row__remove');
      if (!rm || !rowsRoot.contains(rm)) return;
      var row = rm.closest('.product-svc-row');
      if (!row || rowsRoot.querySelectorAll('.product-svc-row').length <= 1) return;
      row.remove();
      syncChrome();
    });

    var initial = opts.initialCombos;
    var initialList =
      Array.isArray(initial) && initial.length
        ? maxRows != null
          ? initial.slice(0, maxRows)
          : initial.slice()
        : null;
    if (initialList && initialList.length) {
      initialList.forEach(function (c) {
        appendRow({
          selectedType: (c && c.productType) || '',
          selectedNode: (c && c.node) || '',
          selectedPkgs: (c && c.packageNames) || [],
          extraTypes: c && c.productType ? [c.productType] : []
        });
      });
    } else {
      appendRow({});
    }
  }

  function ensureInstSdkPkgMultiSelectHandlers() {
    if (window.__instSdkPkgMsBound) return;
    window.__instSdkPkgMsBound = true;
    document.body.addEventListener('click', function (e) {
      var trigInst = e.target.closest('.inst-sdk-pkg-ms .multi-select-dropdown__trigger');
      if (trigInst) {
        e.preventDefault();
        closeAllProdPkgMultiSelects();
        var wrap = trigInst.closest('.inst-sdk-pkg-ms');
        var panel = wrap && wrap.querySelector('.multi-select-dropdown__panel');
        var nowOpen = wrap && wrap.classList.contains('is-open');
        closeAllInstSdkPkgMultiSelects(nowOpen ? null : wrap);
        if (!wrap || !panel) return;
        var willOpen = !nowOpen;
        wrap.classList.toggle('is-open', willOpen);
        trigInst.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        panel.hidden = !willOpen;
        return;
      }
      var trigProd = e.target.closest('.prod-pkg-ms .multi-select-dropdown__trigger');
      if (trigProd) {
        e.preventDefault();
        closeAllInstSdkPkgMultiSelects();
        var wrapP = trigProd.closest('.prod-pkg-ms');
        var panelP = wrapP && wrapP.querySelector('.multi-select-dropdown__panel');
        var nowOpenP = wrapP && wrapP.classList.contains('is-open');
        closeAllProdPkgMultiSelects(nowOpenP ? null : wrapP);
        if (!wrapP || !panelP) return;
        var willOpenP = !nowOpenP;
        wrapP.classList.toggle('is-open', willOpenP);
        trigProd.setAttribute('aria-expanded', willOpenP ? 'true' : 'false');
        panelP.hidden = !willOpenP;
        return;
      }
      if (!e.target.closest('.inst-sdk-pkg-ms')) closeAllInstSdkPkgMultiSelects();
      if (!e.target.closest('.prod-pkg-ms')) closeAllProdPkgMultiSelects();
    });
    document.body.addEventListener('change', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'INPUT' || t.type !== 'checkbox') return;
      if (t.name === 'inst-e-pkg' || t.name === 'inst-f-pkg') {
        var wrap = t.closest('.inst-sdk-pkg-ms');
        instSdkPkgMultiSelectSync(wrap);
        return;
      }
      var wrapP = t.closest('.prod-pkg-ms');
      if (wrapP) prodRowPkgMultiSelectSync(wrapP);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeAllInstSdkPkgMultiSelects();
      closeAllProdPkgMultiSelects();
    });
  }

  function buildInstSdkPkgMultiSelectHtml(prefix, pkgs, selectedNames, ariaLabelledby) {
    var selMap = {};
    (selectedNames || []).forEach(function (n) {
      if (n != null && String(n).trim()) selMap[String(n).trim()] = true;
    });
    var inputName = prefix === 'inst-e' ? 'inst-e-pkg' : 'inst-f-pkg';
    var opts = (pkgs || [])
      .map(function (p) {
        var ck = selMap[p.name] ? ' checked' : '';
        return (
          '<label class="multi-select-dropdown__opt">' +
          '<input type="checkbox" name="' +
          inputName +
          '" value="' +
          escapeHtml(p.name) +
          '"' +
          ck +
          ' />' +
          '<span class="multi-select-dropdown__opt-text">' +
          escapeHtml(p.name) +
          '</span></label>'
        );
      })
      .join('');
    var inner =
      opts ||
      '<p class="multi-select-dropdown__empty table-muted">暂无「启用」状态的服务套餐，请先在配置中心维护。</p>';
    var wrapId = prefix + '-pkg-ms';
    var trigId = prefix + '-pkg-trigger';
    var panelId = prefix + '-pkg-panel';
    var sumId = prefix + '-pkg-summary';
    var chevron =
      '<svg class="multi-select-dropdown__chevron-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var ariaLbl =
      ariaLabelledby && String(ariaLabelledby).trim()
        ? ' aria-labelledby="' + escapeHtml(String(ariaLabelledby).trim()) + '"'
        : '';
    return (
      '<div class="multi-select-dropdown inst-sdk-pkg-ms" id="' +
      wrapId +
      '">' +
      '<button type="button" class="multi-select-dropdown__trigger" id="' +
      trigId +
      '"' +
      ariaLbl +
      ' aria-expanded="false" aria-haspopup="listbox" aria-controls="' +
      panelId +
      '">' +
      '<span class="multi-select-dropdown__value" id="' +
      sumId +
      '"></span>' +
      '<span class="multi-select-dropdown__chevron">' +
      chevron +
      '</span></button>' +
      '<div class="multi-select-dropdown__panel" id="' +
      panelId +
      '" hidden role="listbox" aria-multiselectable="true">' +
      '<div class="multi-select-dropdown__inner">' +
      inner +
      '</div></div></div>'
    );
  }

  function buildInstanceEditFormDrawerHtml(name) {
    var d = getData().instances.find(function (x) {
      return x.name === name;
    });
    if (!d) return '';
    var pkgs = getData().packages.filter(function (p) {
      return p.status === '启用';
    });
    var selectedPkgs = instancePackageNames(d);
    var pkgMs = buildInstSdkPkgMultiSelectHtml('inst-e', pkgs, selectedPkgs, 'inst-e-pkg-lbl');
    return (
      '<div class="drawer-form-stack drawer-form-stack--node-edit">' +
      buildInstanceEditReadonlySummaryHtml(d) +
      '<div class="drawer-edit-editable">' +
      '<div class="drawer-edit-editable__head">' +
      '<span class="drawer-edit-editable__title">可编辑配置</span>' +
      '<span class="drawer-edit-editable__hint">履约参数 · SDK 套餐绑定</span>' +
      '</div>' +
      '<form id="form-inst-edit-drawer" class="drawer-edit-editable__form">' +
      '<div class="form-field">' +
      '<label class="drawer-field-label drawer-field-label--required" for="inst-e-auto">设备自动入库</label>' +
      '<select id="inst-e-auto" class="drawer-select" required>' +
      '<option value="是"' +
      (d.deviceAutoStock === '否' ? '' : ' selected') +
      '>是</option>' +
      '<option value="否"' +
      (d.deviceAutoStock === '否' ? ' selected' : '') +
      '>否</option></select></div>' +
      '<div class="form-field">' +
      '<label class="drawer-field-label drawer-field-label--required" for="inst-e-act">激活方式</label>' +
      '<select id="inst-e-act" class="drawer-select" required>' +
      '<option value="设备SN绑定"' +
      ((d.activateMode || '设备SN绑定') === '设备SN绑定' ? ' selected' : '') +
      '>设备SN绑定</option>' +
      '<option value="手动激活"' +
      ((d.activateMode || '') === '手动激活' ? ' selected' : '') +
      '>手动激活</option>' +
      '<option value="在线激活"' +
      ((d.activateMode || '') === '在线激活' ? ' selected' : '') +
      '>在线激活</option></select></div>' +
      '<div class="form-field">' +
      '<label class="drawer-field-label" for="inst-e-prefix">帐号前缀</label>' +
      '<input id="inst-e-prefix" type="text" class="drawer-input" maxlength="64" value="' +
      escapeHtml(d.accountPrefix || '') +
      '" placeholder="账号前缀为4位小写字母，无则留空" /></div>' +
      '<div class="drawer-field-row inst-edit-drawer__pkg-field">' +
      '<span class="drawer-field-label" id="inst-e-pkg-lbl">SDK 服务套餐</span>' +
      pkgMs +
      '</div>' +
      '</form></div></div>'
    );
  }

  function openInstanceEditDrawer(name, opts) {
    opts = opts || {};
    var html = buildInstanceEditFormDrawerHtml(name);
    if (!html) {
      toast('未找到实例', 'error');
      return;
    }
    openDrawer(
      '编辑实例 · ' + name,
      html,
      function (dr, close) {
        var pkgSel = [];
        dr.querySelectorAll('input[name="inst-e-pkg"]:checked').forEach(function (cb) {
          pkgSel.push(cb.value);
        });
        if (!pkgSel.length) {
          toast('未绑定 SDK 服务套餐可能影响后续资源池履约，请尽快配置', 'warn');
        }
        var act = dr.querySelector('#inst-e-act').value.trim();
        if (!act) {
          toast('请选择激活方式', 'error');
          return;
        }
        saveInstancePatch(name, {
          packageNames: pkgSel.slice(),
          packageName: pkgSel[0] || '',
          deviceAutoStock: dr.querySelector('#inst-e-auto').value,
          activateMode: act,
          accountPrefix: dr.querySelector('#inst-e-prefix').value.trim()
        });
        toast('已保存（演示）', 'success');
        close();
        render();
      },
      { primaryLabel: '保存' },
      function (dr, close) {
        var ms = dr.querySelector('#inst-e-pkg-ms');
        if (ms) instSdkPkgMultiSelectSync(ms);
        ensureInstSdkPkgMultiSelectHandlers();
        if (!opts.focusPackage) return;
        var msRoot = dr.querySelector('#inst-e-pkg-ms');
        var rowEl = msRoot && msRoot.closest('.inst-edit-drawer__pkg-field');
        if (rowEl) rowEl.classList.add('drawer-field-row--highlight');
        if (msRoot) {
          setTimeout(function () {
            var trig = msRoot.querySelector('#inst-e-pkg-trigger');
            if (trig) trig.focus();
            if (msRoot.scrollIntoView) msRoot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }, 120);
        }
      }
    );
  }

  /** 新增实例 · 抽屉：企业名称/ 实例名称 / 履约参数（自动入库、激活方式、帐号前缀）；SDK 套餐仅可在编辑实例中绑定 */
  function buildInstanceCreateFormHtml() {
    var ents = getData().enterprises.filter(function (e) {
      return e.status === '正常';
    });
    var entOpts = ents
      .map(function (e) {
        return '<option value="' + escapeHtml(e.name) + '">' + escapeHtml(e.name) + '</option>';
      })
      .join('');
    return (
      '<div class="drawer-form-stack">' +
      '<div class="drawer-field-row">' +
      '<label class="drawer-field-label drawer-field-label--required" for="inst-f-customer">企业名称</label>' +
      '<select id="inst-f-customer" class="drawer-select" required><option value="">请选择</option>' +
      entOpts +
      '</select></div>' +
      '<div class="drawer-field-row">' +
      '<label class="drawer-field-label drawer-field-label--required" for="inst-f-name">实例名称</label>' +
      '<input id="inst-f-name" class="drawer-input" required maxlength="128" placeholder="请输入" /></div>' +
      '<div class="drawer-field-row">' +
      '<label class="drawer-field-label drawer-field-label--required" for="inst-f-auto">设备自动入库</label>' +
      '<select id="inst-f-auto" class="drawer-select" required>' +
      '<option value="是" selected>是</option><option value="否">否</option></select></div>' +
      '<div class="drawer-field-row">' +
      '<label class="drawer-field-label drawer-field-label--required" for="inst-f-act">激活方式</label>' +
      '<select id="inst-f-act" class="drawer-select" required>' +
      '<option value="设备SN绑定" selected>设备SN绑定</option>' +
      '<option value="手动激活">手动激活</option>' +
      '<option value="在线激活">在线激活</option></select></div>' +
      '<div class="drawer-field-row">' +
      '<label class="drawer-field-label" for="inst-f-prefix">帐号前缀</label>' +
      '<input id="inst-f-prefix" class="drawer-input" maxlength="64" autocomplete="off" placeholder="账号前缀为4位小写字母，无则留空" /></div>' +
      '</div>'
    );
  }

  /** 兼容旧版 resourcePools 行（仅 company/instance/spec/total/used） */
  function normalizeResourcePoolLines(raw) {
    return (raw || []).map(function (line) {
      if (line && line.product) return line;
      var spec = (line && line.spec) || '—';
      return {
        enterpriseId: (line && line.enterpriseId) || '',
        company: (line && line.company) || '',
        instance: (line && line.instance) || '',
        product: spec,
        spec: spec,
        isDefault: !!(line && line.isDefault),
        total: Number(line && line.total) || 0,
        used: Number(line && line.used) || 0
      };
    });
  }

  function uniqValues(list) {
    var seen = {};
    return list.filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  /**
   * 演示层模拟后端规则 A：同实例 + 同商品至多一条默认规格。
   */
  function persistPoolDefaultSpecs(targetLine, wantsDefault) {
    var overlay = getOverlay();
    if (!overlay.resourcePoolPatches) overlay.resourcePoolPatches = {};
    var pool = normalizeResourcePoolLines(getData().resourcePools || []);
    var tKey = poolRowKey(targetLine);
    pool.forEach(function (line) {
      var key = poolRowKey(line);
      var sameGrp = line.instance === targetLine.instance && line.product === targetLine.product;
      if (!sameGrp) return;
      if (key === tKey) {
        overlay.resourcePoolPatches[key] = Object.assign({}, overlay.resourcePoolPatches[key], { isDefault: !!wantsDefault });
      } else if (wantsDefault) {
        overlay.resourcePoolPatches[key] = Object.assign({}, overlay.resourcePoolPatches[key], { isDefault: false });
      }
    });
    saveOverlay(overlay);
  }

  function filterPoolLines(lines, state) {
    state = state || {};
    var company = state.company || '';
    var instance = state.instance || '';
    var keyword = (state.keyword || '').trim().toLowerCase();
    var hideEmpty = !!state.hideEmpty;
    return lines.filter(function (line) {
      if (company && line.company !== company) return false;
      if (instance && line.instance !== instance) return false;
      if (hideEmpty && !(line.total > 0 || line.used > 0)) return false;
      if (!keyword) return true;
      var haystack = [line.company, line.instance, line.product, line.spec].join(' ').toLowerCase();
      return haystack.indexOf(keyword) >= 0;
    });
  }

  function summarizePoolLines(lines) {
    var companyMap = {};
    var instanceMap = {};
    var total = 0;
    var used = 0;
    lines.forEach(function (line) {
      if (line.company) companyMap[line.company] = true;
      if (line.instance) instanceMap[line.instance] = true;
      total += Number(line.total) || 0;
      used += Number(line.used) || 0;
    });
    return {
      companyCount: Object.keys(companyMap).length,
      instanceCount: Object.keys(instanceMap).length,
      lineCount: lines.length,
      total: total,
      used: used,
      unused: total - used
    };
  }

  /**
   * 资源池主表：按qi ye名称、实例名称分组合并单元格，行为商品规格明细（对齐运营侧全量统计视图）
   */
  function buildMergedPoolTableBody(lines) {
    lines = normalizeResourcePoolLines(lines);
    lines = lines.slice().sort(function (a, b) {
      var c = String(a.company).localeCompare(String(b.company), 'zh-CN');
      if (c !== 0) return c;
      c = String(a.instance).localeCompare(String(b.instance), 'zh-CN');
      if (c !== 0) return c;
      return String(a.product + '\0' + a.spec).localeCompare(String(b.product + '\0' + b.spec), 'zh-CN');
    });
    var html = '';
    var i = 0;
    while (i < lines.length) {
      var company = lines[i].company;
      var j = i;
      while (j < lines.length && lines[j].company === company) j++;
      var companySpan = j - i;
      var ki = i;
      while (ki < j) {
        var instance = lines[ki].instance;
        var k = ki;
        while (k < j && lines[k].instance === instance) k++;
        var instSpan = k - ki;
        for (var r = ki; r < k; r++) {
          var line = lines[r];
          var unused = line.total - line.used;
          var row = '<tr>';
          if (r === i) {
            var instForCompanyLink = String(line.instance || '').trim();
            if (!instForCompanyLink && line.company) {
              var fc = firstInstanceForCompany(String(line.company).trim());
              if (fc && fc.name) instForCompanyLink = String(fc.name).trim();
            }
            var companyCellInner =
              instForCompanyLink
                ? '<a class="table-link" href="#/admin/instances/detail?name=' +
                  encodeURIComponent(instForCompanyLink) +
                  '">' +
                  escapeHtml(line.company) +
                  '</a>'
                : escapeHtml(line.company);
            row +=
              '<td rowspan="' +
              companySpan +
              '" class="cell-merge cell-merge--company">' +
              companyCellInner +
              '</td>';
          }
          if (r === ki) {
            row +=
              '<td rowspan="' +
              instSpan +
              '" class="cell-merge cell-merge--instance">' +
              escapeHtml(line.instance) +
              '</td>';
          }
          row +=
            '<td>' +
            escapeHtml(line.product) +
            '</td>' +
            '<td>' +
            escapeHtml(line.spec) +
            '</td>' +
            '<td>' +
            (line.isDefault ? '是' : '否') +
            '</td>' +
            '<td class="table-tabular">' +
            line.total +
            '</td>' +
            '<td class="table-tabular">' +
            line.used +
            '</td>' +
            '<td class="table-tabular">' +
            unused +
            '</td>' +
            '<td class="pool-row-actions cell-actions">' +
            '<div class="row-action-btns">' +
            '<button type="button" class="link-btn" data-pool-config data-enterprise-id="' +
            escapeHtml(line.enterpriseId || '') +
            '" data-company="' +
            escapeHtml(line.company) +
            '" data-instance="' +
            escapeHtml(line.instance) +
            '" data-spec="' +
            escapeHtml(line.spec) +
            '" data-product="' +
            escapeHtml(line.product) +
            '" data-default="' +
            (line.isDefault ? '1' : '0') +
            '">配置</button>' +
            '<button type="button" class="link-btn" data-pool-renew data-company="' +
            escapeHtml(line.company) +
            '" data-instance="' +
            escapeHtml(line.instance) +
            '" data-spec="' +
            escapeHtml(line.spec) +
            '" data-product="' +
            escapeHtml(line.product) +
            '" data-default="' +
            (line.isDefault ? '1' : '0') +
            '">续费</button>' +
            (r === i
              ? '<button type="button" class="link-btn" data-pool-order data-company="' +
                escapeHtml(line.company) +
                '">新规格下单</button>'
              : '') +
            '</div></td></tr>';
          html += row;
        }
        ki = k;
      }
      i = j;
    }
    return html;
  }

  /** 资源池订单：CORS 账号（展示名）；兼容历史 mock「外置帐号」口径 */
  function isPoolOrderExternalAccountType(t) {
    return (
      t === 'CORS账号' ||
      t === 'CORS帐号' ||
      t === '外置帐号' ||
      t === '外置账号' ||
      t === '外置账号订单'
    );
  }

  /** 演示：新规格下单不再选手动实例，按客户自动取排序后的第一个实例。 */
  function firstInstanceForCompany(companyName) {
    if (!companyName) return null;
    var list = getData().instances.filter(function (i) {
      return i.company === companyName;
    });
    list.sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name), 'zh-CN');
    });
    return list[0] || null;
  }

  function openAdminPoolOrderDrawer(opts) {
    opts = opts || {};
    var fixedCompany = opts.fixedCompany ? String(opts.fixedCompany).trim() : '';
    var ents = getData().enterprises;
    var products = getData().products;
    var poolCompanyEl = document.getElementById('pool-company');
    var filterCompany =
      poolCompanyEl && poolCompanyEl.value ? String(poolCompanyEl.value).trim() : '';
    var firstCo = fixedCompany || filterCompany || (ents[0] ? ents[0].name : '');
    var eo;
    if (fixedCompany) {
      eo =
        '<option value="' +
        escapeHtml(fixedCompany) +
        '" selected>' +
        escapeHtml(fixedCompany) +
        '</option>';
    } else {
      eo = ents
        .map(function (e) {
          var selected = e.name === firstCo ? ' selected' : '';
          return (
            '<option value="' + escapeHtml(e.name) + '"' + selected + '>' + escapeHtml(e.name) + '</option>'
          );
        })
        .join('');
    }
    var defaultProd = products[0] ? products[0].name : '';
    function specOptionsHtml(prodName) {
      return (getData().specs || [])
        .filter(function (s) {
          return s.product === prodName;
        })
        .map(function (s) {
          return (
            '<option value="' +
            escapeHtml(s.id) +
            '">' +
            escapeHtml(s.product + ' · ' + s.name) +
            '</option>'
          );
        })
        .join('');
    }
    var poProdHtml = products
      .map(function (p, i) {
        return (
          '<option value="' +
          escapeHtml(p.name) +
          '"' +
          (p.name === defaultProd ? ' selected' : '') +
          '>' +
          escapeHtml(p.name) +
          '</option>'
        );
      })
      .join('');
    var initialSpecs = specOptionsHtml(defaultProd) || '<option value="">该商品下暂无规格</option>';
    var readonlyCompanyBlock = '';
    var companyFieldHtml = '';
    if (fixedCompany) {
      readonlyCompanyBlock =
        '<div class="drawer-readonly-summary drawer-readonly-summary--single-row" role="region" aria-label="企业名称（只读）">' +
        '<div class="drawer-readonly-summary__row">' +
        '<span class="drawer-readonly-summary__label">企业名称</span>' +
        '<span class="drawer-readonly-summary__value">' +
        escapeHtml(fixedCompany) +
        '</span></div></div>' +
        '<input type="hidden" id="po-company" value="' +
        escapeHtml(fixedCompany) +
        '" />';
    } else {
      companyFieldHtml =
        '<div class="form-field"><label for="po-company"><span class="field-required-mark">*</span>企业名称</label>' +
        '<select id="po-company" required>' +
        eo +
        '</select></div>';
    }
    openDrawer(
      '新规格下单',
      '<div class="drawer-form-stack drawer-form-stack--node-edit">' +
        readonlyCompanyBlock +
        '<div class="drawer-edit-editable">' +
        '<div class="drawer-edit-editable__head">' +
        '<span class="drawer-edit-editable__title">' +
        (fixedCompany ? '规格与数量' : '下单信息') +
        '</span>' +
        '<span class="drawer-edit-editable__hint">可编辑</span>' +
        '</div>' +
        '<div class="drawer-edit-editable__form">' +
        companyFieldHtml +
        '<div class="form-field"><label for="pot"><span class="field-required-mark">*</span>商品类型</label><select id="pot" required>' +
        '<option value="SDK" selected>SDK</option>' +
        '<option value="CORS账号">CORS账号</option></select></div>' +
        '<div class="form-field"><label for="po-prod"><span class="field-required-mark">*</span>商品</label><select id="po-prod" required>' +
        poProdHtml +
        '</select></div>' +
        '<div class="form-field"><label for="po-spec"><span class="field-required-mark">*</span>商品规格</label><select id="po-spec" required>' +
        initialSpecs +
        '</select></div>' +
        '<div id="pool-ord-sdk-block" class="drawer-form-stack">' +
        '<div class="form-field"><label for="po-sdk-qty"><span class="field-required-mark">*</span>数量</label>' +
        '<input id="po-sdk-qty" type="number" min="1" step="1" value="10" /></div>' +
        '</div>' +
        '<div id="pool-ord-ext-block" class="drawer-form-stack" style="display:none">' +
        '<div class="form-field"><label for="po-ext-qty"><span class="field-required-mark">*</span>数量</label>' +
        '<input id="po-ext-qty" type="number" min="1" step="1" value="10" /></div>' +
        '</div>' +
        '<div class="form-field"><label for="po-sap">客户参考(SAP)</label>' +
        '<input id="po-sap" placeholder="SAP 参考号或合同行" /></div>' +
        '<div class="form-field"><label for="po-remark">备注</label>' +
        '<textarea id="po-remark" rows="2" placeholder="可选"></textarea></div>' +
        '</div></div></div>',
      function (dr, close) {
        var type = dr.querySelector('#pot').value;
        var companyEl = dr.querySelector('#po-company');
        var company = (fixedCompany || (companyEl && companyEl.value) || '').trim();
        var prodName = dr.querySelector('#po-prod').value;
        var specId = dr.querySelector('#po-spec').value;
        var specsFresh = getData().specs || [];
        if (!company) {
          toast('请选择企业名称', 'error');
          return;
        }
        var instRow = firstInstanceForCompany(company);
        if (!instRow) {
          toast('该客户下暂无实例，请先在实例模块创建', 'error');
          return;
        }
        var instName = instRow.name;
        if (!prodName) {
          toast('请选择商品', 'error');
          return;
        }
        if (!specId) {
          toast('请选择商品规格', 'error');
          return;
        }
        var specRow = specsFresh.find(function (s) {
          return s.id === specId;
        });
        var specLabel = specRow ? specRow.product + ' · ' + specRow.name : '';
        var sapRef = dr.querySelector('#po-sap').value.trim();
        var remark = dr.querySelector('#po-remark').value.trim();
        var autoStock = instRow.deviceAutoStock || '是';
        var actMode = (instRow.activateMode || '').trim() || '设备SN绑定';
        var payload = {
          no: 'POOL-' + Date.now(),
          type: type,
          company: company,
          instance: instName,
          product: prodName,
          spec: specLabel,
          deviceAutoStock: '',
          activateMode: '',
          importSn: '',
          accountPrefix: '',
          quantity: null,
          sapRef: sapRef,
          remark: remark,
          status: '待处理'
        };
        if (type === 'SDK') {
          var qtySdk = parseInt(dr.querySelector('#po-sdk-qty').value, 10);
          if (!qtySdk || qtySdk < 1 || isNaN(qtySdk)) {
            toast('请填写有效的数量', 'error');
            return;
          }
          payload.deviceAutoStock = autoStock;
          payload.activateMode = actMode;
          payload.importSn = '';
          payload.quantity = qtySdk;
        } else if (isPoolOrderExternalAccountType(type)) {
          var pref = (instRow.accountPrefix || '').trim();
          var qtyExt = parseInt(dr.querySelector('#po-ext-qty').value, 10);
          if (!pref) {
            toast('该客户默认实例未配置帐号前缀，请在实例侧补全后再下 CORS 账号单', 'error');
            return;
          }
          if (!qtyExt || qtyExt < 1 || isNaN(qtyExt)) {
            toast('请填写有效的数量', 'error');
            return;
          }
          payload.deviceAutoStock = autoStock;
          payload.activateMode = actMode;
          payload.accountPrefix = pref;
          payload.quantity = qtyExt;
        } else {
          toast('不支持的商品类型', 'error');
          return;
        }
        appendOverlay('resourceOrders', payload);
        toast('新规格下单已提交（演示）', 'success');
        close();
        render();
      }
    );
    setTimeout(function () {
      var dr = document.querySelector('.drawer');
      if (!dr) return;
      var pot = dr.querySelector('#pot');
      var prodSel = dr.querySelector('#po-prod');
      var specSel = dr.querySelector('#po-spec');
      var sdkBlock = dr.querySelector('#pool-ord-sdk-block');
      var extBlock = dr.querySelector('#pool-ord-ext-block');
      function syncSpecs() {
        var pn = prodSel.value;
        specSel.innerHTML = specOptionsHtml(pn) || '<option value="">该商品下暂无规格</option>';
      }
      function syncOrderType() {
        var t = pot.value;
        if (sdkBlock) sdkBlock.style.display = t === 'SDK' ? 'flex' : 'none';
        if (extBlock) extBlock.style.display = isPoolOrderExternalAccountType(t) ? 'flex' : 'none';
      }
      prodSel.addEventListener('change', syncSpecs);
      pot.addEventListener('change', syncOrderType);
      pot.addEventListener('input', syncOrderType);
      syncOrderType();
    }, 0);
  }

  /** 解析粘贴/导入的 SN 文本（支持表头 device_sn，逗号分隔取首列） */
  function parseSdkSnImportText(raw) {
    var lines = String(raw || '')
      .split(/\r?\n/)
      .map(function (l) {
        return l.trim();
      })
      .filter(Boolean);
    if (!lines.length) return [];
    var head = lines[0]
      .replace(/^\uFEFF/, '')
      .replace(/^"|"$/g, '')
      .trim()
      .toLowerCase();
    if (head === 'device_sn' || head === 'sn' || head === '设备sn') {
      lines = lines.slice(1);
    }
    return lines
      .map(function (line) {
        var t = line.replace(/^"|"$/g, '').trim();
        if (t.indexOf(',') >= 0) {
          return t.split(',')[0].replace(/^"|"$/g, '').trim();
        }
        return t;
      })
      .filter(Boolean);
  }

  function uniqueSdkSnCount(lines) {
    var seen = {};
    lines.forEach(function (x) {
      seen[x] = 1;
    });
    return Object.keys(seen).length;
  }

  /** SDK 开通账号抽屉：绑定 SN 分段控件与文件导入 */
  function wireSdkOpenAccountSnBind(dr) {
    var tabManual = dr.querySelector('#soa-sn-tab-manual');
    var tabFile = dr.querySelector('#soa-sn-tab-file');
    var panelManual = dr.querySelector('#soa-sn-panel-manual');
    var panelFile = dr.querySelector('#soa-sn-panel-file');
    var ta = dr.querySelector('#soa-sn');
    var fileInput = dr.querySelector('#soa-sn-file');
    var drop = dr.querySelector('#soa-sn-drop');
    var countManual = dr.querySelector('#soa-sn-count-manual');
    var countFile = dr.querySelector('#soa-sn-count-file');
    var fileMeta = dr.querySelector('#soa-sn-file-meta');
    var fileErr = dr.querySelector('#soa-sn-file-err');
    var tplBtn = dr.querySelector('#soa-sn-template');
    if (!tabManual || !tabFile || !panelManual || !panelFile || !ta || !fileInput || !drop) return;

    dr._snBind = { mode: 'manual', fileLines: [], fileName: '' };

    function showFileError(msg) {
      if (!fileErr) return;
      if (!msg) {
        fileErr.hidden = true;
        fileErr.textContent = '';
        return;
      }
      fileErr.hidden = false;
      fileErr.textContent = msg;
    }

    function setMode(manual) {
      dr._snBind.mode = manual ? 'manual' : 'file';
      tabManual.setAttribute('aria-selected', manual ? 'true' : 'false');
      tabFile.setAttribute('aria-selected', manual ? 'false' : 'true');
      tabManual.classList.toggle('is-active', manual);
      tabFile.classList.toggle('is-active', !manual);
      panelManual.hidden = !manual;
      panelFile.hidden = manual;
      showFileError('');
      if (manual) {
        try {
          ta.focus();
        } catch (e) {}
      }
    }

    function formatCountLine(lines) {
      if (!lines.length) return '';
      var u = uniqueSdkSnCount(lines);
      return (
        '已识别 ' +
        lines.length +
        ' 条' +
        (u < lines.length ? '（去重后 ' + u + ' 条）' : '')
      );
    }

    function updateManualCount() {
      if (!countManual) return;
      countManual.textContent = formatCountLine(parseSdkSnImportText(ta.value));
    }

    tabManual.addEventListener('click', function () {
      setMode(true);
    });
    tabFile.addEventListener('click', function () {
      setMode(false);
    });

    ta.addEventListener('input', updateManualCount);

    if (tplBtn) {
      tplBtn.addEventListener('click', function () {
        var csv = '\uFEFFdevice_sn\nSN-DEMO-001\n';
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = '绑定SN导入模板.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('已下载模板（CSV）', 'success');
      });
    }

    function handleFile(f) {
      showFileError('');
      dr._snBind.fileLines = [];
      dr._snBind.fileName = '';
      if (fileMeta) fileMeta.textContent = '';
      if (countFile) countFile.textContent = '';
      if (!f) return;
      var name = (f.name || '').toLowerCase();
      if (!/\.(csv|txt|xlsx|xls)$/.test(name)) {
        showFileError('演示原型仅解析 .csv / .txt /.xlsx/.xls 文件');
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var text = String(reader.result || '');
          var lines = parseSdkSnImportText(text);
          dr._snBind.fileLines = lines;
          dr._snBind.fileName = f.name || '';
          if (fileMeta) {
            fileMeta.textContent =
              (f.name || '未命名文件') + (lines.length ? ' · 解析 ' + lines.length + ' 条' : ' · 未解析到有效 SN');
          }
          if (countFile) countFile.textContent = lines.length ? formatCountLine(lines) : '';
          if (!lines.length) {
            showFileError('文件中未识别到有效 SN，请对照模板检查列名与内容。');
          }
        } catch (err) {
          showFileError('文件读取失败，请重试。');
        }
      };
      reader.onerror = function () {
        showFileError('文件读取失败，请重试。');
      };
      reader.readAsText(f, 'UTF-8');
    }

    fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0];
      handleFile(f);
      fileInput.value = '';
    });

    drop.addEventListener('click', function () {
      fileInput.click();
    });
    drop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.add('is-drag');
      });
    });
    drop.addEventListener('dragleave', function (e) {
      if (e.target === drop) drop.classList.remove('is-drag');
    });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      drop.classList.remove('is-drag');
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      handleFile(f);
    });

    updateManualCount();
    setMode(true);
  }

  /** SDK 资源列表：开通账号（右侧抽屉）；大客户侧企业名称固定为本企业 */
  function openSdkOpenAccountDrawer() {
    var fixedClientCo = demoClientCompanyName();
    var ents = getData().enterprises;
    var products = getData().products || [];
    var firstCo = fixedClientCo || (ents[0] ? ents[0].name : '');
    var eo;
    if (fixedClientCo) {
      eo =
        '<option value="' +
        escapeHtml(fixedClientCo) +
        '" selected>' +
        escapeHtml(fixedClientCo) +
        '</option>';
    } else {
      eo =
        ents.length > 0
          ? ents
              .map(function (e) {
                var selected = e.name === firstCo ? ' selected' : '';
                return (
                  '<option value="' +
                  escapeHtml(e.name) +
                  '"' +
                  selected +
                  '>' +
                  escapeHtml(e.name) +
                  '</option>'
                );
              })
              .join('')
          : '<option value="">暂无企业客户</option>';
    }
    var defaultProd = products[0] ? products[0].name : '';
    function specOptionsHtml(prodName) {
      return (getData().specs || [])
        .filter(function (s) {
          return s.product === prodName;
        })
        .map(function (s) {
          return (
            '<option value="' +
            escapeHtml(s.id) +
            '">' +
            escapeHtml(s.product + ' · ' + s.name) +
            '</option>'
          );
        })
        .join('');
    }
    var poProdHtml =
      products.length > 0
        ? products
            .map(function (p) {
              return (
                '<option value="' +
                escapeHtml(p.name) +
                '"' +
                (p.name === defaultProd ? ' selected' : '') +
                '>' +
                escapeHtml(p.name) +
                '</option>'
              );
            })
            .join('')
        : '<option value="">暂无商品</option>';
    var initialSpecs = specOptionsHtml(defaultProd) || '<option value="">该商品下暂无规格</option>';
    openDrawer(
      '开通账号',
      '<div class="drawer-form-stack">' +
        '<div class="form-field"><label for="soa-company"><span class="field-required-mark">*</span>企业名称</label><select id="soa-company" required' +
        (fixedClientCo ? ' disabled' : '') +
        '>' +
        eo +
        '</select>' +
        (fixedClientCo
          ? '<p class="drawer-field-hint" style="margin:0.35rem 0 0">大客户视角下固定为当前登录企业。</p>'
          : '') +
        '</div>' +
        '<div class="form-field"><label for="soa-prod"><span class="field-required-mark">*</span>商品</label><select id="soa-prod" required>' +
        poProdHtml +
        '</select></div>' +
        '<div class="form-field"><label for="soa-spec"><span class="field-required-mark">*</span>商品规格</label><select id="soa-spec" required>' +
        initialSpecs +
        '</select></div>' +
        '<div class="form-field form-field--sn-bind">' +
        '<div class="sn-bind-field-head">' +
        '<label for="soa-sn"><span class="field-required-mark">*</span>绑定 SN</label>' +
        '<button type="button" class="sn-bind-template-link" id="soa-sn-template">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/></svg>' +
        '下载模板</button></div>' +
        '<div class="sn-bind-segmented" role="tablist" aria-label="SN 录入方式">' +
        '<button type="button" class="sn-bind-segmented__btn is-active" role="tab" id="soa-sn-tab-manual" aria-selected="true">手动录入</button>' +
        '<button type="button" class="sn-bind-segmented__btn" role="tab" id="soa-sn-tab-file" aria-selected="false">文件导入</button></div>' +
        '<div id="soa-sn-panel-manual" role="tabpanel" aria-labelledby="soa-sn-tab-manual">' +
        '<textarea id="soa-sn" rows="4" placeholder="每行一个设备 SN"></textarea>' +
        '<p class="sn-bind-count" id="soa-sn-count-manual" aria-live="polite"></p></div>' +
        '<div id="soa-sn-panel-file" role="tabpanel" aria-labelledby="soa-sn-tab-file" hidden>' +
        '<input type="file" id="soa-sn-file" class="visually-hidden" accept=".csv,.txt,text/csv,text/plain" />' +
        '<div class="sn-upload-zone" id="soa-sn-drop" tabindex="0" role="button" aria-label="上传 SN 列表文件">' +
        '<p class="sn-upload-zone__title">拖拽文件到此处，或点击上传</p>' +
        '<p class="sn-upload-zone__hint">支持 .csv / .txt /.xlsx/.xls（建议使用下载模板）；。</p></div>' +
        '<p class="sn-bind-file-meta" id="soa-sn-file-meta"></p>' +
        '<p class="sn-bind-count" id="soa-sn-count-file" aria-live="polite"></p>' +
        '<p class="form-field__error" id="soa-sn-file-err" role="alert" hidden></p></div>' +
        '<p class="drawer-field-hint">会查询该客户当前选中规格下面实际可用资源数量然后显示在这儿。</p></div>' +
        '<div class="form-field"><label for="soa-remark">备注</label>' +
        '<textarea id="soa-remark" rows="2" placeholder="可选"></textarea></div>' +
        '</div>',
      function (dr, close) {
        var companyEl = dr.querySelector('#soa-company');
        var company = (fixedClientCo || (companyEl && companyEl.value) || '').trim();
        var prodName = dr.querySelector('#soa-prod').value.trim();
        var specId = dr.querySelector('#soa-spec').value.trim();
        var snBind = dr._snBind || { mode: 'manual' };
        var snText = dr.querySelector('#soa-sn') ? dr.querySelector('#soa-sn').value.trim() : '';
        var remark = dr.querySelector('#soa-remark').value.trim();
        if (!company) {
          toast('请选择企业名称', 'error');
          return;
        }
        var instRow = firstInstanceForCompany(company);
        if (!instRow) {
          toast('该客户下暂无实例，请先在实例模块创建', 'error');
          return;
        }
        if (!prodName) {
          toast('请选择商品', 'error');
          return;
        }
        if (!specId) {
          toast('请选择商品规格', 'error');
          return;
        }
        var specRow = (getData().specs || []).find(function (s) {
          return s.id === specId;
        });
        var specLabel = specRow ? specRow.product + ' · ' + specRow.name : prodName;
        var lines =
          snBind.mode === 'file'
            ? (snBind.fileLines || []).slice()
            : parseSdkSnImportText(snText);
        if (!lines.length) {
          toast(
            snBind.mode === 'file'
              ? '请上传包含 SN 的文件（.csv / .txt），或使用手动录入'
              : '请填写绑定 SN（每行一个）',
            'error'
          );
          return;
        }
        var instName = instRow.name;
        var tag = String(lines[0])
          .replace(/[^A-Za-z0-9]/g, '')
          .slice(0, 8) || 'NEW';
        lines.forEach(function (snLine, idx) {
          var suffix = Date.now() + '-' + idx;
          appendOverlay('sdkResources', {
            sdkResKey: 'sdkres-open-' + suffix,
            company: company,
            instance: instName,
            ak: 'AK_' + tag + '_' + String(suffix).slice(-6) + 'a1b2c3d4',
            regCode: '',
            sn: snLine,
            ntripAccount: '',
            activateMode: (instRow.activateMode || '').trim() || '设备SN绑定',
            entryMode: instRow.deviceAutoStock === '否' ? '手动入库' : '自动入库',
            activateStatus: '未激活',
            status: '服务中',
            billingMode: '连续计费',
            product: prodName,
            spec: specLabel,
            activatedAt: '',
            expireAt: '',
            remaining: '—',
            remark: remark,
            region: '—',
            line: '—',
            deviceType: ''
          });
        });
        toast('已提交开通（演示）', 'success');
        close();
        render();
      },
      { primaryLabel: '提交' },
      function (drawerEl) {
        var prodSel = drawerEl.querySelector('#soa-prod');
        var specSel = drawerEl.querySelector('#soa-spec');
        if (!prodSel || !specSel) return;
        function syncSpecs() {
          var pn = prodSel.value;
          specSel.innerHTML = specOptionsHtml(pn) || '<option value="">该商品下暂无规格</option>';
        }
        prodSel.addEventListener('change', syncSpecs);
        wireSdkOpenAccountSnBind(drawerEl);
      }
    );
  }

  /** CORS 账号列表：开通账号（右侧抽屉）；大客户侧企业名称固定为本企业 */
  function openCorsOpenAccountDrawer() {
    var fixedClientCo = demoClientCompanyName();
    var ents = getData().enterprises;
    var products = getData().products || [];
    var firstCo = fixedClientCo || (ents[0] ? ents[0].name : '');
    var eo;
    if (fixedClientCo) {
      eo =
        '<option value="' +
        escapeHtml(fixedClientCo) +
        '" selected>' +
        escapeHtml(fixedClientCo) +
        '</option>';
    } else {
      eo =
        ents.length > 0
          ? ents
              .map(function (e) {
                var selected = e.name === firstCo ? ' selected' : '';
                return (
                  '<option value="' +
                  escapeHtml(e.name) +
                  '"' +
                  selected +
                  '>' +
                  escapeHtml(e.name) +
                  '</option>'
                );
              })
              .join('')
          : '<option value="">暂无企业客户</option>';
    }
    var defaultProd = products[0] ? products[0].name : '';
    function specOptionsHtml(prodName) {
      return (getData().specs || [])
        .filter(function (s) {
          return s.product === prodName;
        })
        .map(function (s) {
          return (
            '<option value="' +
            escapeHtml(s.id) +
            '">' +
            escapeHtml(s.product + ' · ' + s.name) +
            '</option>'
          );
        })
        .join('');
    }
    var poProdHtml =
      products.length > 0
        ? products
            .map(function (p) {
              return (
                '<option value="' +
                escapeHtml(p.name) +
                '"' +
                (p.name === defaultProd ? ' selected' : '') +
                '>' +
                escapeHtml(p.name) +
                '</option>'
              );
            })
            .join('')
        : '<option value="">暂无商品</option>';
    var initialSpecs = specOptionsHtml(defaultProd) || '<option value="">该商品下暂无规格</option>';
    openDrawer(
      '开通账号',
      '<div class="drawer-form-stack">' +
        '<div class="form-field"><label for="coa-company"><span class="field-required-mark">*</span>企业名称</label><select id="coa-company" required' +
        (fixedClientCo ? ' disabled' : '') +
        '>' +
        eo +
        '</select>' +
        (fixedClientCo
          ? '<p class="drawer-field-hint" style="margin:0.35rem 0 0">大客户视角下固定为当前登录企业。</p>'
          : '') +
        '</div>' +
        '<div class="form-field"><label for="coa-prod"><span class="field-required-mark">*</span>商品</label><select id="coa-prod" required>' +
        poProdHtml +
        '</select></div>' +
        '<div class="form-field"><label for="coa-spec"><span class="field-required-mark">*</span>商品规格</label><select id="coa-spec" required>' +
        initialSpecs +
        '</select></div>' +
        '<div class="form-field"><label for="coa-qty"><span class="field-required-mark">*</span>数量</label>' +
        '<input id="coa-qty" type="number" min="1" step="1" value="10" />' +
        '<p class="drawer-field-hint">会查询该客户当前选中规格下面实际可用资源数量然后显示在这儿。</p></div>' +
        '<div class="form-field"><label for="coa-remark">备注</label>' +
        '<textarea id="coa-remark" rows="2" placeholder="可选"></textarea></div>' +
        '<p class="drawer-field-hint">演示规则：账号名将使用该客户在实例模块配置的<strong>帐号前缀</strong>自动生成。</p>' +
        '</div>',
      function (dr, close) {
        var companyEl = dr.querySelector('#coa-company');
        var company = (fixedClientCo || (companyEl && companyEl.value) || '').trim();
        var prodName = dr.querySelector('#coa-prod').value.trim();
        var specId = dr.querySelector('#coa-spec').value.trim();
        var qty = parseInt(dr.querySelector('#coa-qty').value, 10);
        var remark = dr.querySelector('#coa-remark').value.trim();
        if (!company) {
          toast('请选择企业名称', 'error');
          return;
        }
        var instRow = firstInstanceForCompany(company);
        if (!instRow) {
          toast('该客户下暂无实例，请先在实例模块创建', 'error');
          return;
        }
        var pref = (instRow.accountPrefix || '').trim();
        if (!pref) {
          toast('该客户默认实例未配置帐号前缀，请在实例侧补全后再开通 CORS 账号', 'error');
          return;
        }
        if (!prodName) {
          toast('请选择商品', 'error');
          return;
        }
        if (!specId) {
          toast('请选择商品规格', 'error');
          return;
        }
        if (!qty || qty < 1 || isNaN(qty)) {
          toast('请填写有效的数量', 'error');
          return;
        }
        var specRow = (getData().specs || []).find(function (s) {
          return s.id === specId;
        });
        var specLabel = specRow ? specRow.product + ' · ' + specRow.name : prodName;
        var safePref = pref.replace(/\s+/g, '');
        var account = safePref + 'open' + Date.now();
        var remarkLine =
          (remark ? remark + ' · ' : '') + '开通数量：' + qty + '（演示）';
        appendOverlay('corsResources', {
          company: company,
          account: account,
          password: '******',
          status: '待审核',
          startAt: '',
          expireAt: '',
          remaining: '—',
          forceActivateAt: '',
          activateStatus: '待激活',
          product: prodName,
          billingMode: '按量计费',
          platformLogin: '允许',
          usageRemaining: String(qty) + ' 席',
          owner: '—',
          remark: remarkLine,
          region: '—',
          spec: specLabel,
          line: 'CORS业务'
        });
        toast('已提交开通（演示）', 'success');
        close();
        render();
      },
      { primaryLabel: '提交' },
      function (drawerEl) {
        var prodSel = drawerEl.querySelector('#coa-prod');
        var specSel = drawerEl.querySelector('#coa-spec');
        if (!prodSel || !specSel) return;
        function syncSpecs() {
          var pn = prodSel.value;
          specSel.innerHTML = specOptionsHtml(pn) || '<option value="">该商品下暂无规格</option>';
        }
        prodSel.addEventListener('change', syncSpecs);
      }
    );
  }

  function renderPool() {
    var data = getData();
    var poolState = window.__poolFilter || {};
    var poolLines = normalizeResourcePoolLines(data.resourcePools || []);
    var companyOptions = uniqValues(
      poolLines
        .map(function (line) {
          return line.company;
        })
        .sort(function (a, b) {
          return String(a).localeCompare(String(b), 'zh-CN');
        })
    );
    var selectedCompany = poolState.company || '';
    var instanceOptions = uniqValues(
      poolLines
        .filter(function (line) {
          return !selectedCompany || line.company === selectedCompany;
        })
        .map(function (line) {
          return line.instance;
        })
        .sort(function (a, b) {
          return String(a).localeCompare(String(b), 'zh-CN');
        })
    );
    if (poolState.instance && instanceOptions.indexOf(poolState.instance) < 0) {
      poolState.instance = '';
      window.__poolFilter = poolState;
    }
    var filteredLines = filterPoolLines(poolLines, poolState);
    var summary = summarizePoolLines(filteredLines);
    var poolRows =
      filteredLines.length > 0
        ? buildMergedPoolTableBody(filteredLines)
        : '<tr><td colspan="9" class="table-empty table-empty--pool">' +
          '<div class="pool-empty-state">' +
          '<p class="pool-empty-state__title">暂无资源规格</p>' +
          '<p class="pool-empty-state__desc">当前筛选条件下无数据。请调整筛选展示企业数据后，在企业分组<strong>首行操作</strong>中点击<strong>新规格下单</strong>；或为已有规格行点击<strong>续费</strong>。</p>' +
          '</div></td></tr>';
    return (
      '<h1 class="page-title">资源池</h1>' +
      '<div class="panel">'+
      '<div class="toolbar toolbar--form" id="pool-filters">' +
      '<div class="form-field toolbar-field"><label for="pool-company">企业名称</label><select id="pool-company"><option value="">全部公司</option>' +
      companyOptions
        .map(function (company) {
          return '<option value="' + escapeHtml(company) + '"' + (company === selectedCompany ? ' selected' : '') + '>' + escapeHtml(company) + '</option>';
        })
        .join('') +
      '</select></div>' +
      '<div class="form-field toolbar-field"><label for="pool-instance">实例名称</label><select id="pool-instance"><option value="">全部实例</option>' +
      instanceOptions
        .map(function (instance) {
          return '<option value="' + escapeHtml(instance) + '"' + (instance === (poolState.instance || '') ? ' selected' : '') + '>' + escapeHtml(instance) + '</option>';
        })
        .join('') +
      '</select></div>' +
      '<div class="form-field toolbar-field toolbar-field--grow"><label for="pool-keyword">商品 / 规格关键词</label><input id="pool-keyword" value="' +
      escapeHtml(poolState.keyword || '') +
      '" placeholder="输入商品名或规格关键词" /></div>' +
      '<label class="toolbar-check"><input id="pool-hide-empty" type="checkbox"' +
      (poolState.hideEmpty ? ' checked' : '') +
      ' />隐藏全 0 配额</label>' +
      '<button type="button" class="btn btn--primary" id="pool-apply">应用筛选</button>' +
      '<button type="button" class="btn" id="pool-reset">重置</button>' +
      '</div></div>' +
      '<div class="panel">' +
      '<div class="table-wrap"><table class="data-table data-table--pool" id="pool-main-table"><thead><tr>' +
      '<th>企业名称</th><th>实例名称</th><th>商品名称</th><th>商品规格</th><th>是否默认规格</th>' +
      '<th class="table-tabular">总数量</th><th class="table-tabular">已使用数量</th><th class="table-tabular">未使用数量</th><th class="cell-actions">操作</th>' +
      '</tr></thead><tbody>' +
      (poolRows || '<tr><td colspan="9" class="table-empty">当前筛选条件下暂无资源池数据</td></tr>') +
      '</tbody></table></div>' +
      '<div class="table-pager">' +
      '<span class="table-pager__meta">共 ' +
      summary.lineCount +
      ' 条规格明细</span>' +
      '<div class="table-pager__controls">' +
      '<span>第 <strong>1</strong> 页</span>' +
      '<label class="table-pager__pagesize">每页 <select disabled aria-label="每页条数（演示）"><option>20 条/页</option></select></label>' +
      '</div></div></div>'
    );
  }

  /** SDK 资源：激活状态 / 服务状态标签（与表格列一致） */
  function sdkResourceActivateStatusTagHtml(v) {
    var s = v != null ? String(v).trim() : '';
    if (!s) return '—';
    var esc = escapeHtml(s);
    var cls = 'sdk-res-tag';
    if (s === '已激活') cls += ' sdk-res-tag--active';
    else if (s === '未激活') cls += ' sdk-res-tag--pending';
    else cls += ' sdk-res-tag--neutral';
    return '<span class="' + cls + '">' + esc + '</span>';
  }

  function sdkResourceServiceStatusTagHtml(v) {
    var s = v != null ? String(v).trim() : '';
    if (!s) return '—';
    var esc = escapeHtml(s);
    var cls = 'sdk-res-tag';
    if (s === '服务中') cls += ' sdk-res-tag--serving';
    else if (s === '已过期') cls += ' sdk-res-tag--expired';
    else cls += ' sdk-res-tag--neutral';
    return '<span class="' + cls + '">' + esc + '</span>';
  }

  /** SDK 资源详情抽屉（drawer-detail，与套餐/CORS 详情一致） */
  function buildSdkResourceDetailDrawerHtml(row) {
    if (!row) return '';
    var akShow = hideClientSdkIdentityColsGlobal()
      ? '—'
      : row.ak != null && String(row.ak).trim() !== ''
        ? String(row.ak)
        : '—';
    var lead =
      '<header class="drawer-detail__lead">' +
      '<p class="drawer-detail__title-inline">' +
      escapeHtml(row.regCode || '—') +
      '</p>' +
      '<div class="drawer-detail__lead-meta">' +
      '<span class="drawer-detail__pill">' +
      escapeHtml(row.product || '—') +
      '</span>' +
      '<span class="drawer-detail__code">' +
      escapeHtml(row.instance || '—') +
      '</span>' +
      '</div>' +
      '</header>';
    return (
      '<div class="drawer-detail">' +
      lead +
      drawerDetailSection(
        '状态',
        drawerDetailDlRow('激活状态', sdkResourceActivateStatusTagHtml(row.activateStatus), { html: true }) +
          drawerDetailDlRow('服务状态', sdkResourceServiceStatusTagHtml(row.status), { html: true })
      ) +
      drawerDetailSection(
        '归属与客户',
        drawerDetailDlRow('企业名称', row.company) +
          drawerDetailDlRow('实例名称', row.instance) +
          drawerDetailDlRow('应用标识 AK', akShow, { mono: true })
      ) +
      drawerDetailSection(
        '设备与接入',
        drawerDetailDlRow('设备 ID/SN', row.sn) +
          drawerDetailDlRow('设备类型', row.deviceType) +
          drawerDetailDlRow('Ntrip 账号', row.ntripAccount) +
          drawerDetailDlRow('激活方式', row.activateMode) +
          drawerDetailDlRow('入库方式', row.entryMode || row.stockMode)
      ) +
      drawerDetailSection(
        '商品',
        drawerDetailDlRow('商品名称', row.product)
      ) +
      drawerDetailSection(
        '时间与周期',
        drawerDetailDlRow('激活时间', row.activatedAt) +
          drawerDetailDlRow('到期时间', row.expireAt) +
          drawerDetailDlRow('剩余时长', row.remaining)
      ) +
      '</div>'
    );
  }

  function openSdkResourceDetailDrawer(sdkResKey) {
    var row = findSdkResourceBySdkResKey(sdkResKey);
    if (!row) {
      toast('未找到该 SDK 资源', 'error');
      return;
    }
    var titleSub = String(row.regCode || '').trim() || row.instance || sdkResKey || '—';
    openDrawer('SDK 资源详情 · ' + titleSub, buildSdkResourceDetailDrawerHtml(row), null, { readonly: true });
  }

  /** CORS 列表「状态」：启用 / 禁用（兼容历史 正常 → 启用、冻结 → 禁用） */
  function corsAccountStatusNormalize(v) {
    var s = v != null ? String(v).trim() : '';
    if (s === '正常') return '启用';
    if (s === '冻结') return '禁用';
    return s;
  }

  function corsAccountStatusTagHtml(v) {
    var s = corsAccountStatusNormalize(v);
    if (!s) return '—';
    var esc = escapeHtml(s);
    var cls = 'cors-account-tag';
    if (s === '启用') cls += ' cors-account-tag--on';
    else if (s === '禁用') cls += ' cors-account-tag--off';
    else cls += ' cors-account-tag--neutral';
    return '<span class="' + cls + '">' + esc + '</span>';
  }

  /** CORS 列表「激活状态」：独立标签样式（与账号启用/禁用区分） */
  function corsResourceActivateStatusTagHtml(v) {
    var s = v != null ? String(v).trim() : '';
    if (!s) return '—';
    var esc = escapeHtml(s);
    var cls = 'cors-act-tag';
    if (s === '已激活') cls += ' cors-act-tag--active';
    else if (s === '待激活' || s === '未激活') cls += ' cors-act-tag--pending';
    else cls += ' cors-act-tag--neutral';
    return '<span class="' + cls + '">' + esc + '</span>';
  }

  /** CORS 账号详情抽屉（布局与套餐详情 buildPackageDetailDrawerHtml 一致的 drawer-detail 风格） */
  function buildCorsDetailDrawerHtml(row) {
    if (!row) return '';
    var usage =
      row.usageRemaining != null && String(row.usageRemaining).trim() !== ''
        ? String(row.usageRemaining).trim()
        : '—';
    var statusTag = corsAccountStatusTagHtml(row.status);
    var lead =
      '<header class="drawer-detail__lead">' +
      '<p class="drawer-detail__title-inline">' +
      escapeHtml(row.account || '—') +
      '</p>' +
      '<div class="drawer-detail__lead-meta">' +
      '<span class="drawer-detail__pill">' +
      escapeHtml(row.product || 'CORS 外置账号') +
      '</span>' +
      '<span class="drawer-detail__code">' +
      escapeHtml(row.company || '—') +
      '</span>' +
      statusTag +
      '</div>' +
      (row.spec != null && String(row.spec).trim() !== ''
        ? '<p class="drawer-detail__endpoint">' + escapeHtml(String(row.spec).trim()) + '</p>'
        : '') +
      '</header>';
    return (
      '<div class="drawer-detail">' +
      lead +
      drawerDetailSection(
        '账号与归属',
        drawerDetailDlRow('企业名称', row.company) +
          drawerDetailDlRow('账号名', row.account, { mono: true }) +
          drawerDetailDlRow('负责人', row.owner) +
          drawerDetailDlRow('区域', row.region)
      ) +
      drawerDetailSection(
        '用量与计费',
        drawerDetailDlRow('计费方式', row.billingMode) +
          drawerDetailDlRow('剩余用量（演示）', usage) +
          drawerDetailDlRow('平台登录', row.platformLogin)
      ) +
      drawerDetailSection(
        '合约与激活',
          drawerDetailDlRow('激活时间', row.startAt) +
          drawerDetailDlRow('到期时间', row.expireAt) +
          drawerDetailDlRow('剩余时间', row.remaining) +
          drawerDetailDlRow('激活状态', corsResourceActivateStatusTagHtml(row.activateStatus), { html: true })
      ) +
      drawerDetailNoteBlock('备注', row.remark) +
      '<section class="drawer-detail__section">' +
      '<p class="drawer-detail__note drawer-detail__note--empty" style="margin:0">' +
      escapeHtml('用量与消耗为演示数据；正式环境由计量服务对接。') +
      '</p></section>' +
      '</div>'
    );
  }

  function openCorsDetailDrawer(account) {
    var row = findCorsResourceByAccount(account);
    if (!row) {
      toast('未找到该 CORS 账号', 'error');
      return;
    }
    openDrawer('CORS 账号详情 · ' + String(account), buildCorsDetailDrawerHtml(row), null, { readonly: true });
  }

  function openCorsEditDrawer(account) {
    var row = findCorsResourceByAccount(account);
    if (!row) {
      toast('未找到该 CORS 账号', 'error');
      return;
    }
    var remark = row.remark != null ? String(row.remark) : '';
    openDrawer(
      '编辑 CORS 账号 · ' + String(account),
      '<div class="drawer-form-stack">' +
        '<div class="drawer-readonly-summary drawer-readonly-summary--single-row" role="region" aria-label="账号（只读）">' +
        '<div class="drawer-readonly-summary__row">' +
        '<span class="drawer-readonly-summary__label">账号名</span>' +
        '<span class="drawer-readonly-summary__value drawer-readonly-summary__value--mono">' +
        escapeHtml(row.account || '') +
        '</span></div></div>' +
        '<div class="form-field"><label for="cors-ed-remark">备注</label>' +
        '<textarea id="cors-ed-remark" class="drawer-textarea" rows="3" placeholder="可选">' +
        escapeHtml(remark) +
        '</textarea></div></div>',
      function (dr, close) {
        var nextRemark = dr.querySelector('#cors-ed-remark').value.trim();
        saveCorsResourcePatch(account, { remark: nextRemark });
        toast('已保存（演示）', 'success');
        close();
        render();
      },
      { primaryLabel: '保存' }
    );
  }
  /** 大客户登录时详情抽屉内不展示 AK（演示脱敏） */
  function hideClientSdkIdentityColsGlobal() {
    try {
      var s = getSession();
      return !!(s && s.demoRole === 'client_admin');
    } catch (e) {
      return false;
    }
  }

  function renderResources(state, isClientView, listKind) {
    state = state || {};
    isClientView = !!isClientView;
    listKind = listKind === 'cors' ? 'cors' : 'sdk';
    var data = getData();
    var fCompany = state.company || '';
    var fRegion = state.region || '';
    var fSpec = state.spec || '';
    function sdkResCell(v) {
      if (v == null || String(v).trim() === '') return '—';
      return escapeHtml(String(v));
    }
    var hideClientSdkIdentityCols = isClientView && listKind === 'sdk';
    var sdkRows = data.sdkResources
      .filter(function (r) {
        return (!fCompany || r.company.indexOf(fCompany) >= 0) && (!fRegion || r.region === fRegion) && (!fSpec || r.spec.indexOf(fSpec) >= 0);
      })
      .map(function (r) {
        var sdkKey = String(r.sdkResKey || '').trim();
        var activated = String(r.activateStatus || '').trim() === '已激活';
        var rowLabel = String(r.instance || r.sn || sdkKey || '资源');
        var parts = [];
        parts.push(
          '<td class="table-checkbox-cell">' +
            '<input type="checkbox" class="sdk-batch-row-cb"' +
            (sdkKey
              ? ' value="' + escapeHtml(sdkKey) + '" data-sdk-res-key="' + escapeHtml(sdkKey) + '"'
              : ' disabled') +
            ' aria-label="选择 ' +
            escapeHtml(rowLabel) +
            '" />' +
            '</td>'
        );
        if (!hideClientSdkIdentityCols) {
          parts.push('<td>' + sdkResCell(r.company) + '</td>');
          var entIdHref = lookupEnterpriseIdForHref(r.company);
          var instRaw = r.instance != null ? String(r.instance).trim() : '';
          if (entIdHref && instRaw) {
            parts.push(
              '<td><a class="table-link" href="#/admin/enterprises/' +
                encodeURIComponent(entIdHref) +
                '">' +
                escapeHtml(instRaw) +
                '</a></td>'
            );
          } else {
            parts.push('<td>' + sdkResCell(r.instance) + '</td>');
          }
        }
        parts.push('<td>' + sdkResCell(r.sn) + '</td>');
        parts.push('<td>' + sdkResCell(r.deviceType) + '</td>');
        parts.push('<td>' + sdkResourceActivateStatusTagHtml(r.activateStatus) + '</td>');
        parts.push('<td>' + sdkResourceServiceStatusTagHtml(r.status) + '</td>');
        parts.push('<td>' + sdkResCell(r.activatedAt) + '</td>');
        parts.push('<td>' + sdkResCell(r.expireAt) + '</td>');
        parts.push('<td>' + sdkResCell(r.remaining) + '</td>');
        parts.push('<td>' + sdkResCell(r.product) + '</td>');
        parts.push('<td class="sdk-res-regcode-cell">' + buildSdkRegCodeListCell(r) + '</td>');
        parts.push('<td>' + sdkResCell(r.activateMode) + '</td>');
        parts.push('<td>' + sdkResCell(r.entryMode || r.stockMode) + '</td>');
        var actDisabled = activated || !sdkKey;
        parts.push(
          '<td class="cell-actions sdk-res-actions">' +
            '<div class="row-action-links">' +
            '<button type="button" class="link-btn' +
            (actDisabled ? ' link-btn--disabled' : '') +
            '" data-sdk-activate="' +
            escapeHtml(sdkKey) +
            '"' +
            (actDisabled ? ' disabled aria-disabled="true"' : '') +
            '>激活</button>' +
            '<span class="row-action-sep" aria-hidden="true">|</span>' +
            '<button type="button" class="link-btn" data-sdk-troubleshoot="' +
            escapeHtml(sdkKey) +
            '"' +
            (!sdkKey ? ' disabled aria-disabled="true"' : '') +
            '>排障</button>' +
            '<span class="row-action-sep" aria-hidden="true">|</span>' +
            '<button type="button" class="link-btn' +
            (!sdkKey ? ' link-btn--disabled' : '') +
            '" data-sdk-detail="' +
            escapeHtml(sdkKey) +
            '"' +
            (!sdkKey ? ' disabled aria-disabled="true"' : '') +
            '>详情</button>' +
            '</div></td>'
        );
        return '<tr>' + parts.join('') + '</tr>';
      })
      .join('');
    var corsRows = data.corsResources
      .filter(function (r) {
        var kw = fCompany;
        var matchKw =
          !kw ||
          (r.company && r.company.indexOf(kw) >= 0) ||
          (r.account && r.account.indexOf(kw) >= 0) ||
          (r.spec && r.spec.indexOf(kw) >= 0) ||
          (r.product && r.product.indexOf(kw) >= 0);
        return (
          matchKw &&
          (!fRegion || r.region === fRegion) &&
          (!fSpec || (r.spec && r.spec.indexOf(fSpec) >= 0) || (r.product && r.product.indexOf(fSpec) >= 0))
        );
      })
      .map(function (r) {
        var accountKey = String(r.account || '').trim();
        var stNorm = corsAccountStatusNormalize(r.status);
        var corsCells = [
          sdkResCell(r.company),
          sdkResCell(r.account),
          sdkResCell(r.password),
          corsAccountStatusTagHtml(r.status),
          corsResourceActivateStatusTagHtml(r.activateStatus),
          sdkResCell(r.startAt),
          sdkResCell(r.expireAt),
          sdkResCell(r.remaining),
          sdkResCell(r.product)
        ];
        if (isClientView) {
          corsCells = corsCells.slice(1);
        }
        var actionsTd =
          '<td class="cell-actions">' +
          '<div class="row-action-links">' +
          '<button type="button" class="link-btn' +
          (!accountKey ? ' link-btn--disabled' : '') +
          '" data-cors-edit="' +
          escapeHtml(accountKey) +
          '"' +
          (!accountKey ? ' disabled aria-disabled="true"' : '') +
          '>编辑</button>' +
          '<span class="row-action-sep" aria-hidden="true">|</span>' +
          '<button type="button" class="link-btn' +
          (!accountKey ? ' link-btn--disabled' : '') +
          '" data-cors-detail="' +
          escapeHtml(accountKey) +
          '"' +
          (!accountKey ? ' disabled aria-disabled="true"' : '') +
          '>详情</button>' +
          '<span class="row-action-sep" aria-hidden="true">|</span>' +
          '<details class="action-more">' +
          '<summary class="link-btn action-more__summary">更多</summary>' +
          '<div class="action-more__menu" role="menu">' +
          '<button type="button" class="action-more__item" role="menuitem" data-cors-change-pwd="' +
          escapeHtml(accountKey) +
          '"' +
          (!accountKey ? ' disabled' : '') +
          '>修改密码</button>' +
          '<button type="button" class="action-more__item" role="menuitem" data-cors-enable="' +
          escapeHtml(accountKey) +
          '"' +
          (!accountKey || stNorm === '启用' ? ' disabled' : '') +
          '>启用</button>' +
          '<button type="button" class="action-more__item" role="menuitem" data-cors-disable="' +
          escapeHtml(accountKey) +
          '"' +
          (!accountKey || stNorm === '禁用' ? ' disabled' : '') +
          '>禁用</button>' +
          '</div></details></div></td>';
        return '<tr><td>' + corsCells.join('</td><td>') + '</td>' + actionsTd + '</tr>';
      })
      .join('');
    var sdkColSpan = hideClientSdkIdentityCols ? 13 : 15;
    var sdkThead = hideClientSdkIdentityCols
      ? '<th class="table-checkbox-cell" scope="col"><input type="checkbox" id="sdk-batch-select-all" aria-label="全选当前列表" /></th>' +
        '<th>设备 ID/SN</th><th>设备类型</th>' +
        '<th>激活状态</th><th>服务状态</th>' +
        '<th>激活时间</th><th>到期时间</th><th>剩余时长</th><th>商品名称</th>' +
        '<th class="sdk-res-regcode-col">注册码</th><th>激活方式</th><th>入库方式</th><th class="cell-actions">操作</th>'
      : '<th class="table-checkbox-cell" scope="col"><input type="checkbox" id="sdk-batch-select-all" aria-label="全选当前列表" /></th>' +
        '<th>企业名称</th><th>实例名称</th><th>设备 ID/SN</th><th>设备类型</th>' +
        '<th>激活状态</th><th>服务状态</th>' +
        '<th>激活时间</th><th>到期时间</th><th>剩余时长</th><th>商品名称</th>' +
        '<th class="sdk-res-regcode-col">注册码</th><th>激活方式</th><th>入库方式</th><th class="cell-actions">操作</th>';
    var pageTitle = listKind === 'sdk' ? 'SDK 资源' : 'CORS 账号';
    var pageSub = '';
    if (isClientView) {
      pageSub =
        listKind === 'sdk'
          ? '大客户视图不展示企业名称、实例名称；应用标识 AK 可在「详情」中查看（演示脱敏）；注册码仅已激活账号具备，列表默认遮挡，请点击眼睛图标查看完整码；首列可勾选后使用「批量操作」激活。'
          : '外置 CORS 账号明细；大客户视图不展示企业名称列；筛选逻辑不变（演示）。';
    } else {
      pageSub =
        listKind === 'sdk'
          ? 'SDK 履约资源明细；应用标识 AK 请在行内「详情」中查看；注册码仅已激活账号具备，列表默认密文，请点击眼睛图标显示明文；首列勾选后可用「批量操作」激活未激活项；'
          : 'CORS 外置账号资源明细；本页可开通 CORS 账号，并查看账号消耗情况；';
    }
    var sdkTable =
      '<div class="table-wrap" id="sdk-resource-table-wrap"><table class="data-table data-table--wide"><thead><tr>' +
      sdkThead +
      '</tr></thead><tbody>' +
      (sdkRows || '') +
      (sdkRows
        ? ''
        : '<tr><td colspan="' +
          sdkColSpan +
          '" class="table-empty">当前筛选条件下暂无 SDK 资源</td></tr>') +
      '</tbody></table></div>';
    var corsColSpan = isClientView ? 9 : 10;
    var corsThead =
      (isClientView ? '' : '<th>企业名称</th>') +
      '<th>账号名</th><th>密码</th><th>状态</th><th>激活状态</th><th>激活时间</th><th>到期时间</th><th>剩余时间</th>' +
      '<th>商品</th><th class="cell-actions">操作</th>';
    var corsTable =
      '<div class="table-wrap"><table class="data-table data-table--cors-wide"><thead><tr>' +
      corsThead +
      '</tr></thead><tbody>' +
      (corsRows || '') +
      (corsRows
        ? ''
        : '<tr><td colspan="' +
          corsColSpan +
          '" class="table-empty">当前筛选条件下暂无 CORS 账号</td></tr>') +
      '</tbody></table></div>';
    return (
      '<h1 class="page-title">' +
      escapeHtml(pageTitle) +
      '</h1>' +
      '<p class="page-sub">' +
      escapeHtml(pageSub) +
      '</p>' +
      '<div class="toolbar" id="res-filters">' +
      '<input type="search" class="btn" style="flex:1;max-width:200px;text-align:left" id="f-company" placeholder="企业关键词" value="' +
      escapeHtml(fCompany) +
      '" />' +
      '<input type="search" class="btn" style="flex:1;max-width:160px;text-align:left" id="f-region" placeholder="区域" value="' +
      escapeHtml(fRegion) +
      '" />' +
      '<input type="search" class="btn" style="flex:1;max-width:200px;text-align:left" id="f-spec" placeholder="规格关键词" value="' +
      escapeHtml(fSpec) +
      '" />' +
      '<button type="button" class="btn btn--primary" id="res-filter-go">筛选</button>' +
      (listKind === 'sdk'
        ? '<div class="toolbar-spacer"></div>' +
          '<div class="toolbar-batch">' +
          '<button type="button" class="btn" id="btn-sdk-batch" aria-expanded="false" aria-haspopup="menu" aria-controls="sdk-batch-menu">批量操作</button>' +
          '<div class="toolbar-batch__menu" id="sdk-batch-menu" role="menu" hidden>' +
          '<button type="button" class="toolbar-batch__menu-item" role="menuitem" id="sdk-batch-activate">批量激活</button>' +
          '</div></div>' +
          '<button type="button" class="btn btn--primary" id="btn-sdk-open-account">开通账号</button>'
        : '') +
      (listKind === 'cors'
        ? '<div class="toolbar-spacer"></div><button type="button" class="btn btn--primary" id="btn-cors-open-account">开通账号</button>'
        : '') +
      '</div>' +
      (listKind === 'sdk' ? sdkTable : corsTable)
    );
  }

  function renderDashboard() {
    var s = getData().stats || window.PROTOTYPE_DATA.stats;
    var kpis = (s.kpis || [])
      .map(function (k) {
        return (
          '<div class="stat-card"><div class="stat-card__label">' +
          escapeHtml(k.label) +
          '</div><div class="stat-card__value">' +
          escapeHtml(k.value) +
          '</div></div>'
        );
      })
      .join('');
    var cards = (s.resourceCards || [])
      .map(function (c) {
        var pct = Math.round((100 * c.used) / c.total);
        return (
          '<div class="stat-card"><div class="stat-card__label">' +
          escapeHtml(c.name) +
          '</div><div class="stat-card__value">' +
          c.used +
          '/' +
          c.total +
          '</div><div class="stat-card__meta">余量 ' +
          (c.total - c.used) +
          ' · 使用率 ' +
          pct +
          '%</div></div>'
        );
      })
      .join('');
    var reg = (s.regionUsage || [])
      .map(function (r) {
        return (
          '<tr><td>' +
          escapeHtml(r.region) +
          '</td><td>' +
          escapeHtml(r.spec) +
          '</td><td>' +
          r.active +
          '</td><td>' +
          escapeHtml(r.updatedAt) +
          '</td></tr>'
        );
      })
      .join('');
    var trend = s.trend || { week: [] };
    var arr = trend.week || [];
    var max = Math.max.apply(null, arr.concat([1]));
    var bars = arr
      .map(function (v) {
        var h = Math.round((v / max) * 100);
        return '<div class="bar-chart__bar" style="height:' + h + '%" title="' + v + '"></div>';
      })
      .join('');
    return (
      '<h1 class="page-title">资源看板</h1>' +
      '<p class="page-sub">概要 §3：默认首页；含余量、区域激活、活跃度。新加坡节点可查全部地区，其余节点仅本地区（上线由后端鉴权）。</p>' +
      (kpis
        ? '<div class="panel" style="margin-bottom:1rem"><p class="panel__title">增长与活跃（演示）</p><div class="card-grid" style="margin-bottom:0">' +
          kpis +
          '</div></div>'
        : '') +
      '<p style="margin:0 0 0.75rem;font-size:13px;font-weight:600;color:var(--text)">按规格 · 账号余量</p>' +
      '<div class="card-grid">' +
      cards +
      '</div>' +
      '<div class="toolbar"><label style="font-size:13px">趋势粒度</label>' +
      '<select id="dash-gran" class="btn" style="padding:0.35rem 0.6rem"><option value="week">周</option><option value="day">日</option><option value="month">月</option></select>' +
      '<div class="toolbar-spacer"></div>' +
      '<a class="btn btn--primary" href="#/client/trade/reconciliation">去对账管理</a></div>' +
      '<div class="panel"><p class="panel__title">按区域激活（演示）</p>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>区域</th><th>规格</th><th>激活数</th><th>更新时间</th></tr></thead><tbody>' +
      reg +
      '</tbody></table></div></div>' +
      '<div class="panel"><p class="panel__title">用户活跃趋势（纯前端 Mock）</p>' +
      '<div class="bar-chart" id="dash-chart">' +
      bars +
      '</div></div>'
    );
  }

  function renderReconciliation(state) {
    state = state || {};
    var month = state.month || '2026-04';
    var fRegion = state.region || '';
    var fSpec = state.spec || '';
    var rows = getData()
      .reconciliation.filter(function (r) {
        return r.month === month && (!fRegion || r.region === fRegion) && (!fSpec || r.spec.indexOf(fSpec) >= 0);
      })
      .map(function (r) {
        return (
          '<tr><td>' +
          escapeHtml(r.month) +
          '</td><td>' +
          escapeHtml(r.region) +
          '</td><td>' +
          escapeHtml(r.spec) +
          '</td><td>' +
          r.active +
          '</td><td>' +
          escapeHtml(r.price) +
          '</td><td>' +
          escapeHtml(r.amount) +
          '</td></tr>'
        );
      })
      .join('');
    return (
      '<h1 class="page-title">对账管理</h1>' +
      '<div class="toolbar">' +
      '<label style="font-size:13px">对账月份</label>' +
      '<select id="rec-month" class="btn" style="padding:0.35rem 0.6rem">' +
      ['2026-04', '2026-03', '2026-02']
        .map(function (m) {
          return '<option value="' + m + '"' + (m === month ? ' selected' : '') + '>' + m + '</option>';
        })
        .join('') +
      '</select>' +
      '<input type="search" class="btn" style="width:140px;text-align:left" id="rec-region" placeholder="区域" value="' +
      escapeHtml(fRegion) +
      '" />' +
      '<input type="search" class="btn" style="width:180px;text-align:left" id="rec-spec" placeholder="规格" value="' +
      escapeHtml(fSpec) +
      '" />' +
      '<button type="button" class="btn btn--primary" id="rec-filter">应用筛选</button>' +
      '<div class="toolbar-spacer"></div>' +
      '<button type="button" class="btn btn--primary" id="rec-export">导出 Excel</button></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>月份</th><th>区域</th><th>规格</th><th>激活数</th><th>单价</th><th>金额</th></tr></thead><tbody>' +
      rows +
      '</tbody></table></div>'
    );
  }

  /** 字典管理 · 表格内「编辑」铅笔图标（与控制台 link-btn 搭配） */
  function dictEditIconSvg() {
    return (
      '<svg class="link-btn__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/>' +
      '<path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
      '</svg>'
    );
  }

  function findDictionaryById(id) {
    return (getData().dictionaries || []).find(function (d) {
      return d.id === id;
    });
  }

  function openDictionaryEditDrawer(rowId) {
    var d = findDictionaryById(rowId);
    if (!d) {
      toast('未找到该字典项', 'error');
      return;
    }
    var pkStr = d.pk !== undefined && d.pk !== null ? String(d.pk) : '';
    var sortStr = d.sort !== undefined && d.sort !== null ? String(d.sort) : '';
    openDrawer(
      '编辑字典项',
      '<div class="drawer-form-stack">' +
        '<div class="form-field"><label for="dict-e-etype"><span class="field-required-mark">*</span>枚举类型</label>' +
        '<input id="dict-e-etype" readonly required class="drawer-readonly-field" value="' +
        escapeHtml(d.enumType || '') +
        '" /></div>' +
        '<div class="form-field"><label for="dict-e-pk"><span class="field-required-mark">*</span>主键</label>' +
        '<input id="dict-e-pk" readonly required class="drawer-readonly-field" value="' +
        escapeHtml(pkStr) +
        '" /></div>' +
        '<div class="form-field"><label for="dict-e-val"><span class="field-required-mark">*</span>值</label>' +
        '<input id="dict-e-val" required value="' +
        escapeHtml(d.value || '') +
        '" /></div>' +
        '<div class="form-field"><label for="dict-e-sort"><span class="field-required-mark">*</span>排序</label>' +
        '<input id="dict-e-sort" type="number" required step="1" value="' +
        escapeHtml(sortStr) +
        '" /></div>' +
        '<div class="form-field"><label for="dict-e-desc">描述</label>' +
        '<textarea id="dict-e-desc" rows="3" placeholder="说明（可选）">' +
        escapeHtml(d.description || '') +
        '</textarea></div>' +
        '</div>',
      function (dr, close) {
        var val = dr.querySelector('#dict-e-val').value.trim();
        var sortRaw = dr.querySelector('#dict-e-sort').value.trim();
        var sortNum = parseInt(sortRaw, 10);
        if (!val) {
          toast('请填写「值」', 'error');
          return;
        }
        if (sortRaw === '' || isNaN(sortNum)) {
          toast('排序请填写有效整数', 'error');
          return;
        }
        saveDictionaryPatch(rowId, {
          value: val,
          sort: sortNum,
          description: dr.querySelector('#dict-e-desc').value.trim()
        });
        toast('已保存', 'success');
        close();
        render();
      },
      { primaryLabel: '保存' }
    );
  }

  /** 将「系统表单校验规则」Markdown 按二级标题拆成模块（用于侧栏导航与锚定） */
  function formRulesParseModules(markdown) {
    var lines = String(markdown || '')
      .replace(/\r\n/g, '\n')
      .split('\n');
    var modules = [];
    var cur = null;
    var i;
    for (i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (/^##\s+/.test(line)) {
        if (cur) modules.push(cur);
        cur = { title: line.replace(/^##\s+/, '').trim(), bodyLines: [] };
      } else if (cur) {
        cur.bodyLines.push(line);
      }
    }
    if (cur) modules.push(cur);
    return modules.map(function (m, idx) {
      var body = m.bodyLines.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');
      return { id: 'form-rules-mod-' + idx, title: m.title, body: body };
    });
  }

  /** 侧栏「原型说明」· 系统表单校验规则页（Markdown 正文） */
  var FORM_VALIDATION_RULES_MD = [
    '## 说明',
    '本文档归纳**控制台一期**各业务表单在原型与落地实现中的**校验边界**（必填、长度、数值范围、格式、互斥关系等）。若与冻结版 PRD 或接口契约冲突，以评审结论为准。',
    '- **前后端**：下列为**应对齐的默认边界**；服务端为最终权威，前端可做等价或略严提示。',
    '',
    '## 全局规则',
    '- **备注**：若表单提供备注字段，长度不得超过 **255** 个字符。',
    '',
    '## 资源中心',
    '### 实例',
    '- **实例名称**：必填；长度不得超过 **50** 个字符；同一**企业**下宜唯一。',
    '- **设备自动入库、激活方式**：须为允许枚举项。',
    '- **帐号前缀**：选填；若填写，须为 **4 位小写字母**。',
    '',
    '### 资源池',
    '- **下单 / 续费**：企业、实例、商品、规格必选，且须为**已存在**且当前账号有权操作的数据。',
    '- **数量**：必填；请输入 **[1, 100000]** 之间的整数。',
    '- **客户参考(SAP)**：必填；长度不得超过 **50** 个字符。',
    '',
    '### SDK 资源',
    '- **开通账号**：企业名称、商品与规格必选，须与当前企业和可售配置一致；数量边界同资源池下单。',
    '',
    '### CORS 账号',
    '- **开通账号**：企业名称、商品与规格必选，须与当前企业和可售配置一致；数量边界同资源池下单。',
    '',
    '## 交易中心',
    '### 订单列表',
    '- **订单列表 / 订单详情**：主路径以**只读**为主；筛选中若含日期、金额**区间**，须满足 **起 ≤ 止**。',
    '',
    '### 对账管理',
    '',
    '## 配置中心',
    '### 服务节点',
    '- **节点名称**：必填；长度不得超过 **50** 个字符。',
    '- **节点类型**：必填；下拉选项。',
    '- **业务编码**：必填；仅支持输入数字，长度不超过 **8** 位。',
    '- **服务地址**：必填；长度不得超过 **50** 个字符。',
    '',
    '### 服务套餐',
    '- **套餐名称**：必填；长度不得超过 **50** 个字符。',
    '- **服务节点、商品类型**：必填；下拉选择。',
    '- **端口**：必填；请输入 **1～65535** 之间的整数。',
    '- **源列表**：必填；长度不得超过 **50** 个字符。',
    '- **最大在线数**：必填；请输入 **[1, 100000]** 之间的整数。',
    '',
    '### 商品',
    '- **商品名称**：必填，长度不得超过 **50** 个字符。',
    '- **产品线**：必填；下拉选项；默认云芯产品线。',
    '- **服务配置**：必填；至少配置 **1** 套。',
    '',
    '### 商品规格',
    '- **规格名称**：必填，长度不得超过 **50** 个字符。',
    '- **规格编码**：建议 **2～64** 字，平台内唯一；字符集以 PRD 为准（常见：字母数字与连字符）。',
    '- **绑定关系**：商品—规格—套餐须避免重复绑定与非法组合（业务层校验）。',
    '',
    '## 系统管理',
    '### 企业用户',
    '- **企业名称**：必填，建议 **2～100** 字；平台内宜**唯一**（由后端保证）。',
    '- **企业联系人**：建议 **1～64** 字；可为空时须在 PRD 声明。',
    '- **手机 / 邮箱**：若填写须通过**格式校验**（手机可含国际区号；邮箱采用项目约定的 RFC5322 子集）。',
    '',
    '### 管理用户',
    '- **状态、角色**：必须来自字典或固定集合，禁止任意字符串写入。',
    '',
    '### 角色权限',
    '- **角色、权限标识**：必须来自字典或固定集合，禁止任意字符串写入。',
    '',
    '### 菜单管理',
    '- **菜单类型、权限标识**：必须来自字典或固定集合，禁止任意字符串写入。',
    '',
    '### 字典管理',
    '- **枚举类型**：必填，建议 `questionType` 风格 **1～64** 字（字母、数字、`.`、`_`）。',
    '- **主键**：须在**同一枚举类型**下唯一。',
    '- **字典值与排序**：值（展示文案）必填，建议 **1～200** 字；排序建议范围 **-999999～999999**（视存储类型调整）；描述建议 **≤ 500** 字。',
    '',
    '## 个人中心',
    '### 个人信息',
    '- **手机、邮箱**：若可编辑，须重复格式校验。',
    '',
    '### 修改密码',
    '- **当前密码、新密码、确认新密码**：新密码须满足复杂度与长度；**新密码** 与 **确认新密码** 必须一致；可选规则：新密码不可与当前密码相同。'
  ].join('\n');

  var FORM_RULES_SEARCH_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="11" cy="11" r="7"/>' +
    '<path d="m21 21-3.5-3.5"/>' +
    '</svg>';

  function renderFormValidationRulesDoc() {
    var mods = formRulesParseModules(FORM_VALIDATION_RULES_MD);
    var navItems = mods
      .map(function (m, mi) {
        return (
          '<button type="button" class="form-rules-nav__link"' +
          ' id="form-rules-nav-btn-' +
          mi +
          '" data-form-rules-anchor="' +
          escapeHtml(m.id) +
          '" data-filter-text="' +
          escapeHtml(m.title) +
          '">' +
          escapeHtml(m.title) +
          '</button>'
        );
      })
      .join('');
    var sections = mods
      .map(function (m) {
        return (
          '<section id="' +
          escapeHtml(m.id) +
          '" class="form-rules-section" tabindex="-1" aria-labelledby="' +
          escapeHtml(m.id) +
          '-title">' +
          '<h2 class="form-rules-section__title" id="' +
          escapeHtml(m.id) +
          '-title">' +
          escapeHtml(m.title) +
          '</h2>' +
          '<div class="form-rules-section__body markdown-body">' +
          renderSimpleMarkdown(m.body) +
          '</div></section>'
        );
      })
      .join('');
    return (
      '<div class="form-rules-page" id="form-rules-page">' +
      '<h1 class="page-title">系统表单校验规则</h1>' +
      '<div class="panel form-rules-toolbar">' +
      '<div class="form-rules-split">' +
      '<aside class="panel form-rules-aside" aria-label="模块导航">' +
      '<p class="form-rules-aside__title">模块</p>' +
      '<nav class="form-rules-nav" id="form-rules-nav-list">' +
      navItems +
      '</nav>' +
      '<p class="form-rules-nav-empty" id="form-rules-nav-empty" hidden>无匹配模块，请调整关键词。</p>' +
      '</aside>' +
      '<div class="panel form-rules-main markdown-doc-panel">' +
      '<div class="form-rules-scroll" id="form-rules-scroll-area">' +
      sections +
      '</div></div></div></div>'
    );
  }

  function mountFormRulesPageInteractions() {
    var page = document.getElementById('form-rules-page');
    if (!page || page.dataset.formRulesBound === '1') return;
    page.dataset.formRulesBound = '1';
    var search = document.getElementById('form-rules-module-search');
    var nav = document.getElementById('form-rules-nav-list');
    var emptyEl = document.getElementById('form-rules-nav-empty');
    var reduced = false;
    try {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (eR) {}

    function setActiveNav(id) {
      if (!nav) return;
      nav.querySelectorAll('.form-rules-nav__link').forEach(function (btn) {
        var match = btn.getAttribute('data-form-rules-anchor') === id;
        btn.classList.toggle('is-active', match);
        if (match) btn.setAttribute('aria-current', 'true');
        else btn.removeAttribute('aria-current');
      });
    }

    function scrollToModule(id) {
      var el = document.getElementById(id);
      if (!el) return;
      try {
        el.focus({ preventScroll: true });
      } catch (eF) {
        el.focus();
      }
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      setActiveNav(id);
    }

    if (nav) {
      nav.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-form-rules-anchor]');
        if (!btn) return;
        e.preventDefault();
        var id = btn.getAttribute('data-form-rules-anchor');
        if (id) scrollToModule(id);
      });
    }

    function applyModuleFilter() {
      if (!nav) return;
      var q = (search && search.value ? search.value : '').trim().toLowerCase();
      var links = nav.querySelectorAll('[data-form-rules-anchor]');
      var n = 0;
      links.forEach(function (btn) {
        var t = (btn.getAttribute('data-filter-text') || '').toLowerCase();
        var show = !q || t.indexOf(q) >= 0;
        btn.classList.toggle('is-hidden', !show);
        if (show) n++;
      });
      if (emptyEl) emptyEl.hidden = n > 0;
    }

    if (search) {
      search.addEventListener('input', applyModuleFilter);
      search.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var first = nav && nav.querySelector('.form-rules-nav__link:not(.is-hidden)');
        if (first) {
          var fid = first.getAttribute('data-form-rules-anchor');
          if (fid) scrollToModule(fid);
        }
      });
    }

    var sectionEls = page.querySelectorAll('.form-rules-section');
    applyModuleFilter();
    if (sectionEls.length) setActiveNav(sectionEls[0].id);
  }

  function renderDict() {
    var sorted = (getData().dictionaries || []).slice().sort(function (a, b) {
      var tc = String(a.enumType || '').localeCompare(String(b.enumType || ''), undefined, { sensitivity: 'base' });
      if (tc !== 0) return tc;
      var sa = Number(a.sort);
      var sb = Number(b.sort);
      if (!isNaN(sa) && !isNaN(sb) && sa !== sb) return sa - sb;
      var pa = Number(a.pk);
      var pb = Number(b.pk);
      if (!isNaN(pa) || !isNaN(pb)) {
        if (isNaN(pa)) return 1;
        if (isNaN(pb)) return -1;
        if (pa !== pb) return pa - pb;
      }
      return String(a.value || '').localeCompare(String(b.value || ''), undefined, { sensitivity: 'base' });
    });
    var rows = sorted
      .map(function (d) {
        var idEnc = encodeURIComponent(d.id || '');
        var pkDisp = d.pk !== undefined && d.pk !== null ? String(d.pk) : '—';
        var sortDisp = d.sort !== undefined && d.sort !== null ? String(d.sort) : '—';
        return (
          '<tr><td>' +
          escapeHtml(d.enumType || '—') +
          '</td><td class="table-num table-tabular">' +
          escapeHtml(pkDisp) +
          '</td><td>' +
          escapeHtml(d.value || '—') +
          '</td><td class="table-num table-tabular">' +
          escapeHtml(sortDisp) +
          '</td><td>' +
          escapeHtml(d.description || '—') +
          '</td><td class="cell-actions">' +
          '<button type="button" class="link-btn link-btn--with-icon" data-dict-edit="' +
          idEnc +
          '">' +
          dictEditIconSvg() +
          '<span>编辑</span></button>' +
          '</td></tr>'
        );
      })
      .join('');
    return (
      '<h1 class="page-title">字典管理</h1>' +
      '<div class="toolbar toolbar--end"><button type="button" class="btn btn--primary" id="btn-new-dict">新增</button></div>' +
      '<div class="table-wrap"><table class="data-table">' +
      '<thead><tr>' +
      '<th>枚举类型</th><th class="table-num">主键</th><th>值</th><th class="table-num">排序</th><th>描述</th><th class="cell-actions">操作</th>' +
      '</tr></thead><tbody>' +
      rows +
      '</tbody></table></div>'
    );
  }

  function tagForOrderStatus(status) {
    if (status === '已支付' || status === '已付款' || status === '已完成') return 'tag tag--ok';
    return 'tag';
  }

  /** 演示用资源 ID（随订单号与行序确定） */
  function pseudoOrderResourceId(orderNo, rowIdx) {
    var s = String(orderNo || 'ORD') + '#' + rowIdx;
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    var hex = (h >>> 0).toString(16);
    while (hex.length < 16) {
      h = Math.imul(h ^ rowIdx, 709607) >>> 0;
      hex += (h >>> 0).toString(16);
    }
    return hex.slice(0, 16);
  }

  /** 订单列表「资源」列：仅「详情」，点开查看资源明细（演示） */
  function orderObjectListCellHtml(o) {
    var no = o && o.no != null ? String(o.no).trim() : '';
    if (!no) return '—';
    return (
      '<button type="button" class="link-btn order-resource-detail-btn" data-order-resource-detail="' +
      escapeHtml(no) +
      '">详情</button>'
    );
  }

  /** 订单详情 · 商品与履约「资源」：按钮打开同一资源明细 */
  function orderObjectFulfillDdHtml(o) {
    var no = o && o.no != null ? String(o.no).trim() : '';
    if (!no) return escapeHtml('—');
    return (
      '<button type="button" class="link-btn order-resource-detail-btn" data-order-resource-detail="' +
      escapeHtml(no) +
      '">详情</button>'
    );
  }

  function openOrderResourceDetailDrawer(orderNo) {
    var orders = getData().orders || [];
    var o = orders.find(function (x) {
      return String(x.no) === String(orderNo);
    });
    if (!o) {
      toast('未找到该订单', 'error');
      return;
    }
    var q = parseInt(o.quantity, 10);
    var n = !isNaN(q) && q > 0 ? Math.min(q, 40) : 5;
    n = Math.max(1, n);
    var rows = [];
    var i;
    for (i = 1; i <= n; i++) {
      var rid = pseudoOrderResourceId(o.no, i);
      var acct = i % 5 === 0 ? 'ntrip_' + rid.slice(0, 10) : '';
      rows.push(
        '<tr><td class="table-num">' +
        i +
        '</td><td class="desc-list__mono">' +
        escapeHtml(rid) +
        '</td><td>' +
        (acct ? escapeHtml(acct) : '—') +
        '</td></tr>'
      );
    }
    var body =
      '<div class="drawer-form-stack">' +
      '<p class="drawer-field-hint order-resource-detail-lead">订单号 <span class="desc-list__mono">' +
      escapeHtml(o.no) +
      '</span> · 以下为演示资源明细</p>' +
      '<div class="table-wrap order-resource-detail-wrap">' +
      '<table class="data-table">' +
      '<thead><tr><th class="table-num">序号</th><th>资源</th><th>账号</th></tr></thead><tbody>' +
      rows.join('') +
      '</tbody></table></div>' +
      '<div class="table-pager order-resource-detail-pager">' +
      '<span class="table-pager__meta">共 ' +
      n +
      ' 条</span>' +
      '<div class="table-pager__controls">' +
      '<span>第 <strong>1</strong> 页</span>' +
      '<label class="table-pager__pagesize">每页 <select disabled aria-label="每页条数（演示）"><option>' +
      n +
      ' 条/页</option></select></label>' +
      '</div></div></div>';
    openDrawer('资源明细', body, null, { readonly: true });
  }

  function ensureOrderResourceDetailHandlers() {
    if (window.__orderResourceDetailBound) return;
    window.__orderResourceDetailBound = true;
    document.body.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-order-resource-detail]');
      if (!btn) return;
      var no = (btn.getAttribute('data-order-resource-detail') || '').trim();
      if (!no) return;
      e.preventDefault();
      openOrderResourceDetailDrawer(no);
    });
  }

  function orderSapDisplay(o) {
    if (o.sapRef == null || String(o.sapRef).trim() === '') return '—';
    return escapeHtml(String(o.sapRef).trim());
  }

  function orderDetailStatusDd(o) {
    return (
      '<span class="' +
      tagForOrderStatus(o.status) +
      '">' +
      escapeHtml(o.status || '—') +
      '</span>'
    );
  }

  /** 订单详情 · 单卡片内分区（与概要 panel 叠放；KV 仍用 entity-detail-kv） */
  function buildTradeOrderDetailSectionsHtml(o) {
    function dlRow(label, ddInnerHtml) {
      return (
        '<div class="entity-detail-kv__item"><dt>' +
        escapeHtml(label) +
        '</dt><dd>' +
        ddInnerHtml +
        '</dd></div>'
      );
    }
    function ddPlain(text) {
      return escapeHtml(text == null || text === '' ? '—' : String(text));
    }
    function ddMonoVal(text) {
      var t = text == null || String(text).trim() === '' ? '—' : String(text).trim();
      return '<span class="desc-list__mono">' + escapeHtml(t) + '</span>';
    }
    function ddSapInner() {
      if (o.sapRef == null || String(o.sapRef).trim() === '') return ddPlain('—');
      return ddMonoVal(o.sapRef);
    }
    /** 单卡片内的逻辑分组（非独立 panel） */
    function unifiedSectionHtml(title, innerDl, blockExtraClass) {
      var blk =
        'order-detail-unified-section' + (blockExtraClass ? ' ' + blockExtraClass : '');
      return (
        '<div class="' +
        blk +
        '">' +
        '<h4 class="order-detail-unified-section__title">' +
        escapeHtml(title) +
        '</h4>' +
        '<dl class="desc-list entity-detail-kv entity-detail-kv--order">' +
        innerDl +
        '</dl></div>'
      );
    }
    function ddAmount(val) {
      var t = val == null || val === '' ? '—' : String(val);
      return '<span class="order-detail-amount">' + escapeHtml(t) + '</span>';
    }
    var qtyStr =
      o.quantity != null && o.quantity !== '' ? String(o.quantity) : '—';
    var basicDl =
      dlRow('企业名称', ddPlain(o.customer)) + dlRow('订单状态', orderDetailStatusDd(o));
    var productDl =
      dlRow('商品', ddPlain(o.product)) +
      dlRow('商品规格', ddPlain(o.spec)) +
      dlRow('购买数量', ddPlain(qtyStr)) +
      dlRow('资源', orderObjectFulfillDdHtml(o)) +
      dlRow('客户参考(SAP)', ddSapInner());
    var paymentDl =
      dlRow('订单金额', ddAmount(o.amount)) +
      dlRow('支付时间', ddPlain(o.payAt)) +
      dlRow('支付流水号', ddMonoVal(o.paySerial));
    var auditDl =
      dlRow('创建人', ddPlain(o.creator)) +
      dlRow('创建时间', ddPlain(o.createdAt || o.payAt)) +
      dlRow('更新人', ddPlain(o.updatedBy)) +
      dlRow('更新时间', ddPlain(o.updatedAt)) +
      dlRow(
        '备注',
        ddPlain(o.remark != null ? o.remark : o.remarks)
      );
    return (
      '<div class="entity-detail-body entity-detail-body--order">' +
      '<section class="panel entity-detail-card entity-detail-card--order-unified" aria-label="订单明细">' +
      '<div class="panel__head-row entity-detail-card__head">' +
      '<h3 class="section-title-accent section-title-accent--order">订单明细</h3>' +
      '</div>' +
      '<div class="order-detail-unified">' +
      unifiedSectionHtml('基本信息', basicDl) +
      unifiedSectionHtml('商品与资源', productDl) +
      unifiedSectionHtml('支付信息', paymentDl, 'order-detail-unified-section--payment') +
      unifiedSectionHtml('记录与备注', auditDl) +
      '</div></section></div>'
    );
  }

  /** 订单概要卡片（与资源池信息同为 panel，无单独色带顶栏） */
  function buildTradeOrderSummaryPanelHtml(o, opts) {
    opts = opts || {};
    var leadTitle =
      o.title != null && String(o.title).trim() ? String(o.title).trim() : '订单详情';
    var pills = '';
    var prodMeta =
      o.product != null && String(o.product).trim() !== '' ? String(o.product).trim() : '';
    var amtMeta =
      o.amount != null && String(o.amount).trim() !== '' ? String(o.amount).trim() : '';
    if (prodMeta) {
      pills += '<span class="entity-detail-pill">' + escapeHtml(prodMeta) + '</span>';
    }
    if (amtMeta) {
      pills +=
        '<span class="entity-detail-pill entity-detail-pill--muted">' + escapeHtml(amtMeta) + '</span>';
    }
    var scopeHint =
      opts.scopeHint != null && String(opts.scopeHint).trim() !== ''
        ? String(opts.scopeHint).trim()
        : '仅展示订单信息（演示，不调用真实支付）。';
    return (
      '<div class="panel entity-detail-summary" role="region" aria-label="订单概要">' +
      '<div class="entity-detail-summary__top">' +
      '<div class="entity-detail-summary__main">' +
      '<p class="entity-detail-summary__eyebrow">订单详情</p>' +
      '<h1 class="page-title entity-detail-summary__title">' +
      escapeHtml(leadTitle) +
      '</h1>' +
      '<p class="page-sub entity-detail-summary__desc">' +
      escapeHtml(scopeHint) +
      '</p>' +
      '<p class="entity-detail-summary__kv">' +
      '<span class="entity-detail-summary__kv-label">订单号</span> ' +
      '<span class="desc-list__mono">' +
      escapeHtml(o.no || '—') +
      '</span></p>' +
      (pills ? '<div class="entity-detail-summary__meta">' + pills + '</div>' : '') +
      '</div>' +
      '<div class="entity-detail-summary__aside">' +
      '<div class="entity-detail-summary__status">' +
      orderDetailStatusDd(o) +
      '</div></div></div></div>'
    );
  }

  function renderAdminOrders() {
    var orders = getData().orders || [];
    var body = orders
      .map(function (o) {
        var statusHtml =
          '<span class="' +
          tagForOrderStatus(o.status) +
          '">' +
          escapeHtml(o.status || '—') +
          '</span>';
        return (
          '<tr>' +
          '<td>' +
          escapeHtml(o.customer || '—') +
          '</td><td>' +
          escapeHtml(o.no || '—') +
          '</td><td>' +
          escapeHtml(o.title || '—') +
          '</td><td>' +
          statusHtml +
          '</td><td>' +
          escapeHtml(o.product || '—') +
          '</td><td>' +
          escapeHtml(o.spec || '—') +
          '</td><td>' +
          (o.quantity != null && o.quantity !== '' ? escapeHtml(String(o.quantity)) : '—') +
          '</td><td>' +
          (o.amount != null && String(o.amount).trim() !== '' ? escapeHtml(String(o.amount).trim()) : '—') +
          '</td><td>' +
          orderObjectListCellHtml(o) +
          '</td><td>' +
          orderSapDisplay(o) +
          '</td><td>' +
          '<a href="#/admin/trade/detail?no=' +
          encodeURIComponent(o.no) +
          '">详情</a>' +
          '</td></tr>'
        );
      })
      .join('');
    return (
      '<h1 class="page-title">订单列表</h1>' +
      '<p class="page-sub">交易中心 · 线下履约与资源池发起订单的汇总视图。</p>' +
      '<div class="toolbar">' +
      '<span style="font-size:13px;color:var(--text-muted)">共 ' +
      orders.length +
      ' 笔</span><div class="toolbar-spacer"></div>' +
      '</div>' +
      '<div class="table-wrap table-wrap--orders"><table class="data-table data-table--orders">' +
      '<thead><tr><th>企业名称</th><th>订单号</th><th>标题</th><th>订单状态</th><th>商品</th><th>商品规格</th><th>购买数量</th><th>金额</th><th>资源</th><th>客户参考(SAP)</th><th class="cell-actions">操作</th></tr></thead><tbody>' +
      (body || '<tr><td colspan="11" class="table-empty">暂无订单</td></tr>') +
      '</tbody></table></div>'
    );
  }

  function renderAdminOrderDetail(query) {
    var no = (query && query.no) || '';
    var orders = getData().orders || [];
    var o = orders.find(function (x) {
      return x.no === no;
    });
    if (!no || !o) {
      return (
        '<div class="entity-detail-page">' +
        entityDetailBackToolbar('#/admin/trade/orders', '返回订单列表') +
        '<h1 class="page-title">订单详情</h1>' +
        '<p class="page-sub">请从<strong>订单列表</strong>选择一笔订单；或带上参数 <code>?no=订单号</code>。</p>' +
        '</div>'
      );
    }
    return (
      '<div class="entity-detail-page">' +
      entityDetailBackToolbar('#/admin/trade/orders', '返回订单列表') +
      '<nav class="breadcrumb entity-detail-page__crumb" aria-label="面包屑">' +
      '<a href="#/admin/trade/orders">订单列表</a> / ' +
      escapeHtml(o.no) +
      '</nav>' +
      buildTradeOrderSummaryPanelHtml(o, {
        scopeHint: '超管侧 · 仅展示订单信息（演示，不调用真实支付）。'
      }) +
      buildTradeOrderDetailSectionsHtml(o) +
      '</div>'
    );
  }

  function renderAdminUsers() {
    var rows = getData().adminUsers || [];
    var body = rows
      .map(function (u) {
        var uid = escapeHtml(u.id || u.email);
        return (
          '<tr><td>' +
          escapeHtml(u.name) +
          '</td><td><span class="tag' +
          (u.status === '正常' ? ' tag--ok' : ' tag--off') +
          '">' +
          escapeHtml(u.status) +
          '</span></td><td>' +
          escapeHtml(displayPhoneNoCountryCode(u.phone)) +
          '</td><td>' +
          escapeHtml(u.email) +
          '</td><td>' +
          escapeHtml(formatAssignedRoles(u.assignedRoles, u.role)) +
          '</td><td>' +
          escapeHtml(u.createdAt) +
          '</td><td>' +
          escapeHtml(u.remark || '') +
          '</td>' +
          '<td class="cell-actions">' +
          '<div class="row-action-links">' +
          '<button type="button" class="link-btn" data-adm-edit="' +
          uid +
          '">编辑</button>' +
          '<span class="row-action-sep" aria-hidden="true">|</span>' +
          '<button type="button" class="link-btn" data-adm-role="' +
          uid +
          '">角色配置</button>' +
          '<span class="row-action-sep" aria-hidden="true">|</span>' +
          '<details class="action-more">' +
          '<summary class="link-btn action-more__summary">更多</summary>' +
          '<div class="action-more__menu" role="menu">' +
          '<button type="button" class="action-more__item" role="menuitem" data-adm-enable="' +
          uid +
          '">启用</button>' +
          '<button type="button" class="action-more__item" role="menuitem" data-adm-disable="' +
          uid +
          '">禁用</button>' +
          '<button type="button" class="action-more__item" role="menuitem" data-adm-reset-pwd="' +
          uid +
          '">重置密码</button>' +
          '</div></details></div></td></tr>'
        );
      })
      .join('');
    return (
      '<h1 class="page-title">管理用户</h1>' +
      '<div class="toolbar">' +
      '<span style="font-size:13px;color:var(--text-muted)">共 ' +
      rows.length +
      ' 人</span>' +
      '<div class="toolbar-spacer"></div>' +
      '<button type="button" class="btn btn--primary" id="btn-new-admin">新增</button></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>姓名</th><th>状态</th><th>手机号</th><th>邮箱</th><th>用户角色</th><th>创建时间</th><th>备注</th><th class="cell-actions">操作</th></tr></thead><tbody>' +
      body +
      '</tbody></table></div>'
    );
  }

  function buildRoleMenuTreeEditableHtml() {
    return (
      '<ul class="menu-tree menu-tree--compact">' +
      (getData().menuTree || [])
        .map(function (m) {
          var ch = (m.children || [])
            .map(function (c) {
              return (
                '<li><label><input type="checkbox"' +
                (m.checked ? ' checked' : '') +
                ' /> ' +
                escapeHtml(c) +
                '</label></li>'
              );
            })
            .join('');
          return (
            '<li><label><input type="checkbox"' +
            (m.checked ? ' checked' : '') +
            ' /> <strong>' +
            escapeHtml(m.name) +
            '</strong></label><ul>' +
            ch +
            '</ul></li>'
          );
        })
        .join('') +
      '</ul>'
    );
  }

  function buildRoleDataMatrixHtml() {
    return (
      '<div class="drawer-form-stack">' +
      '<div class="form-field"><label for="role-data-scope">数据权限</label>' +
      '<select id="role-data-scope" class="drawer-select">' +
      '<option value="all" selected>全部</option>' +
      '<option value="enterprise">本企业</option>' +
      '<option value="self">仅本人</option>' +
      '</select></div>' +
      '</div>'
    );
  }

  function roleListSortCompare(a, b) {
    var oa = Number(a.sortOrder);
    var ob = Number(b.sortOrder);
    if (isNaN(oa)) oa = 999999;
    if (isNaN(ob)) ob = 999999;
    if (oa !== ob) return oa - ob;
    return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
  }

  function renderRoleManagement() {
    var all = getData().roles || [];
    var filtered = all.slice().sort(roleListSortCompare);
    var page = window.__rolePage || { num: 1, size: 20 };
    var total = filtered.length;
    var pages = Math.max(1, Math.ceil(total / page.size));
    if (page.num > pages) page.num = pages;
    var start = (page.num - 1) * page.size;
    var slice = filtered.slice(start, start + page.size);
    var roleRows = slice
      .map(function (r) {
        var c = encodeURIComponent(r.code);
        var remark =
          r.remark != null && String(r.remark).trim() !== ''
            ? escapeHtml(r.remark)
            : '<span class="table-muted">—</span>';
        var sortCell =
          r.sortOrder != null && String(r.sortOrder).trim() !== ''
            ? escapeHtml(String(r.sortOrder))
            : '<span class="table-muted">—</span>';
        return (
          '<tr><td>' +
          escapeHtml(r.name) +
          '</td><td>' +
          escapeHtml(r.code) +
          '</td><td class="table-num">' +
          sortCell +
          '</td><td class="role-remark-cell">' +
          remark +
          '</td><td>' +
          escapeHtml(r.createdAt) +
          '</td><td class="cell-actions"><div class="row-action-links">' +
          '<button type="button" class="link-btn" data-role-edit="' +
          c +
          '">编辑</button>' +
          '<span class="row-action-sep" aria-hidden="true">|</span>' +
          '<button type="button" class="link-btn" data-role-menu="' +
          c +
          '">菜单权限</button>' +
          '<span class="row-action-sep" aria-hidden="true">|</span>' +
          '<button type="button" class="link-btn" data-role-data="' +
          c +
          '">数据权限</button>' +
          '</div></td></tr>'
        );
      })
      .join('');
    var pagerPages = '';
    var p;
    for (p = 1; p <= pages; p++) {
      pagerPages +=
        '<button type="button" class="table-pager__page' +
        (p === page.num ? ' is-active' : '') +
        '" data-role-page="' +
        p +
        '">' +
        p +
        '</button>';
    }
    var sizeOpts = [10, 20, 50]
      .map(function (s) {
        return '<option value="' + s + '"' + (page.size === s ? ' selected' : '') + '>' + s + ' 条/页</option>';
      })
      .join('');
    return (
      '<div id="role-page-root">' +
      '<h1 class="page-title">角色权限</h1>' +
      '<div class="toolbar toolbar--end">' +
      '<button type="button" class="btn btn--primary" id="btn-role-new">新增</button></div>' +
      '<div class="table-wrap" id="role-table-wrap"><table class="data-table"><thead><tr><th>角色名称</th><th>角色标识</th><th class="table-num">显示顺序</th><th>备注</th><th>创建时间</th><th class="cell-actions">操作</th></tr></thead><tbody>' +
      (roleRows || '<tr><td colspan="6" class="table-empty">暂无数据</td></tr>') +
      '</tbody></table></div>' +
      '<div class="table-pager">' +
      '<span>共 ' +
      total +
      ' 条</span>' +
      '<div class="table-pager__controls">' +
      '<div class="table-pager__pages">' +
      pagerPages +
      '</div>' +
      '<label class="table-pager__pagesize">每页 <select id="rf-pagesize">' +
      sizeOpts +
      '</select></label>' +
      '</div></div></div>'
    );
  }

  function menuMgmtBuildParentMap(nodes, parentId, map) {
    (nodes || []).forEach(function (n) {
      map[n.id] = parentId;
      menuMgmtBuildParentMap(n.children || [], n.id, map);
    });
  }

  function menuMgmtFlatNodes(nodes, out) {
    (nodes || []).forEach(function (n) {
      out.push(n);
      menuMgmtFlatNodes(n.children || [], out);
    });
  }

  function menuMgmtNodeMatchesFilter(n, filter) {
    filter = filter || {};
    var name = (filter.name || '').trim();
    var status = (filter.status || '').trim();
    var nameOk = !name || String(n.name).indexOf(name) >= 0;
    var stOk = !status || n.status === status;
    return nameOk && stOk;
  }

  function menuMgmtVisibleIdSet(tree, filter) {
    filter = filter || {};
    var name = (filter.name || '').trim();
    var status = (filter.status || '').trim();
    if (!name && !status) return null;
    var parentMap = {};
    menuMgmtBuildParentMap(tree, null, parentMap);
    var flat = [];
    menuMgmtFlatNodes(tree, flat);
    var show = new Set();
    flat.forEach(function (n) {
      if (!menuMgmtNodeMatchesFilter(n, filter)) return;
      var id = n.id;
      while (id) {
        show.add(id);
        id = parentMap[id];
      }
    });
    return show;
  }

  function menuMgmtCollectParentIds(nodes, set) {
    (nodes || []).forEach(function (n) {
      if (n.children && n.children.length) {
        set.add(n.id);
        menuMgmtCollectParentIds(n.children, set);
      }
    });
  }

  function menuMgmtCollectVisibleRows(nodes, expanded, visibleIdsFilter, depth, rows) {
    (nodes || []).forEach(function (n) {
      if (visibleIdsFilter && !visibleIdsFilter.has(n.id)) return;
      var hasKids = !!(n.children && n.children.length);
      rows.push({ node: n, depth: depth, hasKids: hasKids });
      var isOpen = expanded[n.id] !== false;
      if (hasKids && isOpen)
        menuMgmtCollectVisibleRows(n.children, expanded, visibleIdsFilter, depth + 1, rows);
    });
  }

  function menuMgmtStatusTagCls(st) {
    if (st === '禁用') return 'tag tag--off';
    if (st === '启用') return 'tag tag--ok';
    return 'tag';
  }

  function menuMgmtDefaultShowDd(v) {
    if (v === true || v === '是') return '是';
    if (v === false || v === '否') return '否';
    return '—';
  }

  function menuMgmtToggleNameCell(n, expanded, hasKids) {
    var open = expanded[n.id] !== false;
    var btn;
    if (hasKids) {
      btn =
        '<button type="button" class="menu-mgmt-toggle" data-menu-toggle="' +
        encodeURIComponent(n.id) +
        '" aria-expanded="' +
        (open ? 'true' : 'false') +
        '" title="' +
        (open ? '收起' : '展开') +
        '">' +
        (open ? '−' : '+') +
        '</button>';
    } else {
      btn = '<span class="menu-mgmt-toggle menu-mgmt-toggle--leaf" aria-hidden="true"></span>';
    }
    return (
      '<div class="menu-mgmt-name-cell">' +
      btn +
      '<span class="menu-mgmt-name">' +
      escapeHtml(n.name) +
      '</span></div>'
    );
  }

  function renderMenuManagement() {
    var tree = buildMenuCatalogFromSuperAdminNav();
    window.__menuMgmtFilter = window.__menuMgmtFilter || { name: '', status: '' };
    window.__menuMgmtExpanded = window.__menuMgmtExpanded || {};
    var f = window.__menuMgmtFilter;
    var expanded = window.__menuMgmtExpanded;
    var visibleFilter = menuMgmtVisibleIdSet(tree, f);
    var rows = [];
    menuMgmtCollectVisibleRows(tree, expanded, visibleFilter, 0, rows);
    var body = rows
      .map(function (row) {
        var n = row.node;
        var hasKids = row.hasKids;
        var toggleCell =
          '<td class="menu-mgmt-tree-col" style="padding-left:' + (10 + row.depth * 14) + 'px">' +
          menuMgmtToggleNameCell(n, expanded, hasKids) +
          '</td>';
        return (
          '<tr data-menu-row="' +
          escapeHtml(n.id) +
          '">' +
          toggleCell +
          '<td>' +
          escapeHtml(n.menuType || '—') +
          '</td><td><span class="' +
          menuMgmtStatusTagCls(n.status) +
          '">' +
          escapeHtml(n.status || '—') +
          '</span></td><td class="table-num">' +
          (n.sortOrder != null ? escapeHtml(String(n.sortOrder)) : '—') +
          '</td><td class="menu-mgmt-mono">' +
          escapeHtml(n.route != null && n.route !== '' ? n.route : '—') +
          '</td><td class="menu-mgmt-mono">' +
          escapeHtml(n.requestPath || '—') +
          '</td><td>' +
          escapeHtml(n.permKey || '—') +
          '</td><td>' +
          escapeHtml(menuMgmtDefaultShowDd(n.defaultShow)) +
          '</td><td class="cell-actions">' +
          '<button type="button" class="link-btn" data-menu-edit="' +
          encodeURIComponent(n.id) +
          '">编辑</button></td></tr>'
        );
      })
      .join('');
    if (!body) {
      body = '<tr><td colspan="9" class="table-empty">暂无菜单数据或未匹配筛选条件</td></tr>';
    }
    return (
      '<div id="menu-mgmt-page-root">' +
      '<h1 class="page-title">菜单管理</h1>' +
      '<div class="toolbar menu-mgmt-toolbar">' +
      '<div class="menu-mgmt-toolbar__filters">' +
      '<label class="menu-mgmt-filter-label"><span class="menu-mgmt-filter-cap">菜单名称</span>' +
      '<input type="search" id="menu-mgmt-name" class="menu-mgmt-filter-input" placeholder="请输入"' +
      ' value="' +
      escapeHtml(f.name || '') +
      '" /></label>' +
      '<label class="menu-mgmt-filter-label"><span class="menu-mgmt-filter-cap">状态</span>' +
      '<select id="menu-mgmt-status" class="menu-mgmt-filter-select">' +
      '<option value=""' +
      (!(f.status || '') ? ' selected' : '') +
      '>全部</option>' +
      '<option value="启用"' +
      ((f.status || '') === '启用' ? ' selected' : '') +
      '>启用</option>' +
      '<option value="禁用"' +
      ((f.status || '') === '禁用' ? ' selected' : '') +
      '>禁用</option></select></label>' +
      '<button type="button" class="btn btn--primary" id="menu-mgmt-search">查询</button>' +
      '<button type="button" class="btn" id="menu-mgmt-reset">重置</button>' +
      '</div>' +
      '<div class="menu-mgmt-toolbar__actions">' +
      '<button type="button" class="btn btn--primary" id="btn-new-menu-root">新增</button>' +
      '<button type="button" class="btn" id="menu-mgmt-expand">展开</button>' +
      '<button type="button" class="btn" id="menu-mgmt-collapse">收起</button>' +
      '</div></div>' +
      '<div class="table-wrap"><table class="data-table menu-mgmt-table" id="menu-mgmt-table">' +
      '<thead><tr>' +
      '<th>菜单名称</th><th>菜单类型</th><th>状态</th><th class="table-num">显示顺序</th>' +
      '<th>路由地址</th><th>请求地址</th><th>权限 Key</th><th>默认显示</th><th class="cell-actions">操作</th>' +
      '</tr></thead><tbody id="menu-mgmt-tbody">' +
      body +
      '</tbody></table></div>' +
      '</div>'
    );
  }

  function renderClientOrders() {
    var company =
      (window.PROTOTYPE_DATA.users && window.PROTOTYPE_DATA.users.client && window.PROTOTYPE_DATA.users.client.company) || '';
    var orders = (getData().orders || []).filter(function (o) {
      return !company || o.customer === company;
    });
    var body = orders
      .map(function (o) {
        var statusHtml =
          '<span class="' +
          tagForOrderStatus(o.status) +
          '">' +
          escapeHtml(o.status || '—') +
          '</span>';
        return (
          '<tr><td>' +
          escapeHtml(o.no || '—') +
          '</td><td>' +
          escapeHtml(o.title || '—') +
          '</td><td>' +
          statusHtml +
          '</td><td>' +
          escapeHtml(o.product || '—') +
          '</td><td>' +
          escapeHtml(o.spec || '—') +
          '</td><td>' +
          (o.quantity != null && o.quantity !== '' ? escapeHtml(String(o.quantity)) : '—') +
          '</td><td>' +
          (o.amount != null && String(o.amount).trim() !== '' ? escapeHtml(String(o.amount).trim()) : '—') +
          '</td><td>' +
          orderObjectListCellHtml(o) +
          '</td><td>' +
          orderSapDisplay(o) +
          '</td><td>' +
          '<a href="#/client/trade/detail?no=' +
          encodeURIComponent(o.no) +
          '">详情</a>' +
          '</td></tr>'
        );
      })
      .join('');
    return (
      '<h1 class="page-title">订单列表</h1>' +
      '<p class="page-sub">交易中心 · 本企业订单汇总视图；列表不展示企业名称列，操作仅保留详情。当前企业：<strong>' +
      escapeHtml(company || '—') +
      '</strong></p>' +
      '<div class="toolbar">' +
      '<span style="font-size:13px;color:var(--text-muted)">共 ' +
      orders.length +
      ' 笔</span><div class="toolbar-spacer"></div>' +
      '</div>' +
      '<div class="table-wrap table-wrap--orders"><table class="data-table data-table--orders"><thead><tr><th>订单号</th><th>标题</th><th>订单状态</th><th>商品</th><th>商品规格</th><th>购买数量</th><th>金额</th><th>资源</th><th>客户参考(SAP)</th><th class="cell-actions">操作</th></tr></thead><tbody>' +
      (body || '<tr><td colspan="10" class="table-empty">暂无本企业订单</td></tr>') +
      '</tbody></table></div>'
    );
  }

  function renderClientOrderDetail(query) {
    var no = (query && query.no) || '';
    var company =
      (window.PROTOTYPE_DATA.users && window.PROTOTYPE_DATA.users.client && window.PROTOTYPE_DATA.users.client.company) || '';
    var orders = getData().orders || [];
    var o = orders.find(function (x) {
      return x.no === no && (!company || x.customer === company);
    });
    if (!no || !o) {
      return (
        '<div class="entity-detail-page">' +
        entityDetailBackToolbar('#/client/trade/orders', '返回订单列表') +
        '<h1 class="page-title">订单详情</h1>' +
        '<p class="page-sub">请从订单列表进入。</p>' +
        '</div>'
      );
    }
    return (
      '<div class="entity-detail-page">' +
      entityDetailBackToolbar('#/client/trade/orders', '返回订单列表') +
      '<nav class="breadcrumb entity-detail-page__crumb" aria-label="面包屑">' +
      '<a href="#/client/trade/orders">订单列表</a> / ' +
      escapeHtml(o.no) +
      '</nav>' +
      buildTradeOrderSummaryPanelHtml(o, {
        scopeHint: '大客户侧 · 仅展示本企业订单（演示，不调用真实支付）。'
      }) +
      buildTradeOrderDetailSectionsHtml(o) +
      '</div>'
    );
  }

  function getClientEnterpriseResourceRows() {
    var pack =
      (getData().clientEnterpriseResources || window.PROTOTYPE_DATA.clientEnterpriseResources || {});
    return pack.rows || [];
  }

  function formatClientResNum(v) {
    if (v == null || String(v).trim() === '') return '—';
    return escapeHtml(String(v));
  }

  function buildClientRegionResourceCardsHtml(rows) {
    return rows
      .map(function (r) {
        var cls = 'resource-region-card' + (r.isGlobal ? ' resource-region-card--global' : '');
        return (
          '<div class="' +
          cls +
          '">' +
          '<div class="resource-region-card__node">' +
          escapeHtml(r.serviceNode) +
          '</div>' +
          '<div class="resource-region-card__product">' +
          escapeHtml(r.product) +
          '</div>' +
          '<div class="resource-region-card__stats">' +
          '<div><div class="resource-region-card__stat-k">总数量</div><div>' +
          formatClientResNum(r.total) +
          '</div></div>' +
          '<div><div class="resource-region-card__stat-k">已使用</div><div class="resource-region-card__stat-v--used">' +
          formatClientResNum(r.used) +
          '</div></div>' +
          '<div><div class="resource-region-card__stat-k">未使用</div><div>' +
          formatClientResNum(r.unused) +
          '</div></div>' +
          '</div></div>'
        );
      })
      .join('');
  }

  /** 大客户 · 资源信息：资源池配置 + 按服务节点的资源卡片（非表格） */
  function renderClientResourceInfo() {
    var p = getData().clientCompanyProfile || window.PROTOTYPE_DATA.clientCompanyProfile;
    var rows = getClientEnterpriseResourceRows();
    var cards = buildClientRegionResourceCardsHtml(rows);
    var poolPanel = '';
    if (p) {
      poolPanel =
        '<div class="panel" id="client-pool-info-panel">' +
        '<div class="panel__head-row">' +
        '<h2 class="section-title-accent">资源池信息</h2>' +
        '<button type="button" class="btn btn--ghost btn--sm" id="btn-toggle-pool-info" aria-expanded="true">收起 ^</button>' +
        '</div>' +
        '<div class="pool-info-body" id="client-pool-info-body">' +
        '<dl class="desc-list">' +
        '<div><dt>企业名称</dt><dd>' +
        escapeHtml(p.companyName) +
        '</dd></div>' +
        '<div><dt>公司 ID</dt><dd>' +
        escapeHtml(p.companyId) +
        '</dd></div>' +
        '<div><dt>AK</dt><dd>' +
        escapeHtml(p.ak) +
        '</dd></div>' +
        '<div><dt>AS</dt><dd>' +
        escapeHtml(p.as) +
        '</dd></div>' +
        '<div><dt>SI</dt><dd>' +
        escapeHtml(p.si) +
        '</dd></div>' +
        '<div><dt>SIK</dt><dd>' +
        escapeHtml(p.sik) +
        '</dd></div>' +
        '<div><dt>入库方式</dt><dd>' +
        escapeHtml(p.entryMode) +
        '</dd></div>' +
        '<div><dt>激活方式</dt><dd>' +
        escapeHtml(p.activateMode) +
        '</dd></div>' +
        '<div><dt>计费方式</dt><dd>' +
        escapeHtml(p.billingMode) +
        '</dd></div>' +
        '<div><dt>对账方式</dt><dd>' +
        escapeHtml(p.reconcileMode) +
        '</dd></div>' +
        '</dl>' +
        '<p class="panel__hint" style="margin-top:0.75rem;margin-bottom:0">敏感字段在生产环境需脱敏展示与审计。</p>' +
        '</div></div>';
    }
    return (
      '<h1 class="page-title">资源信息</h1>' +
      '<p class="page-sub">企业资源池配置与各服务节点用量概览；节点明细请侧栏进入「SDK 资源」或「CORS 账号」。</p>' +
      poolPanel +
      '<div class="panel">' +
      '<div class="panel__head-row" style="margin-bottom:1rem">' +
      '<h2 class="section-title-accent">按节点 · 资源用量</h2>' +
      '<span class="toolbar" style="margin:0;gap:0.5rem">' +
      '<a class="btn btn--primary btn--sm" href="#/client/resource/sdk">SDK 资源</a>' +
      '<a class="btn btn--sm" href="#/client/resource/cors">CORS 账号</a>' +
      '</span>' +
      '</div>' +
      '<div class="resource-region-grid">' +
      (cards || '<p style="margin:0;color:var(--text-muted)">暂无节点演示数据。</p>') +
      '</div></div>'
    );
  }

  function profileReadonlyField(label, value) {
    return (
      '<div class="profile-field">' +
      '<span class="profile-field__label">' +
      escapeHtml(label) +
      '</span>' +
      '<input type="text" class="profile-field__input" value="' +
      escapeHtml(value) +
      '" readonly tabindex="-1" />' +
      '</div>'
    );
  }

  /** 顶部个人卡片：头像首字、姓名、角色、单位与联系方式 */
  function profileHeroHtml(u, opts) {
    opts = opts || {};
    var name = (u && u.name) || '—';
    var initial = name.length ? String(name).trim().charAt(0) : '?';
    var role = opts.roleLabel || (u && u.role) || '—';
    var org = (u && (u.company || u.organization)) || '';
    var region = (u && u.region) || '';
    var phone = displayPhoneNoCountryCode(u && u.phone);
    var email = (u && u.email) || '—';
    var chips =
      '<span class="profile-chip"><span class="profile-chip__k">手机</span>' +
      escapeHtml(phone) +
      '</span>' +
      '<span class="profile-chip"><span class="profile-chip__k">邮箱</span>' +
      escapeHtml(email) +
      '</span>';
    if (region && region !== '—') {
      chips +=
        '<span class="profile-chip"><span class="profile-chip__k">区域</span>' +
        escapeHtml(region) +
        '</span>';
    }
    return (
      '<div class="profile-hero">' +
      '<div class="profile-hero__avatar" aria-hidden="true">' +
      escapeHtml(initial) +
      '</div>' +
      '<div class="profile-hero__body">' +
      '<div class="profile-hero__title-row">' +
      '<h2 class="profile-hero__name">' +
      escapeHtml(name) +
      '</h2>' +
      '<span class="profile-hero__badge">' +
      escapeHtml(role) +
      '</span>' +
      '</div>' +
      (org
        ? '<p class="profile-hero__org">' + escapeHtml(org) + '</p>'
        : '') +
      '<div class="profile-hero__chips">' +
      chips +
      '</div></div></div>'
    );
  }

  function buildChangePasswordDrawerHtml() {
    return (
      '<div class="drawer-form-stack">' +
      '<p class="drawer-pwd-hint">支持手机号 / 邮箱验证码校验；以下为演示表单，保存后不改变实际登录口令。</p>' +
      '<div class="drawer-field-row">' +
      '<label class="drawer-field-label drawer-field-label--required" for="pwd-draw-old">当前密码</label>' +
      '<input id="pwd-draw-old" class="drawer-input" type="password" autocomplete="current-password" required /></div>' +
      '<div class="drawer-field-row">' +
      '<label class="drawer-field-label drawer-field-label--required" for="pwd-draw-new">新密码</label>' +
      '<input id="pwd-draw-new" class="drawer-input" type="password" autocomplete="new-password" required /></div>' +
      '<div class="drawer-field-row">' +
      '<label class="drawer-field-label drawer-field-label--required" for="pwd-draw-new2">确认新密码</label>' +
      '<input id="pwd-draw-new2" class="drawer-input" type="password" autocomplete="new-password" required /></div>' +
      '<div class="drawer-field-row">' +
      '<label class="drawer-field-label" for="pwd-draw-channel">验证方式</label>' +
      '<select id="pwd-draw-channel" class="drawer-select">' +
      '<option value="sms">手机号验证码</option>' +
      '<option value="email">邮箱验证码</option></select></div>' +
      '<div class="drawer-field-row">' +
      '<label class="drawer-field-label" for="pwd-draw-code">验证码</label>' +
      '<input id="pwd-draw-code" class="drawer-input" placeholder="演示任意填写" /></div>' +
      '</div>'
    );
  }

  function openChangePasswordDrawer() {
    openDrawer(
      '修改密码',
      buildChangePasswordDrawerHtml(),
      function (dr, close) {
        var oldP = dr.querySelector('#pwd-draw-old').value;
        var n1 = dr.querySelector('#pwd-draw-new').value;
        var n2 = dr.querySelector('#pwd-draw-new2').value;
        if (!oldP || !n1 || !n2) {
          toast('请填写完整密码信息', 'error');
          return;
        }
        if (n1 !== n2) {
          toast('两次输入的新密码不一致', 'error');
          return;
        }
        if (n1.length < 6) {
          toast('新密码至少 6 位（演示规则）', 'error');
          return;
        }
        toast('密码已更新（演示）', 'success');
        close();
      },
      { primaryLabel: '保存' }
    );
  }

  function renderClientProfile() {
    var u = (window.PROTOTYPE_DATA.users && window.PROTOTYPE_DATA.users.client) || {};
    var name = u.name || '—';
    var phone = displayPhoneNoCountryCode(u.phone);
    var email = u.email || '—';
    var idCard = u.idCardMasked || '—';
    var org = u.organization || u.company || '—';
    return (
      '<div class="profile-page">' +
      '<div class="profile-page__head">' +
      '<h1 class="page-title profile-page__title">个人中心</h1>' +
      '<p class="page-sub profile-page__sub">个人信息卡片与详细资料；修改密码在<strong>右侧抽屉</strong>中完成，与一期其它表单交互一致。</p>' +
      '</div>' +
      '<div class="profile-page__layout">' +
      '<div class="profile-page__aside">' +
      '<div class="profile-card profile-card--hero">' +
      profileHeroHtml(u, { roleLabel: u.role || '企业管理员' }) +
      '</div></div>' +
      '<div class="profile-page__main">' +
      '<div class="profile-card">' +
      '<div class="profile-card__section">' +
      '<h2 class="profile-card__heading">基本资料</h2>' +
      '<div class="profile-fields">' +
      profileReadonlyField('姓名', name) +
      profileReadonlyField('手机号', phone) +
      profileReadonlyField('邮箱', email) +
      '</div></div>' +
      '<div class="profile-card__section">' +
      '<h2 class="profile-card__heading">账户安全</h2>' +
      '<div class="profile-fields">' +
      '<div class="profile-field profile-field--pwd">' +
      '<span class="profile-field__label">登录密码</span>' +
      '<div class="profile-field__row">' +
      '<input type="text" class="profile-field__input" value="******" readonly tabindex="-1" aria-label="密码已隐藏" />' +
      '<button type="button" class="btn btn--primary" id="btn-profile-change-pwd">修改密码</button>' +
      '</div></div></div></div>' +
      '<div class="profile-card__section">' +
      '<h2 class="profile-card__heading">实名与单位</h2>' +
      '<div class="profile-fields">' +
      profileReadonlyField('身份证号', idCard) +
      profileReadonlyField('单位', org) +
      '</div></div>' +
      '<div class="profile-card__section profile-card__section--upload">' +
      '<h2 class="profile-card__heading">法人身份证</h2>' +
      '<p class="profile-upload__hint">示意图占位，正式环境支持上传身份证正反面。点击可模拟选择文件（无实际上传）。</p>' +
      '<div class="profile-id-grid">' +
      '<button type="button" class="profile-id-slot" id="profile-id-front" title="上传身份证正面">' +
      '<span class="profile-id-slot__icon" aria-hidden="true">🖼</span>' +
      '<span class="profile-id-slot__text">身份证正面</span></button>' +
      '<button type="button" class="profile-id-slot" id="profile-id-back" title="上传身份证反面">' +
      '<span class="profile-id-slot__icon" aria-hidden="true">🖼</span>' +
      '<span class="profile-id-slot__text">身份证反面</span></button>' +
      '</div></div></div></div></div></div>'
    );
  }

  function renderAdminProfile() {
    var u = (window.PROTOTYPE_DATA.users && window.PROTOTYPE_DATA.users.admin) || {};
    var name = u.name || '—';
    var phone = displayPhoneNoCountryCode(u.phone);
    var email = u.email || '—';
    var company = u.company || '—';
    var region = u.region || '—';
    return (
      '<div class="profile-page">' +
      '<div class="profile-page__head">' +
      '<h1 class="page-title profile-page__title">个人中心</h1>' +
      '<p class="page-sub profile-page__sub">平台运营账号信息；修改密码在<strong>右侧抽屉</strong>中完成。</p>' +
      '</div>' +
      '<div class="profile-page__layout">' +
      '<div class="profile-page__aside">' +
      '<div class="profile-card profile-card--hero">' +
      profileHeroHtml(u, { roleLabel: u.role || '超级管理员' }) +
      '</div></div>' +
      '<div class="profile-page__main">' +
      '<div class="profile-card">' +
      '<div class="profile-card__section">' +
      '<h2 class="profile-card__heading">基本资料</h2>' +
      '<div class="profile-fields">' +
      profileReadonlyField('姓名', name) +
      profileReadonlyField('手机号', phone) +
      profileReadonlyField('邮箱', email) +
      '</div></div>' +
      '<div class="profile-card__section">' +
      '<h2 class="profile-card__heading">组织与范围</h2>' +
      '<div class="profile-fields">' +
      profileReadonlyField('所属单位', company) +
      profileReadonlyField('数据范围', region) +
      '</div></div>' +
      '<div class="profile-card__section">' +
      '<h2 class="profile-card__heading">账户安全</h2>' +
      '<div class="profile-fields">' +
      '<div class="profile-field profile-field--pwd">' +
      '<span class="profile-field__label">登录密码</span>' +
      '<div class="profile-field__row">' +
      '<input type="text" class="profile-field__input" value="******" readonly tabindex="-1" aria-label="密码已隐藏" />' +
      '<button type="button" class="btn btn--primary" id="btn-profile-change-pwd">修改密码</button>' +
      '</div></div></div></div></div></div></div></div>'
    );
  }

  function routeMain(parsed, role) {
    var segs = parsed.segs;
    if (role === 'super_admin') {
      if (segs[0] === 'admin' && segs[1] === 'home') return renderAdminHome();
      if (segs[0] === 'admin' && segs[1] === 'enterprises' && !segs[2]) return renderEnterprises();
      if (segs[0] === 'admin' && segs[1] === 'enterprises' && segs[2])
        return renderEnterpriseDetail(decodeURIComponent(segs[2]));
      if (segs[0] === 'admin' && segs[1] === 'config' && segs[2] === 'nodes') return renderServiceNodes();
      if (segs[0] === 'admin' && segs[1] === 'config' && segs[2] === 'packages') return renderPackages();
      if (segs[0] === 'admin' && segs[1] === 'products') return renderProducts();
      if (segs[0] === 'admin' && segs[1] === 'specs') return renderSpecs();
      if (segs[0] === 'admin' && segs[1] === 'instances') {
        if (segs[2] === 'detail') {
          var qInstName = (parsed.query || {}).name || (parsed.query || {}).n || '';
          return renderInstanceDetailPage(qInstName);
        }
        return renderInstances();
      }
      if (segs[0] === 'admin' && segs[1] === 'pool') return renderPool();
      if (segs[0] === 'admin' && segs[1] === 'resources') {
        var adminResKind = segs[2];
        if (adminResKind !== 'sdk' && adminResKind !== 'cors') adminResKind = 'sdk';
        return renderResources(window.__resFilter || {}, false, adminResKind);
      }
      if (segs[0] === 'admin' && segs[1] === 'trade' && segs[2] === 'orders') return renderAdminOrders();
      if (segs[0] === 'admin' && segs[1] === 'trade' && segs[2] === 'detail')
        return renderAdminOrderDetail(parsed.query || {});
      if (segs[0] === 'admin' && segs[1] === 'system' && segs[2] === 'admins') return renderAdminUsers();
      if (segs[0] === 'admin' && segs[1] === 'system' && segs[2] === 'roles') return renderRoleManagement();
      if (segs[0] === 'admin' && segs[1] === 'system' && segs[2] === 'menus') return renderMenuManagement();
      if (segs[0] === 'admin' && segs[1] === 'data' && segs[2] === 'form-validation-rules')
        return renderFormValidationRulesDoc();
      if (segs[0] === 'admin' && segs[1] === 'system' && segs[2] === 'dict') return renderDict();
      if (segs[0] === 'admin' && segs[1] === 'profile' && !segs[2]) return renderAdminProfile();
      if (segs[0] === 'admin' && segs[1] === 'profile' && segs[2] === 'password') return renderAdminProfile();
      return renderAdminHome();
    }
    if (role === 'client_admin') {
      if (segs[0] === 'client' && segs[1] === 'dashboard') return renderDashboard();
      if (segs[0] === 'client' && segs[1] === 'trade' && segs[2] === 'orders') return renderClientOrders();
      if (segs[0] === 'client' && segs[1] === 'trade' && segs[2] === 'detail')
        return renderClientOrderDetail(parsed.query || {});
      if (segs[0] === 'client' && segs[1] === 'trade' && segs[2] === 'reconciliation')
        return renderReconciliation(window.__recFilter || {});
      if (segs[0] === 'client' && segs[1] === 'resource' && segs[2] === 'info') return renderClientResourceInfo();
      if (segs[0] === 'client' && segs[1] === 'resource' && (segs[2] === 'sdk' || segs[2] === 'cors')) {
        return renderResources(window.__clientResFilter || {}, true, segs[2]);
      }
      if (segs[0] === 'client' && segs[1] === 'resource' && (segs[2] === 'company' || segs[2] === 'regions'))
        return renderClientResourceInfo();
      if (segs[0] === 'client' && segs[1] === 'resource' && segs[2] === 'reconciliation')
        return renderReconciliation(window.__recFilter || {});
      if (segs[0] === 'client' && segs[1] === 'profile' && !segs[2]) return renderClientProfile();
      if (segs[0] === 'client' && segs[1] === 'profile' && segs[2] === 'password')
        return renderClientProfile();
      return renderDashboard();
    }
    return renderPlaceholder('未知页面', '');
  }

  function render() {
    var parsed = parseHash();
    var path = parsed.path;
    var sess = getSession();
    if (!sess || !sess.loggedIn) {
      if (path !== '/login') {
        navigate('/login');
        return;
      }
      document.getElementById('app').innerHTML = renderLogin();
      bindLogin();
      return;
    }
    var role = sess.demoRole || 'super_admin';
    if (role === 'super_admin' && path.indexOf('/client/') === 0) {
      navigate('/admin/home');
      return;
    }
    if (role === 'client_admin' && path.indexOf('/admin/') === 0) {
      navigate('/client/dashboard');
      return;
    }
    if (path === '/admin/resources') {
      navigate('/admin/resources/sdk');
      parsed = parseHash();
      path = parsed.path;
    }
    if (path === '/client/resource/list') {
      navigate('/client/resource/sdk');
      parsed = parseHash();
      path = parsed.path;
    }
    var main = routeMain(parsed, role);
    document.getElementById('app').innerHTML = renderShell(main, role, path);
    bindShell(path, role);
    bindPage(path, role, parsed);
  }

  function bindLogin() {
    var form = document.getElementById('form-login');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var role = fd.get('demoRole') || 'super_admin';
      if (!fd.get('account') || !fd.get('password')) {
        toast('请填写账号与密码', 'error');
        return;
      }
      setSession({ loggedIn: true, demoRole: role });
      toast('登录成功', 'success');
      navigate(role === 'super_admin' ? '/admin/home' : '/client/dashboard');
    });
  }

  function bindShell(path, role) {
    var dr = document.getElementById('demo-role');
    if (dr) {
      dr.addEventListener('change', function () {
        var s = getSession() || {};
        s.demoRole = dr.value;
        setSession(s);
        toast('已切换演示角色', 'success');
        navigate(dr.value === 'super_admin' ? '/admin/home' : '/client/dashboard');
      });
    }
    var lo = document.getElementById('btn-logout');
    if (lo) {
      lo.addEventListener('click', function () {
        clearSession();
        toast('已退出', 'success');
        navigate('/login');
      });
    }
    var cl = document.getElementById('btn-clear-overlay');
    if (cl) {
      cl.addEventListener('click', function () {
        confirmDialog('清除演示数据', '将删除 session 中的写入覆盖，恢复 mock 种子。是否继续？', function () {
          clearOverlay();
          toast('已恢复种子数据', 'success');
          render();
        });
      });
    }
    if (path === '/admin/data/form-validation-rules') {
      mountFormRulesPageInteractions();
    }
    var aside = document.getElementById('app-sidebar');
    if (aside) {
      aside.querySelectorAll('[data-sidebar-toggle]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (btn.disabled) return;
          var wrap = btn.closest('[data-nav-group]');
          if (!wrap) return;
          var key = wrap.getAttribute('data-nav-group');
          if (!key) return;
          window.__navOpenGroups = window.__navOpenGroups || {};
          var wasOpen = wrap.classList.contains('sidebar__group--open');
          window.__navOpenGroups[key] = !wasOpen;
          render();
        });
      });
      var pin = document.getElementById('btn-sidebar-collapse');
      if (pin) {
        pin.addEventListener('click', function () {
          aside.classList.toggle('sidebar--collapsed');
          try {
            sessionStorage.setItem(
              'prototype_sidebar_collapsed',
              aside.classList.contains('sidebar--collapsed') ? '1' : '0'
            );
          } catch (e) {}
        });
      }
    }
  }

  function openDrawer(title, bodyHtml, onSubmit, drawerOpts, onMount) {
    drawerOpts = drawerOpts || {};
    var readonly = !!drawerOpts.readonly;
    var primaryDanger = !!drawerOpts.primaryDanger;
    var primaryLabel =
      drawerOpts.primaryLabel !== undefined && drawerOpts.primaryLabel !== null ? String(drawerOpts.primaryLabel) : '保存';
    var backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop is-open';
    var drawerEl = document.createElement('div');
    drawerEl.className = 'drawer is-open' + (readonly ? ' drawer--readonly' : '');
    var footHtml = readonly
      ? '<div class="drawer__foot"><button type="button" class="btn-drawer-secondary" data-close>关闭</button></div>'
      : '<div class="drawer__foot">' +
        '<button type="button" class="btn-drawer-secondary" data-close>取消</button>' +
        '<button type="button" class="btn-drawer-primary' +
        (primaryDanger ? ' btn-drawer-primary--danger' : '') +
        '" data-save>' +
        escapeHtml(primaryLabel) +
        '</button>' +
        '</div>';
    drawerEl.innerHTML =
      '<div class="drawer__head"><span class="drawer__title">' +
      escapeHtml(title) +
      '</span><button type="button" class="drawer__close" data-close aria-label="关闭"><span aria-hidden="true">×</span></button></div>' +
      '<div class="drawer__body">' +
      bodyHtml +
      '</div>' +
      footHtml;
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
    function close() {
      backdrop.remove();
      drawerEl.remove();
    }
    drawerEl.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', close);
    });
    var saveBtn = drawerEl.querySelector('[data-save]');
    if (saveBtn && onSubmit) {
      saveBtn.addEventListener('click', function () {
        onSubmit(drawerEl, close);
      });
    }
    document.body.appendChild(backdrop);
    document.body.appendChild(drawerEl);
    if (typeof onMount === 'function') {
      try {
        onMount(drawerEl, close);
      } catch (e) {}
    }
  }

  function openInstanceCreateDrawer() {
    openDrawer(
      '新增实例',
      buildInstanceCreateFormHtml(),
      function (dr, close) {
      var name = dr.querySelector('#inst-f-name').value.trim();
      var customer = dr.querySelector('#inst-f-customer').value;
      if (!customer) {
        toast('请选择企业名称', 'error');
        return;
      }
      if (!name) {
        toast('请填写实例名称', 'error');
        return;
      }
      var deviceAutoStock = dr.querySelector('#inst-f-auto').value;
      var activateMode = dr.querySelector('#inst-f-act').value.trim();
      if (!activateMode) {
        toast('请选择激活方式', 'error');
        return;
      }
      var accountPrefix = dr.querySelector('#inst-f-prefix').value.trim();
      var tag = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 12) || 'INST';
      appendOverlay('instances', {
        name: name,
        company: customer,
        packageName: '',
        packageNames: [],
        owner: '卢楠楠',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        secretVisible: false,
        deviceAutoStock: deviceAutoStock,
        activateMode: activateMode,
        accountPrefix: accountPrefix,
        sik: 'SIK-' + tag + '-new7f3a92c1',
        sis: 'SIS-' + tag + '-newb9014e8a',
        appKey: 'AK' + tag + '01A2B3C4D5E6F708',
        appSecret: 'SK' + tag + '9f8e7d6c5b4a3928'
      });
      window.__instanceSetupGuide = { name: name };
      toast('实例已创建', 'success');
      close();
      render();
      },
      null,
      null
    );
  }

  function getCheckedSdkResKeysFromDom() {
    var out = [];
    document.querySelectorAll('.sdk-batch-row-cb:checked').forEach(function (cb) {
      if (cb.disabled) return;
      var k = (cb.getAttribute('data-sdk-res-key') || cb.value || '').trim();
      if (k) out.push(k);
    });
    return out;
  }

  function closeSdkBatchMenu() {
    var m = document.getElementById('sdk-batch-menu');
    var t = document.getElementById('btn-sdk-batch');
    if (m) m.hidden = true;
    if (t) t.setAttribute('aria-expanded', 'false');
  }

  function ensureSdkBatchMenuDismissBound() {
    if (window.__sdkBatchMenuDismissBound) return;
    window.__sdkBatchMenuDismissBound = true;
    document.body.addEventListener('click', function (e) {
      var menu = document.getElementById('sdk-batch-menu');
      var btn = document.getElementById('btn-sdk-batch');
      if (!menu || menu.hidden) return;
      if (btn && (e.target === btn || btn.contains(e.target))) return;
      if (menu.contains(e.target)) return;
      closeSdkBatchMenu();
    });
  }

  function runSdkBatchActivate() {
    var keys = getCheckedSdkResKeysFromDom();
    if (!keys.length) {
      toast('请先勾选需要激活的资源', 'warn');
      return;
    }
    var ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    var n = 0;
    var skip = 0;
    keys.forEach(function (k) {
      var row = findSdkResourceBySdkResKey(k);
      if (!row) return;
      if (String(row.activateStatus || '').trim() === '已激活') {
        skip++;
        return;
      }
      var nextReg = String(row.regCode || '').trim() || generateDemoSdkRegCode(row.instance + '_' + row.sn);
      saveSdkResourcePatch(k, {
        activateStatus: '已激活',
        activatedAt: ts,
        status: '服务中',
        regCode: nextReg
      });
      n++;
    });
    var msg = '已激活 ' + n + ' 条';
    if (skip) msg += '，跳过已激活 ' + skip + ' 条';
    toast(msg + '（演示）', n ? 'success' : 'warn');
    render();
  }

  function mountSdkBatchToolbarInteractions() {
    ensureSdkBatchMenuDismissBound();
    var toggle = document.getElementById('btn-sdk-batch');
    var menu = document.getElementById('sdk-batch-menu');
    var selAll = document.getElementById('sdk-batch-select-all');
    var itemAct = document.getElementById('sdk-batch-activate');
    if (!toggle || !menu) return;
    toggle.onclick = function (e) {
      e.stopPropagation();
      var willOpen = menu.hidden;
      menu.hidden = !willOpen;
      toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    };
    if (itemAct) {
      itemAct.onclick = function () {
        closeSdkBatchMenu();
        var codes = getCheckedSdkResKeysFromDom();
        if (!codes.length) {
          toast('请先勾选需要激活的资源', 'warn');
          return;
        }
        confirmDialog(
          '批量激活',
          '将对已勾选账号中「未激活」项执行激活；已是「已激活」的将跳过。是否继续？（演示）',
          function () {
            runSdkBatchActivate();
          },
          { okLabel: '确认激活' }
        );
      };
    }
    if (selAll) {
      selAll.onchange = function () {
        var on = selAll.checked;
        document.querySelectorAll('.sdk-batch-row-cb').forEach(function (cb) {
          if (!cb.disabled) cb.checked = on;
        });
      };
    }
  }

  function ensureSdkResourceHandlersBound() {
    if (window.__sdkResourceTableHandlersBound) return;
    window.__sdkResourceTableHandlersBound = true;
    document.body.addEventListener('click', function (e) {
      var detailBtn = e.target.closest('[data-sdk-detail]');
      if (detailBtn && !detailBtn.disabled && detailBtn.getAttribute('aria-disabled') !== 'true') {
        var rcd = (detailBtn.getAttribute('data-sdk-detail') || '').trim();
        if (rcd) openSdkResourceDetailDrawer(rcd);
        return;
      }
      var tsBtn = e.target.closest('[data-sdk-troubleshoot]');
      if (tsBtn && !tsBtn.disabled && tsBtn.getAttribute('aria-disabled') !== 'true') {
        toast('二期功能，暂未设计', 'warn');
        return;
      }
      var acBtn = e.target.closest('[data-sdk-activate]');
      if (!acBtn) return;
      if (acBtn.disabled || acBtn.getAttribute('aria-disabled') === 'true') return;
      var rca = acBtn.getAttribute('data-sdk-activate');
      if (!rca) return;
      var rowCur = findSdkResourceBySdkResKey(rca);
      if (!rowCur) {
        toast('未找到该 SDK 资源', 'error');
        return;
      }
      if (String(rowCur.activateStatus || '').trim() === '已激活') return;
      var nextReg =
        String(rowCur.regCode || '').trim() || generateDemoSdkRegCode(rowCur.instance + '_' + rowCur.sn);
      saveSdkResourcePatch(rca, {
        activateStatus: '已激活',
        activatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        status: '服务中',
        regCode: nextReg
      });
      toast('已激活（演示），已生成注册码', 'success');
      render();
    });
  }

  /** 「更多」下拉：viewport fixed 定位，避免菜单撑开表格行高（全局一次绑定） */
  function ensureActionMoreMenuFloatingBound() {
    if (window.__actionMoreMenuFloatingBound) return;
    window.__actionMoreMenuFloatingBound = true;
    document.addEventListener(
      'toggle',
      function (e) {
        var det = e.target;
        if (!det || !det.classList || !det.classList.contains('action-more')) return;
        var sum = det.querySelector('.action-more__summary');
        var menu = det.querySelector('.action-more__menu');
        if (!sum || !menu) return;
        if (!det.open) {
          menu.style.left = '';
          menu.style.top = '';
          menu.style.position = '';
          menu.style.zIndex = '';
          return;
        }
        requestAnimationFrame(function () {
          var r = sum.getBoundingClientRect();
          var w = menu.offsetWidth || 120;
          var left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
          menu.style.position = 'fixed';
          menu.style.left = left + 'px';
          menu.style.top = r.bottom + 6 + 'px';
          menu.style.zIndex = '100';
        });
      },
      true
    );
  }

  /** 「更多」下拉：点击页面空白处关闭（与浮动菜单重置一致；全局一次绑定） */
  function ensureActionMoreCloseOnOutsideClickBound() {
    if (window.__actionMoreOutsideCloseBound) return;
    window.__actionMoreOutsideCloseBound = true;
    function resetActionMoreMenu(det) {
      var menu = det && det.querySelector ? det.querySelector('.action-more__menu') : null;
      if (menu) {
        menu.style.left = '';
        menu.style.top = '';
        menu.style.position = '';
        menu.style.zIndex = '';
      }
    }
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('details.action-more')) return;
      document.querySelectorAll('details.action-more[open]').forEach(function (det) {
        det.open = false;
        resetActionMoreMenu(det);
      });
    });
  }

  function ensureCorsResourceHandlersBound() {
    if (window.__corsResourceHandlersBound) return;
    window.__corsResourceHandlersBound = true;
    document.body.addEventListener('click', function (e) {
      var edBtn = e.target.closest('[data-cors-edit]');
      if (edBtn && !edBtn.disabled && edBtn.getAttribute('aria-disabled') !== 'true') {
        var accEd = (edBtn.getAttribute('data-cors-edit') || '').trim();
        if (accEd) openCorsEditDrawer(accEd);
        return;
      }
      var detBtn = e.target.closest('[data-cors-detail]');
      if (detBtn && !detBtn.disabled && detBtn.getAttribute('aria-disabled') !== 'true') {
        var accDt = (detBtn.getAttribute('data-cors-detail') || '').trim();
        if (accDt) openCorsDetailDrawer(accDt);
        return;
      }
      var chPwdBtn = e.target.closest('[data-cors-change-pwd]');
      if (chPwdBtn && !chPwdBtn.disabled) {
        var accPwd = (chPwdBtn.getAttribute('data-cors-change-pwd') || '').trim();
        if (!accPwd) return;
        var detPwd = chPwdBtn.closest('details.action-more');
        if (detPwd) detPwd.open = false;
        confirmDialog(
          '修改密码',
          '将为账号「' + accPwd + '」修改登录密码（演示）。是否继续？',
          function () {
            toast('已发起修改密码（演示），新密码将由后端对接下发', 'success');
          },
          { okLabel: '确认' }
        );
        return;
      }
      var enableBtn = e.target.closest('[data-cors-enable]');
      if (enableBtn && !enableBtn.disabled) {
        var accEn = (enableBtn.getAttribute('data-cors-enable') || '').trim();
        if (!accEn) return;
        var rowEn = findCorsResourceByAccount(accEn);
        if (!rowEn) {
          toast('未找到该 CORS 账号', 'error');
          return;
        }
        var detEn = enableBtn.closest('details.action-more');
        if (detEn) detEn.open = false;
        if (corsAccountStatusNormalize(rowEn.status) === '启用') return;
        saveCorsResourcePatch(accEn, { status: '启用' });
        toast('已启用（演示）', 'success');
        render();
        return;
      }
      var disableBtn = e.target.closest('[data-cors-disable]');
      if (disableBtn && !disableBtn.disabled) {
        var accDis = (disableBtn.getAttribute('data-cors-disable') || '').trim();
        if (!accDis) return;
        var rowDis = findCorsResourceByAccount(accDis);
        if (!rowDis) {
          toast('未找到该 CORS 账号', 'error');
          return;
        }
        var detDis = disableBtn.closest('details.action-more');
        if (detDis) detDis.open = false;
        if (corsAccountStatusNormalize(rowDis.status) === '禁用') return;
        confirmDialog(
          '禁用账号',
          '确定禁用账号「' + accDis + '」？禁用后账号不可用（演示）。',
          function () {
            saveCorsResourcePatch(accDis, { status: '禁用' });
            toast('已禁用（演示）', 'success');
            render();
          },
          { okLabel: '确定禁用', okDanger: true }
        );
        return;
      }
    });
  }

  function bindPage(path, role, parsed) {
    ensureInstSecretToggleHandlers();
    ensureSdkRegCodeToggleHandlers();
    ensureInstSdkPkgMultiSelectHandlers();
    ensureOrderResourceDetailHandlers();
    ensureActionMoreMenuFloatingBound();
    ensureActionMoreCloseOnOutsideClickBound();
    var segs = parsed.segs || [];
    if (role === 'super_admin' && path.indexOf('/admin/instances') === 0) {
      var qInst = parsed.query || {};
      var focusPkgQuery = qInst.focus === 'package';
      if (path === '/admin/instances/detail') {
        var btnInstEditPg = document.getElementById('btn-inst-detail-edit');
        if (btnInstEditPg) {
          btnInstEditPg.addEventListener('click', function () {
            var nm = decodeURIComponent(btnInstEditPg.getAttribute('data-inst-name') || '');
            var rowPg = getData().instances.find(function (x) {
              return x.name === nm;
            });
            openInstanceEditDrawer(nm, { focusPackage: rowPg && !instanceHasPackage(rowPg) });
          });
        }
      } else {
        var wrap = document.getElementById('inst-list-wrap');
        if (wrap) {
          wrap.onclick = function (e) {
            var ed = e.target.closest('[data-inst-edit]');
            if (ed) {
              var enn = decodeURIComponent(ed.getAttribute('data-inst-edit'));
              var row0 = getData().instances.find(function (x) {
                return x.name === enn;
              });
              openInstanceEditDrawer(enn, { focusPackage: row0 && !instanceHasPackage(row0) });
              return;
            }
          };
        }
        var btnInst = document.getElementById('btn-new-instance');
        if (btnInst) {
          btnInst.onclick = function () {
            openInstanceCreateDrawer();
          };
        }
        var btnSetupGo = document.getElementById('btn-inst-setup-go');
        if (btnSetupGo) {
          btnSetupGo.addEventListener('click', function () {
            var g = window.__instanceSetupGuide;
            if (!g || !g.name) return;
            var nm = g.name;
            window.__instanceSetupGuide = null;
            render();
            setTimeout(function () {
              openInstanceEditDrawer(nm, { focusPackage: true });
            }, 0);
          });
        }
        var btnSetupDismiss = document.getElementById('btn-inst-setup-dismiss');
        if (btnSetupDismiss) {
          btnSetupDismiss.addEventListener('click', function () {
            window.__instanceSetupGuide = null;
            render();
          });
        }
      }
      if (
        segs[0] === 'admin' &&
        segs[1] === 'instances' &&
        path !== '/admin/instances/detail'
      ) {
        setTimeout(function () {
          if (segs[2] === 'new') openInstanceCreateDrawer();
          else if (segs.length >= 4 && segs[3] === 'edit')
            openInstanceEditDrawer(decodeURIComponent(segs[2]), { focusPackage: focusPkgQuery });
        }, 0);
      }
    }
    if (path.indexOf('/admin/enterprises') === 0 && path === '/admin/enterprises') {
      var btn = document.getElementById('btn-new-ent');
      if (btn) {
        btn.addEventListener('click', function () {
          openDrawer(
            '新增企业用户',
            '<div class="form-grid">' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>姓名</label><input id="de-contact" required /></div>' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>企业名称</label><input id="de-name" required /></div>' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>手机号</label><input id="de-phone" required /></div>' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>邮箱</label><input id="de-email" type="email" required /></div>' +
              '<div class="form-field"><label>所属行业</label>' +
              '<select id="de-industry" class="btn" style="width:100%;text-align:left;padding:0.45rem 0.6rem">' +
              '<option value="">请选择（可选）</option>' +
              '<option value="测绘地理信息">测绘地理信息</option>' +
              '<option value="智慧城市">智慧城市</option>' +
              '<option value="车联网">车联网</option>' +
              '<option value="农业物联网">农业物联网</option>' +
              '<option value="其他">其他</option>' +
              '</select></div>' +
              '<div class="form-field"><label>备注</label><input id="de-remark" /></div>' +
              '</div>',
            function (drawer, close) {
              var name = drawer.querySelector('#de-name').value.trim();
              if (!name) {
                toast('请填写企业名称', 'error');
                return;
              }
              var emailRaw = drawer.querySelector('#de-email').value.trim();
              var local = emailRaw.split('@')[0] || '';
              var accountGuess =
                local.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32) ||
                'ent_' + String(Date.now()).slice(-10);
              var indEl = drawer.querySelector('#de-industry');
              appendOverlay('enterprises', {
                id: 'ENT-' + Date.now(),
                contact: drawer.querySelector('#de-contact').value.trim(),
                name: name,
                status: '正常',
                phone: drawer.querySelector('#de-phone').value.trim(),
                email: emailRaw,
                registeredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                account: accountGuess,
                industry: (indEl && indEl.value && indEl.value.trim()) || '',
                remark: drawer.querySelector('#de-remark').value.trim(),
                licenses: true,
                assignedRoles: ['企业管理员']
              });
              toast('企业已创建（演示写入）', 'success');
              close();
              render();
            }
          );
        });
      }
      function entRowById(id) {
        return getData().enterprises.find(function (x) {
          return x.id === id;
        });
      }

      function closeEntMoreMenu(btn) {
        var det = btn && btn.closest('details.action-more');
        if (det) det.open = false;
      }

      document.querySelectorAll('[data-ent-edit]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-ent-edit');
          var row = entRowById(id);
          if (!row) return;
          openDrawer(
            '编辑企业客户',
            '<div class="form-grid">' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>姓名</label><input id="ee-contact" value="' +
              escapeHtml(row.contact) +
              '" required /></div>' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>企业名称</label><input id="ee-name" value="' +
              escapeHtml(row.name) +
              '" required /></div>' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>手机号</label><input id="ee-phone" value="' +
              escapeHtml(row.phone) +
              '" required /></div>' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>邮箱</label><input id="ee-email" type="email" value="' +
              escapeHtml(row.email) +
              '" required /></div>' +
              '<div class="form-field"><label>所属行业</label>' +
              '<select id="ee-industry" class="btn" style="width:100%;text-align:left;padding:0.45rem 0.6rem">' +
              '<option value="">请选择（可选）</option>' +
              '<option value="测绘地理信息"' +
              (row.industry === '测绘地理信息' ? ' selected' : '') +
              '>测绘地理信息</option>' +
              '<option value="智慧城市"' +
              (row.industry === '智慧城市' ? ' selected' : '') +
              '>智慧城市</option>' +
              '<option value="车联网"' +
              (row.industry === '车联网' ? ' selected' : '') +
              '>车联网</option>' +
              '<option value="农业物联网"' +
              (row.industry === '农业物联网' ? ' selected' : '') +
              '>农业物联网</option>' +
              '<option value="其他"' +
              (row.industry === '其他' ? ' selected' : '') +
              '>其他</option>' +
              '</select></div>' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>主账号</label><input id="ee-account" value="' +
              escapeHtml(row.account) +
              '" required /></div>' +
              '<div class="form-field"><label>备注</label><input id="ee-remark" value="' +
              escapeHtml(row.remark || '') +
              '" /></div>' +
              '</div><p style="font-size:12px;color:#64748b">证照等字段原型省略；演示保存不写入种子数据。</p>',
            function (drawer, close) {
              if (!drawer.querySelector('#ee-name').value.trim()) {
                toast('请填写企业名称', 'error');
                return;
              }
              toast('已保存（演示）', 'success');
              close();
            }
          );
        });
      });

      document.querySelectorAll('[data-ent-role]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-ent-role');
          openEnterpriseRoleConfigDrawer(id);
        });
      });

      document.querySelectorAll('[data-ent-enable]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-ent-enable');
          var row = entRowById(id);
          closeEntMoreMenu(b);
          confirmDialog(
            '启用',
            '确认启用企业「' + (row ? row.name : id) + '」？（仅演示）',
            function () {
              toast('已启用（演示）', 'success');
            }
          );
        });
      });

      document.querySelectorAll('[data-ent-disable]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-ent-disable');
          var row = entRowById(id);
          closeEntMoreMenu(b);
          confirmDialog(
            '禁用',
            '确认禁用企业「' + (row ? row.name : id) + '」？（仅演示）',
            function () {
              toast('已禁用（演示）', 'success');
            }
          );
        });
      });

      document.querySelectorAll('[data-ent-reset-pwd]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-ent-reset-pwd');
          var row = entRowById(id);
          closeEntMoreMenu(b);
          confirmDialog(
            '重置密码',
            '重置企业「' + (row ? row.name : id) + '」主账号「' + (row ? row.account : '') + '」的登录密码？（仅演示）',
            function () {
              toast('重置密码通知已发送（演示）', 'success');
            }
          );
        });
      });
    }
    if (path.match(/^\/admin\/enterprises\/[^/]+$/)) {
      var tabs = document.getElementById('ent-tabs');
      if (tabs) {
        tabs.querySelectorAll('button').forEach(function (bt) {
          bt.addEventListener('click', function () {
            tabs.querySelectorAll('button').forEach(function (x) {
              x.classList.remove('is-active');
            });
            bt.classList.add('is-active');
            var t = bt.getAttribute('data-tab');
            ['base', 'res', 'acct'].forEach(function (k) {
              var el = document.getElementById('tab-' + k);
              if (el) el.hidden = k !== t;
            });
          });
        });
      }
    }
    if (path === '/admin/config/nodes') {
      document.getElementById('btn-new-node') &&
        document.getElementById('btn-new-node').addEventListener('click', function () {
          openDrawer(
            '新增',
            '<div class="drawer-form-stack">' +
              '<div class="form-field">' +
              '<label for="node-name"><span class="field-required-mark">*</span>节点名称</label>' +
              '<input id="node-name" required placeholder="" />' +
              '</div>' +
              '<div class="form-field">' +
              '<label for="node-type"><span class="field-required-mark">*</span>节点类型</label>' +
              '<select id="node-type" required>' +
              '<option value="">请选择</option>' +
              SERVICE_NODE_TYPE_OPTIONS.map(function (t) {
                return '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>';
              }).join('') +
              '</select>' +
              '</div>' +
              '<div class="form-field">' +
              '<label for="node-code"><span class="field-required-mark">*</span>业务编号</label>' +
              '<input id="node-code" required placeholder="" />' +
              '</div>' +
              '<div class="form-field">' +
              '<label for="node-endpoint"><span class="field-required-mark">*</span>服务地址</label>' +
              '<input id="node-endpoint" type="text" required placeholder="" />' +
              '</div>' +
              '<div class="form-field">' +
              '<label for="node-remark">备注</label>' +
              '<textarea id="node-remark" rows="4" placeholder=""></textarea>' +
              '</div>' +
              '</div>',
            function (dr, close) {
              var nm = dr.querySelector('#node-name').value.trim();
              var ty = dr.querySelector('#node-type').value;
              var code = dr.querySelector('#node-code').value.trim();
              var ep = dr.querySelector('#node-endpoint').value.trim();
              if (!nm || !ty || !code || !ep) {
                toast('请填写必填项（节点名称、节点类型、业务编号、服务地址）', 'error');
                return;
              }
              var ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
              appendOverlay('serviceNodes', {
                name: nm,
                type: ty,
                code: code,
                endpoint: ep,
                remark: dr.querySelector('#node-remark').value.trim(),
                referenced: false,
                createdBy: 'SuperAdmin',
                createdAt: ts,
                updatedBy: 'SuperAdmin',
                updatedAt: ts
              });
              toast('已添加节点', 'success');
              close();
              render();
            },
            { primaryLabel: '确定' }
          );
          setTimeout(function () {
            var dr = document.querySelector('.drawer');
            if (!dr) return;
            var typeSel = dr.querySelector('#node-type');
            var nameInput = dr.querySelector('#node-name');
            if (!typeSel || !nameInput) return;
            typeSel.addEventListener('change', function () {
              if (!nameInput.value.trim()) nameInput.value = typeSel.value;
            });
          }, 0);
        });
      var mainRegion = document.querySelector('.main');
      if (mainRegion) {
        mainRegion.addEventListener('click', function (e) {
          var det = e.target.closest('[data-node-detail]');
          if (det) {
            openServiceNodeDetailDrawer(decodeURIComponent(det.getAttribute('data-node-detail')));
            return;
          }
          var ed = e.target.closest('[data-node-edit]');
          if (ed) {
            openServiceNodeEditDrawer(decodeURIComponent(ed.getAttribute('data-node-edit')));
            return;
          }
          var del = e.target.closest('[data-node-delete]');
          if (del) {
            var code = decodeURIComponent(del.getAttribute('data-node-delete'));
            var row = findServiceNodeByCode(code);
            if (!row) {
              toast('未找到该节点', 'error');
              return;
            }
            openServiceNodeDeleteConfirmDrawers(code, row.name, !!row.referenced);
          }
        });
      }
    }
    if (path === '/admin/config/packages') {
      var nodes = getData().serviceNodes;
      var opts = nodes.map(function (n) {
        return '<option>' + escapeHtml(n.name) + '</option>';
      }).join('');
      document.getElementById('btn-new-pkg') &&
        document.getElementById('btn-new-pkg').addEventListener('click', function () {
          openDrawer(
            '新增服务套餐',
            '<div class="drawer-form-stack drawer-form-stack--node-edit">' +
              '<div class="drawer-form-section">' +
              '<p class="drawer-form-section__title">基础信息</p>' +
              '<div class="form-field"><label for="pn"><span class="field-required-mark">*</span>套餐名称</label><input id="pn" required placeholder="套餐名称" /></div>' +
              '<div class="form-field"><label for="pnode"><span class="field-required-mark">*</span>服务节点</label><select id="pnode" required>' +
              opts +
              '</select></div>' +
              '<div class="form-field"><label for="pspec"><span class="field-required-mark">*</span>商品类型</label><select id="pspec" required>' +
              '<option value="SDK" selected>SDK</option>' +
              '<option value="CORS账号">CORS账号</option>' +
              '<option value="一键固定">一键固定</option>' +
              '</select></div>' +
              '</div>' +
              '<div class="drawer-form-section">' +
              '<p class="drawer-form-section__title">基础套餐</p>' +
              '<div class="form-field">' +
              '<label for="pport"><span class="field-required-mark">*</span>端口</label>' +
              '<select id="pport" class="pkg-base-port-select" aria-describedby="pkg-port-hint" required></select>' +
              '<p class="drawer-field-hint" id="pkg-port-hint">选择服务节点后，从下拉中选择一项基础套餐（端口预设）；选定后下方坐标系、挂载点、TLS 与压缩<strong>自动带出并置灰不可编辑</strong>。</p>' +
              '<p class="drawer-form-section__status" id="pkg-port-status" aria-live="polite"></p>' +
              '<p id="pkg-port-live" class="visually-hidden" aria-live="polite"></p>' +
              '</div>' +
              '<div id="pkg-derived-fields" class="pkg-derived-fields pkg-derived-fields--locked">' +
              '<div class="form-field"><label for="pcoord"><span class="field-required-mark">*</span>坐标系</label><input id="pcoord" placeholder="—" autocomplete="off" readonly required /></div>' +
              '<div class="form-field"><label for="pmount"><span class="field-required-mark">*</span>可用挂载点</label><input id="pmount" placeholder="—" autocomplete="off" readonly required /></div>' +
              '<div class="form-field"><label for="ptsl"><span class="field-required-mark">*</span>是否启用tsl</label><select id="ptsl" required>' +
              '<option value="否" selected>否</option><option value="是">是</option></select></div>' +
              '<div class="form-field"><label for="pcompress"><span class="field-required-mark">*</span>是否启用压缩</label><select id="pcompress" required>' +
              '<option value="否" selected>否</option><option value="是">是</option></select></div>' +
              '<p class="drawer-field-hint pkg-derived-fields__foot-hint">以上四项由所选基础套餐带出，仅供确认。</p>' +
              '</div>' +
              '</div>' +
              '<div class="drawer-form-section">' +
              '<p class="drawer-form-section__title">业务参数</p>' +
              '<div class="form-field"><label for="psources"><span class="field-required-mark">*</span>源列表</label>' +
              '<input id="psources" type="text" placeholder="按实际接入源填写，如 NTRIP:host:port" autocomplete="off" required /></div>' +
              '<div class="form-field"><label for="pmax"><span class="field-required-mark">*</span>最大在线数</label><input id="pmax" type="number" min="1" max="100000" step="1" placeholder="请输入[1,100000]之间的整数" required /></div>' +
              '<p class="drawer-field-hint" style="margin:-0.65rem 0 0">填写须为 1–100000 的整数。</p>' +
              '</div>' +
              '<div class="form-field"><label for="premark">备注</label>' +
              '<textarea id="premark" rows="3" placeholder="对内备注（可选）"></textarea></div>' +
              '</div>',
            function (dr, close) {
              var nm = dr.querySelector('#pn').value.trim();
              var nd = dr.querySelector('#pnode').value;
              if (!nm || !nd) {
                toast('请填写套餐名称并选择服务节点', 'error');
                return;
              }
              var presetIdxStr = dr.querySelector('#pport').value.trim();
              var presetsForSave = getData().packagePortPresets || [];
              var chosenPreset =
                presetIdxStr === '' ? null : presetsForSave[parseInt(presetIdxStr, 10)];
              if (
                !chosenPreset ||
                isNaN(parseInt(presetIdxStr, 10)) ||
                chosenPreset.node !== nd
              ) {
                toast('请选择节点下的基础套餐（端口预设）', 'error');
                return;
              }
              var maxParsed = parseOptionalMaxOnlineInput(dr.querySelector('#pmax').value);
              if (!maxParsed.ok) {
                toast('请输入[1,100000]之间的整数', 'error');
                return;
              }
              var maxOnline = maxParsed.value;
              var ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
              appendOverlay('packages', {
                name: nm,
                node: nd,
                spec: (dr.querySelector('#pspec') && dr.querySelector('#pspec').value) || 'SDK',
                port: String(chosenPreset.port != null ? chosenPreset.port : '').trim(),
                coord: dr.querySelector('#pcoord').value.trim() || '—',
                mount: dr.querySelector('#pmount').value.trim() || '—',
                sources: dr.querySelector('#psources').value.trim() || '',
                maxOnline: maxOnline,
                tslEnabled: dr.querySelector('#ptsl').value === '是',
                compressEnabled: dr.querySelector('#pcompress').value === '是',
                status: '启用',
                remark: (dr.querySelector('#premark') && dr.querySelector('#premark').value.trim()) || '',
                updatedBy: 'SuperAdmin',
                updatedAt: ts
              });
              toast('已添加套餐', 'success');
              close();
              render();
            },
            null,
            function (dr) {
              wireNewPackageDrawerPortPresets(dr);
            }
          );
        });
      var pkgMain = document.querySelector('.main');
      if (pkgMain) {
        pkgMain.addEventListener('click', function (e) {
          var det = e.target.closest('[data-pkg-detail]');
          if (det) {
            openPackageDetailDrawer(decodeURIComponent(det.getAttribute('data-pkg-detail')));
            return;
          }
          var ed = e.target.closest('[data-pkg-edit]');
          if (ed) {
            openPackageEditDrawer(decodeURIComponent(ed.getAttribute('data-pkg-edit')));
          }
        });
      }
    }
    if (path === '/admin/products') {
      document.getElementById('btn-new-product') &&
        document.getElementById('btn-new-product').addEventListener('click', function () {
          openDrawer(
            '新增商品',
            '<div class="drawer-form-stack">' +
              '<div class="form-field"><label for="prod-name"><span class="field-required-mark">*</span>商品名称</label><input id="prod-name" required placeholder="请输入商品名称" /></div>' +
              '<div class="form-field"><label for="prod-pl"><span class="field-required-mark">*</span>产品线</label><select id="prod-pl" required>' +
              '<option value="">请选择</option>' +
              '<option value="云芯产品线">云芯产品线</option>' +
              '<option value="星基产品线">星基产品线</option>' +
              '<option value="账号与接入">账号与接入</option>' +
              '</select></div>' +
              '<div class="product-service-config">' +
              '<div class="product-service-config__head">' +
              '<p class="product-service-config__title">服务配置</p>' +
              '<button type="button" class="link-btn product-service-config__add" id="prod-svc-add">添加</button>' +
              '</div>' +
              '<div class="drawer-callout drawer-callout--warn product-service-config__tip" role="note">' +
              '<svg class="product-service-config__tip-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 8v5M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
              '<p class="drawer-callout__text">提示：配置时不能添加相同服务节点</p>' +
              '</div>' +
              '<div id="prod-svc-rows" class="product-service-config__rows"></div>' +
              '</div>' +
              buildProductImageUploadFieldHtml('prod') +
              '<div class="form-field"><label for="prod-region">国家/地区</label><input id="prod-region" placeholder="如：全球 / 中国大陆" /></div>' +
              '<div class="form-field"><label for="prod-price"><span class="field-required-mark">*</span>价格</label><input id="prod-price" required placeholder="如：¥9,999 或面议" /></div>' +
              '<div class="form-field"><label for="prod-billing">计费方式</label><select id="prod-billing">' +
              '<option value="连续计费" selected>连续计费</option>' +
              '</select></div>' +
              '<div class="form-field"><label for="prod-sum">商品摘要</label><input id="prod-sum" placeholder="一行摘要，用于列表或卡片副标题" /></div>' +
              '<div class="form-field"><label for="prod-desc">商品描述</label><textarea id="prod-desc" rows="4" placeholder="详细介绍"></textarea></div>' +
              '<div class="form-field"><label for="prod-remark">备注</label><input id="prod-remark" placeholder="内部备注" /></div>' +
              '</div>',
            function (dr, close) {
              var nm = dr.querySelector('#prod-name').value.trim();
              if (!nm) {
                toast('请填写商品名称', 'error');
                return;
              }
              var plVal = dr.querySelector('#prod-pl').value.trim();
              if (!plVal) {
                toast('请选择产品线', 'error');
                return;
              }
              var collected = collectProductServiceRowsFromDrawer(dr, '#prod-svc-rows');
              if (!collected.ok) {
                toast(collected.message, 'error');
                return;
              }
              var serviceCombos = collected.combos;
              var authMethod = uniqValues(
                serviceCombos.map(function (c) {
                  return c.productType;
                })
              ).join(' / ');
              var pkgFlat = [];
              serviceCombos.forEach(function (c) {
                (c.packageNames || []).forEach(function (n) {
                  if (n && pkgFlat.indexOf(n) < 0) pkgFlat.push(n);
                });
              });
              var availablePackages = pkgFlat.length ? pkgFlat.join('、') : '—';
              var primaryType = (serviceCombos[0] && serviceCombos[0].productType) || '软件服务';

              var ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
              appendOverlay('products', {
                id: 'PRD-' + Date.now(),
                name: nm,
                image: dr.querySelector('#prod-img').value.trim(),
                productLine: plVal,
                region: dr.querySelector('#prod-region').value.trim(),
                price: dr.querySelector('#prod-price').value.trim(),
                billingMode: '连续计费',
                summary: dr.querySelector('#prod-sum').value.trim(),
                description: dr.querySelector('#prod-desc').value.trim(),
                remark: dr.querySelector('#prod-remark').value.trim(),
                authMethod: authMethod || '—',
                availablePackages: availablePackages || '—',
                productForm: 'standard',
                serviceCombos: serviceCombos,
                type: primaryType,
                line: plVal,
                status: '上架',
                referenced: false,
                creatorEntries: [{ name: '当前登录用户', at: ts }],
                updatedBy: '当前登录用户',
                updatedAt: ts
              });
              toast('已添加商品', 'success');
              close();
              render();
            },
            null,
            function (dr) {
              wireProductServiceConfigBlock(dr, {
                rowsSelector: '#prod-svc-rows',
                addButtonSelector: '#prod-svc-add',
                rowIdPrefix: 'prod-svc',
                initialCombos: [],
                maxRows: 2
              });
              wireProductImageUploadField(dr, 'prod');
            }
          );
        });
      var prodListMain = document.querySelector('.main');
      if (prodListMain) {
        prodListMain.addEventListener('click', function (e) {
          var ed = e.target.closest('[data-product-edit]');
          if (ed) {
            openProductEditDrawer(decodeURIComponent(ed.getAttribute('data-product-edit') || ''));
            return;
          }
          var det = e.target.closest('[data-product-detail]');
          if (det) {
            openProductDetailDrawer(decodeURIComponent(det.getAttribute('data-product-detail') || ''));
          }
        });
      }
    }
    if (path === '/admin/specs') {
      var prods = getData().products;
      document.getElementById('btn-new-spec') &&
        document.getElementById('btn-new-spec').addEventListener('click', function () {
          openSpecFormDrawer(prods, null, null);
        });
      document.querySelectorAll('[data-spec-edit]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = decodeURIComponent(b.getAttribute('data-spec-edit') || '');
          var row =
            id &&
            getData().specs.find(function (x) {
              return x.id === id;
            });
          if (!row) {
            toast('未找到商品规格', 'error');
            return;
          }
          openSpecFormDrawer(prods, row, id);
        });
      });
      document.querySelectorAll('[data-spec-detail]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = decodeURIComponent(b.getAttribute('data-spec-detail') || '');
          openSpecDetailDrawer(id);
        });
      });
    }
    if (path === '/admin/system/dict') {
      document.getElementById('btn-new-dict') &&
        document.getElementById('btn-new-dict').addEventListener('click', function () {
          openDrawer(
            '新增字典项',
            '<div class="drawer-form-stack">' +
              '<div class="form-field"><label for="dd-etype"><span class="field-required-mark">*</span>枚举类型</label>' +
              '<input id="dd-etype" required placeholder="如 questionType" /></div>' +
              '<div class="form-field"><label for="dd-pk"><span class="field-required-mark">*</span>主键</label>' +
              '<input id="dd-pk" type="number" step="1" required placeholder="数字主键，可为 0" /></div>' +
              '<div class="form-field"><label for="dd-val"><span class="field-required-mark">*</span>值</label>' +
              '<input id="dd-val" required placeholder="展示文案" /></div>' +
              '<div class="form-field"><label for="dd-sort"><span class="field-required-mark">*</span>排序</label>' +
              '<input id="dd-sort" type="number" step="1" required placeholder="列表排序权重" /></div>' +
              '<div class="form-field"><label for="dd-desc">描述</label>' +
              '<textarea id="dd-desc" rows="3" placeholder="说明（可选）"></textarea></div>' +
              '</div>',
            function (dr, close) {
              var et = dr.querySelector('#dd-etype').value.trim();
              var pkRaw = dr.querySelector('#dd-pk').value.trim();
              var val = dr.querySelector('#dd-val').value.trim();
              var sortRaw = dr.querySelector('#dd-sort').value.trim();
              var pkNum = parseInt(pkRaw, 10);
              var sortNum = parseInt(sortRaw, 10);
              if (!et || !val) {
                toast('请填写枚举类型与值', 'error');
                return;
              }
              if (pkRaw === '' || isNaN(pkNum)) {
                toast('主键请填写有效整数', 'error');
                return;
              }
              if (sortRaw === '' || isNaN(sortNum)) {
                toast('排序请填写有效整数', 'error');
                return;
              }
              var rowId = 'dict-new-' + Date.now();
              appendOverlay('dictionaries', {
                id: rowId,
                enumType: et,
                pk: pkNum,
                value: val,
                sort: sortNum,
                description: dr.querySelector('#dd-desc').value.trim()
              });
              toast('已添加字典项（演示写入）', 'success');
              close();
              render();
            },
            { primaryLabel: '确定' }
          );
        });
      var dictMainEl = document.querySelector('.main');
      if (dictMainEl && !dictMainEl.dataset.dictDelegated) {
        dictMainEl.dataset.dictDelegated = '1';
        dictMainEl.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-dict-edit]');
          if (!btn) return;
          openDictionaryEditDrawer(decodeURIComponent(btn.getAttribute('data-dict-edit') || ''));
        });
      }
    }
    if (path === '/admin/pool') {
      var poolMain = document.getElementById('pool-main-table');
      poolMain &&
        poolMain.addEventListener('click', function (e) {
          var cfg = e.target.closest('[data-pool-config]');
          if (cfg) {
            var company = cfg.getAttribute('data-company') || '';
            var instance = cfg.getAttribute('data-instance') || '';
            var spec = cfg.getAttribute('data-spec') || '';
            var product = cfg.getAttribute('data-product') || '';
            var enterpriseId = cfg.getAttribute('data-enterprise-id') || '';
            var curDefault = cfg.getAttribute('data-default') === '1';
            var targetLine = {
              enterpriseId: enterpriseId,
              company: company,
              instance: instance,
              product: product,
              spec: spec
            };
            openDrawer(
              '开发者配置',
              '<div class="pool-dev-config">' +
                (curDefault
                  ? '<p class="pool-dev-config__badge-row"><span class="tag tag--ok">当前为默认规格</span></p>'
                  : '') +
                '<dl class="pool-dev-config__dl" aria-label="资源上下文">' +
                '<div class="pool-dev-config__pair">' +
                '<dt>企业</dt><dd>' +
                escapeHtml(company) +
                '</dd></div>' +
                '<div class="pool-dev-config__pair">' +
                '<dt>实例</dt><dd>' +
                escapeHtml(instance) +
                '</dd></div>' +
                '<div class="pool-dev-config__pair">' +
                '<dt>商品</dt><dd>' +
                escapeHtml(product) +
                '</dd></div>' +
                '<div class="pool-dev-config__pair">' +
                '<dt>规格</dt><dd>' +
                escapeHtml(spec) +
                '</dd></div>' +
                '</dl>' +
                '<div class="pool-dev-config__actions">' +
                '<label class="pool-dev-config__check">' +
                '<input type="checkbox" id="pool-cfg-default"' +
                (curDefault ? ' checked' : '') +
                ' />' +
                '<span>设为该实例下该商品的<strong>默认规格</strong></span></label>' +
                '<p class="pool-dev-config__hint">同一实例仅有一条默认规格；勾选保存后，同组其他规格会自动取消默认。</p>' +
                '</div></div>',
              function (drawer, close) {
                var chk = drawer.querySelector('#pool-cfg-default');
                var wants = !!(chk && chk.checked);
                persistPoolDefaultSpecs(targetLine, wants);
                toast('已更新默认规格（演示）', 'success');
                close();
                render();
              }
            );
            return;
          }
          var ord = e.target.closest('[data-pool-order]');
          if (ord) {
            var orderCo = ord.getAttribute('data-company') || '';
            openAdminPoolOrderDrawer({ fixedCompany: orderCo });
            return;
          }
          var renew = e.target.closest('[data-pool-renew]');
          if (!renew) return;
          var company = renew.getAttribute('data-company') || '';
          var instance = renew.getAttribute('data-instance') || '';
          var spec = renew.getAttribute('data-spec') || '';
          var product = renew.getAttribute('data-product') || '';
          var isDefault = renew.getAttribute('data-default') === '1';
          openDrawer(
            '资源续费',
            '<div class="drawer-form-stack drawer-form-stack--node-edit">' +
              '<div class="drawer-readonly-summary" role="region" aria-label="续费目标（只读）">' +
              '<div class="drawer-readonly-summary__head">' +
              '<span class="drawer-readonly-summary__title">续费目标</span>' +
              '<span class="drawer-readonly-summary__badge">只读</span>' +
              '</div>' +
              '<p class="drawer-readonly-summary__hint">以下维度来自当前列表行，不可在此修改；仅数量与备注可编辑。</p>' +
              '<div class="drawer-readonly-summary__list">' +
              '<div class="drawer-readonly-summary__row">' +
              '<span class="drawer-readonly-summary__label">企业</span>' +
              '<span class="drawer-readonly-summary__value">' +
              escapeHtml(company) +
              '</span></div>' +
              '<div class="drawer-readonly-summary__row">' +
              '<span class="drawer-readonly-summary__label">实例</span>' +
              '<span class="drawer-readonly-summary__value">' +
              escapeHtml(instance) +
              '</span></div>' +
              '<div class="drawer-readonly-summary__row">' +
              '<span class="drawer-readonly-summary__label">商品</span>' +
              '<span class="drawer-readonly-summary__value">' +
              escapeHtml(product) +
              '</span></div>' +
              '<div class="drawer-readonly-summary__row">' +
              '<span class="drawer-readonly-summary__label">规格</span>' +
              '<span class="drawer-readonly-summary__value">' +
              escapeHtml(spec) +
              '</span></div>' +
              '<div class="drawer-readonly-summary__row">' +
              '<span class="drawer-readonly-summary__label">默认规格</span>' +
              '<span class="drawer-readonly-summary__value">' +
              (isDefault ? '是' : '否') +
              '</span></div>' +
              '</div></div>' +
              '<div class="drawer-edit-editable">' +
              '<div class="drawer-edit-editable__head">' +
              '<span class="drawer-edit-editable__title">续费信息</span>' +
              '<span class="drawer-edit-editable__hint">可编辑</span>' +
              '</div>' +
              '<div class="drawer-edit-editable__form">' +
              '<div class="form-grid">' +
              '<div class="form-field"><label for="pool-renew-qty"><span class="field-required-mark">*</span>续费数量</label>' +
              '<input id="pool-renew-qty" type="number" min="1" value="100" /></div>' +
              '<div class="form-field"><label for="pool-renew-remark">备注</label>' +
              '<input id="pool-renew-remark" placeholder="例如：客户追加采购" /></div>' +
              '</div></div></div></div>',
            function (drawer, close) {
              var qty = Number(drawer.querySelector('#pool-renew-qty').value) || 0;
              if (qty <= 0) {
                toast('请输入有效的续费数量', 'error');
                return;
              }
              appendOverlay('resourceOrders', {
                no: 'POOL-' + Date.now(),
                type: '续费',
                company: company,
                spec: spec,
                quantity: qty,
                status: '待处理'
              });
              toast('已创建续费订单（演示）', 'success');
              close();
              render();
            }
          );
        });
      var companySelect = document.getElementById('pool-company');
      var instanceSelect = document.getElementById('pool-instance');
      var applyBtn = document.getElementById('pool-apply');
      var resetBtn = document.getElementById('pool-reset');
      function syncPoolFilter(reRender) {
        window.__poolFilter = {
          company: companySelect ? companySelect.value : '',
          instance: instanceSelect ? instanceSelect.value : '',
          keyword: document.getElementById('pool-keyword') ? document.getElementById('pool-keyword').value.trim() : '',
          hideEmpty: !!(document.getElementById('pool-hide-empty') && document.getElementById('pool-hide-empty').checked)
        };
        if (reRender) render();
      }
      companySelect &&
        companySelect.addEventListener('change', function () {
          if (window.__poolFilter) window.__poolFilter.instance = '';
          syncPoolFilter(true);
        });
      instanceSelect &&
        instanceSelect.addEventListener('change', function () {
          syncPoolFilter(true);
        });
      applyBtn &&
        applyBtn.addEventListener('click', function () {
          syncPoolFilter(true);
        });
      resetBtn &&
        resetBtn.addEventListener('click', function () {
          window.__poolFilter = {};
          render();
        });
      document.getElementById('pool-keyword') &&
        document.getElementById('pool-keyword').addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            syncPoolFilter(true);
          }
        });
      document.getElementById('pool-hide-empty') &&
        document.getElementById('pool-hide-empty').addEventListener('change', function () {
          syncPoolFilter(true);
        });
    }
    if (
      path === '/admin/resources/sdk' ||
      path === '/admin/resources/cors' ||
      path === '/client/resource/sdk' ||
      path === '/client/resource/cors'
    ) {
      ensureSdkResourceHandlersBound();
      ensureCorsResourceHandlersBound();
      document.getElementById('res-filter-go') &&
        document.getElementById('res-filter-go').addEventListener('click', function () {
          var fc = document.getElementById('f-company').value.trim();
          var fr = document.getElementById('f-region').value.trim();
          var fs = document.getElementById('f-spec').value.trim();
          if (path.indexOf('/client/') === 0) {
            window.__clientResFilter = { company: fc, region: fr, spec: fs };
          } else {
            window.__resFilter = { company: fc, region: fr, spec: fs };
          }
          render();
        });
      if (/\/sdk$/.test(path)) {
        mountSdkBatchToolbarInteractions();
        document.getElementById('btn-sdk-open-account') &&
          document.getElementById('btn-sdk-open-account').addEventListener('click', openSdkOpenAccountDrawer);
      }
      if (/\/cors$/.test(path)) {
        document.getElementById('btn-cors-open-account') &&
          document.getElementById('btn-cors-open-account').addEventListener('click', openCorsOpenAccountDrawer);
      }
    }
    if (path === '/client/dashboard') {
      document.getElementById('dash-gran') &&
        document.getElementById('dash-gran').addEventListener('change', function () {
          toast('已切换粒度（图表为演示数据）', 'success');
          render();
        });
    }
    if (
      path === '/client/resource/info' ||
      path === '/client/resource/company' ||
      path === '/client/resource/regions'
    ) {
      var btnToggle = document.getElementById('btn-toggle-pool-info');
      var poolBody = document.getElementById('client-pool-info-body');
      if (btnToggle && poolBody) {
        btnToggle.addEventListener('click', function () {
          var willHide = !poolBody.hidden;
          poolBody.hidden = willHide;
          btnToggle.setAttribute('aria-expanded', willHide ? 'false' : 'true');
          btnToggle.textContent = willHide ? '展开 v' : '收起 ^';
        });
      }
    }
    if (path === '/client/trade/reconciliation' || path === '/client/resource/reconciliation') {
      document.getElementById('rec-filter') &&
        document.getElementById('rec-filter').addEventListener('click', function () {
          window.__recFilter = {
            month: document.getElementById('rec-month').value,
            region: document.getElementById('rec-region').value.trim(),
            spec: document.getElementById('rec-spec').value.trim()
          };
          render();
        });
      document.getElementById('rec-export') &&
        document.getElementById('rec-export').addEventListener('click', function () {
          confirmDialog('导出对账', '生成 Excel（演示）：将显示进度并提示完成。', function () {
            var bd = document.createElement('div');
            bd.className = 'modal-backdrop';
            bd.innerHTML =
              '<div class="modal"><div class="modal__head">正在生成</div><div class="modal__body">' +
              '<div class="progress"><div class="progress__fill" id="ex-p" style="width:0%"></div></div>' +
              '<p style="margin:0;font-size:13px" id="ex-t">准备中…</p></div></div>';
            document.body.appendChild(bd);
            var p = 0;
            var t = setInterval(function () {
              p += 20;
              var fill = bd.querySelector('#ex-p');
              var tx = bd.querySelector('#ex-t');
              if (fill) fill.style.width = p + '%';
              if (tx) tx.textContent = '处理中 ' + p + '%';
              if (p >= 100) {
                clearInterval(t);
                bd.remove();
                toast('已生成（演示），可下载由后端对接实现', 'success');
              }
            }, 200);
          });
        });
    }
    if (path === '/admin/system/roles') {
      function findRoleByCode(code) {
        return (getData().roles || []).find(function (r) {
          return r.code === code;
        });
      }
      document.getElementById('rf-pagesize') &&
        document.getElementById('rf-pagesize').addEventListener('change', function () {
          var sz = parseInt(document.getElementById('rf-pagesize').value, 10) || 20;
          window.__rolePage = { num: 1, size: sz };
          render();
        });
      document.querySelectorAll('#role-page-root [data-role-page]').forEach(function (b) {
        b.addEventListener('click', function () {
          var n = parseInt(b.getAttribute('data-role-page'), 10);
          if (!n) return;
          window.__rolePage = window.__rolePage || { num: 1, size: 20 };
          window.__rolePage.num = n;
          render();
        });
      });
      document.getElementById('btn-role-new') &&
        document.getElementById('btn-role-new').addEventListener('click', function () {
          openDrawer(
            '新增角色',
            '<div class="drawer-form-stack">' +
              '<div class="form-field"><label for="rn-new-name"><span class="field-required-mark">*</span>角色名称</label><input id="rn-new-name" required placeholder="请输入" /></div>' +
              '<div class="form-field"><label for="rn-new-code"><span class="field-required-mark">*</span>角色标识</label><input id="rn-new-code" required placeholder="" /></div>' +
              '<div class="form-field"><label for="rn-new-sort">显示顺序</label><input id="rn-new-sort" type="number" step="1" placeholder="数字越小越靠前" /></div>' +
              '<div class="form-field"><label for="rn-new-remark">备注</label><textarea id="rn-new-remark" class="drawer-textarea" rows="3" placeholder="可选"></textarea></div>' +
              '</div>',
            function (dr, close) {
              if (!dr.querySelector('#rn-new-name').value.trim() || !dr.querySelector('#rn-new-code').value.trim()) {
                toast('请填写角色名称与标识', 'error');
                return;
              }
              toast('已创建（演示，未写入种子）', 'success');
              close();
            }
          );
        });
      var rwrap = document.getElementById('role-table-wrap');
      if (rwrap) {
        rwrap.addEventListener('click', function (e) {
          var editB = e.target.closest('[data-role-edit]');
          var menuB = e.target.closest('[data-role-menu]');
          var dataB = e.target.closest('[data-role-data]');
          if (editB) {
            var code = decodeURIComponent(editB.getAttribute('data-role-edit') || '');
            var role = findRoleByCode(code);
            if (!role) return;
            openDrawer(
              '编辑角色 · ' + role.name,
              '<div class="drawer-form-stack">' +
                '<div class="form-field"><label for="rn-edit-name"><span class="field-required-mark">*</span>角色名称</label><input id="rn-edit-name" value="' +
                escapeHtml(role.name) +
                '" required /></div>' +
                '<div class="form-field"><label for="rn-edit-code">角色标识</label><input id="rn-edit-code" value="' +
                escapeHtml(role.code) +
                '" readonly /></div>' +
                '<div class="form-field"><label for="rn-edit-sort">显示顺序</label><input id="rn-edit-sort" type="number" step="1" value="' +
                escapeHtml(role.sortOrder != null ? String(role.sortOrder) : '') +
                '" placeholder="数字越小越靠前" /></div>' +
                '<div class="form-field"><label for="rn-edit-remark">备注</label><textarea id="rn-edit-remark" class="drawer-textarea" rows="3" placeholder="可选">' +
                escapeHtml(role.remark || '') +
                '</textarea></div>' +
                '</div>',
              function (dr, close) {
                if (!dr.querySelector('#rn-edit-name').value.trim()) {
                  toast('请填写角色名称', 'error');
                  return;
                }
                toast('已保存（演示）', 'success');
                close();
              }
            );
            return;
          }
          if (menuB) {
            var c2 = decodeURIComponent(menuB.getAttribute('data-role-menu') || '');
            var r2 = findRoleByCode(c2);
            if (!r2) return;
            openDrawer(
              '菜单权限 · ' + r2.name,
              '<p class="drawer-pwd-hint">为「' +
                escapeHtml(r2.name) +
                '」配置可访问菜单（演示）。</p>' +
                buildRoleMenuTreeEditableHtml(),
              function (dr, close) {
                toast('菜单权限已保存（演示）', 'success');
                close();
              },
              { primaryLabel: '保存' }
            );
            return;
          }
          if (dataB) {
            var c3 = decodeURIComponent(dataB.getAttribute('data-role-data') || '');
            var r3 = findRoleByCode(c3);
            if (!r3) return;
            openDrawer(
              '数据权限 · ' + r3.name,
              '<p class="drawer-pwd-hint">为「' +
                escapeHtml(r3.name) +
                '」选择数据权限范围；一期为统一档位（演示）。</p>' +
                buildRoleDataMatrixHtml(),
              function (dr, close) {
                var scope = dr.querySelector('#role-data-scope') && dr.querySelector('#role-data-scope').value;
                toast('数据权限已保存（演示）：' + (scope === 'enterprise' ? '本企业' : scope === 'self' ? '仅本人' : '全部'), 'success');
                close();
              },
              { primaryLabel: '保存' }
            );
          }
        });
      }
    }
    if (path === '/admin/system/admins') {
      var na = document.getElementById('btn-new-admin');
      if (na) {
        na.addEventListener('click', function () {
          toast('新增管理员：右侧抽屉表单与一期其它模块保持一致（演示占位）', 'success');
        });
      }

      function admRowById(id) {
        return (getData().adminUsers || []).find(function (x) {
          return x.id === id || x.email === id;
        });
      }

      function closeAdmMoreMenu(btn) {
        var det = btn && btn.closest('details.action-more');
        if (det) det.open = false;
      }

      document.querySelectorAll('[data-adm-edit]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-adm-edit');
          var row = admRowById(id);
          if (!row) return;
          openDrawer(
            '编辑管理员',
            '<div class="form-grid">' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>姓名</label><input id="ae-name" value="' +
              escapeHtml(row.name) +
              '" required /></div>' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>手机号</label><input id="ae-phone" value="' +
              escapeHtml(row.phone) +
              '" required /></div>' +
              '<div class="form-field"><label><span class="field-required-mark">*</span>邮箱</label><input id="ae-email" type="email" value="' +
              escapeHtml(row.email) +
              '" required /></div>' +
              '<div class="form-field"><label>备注</label><input id="ae-remark" value="' +
              escapeHtml(row.remark || '') +
              '" /></div>' +
              '</div><p style="font-size:12px;color:#64748b">演示保存不写入种子数据；账号状态请在「更多」中操作。</p>',
            function (drawer, close) {
              if (!drawer.querySelector('#ae-name').value.trim()) {
                toast('请填写姓名', 'error');
                return;
              }
              toast('已保存（演示）', 'success');
              close();
            }
          );
        });
      });

      document.querySelectorAll('[data-adm-role]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-adm-role');
          var row = admRowById(id);
          if (!row) {
            toast('未找到管理员', 'error');
            return;
          }
          openAdminRoleConfigDrawer(row.id || row.email, row);
        });
      });

      document.querySelectorAll('[data-adm-enable]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-adm-enable');
          var row = admRowById(id);
          closeAdmMoreMenu(b);
          confirmDialog(
            '启用',
            '确认启用管理员「' + (row ? row.name : id) + '」？（仅演示）',
            function () {
              toast('已启用（演示）', 'success');
            }
          );
        });
      });

      document.querySelectorAll('[data-adm-disable]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-adm-disable');
          var row = admRowById(id);
          closeAdmMoreMenu(b);
          confirmDialog(
            '禁用',
            '确认禁用管理员「' + (row ? row.name : id) + '」？（仅演示）',
            function () {
              toast('已禁用（演示）', 'success');
            }
          );
        });
      });

      document.querySelectorAll('[data-adm-reset-pwd]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-adm-reset-pwd');
          var row = admRowById(id);
          closeAdmMoreMenu(b);
          confirmDialog(
            '重置密码',
            '重置管理员「' +
              (row ? row.name : id) +
              '」登录邮箱「' +
              (row ? row.email : '') +
              '」的登录密码？（仅演示）',
            function () {
              toast('重置密码通知已发送（演示）', 'success');
            }
          );
        });
      });
    }
    if (path === '/admin/system/menus') {
      var treeCatalog = buildMenuCatalogFromSuperAdminNav();
      var nm = document.getElementById('btn-new-menu-root');
      if (nm) {
        nm.addEventListener('click', function () {
          toast('菜单路由配置对接后端后可新建（演示）', 'success');
        });
      }
      var ms = document.getElementById('menu-mgmt-search');
      if (ms) {
        ms.addEventListener('click', function () {
          var ne = document.getElementById('menu-mgmt-name');
          var ss = document.getElementById('menu-mgmt-status');
          window.__menuMgmtFilter = {
            name: (ne && ne.value.trim()) || '',
            status: (ss && ss.value) || ''
          };
          render();
        });
      }
      var mr = document.getElementById('menu-mgmt-reset');
      if (mr) {
        mr.addEventListener('click', function () {
          window.__menuMgmtFilter = { name: '', status: '' };
          render();
        });
      }
      var mex = document.getElementById('menu-mgmt-expand');
      if (mex) {
        mex.addEventListener('click', function () {
          window.__menuMgmtExpanded = {};
          render();
        });
      }
      var mcc = document.getElementById('menu-mgmt-collapse');
      if (mcc) {
        mcc.addEventListener('click', function () {
          var pr = new Set();
          menuMgmtCollectParentIds(treeCatalog, pr);
          var next = {};
          pr.forEach(function (mid) {
            next[mid] = false;
          });
          window.__menuMgmtExpanded = next;
          render();
        });
      }
      var tbody = document.getElementById('menu-mgmt-tbody');
      if (tbody) {
        tbody.addEventListener('click', function (e) {
          var tg = e.target.closest('[data-menu-toggle]');
          if (tg) {
            var id = decodeURIComponent(tg.getAttribute('data-menu-toggle') || '');
            if (!id) return;
            window.__menuMgmtExpanded = window.__menuMgmtExpanded || {};
            if (window.__menuMgmtExpanded[id] === false) delete window.__menuMgmtExpanded[id];
            else window.__menuMgmtExpanded[id] = false;
            render();
            return;
          }
          var editB = e.target.closest('[data-menu-edit]');
          if (editB) {
            var mid = decodeURIComponent(editB.getAttribute('data-menu-edit') || '');
            toast('编辑菜单「' + mid + '」对接后端后可保存（演示）', 'success');
          }
        });
      }
    }
    if (path === '/admin/profile' || path === '/admin/profile/password') {
      var btnPwdAdm = document.getElementById('btn-profile-change-pwd');
      if (btnPwdAdm) {
        btnPwdAdm.addEventListener('click', function () {
          openChangePasswordDrawer();
        });
      }
      if (path === '/admin/profile/password') {
        setTimeout(function () {
          openChangePasswordDrawer();
        }, 0);
      }
    }
    if (path === '/client/profile' || path === '/client/profile/password') {
      var btnPwdCl = document.getElementById('btn-profile-change-pwd');
      if (btnPwdCl) {
        btnPwdCl.addEventListener('click', function () {
          openChangePasswordDrawer();
        });
      }
      var slotFf = document.getElementById('profile-id-front');
      var slotBk = document.getElementById('profile-id-back');
      if (slotFf) {
        slotFf.addEventListener('click', function () {
          toast('演示：将打开文件选择（未实际上传）', 'success');
        });
      }
      if (slotBk) {
        slotBk.addEventListener('click', function () {
          toast('演示：将打开文件选择（未实际上传）', 'success');
        });
      }
      var fromPwdMenu = parsed.query && String(parsed.query.pwd) === '1';
      if (fromPwdMenu || path === '/client/profile/password') {
        setTimeout(function () {
          openChangePasswordDrawer();
        }, 0);
      }
    }
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('DOMContentLoaded', render);
})();
