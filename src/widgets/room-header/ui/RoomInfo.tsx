import { useParams } from "react-router-dom";

interface RoomInfoProps {
  roomName?: string;
}

export const RoomInfo = ({ roomName }: RoomInfoProps) => {
  const { id } = useParams();

  return (
    <div>
      <div className="font-semibold text-slate-900">{roomName ?? "Комната"}</div>
      <div className="text-sm text-slate-500">ID комнаты: {id}</div>
    </div>
  );
};
