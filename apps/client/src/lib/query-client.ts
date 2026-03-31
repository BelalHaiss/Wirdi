// TanStack Query configuration
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Centralized query keys for consistent cache management
 * Usage:
 * - In queries: queryKey: queryKeys.groups.list()
 * - In invalidations: invalidateQueries({ queryKey: queryKeys.groups.all })
 */
export const queryKeys = {
  // Auth queries
  auth: {
    all: ['auth'] as const,
    validateToken: (token: string) => [...queryKeys.auth.all, 'validate-token', token] as const,
  },

  // Groups queries
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (query?: unknown) => [...queryKeys.groups.lists(), query] as const,
    options: () => [...queryKeys.groups.all, 'options'] as const,
    stats: (metric: 'groups-count' | 'learners-count' | 'tutors-count') =>
      [...queryKeys.groups.all, 'stats', metric] as const,
    tutors: () => [...queryKeys.groups.all, 'tutors'] as const,
    details: () => [...queryKeys.groups.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.groups.details(), id] as const,
    schedules: (id: string) => [...queryKeys.groups.all, 'schedules', id] as const,
    learners: (id: string) => [...queryKeys.groups.all, 'learners', id] as const,
    unassigned: (id: string) => [...queryKeys.groups.all, 'unassigned', id] as const,
    eligibleForActivation: () => [...queryKeys.groups.all, 'eligible-for-activation'] as const,
    myGroups: () => [...queryKeys.groups.all, 'my-groups'] as const,
  },

  // Sessions queries
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (query?: unknown) => [...queryKeys.sessions.lists(), query] as const,
    today: (userId: string) => [...queryKeys.sessions.lists(), 'today', userId] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
  },

  // Students queries
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (query?: unknown) => [...queryKeys.students.lists(), query] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
  },

  // Users queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (query?: unknown) => [...queryKeys.users.lists(), query] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Learners queries
  learners: {
    all: ['learners'] as const,
    lists: () => [...queryKeys.learners.all, 'list'] as const,
    list: (query?: unknown) => [...queryKeys.learners.lists(), query] as const,
    details: () => [...queryKeys.learners.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.learners.details(), id] as const,
  },

  // Attendance queries
  attendance: {
    all: ['attendance'] as const,
    lists: () => [...queryKeys.attendance.all, 'list'] as const,
    list: (sessionId: string) => [...queryKeys.attendance.lists(), sessionId] as const,
  },

  // Reports queries
  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (query?: unknown) => [...queryKeys.reports.lists(), query] as const,
  },

  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    stats: (userId: string, role: string) =>
      [...queryKeys.dashboard.all, 'stats', userId, role] as const,
  },

  // Profile queries
  profile: {
    all: ['profile'] as const,
    me: () => [...queryKeys.profile.all, 'me'] as const,
  },

  // Excuses queries
  excuses: {
    all: ['excuses'] as const,
    student: (studentId: string, groupId: string) =>
      [...queryKeys.excuses.all, 'student', studentId, groupId] as const,
  },

  // StudentWird / tracking queries
  wirds: {
    all: ['wirds'] as const,
    weeks: (groupId: string) => [...queryKeys.wirds.all, 'weeks', groupId] as const,
    tracking: (groupId: string, weekId: string) =>
      [...queryKeys.wirds.all, 'tracking', groupId, weekId] as const,
    studentWeek: (studentId: string, weekId: string) =>
      [...queryKeys.wirds.all, 'student-week', studentId, weekId] as const,
  },

  // Learner self-recording queries
  learnerWirds: {
    all: ['learner-wirds'] as const,
    overview: (groupId: string) => ['learner-wirds', 'overview', groupId] as const,
  },

  // Requests queries
  requests: {
    all: ['requests'] as const,
    lists: () => [...queryKeys.requests.all, 'list'] as const,
    list: (status?: string) => [...queryKeys.requests.lists(), status] as const,
    myList: () => [...queryKeys.requests.all, 'my'] as const,
    stats: () => [...queryKeys.requests.all, 'stats'] as const,
    details: () => [...queryKeys.requests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.requests.details(), id] as const,
  },

  // Notifications queries
  notifications: {
    all: ['notifications'] as const,
    list: (cursor?: string) => [...queryKeys.notifications.all, 'list', cursor] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
} as const;
