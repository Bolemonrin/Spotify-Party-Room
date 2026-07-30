import { createTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#ec4899", contrastText: "#ffffff" },
    secondary: { main: "#a78bfa", contrastText: "#ffffff" },
    text: { primary: "#4a2540", secondary: "#8a6a82" },
    background: { default: "transparent", paper: "rgba(255,255,255,0.65)" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Roboto", "Segoe UI", system-ui, sans-serif',
    h3: { fontFamily: '"Quicksand", "Roboto", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Quicksand", "Roboto", sans-serif', fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 26, paddingBlock: 10 },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
  },
});

// Reusable frosted-glass card — spread onto <Paper sx={glassCard}> on any page
export const glassCard: SxProps<Theme> = {
  p: { xs: 3, sm: 5 },
  borderRadius: "28px",
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.7)",
  boxShadow: "0 24px 60px -24px rgba(190,90,150,0.45)",
};

// Shared gradient text for page headings (matches the home wordmark)
export const gradientText: SxProps<Theme> = {
  fontFamily: '"Quicksand", "Roboto", sans-serif',
  fontWeight: 700,
  backgroundImage: "linear-gradient(120deg, #ec4899, #a78bfa)",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

export default theme;
