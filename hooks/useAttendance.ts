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
      console.log(
        "GET /attendance/status error:",
        err?.response?.status,
        JSON.stringify(err?.response?.data, null, 2),
      );
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Gagal memuat status presensi";
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
      work_type?: "WFA" | "WFO" | "WFH";
    }) => {
      const res = await attendanceService.checkIn({
        photo: data.photo,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        work_type: data.work_type,
      });
      console.log(
        "POST /attendance/check-in response:",
        JSON.stringify(res.data, null, 2),
      );
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
