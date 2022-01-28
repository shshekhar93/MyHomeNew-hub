import React, { useCallback, useContext, useState } from "react";

const THEME_PERSIST_KEY = "selected-theme";

const THEMES = {
  LIGHT: {
    name: 'light',
    background: '#ffffff',
    color: '#000000',
    contrastBackground: '#f7f7f7',
    contrastColor: '#4f4f4f',
    highlightBackground: '#d3d3d3',
    highlightColor: '#4a4a4a',
    border: '#ced4da',
    borderFocus: '#83a3ab',
    accent: '#1d4d70',
    accentDark: '#173d58',
    navbar: '#1d2830',
    navbarColor: '#ffffff',
    link: '#1e4a6a',
    error: '#d10f22',
    errorBackground: '#ffcfd3'
  },
  DARK: {
    name: 'dark',
    background: '#071218',
    color: '#ffffff',
    contrastBackground: '#1d2830',
    contrastColor: '#4f4f4f',
    highlightBackground: '#d3d3d3',
    highlightColor: '#4a4a4a',
    border: '#424e57',
    borderFocus: '#1d2830',
    navbar: '#1d2830',
    navbarColor: '#ffffff',
    link: '#88abdb',
    error: '#d10f22',
    errorBackground: '#ffcfd3'
  }
};

const THEME_NAMES = Object.keys(THEMES);

const ThemeContext = React.createContext(THEMES.LIGHT);

let selectedTheme = null;

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => getSelectedTheme());
  const onThemeChange = useCallback((themeName) => {
    updateTheme(themeName);
    setTheme(getSelectedTheme());
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme,
      onThemeChange,
    }}>
      { children }
    </ThemeContext.Provider>
  )
}

function useTheme() {
  return useContext(ThemeContext);
}

function updateTheme(themeName) {
  if(!THEME_NAMES.includes(themeName)) {
    throw new Error('IVALID_THEME_SELECTED');
  }
  selectedTheme = themeName;
  window.localStorage.setItem(THEME_PERSIST_KEY, themeName);
}

function getSelectedTheme() {
  if(!selectedTheme) {
    const themeName = window.localStorage.getItem(THEME_PERSIST_KEY);
    selectedTheme = themeName || 'LIGHT';
  }

  return THEMES[selectedTheme];
}

export {
  ThemeProvider,
  useTheme,
};
