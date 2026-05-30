# Frontend Security Audit Report - PitMind

**Date:** 2026-05-30
**Scope:** React/TypeScript Frontend Application
**Total Vulnerabilities Found:** 15

---

## CRITICAL VULNERABILITIES (2)

### 1. Firebase API Key Exposed in .env File
**Severity:** CRITICAL
**Category:** Secret Management
**Location:** `frontend/.env` (lines 1-8)

**Exposed Credentials:**
```
VITE_FIREBASE_API_KEY=AIzaSyDZcrYfZkK2cgExm50CPy_msZLU4msqg64
VITE_FIREBASE_PROJECT_ID=pitminds-ibm
```

**Impact:**
- Unauthorized Firebase access
- Quota abuse
- Potential data breach

**Remediation:**
1. Rotate Firebase API key immediately
2. Configure Firebase Security Rules
3. Restrict API key to specific domains in Google Cloud Console
4. Note: Firebase API keys in frontend are public by design, but MUST have proper restrictions

### 2. Development Authentication Bypass
**Severity:** CRITICAL  
**Location:** `frontend/src/App.tsx:68`, `frontend/src/services/api.ts:62`

**Code:**
```typescript
const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true" && import.meta.env.DEV;
const authToken = token || (import.meta.env.DEV ? "dev_mock" : undefined);
```

**Impact:** Complete authentication bypass if misconfigured

**Remediation:** Remove bypass entirely

---

## HIGH SEVERITY (5)

### 3. Insecure Token Storage in localStorage
**Severity:** HIGH
**Location:** Multiple files
**Issue:** LocalStorage vulnerable to XSS attacks
**Impact:** Session hijacking, token theft
**Fix:** Use sessionStorage or encrypted storage

### 4. Missing File Upload Validation
**Severity:** HIGH
**Location:** `FastF1Loader.tsx`, `PostRaceDebrief.tsx`
**Issue:** No file size, type, or filename validation
**Impact:** DoS, path traversal
**Fix:** Add client-side validation (5MB limit, MIME type checks)

### 5. WebSocket Message Validation Missing
**Severity:** HIGH
**Location:** `hooks/useStreamConnection.ts:127`
**Issue:** JSON parsed without validation
**Impact:** XSS, injection attacks
**Fix:** Use Zod or similar for runtime validation

### 6. HTTPS Not Enforced
**Severity:** HIGH
**Location:** `services/api.ts:52`
**Issue:** No HTTPS enforcement in production
**Impact:** MITM attacks, token theft
**Fix:** Force HTTPS for all production API calls

### 7. Verbose Error Messages
**Severity:** HIGH
**Location:** `services/api.ts:74`
**Issue:** Full error text exposed to users
**Impact:** Information disclosure
**Fix:** Sanitize errors, show generic messages

---

## MEDIUM SEVERITY (6)

### 8. Console.log Statements (18 found)
**Severity:** MEDIUM
**Issue:** Sensitive data may leak to console
**Fix:** Remove in production builds

### 9. Missing .env.example
**Severity:** MEDIUM
**Issue:** No template for environment variables
**Fix:** Create `.env.example` with placeholders

### 10. No Content Security Policy
**Severity:** MEDIUM
**Issue:** Missing CSP meta tag
**Fix:** Add CSP to `index.html`

### 11. WebSocket URL from window.location
**Severity:** MEDIUM
**Location:** `App.tsx:232-238`
**Issue:** URL derived from potentially manipulated source
**Fix:** Always use configured URL

### 12. Unvalidated URL Parameters
**Severity:** MEDIUM
**Issue:** URL params used without validation
**Fix:** Validate and sanitize all URL parameters

### 13. Missing CSRF Protection
**Severity:** MEDIUM
**Location:** All POST requests
**Fix:** Add CSRF tokens to requests

---

## LOW SEVERITY (2)

### 14. Dependency Vulnerabilities
**Severity:** LOW
**Action:** Run `npm audit` and update packages

### 15. Missing Subresource Integrity
**Severity:** LOW
**Issue:** CDN resources lack SRI hashes

---

## SUMMARY & PRIORITY ACTIONS

**Severity Breakdown:**
- Critical: 2
- High: 5  
- Medium: 6
- Low: 2
- **Total: 15**

**IMMEDIATE (This Week):**
1. Rotate Firebase API key and configure restrictions
2. Remove authentication bypass code
3. Enforce HTTPS in production
4. Add WebSocket message validation
5. Create .env.example

**HIGH PRIORITY (Next 2 Weeks):**
6. Add file upload validation
7. Sanitize error messages
8. Remove console.log in production
9. Add CSP header
10. Validate URL parameters

**MEDIUM PRIORITY (Next Month):**
11. Review localStorage security
12. Add CSRF protection
13. Fix WebSocket URL construction
14. Run npm audit and update dependencies

---

**Report Generated:** 2026-05-30  
**Status:** Action Required  
**Next Audit:** 3 months
