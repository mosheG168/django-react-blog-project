import React from "react";
import {
  Box,
  Container,
  IconButton,
  Stack,
  Typography,
  Tooltip,
  Divider,
  useTheme,
  Button,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const Footer = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const LINKS = {
    github: "https://github.com/your-user/your-repo",
    linkedin: "https://www.linkedin.com/in/moshe-green-aa2b6a349/",
    mailto: "mailto:m.green4903@gmail.com?subject=Hello%20from%20the%20blog",
  };

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        borderTop: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(0,0,0,0.08)",
        background: isDark
          ? "linear-gradient(180deg, rgba(156,39,176,0.08) 0%, rgba(0,0,0,0.6) 100%)"
          : "linear-gradient(180deg, rgba(255,193,7,0.08) 0%, #fff 100%)",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Moshe Green's Blog Project
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Built with Django REST + React (Vite) & Material UI
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Tooltip title="About this project" arrow>
              <Button
                component={RouterLink}
                to="/about"
                size="small"
                startIcon={<InfoOutlinedIcon />}
                sx={{
                  mr: { xs: 0, sm: 1 },
                  borderRadius: 999,
                }}
                variant={isDark ? "contained" : "outlined"}
              >
                About
              </Button>
            </Tooltip>

            <Divider
              flexItem
              orientation="vertical"
              sx={{ mx: 1, display: { xs: "none", sm: "block" } }}
            />

            <Tooltip title="GitHub Repo" arrow>
              <IconButton
                component="a"
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                sx={{
                  "&:hover": {
                    color: isDark ? "#e0e0e0" : "#000",
                    transform: "translateY(-1px)",
                  },
                  transition: "all .2s ease",
                }}
              >
                <GitHubIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="LinkedIn" arrow>
              <IconButton
                component="a"
                href={LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                sx={{
                  "&:hover": {
                    color: "#0a66c2",
                    transform: "translateY(-1px)",
                  },
                  transition: "all .2s ease",
                }}
              >
                <LinkedInIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Email me" arrow>
              <IconButton
                component="a"
                href={LINKS.mailto}
                color="inherit"
                sx={{
                  "&:hover": {
                    color: isDark ? "#b388ff" : "#6a1b9a",
                    transform: "translateY(-1px)",
                  },
                  transition: "all .2s ease",
                }}
              >
                <EmailIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
