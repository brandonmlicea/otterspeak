import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import { Pip } from "./components/pip";
import "./app.css";

export const meta: Route.MetaFunction = () => [
  { title: "Otterspeak" },
  { name: "description", content: "Learn a language, math or anything you like in five minutes a day, with Pip the otter. Free and open source." },
  { name: "theme-color", content: "#0b7d75" },
];

export const links: Route.LinksFunction = () => [{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const title = isRouteErrorResponse(error) ? (error.status === 404 ? "Page not found" : `Error ${error.status}`) : "Something went wrong";
  return (
    <main id="page-error" className="mx-auto grid min-h-svh max-w-md place-items-center p-8 text-center">
      <div>
        <Pip mood="sad" size={140} className="mx-auto" />
        <h1 className="mt-4 text-2xl">{title}</h1>
        {error instanceof Error && <p className="mt-2 text-muted">{error.message}</p>}
        <a href="/learn" className="btn btn-sea mt-6">Back to learning</a>
      </div>
    </main>
  );
}
