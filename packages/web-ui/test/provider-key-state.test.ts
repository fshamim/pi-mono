import assert from "node:assert/strict";
import test from "node:test";
import { type ProviderKeyAction, providerKeyAction } from "../src/components/provider-key-state.ts";

test("the provider key row's one button: save a key, remove a stored one, otherwise disabled", () => {
	// [hasKey, keyInput, inputChanged] -> action. "k" stands for any non-empty field.
	const table: [boolean, string, boolean, ProviderKeyAction][] = [
		[false, "", false, "none"], // fresh row without a key; also right after Remove
		[false, "", true, "none"], // typed then cleared with no stored key — nothing to remove
		[false, "k", false, "save"], // UNREACHABLE: a non-empty field implies an input event
		[false, "k", true, "save"], // first key typed (also after a failed test)
		[true, "", false, "none"], // fresh row with a stored key
		[true, "", true, "remove"], // stored key, field edited to empty — issue 072
		[true, "k", false, "none"], // just saved, untouched since
		[true, "k", true, "save"], // replacing the key
	];

	for (const [hasKey, keyInput, inputChanged, expected] of table) {
		assert.equal(
			providerKeyAction(hasKey, keyInput, inputChanged),
			expected,
			`providerKeyAction(${hasKey}, ${JSON.stringify(keyInput)}, ${inputChanged})`,
		);
	}
});
