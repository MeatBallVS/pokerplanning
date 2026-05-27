import { useNavigate } from "react-router-dom";

interface JoinRoomButtonProps {
  roomId: string;
}

export const JoinRoomButton = ({ roomId }: JoinRoomButtonProps) => {
  const navigate = useNavigate();

  return (
    <button
      className="studio-button inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition"
      onClick={() => navigate(`/room/${roomId}`)}
      type="button"
    >
      Открыть
    </button>
  );
};
