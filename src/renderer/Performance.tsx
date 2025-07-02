import React, { useEffect, useState } from 'react';
import type { Systeminformation } from 'systeminformation';

// 从preload.d.ts中获取类型
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage: (channel: string, ...args: unknown[]) => void;
        on: (channel: string, func: (...args: unknown[]) => void) => () => void;
        once: (channel: string, func: (...args: unknown[]) => void) => void;
      };
      systemInfo: {
        getCpuInfo: () => Promise<Systeminformation.CpuData>;
        getGraphicsInfo: () => Promise<Systeminformation.GraphicsData>;
        getMemInfo: () => Promise<Systeminformation.MemData>;
        getNetworkInfo: () => Promise<Systeminformation.NetworkStatsData[]>;
      };
    };
  }
}

function Performance() {
  const [cpuInfo, setCpuInfo] = useState<Systeminformation.CpuData>();
  const [gpuInfo, setGpuInfo] = useState<Systeminformation.GraphicsData>();
  const [memInfo, setMemInfo] = useState<Systeminformation.MemData>();
  const [networkInfo, setNetworkInfo] =
    useState<Systeminformation.NetworkStatsData[]>();
  const [cpuUsage, setCpuUsage] = useState<number>(0);

  useEffect(() => {
    const getSystemInfo = async () => {
      try {
        // 通过IPC获取系统信息
        const cpu = await window.electron.systemInfo.getCpuInfo();
        const graphics = await window.electron.systemInfo.getGraphicsInfo();
        const mem = await window.electron.systemInfo.getMemInfo();
        const network = await window.electron.systemInfo.getNetworkInfo();

        setCpuInfo(cpu);
        setGpuInfo(graphics);
        setMemInfo(mem);
        setNetworkInfo(network);
      
        // 这里我们使用CPU速度作为一个示例值
        // 在实际应用中，应该使用currentLoad()获取CPU使用率
        setCpuUsage(cpu.speed);
      } catch (error) {
        console.error('获取系统信息时出错:', error);
      }
    };

    getSystemInfo();
    const interval = setInterval(getSystemInfo, 2000); // 每2秒更新一次

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4">System Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">CPU</h3>
          {cpuInfo ? (
            <div>
              <p>
                Model: {cpuInfo.manufacturer} {cpuInfo.brand}
              </p>
              <p>速度: {cpuInfo.speed} GHz</p>
              <p>核心数: {cpuInfo.cores}</p>
              <p>使用率: {cpuUsage.toFixed(2)}%</p>
            </div>
          ) : (
            <p>Loading CPU info...</p>
          )}
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">GPU</h3>
          {gpuInfo ? (
            gpuInfo.controllers.map((controller) => (
              <div key={controller.model || controller.vendor}>
                <p>Model: {controller.model}</p>
                <p>Vendor: {controller.vendor}</p>
                <p>VRAM: {controller.vram} MB</p>
              </div>
            ))
          ) : (
            <p>Loading GPU info...</p>
          )}
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Memory</h3>
          {memInfo ? (
            <div>
              <p>Total: {(memInfo.total / 1024 / 1024 / 1024).toFixed(2)} GB</p>
              <p>Used: {(memInfo.used / 1024 / 1024 / 1024).toFixed(2)} GB</p>
              <p>Free: {(memInfo.free / 1024 / 1024 / 1024).toFixed(2)} GB</p>
            </div>
          ) : (
            <p>Loading Memory info...</p>
          )}
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Network</h3>
          {networkInfo ? (
            networkInfo.map((net) => (
              <div key={net.iface}>
                <p>Interface: {net.iface}</p>
                <p>Received: {(net.rx_bytes / 1024 / 1024).toFixed(2)} MB</p>
                <p>Transferred: {(net.tx_bytes / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ))
          ) : (
            <p>Loading Network info...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Performance;
