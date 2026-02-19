## 2026-02-19 - Critical Sensitive File Exposure
**Vulnerability:** The server was configured to serve the entire root directory as static files using `express.static(__dirname)`. This exposed sensitive files like `server.js`, `package.json`, `.git`, and potentially database files to any unauthenticated user.
**Learning:** Using `express.static` on the root directory is dangerous without explicit exclusions. It breaks the principle of least privilege.
**Prevention:** Always serve static files from a dedicated subdirectory (e.g., `public/`) or implement strict middleware to block access to sensitive files and dotfiles if serving from root is necessary.
