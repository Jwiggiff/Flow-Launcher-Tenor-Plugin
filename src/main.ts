import childProcess from "child_process";
import { z } from "zod";
import { Flow, JSONRPCResponse } from "./lib/flow";

// The events are the custom events that you define in the flow.on() method.
const events = ["copy_result"] as const;
type Events = (typeof events)[number];

const flow = new Flow<Events>("assets/icon.png");

flow.on("query", (params) => {
	const { api_key } = flow.settings;
	if (!api_key) {
		flow.showResult({
			title: "No API key set",
			subtitle: "Please set your API key in the settings",
		});
		return;
	}

	const [query] = z.array(z.string()).parse(params);

	getResults(query, api_key).then((results) => {
		results.forEach((result, i) => {
			flow.showResult({
				title: result.title,
				subtitle: result.content_description,
				method: "copy_result",
				parameters: [result.title],
				score: results.length - i,
			});
		});
	});
});

async function getResults(query: string, api_key: string): Promise<TenorResult[]> {
	const response = await fetch(
		`https://tenor.googleapis.com/v2/search?q=${query}&key=${api_key}&client_key=flow_tenor_plugin&limit=10`
	);
	const data = await response.json();
	return data.results;
}

const copyToClipboard = (text: string) => childProcess.spawn("clip").stdin?.end(text);
flow.on("copy_result", (params) => {
	const [text] = z.array(z.string()).parse(params);
	copyToClipboard(text);
});

flow.run();
