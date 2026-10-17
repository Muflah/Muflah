import type * as React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "account-switcher": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { "auth-url": string };
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "account-switcher": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { "auth-url": string };
    }
  }
}
