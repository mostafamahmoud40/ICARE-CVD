import type { DefaultEventsMap } from 'socket.io';
import { Socket } from 'socket.io';

import type { TokenPayload } from '../modules/auth/jwt';

export type AuthenticatedSocketData = {
  user?: TokenPayload;
};

export type SocketWithUser = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  AuthenticatedSocketData
>;

export function getSocketUser(
  client: SocketWithUser,
): TokenPayload | undefined {
  return client.data.user;
}

export function extractSocketToken(client: SocketWithUser): string {
  const auth = client.handshake.auth as { token?: unknown };
  const fromAuth = auth.token;
  const fromHeader = client.handshake.headers.authorization;
  const raw = fromAuth ?? fromHeader;
  if (!raw || typeof raw !== 'string') {
    throw new Error('Missing token');
  }
  return raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw.trim();
}
