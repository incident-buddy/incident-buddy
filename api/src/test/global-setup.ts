import { connect } from "node:net";

/**
 * Firestore エミュレータが起動しているか TCP で確認する。
 * 起動していない場合は明確なエラーメッセージで早期終了させる。
 */
function checkFirestoreEmulator(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST ?? "firestore:8080";
  const [hostname, portStr] = host.split(":");
  const port = Number(portStr ?? 8080);

  return new Promise((resolve, reject) => {
    const socket = connect({ host: hostname, port }, () => {
      socket.destroy();
      resolve();
    });
    socket.on("error", () => {
      reject(
        new Error(
          `Firestore emulator is not running at ${host}.\n` +
            "Run 'mise run dev:firestore' before running tests.",
        ),
      );
    });
    socket.setTimeout(2000, () => {
      socket.destroy();
      reject(
        new Error(`Timed out connecting to Firestore emulator at ${host}.`),
      );
    });
  });
}

export async function setup() {
  await checkFirestoreEmulator();
}
