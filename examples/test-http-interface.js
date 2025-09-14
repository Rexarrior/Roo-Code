#!/usr/bin/env node

/**
 * Test script for RooCode HTTP interface
 *
 * This script tests the basic functionality of the HTTP interface
 * to ensure it's working correctly.
 */

const http = require("http")
const API_PORT = 28473

async function testHealthCheck() {
	console.log("🔍 Testing health check...")

	return new Promise((resolve, reject) => {
		const req = http.request(
			{
				hostname: "localhost",
				port: API_PORT,
				path: "/health",
				method: "GET",
			},
			(res) => {
				let data = ""
				res.on("data", (chunk) => (data += chunk))
				res.on("end", () => {
					try {
						const response = JSON.parse(data)
						if (res.statusCode === 200) {
							console.log("✅ Health check passed:", response)
							resolve(true)
						} else {
							console.log("❌ Health check failed:", response)
							resolve(false)
						}
					} catch (error) {
						console.log("❌ Health check failed - invalid JSON:", error.message)
						resolve(false)
					}
				})
			},
		)

		req.on("error", (error) => {
			console.log("❌ Health check failed - connection error:", error.message)
			resolve(false)
		})

		req.end()
	})
}

async function testMessage(message, description) {
	console.log(`🔍 Testing ${description}...`)

	return new Promise((resolve, reject) => {
		const postData = JSON.stringify(message)

		const req = http.request(
			{
				hostname: "localhost",
				port: API_PORT,
				path: "/api/message",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(postData),
				},
			},
			(res) => {
				let data = ""
				res.on("data", (chunk) => (data += chunk))
				res.on("end", () => {
					try {
						const response = JSON.parse(data)
						if (res.statusCode === 200) {
							console.log(`✅ ${description} passed:`, response)
							resolve(true)
						} else {
							console.log(`❌ ${description} failed:`, response)
							resolve(false)
						}
					} catch (error) {
						console.log(`❌ ${description} failed - invalid JSON:`, error.message)
						resolve(false)
					}
				})
			},
		)

		req.on("error", (error) => {
			console.log(`❌ ${description} failed - connection error:`, error.message)
			resolve(false)
		})

		req.write(postData)
		req.end()
	})
}

async function runTests() {
	console.log("🚀 Starting RooCode HTTP Interface Tests\n")

	const tests = [
		() => testHealthCheck(),
		() => testMessage({ type: "switchTab", tab: "chat" }, "Switch to chat tab"),
		() => testMessage({ type: "customInstructions", text: "Test instructions" }, "Update custom instructions"),
		() => testMessage({ type: "playSound", audioType: "notification" }, "Play notification sound"),
		() => testMessage({ type: "newTask", text: "Test task creation" }, "Create new task"),
	]

	let passed = 0
	let total = tests.length

	for (const test of tests) {
		const result = await test()
		if (result) passed++
		console.log("") // Empty line for readability
	}

	console.log(`📊 Test Results: ${passed}/${total} tests passed`)

	if (passed === total) {
		console.log("🎉 All tests passed! The HTTP interface is working correctly.")
	} else {
		console.log("⚠️  Some tests failed. Check the configuration and try again.")
		console.log("\nTroubleshooting:")
		console.log("1. Make sure RooCode extension is installed and active")
		console.log("2. Enable external interface in VSCode settings:")
		console.log('   - Set "roo-cline.externalInterface.enabled" to true')
		console.log(`   - Set "roo-cline.externalInterface.port" to ${API_PORT}`)
		console.log("3. Restart VSCode or reload the extension")
		console.log('4. Check the VSCode output panel for "RooCode" channel')
	}
}

// Run tests if this file is executed directly
if (require.main === module) {
	runTests().catch(console.error)
}

module.exports = { testHealthCheck, testMessage, runTests }
