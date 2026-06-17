import { Route } from "react-router-dom";

export default [
  {
    path: "/",
    lazy: () => import("./routes/app"),
    children: [
      {
        index: true,
        lazy: () => import("./routes/app._index"),
      },
      {
        path: "notification",
        lazy: () => import("./routes/app.notification"),
      },
      {
        path: "trackingwidget",
        lazy: () => import("./routes/app.trackingwidget"),
      },
      {
        path: "customizetrackingpage",
        lazy: () => import("./routes/app.customizetrackingpage"),
      },
      {
        path: "pricing",
        lazy: () => import("./routes/app.pricing"),
      },
    ],
  },
  {
    path: "/auth",
    lazy: () => import("./routes/auth"),
  },
  {
    path: "/auth/callback",
    lazy: () => import("./routes/auth.callback"),
  },
];