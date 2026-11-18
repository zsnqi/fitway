// Drive the real runner through a deterministic browser adapter for the cli tests.
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { scratch } from "./cli-test-harness.mjs";

// The deterministic browser adapter the runner loads in place of the measurement tool's lib.mjs.
function adapterSource(root, options) {
	return `
import {appendFile,writeFile} from "node:fs/promises";
import {createContext,runInContext} from "node:vm";
const motion=${JSON.stringify(options.scriptMotion || null)}, phase=${JSON.stringify(options.scriptPhase || 0)};
const dynamicState=${JSON.stringify(Boolean(options.dynamicState))};
const transitionOnCapture=${JSON.stringify(Boolean(options.transitionOnCapture))};
const capturePhases=${JSON.stringify(options.capturePhases || [])};
const transitionAfterProofs=${JSON.stringify(options.transitionAfterProofs ?? null)};
let fixturePhase="loading", phaseReads=0;
let captureCount=0;
const capture=async(via,options,picture)=>{await appendFile(${JSON.stringify(resolve(root, "captures.jsonl"))},JSON.stringify({via,options})+"\\n");return Buffer.from(picture)};
export const launchChromium=async(loaded,options)=>{await writeFile(${JSON.stringify(resolve(root, "launch.json"))},JSON.stringify(options||null));return {close:async()=>{}}};
export async function newContext(browser, options) {
 let language=options.locale?.startsWith("ar")?"ar":"en";
 let focus="body", open=false;
 let now=0, next=0; const frames=new Map();
 const sandbox={position:0,document:{getAnimations:()=>[]},
 requestAnimationFrame:(callback)=>{const id=++next;frames.set(id,callback);return id},
 cancelAnimationFrame:(id)=>frames.delete(id)};
 sandbox.window=sandbox; createContext(sandbox);
 const run=(fn)=>runInContext('('+fn.toString()+')()',sandbox);
 const tick=()=>{now+=16;for(const id of [...frames.keys()]){const callback=frames.get(id);if(callback){frames.delete(id);callback.call(sandbox,now)}}};
const page={setDefaultTimeout(){},addInitScript:async(fn)=>{await appendFile(${JSON.stringify(resolve(root, "init.jsonl"))},"observer\\n");if(motion)run(fn)},
 startMotion:()=>{if(motion){runInContext('function move(){position++;if('+JSON.stringify(motion==='forever')+'||position<20)requestAnimationFrame(move)};requestAnimationFrame(move)',sandbox);for(let i=0;i<phase;i++)tick()}},
  tick,picture:()=>dynamicState?fixturePhase:motion?JSON.stringify({x:sandbox.position}):"fixture",
  waitForFunction:async(fn,arg,options)=>{
   if(dynamicState&&typeof fn==="string"&&fn.includes("__fixturePhase")){
    if(transitionAfterProofs!==null&&phaseReads===transitionAfterProofs)fixturePhase="ready";
    phaseReads++;
    const wantsLoading=fn.includes("'loading'")||fn.includes('"loading"');
    if(wantsLoading&&fixturePhase!=="loading")throw new Error("Timeout 5000 ms: loading state changed before capture");
    if(!wantsLoading&&fixturePhase!=="ready")throw new Error("Timeout 5000 ms: arrival state not observed");
    return;
   }
   if(!motion)return;if(!Number.isFinite(options.timeout)||options.timeout<=0)throw new Error('Motion wait must have a finite positive bound');let remaining=options.timeout;while(!run(fn)){if(remaining<=0)throw new Error('Timeout '+options.timeout+' ms: script motion still schedules frames');tick();remaining-=16}},
 transitionOnCapture:()=>{const phase=capturePhases[captureCount++];if(transitionOnCapture)fixturePhase="ready";if(phase)fixturePhase=phase},
  screenshot:async(options)=>{page.transitionOnCapture();return capture("native",options,page.picture())},
context:()=>({newCDPSession:async()=>({send:async(method)=>method==="Runtime.evaluate"?{result:{objectId:"focus"}}:method==="Accessibility.getPartialAXTree"?{nodes:[{role:{value:"button"},name:{value:"Open details"}}]}:{},detach:async()=>{}})}),
  evaluate:async(fn)=>fn.toString().includes("coarse")
   ? {language,direction:language==="ar"?"rtl":"ltr",coarse:false,touchPoints:0}
   : fn.toString().includes("Canvas") ? {active:true,background:"rgb(0, 0, 0)",canvas:"rgb(0, 0, 0)"}
: fn.toString().includes("document.scrollingElement") ? {scrollX:0,scrollY:0,viewportWidth:1440,viewportHeight:900,documentHeight:900}
: fn.toString().includes("document.activeElement") ? {selector:focus,tag:focus==="body"?"body":"button",page:focus==="body",text:"Whole page text must never appear in a focus message"} : motion&&fn.toString().includes("document.getAnimations")?run(fn):{},
locator:(selector)=>({first(){return this},count:async()=>1,
evaluate:async()=>focus===selector,ariaSnapshot:async()=>selector==="body"?"body":'- button "Open details"',
   waitFor:async()=>{if(selector==="#dialog"&&!open)throw new Error("dialog stayed closed")}}),
  keyboard:{
   down:async()=>{},
   up:async(key)=>{if(key==="Space"&&focus==="#opener"){open=true;focus="#field"}},
   press:async(key)=>{if(key==="Tab")focus=focus==="body"?"#opener":"body";
    if(key==="Enter"&&focus==="#opener"){open=true;focus="#field"}}}};
 return {page,context:{close:async()=>{}},errors:[],emulation:{forcedColors:options.forcedColors || "none"}};
}
export const withParams=(url)=>url;
export const preparePage=async(page)=>{page.startMotion();return {ready:true}};
export const screenshot=async(page,options)=>{page.transitionOnCapture();return capture("adapter",options,page.picture())};
export const twoFrames=async(page)=>{page.tick();page.tick()};
export const injectProbe=async()=>{};
export const renderSheet=async()=>{};
`;
}

// The script that calls drive on the fixture concept and reports an unexpected failure.
function callerSource(build, tools, out, features, options) {
	return `import {drive} from ${JSON.stringify(new URL("./runner.mjs", import.meta.url).href)};
import * as core from ${JSON.stringify(new URL("./core.mjs", import.meta.url).href)};
try {await drive(${JSON.stringify({
		concept: build,
		tools,
		out,
		loaded: {},
		map: {
			sizes: { desktop: { width: 1440, height: 900 } },
			pages: [
				{
					page: "fixture.html",
					ready: "true",
					switches: options.switches || [],
					features,
					states: options.mapStates || [
						{
							when: {},
							shows: "Fixture state",
							proof: { selector: "main", visible: true },
						},
					],
					defaults: options.defaults || {},
				},
			],
		},
		page: "fixture.html",
		feature: "all",
		languages: "en",
		sizes: "desktop",
		inputs: "keyboard",
		motions: "reduce",
		transports: "file",
		...options,
	})})}
catch(error){if(!(core.ReportedFailure && error instanceof core.ReportedFailure))console.error("FAIL: "+error.message);process.exitCode=1}`;
}

// Exercise the runner's actual evidence/summary path through a deterministic UI
// adapter. The fast ladder does not need a browser installation for these contracts.
export async function runnerFixture(name, features, options = {}) {
	const root = resolve(scratch, name);
	const build = resolve(root, "concept");
	const tools = resolve(root, "tools");
	const out = resolve(root, "out");
	await mkdir(resolve(build, "tools/probes"), { recursive: true });
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.2.0"; export const CONTEXT_SPEC={forcedColors:{type:"string"}};',
	);
	await writeFile(
		resolve(build, "tools/probes/lib.mjs"),
		"export const introSettled=async()=>{}; export const overflowProbe=()=>({hScroll:false});",
	);
	await writeFile(
		resolve(build, "tools/probes/geom.mjs"),
		"export const geometryProbe=()=>({});",
	);
	await writeFile(
		resolve(build, "tools/probes/a11y.mjs"),
		"export const accessibilityProbe=()=>({});",
	);
	await writeFile(
		resolve(tools, "scripts/web/lib.mjs"),
		adapterSource(root, options),
	);
	const caller = resolve(root, "caller.mjs");
	await writeFile(caller, callerSource(build, tools, out, features, options));
	return {
		root,
		out,
		result: spawnSync(process.execPath, [caller], {
			encoding: "utf8",
			windowsHide: true,
		}),
	};
}
