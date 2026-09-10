import type { Context } from "@earendil-works/pi-ai";
import { complete, getModel } from "@earendil-works/pi-ai/compat";
import { builtinProviders } from "@earendil-works/pi-ai/providers/all";
import { i18n } from "@mariozechner/mini-lit";
import { Badge } from "@mariozechner/mini-lit/dist/Badge.js";
import { Button } from "@mariozechner/mini-lit/dist/Button.js";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { getAppStorage } from "../storage/app-storage.ts";
import { applyProxyIfNeeded } from "../utils/proxy-utils.ts";
import { Input } from "./Input.ts";
import { providerKeyAction } from "./provider-key-state.ts";

// Test models for each provider
const TEST_MODELS: Record<string, string> = {
	anthropic: "claude-haiku-4-5",
	openai: "gpt-4o-mini",
	google: "gemini-2.5-flash",
	groq: "openai/gpt-oss-20b",
	openrouter: "z-ai/glm-4.6",
	"vercel-ai-gateway": "anthropic/claude-opus-4.5",
	cerebras: "gpt-oss-120b",
	xai: "grok-4-fast-non-reasoning",
	zai: "glm-4.5-air",
};

let providerNames: Map<string, string> | undefined;
/** pi-ai's display name for a provider id ("OpenCode Go"), the id itself when unknown. Built on first use. */
function providerName(id: string): string {
	providerNames ??= new Map(builtinProviders().map((p) => [p.id, p.name]));
	return providerNames.get(id) ?? id;
}

@customElement("provider-key-input")
export class ProviderKeyInput extends LitElement {
	@property() provider = "";
	@state() private keyInput = "";
	@state() private testing = false;
	@state() private failed = false;
	@state() private hasKey = false;
	@state() private inputChanged = false;

	protected createRenderRoot() {
		return this;
	}

	override async connectedCallback() {
		super.connectedCallback();
		await this.checkKeyStatus();
	}

	private async checkKeyStatus() {
		try {
			const key = await getAppStorage().providerKeys.get(this.provider);
			this.hasKey = !!key;
		} catch (error) {
			console.error("Failed to check key status:", error);
		}
	}

	private async testApiKey(provider: string, apiKey: string): Promise<boolean> {
		try {
			const modelId = TEST_MODELS[provider];
			// Returning true here for Ollama and friends. Can' know which model to use for testing
			if (!modelId) return true;

			let model = getModel(provider as any, modelId);
			if (!model) return false;

			// Get proxy URL from settings (if available)
			const proxyEnabled = await getAppStorage().settings.get<boolean>("proxy.enabled");
			const proxyUrl = await getAppStorage().settings.get<string>("proxy.url");

			// Apply proxy only if this provider/key combination requires it
			model = applyProxyIfNeeded(model, apiKey, proxyEnabled ? proxyUrl || undefined : undefined);

			const context: Context = {
				messages: [{ role: "user", content: "Reply with: ok", timestamp: Date.now() }],
			};

			const result = await complete(model, context, {
				apiKey,
				maxTokens: 200,
			} as any);

			return result.stopReason === "stop";
		} catch (error) {
			console.error(`API key test failed for ${provider}:`, error);
			return false;
		}
	}

	private showFailed() {
		this.failed = true;
		setTimeout(() => {
			this.failed = false;
			this.requestUpdate();
		}, 5000);
	}

	private async saveKey() {
		if (!this.keyInput) return;

		this.testing = true;
		this.failed = false;

		const success = await this.testApiKey(this.provider, this.keyInput);

		this.testing = false;

		if (success) {
			try {
				await getAppStorage().providerKeys.set(this.provider, this.keyInput);
				this.hasKey = true;
				this.inputChanged = false;
				this.requestUpdate();
			} catch (error) {
				console.error("Failed to save API key:", error);
				this.showFailed();
			}
		} else {
			this.showFailed();
		}
	}

	private async removeKey() {
		try {
			await getAppStorage().providerKeys.delete(this.provider);
			this.hasKey = false;
			this.inputChanged = false;
		} catch (error) {
			console.error("Failed to remove API key:", error);
			this.showFailed();
		}
	}

	render() {
		const action = providerKeyAction(this.hasKey, this.keyInput, this.inputChanged);
		return html`
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium capitalize text-foreground">${providerName(this.provider)}</span>
					${
						this.testing
							? Badge({ children: i18n("Testing..."), variant: "secondary" })
							: this.hasKey
								? html`<span class="text-green-600 dark:text-green-400">✓</span>`
								: ""
					}
					${this.failed ? Badge({ children: i18n("✗ Invalid"), variant: "destructive" }) : ""}
				</div>
				<div class="flex items-center gap-2">
					${Input({
						type: "password",
						placeholder: this.hasKey ? "••••••••••••" : i18n("Enter API key"),
						value: this.keyInput,
						onInput: (e: Event) => {
							this.keyInput = (e.target as HTMLInputElement).value;
							this.inputChanged = true;
							this.requestUpdate();
						},
						// A stored key is shown as a placeholder over an EMPTY field, so Backspace or Delete on
						// it fires no input event; count that keystroke as "edited to empty" so Remove lights.
						onKeyDown: (e: KeyboardEvent) => {
							if ((e.key === "Backspace" || e.key === "Delete") && this.hasKey && !this.keyInput)
								this.inputChanged = true;
						},
						className: "flex-1",
					})}
					${Button({
						onClick: () => (action === "remove" ? this.removeKey() : this.saveKey()),
						variant: "default",
						size: "sm",
						disabled: action === "none" || this.testing,
						children: i18n(action === "remove" ? "Remove" : "Save"),
					})}
				</div>
			</div>
		`;
	}
}
