import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"
import { McpTool } from "@roo/shared/mcp"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { vscode } from "@src/utils/vscode"

type McpToolRowProps = {
	tool: McpTool
	serverName?: string
	serverSource?: "global" | "project"
	alwaysAllowMcp?: boolean
}

const McpToolRow = ({ tool, serverName, serverSource, alwaysAllowMcp }: McpToolRowProps) => {
	const { t } = useAppTranslation()
	const handleAlwaysAllowChange = () => {
		if (!serverName) return
		vscode.postMessage({
			type: "toggleToolAlwaysAllow",
			serverName,
			source: serverSource || "global",
			toolName: tool.name,
			alwaysAllow: !tool.alwaysAllow,
		})
	}

	const handleEnabledForPromptChange = () => {
		if (!serverName) return
		vscode.postMessage({
			type: "toggleToolEnabledForPrompt",
			serverName,
			source: serverSource || "global",
			toolName: tool.name,
			isEnabled: !tool.enabledForPrompt,
		})
	}

	return (
		<div key={tool.name} className="py-[3px]">
			<div
				data-testid="tool-row-container"
				className="flex items-center justify-between"
				onClick={(e) => e.stopPropagation()}>
				<div className="flex items-center">
					<span className="codicon codicon-symbol-method mr-[6px]"></span>
					<span className="font-medium">{tool.name}</span>
				</div>
				<div className="flex items-center space-x-4">
					{" "}
					{/* Wrapper for checkboxes */}
					{serverName /* Assuming this checkbox should always be visible if serverName is present */ && (
						<div
							role="switch"
							aria-checked={tool.enabledForPrompt}
							className={`flex items-center cursor-pointer rounded-full w-8 h-4 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
								// Added flex items-center, changed w-10 h-5 to w-8 h-4
								tool.enabledForPrompt ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
							}`}
							onClick={handleEnabledForPromptChange}
							data-tool-prompt-toggle={tool.name}
							title={t("mcp:tool.togglePromptInclusion")}>
							<span
								className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
									// Changed h-4 w-4 to h-3 w-3
									tool.enabledForPrompt ? "translate-x-4" : "translate-x-1" // Changed translate-x-5 to translate-x-4
								}`}
							/>
						</div>
					)}
					{serverName && alwaysAllowMcp && (
						<VSCodeCheckbox
							checked={tool.alwaysAllow}
							onChange={handleAlwaysAllowChange}
							data-tool={tool.name}>
							{t("mcp:tool.alwaysAllow")}
						</VSCodeCheckbox>
					)}
				</div>
			</div>
			{tool.description && <div className="ml-0 mt-1 opacity-80 text-xs">{tool.description}</div>}
			{tool.inputSchema &&
				"properties" in tool.inputSchema &&
				Object.keys(tool.inputSchema.properties as Record<string, any>).length > 0 && (
					<div className="mt-2 text-xs rounded-[3px] p-2 border border-vscode-descriptionForeground-transparent-30">
						<div className="mb-1 opacity-80 text-[11px] uppercase">{t("mcp:tool.parameters")}</div>
						{Object.entries(tool.inputSchema.properties as Record<string, any>).map(
							([paramName, schema]) => {
								const isRequired =
									tool.inputSchema &&
									"required" in tool.inputSchema &&
									Array.isArray(tool.inputSchema.required) &&
									tool.inputSchema.required.includes(paramName)

								return (
									<div key={paramName} className="flex items-baseline mt-1">
										<code className="text-vscode-textPreformat-foreground mr-2">
											{paramName}
											{isRequired && <span className="text-vscode-errorForeground">*</span>}
										</code>
										<span className="opacity-80 break-words">
											{schema.description || t("mcp:tool.noDescription")}
										</span>
									</div>
								)
							},
						)}
					</div>
				)}
		</div>
	)
}
export default McpToolRow
