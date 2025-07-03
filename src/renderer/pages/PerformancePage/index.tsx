import './PerformancePage.css';
import 'tailwindcss/tailwind.css';

import React, { useEffect, useState, useRef } from 'react';
import type { Systeminformation } from 'systeminformation';
import _ from 'lodash';

import type { ElectronHandler } from '../../../main/preload';
import RealTimeChart from './components/RealTimeChart';

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
  const [memUsage, setMemUsage] = useState<number>(0);
  const [gpuUsages, setGpuUsages] = useState<{ [key: string]: number }>({});
  const [cpuUsageHistory, setCpuUsageHistory] = useState<number[]>([]);
  const [gpuUsageHistories, setGpuUsageHistories] = useState<{
    [key: string]: number[];
  }>({});
  const [memUsageHistory, setMemUsageHistory] = useState<number[]>([]);
  const [networkRxSpeedHistory, setNetworkRxSpeedHistory] = useState<number[]>(
    [],
  );
  const [networkTxSpeedHistory, setNetworkTxSpeedHistory] = useState<number[]>(
    [],
  );
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

        const currentMemUsage = (mem.used / mem.total) * 100;
        setMemInfo(mem);
        setMemUsage(currentMemUsage);
        setMemUsageHistory((prev) => {
          const newData = [...prev, currentMemUsage];
          if (newData.length > 60) {
            return newData.slice(newData.length - 60);
          }
          return newData;
        });

        if (lastNetworkInfoRef.current) {
          const currentRx = _.sumBy(network, 'rx_bytes');
          const lastRx = _.sumBy(lastNetworkInfoRef.current, 'rx_bytes');
          const currentTx = _.sumBy(network, 'tx_bytes');
          const lastTx = _.sumBy(lastNetworkInfoRef.current, 'tx_bytes');

          const rxSec = currentRx - lastRx;
          const txSec = currentTx - lastTx;

          setNetworkSpeed({ rxSec, txSec });
          setNetworkRxSpeedHistory((prev) => {
            const newData = [...prev, rxSec / 1024]; // in KB/s
            if (newData.length > 60) {
              return newData.slice(newData.length - 60);
            }
            return newData;
          });
          setNetworkTxSpeedHistory((prev) => {
            const newData = [...prev, txSec / 1024]; // in KB/s
            if (newData.length > 60) {
              return newData.slice(newData.length - 60);
            }
            return newData;
          });
        }

        setNetworkInfo(network);
        setCpuUsage(load.currentLoad);
        setCpuUsageHistory((prev) => {
          const newData = [...prev, load.currentLoad];
          if (newData.length > 60) {
            return newData.slice(newData.length - 60);
          }
          return newData;
        });
        // Simulate GPU usage for demonstration
        if (gpuInfo) {
          const newUsages: { [key: string]: number } = {};
          gpuInfo.controllers.forEach((controller) => {
            const key = controller.model || controller.vendor;
            newUsages[key] = Math.random() * 100;
          });
          setGpuUsages(newUsages);

          setGpuUsageHistories((prevHistories) => {
            const updatedHistories = { ...prevHistories };
            Object.keys(newUsages).forEach((key) => {
              const usage = newUsages[key];
              const history = updatedHistories[key]
                ? [...updatedHistories[key], usage]
                : [usage];
              if (history.length > 60) {
                updatedHistories[key] = history.slice(history.length - 60);
              } else {
                updatedHistories[key] = history;
              }
            });
            return updatedHistories;
          });
        }
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
  }, [gpuInfo]);

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
              <div className="mt-4">
                <p className="text-cyan-300 mb-2">CPU 使用率 (%)</p>
                <RealTimeChart data={cpuUsageHistory} color="#38bdf8" />
              </div>
            </div>
          ) : (
            <p className="text-gray-400">无法加载CPU信息。</p>
          )}
        </div>

        {/* GPU Card */}
        <div className="bg-gray-900 bg-opacity-75 p-6 rounded-lg shadow-lg border border-cyan-700">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">GPU</h3>
          {gpuInfo ? (
            gpuInfo.controllers.map((controller, index) => {
              const key = controller.model || controller.vendor || index;
              const history = gpuUsageHistories[key] || [];
              const usage = gpuUsages[key] || 0;
              return (
                <div
                  key={key}
                  className="space-y-2 text-base border-b border-cyan-900 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
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
                  <p>
                    <span className="font-semibold text-cyan-300">使用率:</span>{' '}
                    {usage.toFixed(2)}%
                  </p>
                  <div className="mt-4">
                    <p className="text-cyan-300 mb-2">GPU 使用率 (%)</p>
                    <RealTimeChart data={history} color="#a78bfa" />
                  </div>
                </div>
              );
            })
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
              <p>
                <span className="font-semibold text-cyan-300">使用率:</span>{' '}
                {memUsage.toFixed(2)}%
              </p>
              <div className="mt-4">
                <p className="text-cyan-300 mb-2">内存使用率 (%)</p>
                <RealTimeChart data={memUsageHistory} color="#f87171" />
              </div>
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
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-cyan-300 mb-2">下行速度 (KB/s)</p>
                  <RealTimeChart data={networkRxSpeedHistory} color="#34d399" />
                </div>
                <div>
                  <p className="text-cyan-300 mb-2">上行速度 (KB/s)</p>
                  <RealTimeChart data={networkTxSpeedHistory} color="#fb923c" />
                </div>
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
