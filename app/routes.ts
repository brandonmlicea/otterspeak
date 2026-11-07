import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/start.tsx"),
  route("welcome", "routes/welcome.tsx"),
  route("setup", "routes/setup.tsx"),
  route("learn", "routes/learn.tsx"),
  route("lesson", "routes/lesson.tsx"),
  route("profile", "routes/profile.tsx"),
  route("api/course", "routes/api.course.ts"),
  route("api/lesson", "routes/api.lesson.ts"),
  route("api/explain", "routes/api.explain.ts"),
] satisfies RouteConfig;
