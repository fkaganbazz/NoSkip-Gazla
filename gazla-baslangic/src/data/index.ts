/** Ekranlar veriye buradan erişir: `import { useToday, type TodayTask } from '@/data'`. */
export { ApiError, type OAuthProvider } from './api';
export { api } from './client';
export { DataProvider, useAuth, type AuthStatus } from './DataProvider';
export { adConsentShown, clearAllFlags, clearFlag, isFlagSet, onceFlag, setFlag, type FlagName } from './flags';
export * from './hooks';
export { mockDev } from './mock/mockApi';
export { clearPendingInvite, peekPendingInvite, savePendingInvite, takePendingInvite } from './pendingInvite';
export * from './types';
