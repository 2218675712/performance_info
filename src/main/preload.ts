// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example' | 'get-system-info' | 'system-info';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  systemInfo: {
    getCpuInfo: () => ipcRenderer.invoke('get-system-info', 'cpu'),
    getGraphicsInfo: () => ipcRenderer.invoke('get-system-info', 'graphics'),
    getMemInfo: () => ipcRenderer.invoke('get-system-info', 'mem'),
    getNetworkInfo: () => ipcRenderer.invoke('get-system-info', 'network'),
    getCpuCurrentLoad: () => ipcRenderer.invoke('get-cpu-current-load'),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
