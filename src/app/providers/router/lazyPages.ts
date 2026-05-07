import { lazy } from "react";

export const LoginPage = lazy(() =>
  import("@/pages/auth/login").then((module) => ({ default: module.LoginPage })),
);

export const RegisterPage = lazy(() =>
  import("@/pages/auth/register").then((module) => ({ default: module.RegisterPage })),
);

export const InvitePage = lazy(() =>
  import("@/pages/invite").then((module) => ({ default: module.InvitePage })),
);

export const NotFoundPage = lazy(() =>
  import("@/pages/not-found").then((module) => ({ default: module.NotFoundPage })),
);

export const RoomPage = lazy(() =>
  import("@/pages/room").then((module) => ({ default: module.RoomPage })),
);

export const ProfilePage = lazy(() =>
  import("@/pages/profile").then((module) => ({ default: module.ProfilePage })),
);

export const RoomsPage = lazy(() =>
  import("@/pages/rooms").then((module) => ({ default: module.RoomsPage })),
);
