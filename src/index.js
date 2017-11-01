//@flow
import usbDetect from 'usb-detection'
import _ from 'lodash'
import request from 'request-promise-native'

const SERVER_URL = 'http://localhost:3000'
const WIRE_DEVICE_VENDOR_ID = 1423
const WIRE_DEVICE_PRODUCT_ID = 25479

const bays = [
	[337772544, 337707008, 337903616, 337838080],
	[undefined, undefined, undefined, undefined],
]
const wires = ['0A94C91D', 'EDDF3AEC', '7397FC5D', '00ABD9E3']

const serverMethod = (path: string) => request.get(`${SERVER_URL}/${path}`).catch((err: Error) => console.error(err.message))

const deviceIsPartOfGame = d => _.flatten(bays).includes(d.locationId) && wires.includes(d.serialNumber)

// device -> {bay: x, port: y}
const deviceToBayAndPort = d => {
	console.assert(deviceIsPartOfGame(d))
	const bay = bays.findIndex(bay => bay.includes(d.locationId))
	const port = bays[bay].indexOf(d.locationId)
	return {bay, port}
}

function onDeviceAdded(device) {
	if (!deviceIsPartOfGame(device)) return
	const {bay, port} = deviceToBayAndPort(device)
	const wire = wires.indexOf(device.serialNumber)
	console.log(`wire ${wire} connected to bay ${bay} port ${port}`)
  serverMethod(`connect/wire/${wire}/port/${port}/bay/${bay}`)
}

function onDeviceRemoved(device) {
	if (!deviceIsPartOfGame(device)) return
	const {bay, port} = deviceToBayAndPort(device)
	console.log(`wire disconnected from bay ${bay} port ${port}`)
  serverMethod(`disconnect/port/${port}/bay/${bay}`)
}

function addAlreadyPluggedInDevices() {
  usbDetect.find(WIRE_DEVICE_VENDOR_ID, WIRE_DEVICE_PRODUCT_ID, (err, devices) => {
		if (err) console.error(err)
    devices.forEach(onDeviceAdded)
  })
}

function main() {
	console.log('Daemon running 😈')
	addAlreadyPluggedInDevices()
	usbDetect.on('add', onDeviceAdded)
	usbDetect.on('remove', onDeviceRemoved)
}

main()
