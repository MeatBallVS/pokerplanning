import type { Room } from './types';

export const isRoomOwner = (room: Room, userId: string) => {
  return room.ownerId === userId;
};
