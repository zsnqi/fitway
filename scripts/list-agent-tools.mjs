#!/usr/bin/env node
import process from "node:process";
import {
	beginToolCommand,
	renderToolTable,
} from "./agent-environment/tool-contract.mjs";

beginToolCommand("tools", process.argv.slice(2));
console.log(renderToolTable());
