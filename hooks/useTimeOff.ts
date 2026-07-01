import { useCallback, useEffect, useState } from "react";
import { timeOffService } from "../services/timeOffService";
import type {
  TimeOffBalanceItem,
  TimeOffType,
  CreateTimeOffRequest,
} from "../types/timeOff";

export function useTimeOff() {
  const [balances, setBalances] = useState<TimeOffBalanceItem[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [balRes, typeRes] = await Promise.all([
        timeOffService.getBalance(),
        timeOffService.getTypes(),
      ]);
      setBalances(Array.isArray(balRes.data.data) ? balRes.data.data : []);
      setTypes(Array.isArray(typeRes.data.data) ? typeRes.data.data : []);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Gagal memuat data cuti";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createTimeOff = useCallback(
    async (data: CreateTimeOffRequest) => {
      const res = await timeOffService.create(data);
      await fetchData();
      return res.data;
    },
    [fetchData],
  );

  return {
    balances,
    types,
    isLoading,
    error,
    createTimeOff,
    refresh: fetchData,
  };
}
