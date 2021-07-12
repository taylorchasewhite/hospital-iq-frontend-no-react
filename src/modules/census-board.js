import { createGenericTable } from "./tabular";

/**
 * Initialize the census table with the necessary classes and data.
 * @public
 */
export function initializeCensus() {
	const options = {};
	options.sortCol = "census";
	options.columns = [
		"Name",
		"Capacity",
		"Census",
	];
	options.targetTableElement = "#census-dashboard-table-container";

	options.hiddenCols = ["id"];
	options.thresholdCols = {
		high: "highAlarm",
		value: "census",
		low: "lowAlarm"
	};

	createGenericTable("https://private-66479-hospiqtest.apiary-mock.com/units", options);
	d3.select("#census-last-updated").text("Last updated: " + new Date());
}
window.initializeCensus = initializeCensus;