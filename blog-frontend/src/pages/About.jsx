import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import SecurityIcon from "@mui/icons-material/Security";
import ApiIcon from "@mui/icons-material/Api";
import StorageIcon from "@mui/icons-material/Storage";
import BoltIcon from "@mui/icons-material/Bolt";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import CodeIcon from "@mui/icons-material/Code";
import WebAssetIcon from "@mui/icons-material/WebAsset";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

function PythonIcon(props) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="20"
      height="20"
      fill="currentColor"
      {...props}
    >
      <path d="M23.5 4c-8.7 0-8.2 3.8-8.2 3.8v4h8.3v2.5H11S4 14.1 4 22.9s6.9 9.1 6.9 9.1h4.1v-5.8s-.2-7.2 7.2-7.2h8.3s7.1.1 7.1-7V11s1-7-8.1-7h-6.9zm-4.6 5.4c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8-1.8-.8-1.8-1.8.8-1.8 1.8-1.8zM24.5 44c8.7 0 8.2-3.8 8.2-3.8v-4h-8.3v-2.5H37s7-0.2 7-9c0-8.9-6.9-9.1-6.9-9.1h-4.1v5.8s.2 7.2-7.2 7.2h-8.3s-7.1-.1-7.1 7v4s-1 7 8.1 7h6.9zm4.6-5.4c-1 0-1.8-.8-1.8-1.8S28.1 35 29.1 35s1.8.8 1.8 1.8-.8 1.8-1.8 1.8z" />
    </svg>
  );
}

function DjangoIcon(props) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="20"
      height="20"
      fill="currentColor"
      {...props}
    >
      <path d="M19 6h5.6v28c-2.9.6-5 0.9-7.4 0.9C9.3 34.9 4 29.4 4 21.5c0-7.7 5.5-13.4 13.3-13.4 2 0 3.7.3 5.7.9V6zm0 21.8v-15c-1.2-.4-2.2-.6-3.5-.6-4.7 0-7.9 3.4-7.9 8.5 0 5.2 3.1 8.5 8 8.5.9 0 1.6-.1 3.4-.4zM38.4 8.1c0 1.8-1.4 3.1-3.2 3.1-1.7 0-3.1-1.3-3.1-3.1 0-1.7 1.4-3.1 3.2-3.1s3.1 1.4 3.1 3.1zm-6.3 6.6H38v20.1c0 7.1-3.4 10-8.7 10-1.9 0-3.4-.3-5.1-.9v-5c1.2.5 2.5.7 3.8.7 2.5 0 3.9-1.2 3.9-4.4V14.7z" />
    </svg>
  );
}

export default function About() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const gradient = isDark
    ? `radial-gradient(1200px 800px at 10% 0%,
        ${alpha(theme.palette.primary.main, 0.18)} 0%,
        ${alpha(theme.palette.warning.main, 0.12)} 35%,
        ${theme.palette.background.default} 70%,
        ${theme.palette.background.default} 100%)`
    : `linear-gradient(
        135deg,
        ${alpha(theme.palette.warning.light, 0.25)} 0%,
        ${alpha(theme.palette.warning.main, 0.12)} 35%,
        #ffffff 100%
      )`;

  const tech = [
    { label: "Python", icon: <PythonIcon /> },
    { label: "Django", icon: <DjangoIcon /> },
    { label: "Django REST Framework", icon: <ApiIcon /> },
    { label: "JWT (AuthViewSet + SimpleJWT refresh)", icon: <SecurityIcon /> },
    { label: "PostgreSQL", icon: <StorageIcon /> },
    { label: "React", icon: <CodeIcon /> },
    { label: "Vite", icon: <BoltIcon /> },
    { label: "Material UI", icon: <WebAssetIcon /> },
    { label: "Axios", icon: <CloudOutlinedIcon /> },
    { label: "notistack", icon: <CloudOutlinedIcon /> },
  ];

  return (
    <Box sx={{ py: { xs: 6, md: 10 }, background: gradient }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            bgcolor: "background.paper",
            border: (t) => `1px solid ${t.palette.divider}`,
            backdropFilter: "saturate(1.08) blur(6px)",
          }}
        >
          <Stack spacing={2} alignItems="flex-start">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <InfoOutlinedIcon color="primary" />
              <Typography variant="h4" fontWeight={800}>
                About this Project
              </Typography>
            </Stack>

            <Typography color="text.secondary">
              A modern demo blog: <b>Django REST API</b> + <b>React/Vite</b>{" "}
              front-end, with JWT auth, protected routes, CRUD,
              search/sort/pagination, and a clean Material UI. Built as a
              pragmatic reference app.
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {tech.map((t) => (
                <Chip
                  key={t.label}
                  icon={t.icon}
                  label={t.label}
                  variant="outlined"
                  sx={{
                    color: "text.primary",
                    borderColor: alpha(theme.palette.text.primary, 0.2),
                    "& .MuiChip-icon": { color: "text.secondary" },
                    mr: 1,
                    mb: 1,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: `0 0 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                    },
                  }}
                />
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" fontWeight={700}>
              Purpose
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Showcase a production-leaning stack: JWT login/register,
              role-based permissions, creating/liking/commenting on posts, and
              browsing with filters & pagination.
            </Typography>

            <Typography variant="h6" fontWeight={700}>
              Backend
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              • Python · Django · DRF · AuthViewSet (login/register) + SimpleJWT
              refresh
              <br />
              • PostgreSQL · Filters · Pagination · CORS
              <br />• Seed data via management command
            </Typography>

            <Typography variant="h6" fontWeight={700}>
              Frontend
            </Typography>
            <Typography color="text.secondary">
              • React + Vite · Material UI (amber/graphite theme)
              <br />
              • Axios client with token refresh · notistack toasts
              <br />• Protected routes · Responsive layout
            </Typography>

            <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
              Permissions
            </Typography>
            <Typography color="text.secondary">
              • Managers can create/update/delete posts
              <br />• Anyone logged in can comment; only managers can delete
              comments
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
