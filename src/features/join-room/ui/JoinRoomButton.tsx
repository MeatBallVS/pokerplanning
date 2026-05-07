import { useNavigate } from "react-router-dom";

interface JoinRoomButtonProps {
  roomId: string;
}

export const JoinRoomButton = ({ roomId }: JoinRoomButtonProps) => {
  const navigate = useNavigate();

  return (
    <button
      className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
      onClick={() => navigate(`/room/${roomId}`)}
      type="button"
    >
      Открыть
    </button>
  );
};
