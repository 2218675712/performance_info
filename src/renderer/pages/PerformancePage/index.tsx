import './PerformancePage.css';
import 'tailwindcss/tailwind.css';

import React, { useEffect, useState, useRef } from 'react';
import type { Systeminformation } from 'systeminformation';

import type { ElectronHandler } from '../../../main/preload';

// 从preload.d.ts中获取类型
declare global {
  interface Window {
    electron: ElectronHandler;
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
  const [cpuSpeed, setCpuSpeed] = useState<number>(0);
  const [networkSpeed, setNetworkSpeed] = useState({ rxSec: 0, txSec: 0 });
  const lastNetworkInfoRef = useRef<
    Systeminformation.NetworkStatsData[] | null
  >(null);

  useEffect(() => {
    const getStaticInfo = async () => {
      try {
        const cpu = await window.electron.systemInfo.getCpuInfo();
        const graphics = await window.electron.systemInfo.getGraphicsInfo();
        setCpuInfo(cpu);
        setGpuInfo(graphics);
      } catch (error) {
        console.error('获取静态系统信息时出错:', error);
      }
    };

    const getDynamicInfo = async () => {
      try {
        const mem = await window.electron.systemInfo.getMemInfo();
        const network = await window.electron.systemInfo.getNetworkInfo();
        const load = await window.electron.systemInfo.getCpuCurrentLoad();
        const speed = await window.electron.systemInfo.getCpuSpeed();

        if (lastNetworkInfoRef.current) {
          const rxSec = network.reduce((acc, net, i) => {
            return (
              acc +
              (net.rx_bytes - (lastNetworkInfoRef.current?.[i]?.rx_bytes || 0))
            );
          }, 0);
          const txSec = network.reduce((acc, net, i) => {
            return (
              acc +
              (net.tx_bytes - (lastNetworkInfoRef.current?.[i]?.tx_bytes || 0))
            );
          }, 0);
          setNetworkSpeed({ rxSec, txSec });
        }

        setMemInfo(mem);
        setNetworkInfo(network);
        setCpuUsage(load.currentLoad);
        setCpuSpeed(speed.avg);
        lastNetworkInfoRef.current = network;
      } catch (error) {
        console.error('获取动态系统信息时出错:', error);
      }
    };

    getStaticInfo();
    getDynamicInfo();

    const interval = setInterval(getDynamicInfo, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-black text-gray-300 min-h-screen font-sans tech-background">
      <h2 className="text-3xl font-bold mb-8 text-center text-cyan-400 glow">
        系统性能监控
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Card */}
        <div className="bg-gray-900 bg-opacity-75 p-6 rounded-lg shadow-lg border border-cyan-700">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">CPU</h3>
          {cpuInfo ? (
            <div className="space-y-2 text-base">
              <p>
                <span className="font-semibold text-cyan-300">型号:</span>{' '}
                {cpuInfo.manufacturer} {cpuInfo.brand}
              </p>
              <p>
                <span className="font-semibold text-cyan-300">速度:</span>{' '}
                {cpuInfo.speed} GHz
              </p>
              <p>
                <span className="font-semibold text-cyan-300">当前频率:</span>{' '}
                {cpuSpeed.toFixed(2)} GHz
              </p>
              <p>
                <span className="font-semibold text-cyan-300">核心数:</span>{' '}
                {cpuInfo.cores}
              </p>
              <p>
                <span className="font-semibold text-cyan-300">使用率:</span>{' '}
                {cpuUsage.toFixed(2)}%
              </p>
            </div>
          ) : (
            <p className="text-gray-400">无法加载CPU信息。</p>
          )}
        </div>

        {/* GPU Card */}
        <div className="bg-gray-900 bg-opacity-75 p-6 rounded-lg shadow-lg border border-cyan-700">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">GPU</h3>
          {gpuInfo ? (
            gpuInfo.controllers.map((controller) => (
              <div
                key={controller.model || controller.vendor}
                className="space-y-2 text-base"
              >
                <p>
                  <span className="font-semibold text-cyan-300">型号:</span>{' '}
                  {controller.model}
                </p>
                <p>
                  <span className="font-semibold text-cyan-300">厂商:</span>{' '}
                  {controller.vendor}
                </p>
                <p>
                  <span className="font-semibold text-cyan-300">显存:</span>{' '}
                  {controller.vram} MB
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">无法加载GPU信息。</p>
          )}
        </div>

        {/* Memory Card */}
        <div className="bg-gray-900 bg-opacity-75 p-6 rounded-lg shadow-lg border border-cyan-700">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">内存</h3>
          {memInfo ? (
            <div className="space-y-2 text-base">
              <p>
                <span className="font-semibold text-cyan-300">总计:</span>{' '}
                {(memInfo.total / 1024 / 1024 / 1024).toFixed(2)} GB
              </p>
              <p>
                <span className="font-semibold text-cyan-300">已用:</span>{' '}
                {(memInfo.used / 1024 / 1024 / 1024).toFixed(2)} GB
              </p>
              <p>
                <span className="font-semibold text-cyan-300">空闲:</span>{' '}
                {(memInfo.free / 1024 / 1024 / 1024).toFixed(2)} GB
              </p>
            </div>
          ) : (
            <p className="text-gray-400">无法加载内存信息。</p>
          )}
        </div>

        {/* Network Card */}
        <div className="bg-gray-900 bg-opacity-75 p-6 rounded-lg shadow-lg border border-cyan-700">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">网络</h3>
          {networkInfo ? (
            <>
              {networkInfo.map((net) => (
                <div key={net.iface} className="space-y-2 text-base">
                  <p>
                    <span className="font-semibold text-cyan-300">接口:</span>{' '}
                    {net.iface}
                  </p>
                  <p>
                    <span className="font-semibold text-cyan-300">总接收:</span>{' '}
                    {(net.rx_bytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p>
                    <span className="font-semibold text-cyan-300">总发送:</span>{' '}
                    {(net.tx_bytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ))}
              <div className="space-y-2 text-base mt-4">
                <p>
                  <span className="font-semibold text-cyan-300">下行速度:</span>{' '}
                  {(networkSpeed.rxSec / 1024).toFixed(2)} KB/s
                </p>
                <p>
                  <span className="font-semibold text-cyan-300">上行速度:</span>{' '}
                  {(networkSpeed.txSec / 1024).toFixed(2)} KB/s
                </p>
              </div>
            </>
          ) : (
            <p className="text-gray-400">无法加载网络信息。</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Performance;
