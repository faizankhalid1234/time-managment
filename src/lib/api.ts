function resolveApiUrl() {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "/api").trim().replace(/\/$/, "");
  if (!raw || /localhost|127\.0\.0\.1/i.test(raw)) return "/api";
  return raw;
}

const API_URL = resolveApiUrl();

export type User = { id: string; name: string; email: string };

export type Duration = {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  label: string;
};

export type Project = {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: "idle" | "running";
  totalSeconds: number;
  sessionStartedAt: string | null;
  sessionStartedPk: string | null;
  createdAt: string;
  createdAtPk: string;
  updatedAt: string;
  lastSessionAt?: string;
  lastSessionPk?: string;
  liveSeconds: number;
  duration: Duration;
  currentElapsed: number;
};

export type Session = {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  startAt: string;
  endAt: string;
  startPk: string;
  endPk: string;
  dateKey: string;
  weekday: string;
  durationSeconds: number;
  duration: Duration;
};

export type NowPk = {
  year: string;
  month: string;
  day: string;
  weekday: string;
  displayDate: string;
  displayTime: string;
  dateKey: string;
  iso: string;
};

export type WeeklyStats = {
  weekKeys: string[];
  dayLabels: { key: string; label: string; date: string }[];
  series: {
    projectId: string;
    projectName: string;
    totalSeconds: number;
    hours: number;
    duration: Duration;
    byDay: Record<string, number>;
  }[];
  totalSeconds: number;
  nowPk: NowPk;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("luma_token");
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "ERROR", status = 500) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Could not reach the server. Please try again.", "NETWORK", 0);
  }

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  };

  if (!res.ok) {
    throw new ApiError(
      data.error || "Something went wrong",
      data.code || "ERROR",
      res.status,
    );
  }
  return data as T;
}

export const api = {
  signup: (body: { name: string; email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () => request<{ user: User }>("/auth/me"),

  projects: () => request<{ projects: Project[]; nowPk: NowPk }>("/projects"),

  createProject: (body: { name: string; description?: string }) =>
    request<{ project: Project }>("/projects", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  start: (id: string) =>
    request<{ project: Project; nowPk: NowPk }>(`/projects/${id}/start`, {
      method: "POST",
    }),

  stop: (id: string) =>
    request<{ project: Project; session: Session; nowPk: NowPk }>(
      `/projects/${id}/stop`,
      { method: "POST" },
    ),

  remove: (id: string) =>
    request<{ ok: boolean }>(`/projects/${id}`, { method: "DELETE" }),

  history: () =>
    request<{ sessions: Session[]; nowPk: NowPk }>(
      "/projects/history/sessions",
    ),

  weekly: () => request<WeeklyStats>("/projects/stats/weekly"),
};
