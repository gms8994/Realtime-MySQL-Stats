<?php $options = parse_ini_file('mysql.ini', true); ?>

<html>
	<head>
		<title>Realtime MySQL Statistics</title>
		<script language="JavaScript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.2.6/jquery.min.js"></script>
		<script language="JavaScript" src="jquery.sprintf.js" name="data"></script>
		<script language="JavaScript" src="jquery.arrayUtils.js" name="data"></script>
		<script language="JavaScript" src="display_data.js" name="data"></script>

		<script language="JavaScript">
			var div;
			var updatesallowed = 1;
		</script>
	</head>

	<body>

		<!-- <input type="button" id="handler" value="Stop Updates" /> -->
		<select name="server" id="server" style="float: left;">
			<?php foreach ($options as $key => $value): ?>
			<option value="<?php echo $key ?>"><?php echo $value['host'] ?></option>
			<?php endforeach; ?>
		</select>
<div style=clear:both;float:left;width:1400px;>
		<table id="mysqldata" border="1" style="float: left; clear: both;"></table>
		<table id="highest_query_log" border="1" style="float: left; margin-left: 1em;"></table>
		<table id="joins_without_indexes" border="1" style="float: left; margin-left: 1em;"></table>
</div>
		<script>
			$(document).ready(showstats);
			$("handler").click(handleupdates);
		</script>
	</body>
</html>
