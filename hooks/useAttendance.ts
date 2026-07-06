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
      photoUri?: string | null;
      latitude: number;
      longitude: number;
      work_type: "WFA" | "WFO" | "WFH";
    }) => {
      let photo_id: number | null = null;
      if (data.photoUri) {
        const formData = new FormData();
        formData.append("photo", {
          uri: data.photoUri,
          name: "photo.jpg",
          type: "image/jpeg",
        } as any);
        const uploadRes = await attendanceService.uploadPhoto(formData);
        photo_id = uploadRes.data.data.photo_id;
      }

      const res = await attendanceService.checkIn({
        attendance_type: data.work_type.toLowerCase() as "wfo" | "wfh" | "wfa",
        latitude: data.latitude,
        longitude: data.longitude,
        photo_id,
      });
      await fetchStatus();
      return res.data;
    },
    [fetchStatus],
  );

  const checkOut = useCallback(
    async (data: {
      photoUri?: string | null;
      latitude: number;
      longitude: number;
    }) => {
      let photo_id: number | null = null;
      if (data.photoUri) {
        const formData = new FormData();
        formData.append("photo", {
          uri: data.photoUri,
          name: "photo.jpg",
          type: "image/jpeg",
        } as any);
        const uploadRes = await attendanceService.uploadPhoto(formData);
        photo_id = uploadRes.data.data.photo_id;
      }

      const res = await attendanceService.checkOut({
        latitude: data.latitude,
        longitude: data.longitude,
        photo_id,
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
