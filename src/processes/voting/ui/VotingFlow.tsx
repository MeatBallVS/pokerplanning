import { SelectCard } from "@/features/voting/select-card";
import { SubmitVoteButton } from "@/features/voting/submit-vote";

export const VotingFlow = () => {
  return (
    <div>
      <h2>Voting</h2>
      <SelectCard />
      <SubmitVoteButton />
    </div>
  );
};