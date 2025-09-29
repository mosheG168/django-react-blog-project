import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Stack,
} from "@mui/material";
import { Link as RouterLink, NavLink, useNavigate } from "react-router-dom";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PostAddIcon from "@mui/icons-material/PostAdd";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ toggleMode, mode }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography
          component={RouterLink}
          to="/"
          variant="h6"
          sx={{ color: "inherit", textDecoration: "none", fontWeight: 800 }}
        >
          Blog
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            component={NavLink}
            to="/"
            color="inherit"
            startIcon={<HomeIcon />}
          >
            Home
          </Button>
          <Button color="inherit" href="/about">
            About
          </Button>

          {user && (
            <>
              {/* My Posts → admins only */}
              {isAdmin && (
                <Button
                  component={NavLink}
                  to="/myposts"
                  color="inherit"
                  startIcon={<PersonIcon />}
                >
                  My Posts
                </Button>
              )}

              {/* New Post → admins only */}
              {isAdmin && (
                <Button
                  component={NavLink}
                  to="/new"
                  color="inherit"
                  startIcon={<PostAddIcon />}
                >
                  New Post
                </Button>
              )}
            </>
          )}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{ ml: "auto" }}
          alignItems="center"
        >
          <IconButton
            color="inherit"
            onClick={toggleMode}
            aria-label="toggle theme"
          >
            {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>

          {user ? (
            <>
              <Typography
                variant="body2"
                sx={{ opacity: 0.85, display: { xs: "none", sm: "block" } }}
              >
                Hi, {user.username}
              </Typography>
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                component={NavLink}
                to="/login"
                color="inherit"
                startIcon={<LoginIcon />}
              >
                Login
              </Button>
              <Button
                component={NavLink}
                to="/register"
                variant="contained"
                color="secondary"
              >
                Register
              </Button>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
