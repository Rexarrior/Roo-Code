import * as http from "http"
import * as url from "url"
import { WebviewMessage } from "../../shared/WebviewMessage"
import { ClineProvider } from "../webview/ClineProvider"
import { MarketplaceManager } from "../../services/marketplace"
import { webviewMessageHandler } from "../webview/webviewMessageHandler"

export interface HttpServerConfig {
	port: number
	host: string
	enabled: boolean
	apiKey?: string
}

export class HttpServer {
	private server?: http.Server
	private readonly config: HttpServerConfig
	private readonly provider: ClineProvider
	private readonly marketplaceManager?: MarketplaceManager

	constructor(config: HttpServerConfig, provider: ClineProvider, marketplaceManager?: MarketplaceManager) {
		this.config = config
		this.provider = provider
		this.marketplaceManager = marketplaceManager
	}

	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.config.enabled) {
				console.log("[HttpServer] HTTP interface disabled")
				resolve()
				return
			}

			this.server = http.createServer((req, res) => {
				this.handleRequest(req, res)
			})

			this.server.listen(this.config.port, this.config.host, () => {
				console.log(`[HttpServer] HTTP interface started on http://${this.config.host}:${this.config.port}`)
				resolve()
			})

			this.server.on("error", (error) => {
				console.error("[HttpServer] Server error:", error)
				reject(error)
			})
		})
	}

	public stop(): Promise<void> {
		return new Promise((resolve) => {
			if (!this.server) {
				resolve()
				return
			}

			this.server.close(() => {
				console.log("[HttpServer] HTTP interface stopped")
				resolve()
			})
		})
	}

	private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
		// Set CORS headers
		res.setHeader("Access-Control-Allow-Origin", "*")
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if (req.method === "OPTIONS") {
			res.writeHead(200)
			res.end()
			return
		}

		const parsedUrl = url.parse(req.url || "", true)
		const pathname = parsedUrl.pathname

		try {
			switch (pathname) {
				case "/health":
					await this.handleHealth(req, res)
					break
				case "/api/message":
					await this.handleMessage(req, res)
					break
				default:
					this.sendError(res, 404, "Not Found")
			}
		} catch (error) {
			console.error("[HttpServer] Request handling error:", error)
			this.sendError(res, 500, "Internal Server Error")
		}
	}

	private async handleHealth(req: http.IncomingMessage, res: http.ServerResponse) {
		if (req.method !== "GET") {
			this.sendError(res, 405, "Method Not Allowed")
			return
		}

		const response = {
			status: "ok",
			timestamp: new Date().toISOString(),
			extension: "roo-code",
		}

		this.sendJson(res, 200, response)
	}

	private async handleMessage(req: http.IncomingMessage, res: http.ServerResponse) {
		if (req.method !== "POST") {
			this.sendError(res, 405, "Method Not Allowed")
			return
		}

		// Check API key if configured
		if (this.config.apiKey) {
			const authHeader = req.headers.authorization
			if (!authHeader || authHeader !== `Bearer ${this.config.apiKey}`) {
				this.sendError(res, 401, "Unauthorized")
				return
			}
		}

		try {
			const body = await this.getRequestBody(req)
			const message: WebviewMessage = JSON.parse(body)

			// Validate that it's a valid WebviewMessage
			if (!message.type) {
				this.sendError(res, 400, "Invalid message: missing type")
				return
			}

			// Process the message using the same handler as webview messages
			await webviewMessageHandler(this.provider, message, this.marketplaceManager)

			// Send success response
			this.sendJson(res, 200, {
				success: true,
				message: "Message processed successfully",
				timestamp: new Date().toISOString(),
			})
		} catch (error) {
			console.error("[HttpServer] Message processing error:", error)
			this.sendError(
				res,
				400,
				`Message processing failed: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}

	private async getRequestBody(req: http.IncomingMessage): Promise<string> {
		return new Promise((resolve, reject) => {
			let body = ""
			req.on("data", (chunk) => {
				body += chunk.toString()
			})
			req.on("end", () => {
				resolve(body)
			})
			req.on("error", (error) => {
				reject(error)
			})
		})
	}

	private sendJson(res: http.ServerResponse, statusCode: number, data: any) {
		res.writeHead(statusCode, { "Content-Type": "application/json" })
		res.end(JSON.stringify(data))
	}

	private sendError(res: http.ServerResponse, statusCode: number, message: string) {
		this.sendJson(res, statusCode, {
			error: message,
			statusCode,
			timestamp: new Date().toISOString(),
		})
	}

	public get isRunning(): boolean {
		return this.server?.listening || false
	}

	public get address(): string | undefined {
		const addr = this.server?.address()
		if (typeof addr === "string") {
			return addr
		} else if (addr && "port" in addr) {
			return `http://${this.config.host}:${addr.port}`
		}
		return undefined
	}
}
