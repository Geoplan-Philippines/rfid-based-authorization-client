import { definePreset } from '@primeng/themes';
import Nora from '@primeng/themes/nora';

export const AppPreset = definePreset(Nora, {
  semantic: {
    primary: {
      50: '#F0F3FF',
      100: '#E1E8FE',
      200: '#C3D1FE',
      300: '#9EB7FD',
      400: '#7AA1FD',
      500: '#4D8BFC',
      600: '#1676EE',
      700: '#1060C5',
      800: '#0B4EA2',
      900: '#03285A',
      950: '#01183C',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.800}',
          hoverColor: '{primary.900}',
          activeColor: '{primary.950}',
          contrastColor: '#FFFFFF',
        },
      },
    },
  },
});