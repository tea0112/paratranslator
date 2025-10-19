import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  readJSONFile: (filePath: string) => ipcRenderer.invoke('file:readJSON', filePath),
  writeJSONFile: (filePath: string, data: unknown) => ipcRenderer.invoke('file:writeJSON', filePath, data)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
