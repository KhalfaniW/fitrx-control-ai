import { createBluetooth } from "node-ble";

let device = null;
let destroy = null;

const cleanup = async () => {
  try {
    if (device) {
      await device.disconnect();
    }
    if (destroy) {
      destroy();
    }
    console.log("Cleanup completed");
  } catch (error) {
    console.error("Cleanup error:", error);
  }
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

const fitRxDeviceAddress = "42:71:68:A9:F7:4D";
export default async function setFitRxLevel(level) {
  if (!device && !destroy) {
    const { bluetooth, destroy: bluetoothDestroy } = createBluetooth();
    destroy = bluetoothDestroy;
    const adapter = await bluetooth.defaultAdapter();
    await adapter.startDiscovery();

    device = await adapter.waitDevice(fitRxDeviceAddress);
    await device.connect();
    console.log("connected");
  }

  try {
    const gattServer = await device.gatt();
    const control_characteristicUUID = "0000ae3b-0000-1000-8000-00805f9b34fb";
    const serviceUUID = "0000ae3a-0000-1000-8000-00805f9b34fb";

    console.log("service connect");
    const service = await gattServer.getPrimaryService(serviceUUID);
    console.log("service found");
    const characteristic = await service.getCharacteristic(
      control_characteristicUUID,
    );
    console.log("characteristic found");

    if (level < 0 || level > 8) {
      throw new Error("Level must be between 0 and 8");
    }

    const levelCommand = `acad04a00000000${level.toString()}bcbd`;
    console.log({ levelCommand });
    const data = Buffer.from(levelCommand, "hex");
    await characteristic.writeValue(data, { type: "command" });
    console.log("characteristic sent");
  } catch (error) {
    console.error(error);
    await cleanup();
  }
}
