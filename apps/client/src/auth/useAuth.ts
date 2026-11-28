import {useSyncExternalStore} from 'react';
import {authClient} from './session';
export function useAuth(){return useSyncExternalStore(authClient.subscribe,authClient.getSnapshot);}
