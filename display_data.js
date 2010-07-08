var beenseen = 0;
var lastdata = new Array();
var pref = new Array("b","k","M","G","T","P","E","Z","Y");
var totals = new Array();
var start = new Array();
var prev = new Array();
var current = new Array();

var joins_wo_indexes_time = new Array();
var highest_qps = new Array(10);
var highest_qps_time = new Array(10);

var locked = false;

$(document).ready(function() {
	$('#server').change(function() {
		if (! locked) {
			resetValues();
		} else {
			setTimeout("resetValues", 260);
		}
	});
});

function resetValues() {
	if (! locked) {
		locked = true;
		totals = new Array();
		start = new Array();
		current = new Array();
		beenseen = 0;
		locked = false;
	} else {
		setTimeout("resetValues", 260);
	}
}

function parseData(req) {
	// reload the script
	/*if (parseFloat(req.js_updated) < 10) {
		$.getScript($("script[name=data]").attr("src"));
	}*/

	if (! locked) {
		locked = true;
		for(key in req) {

			if (req[key] == parseFloat(req[key])) {
				req[key] = parseFloat(req[key]);
			}

			if (totals[key]) { prev[key] = totals[key]; }

			totals[key] = req[key];
			if (beenseen == 0) {
				start[key] = req[key];
			}

			if (req[key] == parseFloat(req[key])) {
				current[key] = totals[key] - start[key];
			}
		}
		if (beenseen == 0) { beenseen = 1; }
		locked = false;
	}

	var daemonuptime = totals['Uptime'];
	var curuptime = current['Uptime'];

	var joins_wo_indexes = (totals['Select_range_check'] + totals['Select_full_join']) - (prev['Select_range_check'] + prev['Select_full_join']);
	if (joins_wo_indexes > 0) {
		joins_wo_indexes_time.push(new Date());
	}

	var min = highest_qps.length < 26 ? 0 : ($.min(highest_qps) || 0);
	var current_qps = (totals['Questions'] - totals['Com_show_status']) - (prev['Questions'] - prev['Com_show_status']);
	if (current_qps > min) {

		var found = 0;
		// loop over each item.  if the current is larger than what's there, replace and bail
		$(highest_qps).each(function(a) {
			if ((!highest_qps[a] || current_qps > highest_qps[a]) && !found) {
				highest_qps.splice(a, 0, current_qps);
				highest_qps_time.splice(a, 0, new Date());
				found = 1;
				return false;
			}
		});

		// only want 26 items
		if (highest_qps.length > 26) {
			highest_qps.splice(26, highest_qps.length - 26);
			highest_qps_time.splice(26, highest_qps_time.length - 26);
		}

		arrayToTable(highest_qps, highest_qps_time, 'highest_query_log');
	}

	var mdata = $("#mysqldata");
	mdata.empty();
	addDataToTable(mdata, daemonuptime, totals, 'System Uptime', true);
	mdata.append($.sprintf("%s", "<tr><td colspan='6'>&nbsp;</td></tr>"));
	addDataToTable(mdata, curuptime, current, 'Current View');

	arrayToTable2(joins_wo_indexes_time, 'joins_without_indexes');

	if (updatesallowed) {
		setTimeout('showstats()',1000);
	}
}

function showstats() {
	$.getJSON("mysql_xml.php?dt=" + (new Date()) + "&server=" + $('#server').val(), parseData);
}

function handleupdates() {
	if (updatesallowed) { setTimeout('showstats()',1000); }
	$("handler").toggle(
		function() {
			$(this).val("Start Updates");
			updatesallowed = 0;
		},
		function() {
			$(this).val("Stop Updates");
			updatesallowed = 1;
		}
	);
}
function printBreakDown() {
	var total = arguments[0]; var uptime = arguments[1]; var usepref = arguments[2];

	return	usepref ?
		$.sprintf("<td align='right'>%.03f%s</td><td align='right'>%.03f%s</td><td align='right'>%.04f%s</td><td align='right'>%.05f%s</td><td align='right'>%.06f%s</td></tr>", lpref(total), fpref(total), lpref(pday(total,uptime)), fpref(pday(total,uptime)), lpref(phour(total,uptime)), fpref(phour(total,uptime)), lpref(pmin(total,uptime)), fpref(pmin(total,uptime)), lpref(psec(total,uptime)), fpref(psec(total,uptime))) : 
		$.sprintf("<td align='right'>%s</td><td align='right'>%s</td><td align='right'>%s</td><td align='right'>%s</td><td align='right'>%s</td></tr>", commify(total), pday(total,uptime), phour(total,uptime), pmin(total,uptime), psec(total,uptime));
}

function uptime() {
	var seconds = arguments[0];
	var minutes = 0; var hours = 0; var days = 0;
	seconds -= (days = parseInt(seconds/86400))*86400;
	seconds -= (hours = parseInt(seconds/3600))*3600;
	seconds -= (minutes = parseInt(seconds/60))*60;
	var string = "";
	if (days > 0) { string += days+" day"+(days!=1?"s":"")+" "; }
	if (hours > 0) { string += hours+" hour"+(hours!=1?"s":"")+" "; }
	if (minutes > 0) { string += minutes+" minute"+(minutes!=1?"s":"")+" "; }
	string += seconds+" second"+(seconds!=1?"s":"");
	return string;
}
function pday() {

	var val = $.sprintf('%.03f', arguments[0]/(arguments[1]/86400));

	var tmpval;
	val = val.toString();

	tmpval = val.replace(/\..*$/, '');
	val = val.replace(/^.*?\./, '');
	tmpval = commify(tmpval);
	tmpval = tmpval.replace(/^,/, '');

	val = tmpval + '.' + val;

	// return arguments[0]/(arguments[1]/86400);
	return val;
}
function phour() {
	var val = $.sprintf('%.04f', arguments[0]/(arguments[1]/3600));
	var tmpval;
	val = val.toString();

	tmpval = val.replace(/\..*$/, '');
	val = val.replace(/^.*?\./, '');
	tmpval = commify(tmpval);
	tmpval = tmpval.replace(/^,/, '');

	val = tmpval + '.' + val;
	return val;
}
function pmin() {
	var val = $.sprintf('%.05f', arguments[0]/(arguments[1]/60));
	var tmpval;
	val = val.toString();

	tmpval = val.replace(/\..*$/, '');
	val = val.replace(/^.*?\./, '');
	tmpval = commify(tmpval);
	tmpval = tmpval.replace(/^,/, '');

	val = tmpval + '.' + val;
	return val;
}
function psec() {
	var val;
	if (arguments[0]/arguments[1] < 1) {
		val = $.sprintf('%.07f', arguments[0]/arguments[1]);
	} else {
		val = $.sprintf('%.06f', arguments[0]/arguments[1]);
	}
	var tmpval;
	val = val.toString();

	tmpval = val.replace(/\..*$/, '');
	val = val.replace(/^.*?\./, '');
	tmpval = commify(tmpval);
	tmpval = tmpval.replace(/^,/, '');

	val = tmpval + '.' + val;
	return val;
}

function lpref(val) {
	while((val /= 1024) > 1024) {}

	return val;
}

function fpref(val) {
	var i = 0;
	while((val /= 1024) > 1024) { i++; }
	return pref[i];
}

function commify(str) { 
	str = str.toString();
	var ret = '';
	var n = str.length;
	var pre;
	var post;
	if (n <= 3) { ret = str; }
	else {
		pre = str.substring(0, n - 3);
		post = str.substring(n - 3);
		pre = commify(pre);
		ret = pre + ',' + post;
	}
	return ret;
}

function calculateTimeTillNextMilestone(queries, uptime) {

	var q_string = queries.toString();
	var pad = q_string.length - 1;

	q_string = q_string.replace(/^(\d).*$/, '1');
	q_string = parseInt(q_string);
	q_string = q_string + '0'.repeat(pad + 1);
	q_string = parseInt(q_string);

	var secondsTillMilestone = (q_string - queries) / (queries / uptime);

	var currentDate = new Date();
	var currentSeconds = currentDate.getTime();
	var milestoneSeconds = currentSeconds + (secondsTillMilestone * 1000);
	var milestoneDate = new Date(milestoneSeconds);

	return $.sprintf('Date of next milestone: %s with milestone at %s', milestoneDate, commify(q_string));
}

String.prototype.repeat = function( num ) {
	    return new Array( num + 1 ).join( this );
}
function arrayToTable(ar1, ar2, id) {
	$('#' + id).empty();

	var lim = ar1.length;

	$('#' + id).append("<tr><th colspan=\"2\">Top 10 QPS</th></tr>");
	$('#' + id).append("<tr><th>QPS</th><th>Time</th></tr>");
	var first_start;
	for(var i=0; i <= lim; i++) {
		if (ar1[i]) {
			if (i == 0) { first_start = ar2[i]; } 

			var app_string = "<tr";
			if (((new Date()) - ar2[i]) < 5000) {
				app_string += " style=\"background-color: #ff9999;\"";
			}
			app_string += "><td>" + ar1[i] + "</td><td>";
			if (ar2[i] > first_start) {
				app_string += "approximately " + (ar2[i] - first_start) + "ms after max";
			} else if (ar2[i] == first_start) {
				app_string += "I am the max! (" + first_start + ")";
			} else {
				app_string += "approximately " + (first_start - ar2[i]) + "ms before max";
			}
			app_string += "</td></tr>";

			$('#' + id).append(app_string);
		}
	}
}

function arrayToTable2(ar1, id) {
	$('#' + id).empty();

	var lim = ar1.length;

	$('#' + id).append("<tr><th colspan=\"2\">Joins without Indices times</th></tr>");
	var first_start;
	for(var i=0; i <= lim; i++) {
		var app_string = "<tr><td>" + ar1[i] + "</td></tr>";
		$('#' + id).append(app_string);
	}
}

function addDataToTable(tblObj, uptimeValue, dataObj, specialText, showTime) {
	if (showTime)
		tblObj.append($.sprintf("<tr><td colspan='6'>Current time: %s</td></tr>",(new Date())));

	tblObj.append($.sprintf("<tr><td colspan='6'>%s: %s</td></tr>", specialText, uptime(uptimeValue)));
	tblObj.append($.sprintf("<tr><th>&nbsp;</th><th>Current</th><th>Day</th><th>Hour</th><th>Minute</th><th>Second</th></tr>"));
	tblObj.append($.sprintf("<tr><td>Queries: </td> %s", printBreakDown(dataObj['Questions'] - dataObj['Com_show_status'], uptimeValue)));
	tblObj.append($.sprintf("<tr><td colspan='6'>%s</td>", calculateTimeTillNextMilestone(dataObj['Questions'], uptimeValue)));
	tblObj.append($.sprintf("<tr><td>Slow Queries:</td> %s", printBreakDown(dataObj['Slow_queries'],uptimeValue)));
	tblObj.append($.sprintf("<tr><td>Joins Without Indices:</td> %s", printBreakDown(dataObj['Select_range_check'] + dataObj['Select_full_join'],uptimeValue)));
	tblObj.append($.sprintf("<tr><td>Threads Created:</td> %s", printBreakDown(dataObj['Threads_created'],uptimeValue)));
	tblObj.append($.sprintf("<tr><td>Connections:</td> %s", printBreakDown(dataObj['Connections'],uptimeValue)));
	/*
	tblObj.append($.sprintf("<tr><td>Key Reads:</td> %s", printBreakDown(dataObj['Key_reads'],uptimeValue)));
	tblObj.append($.sprintf("<tr><td>Key Read Requests:</td> %s", printBreakDown(dataObj['Key_read_requests'],uptimeValue)));
	tblObj.append($.sprintf("<tr><td>Bytes RX:</td> %s", printBreakDown(dataObj['Bytes_received'],uptimeValue,true)));
	tblObj.append($.sprintf("<tr><td>Bytes TX:</td> %s", printBreakDown(dataObj['Bytes_sent'],uptimeValue,true)));
	*/
	tblObj.append($.sprintf("<tr><td>Tmp Tables:</td> %s", printBreakDown(dataObj['Created_tmp_tables'],uptimeValue)));
	tblObj.append($.sprintf("<tr><td>Disk Tmp Tables:</td> %s", printBreakDown(dataObj['Created_tmp_disk_tables'],uptimeValue)))
	/*
	tblObj.append($.sprintf("Handler Read Rnd Next: %s", printBreakDown(totalHandler_read_rnd_next,uptimeValue)));
	tblObj.append($.sprintf("Inno Row Lock Time (MS): %s", printBreakDown(totalInnodb_row_lock_time,uptimeValue)));
	*/
	tblObj.append($.sprintf("<tr><td colspan='6'>Key Cache Hit Rate: %0.3f%</td></tr>", (100 - ((dataObj['Key_reads'] / dataObj['Key_read_requests']) * 100))));
	tblObj.append($.sprintf("<tr><td colspan='6'>Thread Cache Hit Rate: %0.3f%</td></tr>", (100 - ((dataObj['Threads_created'] / dataObj['Connections']) * 100))));
	tblObj.append($.sprintf("<tr><td colspan='6'>Query Cache Hit Rate: %0.3f%</td></tr>", (dataObj['Qcache_hits']/(dataObj['Qcache_inserts']+dataObj['Qcache_not_cached']+dataObj['Qcache_hits']))*100));
}
