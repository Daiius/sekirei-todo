import React from 'react';
import type { Preview } from "@storybook/react";
import { ThemeProvider } from "next-themes";
import ThemeChanger from './ThemeChanger';

import './style.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  //  globalTypes: {
  //    theme: {
  //      name: 'Theme',
  //      defaultValue: 'light',
  //      toolbar: {
  //        icon: 'circlehollow',
  //        items: ['light', 'dark'],
  //        showName: true,
  //      }
  //    }
  //  }
  decorators: [
    (Story, { globals }) => (
      <ThemeProvider attribute='class'>
        <ThemeChanger
          theme={
            (    globals?.backgrounds?.value == null
              || globals.backgrounds.value === "#F8F8F8")
              ? "light"
              : "dark"
          }
        />
        <Story />
      </ThemeProvider>
    ),
  ],

  tags: ["autodocs"]
};

export default preview;

