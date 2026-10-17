// The smallest concept the map accepts: one opener, its covered popup and one state.
export const html =
	'<main>Fixture</main><button id="ops-btn" aria-controls="ops-pop">Status</button><div id="ops-pop" role="dialog" hidden></div><script src="app.js"></script>';
export const js =
	'const params=new URLSearchParams(location.search);const state=params.get("state")||"live";if(["live","loading","error"].includes(state)){};window.__fixture={ready:true};';
export const authored = () => ({
	schema: 1,
	pages: {
		"index.html": {
			features: [
				{
					id: "status",
					marker: "ops-btn",
					source: { file: "index.html", line: 1 },
					actions: ["activate:#ops-btn"],
					proof: { selector: "#ops-pop", visible: true },
					covers: ["#ops-pop"],
				},
			],
			states: [
				{
					when: {},
					shows: "Visible fixture",
					proof: { selector: "main", visible: true },
				},
			],
		},
	},
});
