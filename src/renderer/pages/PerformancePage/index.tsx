import './PerformancePage.css';
import "tailwindcss/tailwind.css";

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
  const [cpuInfo, setCpuInfo] = useState<Systeminformation.CpuData | null>(
    null,
  );
  const [gpuInfo, setGpuInfo] = useState<Systeminformation.GraphicsData | null>(
    null,
  );
  const [memInfo, setMemInfo] = useState<Systeminformation.MemData | null>(
    null,
  );
  const [networkInfo, setNetworkInfo] = useState<
    Systeminformation.NetworkStatsData[] | null
  >(null);
  const [cpuUsage, setCpuUsage] = useState<number>(0);

  useEffect(() => {
    const getSystemInfo = async () => {
      try {
        const cpu = await window.electron.systemInfo.getCpuInfo();
        const graphics = await window.electron.systemInfo.getGraphicsInfo();
        const mem = await window.electron.systemInfo.getMemInfo();
        const network = await window.electron.systemInfo.getNetworkInfo();

        setCpuInfo(cpu);
        setGpuInfo(graphics);
        setMemInfo(mem);
        setNetworkInfo(network);
        setCpuUsage(cpu.speed); // 示例值，实际应使用currentLoad()
      } catch (error) {
        console.error('获取系统信息时出错:', error);
      }
    };

    getSystemInfo();

    const interval = setInterval(getSystemInfo, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-gray-100 text-gray-800 min-h-screen font-sans">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
        系统性能监控
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">CPU</h3>
          {cpuInfo ? (
            <div className="space-y-2 text-base">
              <p>
                <span className="font-semibold text-gray-600">型号:</span>{' '}
                {cpuInfo.manufacturer} {cpuInfo.brand}
              </p>
              <p>
                <span className="font-semibold text-gray-600">速度:</span>{' '}
                {cpuInfo.speed} GHz
              </p>
              <p>
                <span className="font-semibold text-gray-600">核心数:</span>{' '}
                {cpuInfo.cores}
              </p>
              <p>
                <span className="font-semibold text-gray-600">使用率:</span>{' '}
                {cpuUsage.toFixed(2)}%
              </p>
            </div>
          ) : (
            <p className="text-gray-500">无法加载CPU信息。</p>
          )}
        </div>

        {/* GPU Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">GPU</h3>
          {gpuInfo ? (
            gpuInfo.controllers.map((controller) => (
              <div
                key={controller.model || controller.vendor}
                className="space-y-2 text-base"
              >
                <p>
                  <span className="font-semibold text-gray-600">型号:</span>{' '}
                  {controller.model}
                </p>
                <p>
                  <span className="font-semibold text-gray-600">厂商:</span>{' '}
                  {controller.vendor}
                </p>
                <p>
                  <span className="font-semibold text-gray-600">显存:</span>{' '}
                  {controller.vram} MB
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">无法加载GPU信息。</p>
          )}
        </div>

        {/* Memory Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">内存</h3>
          {memInfo ? (
            <div className="space-y-2 text-base">
              <p>
                <span className="font-semibold text-gray-600">总计:</span>{' '}
                {(memInfo.total / 1024 / 1024 / 1024).toFixed(2)} GB
              </p>
              <p>
                <span className="font-semibold text-gray-600">已用:</span>{' '}
                {(memInfo.used / 1024 / 1024 / 1024).toFixed(2)} GB
              </p>
              <p>
                <span className="font-semibold text-gray-600">空闲:</span>{' '}
                {(memInfo.free / 1024 / 1024 / 1024).toFixed(2)} GB
              </p>
            </div>
          ) : (
            <p className="text-gray-500">无法加载内存信息。</p>
          )}
        </div>

        {/* Network Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">网络</h3>
          {networkInfo ? (
            networkInfo.map((net) => (
              <div key={net.iface} className="space-y-2 text-base">
                <p>
                  <span className="font-semibold text-gray-600">接口:</span>{' '}
                  {net.iface}
                </p>
                <p>
                  <span className="font-semibold text-gray-600">接收:</span>{' '}
                  {(net.rx_bytes / 1024 / 1024).toFixed(2)} MB
                </p>
                <p>
                  <span className="font-semibold text-gray-600">发送:</span>{' '}
                  {(net.tx_bytes / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">无法加载网络信息。</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Performance;
