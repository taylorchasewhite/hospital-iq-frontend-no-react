/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/modules/tabular.js
/**
 * Tabulate data from a JSON endpoint.
 * @public
 *
 * @param {any} sourceData a URL or file path for the JSON document.
 * @param {any} optionsObject holds the options relating to the table creation
 */
function createGenericTable(sourceData, options) {
	var table;
	options = defaultOptions(options);

	d3.json(sourceData, createGenericTableInner);

	function createGenericTableInner(error, data) {
		if (error)
			throw error;

		table = tabulate(data, options);
		const sortCol = options.sortCol;
		if (sortCol) {
			table.selectAll("tbody tr")
				.sort(function (a, b) {
					if (isNaN(a[sortCol]))
						return d3.ascending(a[sortCol], b[sortCol]); // strings
					else
						return b[sortCol] - a[sortCol]; // numbers
				});

			var e = document.createEvent('UIEvents');
			e.initUIEvent('click', true, true);
			d3.select("#_header" + options.sortCol).node().dispatchEvent(e);
		}
	}
}

/**
 * Setup default options if none are passed.
 * @param {any} options The consumer provided objects array.
 */
function defaultOptions(options) {
	options ??= {};
	options.targetTableElement ??= "body";
	return options;
}

/**
 * Get title columns that are not hidden or threshold columns based on the options object.
 * @param {any} titleColumns The raw titles supplied via the JSON payload.
 * @param {any} options The options object provided by the consumer.
 */
function filterTitleColumns(titleColumns, options) {
	return titleColumns.filter(function (columnName) {
		return (options.thresholdCols.high !== columnName &&
			options.thresholdCols.low !== columnName &&
			!options.hiddenCols.includes(columnName));
	});
}

/**
 * Called once we have the json data loaded.
 * @public
 * 
 * @param {Object} data - the array of json data fetched from the endpoint.
 * @param {Object} options - Options object: 
 *		columns - {Array} Optional, needed if the data passed in does not have a row of header names
 * @returns the table html element.
 */
function tabulate(data, options) {
	var sortAscending = true;
	var container = d3.select(options.targetTableElement);

	container.selectAll("table").remove();

	var table = container.append("table"),
		thead = table.append("thead"),
		tbody = table.append("tbody");
	var titleColumns, displayTitles;
	titleColumns = d3.keys(data[0]);
	titleColumns = filterTitleColumns(titleColumns, options);

	if (!options.columns)
		displayTitles = titleColumns;
	else
		displayTitles = options.columns;

	// append the header row
	var headers = thead.append("tr")
		.selectAll("th")
		.data(displayTitles)
		.enter()
		.append("th")
		.attr("id", function (d,i) {
			return "_header" + titleColumns[i];
		})
		.text(function (column) { return column; })
		.on('click', onColumnHeaderClick);

	// create a row for each object in the data
	var rows = tbody.selectAll("tr")
		.data(data)
		.enter()
		.append("tr")
		.attr("class", getRowClass);

	// create a cell in each row for each column
	rows.selectAll("td")
		.data(function (row) {
			return titleColumns.map(function (column) {
				return { column: column, value: row[column], highThreshold: row[options.thresholdCols.high], lowThreshold: row[options.thresholdCols.low]};
			});
		})
		.enter()
		.append("td")
		.html(getCellContents)
		.classed('largeText', function (d) {
			if (d.column === options.thresholdCols.value)
				return true;
			else
				return false;;
		})
		.classed('tableCell', true)
		.attr('data-th', function (d) {
			return d.name;
		});
	return table;

	function getCellContents(cellData) {
		if (cellData.column === options.thresholdCols.value) {
			var thresholdString = "";
			if (cellData.highThreshold) {
				thresholdString = 'Upper threshold: ' + cellData.highThreshold;
			}

			if (cellData.lowThreshold) {
				if (thresholdString)
					thresholdString += " ";
				thresholdString += 'Lower threshold: ' + cellData.lowThreshold;
			}
			return '<span title=\'' + thresholdString + '\'>' + cellData.value + '</span>';
		}
		else {
			return cellData.value;
		}
	}

	function getRowClass(row) {
		{
			var classes = row["_Style"] ?? "";
			if ((row[options.thresholdCols.high] &&
				row[options.thresholdCols.value] > row[options.thresholdCols.high]) ||
				(row[options.thresholdCols.low] &&
				row[options.thresholdCols.value] < row[options.thresholdCols.low])) {
				classes = "errorColor";
			}
			else if ((row[options.thresholdCols.high] &&
				row[options.thresholdCols.value] === row[options.thresholdCols.high]) ||
				(row[options.thresholdCols.low] &&
				row[options.thresholdCols.value] === row[options.thresholdCols.low])) {
				classes = "warningColor";
			}
			return classes;
		}
	}

	function onColumnHeaderClick(d, i) {
		d = titleColumns[i];
		headers.attr('class', 'header');
		if (sortAscending) {
			rows.sort(function (a, b) {

				if (isNaN(a[d]))
					return d3.ascending(a[d], b[d]);
				else
					return b[d] - a[d];

			});
			sortAscending = false;
			this.className = 'asc';
		} else {
			rows.sort(function (a, b) {
				if (isNaN(a[d])) {
					return d3.descending(a[d], b[d]);
				}
				else {
					return a[d] - b[d];
				}
			});

			sortAscending = true;
			this.className = 'desc';
		}
	}
}
;// CONCATENATED MODULE: ./src/modules/census-board.js


/**
 * Initialize the census table with the necessary classes and data.
 * @public
 */
function initializeCensus() {
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
;// CONCATENATED MODULE: ./src/index.js
// JavaScript source code


initializeCensus();
/******/ })()
;