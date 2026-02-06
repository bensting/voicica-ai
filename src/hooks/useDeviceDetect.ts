'use client';

import { useState, useEffect } from 'react';

interface DeviceInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isDesktop: boolean;
}

export function useDeviceDetect(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isAndroid: false,
    isIOS: false,
    isMobile: false,
    isDesktop: true,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();

    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isMobile = isAndroid || isIOS || /mobile/.test(userAgent);

    setDeviceInfo({
      isAndroid,
      isIOS,
      isMobile,
      isDesktop: !isMobile,
    });
  }, []);

  return deviceInfo;
}
