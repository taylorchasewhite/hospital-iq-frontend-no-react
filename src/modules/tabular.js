/**
 * Tabulate data from a JSON endpoint.
 * @public
 *
 * @param {any} sourceData a URL or file path for the JSON document.
 * @param {any} optionsObject holds the options relating to the table creation
 */
export function createGenericTable(sourceData, options) {
	var table;
	options = defaultOptions(options);

	d3.json(sourceData, function (error, data) {
		createGenericTableInner(error, data);
	});

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

function defaultOptions(options) {
	options ??= {};
	options.targetTableElement ??= "body";
	return options;
}

/**
 * Called if you already have the json data loaded from D3.
 * @public
 * 
 * @param {Object} data 
 * @param {Object} options - Options object: 
 *		columns - {Array} Optional, needed if the data passed in does not have a row of header names
 * @returns 
 */
function tabulate(data, options, columns) {
	columns = options.columns;
	var sortAscending = true;
	var container = d3.select(options.targetTableElement);
	container.selectAll("table").remove();
	var table = container.append("table"),
		thead = table.append("thead"),
		tbody = table.append("tbody");
	var titleColumns, displayTitles;
	titleColumns = d3.keys(data[0]);
	titleColumns = titleColumns.filter(function (columnName) {
		return (options.thresholdCols.high !== columnName &&
			options.thresholdCols.low !== columnName &&
			!options.hiddenCols.includes(columnName));
	});

	if (!columns) {
		displayTitles = titleColumns;
	}
	else {
		displayTitles = columns;
	}

	for (var i = displayTitles.length - 1; i >= 0; i--) {
		if (displayTitles[i].indexOf("_") === 0) {
			displayTitles.splice(i, 1);
		}
	}

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
		.on('click', function (d, i) {
			d = titleColumns[i];
			headers.attr('class', 'header');
			if (sortAscending) {
				rows.sort(function (a, b) {
					if (isNaN(a[d])) {
						return d3.ascending(a[d], b[d]);
					}
					else {
						return b[d] - a[d];
					}
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
		});

	// create a row for each object in the data
	var rows = tbody.selectAll("tr")
		.data(data)
		.enter()
		.append("tr")
		.attr("class", function (d) {
			var classes = d["_Style"] ?? "";
			if ((d[options.thresholdCols.high] &&
				d[options.thresholdCols.value] > d[options.thresholdCols.high]) ||
				(d[options.thresholdCols.low] &&
				d[options.thresholdCols.value] < d[options.thresholdCols.low])) {
				classes = "errorColor";
			}
			else if ((d[options.thresholdCols.high] &&
				d[options.thresholdCols.value] === d[options.thresholdCols.high]) ||
				(d[options.thresholdCols.low] &&
				d[options.thresholdCols.value] === d[options.thresholdCols.low])) {
				classes = "warningColor";
			}
			return classes;
		});

	// create a cell in each row for each column
	var cells = rows.selectAll("td")
		.data(function (row) {
			return titleColumns.map(function (column) {
				return { column: column, value: row[column], highThreshold: row[options.thresholdCols.high], lowThreshold: row[options.thresholdCols.low]};
			});
		})
		.enter()
		.append("td")
		.html(function (d) {
			if (d.column === "_Link") {
				return '<a href="http://' + d.value + '">' + d.value + '</a>';
			}
			else if (d.column === options.thresholdCols.value) {
				var thresholdString = "";
				if (d.highThreshold) {
					thresholdString = 'Upper threshold: ' + d.highThreshold;
				}

				if (d.lowThreshold) {
					if (thresholdString)
						thresholdString += " ";
					thresholdString += 'Lower threshold: ' + d.lowThreshold;
				}
				return '<span title=\'' + thresholdString + '\'>' + d.value+'</span>';
			}
			else {
				return d.value;
			}
		})
		.classed('largeText', function (d) {
			if (d.column === options.thresholdCols.value) {
				return true;
			}
			else {
				return false;;
			}
		})
		.classed('centerAlign', function (d) {

			if (!isNaN(d.value)) {
				return true;
			}
			return false;
		})
		.classed('tableCell', true)
		.attr('data-th', function (d) {
			return d.name;
		});
	return table;
}