#!/usr/bin/env node

/**
 * Quick verification script for RooCode HTTP API
 * Run this after installing the extension to verify the HTTP interface works
 */

const http = require("http")

const API_URL = "http://localhost:28473"

async function checkHealth() {
	console.log("🔍 Checking if RooCode HTTP API is running...")

	return new Promise((resolve) => {
		const req = http.request(
			{
				hostname: "localhost",
				port: 28473,
				path: "/health",
				method: "GET",
				timeout: 5000,
			},
			(res) => {
				let data = ""
				res.on("data", (chunk) => (data += chunk))
				res.on("end", () => {
					try {
						const response = JSON.parse(data)
						if (res.statusCode === 200) {
							console.log("✅ HTTP API is running!")
							console.log("📊 Response:", response)
							resolve(true)
						} else {
							console.log("❌ HTTP API returned error:", res.statusCode, response)
							resolve(false)
						}
					} catch (error) {
						console.log("❌ Invalid response from API:", error.message)
						resolve(false)
					}
				})
			},
		)

		req.on("error", (error) => {
			if (error.code === "ECONNREFUSED") {
				console.log("❌ HTTP API is not running. Make sure:")
				console.log("   1. RooCode extension is installed and active")
				console.log("   2. External interface is enabled in VSCode settings")
				console.log("   3. Extension is running on localhost:28473")
			} else {
				console.log("❌ Connection error:", error.message)
			}
			resolve(false)
		})

		req.on("timeout", () => {
			console.log("❌ Connection timeout. API might not be running.")
			req.destroy()
			resolve(false)
		})

		req.end()
	})
}

async function testMessage() {
	console.log("\n🔍 Testing message processing...")

	const testMessage = {
		type: "switchTab",
		tab: "chat",
	}

	return new Promise((resolve) => {
		const postData = JSON.stringify(testMessage)

		const req = http.request(
			{
				hostname: "localhost",
				port: 28473,
				path: "/api/message",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(postData),
				},
				timeout: 5000,
			},
			(res) => {
				let data = ""
				res.on("data", (chunk) => (data += chunk))
				res.on("end", () => {
					try {
						const response = JSON.parse(data)
						if (res.statusCode === 200) {
							console.log("✅ Message processing works!")
							console.log("📊 Response:", response)
							resolve(true)
						} else {
							console.log("❌ Message processing failed:", res.statusCode, response)
							resolve(false)
						}
					} catch (error) {
						console.log("❌ Invalid response:", error.message)
						resolve(false)
					}
				})
			},
		)

		req.on("error", (error) => {
			console.log("❌ Message test failed:", error.message)
			resolve(false)
		})

		req.on("timeout", () => {
			console.log("❌ Message test timeout.")
			req.destroy()
			resolve(false)
		})

		req.write(postData)
		req.end()
	})
}

async function main() {
	console.log("🚀 RooCode HTTP API Verification\n")

	const healthOk = await checkHealth()
	if (!healthOk) {
		console.log("\n❌ Health check failed. Please check the setup instructions below.")
		return
	}

	const messageOk = await testMessage()
	if (!messageOk) {
		console.log("\n❌ Message processing failed.")
		return
	}

	console.log("\n🎉 SUCCESS! RooCode HTTP API is working correctly!")
	console.log("\nYou can now use the HTTP interface to control RooCode programmatically.")
	console.log("\nExample usage:")
	console.log("curl -X POST http://localhost:28473/api/message \\")
	console.log('  -H "Content-Type: application/json" \\')
	console.log('  -d \'{"type":"newTask","text":"Create a Hello World program"}\'')
}

main().catch(console.error)
