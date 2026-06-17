export function exitIframe() {
    if (typeof window === "undefined") return;
    
    // Check if we're in an iframe
    if (window.top !== window.self) {
      // Get current URL params
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");
      const host = params.get("host");
      
      if (shop) {
        // Build the redirect URL that breaks out of iframe
        const redirectUrl = `https://${shop}/admin/apps/${import.meta.env.VITE_SHOPIFY_API_KEY}`;
        window.top.location.href = redirectUrl;
      }
    }
  }
  
  export function redirectToAuth(shop) {
    const apiUrl = import.meta.env.VITE_API_URL;
    const authUrl = `${apiUrl}/authdem/install?shop=${shop}`;
    
    if (window.top !== window.self) {
      window.top.location.href = authUrl;
    } else {
      window.location.href = authUrl;
    }
  }