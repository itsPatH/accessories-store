import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

interface FormAlertProps {
  message: string | null;
}

export const FormAlert = ({ message }: FormAlertProps) => {
  if (!message) return null;

  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};
