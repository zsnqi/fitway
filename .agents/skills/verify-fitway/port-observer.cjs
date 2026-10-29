// Record verify-fitway server port binds and closes for contract tests.
const { appendFileSync } = require("node:fs");
const net = require("node:net");

const logPath = process.env.VERIFY_FITWAY_PORT_HOOK_LOG;
const guarded = Symbol.for("verify-fitway.port-observer");
const first = 3174;
const last = 3189;

const watched = (port) =>
	Number.isInteger(port) && port >= first && port <= last;

const record = (event, port) => {
	if (!logPath || !watched(port)) return;
	appendFileSync(
		logPath,
		`${JSON.stringify({ event, port, pid: process.pid })}\n`,
	);
};

const requestedPort = (options) => {
	if (typeof options === "number") return options;
	if (options && typeof options === "object" && options.port !== undefined)
		return Number(options.port);
	return null;
};

if (!net[guarded]) {
	Object.defineProperty(net, guarded, { value: true });

	const listen = net.Server.prototype.listen;
	net.Server.prototype.listen = function (...args) {
		const port = requestedPort(args[0]);
		if (watched(port)) record("listen", port);
		else if (port === 0)
			this.once("listening", () => {
				const address = this.address();
				if (address && typeof address === "object")
					record("listen", address.port);
			});
		return listen.apply(this, args);
	};

	const connect = net.Socket.prototype.connect;
	net.Socket.prototype.connect = function (...args) {
		record("connect", requestedPort(args[0]));
		return connect.apply(this, args);
	};
}
