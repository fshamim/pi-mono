export type ProviderKeyAction = "save" | "remove" | "none";

/** What the row's one button does. `none` = disabled, label Save. Issue 072 (agentic-webext). */
export function providerKeyAction(hasKey: boolean, keyInput: string, inputChanged: boolean): ProviderKeyAction {
	if (keyInput) return hasKey && !inputChanged ? "none" : "save";
	return hasKey && inputChanged ? "remove" : "none";
}
