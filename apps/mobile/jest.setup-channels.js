// Node's real BroadcastChannel opens MessagePorts even in the Expo test runtime.
// Preserve messaging semantics and close every channel owned by the test context.
const NativeBroadcastChannel = globalThis.BroadcastChannel;
if (NativeBroadcastChannel) {
  const channels = new Set();
  globalThis.BroadcastChannel = class TestBroadcastChannel extends NativeBroadcastChannel {
    constructor(...args) { super(...args); channels.add(this); }
    close() { channels.delete(this); return super.close(); }
  };
  afterAll(() => { for (const channel of channels) channel.close(); });
}
