# RooCode HTTP Interface

This document explains how to use the HTTP interface added to the RooCode extension, which allows external clients to send WebviewMessage-like requests and process them with the same handlers as the webview interface.

## Features

- **Full WebviewMessage Support**: All 200+ message types from the webview interface are supported
- **Same Handlers**: Uses the exact same message processing logic as the webview
- **Type Safety**: Full TypeScript support with existing Zod schemas
- **Authentication**: Optional API key authentication
- **CORS Support**: Built-in CORS headers for web clients
- **Health Check**: Built-in health endpoint for monitoring

## Setup

### 1. Enable the HTTP Interface

Open VSCode settings and configure the following:

```json
{
	"roo-cline.externalInterface.enabled": true,
	"roo-cline.externalInterface.port": 28473,
	"roo-cline.externalInterface.host": "localhost",
	"roo-cline.externalInterface.apiKey": "" // Optional: leave empty to disable auth
}
```

### 2. Restart VSCode

After changing the settings, restart VSCode or reload the extension for the changes to take effect.

### 3. Verify the Interface is Running

Check the VSCode output panel for "RooCode" channel. You should see:

```
[API] HTTP server started on http://localhost:28473
```

## API Endpoints

### Health Check

```
GET http://localhost:28473/health
```

Returns the status of the extension and HTTP interface.

**Response:**

```json
{
	"status": "ok",
	"timestamp": "2024-01-01T12:00:00.000Z",
	"extension": "roo-code"
}
```

### Send Message

```
POST http://localhost:28473/api/message
Content-Type: application/json
Authorization: Bearer <api-key>  // Optional
```

Sends a WebviewMessage-like request to be processed by the extension.

**Request Body:**

```json
{
	"type": "newTask",
	"text": "Create a Hello World program",
	"images": []
}
```

**Response:**

```json
{
	"success": true,
	"message": "Message processed successfully",
	"timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Message Types

The HTTP interface supports all WebviewMessage types. Here are some common examples:

### Task Management

```json
// Create a new task
{
  "type": "newTask",
  "text": "Create a React component",
  "images": []
}

// Cancel current task
{
  "type": "cancelTask"
}

// Clear current task
{
  "type": "clearTask"
}
```

### Configuration

```json
// Update custom instructions
{
  "type": "customInstructions",
  "text": "Always write clean, well-commented code"
}

// Update allowed commands
{
  "type": "allowedCommands",
  "commands": ["git log", "git diff", "npm install"]
}

// Set always allow read-only
{
  "type": "alwaysAllowReadOnly",
  "bool": true
}
```

### UI Control

```json
// Switch tabs
{
  "type": "switchTab",
  "tab": "settings"
}

// Play sounds
{
  "type": "playSound",
  "audioType": "notification"
}

// Open files
{
  "type": "openFile",
  "text": "/path/to/file.js"
}
```

### API Configuration

```json
// Save API configuration
{
  "type": "saveApiConfiguration",
  "text": "my-config",
  "apiConfiguration": {
    "apiProvider": "anthropic",
    "anthropicApiKey": "your-key",
    "apiModelId": "claude-3-sonnet-20240229"
  }
}

// Load API configuration
{
  "type": "loadApiConfiguration",
  "text": "my-config"
}
```

## Example Usage

### JavaScript/Node.js

```javascript
const http = require("http")

async function sendMessage(message) {
	const postData = JSON.stringify(message)

	const options = {
		hostname: "localhost",
		port: 28473,
		path: "/api/message",
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Content-Length": Buffer.byteLength(postData),
		},
	}

	return new Promise((resolve, reject) => {
		const req = http.request(options, (res) => {
			let data = ""
			res.on("data", (chunk) => (data += chunk))
			res.on("end", () => resolve(JSON.parse(data)))
		})

		req.on("error", reject)
		req.write(postData)
		req.end()
	})
}

// Create a new task
await sendMessage({
	type: "newTask",
	text: "Create a Python script that reads a CSV file",
})
```

### Python

```python
import requests
import json

def send_message(message):
    url = 'http://localhost:28473/api/message'
    response = requests.post(url, json=message)
    return response.json()

# Create a new task
result = send_message({
    'type': 'newTask',
    'text': 'Create a Python script that reads a CSV file'
})
print(result)
```

### cURL

```bash
# Health check
curl http://localhost:28473/health

# Create a new task
curl -X POST http://localhost:28473/api/message \
  -H "Content-Type: application/json" \
  -d '{"type":"newTask","text":"Create a Hello World program"}'

# Switch to settings tab
curl -X POST http://localhost:28473/api/message \
  -H "Content-Type: application/json" \
  -d '{"type":"switchTab","tab":"settings"}'
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Message processed successfully
- `400 Bad Request`: Invalid message format or processing error
- `401 Unauthorized`: Invalid or missing API key
- `404 Not Found`: Invalid endpoint
- `405 Method Not Allowed`: Wrong HTTP method
- `500 Internal Server Error`: Server error

Error responses include details:

```json
{
	"error": "Invalid message: missing type",
	"statusCode": 400,
	"timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Security Considerations

1. **API Key**: Configure an API key for authentication if needed
2. **Network Binding**: By default, the server binds to localhost only
3. **CORS**: CORS headers are set to allow web clients
4. **Input Validation**: All messages are validated using existing Zod schemas

## Troubleshooting

### Interface Not Starting

- Check VSCode settings are correct
- Ensure the port is not already in use
- Check the VSCode output panel for error messages

### Connection Refused

- Verify the extension is running and the interface is enabled
- Check the port number in settings
- Ensure no firewall is blocking the connection

### Authentication Errors

- Verify the API key is correct
- Check that the Authorization header is properly formatted

### Message Processing Errors

- Ensure the message format matches WebviewMessage interface
- Check that required fields are present
- Verify the message type is valid

## Complete Example

See `http-client-example.js` for a complete working example that demonstrates:

- Health checking
- Creating tasks
- Switching tabs
- Playing sounds
- Updating configuration
- Error handling
