# Request Object

YinzerFlow provides a comprehensive request object containing parsed headers, body, query parameters, route parameters, and metadata with built-in security protections and validation.

## Configuration

Request parsing is automatically enabled and requires no configuration for basic usage:

```typescript
import { YinzerFlow } from 'yinzerflow';

const app = new YinzerFlow({ port: 3000 });

// Request object is automatically parsed and available in handlers
app.get('/api/data', ({ request }) => {
  const userAgent = request.headers['user-agent'];
  const queryParam = request.query.search;
  
  return { 
    message: 'Request parsed successfully',
    userAgent,
    queryParam 
  };
});
```

### Configuration Options

YinzerFlow's request parsing includes built-in security limits that are automatically applied:

| Security Limit | Default Value | Description |
|-----|---|---|
| `MAX_HEADERS` | `100` | Maximum number of headers per request |
| `MAX_HEADER_NAME_LENGTH` | `200` | Maximum length of header names |
| `MAX_HEADER_VALUE_LENGTH` | `8192` | Maximum length of header values |

These limits are built into the framework and cannot be disabled, ensuring consistent security across all YinzerFlow applications.

## Basic Example

```typescript
import { YinzerFlow } from 'yinzerflow';

const app = new YinzerFlow({ port: 3000 });

app.post('/api/users/:id', ({ request }) => {
  // Access route parameters
  const userId = request.params.id;
  
  // Access query parameters
  const includeProfile = request.query.include_profile;
  
  // Access headers
  const contentType = request.headers['content-type'];
  const authorization = request.headers['authorization'];
  
  // Access request body
  const userData = request.body;

  const clientIp = request.ipAddress
  
  return {
    message: 'Request processed successfully',
    userId,
    includeProfile,
    contentType,
    hasAuth: !!authorization,
    receivedData: userData
  };
});
  ```

## Common Use Cases

- **Authentication**: Extract and validate Bearer tokens, API keys, and session headers
- **Content Negotiation**: Handle Accept, Accept-Encoding, and Content-Type headers for proper response formatting
- **File Uploads**: Process multipart form data with automatic parsing and validation
- **API Filtering**: Use query parameters for pagination, sorting, and filtering
- **Route Parameters**: Extract dynamic URL segments with automatic parsing
- **Request Logging**: Access client IP, user agent, and request metadata for logging

## Error Handling

YinzerFlow automatically handles request parsing errors and provides clear error messages:

**Header-related errors:**
- `Too many headers: maximum 100 allowed`
- `Invalid header name: Invalid@Header`
- `Header name too long: maximum 200 characters allowed`
- `Header value too long: maximum 8192 characters allowed`
- `Header value contains invalid control characters`

**Body parsing errors:**
- `Invalid JSON in request body`
- `Multipart form data requires boundary parameter`
- `Unable to parse URL-encoded form data`

These errors automatically result in appropriate HTTP status codes (400 Bad Request) and prevent malformed requests from reaching your application handlers.

## Security Considerations

YinzerFlow implements several security measures to prevent common request-based vulnerabilities:

### 🛡️ RFC 7230 Header Compliance
- **Problem**: Invalid header names can bypass security filters and cause parsing inconsistencies
- **YinzerFlow Solution**: Strict validation against RFC 7230 specification - only valid header characters are allowed (letters, digits, hyphens, and specific symbols)

### 🛡️ DoS Protection Through Limits
- **Problem**: Unlimited headers, names, or values can cause memory exhaustion and server crashes
- **YinzerFlow Solution**: Built-in limits prevent abuse: maximum 100 headers, 200-character names, and 8KB values

### 🛡️ Control Character Sanitization
- **Problem**: Control characters in headers can cause parsing errors and bypass security filters
- **YinzerFlow Solution**: Automatic removal of dangerous control characters while preserving legitimate characters like horizontal tabs

### 🛡️ Body Size Validation
- **Problem**: Unlimited request body sizes can cause memory exhaustion and DoS attacks
- **YinzerFlow Solution**: Request body size limits and streaming parsing prevent memory-based attacks

### 🛡️ JSON Parsing Protection
- **Problem**: Malformed JSON can cause parsing errors or prototype pollution attacks
- **YinzerFlow Solution**: Safe JSON parsing with error handling and validation prevents malicious payloads

### 🛡️ Parameter Pollution Prevention
- **Problem**: Duplicate query parameters can bypass validation or cause unexpected behavior
- **YinzerFlow Solution**: Consistent parameter handling - last value wins for duplicates, preventing pollution attacks

### 🛡️ Path Traversal Protection
- **Problem**: Directory traversal attacks through URL paths can access unauthorized files
- **YinzerFlow Solution**: Comprehensive path normalization and validation prevents traversal attempts while maintaining route functionality

### 🛡️ IP Address Validation
- **Problem**: Spoofed proxy headers can bypass IP-based security controls
- **YinzerFlow Solution**: Secure IP address extraction with proxy header validation prevents spoofing attacks

These security measures ensure YinzerFlow's request implementation follows security best practices and prevents common attack vectors while maintaining RFC compliance and performance. 