// utils/registerBlocks.js
// Mirrors all editor.BlockManager.add() calls from the original Phalcon view
// Asset URLs are now env-variable driven instead of Twig url() helpers
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const ASSET_BASE = `${API_BASE}/portal_assets/grapesjs`;

 
export function registerBlocks(editor) {
  // ─── Basic ───────────────────────────────────────────────────────────────

  editor.BlockManager.add('Customimage', {
    label: `<div><div class="my-label-block">Image</div></div>`,
    category: 'Basic',
    attributes: { class: 'gjs-fonts gjs-f-image' },
    content: { type: 'CuImage' },
  });

  editor.BlockManager.add('content', {
    label: `<div><h1><i class="fa fa-align-left"></i></h1><div class="my-label-block">Content</div></div>`,
    category: 'Basic',
    content: { type: 'Content' },
  });

  editor.BlockManager.add('Button', {
    label: 'Button Link',
    media: `<i class="fa fa-mouse-pointer"></i>`,
    attributes: { title: 'Add CTA or Return Portal URL' },
    category: 'Basic',
    content: { type: 'Button' },
  });

  // ─── Layout ───────────────────────────────────────────────────────────────

  editor.BlockManager.add('header', {
    label: 'Header',
    media: `<i class="fa fa-window-maximize"></i>`,
    category: 'Layout',
    content: { type: 'Header' },
  });

  editor.BlockManager.add('footer', {
    label: 'Footer',
    media: `<i class="fa fa-window-maximize" style="transform:rotate(180deg);"></i>`,
    category: 'Layout',
    content: { type: 'Footer' },
  });

  editor.BlockManager.add('spacerlarge', {
    label: 'Spacer Large',
    media: `<i class="fa fa-minus-square"></i>`,
    category: 'Layout',
    content: `<div class="my-4 py-4" data-gjs-droppable=false></div>`,
  });

  editor.BlockManager.add('spacersmall', {
    label: 'Spacer Small',
    media: `<i class="fa fa-minus-square"></i>`,
    category: 'Layout',
    content: `<div class="my-2 py-2" data-gjs-droppable=false></div>`,
  });

  editor.BlockManager.add('HrLine', {
    label: 'Horizontal Line',
    media: `<i class="fa fa-arrows-h"></i>`,
    category: 'Layout',
    content: `<hr data-gjs-type="default" draggable="true" data-highlightable="1"></hr>`,
  });

  editor.BlockManager.add('cover', {
    label: 'Cover Image',
    media: `<i class="fa fa-image"></i>`,
    category: 'Layout',
    content: `<img class="position-absolute img-fluid w-100 h-50" src="${ASSET_BASE}/img/default_cover.png" />`,
  });

  editor.BlockManager.add('linkGroup', {
    label: 'Link Group',
    media: `<i class="fa fa-link"></i>`,
    category: 'Layout',
    content: { type: 'LinkGroup' },
  });

  // ─── Shipping Information ─────────────────────────────────────────────────

  editor.BlockManager.add('timelime1', {
    label: 'Horizontal Timeline',
    media: `<i class="fa fa-map-marker"></i>`,
    category: 'Shipping Information',
    content: getHorizontalTimelineContent(),
  });

  editor.BlockManager.add('timeline-1', {
    label: 'Horizontal Timeline 2',
    media: `<i class="fa fa-map-marker"></i>`,
    category: 'Shipping Information',
    content: { type: 'HTimeline' },
  });

  editor.BlockManager.add('timeline2', {
    label: 'Vertical Timeline',
    media: `<i class="fa fa-map-marker"></i>`,
    category: 'Shipping Information',
    content: getVerticalTimelineContent(),
  });

  editor.BlockManager.add('timeline3', {
    label: 'Delivery Timeline',
    media: `<i class="fa fa-map-marker"></i>`,
    category: 'Shipping Information',
    content: { type: 'DeliveryTimeline' },
  });

  editor.BlockManager.add('timeline-3', {
    label: 'Delivery Timeline 2',
    media: `<i class="fa fa-map-marker"></i>`,
    category: 'Shipping Information',
    content: { type: 'DeliveryTimeline2' },
  });

  editor.BlockManager.add('Estimateddate', {
    label: 'Estimated Date',
    media: `<i class="fa fa-calendar-o"></i>`,
    category: 'Shipping Information',
    content: getEstimatedDateContent(),
  });

  editor.BlockManager.add('Product Details', {
    label: 'Product Details',
    media: `<i class="fa fa-archive"></i>`,
    category: 'Shipping Information',
    content: { type: 'productDetails' },
  });

  editor.BlockManager.add('carrierinfo', {
    label: 'Carrier Information',
    media: `<i class="fa fa-truck"></i>`,
    category: 'Shipping Information',
    content: getCarrierInfoContent(),
  });

  editor.BlockManager.add('carrierinfo 2', {
    label: 'Carrier Information 2',
    media: `<i class="fa fa-truck"></i>`,
    category: 'Shipping Information',
    content: getCarrierInfo2Content(),
  });

  editor.BlockManager.add('Multi tracking', {
    label: 'Other Tracking Details',
    media: `<i class="fa fa-truck"></i>`,
    category: 'Shipping Information',
    content: { type: 'multipleTracking' },
  });

  editor.BlockManager.add('tracking-history-list', {
    label: 'Tracking History List',
    media: `<i class="fa fa-truck"></i>`,
    category: 'Shipping Information',
    content: getTrackingHistoryContent(),
  });

  editor.BlockManager.add('new track info', {
    label: 'New Track Info',
    media: `<i class="fa fa-truck"></i>`,
    category: 'Shipping Information',
    content: getNewTrackInfoContent(),
  });

  // ─── Widget ───────────────────────────────────────────────────────────────

  editor.BlockManager.add('rating', {
    label: 'Rating',
    media: `<i class="fa fa-star"></i>`,
    category: 'Widget',
    content: getRatingContent(),
  });

  editor.BlockManager.add('banner', {
    label: 'Promo Banner',
    media: `<i class="fa fa-certificate"></i>`,
    category: 'Widget',
    content: getBannerContent(),
  });

  editor.BlockManager.add('banner 2', {
    label: 'Promo Banner 2',
    media: `<i class="fa fa-certificate"></i>`,
    category: 'Widget',
    content: getBanner2Content(),
  });

  editor.BlockManager.add('card', {
    label: 'Card View',
    media: `<i class="fa fa-id-card-o"></i>`,
    category: 'Widget',
    content: `<div class="card rounded-lg">
      <div class="card-header text-center bg-transparent text-capitalize font-weight-bold">Enter Your Card Header</div>
      <div class="card-body" data-gjs-type="default" data-highlightable="1"></div>
    </div>`,
  });

  editor.BlockManager.add('contactUs', {
    label: 'Contact Us',
    media: `<i class="fa fa-phone-square"></i>`,
    category: 'Widget',
    content: getContactUsContent(),
  });

  editor.BlockManager.add('Returns', {
    label: 'Returns',
    media: `<i class="fa fa-retweet"></i>`,
    category: 'Widget',
    content: getReturnsContent(),
  });

  editor.BlockManager.add('productRecommendation swiper', {
    label: 'Product Recommendation',
    media: `<i class="fa fa-id-card"></i>`,
    category: 'Widget',
    content: { type: 'Productslider' },
  });

  editor.BlockManager.add('nosto', {
    label: 'Product Recommendation with Nosto',
    media: `<i class="fa fa-shopping-bag"></i>`,
    category: 'Widget',
    content: `<div class="nosto_element" data-dynamic="nosto-b" data-gjs-droppable=false data-gjs-copyable=false>
      <div class="bg-secondary" style="height:200px;width:100%" data-gjs-removable=false data-gjs-selectable=false data-gjs-copyable=false></div>
    </div>`,
  });

  editor.BlockManager.add('Sociallinks', {
    label: 'Social Links',
    media: `<i class="fa fa-globe"></i>`,
    category: 'Widget',
    content: { type: 'SocialLinks' },
  });

  editor.BlockManager.add('sponser', {
    label: 'Sponser',
    media: `<div class="gjs-fonts gjs-f-b3"></div>`,
    category: 'Widget',
    content: { type: 'sponser' },
  });

  editor.BlockManager.add('shopify product recommendation', {
    label: 'Shopify Product Recommendation',
    media: `<i class="fa fa-truck"></i>`,
    category: 'Widget',
    content: getShopifyProductRecContent(),
  });
}

// ─── Content helpers (large HTML strings) ─────────────────────────────────

function getEstimatedDateContent() { 
  return `<div class="bg-frost rounded-lg border" data-gjs-copyable=false data-gjs-editable=false>
    <div class="date" data-gjs-draggable=false data-gjs-copyable=false data-gjs-editable=false data-gjs-removable=false>
      <h6 class="card-subtitle mb-1 mt-0 text-uppercase" data-gjs-removable=false data-gjs-copyable=false>Estimated Delivery</h6>
      <h1 class="card-title mt-0 font-weight-bold m-0" data-gjs-editable=false data-gjs-copyable=false data-gjs-removable=false>
        <div class="d-inline-block" data-dynamic="day-b" data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-editable=false>XXX</div>
        <div class="d-inline-block" data-dynamic="date-b" data-gjs-droppable=false data-gjs-removable=false data-gjs-editable=false data-gjs-copyable=false>XX</div>
      </h1>
      <h4 class="m-0" data-gjs-removable=false data-gjs-copyable=false data-gjs-editable=false>
        <div class="d-inline-block" data-dynamic="month-b" data-gjs-droppable=false data-gjs-removable=false data-gjs-editable=false data-gjs-copyable=false>XXX</div>
        <div class="d-inline-block" data-dynamic="year-b" data-gjs-droppable=false data-gjs-removable=false data-gjs-editable=false data-gjs-copyable=false>XXXX</div>
      </h4>
    </div>
  </div>`;
}

function getCarrierInfoContent() {
 

  return `<div class="media" data-gjs-droppable=false>
    <img src="${ASSET_BASE}/img/default_clogo.jpg" class="mr-3 border rounded" style="max-height:64px;" data-dynamic="carrier-img-b" data-gjs-droppable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-copyable=false data-gjs-removable=false />
    <div class="media-body" data-gjs-droppable=false data-gjs-editable=false data-gjs-draggable=false>
      <h6 class="card-subtitle text-muted text-uppercase mt-0" data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false>Tracking Number</h6>
      <div class="text-body text-break" data-dynamic="trackingnumber-b" data-gjs-droppable=false data-gjs-draggable=false data-gjs-copyable=false data-gjs-removable=false>XXXXXXXXXXXXX</div>
      <span class="badge bg-success badge-success mt-1 px-2" data-dynamic="status-b">xxxxxx</span>
    </div>
  </div>`;
}

function getCarrierInfo2Content() {
  return `<div>
    <h6 class="card-subtitle mb-1 mt-0 text-uppercase">Tracking Information</h6>
    ${getCarrierInfoContent()}
  </div>`;
}

function getRatingContent() {
  return `<div class="card rounded-lg" data-dynamic="star-rating" data-gjs-droppable=false>
    <div class="card-header text-center bg-transparent text-capitalize font-weight-bold rate-text" data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false>Rate Your Experience</div>
    <section class="card-body d-flex justify-content-center" data-gjs-selectable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false>
      <div class="star-rating text-center" data-gjs-selectable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false>
        <s data-gjs-selectable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false><s data-gjs-selectable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false><s data-gjs-selectable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false><s data-gjs-selectable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false><s data-gjs-selectable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false></s></s></s></s></s>
      </div>
    </section>
  </div>`;
}

function getBannerContent() {
 
  return `<div class="card text-white rounded-lg h-100" data-gjs-droppable=false>
    <img src="${ASSET_BASE}/img/banner_default.png" class="card-img img-fluid rounded-lg h-100" alt="promotion banner" data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=false data-gjs-droppable=false/>
    <div class="position-absolute position-top px-3 py-1 w-100" data-gjs-removable=false data-gjs-draggable=false data-gjs-copyable=false data-gjs-droppable=false>
      <h2 class="card-title text-uppercase font-weight-bold font-italic text-shadow-lg text-center m-0" data-gjs-removable=true data-gjs-draggable=false data-gjs-copyable=false data-gjs-droppable=false>New Arrival</h2>
    </div>
    <div class="position-absolute position-bottom p-3 w-100" data-gjs-draggable=false data-gjs-removable=true data-gjs-copyable=false data-gjs-droppable=false>
      <a type="button" class="btn btn-primary btn-block mt-auto font-weight-bold" data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false data-dynamic="banner">Shop Now</a>
    </div>
  </div>`;
}

function getBanner2Content() {
 
  const img = `<img src="${ASSET_BASE}/img/banner_default.png" class="card-img img-fluid rounded-lg" alt="promotion banner" data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=false data-gjs-droppable=false/>`;
  return `<div class="card text-white rounded-lg" data-gjs-droppable=false style="border:none !important;">
    <h2 class="card-title text-center m-0" data-gjs-removable=true data-gjs-draggable=false data-gjs-copyable=false data-gjs-droppable=false>Shop By Category</h2>
    <a type="button">${img}</a><a type="button">${img}</a><a type="button">${img}</a><a type="button">${img}</a>
    <div class="position-bottom p-3 w-100" data-gjs-draggable=false data-gjs-removable=true data-gjs-copyable=false data-gjs-droppable=false>
      <a type="button" class="btn btn-primary btn-block mt-auto font-weight-bold" data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false data-dynamic="banner">Shop All</a>
    </div>
  </div>`;
}

function getContactUsContent() {
 
  return `<div class="card rounded-lg" data-gjs-droppable=false>
    <div class="card-header text-center bg-transparent text-capitalize font-weight-bold" data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false>Contact Us</div>
    <div class="card-body d-flex flex-column justify-content-between" data-gjs-droppable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-selectable=false>
      <div class="text-center" data-gjs-droppable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-selectable=false>
        <h5 class="font-weight-regular text-secondary" data-gjs-droppable=false data-gjs-draggable=false data-gjs-removable=false data-gjs-copyable=false>Have questions or need support?</h5>
      </div>
      <div class="text-center mb-3" data-gjs-droppable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-removable=false data-gjs-selectable=false>
        <img src="${ASSET_BASE}/img/default_contact_us.png" style="max-height:120px;" data-gjs-droppable=false data-gjs-draggable=false data-gjs-copyable=false data-gjs-removable=false/>
      </div>
      <a href="#" class="btn btn-outline-primary btn-block font-weight-bold" data-gjs-droppable=false data-gjs-removable=false data-gjs-draggable=false data-gjs-copyable=false>Get In Touch</a>
    </div>
  </div>`;
}

function getReturnsContent() {
  

 
  return `<div class="card" data-gjs-droppable=false style="border:none !important;">
    <div class="card-header text-center text-capitalize font-weight-bold" data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false>Start A Return</div>
    <div class="d-flex flex-column justify-content-between" data-gjs-droppable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-selectable=false>
      <a type="button">
        <div class="text-center" data-gjs-droppable=false data-gjs-editable=false data-gjs-draggable=false data-gjs-removable=false data-gjs-selectable=false>
          <img src="${ASSET_BASE}/img/default_contact_us.png" style="max-height:120px;" data-gjs-droppable=false data-gjs-draggable=false data-gjs-copyable=false data-gjs-removable=false/>
        </div>
      </a>
    </div>
  </div>`; 
}

function getTrackingHistoryContent() {
  return `<div class="tracking-history-container" style="background:#fff;border-radius:12px;max-width:900px;">
    <h3 style="margin-bottom:15px;font-size:18px;font-weight:600;color:#333;">Tracking History</h3>
    <div class="tracking_history_records" id="tracking_history_records">
      <div class="tracking-item" style="background:#fff;border-radius:10px;padding:15px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);border-left:4px solid #d94ae3;border-bottom:1px solid rgba(0,0,0,0.13);">
        <div style="font-weight:600;margin-bottom:4px;color:#333;">Out for delivery</div>
        <div style="font-size:13px;color:#666;">1 May 2024 • 12:00 • Leeds, UK</div>
      </div>
      <div class="tracking-item" style="background:#fff;border-radius:10px;padding:15px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);border-bottom:1px solid rgba(0,0,0,0.13);">
        <div style="font-weight:600;margin-bottom:4px;color:#333;">Arrived at local facility</div>
        <div style="font-size:13px;color:#666;">1 May 2024 • 10:40 • Leeds, UK</div>
      </div>
      <div class="tracking-item" style="background:#fff;border-radius:10px;padding:15px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);border-bottom:1px solid rgba(0,0,0,0.13);">
        <div style="font-weight:600;margin-bottom:4px;color:#333;">In transit to next facility</div>
        <div style="font-size:13px;color:#666;">1 May 2024 • 03:28 • Sheffield, UK</div>
      </div>
    </div> 
    <div id="tracking_history_button">
      <div style="text-align:center;margin-top:15px;">
        <button class="toggle-tracking-btn" id="toggleEventsBtn" style="background:#d94ae3;color:#fff;border:none;padding:8px 20px;border-radius:20px;cursor:pointer;font-size:14px;font-weight:500;">Show More</button>
      </div>
    </div>
  </div>`;
}

function getNewTrackInfoContent() {
  return `<div style="background:#fff;padding:15px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05);margin:auto;">
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <div data-dynamic="carrier_name" style="font-size:12px;padding:4px 10px;border-radius:20px;background:#e0f2ff;color:#0277bd;">Carrier name</div>
    </div>
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;align-items:center;margin-top:10px;">
      <div>
        <div data-dynamic="newstatus-b" style="font-size:22px;font-weight:bold;">Status</div>
        <div class='estimated-heading' style='margin:3px 0;font-weight:bold;'>Estimated Date</div>
        <div class="d-inline-block" data-dynamic="day-b">XXX</div><span>-</span>
        <div class="d-inline-block" data-dynamic="date-b">XX</div><span>-</span>
        <div class="d-inline-block" data-dynamic="month-b">XXX</div><span>-</span>
        <div class="d-inline-block" data-dynamic="year-b">XXXX</div>
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap;">
      <div style="background:#f1f1f1;padding:12px;border-radius:8px;flex:1 1 200px;border:1px solid rgba(0,0,0,0.13);">
        <div style="font-size:12px;color:#666;">Order number</div>
        <div data-dynamic="ordernumber-b" style="font-weight:bold;">XXXXXXXXXXXXX</div>
      </div>
      <div style="background:#f1f1f1;padding:12px;border-radius:8px;flex:1 1 200px;border:1px solid rgba(0,0,0,0.13);">
        <div style="font-size:12px;color:#666;">Tracking number</div>
        <div data-dynamic="trackingnumber-b" style="font-weight:bold;">XXXXXXXXXXXXX</div>
      </div>
      <div style="background:#f1f1f1;padding:12px;border-radius:8px;flex:1 1 200px;border:1px solid rgba(0,0,0,0.13);">
        <div style="font-size:12px;color:#666;">From</div>
        <div data-dynamic="from_address" style="font-weight:bold;">XXXX</div>
      </div>
      <div style="background:#f1f1f1;padding:12px;border-radius:8px;flex:1 1 200px;border:1px solid rgba(0,0,0,0.13);">
        <div style="font-size:12px;color:#666;">To</div>
        <div data-dynamic="to_address" style="font-weight:bold;">XXXX</div>
      </div>
    </div>
  </div>`;
}

function getShopifyProductRecContent() {

  


  const card = (n) => `<div data-dynamic="content" style="border:1px solid #eee;border-radius:10px;padding:15px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.05);text-align:center;">
    <div style="display:flex;flex-direction:row;justify-content:space-between;">
      <img src="${ASSET_BASE}/img/default_product_image_pr.png" class="img-fluid mb-3" width=90 data-dynamic="img"/>
      <h3 data-dynamic="name" style="margin:0;font-size:16px;font-weight:600;">Product Name</h3>
      <div data-dynamic="price" style="font-weight:bold;margin:0 5px;color:#444;">Price</div>
    </div>
    <div style="display:flex;justify-content:flex-end;">
      <a data-dynamic="href" target="_blank"><button type='button' style="background:#e84de0;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;">View</button></a>
    </div>
  </div>`;
  return `<div data-dynamic="product-rec" data-slider="shopify" style="background:#fff;padding:20px 15px;border-radius:10px;margin:auto;box-shadow:0 2px 6px rgba(0,0,0,0.08);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;flex-wrap:wrap;">
      <h2 style="font-size:18px;margin:0;font-weight:bold;">Recommended for you</h2>
    </div>
    <p style="margin-top:-10px;margin-bottom:20px;font-size:14px;color:#555;">Curated essentials for you.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:15px;">
      ${[1,2,3,4,5,6].map(card).join('')}
    </div>
  </div>`;
}

function getHorizontalTimelineContent() {
  const item = (active = false) => `<div class="ml-2 media position-relative d-flex flex-column mb-1 align-items-stretch" ${active ? '' : 'data-gjs-editable=false data-gjs-selectable=false data-gjs-draggable=false data-gjs-droppable=false'} ${active ? 'data-dynamic="hor-tracking-b-item"' : ''}>
    <div class="media-body flex-grow-0" ${active ? '' : 'data-gjs-editable=false data-gjs-selectable=false data-gjs-draggable=false data-gjs-droppable=false'}>
      <h6 class="text-body m-0 text-nowrap" data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false ${active ? 'data-dynamic="hor-tracking-b-item-date"' : ''}>XXX-XX-XXXX</h6>
    </div>
    <span class="track-blip d-flex my-2 py-2 justify-content-start position-relative" data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false>
      <span class="position-absolute d-flex justify-content-center" data-gjs-draggable=false data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false>
        <span class="p-2 ${active ? 'bg-primary' : 'bg-secondary'} rounded-circle" data-gjs-draggable=false data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false></span>
      </span>
      <span class="w-100 ${active ? 'border-primary' : 'border-secondary'} border-top mt-2" data-gjs-draggable=false data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false></span>
    </span>
    <div class="media-body flex-grow-1" data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false>
      <h6 class="text-body m-0" data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false data-gjs-copyable=false data-gjs-removable=false ${active ? 'data-dynamic="hor-tracking-b-item-event"' : ''}>xxxx xxxx xxxx xxxx</h6>
      <p class="text-secondary m-0" data-gjs-draggable=false data-gjs-editable=false data-gjs-droppable=false data-gjs-copyable=false data-gjs-removable=false ${active ? 'data-dynamic="hor-tracking-b-item-location"' : ''}>xxxxxxx xxxxxx xxxxx xxxxx</p>
    </div>
  </div>`;
  return `<div class="card rounded-lg" data-gjs-droppable=false>
    <div class="card-header bg-transparent text-center font-weight-bold" data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false>Tracking Details</div>
    <div class="card-body" data-gjs-draggable=false data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false>
      <div class="tracking d-flex flex-row" data-dynamic="hor-tracking-b" data-gjs-draggable=false data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false>
        ${item(true)}${item()}${item()}${item()}${item()}${item()}
      </div>
    </div>
  </div>`;
}

function getVerticalTimelineContent() {
  return `<div class="card rounded-lg" data-gjs-droppable=false>
    <div class="card-header bg-transparent text-center font-weight-bold" data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false>Tracking Details</div>
    <div class="card-body" data-gjs-editable=false data-gjs-selectable=false data-gjs-draggable=false data-gjs-droppable=false>
      <div class="tracking" data-dynamic="ver-tracking-b" data-gjs-editable=false data-gjs-selectable=false data-gjs-draggable=false data-gjs-droppable=false>
        ${[1,2,3,4].map(() => `<div class="media position-relative d-flex mb-1 align-items-stretch" data-gjs-editable=false data-gjs-selectable=false data-gjs-draggable=false data-dynamic="ver-tracking-b-item">
          <div class="media-body text-right flex-grow-0" data-gjs-editable=false data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=".media">
            <h6 class="text-body m-0 text-nowrap" data-gjs-editable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=false data-gjs-droppable=false data-dynamic="ver-tracking-b-item-date">XXX-XX-XXXX</h6>
          </div>
          <span class="track-blip d-flex mt-1 mx-2 px-2 justify-content-center position-relative" data-gjs-editable=false data-gjs-droppable=false data-gjs-removable=false data-gjs-copyable=false data-gjs-draggable=".media">
            <span class="position-absolute d-flex justify-content-center" data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false data-gjs-copyable=false data-gjs-removable=false>
              <span class="p-2 bg-primary rounded-circle" data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false data-gjs-copyable=false data-gjs-removable=false></span>
            </span>
            <span class="h-100 border-primary border-left" data-gjs-editable=false data-gjs-draggable=false data-gjs-droppable=false data-gjs-copyable=false data-gjs-removable=false></span>
          </span>
          <div class="media-body flex-grow-1" data-gjs-editable=false data-gjs-droppable=false data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=".media">
            <h6 class="text-body font-weight-bold m-0" data-gjs-editable=false data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=false data-gjs-droppable=false data-dynamic="ver-tracking-b-item-event">xxxx xxxx xxxx xxxx</h6>
            <p class="text-secondary m-0" data-gjs-editable=false data-gjs-copyable=false data-gjs-removable=false data-gjs-draggable=false data-gjs-droppable=false data-dynamic="ver-tracking-b-item-location">xxxxx xxxxx xxxxx xxxxx xxxxx</p>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}
