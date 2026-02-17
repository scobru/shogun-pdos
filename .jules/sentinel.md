## 2026-02-17 - Critical File Exposure via Express Static
**Vulnerability:** The application was serving the root directory using `express.static(__dirname)`, exposing `.git`, source code, and configuration files.
**Learning:** Using `express.static` on the root directory without filters creates a critical information disclosure vulnerability, even if no secrets are hardcoded (git history might contain them).
**Prevention:** Always serve static files from a dedicated `public` directory, or use middleware to explicitly block access to dotfiles and sensitive files if serving from root is unavoidable.
