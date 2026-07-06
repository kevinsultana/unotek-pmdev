import { useCallback, useEffect, useState } from "react";
import { taskService } from "../services/taskService";
import type { Task } from "../types/task";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadMore, setIsLoadMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"my" | "all">("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = useCallback(async (pageToFetch = 1) => {
    try {
      if (pageToFetch === 1) {
        setIsLoading(true);
      } else {
        setIsLoadMore(true);
      }
      setError(null);
      const params: {
        my_tasks?: boolean;
        search?: string;
        page: number;
        per_page: number;
      } = {
        page: pageToFetch,
        per_page: 25,
      };

      params.my_tasks = filter === "my";
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await taskService.list(params);
      const newTasks = res.data.data || [];
      const pag = res.data.pagination;

      if (pageToFetch === 1) {
        setTasks(newTasks);
      } else {
        setTasks((prev) => [...prev, ...newTasks]);
      }

      setPage(pageToFetch);
      if (pag) {
        setTotalPages(pag.total_pages);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Gagal memuat daftar tugas";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsLoadMore(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !isLoading && !isLoadMore) {
      fetchTasks(page + 1);
    }
  }, [page, totalPages, isLoading, isLoadMore, fetchTasks]);

  const refresh = useCallback(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    isLoadMore,
    error,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    refresh,
    loadMore,
    hasMore: page < totalPages,
  };
}
