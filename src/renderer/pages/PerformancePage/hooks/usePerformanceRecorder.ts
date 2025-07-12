import { useState, useEffect } from 'react';
import type { Systeminformation } from 'systeminformation';

export default function usePerformanceRecorder(
  cpuInfo: Systeminformation.CpuData | null,
  gpuUsages: { [key: string]: number },
  memUsage: number,
  cpuUsage: number,
  networkSpeed: { rxSec: number; txSec: number },
) {
  const [isRecording, setIsRecording] = useState(false);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(
    null,
  );

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
        .padStart(
          2,
          '0',
        )}-${date.getMinutes().toString().padStart(2, '0')}-${date
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
    if (isRecording) {
      const record = {
        timestamp: new Date().toISOString(),
        cpuUsage,
        memUsage,
        ...Object.keys(gpuUsages).reduce(
          (acc, key) => ({ ...acc, [`gpu_${key}_usage`]: gpuUsages[key] }),
          {},
        ),
        networkRxSpeed: networkSpeed.rxSec,
        networkTxSpeed: networkSpeed.txSec,
      };
      setPerformanceData((prev) => [...prev, record]);
    }
  }, [isRecording, cpuUsage, memUsage, gpuUsages, networkSpeed]);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(new Date());
    setPerformanceData([]);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  return {
    isRecording,
    performanceData,
    startRecording,
    stopRecording,
    handleExport,
  };
}
