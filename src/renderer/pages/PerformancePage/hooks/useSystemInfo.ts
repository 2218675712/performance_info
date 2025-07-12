import { useState, useEffect, useRef } from 'react';
import type { Systeminformation } from 'systeminformation';
import _ from 'lodash';

export default function useSystemInfo() {
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
          return newData.length > 60
            ? newData.slice(newData.length - 60)
            : newData;
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
            return newData.length > 60
              ? newData.slice(newData.length - 60)
              : newData;
          });
          setNetworkTxSpeedHistory((prev) => {
            const newData = [...prev, txSec / 1024 / 1024]; // in MB/s
            return newData.length > 60
              ? newData.slice(newData.length - 60)
              : newData;
          });
        }

        setNetworkInfo(network);
        setCpuUsage(load.currentLoad);
        setCpuUsageHistory((prev) => {
          const newData = [...prev, load.currentLoad];
          return newData.length > 60
            ? newData.slice(newData.length - 60)
            : newData;
        });

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
    const interval = setInterval(getDynamicInfo, 1000);

    return () => clearInterval(interval);
  }, [gpuInfo]);

  return {
    isLoading,
    cpuInfo,
    gpuInfo,
    memInfo,
    networkInfo,
    cpuUsage,
    memUsage,
    gpuUsages,
    cpuUsageHistory,
    gpuUsageHistories,
    memUsageHistory,
    networkRxSpeedHistory,
    networkTxSpeedHistory,
    cpuSpeed,
    networkSpeed,
  };
}
