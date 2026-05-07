import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-xl">
      <div>404 - страница не найдена</div>
      <Link className="text-sm font-medium text-indigo-600" to="/rooms">
        Вернуться к комнатам
      </Link>
    </div>
  );
};

export default NotFoundPage;
