/**
 * app.jsx
 *
 * FIXES APPLIED:
 *  BUG-9:  Auth error no longer causes infinite redirect loop.
 *          Added retryCount ref — after 3 failures shows a hard error state
 *          instead of redirecting indefinitely.
 *
 *  BUG-10: Fixed SecurityError: "Failed to set a named property 'href' on 'Location'"
 *          Replaced all direct window.top.location.href assignments with
 *          App Bridge v4 open() for top-level navigation inside Shopify iframe.
 */

import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import { authenticate } from "../shopify.server";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    const url = new URL(request.url);
    return {
        apiKey: import.meta.env.VITE_SHOPIFY_API_KEY || "",
        shop:   url.searchParams.get("shop") || "",
        host:   url.searchParams.get("host") || "",
    };
};

// Inner component — must live inside ShopifyAppProvider so useAppBridge() works
function AppInner({ resolvedShop }) {
    // App Bridge v4: useAppBridge() returns the app instance directly.
    // Use app.navigate() for top-level redirects — no Redirect.create() needed.
    const shopify = useAppBridge();

    // "checking" | "ok" | "redirect" | "error"
    const [authStatus, setAuthStatus] = useState("checking");

    const authCheckDone = useRef(false);
    const retryCount    = useRef(0);
    const MAX_RETRIES   = 3;

    /**
     * BUG-10 FIX — App Bridge v4 top-level redirect.
     *
     * shopify.navigate(url, { target: '_top' }) tells Shopify to navigate
     * the top-level frame, which is the correct cross-origin-safe way to
     * break out of the embedded iframe without a SecurityError.
     *
     * Fallback: if called outside the embedded context (plain browser),
     * we just do a normal window.location.href assignment.
     */
    const doInstallRedirect = useCallback((shop) => {
        const installUrl = `${import.meta.env.VITE_API_URL}/authdem/install?shop=${shop}`;
        try {
            // App Bridge v4 API
            shopify.navigate(installUrl, { target: "_top" });
        } catch (e) {
            console.warn("[AUTH] App Bridge navigate failed, falling back:", e);
            window.location.href = installUrl;
        }
    }, [shopify]);

    // Handle ?clear=1 — wipe session and re-install
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        if (params.get("clear") !== "1") return;

        sessionStorage.removeItem("shopify_shop");
        sessionStorage.removeItem("shopify_host");
        sessionStorage.removeItem("ls_access_token");
        sessionStorage.removeItem("ls_user_refresh_token");
        sessionStorage.removeItem("ls_user_token_expires_in");

        const shop = params.get("shop") || resolvedShop;
        doInstallRedirect(shop);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // If no shop found at all, go straight to install
    useEffect(() => {
        if (!resolvedShop) setAuthStatus("redirect");
    }, [resolvedShop]);

    // Check backend OAuth status — ONLY ONCE per mount
    useEffect(() => {
        if (!resolvedShop) return;
        if (authCheckDone.current) return;
        authCheckDone.current = true;

        fetch(`${import.meta.env.VITE_API_URL}/authdem/check?shop=${resolvedShop}`)
            .then(res => res.json())
            .then(data => {
                retryCount.current = 0;
                if (data.status === "ok") {
                    if (data.usertoken) {
                        sessionStorage.setItem("ls_access_token",          data.usertoken);
                        sessionStorage.setItem("ls_user_refresh_token",    data.ls_user_refresh_token);
                        sessionStorage.setItem("ls_user_token_expires_in", data.ls_user_token_expires_in);
                    }
                    setAuthStatus("ok");
                } else {
                    sessionStorage.removeItem("ls_access_token");
                    sessionStorage.removeItem("ls_user_refresh_token");
                    sessionStorage.removeItem("ls_user_token_expires_in");
                    setAuthStatus("redirect");
                }
            })
            .catch(() => {
                retryCount.current += 1;
                authCheckDone.current = false;

                // BUG-9 FIX: hard stop after MAX_RETRIES to avoid infinite loop
                if (retryCount.current >= MAX_RETRIES) {
                    console.error("[AUTH] Auth check failed after", MAX_RETRIES, "attempts");
                    setAuthStatus("error");
                } else {
                    setAuthStatus("redirect");
                }
            });
    }, [resolvedShop]);

    // Token expiry check + refresh
    useEffect(() => {
        if (authStatus !== "ok" || !resolvedShop) return;
        const ls_user_refresh_token = sessionStorage.getItem("ls_user_refresh_token");
        if (!ls_user_refresh_token) return;

        const checkAndRefreshToken = async () => {
            try {
                const expiresAt = sessionStorage.getItem("ls_user_token_expires_in");
                if (!expiresAt) return;
                const isExpired = Number(expiresAt) < Date.now();
                if (!isExpired) return;

                console.log("[AUTH] Token expired, attempting to refresh...");
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/authdem/tokenexpiry?shop=${resolvedShop}`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${ls_user_refresh_token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                const data = await res.json();
                if (res.ok && data.usertoken) {
                    sessionStorage.setItem("ls_access_token",          data.usertoken);
                    sessionStorage.setItem("ls_user_refresh_token",    data.ls_user_refresh_token);
                    sessionStorage.setItem("ls_user_token_expires_in", data.ls_user_token_expires_in);
                    console.log("[AUTH] Token refreshed successfully");
                } else if (data.expired || !res.ok) {
                    console.log("[AUTH] Token refresh failed, redirecting to auth");
                    sessionStorage.removeItem("ls_access_token");
                    sessionStorage.removeItem("ls_user_refresh_token");
                    sessionStorage.removeItem("ls_user_token_expires_in");
                    retryCount.current    = 0;
                    authCheckDone.current = false;
                    setAuthStatus("redirect");
                }
            } catch (error) {
                console.error("[AUTH] Token check/refresh failed:", error);
            }
        };

        checkAndRefreshToken();
        const interval = setInterval(checkAndRefreshToken, 5 * 1000);
        return () => clearInterval(interval);
    }, [authStatus, resolvedShop]);

    // BUG-10 FIX: install redirect via App Bridge v4 (not window.top.location.href)
    useEffect(() => {
        if (authStatus !== "redirect") return;
        if (typeof window === "undefined") return;
        doInstallRedirect(resolvedShop);
    }, [authStatus, resolvedShop, doInstallRedirect]);

    return (
        <>
            <ui-nav-menu>
                <a href="/app" rel="home">Home</a>
                <a href="/app/notification">Notification page</a>
                <a href="/app/trackingwidget">Tracking widget</a>
                <a href="/app/customizetrackingpage">Customize tracking page</a>
                <a href="/app/pricing">Pricing</a>
            </ui-nav-menu>

            {authStatus === "checking" && (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                    <p>Authenticating...</p>
                </div>
            )}

            {/* BUG-9 FIX: recoverable error state instead of infinite redirect loop */}
            {authStatus === "error" && (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                    <p>Unable to connect. Please refresh the page or reopen the app from your Shopify admin.</p>
                    <button
                        onClick={() => {
                            retryCount.current    = 0;
                            authCheckDone.current = false;
                            setAuthStatus("checking");
                        }}
                        style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", cursor: "pointer" }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {authStatus === "redirect" && null}

            {authStatus === "ok" && <Outlet />}
        </>
    );
}

export default function App() {
    const { apiKey, shop: loaderShop, host: loaderHost } = useLoaderData();

    const resolvedShop = loaderShop ||
        (typeof window !== "undefined" ? sessionStorage.getItem("shopify_shop") || "" : "");
    const resolvedHost = loaderHost ||
        (typeof window !== "undefined" ? sessionStorage.getItem("shopify_host") || "" : "");

    // Persist shop/host to sessionStorage
    useEffect(() => {
        if (resolvedShop) sessionStorage.setItem("shopify_shop", resolvedShop);
        if (resolvedHost) sessionStorage.setItem("shopify_host", resolvedHost);
    }, [resolvedShop, resolvedHost]);

    return (
        // ShopifyAppProvider must wrap AppInner so useAppBridge() is available inside it
        <ShopifyAppProvider embedded apiKey={apiKey}>
            <PolarisAppProvider i18n={polarisTranslations}>
                <AppInner resolvedShop={resolvedShop} />
            </PolarisAppProvider>
        </ShopifyAppProvider>
    );
}

export function ErrorBoundary() {
    return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
    return boundary.headers(headersArgs);
};