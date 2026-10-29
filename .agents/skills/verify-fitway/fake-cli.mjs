// Runs cli.mjs's main in a child process with fake doctor, browser, previews
// and capture, as compare-speed.test.mjs does, so commands need no Chromium.
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { writeConcept } from "./concept-fixture.mjs";

// One page whose every answer is fixed: open, ready, one desktop frame.
const fakeBrowser = `
const none=async()=>{};
const evaluate=async(fn)=>{const body=fn.toString();
 if(body.includes("coarse"))return {language:"en",direction:"ltr",coarse:false,touchPoints:0};
 if(body.includes("document.scrollingElement"))return {scrollX:0,scrollY:0,viewportWidth:1440,viewportHeight:900,documentHeight:900};
 return {}};
const locator=()=>({first(){return this},count:async()=>1,waitFor:none,ariaSnapshot:async()=>"main"});
const frame=async()=>Buffer.from("frame");
export const newContext=async()=>({errors:[],emulation:{},context:{route:none,close:none},
 page:{setDefaultTimeout(){},addInitScript:none,waitForFunction:none,screenshot:frame,route:none,evaluate,locator}});
export const launchChromium=async()=>({close:none});
export const withParams=(url)=>url;
export const preparePage=async()=>({ready:true});
export {frame as screenshot,none as twoFrames,none as injectProbe,none as renderSheet};
`;

function harnessSource(tools) {
	const skill = (file) =>
		JSON.stringify(pathToFileURL(resolve(import.meta.dirname, file)).href);
	return `import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {main} from ${skill("cli.mjs")};
import {generateMap} from ${skill("map.mjs")};
const tools=${JSON.stringify(tools)};
const doctor=async(options)=>({concept:options.concept,tools,loaded:{pw:{}},
 map:generateMap(options.concept,options.recipes)});
const services={
 drive:{doctor},
 run:{doctor,preview:async({port})=>({origin:"http://127.0.0.1:"+port,close:async()=>{}}),
  reservePorts:async()=>({release:async()=>{}})},
 compare:{doctor,checkPort:async()=>{},child:async()=>{throw new Error("equal frames need no pixel diff")},
  captureItems:async(_options,_setup,folder)=>{await mkdir(folder,{recursive:true});await writeFile(resolve(folder,"settled.png"),"frame");
   return {items:[{feature:"index.html/page",state:"default",query:{},language:"en",size:"desktop",input:"mouse",
    motion:"reduce",transport:"file",colors:"normal",status:"pass",problems:[],files:["settled.png"]}]}}},
};
try{await main(process.argv.slice(2),services)}
catch(error){console.error("FAIL: "+error.message);process.exitCode=1}
`;
}

const probeSources = {
	"lib.mjs":
		"export const introSettled=async()=>{}; export const overflowProbe=()=>({hScroll:false});",
	"geom.mjs": "export const geometryProbe=()=>({});",
	"a11y.mjs": "export const accessibilityProbe=async()=>({});",
};

// A concept, a fake ui-forensics folder and the harness under root.
export async function fakeCli(root) {
	const concept = resolve(root, "concept");
	await writeConcept(concept);
	await mkdir(resolve(concept, "tools/probes"), { recursive: true });
	for (const [file, source] of Object.entries(probeSources))
		await writeFile(resolve(concept, "tools/probes", file), source);
	const tools = resolve(root, "tools");
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(resolve(tools, "scripts/web/lib.mjs"), fakeBrowser);
	const harness = resolve(root, "harness.mjs");
	await writeFile(harness, harnessSource(tools));
	return {
		concept,
		tools,
		run: async (args) => {
			const result = spawnSync(process.execPath, [harness, ...args], {
				encoding: "utf8",
				timeout: 90000,
				windowsHide: true,
			});
			if (result.error) throw result.error;
			return {
				code: result.status,
				stdout: result.stdout,
				stderr: result.stderr,
			};
		},
	};
}
