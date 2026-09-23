import type { ImageContent, TextContent, ToolResultMessage } from "@earendil-works/pi-ai";
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

/**
 * A tool result as a renderer sees it. pi-ai's `ToolResultMessage<T>` collapses to `never`
 * for details that are not JSON-typed (`any`, `unknown` fields, interfaces), so renderers
 * type the details themselves.
 */
export type ToolRendererResult<TDetails = any> = Omit<ToolResultMessage, "details"> & { details?: TDetails };

export interface ToolRenderer<TParams = any, TDetails = any> {
	render(
		params: TParams | undefined,
		result: ToolRendererResult<TDetails> | undefined,
		isStreaming?: boolean,
		context?: ToolRenderContext<TDetails>,
	): ToolRenderResult;
}
