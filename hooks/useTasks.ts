import { useCallback, useEffect, useState } from "react";
import { taskService } from "../services/taskService";
import type { Task } from "../types/task";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"my" | "all">("my");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: {
        my_tasks?: boolean;
        search?: string;
      } = {};

      params.my_tasks = filter === "my";
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await taskService.list(params);
      setTasks(res.data.data || []);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Gagal memuat daftar tugas";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    refresh: fetchTasks,
  };
}
