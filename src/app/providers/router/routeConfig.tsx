import type { ReactNode } from "react";
import type { AppRoute } from "./types";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/widgets/app-shell";
import { LOCAL_STORAGE_KEYS } from "@/shared/constants";
import {
  InvitePage,
  LoginPage,
  NotFoundPage,
  ProfilePage,
  RegisterPage,
  RoomPage,
  RoomsPage,
} from "./lazyPages";

const withLayout = (element: ReactNode) => <AppLayout>{element}</AppLayout>;

export const routeConfig: AppRoute[] = [
  {
    path: "/",
    element: (
      <Navigate
        replace
        to={localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN) ? "/rooms" : "/login"}
      />
    ),
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/invite/:token",
    element: <InvitePage />,
  },
  {
    path: "/dashboard",
    element: <Navigate to="/rooms" replace />,
    authOnly: true,
  },
  {
    path: "/rooms",
    element: withLayout(<RoomsPage scope="all" />),
    authOnly: true,
  },
  {
    path: "/rooms/owned",
    element: withLayout(<RoomsPage scope="owned" />),
    authOnly: true,
  },
  {
    path: "/rooms/participating",
    element: withLayout(<RoomsPage scope="participating" />),
    authOnly: true,
  },
  {
    path: "/profile",
    element: withLayout(<ProfilePage />),
    authOnly: true,
  },
  {
    path: "/room/:id",
    element: withLayout(<RoomPage />),
    authOnly: true,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];
