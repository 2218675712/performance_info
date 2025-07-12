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

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-3/4 rounded bg-gray-700" />
      <div className="h-4 w-1/2 rounded bg-gray-700" />
      <div className="h-4 w-1/3 rounded bg-gray-700" />
      <div className="mt-4 h-16 rounded bg-gray-700" />
    </div>
  );
}

function renderCardContent<T>(
  isLoading: boolean,
  data: T | null,
  renderData: (data: T) => React.ReactNode,
  errorText: string,
) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  if (data) {
    return renderData(data);
  }
  return <p className="text-gray-400">{errorText}</p>;
}

function Performance() {
  const [isLoading, setIsLoading] = useState(true);
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
  const [isRecording, setIsRecording] = useState(false);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);

  const formatNetworkSpeed = (speedInMB: number) => {
    if (speedInMB < 1) {
      return `${(speedInMB * 1024).toFixed(2)} KB/s`;
    }
    return `${speedInMB.toFixed(2)} MB/s`;
  };

  const handleExport = () => {
    const formatTime = (date: Date) => {
      return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date
        .getHours()
        .toString()
        .padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date
        .getSeconds()
        .toString()
        .padStart(2, '0')}`;
    };

    const startTime = recordingStartTime ? formatTime(recordingStartTime) : '';
    const endTime = formatTime(new Date());
    const deviceName = cpuInfo
      ? `${cpuInfo.manufacturer} ${cpuInfo.brand}`
      : 'UnknownDevice';
    const fileName = `${startTime}-${endTime}-${deviceName}-performance.csv`;

    const csvContent = [
      Object.keys(performanceData[0]).join(','),
      ...performanceData.map((row) => {
        const formattedRow = {
          ...row,
          timestamp: formatTime(new Date(row.timestamp)),
          networkRxSpeed: formatNetworkSpeed(row.networkRxSpeed),
          networkTxSpeed: formatNetworkSpeed(row.networkTxSpeed),
        };
        return Object.values(formattedRow)
          .map((value) =>
            typeof value === 'number' ? value.toFixed(2) : value,
          )
          .join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const getStaticInfo = async () => {
      try {
        const cpu = await window.electron.systemInfo.getCpuInfo();
        const graphics = await window.electron.systemInfo.getGraphicsInfo();
        setCpuInfo(cpu);
        setGpuInfo(graphics);
      } catch (error) {
        console.error('获取静态系统信息时出错:', error);
      } finally {
        setIsLoading(false);
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

          setNetworkSpeed({
            rxSec: rxSec / 1024 / 1024,
            txSec: txSec / 1024 / 1024,
          });
          setNetworkRxSpeedHistory((prev) => {
            const newData = [...prev, rxSec / 1024 / 1024]; // in MB/s
            if (newData.length > 60) {
              return newData.slice(newData.length - 60);
            }
            return newData;
          });
          setNetworkTxSpeedHistory((prev) => {
            const newData = [...prev, txSec / 1024 / 1024]; // in MB/s
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

        if (isRecording) {
          const record = {
            timestamp: new Date().toISOString(),
            cpuUsage: load.currentLoad,
            memUsage: currentMemUsage,
            ...Object.keys(gpuUsages).reduce(
              (acc, key) => ({ ...acc, [`gpu_${key}_usage`]: gpuUsages[key] }),
              {},
            ),
            networkRxSpeed: networkSpeed.rxSec,
            networkTxSpeed: networkSpeed.txSec,
          };
          setPerformanceData((prev) => [...prev, record]);
        }
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
      <div className="flex justify-center space-x-4 mb-8">
        <button
          type="button"
          onClick={() => {
            setIsRecording(true);
            setRecordingStartTime(new Date());
            setPerformanceData([]);
          }}
          disabled={isRecording}
          className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 disabled:bg-gray-500"
        >
          开始录制
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRecording(false);
          }}
          disabled={!isRecording}
          className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 disabled:bg-gray-500"
        >
          结束录制
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={isRecording || performanceData.length === 0}
          className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 disabled:bg-gray-500"
        >
          导出
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Card */}
        <div className="bg-gray-900 bg-opacity-75 p-6 rounded-lg shadow-lg border border-cyan-700">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">CPU</h3>
          {renderCardContent(
            isLoading,
            cpuInfo,
            (data) => (
              <div className="space-y-2 text-base">
                <p>
                  <span className="font-semibold text-cyan-300">型号:</span>{' '}
                  {data.manufacturer} {data.brand}
                </p>
                <p>
                  <span className="font-semibold text-cyan-300">速度:</span>{' '}
                  {data.speed} GHz
                </p>
                <p>
                  <span className="font-semibold text-cyan-300">当前频率:</span>{' '}
                  {cpuSpeed.toFixed(2)} GHz
                </p>
                <p>
                  <span className="font-semibold text-cyan-300">核心数:</span>{' '}
                  {data.cores}
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
            ),
            '无法加载CPU信息。',
          )}
        </div>

        {/* GPU Card */}
        <div className="bg-gray-900 bg-opacity-75 p-6 rounded-lg shadow-lg border border-cyan-700">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">GPU</h3>
          {renderCardContent(
            isLoading,
            gpuInfo,
            (data) =>
              data.controllers.map((controller, index) => {
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
                      <span className="font-semibold text-cyan-300">
                        使用率:
                      </span>{' '}
                      {usage.toFixed(2)}%
                    </p>
                    <div className="mt-4">
                      <p className="text-cyan-300 mb-2">GPU 使用率 (%)</p>
                      <RealTimeChart data={history} color="#a78bfa" />
                    </div>
                  </div>
                );
              }),
            '无法加载GPU信息。',
          )}
        </div>

        {/* Memory Card */}
        <div className="bg-gray-900 bg-opacity-75 p-6 rounded-lg shadow-lg border border-cyan-700">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">内存</h3>
          {renderCardContent(
            isLoading,
            memInfo,
            (data) => (
              <div className="space-y-2 text-base">
                <p>
                  <span className="font-semibold text-cyan-300">总计:</span>{' '}
                  {(data.total / 1024 / 1024 / 1024).toFixed(2)} GB
                </p>
                <p>
                  <span className="font-semibold text-cyan-300">已用:</span>{' '}
                  {(data.used / 1024 / 1024 / 1024).toFixed(2)} GB
                </p>
                <p>
                  <span className="font-semibold text-cyan-300">空闲:</span>{' '}
                  {(data.free / 1024 / 1024 / 1024).toFixed(2)} GB
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
            ),
            '无法加载内存信息。',
          )}
        </div>

        {/* Network Card */}
        <div className="bg-gray-900 bg-opacity-75 p-6 rounded-lg shadow-lg border border-cyan-700">
          <h3 className="text-xl font-bold mb-4 text-cyan-400">网络</h3>
          {renderCardContent(
            isLoading,
            networkInfo,
            (data) => (
              <>
                {data
                  .filter((net) => net.operstate === 'up')
                  .map((net) => (
                    <div
                      key={net.iface}
                      className={`space-y-2 text-base pb-4 mb-4 border-b border-cyan-900 last:border-b-0 last:pb-0 last:mb-0 ${
                        (net as any).default
                          ? 'p-2 border-2 border-cyan-500 rounded-lg'
                          : ''
                      }`}
                    >
                      <p>
                        <span className="font-semibold text-cyan-300">
                          接口:
                        </span>{' '}
                        {net.iface} {(net as any).default && '(默认)'}
                      </p>
                      <p>
                        <span className="font-semibold text-cyan-300">
                          总接收:
                        </span>{' '}
                        {(net.rx_bytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p>
                        <span className="font-semibold text-cyan-300">
                          总发送:
                        </span>{' '}
                        {(net.tx_bytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                <div className="space-y-2 text-base mt-4">
                  <p>
                    <span className="font-semibold text-cyan-300">
                      下行速度:
                    </span>{' '}
                    {networkSpeed.rxSec.toFixed(2)} MB/s
                  </p>
                  <p>
                    <span className="font-semibold text-cyan-300">
                      上行速度:
                    </span>{' '}
                    {networkSpeed.txSec.toFixed(2)} MB/s
                  </p>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-cyan-300 mb-2">下行速度 (MB/s)</p>
                    <RealTimeChart
                      data={networkRxSpeedHistory}
                      color="#34d399"
                    />
                  </div>
                  <div>
                    <p className="text-cyan-300 mb-2">上行速度 (MB/s)</p>
                    <RealTimeChart
                      data={networkTxSpeedHistory}
                      color="#fb923c"
                    />
                  </div>
                </div>
              </>
            ),
            '无法加载网络信息。',
          )}
        </div>
      </div>
    </div>
  );
}

export default Performance;
