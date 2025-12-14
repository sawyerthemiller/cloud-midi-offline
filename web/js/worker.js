function trim(str) {
	if (!str || !str.replace) str = '';
	return str.replace(/^\s*|\s*$/g, "");
}
function number_format(number, decimals, dec_point, thousands_sep) {
	number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
	var n = !isFinite(+number) ? 0 : +number,
		prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
		sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
		dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
		s = '',
		toFixedFix = function (n, prec) {
			var k = Math.pow(10, prec);
			return '' + Math.round(n * k) / k;
		};
	s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
	if (s[0].length > 3) {
		s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
	}
	if ((s[1] || '').length < prec) {
		s[1] = s[1] || '';
		s[1] += new Array(prec - s[1].length + 1).join('0');
	}
	return s.join(dec);
}
function getfileext(s) {
	if (!s) s = ''; var arr = s.split('.'); if (arr.length > 1) { return arr[arr.length - 1].toLowerCase(); } return '';
}

function print(s) {
	//console.log(s);
}
function printErr(s) {
	//console.log(s);
	if (s) postMessage({ 'type': 'error', 'data': s });
}

var gadlib2vgmloaded;

function message_func(event) {
	var message = event.data;
	if (message.type == 'adlib') {
		var ext;
		if (message.resp && message.resp.title) {
			ext = getfileext(message.resp.title);
		}
		if (!ext) ext = 'unknown';
		if (!gadlib2vgmloaded) {
			gadlib2vgmloaded = true; importScripts('adlib2vgm.js');
		}
		_getwasmbinary('adlib2vgm.wasm', function (wb) {
			var args = ['-i', 'input.' + ext, '-o', 'out.vgm'];
			var Module2 = { wasmBinary: wb, files: [{ "name": 'input.' + ext, "data": message.buffer }], arguments: args, print: print, printErr: printErr };
			adlib2vgm_run(Module2, function (FS) {
			}, function (results) {
				//console.log(ext, results);
				for (var i = 0; i <= results.length - 1; i++) {
					if (/\.(vgm)$/i.test(results[i].name)) {
						postMessage({ 'type': 'result', 'data': results[i].data });
						return;
					}
				}
				postMessage({ 'type': 'error', 'data': 'Failed to convert to the VGM file.' });
			});
		}, false, 761091);
	} else {
		postMessage({ 'type': 'error', 'data': 'Not supported.' });
	}
}
self.addEventListener('message', message_func, false);

var gwasmbinary = {};
function _getwasmbinary(fname, callback, isxhr, estimatesize) {
	if (gwasmbinary[fname]) {
		callback(gwasmbinary[fname]); return;
	}
	try {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', fname, true);
		xhr.responseType = 'arraybuffer';
		var lastprogress = (new Date()).getTime();
		xhr.onprogress = function (event) {
			if (lastprogress) {
				var elaspetime = new Date();
				var dt = elaspetime.getTime() - lastprogress;
				if (dt < 200) return;
				lastprogress = elaspetime.getTime();
			}
			var a = event;
			var total = a.totalSize || a.total || estimatesize || 0;
			var current = a.position || a.loaded || 0;
			postMessage({ 'type': 'progress', 'data': 'Downloading a library... (' + number_format(current) + '/' + number_format(total) + ')' });
		};
		xhr.onload = function () {
			if (this.status == 200) {
				if (isxhr) gwasmbinary[fname] = this;
				else gwasmbinary[fname] = this.response;
				callback(gwasmbinary[fname]);
			} else {
				postMessage({ 'type': 'error', 'data': 'Failed to fetch the library.' });
			}
		};
		xhr.onerror = function (e) {
			postMessage({ 'type': 'error', 'data': 'Failed to fetch the library (1).' });
		};
		xhr.send();
	} catch (err) {
		callback();
	}
}

postMessage({ 'type': 'ready' });