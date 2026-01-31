"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface NavbarSearchContextType {
  showNavbarSearch: boolean;
  setShowNavbarSearch: (show: boolean) => void;
  scrollToSearchAndFocus: () => void;
  registerScrollToSearch: (callback: () => void) => void;
}

const NavbarSearchContext = createContext<NavbarSearchContextType | null>(null);

export function NavbarSearchProvider({ children }: { children: ReactNode }) {
  const [showNavbarSearch, setShowNavbarSearch] = useState(false);
  const [scrollToSearchCallback, setScrollToSearchCallback] = useState<(() => void) | null>(null);

  const registerScrollToSearch = useCallback((callback: () => void) => {
    setScrollToSearchCallback(() => callback);
  }, []);

  const scrollToSearchAndFocus = useCallback(() => {
    if (scrollToSearchCallback) {
      scrollToSearchCallback();
    }
  }, [scrollToSearchCallback]);

  return (
    <NavbarSearchContext.Provider
      value={{
        showNavbarSearch,
        setShowNavbarSearch,
        scrollToSearchAndFocus,
        registerScrollToSearch,
      }}
    >
      {children}
    </NavbarSearchContext.Provider>
  );
}

export function useNavbarSearch() {
  const context = useContext(NavbarSearchContext);
  if (!context) {
    // Return a no-op context when not inside provider (for other pages)
    return {
      showNavbarSearch: false,
      setShowNavbarSearch: () => {},
      scrollToSearchAndFocus: () => {},
      registerScrollToSearch: () => {},
    };
  }
  return context;

}

// Keep backward-compatible aliases
export const HomeSearchProvider = NavbarSearchProvider;
export const useHomeSearch = useNavbarSearch;
