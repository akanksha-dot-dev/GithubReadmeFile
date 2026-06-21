/**
 * EcoTrack Social Store (Zustand)
 *
 * Manages leagues, challenges, leaderboard data, and in-app notifications.
 * Real-time Firestore listeners attach when a user is authenticated.
 * Falls back to mock data for guest/demo mode.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { League, Challenge, LeaderboardEntry, AppNotification } from '@/types/social';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'zero-meat-march',
    leagueId: null,
    title: 'Zero-Meat March',
    description: 'Avoid all meat for 4 weeks and slash your dietary emissions by up to 50%.',
    emoji: '🥦',
    type: 'no_meat',
    category: 'diet',
    target: 28,
    targetUnit: 'days',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
    tokenReward: 500,
    participantCount: 2847,
    isJoined: false,
    progress: 0,
  },
  {
    id: 'bike-to-work-week',
    leagueId: null,
    title: 'Bike-to-Work Week',
    description: 'Cycle your commute for 5 consecutive days and earn bonus tokens.',
    emoji: '🚲',
    type: 'bike_days',
    category: 'transport',
    target: 5,
    targetUnit: 'days',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    tokenReward: 250,
    participantCount: 1203,
    isJoined: false,
    progress: 0,
  },
  {
    id: 'no-fly-quarter',
    leagueId: null,
    title: 'No-Fly Quarter',
    description: 'Commit to ground transport only for 90 days and save 2+ tonnes of CO₂.',
    emoji: '✈️',
    type: 'no_flights',
    category: 'transport',
    target: 90,
    targetUnit: 'days',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    tokenReward: 1000,
    participantCount: 492,
    isJoined: false,
    progress: 0,
  },
  {
    id: 'zero-waste-week',
    leagueId: null,
    title: 'Zero-Waste Week',
    description: 'Produce zero non-recyclable waste for 7 days.',
    emoji: '♻️',
    type: 'zero_waste',
    category: 'consumption',
    target: 7,
    targetUnit: 'days',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    tokenReward: 200,
    participantCount: 3214,
    isJoined: false,
    progress: 0,
  },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, uid: 'u1', displayName: 'EcoWarrior_Jan', totalAnnualKg: 1820, reductionPercent: 67, tokensEarned: 8240, badgeCount: 12, isCurrentUser: false },
  { rank: 2, uid: 'u2', displayName: 'GreenSophia', totalAnnualKg: 2100, reductionPercent: 62, tokensEarned: 7100, badgeCount: 10, isCurrentUser: false },
  { rank: 3, uid: 'u3', displayName: 'CarbonFighterX', totalAnnualKg: 2430, reductionPercent: 56, tokensEarned: 5900, badgeCount: 9, isCurrentUser: false },
  { rank: 4, uid: 'u4', displayName: 'SolarPunk99', totalAnnualKg: 2800, reductionPercent: 50, tokensEarned: 4600, badgeCount: 8, isCurrentUser: false },
  { rank: 5, uid: 'u5', displayName: 'VeloRider', totalAnnualKg: 3100, reductionPercent: 44, tokensEarned: 3800, badgeCount: 7, isCurrentUser: false },
  { rank: 6, uid: 'u6', displayName: 'PlantPowered', totalAnnualKg: 3500, reductionPercent: 37, tokensEarned: 2900, badgeCount: 6, isCurrentUser: false },
  { rank: 7, uid: 'you', displayName: 'You', totalAnnualKg: 0, reductionPercent: 0, tokensEarned: 0, badgeCount: 0, isCurrentUser: true },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface SocialState {
  leagues: League[];
  joinedLeagueIds: string[];
  globalChallenges: Challenge[];
  leaderboard: LeaderboardEntry[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  isLoadingLeagues: boolean;
  isLoadingLeaderboard: boolean;

  // Actions
  joinChallenge: (id: string) => void;
  leaveChallenge: (id: string) => void;
  updateChallengeProgress: (id: string, progress: number) => void;
  joinLeague: (id: string) => void;
  leaveLeague: (id: string) => void;
  addLeague: (league: League) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  updateLeaderboardEntry: (uid: string, totalAnnualKg: number, tokensEarned: number) => void;
  setLoadingLeagues: (v: boolean) => void;
  setLoadingLeaderboard: (v: boolean) => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      leagues: [],
      joinedLeagueIds: [],
      globalChallenges: MOCK_CHALLENGES,
      leaderboard: MOCK_LEADERBOARD,
      notifications: [],
      unreadNotificationCount: 0,
      isLoadingLeagues: false,
      isLoadingLeaderboard: false,

      joinChallenge: (id) =>
        set((s) => ({
          globalChallenges: s.globalChallenges.map((c) =>
            c.id === id ? { ...c, isJoined: true, participantCount: c.participantCount + 1 } : c,
          ),
        })),

      leaveChallenge: (id) =>
        set((s) => ({
          globalChallenges: s.globalChallenges.map((c) =>
            c.id === id ? { ...c, isJoined: false, participantCount: Math.max(0, c.participantCount - 1) } : c,
          ),
        })),

      updateChallengeProgress: (id, progress) =>
        set((s) => ({
          globalChallenges: s.globalChallenges.map((c) =>
            c.id === id ? { ...c, progress: Math.min(100, progress) } : c,
          ),
        })),

      joinLeague: (id) =>
        set((s) => ({
          joinedLeagueIds: s.joinedLeagueIds.includes(id)
            ? s.joinedLeagueIds
            : [...s.joinedLeagueIds, id],
        })),

      leaveLeague: (id) =>
        set((s) => ({
          joinedLeagueIds: s.joinedLeagueIds.filter((lid) => lid !== id),
        })),

      addLeague: (league) =>
        set((s) => ({ leagues: [league, ...s.leagues] })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          unreadNotificationCount: Math.max(0, s.unreadNotificationCount - 1),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
          unreadNotificationCount: 0,
        })),

      addNotification: (notification) => {
        const n: AppNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          timestamp: new Date().toISOString(),
          isRead: false,
          ...notification,
        };
        set((s) => ({
          notifications: [n, ...s.notifications].slice(0, 50),
          unreadNotificationCount: s.unreadNotificationCount + 1,
        }));
      },

      updateLeaderboardEntry: (uid, totalAnnualKg, tokensEarned) =>
        set((s) => ({
          leaderboard: s.leaderboard
            .map((e) => (e.uid === uid ? { ...e, totalAnnualKg, tokensEarned } : e))
            .sort((a, b) => a.totalAnnualKg - b.totalAnnualKg)
            .map((e, i) => ({ ...e, rank: i + 1 })),
        })),

      setLoadingLeagues: (v) => set({ isLoadingLeagues: v }),
      setLoadingLeaderboard: (v) => set({ isLoadingLeaderboard: v }),
    }),
    {
      name: 'ecotrack-social',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        joinedLeagueIds: s.joinedLeagueIds,
        globalChallenges: s.globalChallenges,
        notifications: s.notifications,
        unreadNotificationCount: s.unreadNotificationCount,
      }),
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export const useJoinedChallenges = () =>
  useSocialStore((s) => s.globalChallenges.filter((c) => c.isJoined));

export const useUnreadNotificationCount = () =>
  useSocialStore((s) => s.unreadNotificationCount);
