import type { ImageContent, TextContent, ToolResultMessage } from "@mariozechner/pi-ai";
import type { TemplateResult } from "lit";

export interface ToolRenderResult {
	content: TemplateResult;
	isCustom: boolean; // true = no card wrapper, false = wrap in card
}

export interface ToolPartialResult<TDetails = any> {
	content: (TextContent | ImageContent)[];
	details: TDetails;
}

export interface ToolRenderContext<TDetails = any> {
	partialResult?: ToolPartialResult<TDetails>;
}

export interface ToolRenderer<TParams = any, TDetails = any> {
	render(
		params: TParams | undefined,
		result: ToolResultMessage<TDetails> | undefined,
		isStreaming?: boolean,
		context?: ToolRenderContext<TDetails>,
	): ToolRenderResult;
}
