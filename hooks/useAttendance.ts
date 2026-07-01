import { useCallback, useEffect, useState } from "react";
import { attendanceService } from "../services/attendanceService";
import type { AttendanceStatus } from "../types/attendance";

export function useAttendance() {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await attendanceService.getStatus();
      setStatus(res.data.data);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Gagal memuat status presensi";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const checkIn = useCallback(
    async (data: {
      photo?: string;
      latitude: number;
      longitude: number;
      address?: string;
    }) => {
      const res = await attendanceService.checkIn({
        photo: data.photo,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
      });
      await fetchStatus();
      return res.data;
    },
    [fetchStatus],
  );

  const checkOut = useCallback(
    async (data: {
      photo?: string;
      latitude: number;
      longitude: number;
      address?: string;
    }) => {
      const res = await attendanceService.checkOut({
        photo: data.photo,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
      });
      await fetchStatus();
      return res.data;
    },
    [fetchStatus],
  );

  return {
    status,
    isLoading,
    error,
    checkIn,
    checkOut,
    refresh: fetchStatus,
  };
}
