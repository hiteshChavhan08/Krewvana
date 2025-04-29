// components/theme-provider.tsx
"use client"; // <--- Mark this component as a Client Component

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Define the props for your custom ThemeProvider, extending the original props
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Use the ThemeProvider from next-themes
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
