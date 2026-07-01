import { useCallback, useEffect, useState } from "react";
import { taskService } from "../services/taskService";
import type { Task } from "../types/task";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, unknown> = { my_tasks: true };

      // Map UI filter ("all", "todo", "in_progress", "done") to API stage_id
      // Note: These stage_id values need to be verified against the actual API
      if (filter !== "all") {
        const stageMap: Record<string, number> = {
          todo: 1,
          in_progress: 2,
          done: 3,
        };
        params.stage_id = stageMap[filter] || undefined;
      }

      const res = await taskService.list(params);
      setTasks(res.data.data.items || []);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Gagal memuat daftar tugas";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleStatus = useCallback(
    async (id: number, currentStageId?: number) => {
      // Cycle through stages: todo(1) -> in_progress(2) -> done(3) -> todo(1)
      const cycle: Record<number, number> = { 1: 2, 2: 3, 3: 1 };
      const nextStageId = currentStageId
        ? cycle[currentStageId] || 1
        : 2;

      await taskService.update(id, { stage_id: nextStageId });
      await fetchTasks();
    },
    [fetchTasks],
  );

  return {
    tasks,
    isLoading,
    error,
    filter,
    setFilter,
    toggleStatus,
    refresh: fetchTasks,
  };
}
