// Base URL for portal_assets — resolved per environment:
//   local dev  : "" (empty, Vite proxy handles /portal_assets/* → devappservice)
//   dev deploy : https://devappservice.lateshipment.com  (from .env)
//   production : https://apps.lateshipment.com           (from .env.production)
export const PORTAL_ASSETS_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
