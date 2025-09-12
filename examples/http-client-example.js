#!/usr/bin/env node

/**
 * Example HTTP client for RooCode extension
 *
 * This example demonstrates how to send WebviewMessage-like requests
 * to the RooCode extension via HTTP interface.
 *
 * Prerequisites:
 * 1. Enable the external interface in VSCode settings:
 *    - Set "roo-cline.externalInterface.enabled" to true
 *    - Set "roo-cline.externalInterface.port" to 8080 (or your preferred port)
 * 2. Restart VSCode or reload the extension
 */

const http = require("http")

const API_BASE_URL = "http://localhost:28473"
const API_KEY = "" // Set this if you configured an API key

class RooCodeHttpClient {
	constructor(baseUrl = API_BASE_URL, apiKey = API_KEY) {
		this.baseUrl = baseUrl
		this.apiKey = apiKey
	}

	async sendMessage(message) {
		return new Promise((resolve, reject) => {
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

			// Add API key header if configured
			if (this.apiKey) {
				options.headers["Authorization"] = `Bearer ${this.apiKey}`
			}

			const req = http.request(options, (res) => {
				let data = ""

				res.on("data", (chunk) => {
					data += chunk
				})

				res.on("end", () => {
					try {
						const response = JSON.parse(data)
						if (res.statusCode === 200) {
							resolve(response)
						} else {
							reject(new Error(`HTTP ${res.statusCode}: ${response.error || data}`))
						}
					} catch (error) {
						reject(new Error(`Failed to parse response: ${error.message}`))
					}
				})
			})

			req.on("error", (error) => {
				reject(new Error(`Request failed: ${error.message}`))
			})

			req.write(postData)
			req.end()
		})
	}

	async checkHealth() {
		return new Promise((resolve, reject) => {
			const options = {
				hostname: "localhost",
				port: 28473,
				path: "/health",
				method: "GET",
			}

			const req = http.request(options, (res) => {
				let data = ""

				res.on("data", (chunk) => {
					data += chunk
				})

				res.on("end", () => {
					try {
						const response = JSON.parse(data)
						resolve(response)
					} catch (error) {
						reject(new Error(`Failed to parse health response: ${error.message}`))
					}
				})
			})

			req.on("error", (error) => {
				reject(new Error(`Health check failed: ${error.message}`))
			})

			req.end()
		})
	}

	// Convenience methods for common operations
	async createTask(text, images = []) {
		return this.sendMessage({
			type: "newTask",
			text: text,
			images: images,
		})
	}

	async cancelTask() {
		return this.sendMessage({
			type: "cancelTask",
		})
	}

	async clearTask() {
		return this.sendMessage({
			type: "clearTask",
		})
	}

	async updateCustomInstructions(instructions) {
		return this.sendMessage({
			type: "customInstructions",
			text: instructions,
		})
	}

	async switchTab(tab) {
		return this.sendMessage({
			type: "switchTab",
			tab: tab,
		})
	}

	async playSound(audioType) {
		return this.sendMessage({
			type: "playSound",
			audioType: audioType,
		})
	}
}

// Example usage
async function main() {
	const client = new RooCodeHttpClient()

	try {
		console.log("Checking RooCode extension health...")
		const health = await client.checkHealth()
		console.log("Health check:", health)

		console.log("\nCreating a new task...")
		const taskResult = await client.createTask("Create a simple Hello World program in Python")
		console.log("Task created:", taskResult)

		console.log("\nSwitching to chat tab...")
		await client.switchTab("chat")
		console.log("Switched to chat tab")

		console.log("\nPlaying notification sound...")
		await client.playSound("notification")
		console.log("Sound played")

		console.log("\nUpdating custom instructions...")
		await client.updateCustomInstructions("Always write clean, well-commented code")
		console.log("Custom instructions updated")
	} catch (error) {
		console.error("Error:", error.message)
		console.log("\nMake sure:")
		console.log("1. RooCode extension is installed and active")
		console.log("2. External interface is enabled in VSCode settings")
		console.log("3. The extension is running on localhost:28473")
	}
}

// Run the example if this file is executed directly
if (require.main === module) {
	main()
}

module.exports = RooCodeHttpClient
