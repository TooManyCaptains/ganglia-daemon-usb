'use strict';

var _usbDetection = require('usb-detection');

var _usbDetection2 = _interopRequireDefault(_usbDetection);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _requestPromiseNative = require('request-promise-native');

var _requestPromiseNative2 = _interopRequireDefault(_requestPromiseNative);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SERVER_URL = process.env.STARSHIP_SERVER_URL || 'https://starship-server.herokuapp.com';

var WIRE_DEVICE_VENDOR_ID = 1423;
var WIRE_DEVICE_PRODUCT_ID = 25479;

var bays = [[337772544, 337707008, 337903616, 337838080], [undefined, undefined, undefined, undefined]];
var wires = ['0A94C91D', 'EDDF3AEC', '7397FC5D', '00ABD9E3'];

var serverMethod = function serverMethod(path) {
	return _requestPromiseNative2.default.get(SERVER_URL + '/' + path).catch(function (err) {
		return console.error(err.message);
	});
};

var deviceIsPartOfGame = function deviceIsPartOfGame(d) {
	return _lodash2.default.flatten(bays).includes(d.locationId) && wires.includes(d.serialNumber);
};

// device -> {bay: x, port: y}
var deviceToBayAndPort = function deviceToBayAndPort(d) {
	console.assert(deviceIsPartOfGame(d));
	var bay = bays.findIndex(function (bay) {
		return bay.includes(d.locationId);
	});
	var port = bays[bay].indexOf(d.locationId);
	return { bay: bay, port: port };
};

function onDeviceAdded(device) {
	if (!deviceIsPartOfGame(device)) return;

	var _deviceToBayAndPort = deviceToBayAndPort(device),
	    bay = _deviceToBayAndPort.bay,
	    port = _deviceToBayAndPort.port;

	var wire = wires.indexOf(device.serialNumber);
	console.log('wire ' + wire + ' connected to bay ' + bay + ' port ' + port);
	serverMethod('connect/wire/' + wire + '/port/' + port + '/bay/' + bay);
}

function onDeviceRemoved(device) {
	if (!deviceIsPartOfGame(device)) return;

	var _deviceToBayAndPort2 = deviceToBayAndPort(device),
	    bay = _deviceToBayAndPort2.bay,
	    port = _deviceToBayAndPort2.port;

	console.log('wire disconnected from bay ' + bay + ' port ' + port);
	serverMethod('disconnect/port/' + port + '/bay/' + bay);
}

function addAlreadyPluggedInDevices() {
	_usbDetection2.default.find(WIRE_DEVICE_VENDOR_ID, WIRE_DEVICE_PRODUCT_ID, function (err, devices) {
		if (err) console.error(err);
		devices.forEach(onDeviceAdded);
	});
}

function main() {
	console.log('Server: ' + SERVER_URL);
	console.log('Daemon running 😈');
	addAlreadyPluggedInDevices();
	_usbDetection2.default.on('add', onDeviceAdded);
	_usbDetection2.default.on('remove', onDeviceRemoved);
}

main();