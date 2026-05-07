export type CardValue =
  | 0
  | 1
  | 2
  | 3
  | 5
  | 8
  | 13
  | 21
  | '?';

export interface Card {
  value: CardValue;
}