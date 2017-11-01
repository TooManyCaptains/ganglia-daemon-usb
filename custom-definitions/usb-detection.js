declare module 'usb-detection' {
  declare type Device = {
    locationId: number,
    vendorId: number,
    productId: number,
    deviceName: string,
    manufacturer: string,
    serialNumber: string,
    deviceAddress: number,
  }
  declare function find(vid: number, pid: number, callback: ((err: Error, devices: Array<Device>) => void)): Promise<*>
  declare function on(event: 'add' | 'insert' | 'change' | 'remove', callback: (Device => void)): void
}
