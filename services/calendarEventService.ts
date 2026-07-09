import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type {
  CalendarEvent,
  CalendarEventAttachment,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from "../types/calendarEvent";

export const calendarEventService = {
  list: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
    my_events?: boolean;
    user_id?: number;
  }) =>
    api.get<{
      success: boolean;
      data: CalendarEvent[];
      pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
      };
    }>("/calendar-events", { params }),

  getById: (id: number) =>
    api.get<ApiResponse<CalendarEvent>>(`/calendar-events/${id}`),

  create: (data: CreateCalendarEventRequest) =>
    api.post<ApiResponse<CalendarEvent>>("/calendar-events", data),

  update: (id: number, data: UpdateCalendarEventRequest) =>
    api.put<ApiResponse<CalendarEvent>>(`/calendar-events/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/calendar-events/${id}`),

  listAttachments: (eventId: number) =>
    api.get<ApiResponse<CalendarEventAttachment[]>>(`/calendar-events/${eventId}/attachments`),

  uploadAttachment: async (fileUri: string, eventId?: number) => {
    const formData = new FormData();
    const uriParts = fileUri.split(".");
    const fileExtension = uriParts[uriParts.length - 1] || "jpg";

    formData.append("file", {
      uri: fileUri,
      name: `attachment_${Date.now()}.${fileExtension}`,
      type: `image/${fileExtension === "png" ? "png" : "jpeg"}`,
    } as any);

    if (eventId !== undefined) {
      formData.append("event_id", String(eventId));
    }

    return api.post<ApiResponse<CalendarEventAttachment>>(
      "/calendar-events/upload-attachment",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  deleteAttachment: (attachmentId: number) =>
    api.delete<ApiResponse<null>>(`/calendar-events/attachments/${attachmentId}`),
};
