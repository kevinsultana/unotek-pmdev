export interface CalendarEventAttachment {
  id: number;
  name: string;
  mimetype?: string;
  file_size?: number;
  url: string;
}

export interface CalendarAttendee {
  id: number;
  partner: {
    id: number;
    name: string;
    email: string;
  };
  state: "accepted" | "needsAction" | "tentative" | "declined";
}

export interface CalendarPartner {
  id: number;
  name: string;
  email?: string;
}

export interface CalendarEvent {
  id: number;
  number?: string;
  name: string;
  description: string | null;
  start: string; // ISO datetime e.g. "2026-07-10T01:00:00"
  stop: string;  // ISO datetime e.g. "2026-07-10T08:00:00"
  start_date: string | null;
  stop_date: string | null;
  duration: number;
  allday: boolean;
  location: string | null;
  videocall_location: string | null;
  privacy: "public" | "private" | "confidential";
  show_as: "busy" | "free";
  user?: {
    id: number;
    name: string;
  } | null;
  partner_ids?: CalendarPartner[];
  attendee_ids?: CalendarAttendee[];
  recurrency?: boolean;
  attachment_count?: number;
  attachments?: CalendarEventAttachment[];
  create_date?: string;
  write_date?: string;
}

export interface CreateCalendarEventRequest {
  name: string;
  start: string;
  stop: string;
  description?: string;
  location?: string;
  videocall_location?: string;
  allday?: boolean;
  duration?: number;
  partner_ids?: number[];
  privacy?: "public" | "private" | "confidential";
  show_as?: "busy" | "free";
  attachment_ids?: number[];
}

export type UpdateCalendarEventRequest = Partial<CreateCalendarEventRequest>;
