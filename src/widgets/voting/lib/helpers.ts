export const calculateAverageVote = (votes: number[]) => {
  if (!votes.length) return 0;
  return votes.reduce((a, b) => a + b, 0) / votes.length;
};