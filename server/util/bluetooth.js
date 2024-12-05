import { createBluetooth } from "node-ble";
const fitRxDeviceAddress = "42:71:68:A9:F7:4D";
const messageHeader = "acad04";
const messageFooter = "bcbd";

const MODES = [
  "Acupuncture",
  "Cupping",
  "Scrape",
  "Knead",
  "Massage",
  "Shiatsu",
  "Strike",
  "Fitness",
];
async function cleanupBluetooth({ device, destroy, adapter }) {
  console.log("cleaning up");
  try {
    if (adapter.isDiscovering()) {
      adapter.stopDiscovery();
    }
    await device?.disconnect();

    destroy?.();

    console.log("Cleanup completed");
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}
let cleanupConnection = async () => {
  console.log("fake cleanup");
};
//set thse now in case it gets killed while connecting
process.on("SIGINT", async () => {
  await cleanupConnection();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await cleanupConnection();
  process.exit(0);
});
process.on("uncaughtException", async function (exception) {
  await cleanupConnection();

  console.error(exception);
  process.exit(1);
});
let cleanupObject = {
  device: null,
  destroy: null,
  adapter: null,
};
export async function setupBluetoothServer() {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Bluetooth connect timeout")), 4000);
  });
  cleanupConnection = () => {
    cleanupBluetooth(cleanupObject);
  };

  await Promise.race([connectBluetooth(cleanupObject), timeoutPromise]);

  return {
    server: await cleanupObject.device.gatt(),
    cleanupConnection: () => {
      cleanupBluetooth(cleanupObject);
    },
  };
}

async function connectBluetooth(cleanupObject) {
  const { bluetooth, destroy: bluetoothDestroy } = createBluetooth();
  cleanupObject.destroy = bluetoothDestroy;

  const adapter = await bluetooth.defaultAdapter();
  cleanupObject.adapter = adapter;

  if (!(await adapter.isDiscovering())) {
    await adapter.startDiscovery();
  }

  const device = await adapter.getDevice(fitRxDeviceAddress);
  cleanupObject.device = device;

  device.on("disconnect", async () => {
    console.log("Device disconnected");
  });

  await device.disconnect();

  await device.connect();
  console.log("Device connected successfully");
}

export async function queryFitRxStatus(gattServer, onData) {
  const service2 = await gattServer.getPrimaryService(
    "0000ae3a-0000-1000-8000-00805f9b34fb",
  );
  const listenerCharacteristic = await service2.getCharacteristic(
    "0000ae3c-0000-1000-8000-00805f9b34fb",
  );

  await listenerCharacteristic.startNotifications();

  const statusPromise = new Promise((resolve, reject) => {
    listenerCharacteristic.on("valuechanged", async (buffer) => {
      resolve(parseMessage(buffer));
    });
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Bluetooth response timeout")), 500);
  });

  sendQueryMessage(gattServer);
  const status = await Promise.race([statusPromise, timeoutPromise]);

  await listenerCharacteristic.stopNotifications();
  return status;
}
async function sendQueryMessage(gattServer) {
  const service = await gattServer.getPrimaryService(
    "0000ae3a-0000-1000-8000-00805f9b34fb",
  );
  const listenerCharacteristic = await service.getCharacteristic(
    "0000ae3b-0000-1000-8000-00805f9b34fb",
  );

  const queryCommand = `${messageHeader}a303000000${messageFooter}`;

  const data = Buffer.from(queryCommand, "hex");
  await listenerCharacteristic.writeValue(data, { type: "command" });
}

export async function setFitRxMode(gattServer,mode) {
    if (mode < 0 || mode > 8) {
        throw new Error("Mode must be between 0 and 8");
    }
    const service = await gattServer.getPrimaryService(
        "0000ae3a-0000-1000-8000-00805f9b34fb",
    );
    const listenerCharacteristic = await service.getCharacteristic(
        "0000ae3b-0000-1000-8000-00805f9b34fb",
    );

    const level = 2;
    // `acad04a0000110${level}bcbd`
    // `acad04a111111105bcbd` 
    const levelCommand =        `acad04a11111110${mode}bcbd`
                           //    acad04a00000000${level}bcbd
    const data = Buffer.from(levelCommand, "hex");
    await listenerCharacteristic.writeValue(data, { type: "command" });
    console.log("listenerCharacteristic sent");
}

export async function setFitRxLevel(gattServer, level) {
  if (level < 0 || level > 9) {
    throw new Error("Level must be between 0 and 9");
  }
  const service = await gattServer.getPrimaryService(
    "0000ae3a-0000-1000-8000-00805f9b34fb",
  );
  const listenerCharacteristic = await service.getCharacteristic(
    "0000ae3b-0000-1000-8000-00805f9b34fb",
  );

  const levelCommand = `acad04a00000000${level}bcbd`;

  const data = Buffer.from(levelCommand, "hex");
  await listenerCharacteristic.writeValue(data, { type: "command" });
  console.log("listenerCharacteristic sent");
}

function parseMessage(buffer) {
  const info = buffer
    .toString("hex")
    .replace(messageHeader, "")
    .replace(messageFooter, "");

  return {
    level: Number(info.substring(2, 4)),
    mode: MODES[Number(info.substring(4, 6)) - 1],
  };
}
