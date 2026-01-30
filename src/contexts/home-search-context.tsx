"use client";

import { createContext, useContext, useState, useCallback, ReactNode, RefObject } from "react";

interface HomeSearchContextType {
  showNavbarSearch: boolean;
  setShowNavbarSearch: (show: boolean) => void;
  scrollToSearchAndFocus: () => void;
  registerScrollToSearch: (callback: () => void) => void;
}

const HomeSearchContext = createContext<HomeSearchContextType | null>(null);

export function HomeSearchProvider({ children }: { children: ReactNode }) {
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
    <HomeSearchContext.Provider
      value={{
        showNavbarSearch,
        setShowNavbarSearch,
        scrollToSearchAndFocus,
        registerScrollToSearch,
      }}
    >
      {children}
    </HomeSearchContext.Provider>
  );
}

export function useHomeSearch() {
  const context = useContext(HomeSearchContext);
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
