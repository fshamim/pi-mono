// GhostClaw overlay: Agent.setSystemPrompt / replaceMessages / appendMessage / setModel
// keep working now that the prompt and tools live in the transcript's system messages.
import { getCurrentSystemPrompt, getCurrentTools, getModel, type UserMessage } from "@earendil-works/pi-ai/compat";
import { Type } from "typebox";
import { describe, expect, it } from "vitest";
import { Agent, type AgentTool, type StreamFn } from "../src/index.ts";

const unusedStreamFunction: StreamFn = () => {
	throw new Error("stream should not be called");
};

const user = (text: string): UserMessage => ({ role: "user", content: text, timestamp: 1 });

const tool: AgentTool = {
	name: "noop",
	label: "noop",
	description: "does nothing",
	parameters: Type.Object({}),
	execute: async () => ({ content: [], details: undefined }),
};

describe("GhostClaw Agent state helpers", () => {
	it("setSystemPrompt rewrites the leading system message and keeps its tools", () => {
		const agent = new Agent({ streamFn: unusedStreamFunction, initialState: { systemPrompt: "old", tools: [tool] } });
		agent.appendMessage(user("hi"));
		agent.setSystemPrompt("new");
		expect(agent.state.systemPrompt).toBe("new");
		expect(agent.state.messages.filter((m) => m.role === "system")).toHaveLength(1);
		expect(getCurrentTools(agent.state.messages).map((t) => t.name)).toEqual(["noop"]);
		expect(agent.state.messages[1]).toMatchObject({ role: "user" });
	});

	it("setSystemPrompt inserts a leading system message when there is none", () => {
		const agent = new Agent({ streamFn: unusedStreamFunction });
		agent.appendMessage(user("hi"));
		agent.setSystemPrompt("persona");
		expect(agent.state.messages[0]).toMatchObject({ role: "system", content: "persona" });
		expect(getCurrentSystemPrompt(agent.state.messages)).toBe("persona");
	});

	it("replaceMessages keeps the current prompt and tools for a legacy transcript without system messages", () => {
		const agent = new Agent({
			streamFn: unusedStreamFunction,
			initialState: { systemPrompt: "keep", tools: [tool] },
		});
		agent.replaceMessages([user("restored")]);
		expect(agent.state.systemPrompt).toBe("keep");
		expect(getCurrentTools(agent.state.messages).map((t) => t.name)).toEqual(["noop"]);
		expect(agent.state.messages.at(-1)).toMatchObject({ role: "user", content: "restored" });
	});

	it("replaceMessages takes a transcript that brings its own system message as-is", () => {
		const agent = new Agent({ streamFn: unusedStreamFunction, initialState: { systemPrompt: "current" } });
		agent.replaceMessages([{ role: "system", content: "saved", timestamp: 0 }, user("x")]);
		expect(agent.state.systemPrompt).toBe("saved");
		expect(agent.state.messages).toHaveLength(2);
	});

	it("setModel switches the model", () => {
		const agent = new Agent({ streamFn: unusedStreamFunction });
		const model = getModel("openai", "gpt-4o-mini");
		agent.setModel(model);
		expect(agent.state.model).toBe(model);
	});
});
