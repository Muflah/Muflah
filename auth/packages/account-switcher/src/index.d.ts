import type * as React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "account-switcher": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { "auth-url": string };
    }
  }
}

export declare class AccountSwitcher extends HTMLElement {}
export declare function publishSessionEvent(type: "account-switched" | "account-logged-out" | "session-revoked"): void;
