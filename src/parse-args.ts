const NODE_AND_SCRIPT_ARG_COUNT = 2;

export function getPositionalArgs(argv: readonly string[]): string[] {
	return argv.slice(NODE_AND_SCRIPT_ARG_COUNT);
}
