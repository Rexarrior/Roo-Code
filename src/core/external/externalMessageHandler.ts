import { WebviewMessage } from "../../shared/WebviewMessage"
import { ClineProvider } from "../webview/ClineProvider"
import { MarketplaceManager } from "../../services/marketplace"
import { webviewMessageHandler } from "../webview/webviewMessageHandler"

/**
 * External message handler that processes WebviewMessage-like requests
 * from external clients (HTTP, WebSocket, etc.) using the same handlers
 * as the webview interface.
 */
export const externalMessageHandler = async (
	provider: ClineProvider,
	message: WebviewMessage,
	marketplaceManager?: MarketplaceManager,
): Promise<void> => {
	// Reuse the existing webview message handler
	// This ensures external clients get exactly the same functionality
	// as the webview interface
	await webviewMessageHandler(provider, message, marketplaceManager)
}

/**
 * Validates that a message object has the required structure of a WebviewMessage
 */
export const validateWebviewMessage = (message: any): message is WebviewMessage => {
	return (
		typeof message === "object" && message !== null && typeof message.type === "string" && message.type.length > 0
	)
}

/**
 * Creates a standardized response for external API calls
 */
export const createApiResponse = (success: boolean, data?: any, error?: string) => {
	return {
		success,
		data,
		error,
		timestamp: new Date().toISOString(),
	}
}
