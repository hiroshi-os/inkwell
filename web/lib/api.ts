export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type Author = {
  id: string;
  username: string;
  displayName: string;
};

export type User = Author & {
  email?: string;
  bio: string;
  createdAt: string;
  followers: number;
  following: number;
};

export type ChapterMeta = {
  id: string;
  title: string;
  position: number;
  published: boolean;
  updatedAt: string;
  wordCount?: number;
};

export type Story = {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  status: string;
  coverHue: number;
  author: Author;
  chapterCount: number;
  createdAt: string;
  updatedAt: string;
  inLibrary: boolean;
  followingAuthor: boolean;
  chapters?: ChapterMeta[];
};

export type Chapter = ChapterMeta & {
  storyId: string;
  body: string;
  prevId?: string;
  nextId?: string;
  storyTitle?: string;
};

const TOKEN_KEY = "inkwell.token";
const USER_KEY = "inkwell.user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error || res.statusText);
  }
  return data as T;
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  register: (body: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }) => request<{ token: string; user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { username: string; password: string }) =>
    request<{ token: string; user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request<User>("/api/me"),
  patchMe: (body: { displayName: string; bio: string }) =>
    request<User>("/api/me", { method: "PATCH", body: JSON.stringify(body) }),
  stories: (q = "", genre = "") => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (genre) p.set("genre", genre);
    const qs = p.toString();
    return request<{ stories: Story[] }>(`/api/stories${qs ? `?${qs}` : ""}`);
  },
  story: (id: string) => request<Story>(`/api/stories/${id}`),
  chapter: (storyId: string, chapterId: string) =>
    request<Chapter>(`/api/stories/${storyId}/chapters/${chapterId}`),
  user: (id: string) => request<{ user: User; following: boolean }>(`/api/users/${id}`),
  userStories: (id: string) => request<{ stories: Story[] }>(`/api/users/${id}/stories`),
  feed: () => request<{ stories: Story[] }>("/api/feed"),
  library: () => request<{ stories: Story[] }>("/api/me/library"),
  createStory: (body: { title: string; synopsis: string; genre: string; status?: string; coverHue?: number }) =>
    request<Story>("/api/stories", { method: "POST", body: JSON.stringify(body) }),
  updateStory: (id: string, body: Record<string, unknown>) =>
    request<Story>(`/api/stories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteStory: (id: string) => request<void>(`/api/stories/${id}`, { method: "DELETE" }),
  createChapter: (storyId: string, body: { title: string; body: string; published?: boolean }) =>
    request<Chapter>(`/api/stories/${storyId}/chapters`, { method: "POST", body: JSON.stringify(body) }),
  updateChapter: (storyId: string, chapterId: string, body: Record<string, unknown>) =>
    request<Chapter>(`/api/stories/${storyId}/chapters/${chapterId}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteChapter: (storyId: string, chapterId: string) =>
    request<void>(`/api/stories/${storyId}/chapters/${chapterId}`, { method: "DELETE" }),
  addLibrary: (id: string) => request<{ inLibrary: boolean }>(`/api/stories/${id}/library`, { method: "POST" }),
  removeLibrary: (id: string) => request<{ inLibrary: boolean }>(`/api/stories/${id}/library`, { method: "DELETE" }),
  follow: (id: string) => request<{ following: boolean }>(`/api/users/${id}/follow`, { method: "POST" }),
  unfollow: (id: string) => request<{ following: boolean }>(`/api/users/${id}/follow`, { method: "DELETE" }),
};
