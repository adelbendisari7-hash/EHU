# src/app/api/

All Next.js API Route Handlers. Each `route.ts` file in this directory tree handles HTTP requests for a specific resource.

## Universal Conventions

### Request Handling Pattern
Every route handler must:
1. **Authenticate**: validate the session with `getServerSession(authOptions)` — return 401 if not authenticated
2. **Authorize**: check the user's role against the required permission — return 403 if insufficient
3. **Validate**: parse and validate the request body/params with Zod — return 400 with error details if invalid
4. **Execute**: call the appropriate service function (not Prisma directly)
5. **Log**: write an entry to `audit_logs` for mutating operations (POST/PATCH/DELETE)
6. **Respond**: return `NextResponse.json(data)` with appropriate HTTP status code

### Security Rules
- **Never** expose `password_hash` or internal tokens in responses
- **Never** expose complete audit log details to non-admin roles
- All IDs in URLs are validated as UUIDs; return 400 if format is invalid
- Rate limiting applied to auth endpoints (5 requests/minute per IP)

### Response Format
```json
// Success
{ "data": { ... }, "message": "Optional success message" }

// Error
{ "error": "Human-readable error message", "details": [...] }
```

### HTTP Status Codes
- 200: success GET/PATCH
- 201: success POST (created)
- 400: validation error
- 401: not authenticated
- 403: insufficient role
- 404: resource not found
- 500: internal server error
