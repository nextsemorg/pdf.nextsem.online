const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openPdf: () => ipcRenderer.invoke('dialog:openPdf'),
  savePdf: (payload) => ipcRenderer.invoke('dialog:savePdf', payload),
  print: () => window.print()
});
