declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage(
          channel:
            | 'ipc-example'
            | 'minimize-window'
            | 'maximize-window'
            | 'close-window',
          ...args: unknown[]
        ): void;
        on(
          channel: 'ipc-example',
          func: (...args: unknown[]) => void,
        ): () => void;
        once(channel: 'ipc-example', func: (...args: unknown[]) => void): void;
      };
    };
  }
}
