# Sentinel's Journal

## 2024-05-22 - Zero Backend Illusion
**Vulnerability:** Source Code Disclosure via Default Static Middleware
**Learning:** The project claimed "Zero backend" but relied on a simple Express server for local development/sync, which inadvertently exposed the entire project root via `express.static(__dirname)`. This highlights the risk of "simple" servers in development environments being used without proper security controls.
**Prevention:** Always configure static middleware to serve a specific `public` directory, or explicitly block sensitive files if serving root is necessary.
