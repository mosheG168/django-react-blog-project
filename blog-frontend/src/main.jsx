// src/main.jsx
import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

function ThemedApp() {
  const [mode, setMode] = useState("light");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            // amber
            main: mode === "light" ? "#FFB300" : "#FFC107",
          },
          secondary: {
            // gray
            main: mode === "light" ? "#424242" : "#BDBDBD",
          },
          background: {
            default: mode === "light" ? "#FAF9F6" : "#121212",
            paper: mode === "light" ? "#FFFFFF" : "#1E1E1E",
          },
        },
        typography: {
          fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
        },
        shape: { borderRadius: 12 },
        components: {
          MuiButton: { styleOverrides: { root: { textTransform: "none" } } },
          MuiCard: { styleOverrides: { root: { borderRadius: 16 } } },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <AuthProvider>
          <BrowserRouter>
            <App
              toggleMode={() =>
                setMode((m) => (m === "light" ? "dark" : "light"))
              }
              mode={mode}
            />
          </BrowserRouter>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>
);
