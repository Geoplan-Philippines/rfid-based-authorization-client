import { definePreset } from '@primeng/themes';
import Nora from '@primeng/themes/nora';

export const AppPreset = definePreset(Nora, {
  // Near-sharp corners across all PrimeNG components — keep in sync with --radius
  // in styles.css and DESIGN.md "The Near-Sharp Rule".
  primitive: {
    // xs drives buttons, inputs, tags, avatars, and dialogs (all → {border.radius.xs});
    // sm drives cards. Keep both near-sharp at 2px.
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '2px',
      md: '2px',
      lg: '4px',
      xl: '6px',
    },
  },
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
  components: {
    // Denser registry tables: Nora ships 0.75rem 1rem (12px tall) cells, which
    // wastes vertical space when scanning long lists. 8px/12px reads tighter
    // without cramping 14px text.
    datatable: {
      headerCell: { padding: '0.5rem 0.75rem' },
      bodyCell: { padding: '0.5rem 0.75rem' },
      footerCell: { padding: '0.5rem 0.75rem' },
    },
  },
});