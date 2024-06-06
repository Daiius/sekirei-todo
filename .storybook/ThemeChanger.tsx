import React from 'react';
import { useTheme } from 'next-themes';

const ThemeChanger = ({ theme } :{ theme: 'light' | 'dark' }) => {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    setTheme(theme);
    console.log(theme);
  }, [setTheme, theme]);

  return null;
};

export default React.memo(ThemeChanger);

