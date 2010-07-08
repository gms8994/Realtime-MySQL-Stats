<?

// header("Content-type: application/json");

$options = parse_ini_file('mysql.ini', true);

$server = $_GET['server'] || 1;

$link = mysql_pconnect($options[$server]['host'] . ':' . $options[$server]['port'],
					   $options[$server]['user'],
					   $options[$server]['pass']);

if (!$link) {
	print json_encode(mysql_error());
	exit();
}

$query = "SHOW GLOBAL STATUS";
$result = mysql_query($query);
if (!$result) {
	print json_encode(mysql_error());
	exit();
}

$mysql_data = array();
while ($line = mysql_fetch_row($result)) {
	$mysql_data[$line[0]] = $line[1];
}
$mysql_data['js_updated'] = time() - filemtime("display_data.js");

print json_encode($mysql_data);
mysql_free_result($result);

mysql_close($link);

?>
