import { useMemo } from "react";
import { useSnackbar } from "notistack";

export default function useToast() {
  const { enqueueSnackbar } = useSnackbar();
  return useMemo(
    () => ({
      success: (m) => enqueueSnackbar(m, { variant: "success" }),
      error: (m) => enqueueSnackbar(m, { variant: "error" }),
      info: (m) => enqueueSnackbar(m, { variant: "info" }),
      warning: (m) => enqueueSnackbar(m, { variant: "warning" }),
    }),
    [enqueueSnackbar]
  );
}
