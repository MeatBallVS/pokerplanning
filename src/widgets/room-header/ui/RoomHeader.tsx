import { Link } from "react-router-dom";
import { RoomInfo } from "./RoomInfo";

interface RoomHeaderProps {
  roomName?: string;
}

export const RoomHeader = ({ roomName }: RoomHeaderProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <RoomInfo roomName={roomName} />
      <Link className="text-sm font-medium text-indigo-600" to="/rooms">
        К списку комнат
      </Link>
    </div>
  );
};
