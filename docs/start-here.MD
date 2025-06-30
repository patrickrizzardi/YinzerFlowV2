# YinzerFlow Documentation

Welcome to the YinzerFlow documentation! This directory contains comprehensive documentation for the YinzerFlow framework, a lightweight, modular HTTP server framework for Node.js built with TypeScript.

## Contents

- [Routing System](./routing.md) - Comprehensive guide to the routing system, including route definition, parameters, and groups.
- [Request Lifecycle Hooks](./hooks.md) - In-depth documentation of the hooks system for intercepting and modifying requests.
- [Request Object](./request.md) - Complete guide to request properties: headers, body, query parameters, route parameters, and security features.
- [CORS Configuration](./cors.md) - Cross-Origin Resource Sharing setup and security considerations.
- [Error Handling](./error-handling.md) - Guide to handling errors at different levels in your application.

## Getting Started

If you're new to YinzerFlow, we recommend starting with the examples in the `/example` directory:

- [TypeScript Example](/example/typescript/README.md) - A type-safe server implementation in TypeScript

### Installation

You can install YinzerFlow using your preferred package manager:

```bash
# Using npm
npm install yinzerflow

# Using Yarn
yarn add yinzerflow

# Using Bun
bun add yinzerflow
```

### Quick Start

Here's a minimal example to get a server up and running:

```typescript
import { YinzerFlow } from 'yinzerflow';

// Create a new YinzerFlow instance
const app = new YinzerFlow({ port: 3000 });

// Add a simple route
app.get('/hello', () => {
  return { message: 'Hello, World!' };
});

// Start the server
await app.listen();
const { port, isListening } = app.getStatus();

if (isListening) console.log(`Server running on http://localhost:${port}`);
```

#### Graceful Shutdown

To implement graceful shutdown in your application:

```typescript
// Graceful shutdown example
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // This will:
  // 1. Stop accepting new connections
  // 2. Wait for existing connections to complete (up to the configured timeout)
  // 3. Close the server
  await app.close();
  
  console.log('Server shut down gracefully');
  process.exit(0);
});

app.listen();
console.log('Server running on http://localhost:3000');
```

The `close()` method handles the entire shutdown process, including:
- Stopping the server from accepting new connections
- Waiting for existing connections to finish (respecting the configured timeout)
- Closing all remaining connections and the server itself

This ensures that your application can shut down cleanly without abruptly terminating active connections.

## Contributing to Documentation

We welcome contributions to improve this documentation! If you find any issues or have suggestions for improvements, please feel free to submit a pull request.

When contributing to documentation:

1. Use clear, concise language
2. Include code examples where appropriate
3. Follow Markdown best practices
4. Test all links to ensure they work correctly

## Documentation Structure

The documentation is organized as follows:

```
docs/
├── start-here.MD            # This file - overview and getting started
├── routing.md               # Comprehensive guide to the routing system
├── hooks.md                 # In-depth documentation of the hooks system
├── request.md               # Request object: headers, body, query, params, and security
├── cors.md                  # CORS configuration and security considerations
├── content-types.md         # Working with different content types
├── error-handling.md        # Guide to handling errors at different levels in your application
```

Additional documentation files will be added as the framework evolves, including:

- Performance optimization guides
- Deployment strategies
- Troubleshooting and FAQs