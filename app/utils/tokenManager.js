// JWT decode utility (works without secret - only reads claims)
function decodeJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }
  
  // Check if token expires within given seconds
  export function willExpireSoon(token, thresholdSeconds = 300) {
    if (!token) return true;
    
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    return timeUntilExpiry < thresholdSeconds;
  }
  
  // Get time until expiry in seconds
  export function getTimeUntilExpiry(token) {
    if (!token) return 0;
    
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return 0;
    
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
  }
  
  // Refresh access token
  export async function refreshAccessToken(refreshToken) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/authdem/refresh`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );
  
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
  
      const data = await response.json();
      
      // Store new tokens
      if (data.access_token) {
        sessionStorage.setItem('ls_access_token', data.access_token);
      }
      if (data.refresh_token) {
        sessionStorage.setItem('ls_refresh_token', data.refresh_token);
      }
      
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear invalid tokens
      sessionStorage.removeItem('ls_access_token');
      sessionStorage.removeItem('ls_refresh_token');
      throw error;
    }
  }