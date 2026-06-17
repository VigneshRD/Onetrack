// app/utils/registerComponents.js
// Mirrors all editor.DomComponents.addType() calls from the original Phalcon view

// ASSET_BASE: full URL to the portal_assets/grapesjs folder.
// Set VITE_API_BASE_URL in .env, e.g.:
//   VITE_API_BASE_URL=https://devappservice.lateshipment.com/portal_assets/grapesjs
// Falls back to VITE_API_BASE_URL + path, or relative path for local dev.
const _apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const ASSET_BASE = _apiBase
  ? `${_apiBase}/portal_assets/grapesjs`
  : '/portal_assets/grapesjs'; 



function uuid() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}


export function registerComponents(editor) {

  // ── CuImage ────────────────────────────────────────────────────────────────
  editor.DomComponents.addType('CuImage', {
    model: {
      defaults: {
        tagName: 'a',
        resizable: true,
        droppable: false,
        style: { display: 'inline-block' },
        traits: [
          { type: 'text', label: 'Source', name: 'href' },
          {
            type: 'select', label: 'Target', name: 'target',
            options: [
              { value: '', name: 'This window' },
              { value: '_blank', name: 'New window' },
            ],
          },
          {
            type: 'select', label: 'Object fit', name: 'object-fit', changeProp: true,
            options: [
              { value: 'fill', name: 'fill' }, { value: 'contain', name: 'contain' },
              { value: 'cover', name: 'cover' }, { value: 'none', name: 'none' },
              { value: 'scale-down', name: 'scale-down' },
            ],
          },
        ],
        components: [{
          type: 'image',
          style: { width: '100%', height: '100%' },
          resizable: false, draggable: false, droppable: false,
          hoverable: false, selectable: false,
        }],
      },
      init() {
        this.on('change:object-fit', this.updateObjectFit);
      },
      updateObjectFit(component, value) {
        component.components().models[0].setStyle({ 'object-fit': value, width: '100%', height: '100%' });
      },
    },
  });

  // ── Button ─────────────────────────────────────────────────────────────────
  editor.DomComponents.addType('Button', {
    isComponent: (el) => el.tagName === 'SECTION' && el.getAttribute('data-gjs-type') === 'Button',
    model: {
      defaults: {
        fullwidth: false,
        buttontype: 'type1',
        url: '',
        align: 'align1',
        buttoncolor: '#000000',
        tagName: 'section',
        traits: [
          {
            type: 'select', label: 'Select Button Type', name: 'btnType', changeProp: true,
            options: [
              { value: 'return', name: 'Return' },
              { value: 'none', name: 'None' },
            ],
          },
          { type: 'text', name: 'url', label: 'Link URL', placeholder: 'Link URL', changeProp: true },
          {
            type: 'radio', label: 'Button Style', name: 'buttontype', changeProp: true,
            options: [
              { value: 'type1', name: 'Filled Button' },
              { value: 'type2', name: 'Hollow Button' },
            ],
          },
          {
            type: 'radio', label: 'Align', name: 'align', changeProp: true,
            options: [
              { value: 'align1', name: 'Left' },
              { value: 'align2', name: 'Center' },
              { value: 'align3', name: 'Right' },
            ],
          },
          { type: 'checkbox', name: 'fullwidth', changeProp: true, label: 'Full Width' },
          { type: 'color', name: 'buttoncolor', changeProp: true, label: 'Button Color' },
        ],
        changeAlignment(type) {
          const map = { align1: 'justify-content-start', align2: 'justify-content-center', align3: 'justify-content-end' };
          return 'py-1 d-flex ' + map[type];
        },
        changeButton(type) {
          return type === 'type1' ? 'btn btn-primary' : 'btn btn-outline-primary';
        },
        setColor(color, type, editorRef) {
          if (type === 'type1') {
            editorRef.Css.setRule('.btn-primary', { 'background-color': color + ' !important', 'border-color': color + ' !important' });
          } else {
            editorRef.Css.setRule('.btn-outline-primary', { color, 'border-color': color });
          }
        },
        components(model) {
          model.setAttributes({ 'data-btntype': model.get('btnType') });
          const widthCss = model.get('fullwidth') ? ' btn-block' : '';
          const typeCss = model.attributes.changeButton(model.get('buttontype'));
          return model.components(
            `<a href="${model.get('url')}" class="${typeCss}${widthCss}" data-gjs-editable="true" data-gjs-selectable="false" data-gjs-removable="false" draggable="false">Add Your CTA</a>`
          );
        },
      },
      init() {
        this.on('change:btnType', () => editor.getSelected()?.setAttributes({ 'data-btntype': this.props().btnType }));
        this.on('change:fullwidth', () => {
          const el = editor.getSelected()?.getChildAt(0);
          this.props().fullwidth ? el?.addClass('w-100') : el?.removeClass('w-100');
        });
        this.on('change:buttontype', () => {
          editor.getSelected()?.getChildAt(0)?.setClass(this.attributes.changeButton(this.props().buttontype));
        });
        this.on('change:align', () => {
          editor.getSelected()?.setClass(this.attributes.changeAlignment(this.props().align));
        });
        this.on('change:url', () => {
          editor.getSelected()?.getChildAt(0)?.setAttributes({ href: this.props().url });
        });
        this.on('change:buttoncolor', () => {
          this.attributes.setColor(this.props().buttoncolor, this.props().buttontype, editor);
        });
      },
    },
  });

  // ── Header ─────────────────────────────────────────────────────────────────
  editor.DomComponents.addType('Header', {
    isComponent: (el) => el.tagName === 'HEADER',
    model: {
      defaults: {
        tagName: 'header',
        attributes: { class: 'py-lg-2 py-md-2 py-0 navbar navbar-expand-lg navbar-expand-md navbar-light bg-transparent' },
        badgable: false,
        propagate: ['badgable'],
        traits: [],
        components(model) {
        
          const id = uuid();
          return `<div class="container px-3">
            <article class="navbar-brand d-block d-lg-none d-md-none"><a><img src="https://devappservice.lateshipment.com/portal_assets/grapesjs/img/logo_default.png" class="navbar-brand p-0 m-0"></a></article> 
            <button type="button" data-toggle="collapse" data-target="#${id}" class="navbar-toggler"><span class="navbar-toggler-icon"></span></button>
            <section id="${id}" class="collapse navbar-collapse">
              <ul class="navbar-nav d-flex order-1 w-100">
                <li class="nav-item"><a class="nav-link text-nowrap" data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=false>Link</a></li>
                <li class="nav-item"><a class="nav-link text-nowrap" data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=false>Link</a></li>
                <li class="nav-item"><a class="nav-link text-nowrap" data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=false>Link</a></li>
              </ul>
              <article class="d-none d-lg-block d-md-block order-2"><a><img src="https://devappservice.lateshipment.com/portal_assets/grapesjs/img/logo_default.png" class="navbar-brand p-0 m-0"></a></article>
              <ul class="navbar-nav d-flex w-100 order-3 justify-content-end">
                <li class="nav-item"><a class="nav-link text-nowrap" data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=false>Link</a></li>
                <li class="nav-item"><a class="nav-link text-nowrap" data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=false>Link</a></li>
                <li class="nav-item"><a class="nav-link text-nowrap" data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=false>Link</a></li>
              </ul>
            </section>
          </div>`;
        },
      },
    },
  });

  // ── Footer ─────────────────────────────────────────────────────────────────
  editor.DomComponents.addType('Footer', {
    isComponent: (el) => el.tagName === 'FOOTER',
    model: {
      defaults: {
        footertype: 'type1',
        align: 'align3',
        linkcount: 1,
        tagName: 'footer',
        droppable: false,
        traits: [
          {
            type: 'select', label: 'Type', name: 'footertype', changeProp: true,
            options: [{ value: 'type1', name: 'Simple Footer' }, { value: 'type2', name: 'Footer With Column' }],
          },
          {
            type: 'select', label: 'Social Link Alignment', name: 'align', changeProp: true,
            options: [{ value: 'align1', name: 'Left' }, { value: 'align2', name: 'Center' }, { value: 'align3', name: 'Right' }],
          },
          { type: 'number', name: 'linkcount', label: 'Footer Links', max: 3, min: 0, changeProp: true },
        ],
        components() {
          return `<section class="container" data-gjs-removable=false data-gjs-copyable=false data-gjs-selectable=false data-gjs-droppable=false>
            <div class="d-flex justify-content-between align-items-center flex-column flex-md-row" data-gjs-removable=false data-gjs-copyable=false data-gjs-selectable=false>
              <a class="navbar-brand text-secondary m-0 order-1" href="https://www.lateshipment.com/" data-gjs-editable=false data-gjs-copyable=false data-gjs-draggable=false data-gjs-droppable=false data-gjs-selectable=false>
                <small data-gjs-editable=false data-gjs-selectable=false>Powered By </small>
                <img src="${ASSET_BASE}/img/logo-color.png" height="48" data-gjs-editable=false data-gjs-selectable=false/>
              </a>
              <ul class="nav order-2 footer_first_ul" data-gjs-removable=false data-gjs-copyable=false data-gjs-selectable=false>
                <li class="nav-item"><a class="nav-link" href="/" data-gjs-copyable=false data-gjs-draggable=false>Link</a></li>
              </ul>
              <ul class="nav order-3" data-gjs-removable=false data-gjs-copyable=false data-gjs-selectable=false>
                ${['facebook', 'instagram', 'linkedin', 'pinterest'].map(
                  (s) => `<li class="nav-item h4 m-0" data-gjs-copyable=false data-gjs-draggable=false data-gjs-droppable=false data-gjs-removable=false>
                    <a class="nav-link text-secondary" href="/" data-gjs-copyable=false data-gjs-draggable=false>
                      <i class="fa fa-${s}" data-gjs-copyable=false data-gjs-draggable=false data-gjs-removable=false></i>
                    </a>
                  </li>`
                ).join('')}
              </ul>
            </div>
          </section>`;
        },
      },
    },
  });

  // ── Productslider ──────────────────────────────────────────────────────────
  // FIX: Swiper is injected into the canvas iframe via canvas.scripts[].
  // The iframe scripts may not have finished loading when GrapesJS runs the
  // component's script prop. We poll with setTimeout until window.Swiper
  // is available, then initialise — this eliminates the
  // "Swiper is not defined" ReferenceError.
  editor.DomComponents.addType('Productslider', {
    model: {
      defaults: {
        tagName: 'div',
        uid: '',
        products_per_slide: '4',
        number_of_products: '8',
        slider_type: 'manual',
        style: { 'padding-top': '0.5rem', 'padding-bottom': '0.5rem' },
        traits: [
          {
            type: 'select', label: 'Select Source', name: 'slider_type', changeProp: true,
            options: [
              { value: 'manual', name: 'Manual' }, { value: 'rebuy', name: 'From Rebuy' },
              { value: 'nosto', name: 'From Nosto' }, { value: 'algolia', name: 'From Algolia' },
              { value: 'shopify', name: 'From Shopify' },
            ],
          },
          {
            type: 'select', label: 'No of Products Per Slide', name: 'products_per_slide', changeProp: true,
            options: ['1','2','3','4','5','6'].map((v) => ({ value: v, name: v })),
          },
          { type: 'number', label: 'No of Products', name: 'number_of_products', min: 2, max: 30, changeProp: true },
        ],
        // ── script runs INSIDE the canvas iframe — no module imports allowed ──
        script: function (props) {
          function init() {
            // Poll until Swiper is injected by the canvas iframe scripts
            if (typeof Swiper === 'undefined') { // eslint-disable-line no-undef
              setTimeout(init, 150);
              return;
            }
            var selector = '.swiper-' + props.uid;
            var el = document.querySelector(selector);
            if (!el) return; // component was removed before Swiper loaded
            // Destroy stale instance if any (e.g. on trait change re-render)
            if (el.swiper) {
              el.swiper.destroy(true, true);
            }
            new Swiper(selector, { // eslint-disable-line no-undef
              speed: 800,
              navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
              },
              breakpoints: {
                640: {
                  slidesPerView: Math.min(parseInt(props.products_per_slide), 2),
                  slidesPerGroup: Math.min(parseInt(props.products_per_slide), 2),
                  spaceBetween: 10,
                },
                1024: {
                  slidesPerView: parseInt(props.products_per_slide),
                  slidesPerGroup: parseInt(props.products_per_slide),
                  spaceBetween: 10,
                },
              },
            });
          }
          init();
        },
        'script-props': ['uid', 'products_per_slide', 'number_of_products'],
        getSlides(count) {
          let slides = '';
          for (let i = 0; i < count; i++) {
            slides += `<div class="swiper-slide" data-dynamic="content"
              data-gjs-copyable=false data-gjs-removable=false data-gjs-droppable=false data-gjs-draggable=false
              style="color:#212121;overflow:hidden;max-width:100%;height:auto;display:flex;flex-direction:column;">
              <a data-dynamic="href" target="_blank" style="display:block;width:100%;">
                <img data-dynamic="img" data-gjs-selectable=false src="${ASSET_BASE}/img/default_product_image_pr.png"
                  style="height:14rem;width:100%;object-fit:cover;display:block;"/>
              </a>
              <div style="padding:0.5rem;">
                <p data-dynamic="name" style="font-size:0.875rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0;text-align:center;">Product Name</p>
              </div>
              <div class="slide-footer" style="padding:0.5rem 0.5rem 0;">
                <p data-dynamic="price" style="font-size:1.2rem;color:#888;font-weight:500;text-transform:uppercase;text-align:center;">$00</p>
                <a data-dynamic="href" target="_blank" style="background-color:#000;padding:1rem;border-radius:4px;font-size:0.875rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#fff;display:inline-block;width:100%;text-decoration:none;text-align:center;">Shop Now</a>
              </div>
            </div>`;
          }
          return slides;
        },
        components(model) {
          const id = uuid();
          model.set('uid', id);
          model.setAttributes({ 'data-slider': model.get('slider_type'), 'data-dynamic': 'product-rec' });
          const count = parseInt(model.get('number_of_products'));
          return `<div class="swiper swiper-${id}" data-gjs-selectable=false>
            <h2 style="text-align:center;font-size:32px;font-weight:700;margin-bottom:1rem;">Top picks for you</h2>
            <div class="swiper-wrapper" data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false>
              ${model.attributes.getSlides(count)}
            </div>
            <div class="swiper-button-prev" style="color:#000;"></div>
            <div class="swiper-button-next" style="color:#000;"></div>
          </div>`;
        },
      },
      init() {
        this.on('change:number_of_products', this.updateSlides);
        this.on('change:slider_type', () => {
          editor.getSelected()?.setAttributes({ 'data-slider': this.props().slider_type, 'data-dynamic': 'product-rec' });
        });
      },
      updateSlides() {
        const count = parseInt(this.props().number_of_products);
        const wrapper = editor.getSelected()?.find('.swiper-wrapper')[0];
        const current = editor.getSelected()?.find('.swiper-slide').length || 0;
        const diff = count - current;
        if (diff > 0) wrapper?.append(this.attributes.getSlides(diff));
        else for (let i = 0; i < Math.abs(diff); i++) wrapper?.getLastChild()?.remove();
      },
    },
  });

  // ── HTimeline ──────────────────────────────────────────────────────────────
  editor.DomComponents.addType('HTimeline', {
    isComponent: (el) => el.tagName === 'SECTION' && el.classList?.contains('hor-tracking-b'),
    model: {
      defaults: {
        activecolor: 'var(--primary)',
        tracksize: '1',
        tagName: 'section',
        attributes: { class: 'tracking hor-tracking-b', 'data-dynamic': 'hor-tracking-s-b' },
        traits: [
          { type: 'color', label: 'Event Progress Color', name: 'activecolor', changeProp: true },
          {
            type: 'select', label: 'Track Size', name: 'tracksize', changeProp: true,
            options: [{ name: 'Default', value: '1' }, { name: 'Medium', value: '2' }, { name: 'Large', value: '3' }],
          },
        ],
        setStyle(color) {
          editor.Css.setRule('.event-container.completed .event-blip', { 'background-color': color + ' !important' });
          editor.Css.setRule('.event-container.completed .event-track-progress', { 'background-color': color + ' !important', width: '100%' });
        },
        getSize(size) { return { '1': 4, '2': 8, '3': 16 }[size] || 4; },
        components(model) {
          model.attributes.setStyle(model.get('activecolor'));
          return model.components(`<div class="d-flex flex-row" data-gjs-selectable=false data-gjs-draggable=false>
            ${[
              { name: 'ordered', date: 'xx/xx', status: 'completed' },
              { name: 'received', date: 'xx/xx', status: 'completed' },
              { name: 'xxxxxx', date: 'xx/xx', status: 'incomplete' },
              { name: 'out for delivery', date: 'xx/xx', status: 'incomplete' },
              { name: 'Delivered', date: 'xx/xx', status: 'incomplete' },
            ].map((ev, i, arr) => {
              const trackCss = i === 0
                ? ['justify-content-end', 'w-50']
                : i === arr.length - 1
                  ? ['justify-content-start', 'w-50']
                  : ['justify-content-center', 'w-100'];
              return `<div class="event-container ${ev.status} position-relative d-flex flex-column flex-grow-1" data-gjs-selectable=false data-gjs-draggable=false>
                <h5 class="text-capitalize text-center w-100 px-2 m-0">${ev.name}</h5>
                <div class="d-flex my-3 ${trackCss[0]} align-items-center position-relative w-100" data-gjs-selectable=false>
                  <span class="w-100 position-absolute d-flex justify-content-center" data-gjs-selectable=false>
                    <span class="event-blip p-2 rounded-circle" data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false></span>
                  </span>
                  <span class="${trackCss[1]} event-track-line" style="height:4px;" data-gjs-selectable=false>
                    <span class="d-block h-100 event-track-progress" data-gjs-selectable=false></span>
                  </span>
                </div>
                <h6 class="m-0 text-center w-100 px-2 text-nowrap" data-dynamic="hor-tracking-s-b-item-date">${ev.date}</h6>
              </div>`;
            }).join('')}
          </div>`);
        },
      },
      init() {
        this.on('change:activecolor', () => this.attributes.setStyle(this.props().activecolor));
        this.on('change:tracksize', () => {
          const size = this.attributes.getSize(this.props().tracksize);
          editor.getSelected()?.find('.event-track-line')?.forEach((t) => t.setStyle({ height: size + 'px' }));
        });
      },
    },
  });

  // ── LinkGroup ──────────────────────────────────────────────────────────────
  editor.DomComponents.addType('LinkGroup', {
    isComponent: (el) => el.tagName === 'ARTICLE' && el.classList?.contains('link-groups'),
    model: {
      defaults: {
        linkcount: 3,
        layouttype: 'type2',
        tagName: 'article',
        attributes: { class: 'navbar-expand-lg link-groups w-100' },
        traits: [
          { type: 'number', name: 'linkcount', label: 'Number Of Links', changeProp: true, min: 1, max: 6 },
          {
            type: 'select', label: 'Align Links', name: 'layouttype', changeProp: true,
            options: [{ value: 'type1', name: 'Left' }, { value: 'type2', name: 'Center' }, { value: 'type3', name: 'Right' }],
          },
        ],
        getCss(type) {
          return { type1: 'justify-content-start', type2: 'justify-content-center', type3: 'justify-content-end' }[type];
        },
        generateLink(count) {
          return Array.from({ length: count }, () => '<li class="nav-item m-0"><a class="nav-link" href="/">Link</a></li>').join('');
        },
        components(model) {
          const css = model.attributes.getCss(model.get('layouttype'));
          return `<ul data-gjs-selectable=false data-gjs-removable=false class="navbar-nav ${css} flex-column w-100 flex-md-row flex-lg-row mt-2 mt-lg-0">
            ${model.attributes.generateLink(model.get('linkcount'))}
          </ul>`;
        },
      },
      init() {
        this.on('change:linkcount', this.updateLink);
        this.on('change:layouttype', () => {
          const css = this.attributes.getCss(this.props().layouttype);
          const nav = editor.getSelected()?.find('.navbar-nav')[0];
          nav?.removeClass(['justify-content-start', 'justify-content-center', 'justify-content-end']);
          nav?.addClass(css);
        });
      },
      updateLink() {
        const count = this.props().linkcount;
        const nav = editor.getSelected()?.find('.navbar-nav')[0];
        const current = editor.getSelected()?.find('.nav-item').length || 0;
        const diff = count - current;
        if (diff > 0) nav?.append(this.attributes.generateLink(diff));
        else for (let i = 0; i < Math.abs(diff); i++) nav?.getLastChild()?.remove();
      },
    },
  });

  // ── SocialLinks ────────────────────────────────────────────────────────────
  editor.DomComponents.addType('SocialLinks', {
    isComponent: (el) => el.tagName === 'ARTICLE' && el.classList?.contains('navbar-expand-lg'),
    model: {
      defaults: {
        linkcount: 3,
        layouttype: 'type2',
        tagName: 'article',
        attributes: { class: 'navbar-expand-lg link-groups w-100' },
        traits: [
          { type: 'number', name: 'linkcount', label: 'Number Of Links', changeProp: true, min: 1 },
          {
            type: 'select', label: 'Align Links', name: 'layouttype', changeProp: true,
            options: [{ value: 'type1', name: 'Left' }, { value: 'type2', name: 'Center' }, { value: 'type3', name: 'Right' }],
          },
        ],
        getCss(type) {
          return { type1: 'justify-content-start', type2: 'justify-content-center', type3: 'justify-content-end' }[type];
        },
        generateLink(count) {
          return Array.from({ length: count }, () =>
            '<li class="nav-item h4 m-0 mx-1"><a class="nav-link px-2 rounded-circle text-secondary" href="/"><i class="fa fa-globe" style="width:24px;text-align:center;"></i></a></li>'
          ).join('');
        },
        components(model) {
          const css = model.attributes.getCss(model.get('layouttype'));
          return `<ul data-gjs-selectable=false data-gjs-removable=false class="navbar-nav ${css} w-100 flex-row mt-2 mt-lg-0">
            ${model.attributes.generateLink(model.get('linkcount'))}
          </ul>`;
        },
      },
      init() {
        this.on('change:linkcount', this.updateLink);
        this.on('change:layouttype', () => {
          const css = this.attributes.getCss(this.props().layouttype);
          const nav = editor.getSelected()?.find('.navbar-nav')[0];
          nav?.removeClass(['justify-content-start', 'justify-content-center', 'justify-content-end']);
          nav?.addClass(css);
        });
      },
      updateLink() {
        const count = this.props().linkcount;
        const nav = editor.getSelected()?.find('.navbar-nav')[0];
        const current = editor.getSelected()?.find('.nav-item').length || 0;
        const diff = count - current;
        if (diff > 0) nav?.append(this.attributes.generateLink(diff));
        else for (let i = 0; i < Math.abs(diff); i++) nav?.getLastChild()?.remove();
      },
    },
  });

  // ── multipleTracking ───────────────────────────────────────────────────────
  editor.DomComponents.addType('multipleTracking', {
    model: {
      defaults: {
        tagName: 'div',
        uid: '',
        attributes: { 'data-dynamic': 'multi-trackingnumber' },
        script: function (props) {
          var btn = document.getElementById('collapse-btn-' + props.uid);
          var panel = document.getElementById(props.uid);
          if (btn && panel) {
            btn.addEventListener('click', function () {
              panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            });
          }
        },
        'script-props': ['uid'],
        components(model) {
          const id = uuid();
          model.set('uid', id);
          return `<button class="btn w-100" style="color:#fff;background-color:#000;" type="button" id="collapse-btn-${id}"
              data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false data-gjs-droppable=false>
              TRACK OTHER SHIPMENTS
            </button>
            <div id="${id}" style="display:none;" class="my-2"
              data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false data-gjs-droppable=false data-gjs-selectable=false>
              <div class="card card-body p-1" data-dynamic="multi-trackingnumber-body"
                data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false data-gjs-droppable=false>
                <a class="btn" data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false data-gjs-droppable=false>xxxxxxxxxx</a>
                <a class="btn" data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false data-gjs-droppable=false>xxxxxxxxxx</a>
              </div>
            </div>`;
        },
      },
    },
  });

  // ── productDetails ─────────────────────────────────────────────────────────
  editor.DomComponents.addType('productDetails', {
    model: {
      defaults: {
        tagName: 'article',
        uid: '',
        attributes: { class: '' },
        script: function (props) {
          var btn = document.getElementById('collapse-btn-' + props.uid);
          var panel = document.getElementById(props.uid);
          if (btn && panel) {
            btn.addEventListener('click', function () {
              panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            });
          }
        },
        'script-props': ['uid'],
        components(model) {
          const id = uuid();
          model.set('uid', id);
          return `<div data-dynamic="product-details" data-gjs-selectable=true>
            <div class="d-flex align-items-center media mb-3" data-dynamic="product-details-item">
              <img src="${ASSET_BASE}/img/icon_1.png" width="80px" class="mr-3 rounded" data-dynamic="product-details-item-img"/>
              <div class="flex-grow-1 media-body">
                <h6 class="fw-bold text-uppercase mb-1" data-dynamic="product-details-item-name">Product Name</h6>
                <div class="mb-1">SIZE: <span data-dynamic="product-details-item-size">1</span></div>
                <div class="mb-1">QUANTITY: <span data-dynamic="product-details-item-quantity">1</span></div>
                <a href="#" style="font-size:13px;color:black;text-decoration:underline;" data-dynamic="product-review-by-product">Leave a Review</a>
              </div>
              <div class="d-flex flex-column align-items-start" style="min-width:130px;gap:6px;margin-left:12px;">
                <button type="button" class="btn" style="background-color:#7eff7e;color:black;border:none;padding:6px 10px;border-radius:5px;width:100%;max-width:150px;" data-dynamic="product-details-item-btn-green">Shop Now</button>
                <a href="#" style="font-size:13px;color:black;text-decoration:underline;" data-dynamic="return-track-link-by-product">Track Return</a>
              </div>
            </div>
          </div>
          <div class="text-center" style="margin-top:10px;">
            <button id="collapse-btn-${id}" type="button" class="btn" data-dynamic="product-details-btn"
              style="color:#fff;background-color:#000;padding:8px 12px;border:none;border-radius:4px;cursor:pointer;">
              Show Other Products
            </button>
          </div>
          <div id="${id}" style="display:none;"></div>`;
        },
      },
    },
  });

  // ── DeliveryTimeline ───────────────────────────────────────────────────────
  editor.DomComponents.addType('DeliveryTimeline', {
    model: {
      defaults: {
        tagName: 'div',
        uid: '',
        attributes: { class: 'tracking', 'data-gjs-droppable': 'false' },
        script: function (props) {
          var btn = document.getElementById('modal-btn-' + props.uid);
          var panel = document.getElementById(props.uid);
          if (btn && panel) {
            btn.addEventListener('click', function () {
              panel.classList.toggle('show');
              panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            });
          }
        },
        'script-props': ['uid'],
        components(model) {
          const id = uuid();
          model.set('uid', id);
          const trackItem = () => `
            <div class="media position-relative d-flex mb-1 align-items-stretch"
              data-gjs-editable=false data-gjs-selectable=false data-gjs-draggable=false data-gjs-droppable=false data-dynamic="ver-tracking-small-b-item">
              <span class="track-blip d-flex mt-1 mx-2 px-2 justify-content-center position-relative"
                data-gjs-editable=false data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false>
                <span class="position-absolute d-flex justify-content-center"
                  data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false data-gjs-copyable=false data-gjs-removable=false>
                  <span class="p-2 bg-primary rounded-circle"></span>
                </span>
                <span class="h-100 border-primary border-left"></span>
              </span>
              <div class="media-body flex-grow-1"
                data-gjs-editable=false data-gjs-droppable=false data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=false>
                <h6 class="text-body m-0" data-gjs-editable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false data-gjs-droppable=false
                  data-dynamic="ver-tracking-small-b-item-event">xxxxx xxxx xxxx xxxx xxxx</h6>
                <p class="text-secondary m-0" data-gjs-editable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false data-gjs-droppable=false
                  data-dynamic="ver-tracking-small-b-item-date">XXX-XX-XXXX</p>
              </div>
            </div>`;
          return `<div data-dynamic="ver-tracking-small-b"
              data-gjs-editable=false data-gjs-selectable=false data-gjs-draggable=false data-gjs-droppable=false>
              ${trackItem()}${trackItem()}${trackItem()}
            </div>
            <button type="button" id="modal-btn-${id}" class="btn btn-primary btn-block"
              data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false>
              Show Tracking Details
            </button>
            <div id="${id}" style="display:none;" class="p-2 border rounded mt-2"
              data-dynamic="ver-tracking-large-b"></div>`;
        },
      },
    },
  });

  // ── sponser ────────────────────────────────────────────────────────────────
  editor.DomComponents.addType('sponser', {
    isComponent: (el) => el.tagName === 'SECTION' && el.querySelector?.('.navbar-brand.footer'),
    model: {
      defaults: {
        tagName: 'section',
        droppable: false,
        components: `<div class="container" data-gjs-copyable=false data-gjs-removable=false data-gjs-selectable=false data-gjs-draggable=false data-gjs-droppable=false>
          <div class="d-flex justify-content-between" data-gjs-copyable=false data-gjs-removable=false data-gjs-selectable=false data-gjs-draggable=false data-gjs-droppable=false>
            <a class="navbar-brand footer text-secondary m-0" href="https://www.lateshipment.com/"
              data-gjs-copyable=false data-gjs-removable=false data-gjs-selectable=false data-gjs-draggable=false data-gjs-droppable=false>
              <small data-gjs-copyable=false data-gjs-removable=false data-gjs-selectable=false data-gjs-draggable=false data-gjs-droppable=false>Powered By</small>
              <img src="${ASSET_BASE}/img/logo-color.png" style="filter:grayscale(1) brightness(0.8);" class="ml-2" height="32"
                data-gjs-copyable=false data-gjs-removable=false data-gjs-selectable=false data-gjs-draggable=false data-gjs-droppable=false/>
            </a>
          </div>
        </div>`,
      },
    },
  });

  // ── Content ────────────────────────────────────────────────────────────────
  editor.DomComponents.addType('Content', {
    isComponent: (el) => el.tagName === 'ARTICLE' && el.getAttribute('data-gjs-type') === 'Content',
    model: {
      defaults: {
        tagName: 'article',
        fontsize: 'p',
        layerable: false,
        badgable: false,
        propagate: ['badgable'],
        traits: [
          {
            type: 'select', label: 'Content Size', name: 'fontsize', changeProp: true,
            options: [
              { value: 'h1', name: 'Heading 1' }, { value: 'h2', name: 'Heading 2' },
              { value: 'h3', name: 'Heading 3' }, { value: 'h4', name: 'Heading 4' },
              { value: 'h5', name: 'Heading 5' }, { value: 'h6', name: 'Heading 6' },
              { value: 'p', name: 'Body Text' },
            ],
          },
        ],
        components(model) {
          const tag = model.get('fontsize') || 'p';
          return `<${tag} data-gjs-selectable=false>Your text goes here</${tag}>`;
        },
      },
      init() {
        this.on('change:fontsize', () => {
          const tag = this.props().fontsize;
          const text = this.getChildAt(0)?.getInnerHTML() || 'Your text goes here';
          this.getChildAt(0)?.replaceWith(`<${tag} data-gjs-selectable=false>${text}</${tag}>`);
        });
      },
    },
  });
}