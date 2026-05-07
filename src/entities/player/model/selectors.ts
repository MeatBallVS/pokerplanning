import type { Player } from './types';

export const getHost = (players: Player[]) => {
  return players.find((p) => p.isHost);
};
