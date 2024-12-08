import childProcess from "child_process";
import { z } from "zod";
import { Flow, JSONRPCResponse } from "flow-launcher-helper";
import logger from "./lib/logger";
import { TenorResult } from "./lib/types";

// The events are the custom events that you define in the flow.on() method.
const events = ["copy_result"] as const;
type Events = (typeof events)[number];

const flow = new Flow<Events>("assets/icon.png");

flow.on("query", async (params) => {
	const { api_key } = flow.settings;
	if (!api_key) {
		flow.showResult({
			title: "No API key set",
			subtitle: "Please set your API key in the settings",
		});
		return;
	}

	const [query] = z.array(z.string()).parse(params);

	const results = await getResults(query, api_key);
	logger.info(`Found ${results.length} results`);
	logger.info(JSON.stringify(results, null, 2));

	const resultsToSend: JSONRPCResponse<Events>[] = [];
	results.forEach((result, i) => {
		resultsToSend.push({
			title: result.title,
			subtitle: result.content_description,
			method: "copy_result" as const,
			params: [result.url],
			score: results.length - i,
		});
	});

	flow.showResult(...resultsToSend);
});

async function getResults(query: string, api_key: string): Promise<TenorResult[]> {
	logger.info(`Searching for ${query}`);
	logger.info(
		`url: https://tenor.googleapis.com/v2/search?q=${query}&key=${api_key}&client_key=flow_tenor_plugin&limit=10`
	);
	const response = await fetch(
		`https://tenor.googleapis.com/v2/search?q=${query}&key=${api_key}&client_key=flow_tenor_plugin&limit=10`
	);
	if (!response.ok) {
		throw new Error(`Failed to fetch results: ${response.statusText}`);
	}
	const data = await response.json();
	console.log(data);
	return data.results as TenorResult[];
}

const copyToClipboard = (text: string) => childProcess.spawn("clip").stdin?.end(text);
flow.on("copy_result", (params) => {
	const [text] = z.array(z.string()).parse(params);
	copyToClipboard(text);
});

flow.run();
