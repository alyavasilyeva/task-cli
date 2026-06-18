import { describe, expect, it } from "vitest";
import { getPositionalArgs } from "./parse-args.js";

describe("getPositionalArgs", () => {
	it("returns an empty array when argv contains only node and script paths", () => {
		const argv = ["/usr/bin/node", "/path/to/dist/index.js"];

		expect(getPositionalArgs(argv)).toEqual([]);
	});

	it("returns positional arguments after node and script paths", () => {
		const argv = [
			"/usr/bin/node",
			"/path/to/dist/index.js",
			"add",
			"Buy groceries",
		];

		expect(getPositionalArgs(argv)).toEqual(["add", "Buy groceries"]);
	});
});
