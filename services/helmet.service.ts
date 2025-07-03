import helmet from "helmet"

const helmetService = helmet()

export default helmetService

/*
  --> Helmet is a middleware for Express.js that helps secure your application by setting various HTTP headers. 
      It provides protection against common web vulnerabilities such as cross-site scripting (XSS), clickjacking, and other attacks. 
      Here's what Helmet can do:
    
    Set Security Headers:
      - Content-Security-Policy: Helps prevent XSS attacks by controlling resources the browser can load.
      - X-Frame-Options: Protects against clickjacking by preventing the site from being embedded in an iframe.
      - Strict-Transport-Security: Enforces HTTPS connections.
      - X-DNS-Prefetch-Control: Controls DNS prefetching.
      - X-Content-Type-Options: Prevents MIME type sniffing.
      - Referrer-Policy: Controls the information sent in the Referer header.
      - Expect-CT: Helps detect and prevent misissued certificates.
      - Permissions-Policy: Restricts browser features like geolocation, camera, etc.
    
    Prevents Common Vulnerabilities:
      - Reduces exposure to attacks like XSS, clickjacking, and data injection.
      
    Customizable:
      - You can enable or disable specific headers based on your application's needs.
 */
