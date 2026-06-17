#!/usr/bin/env node

import { getPositionalArgs } from "./parse-args.js";

function main(): void {
	const args = getPositionalArgs(process.argv);
	console.log(args);
}

main();
