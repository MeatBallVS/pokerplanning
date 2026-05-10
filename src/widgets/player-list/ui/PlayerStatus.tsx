interface PlayerStatusProps {
  isOnline: boolean;
  voted: boolean;
}

export const PlayerStatus = ({ isOnline, voted }: PlayerStatusProps) => {
  return (
    <div className="text-left text-xs sm:text-right">
      <div
        className={[
          "inline-flex rounded-full px-2.5 py-1 font-medium",
          isOnline ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
        ].join(" ")}
      >
        {isOnline ? "Онлайн" : "Не в сети"}
      </div>
      <div className="mt-1 text-slate-500">{voted ? "Голос отправлен" : "Ждет голос"}</div>
    </div>
  );
};
