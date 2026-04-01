"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@ventry/ui/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@ventry/ui/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loadingText?: string;
}

/**
 * A button that automatically shows a loading spinner when a parent <form>
 * is submitting (via useFormStatus). Use with Server Actions.
 */
export function LoadingButton({ 
  children, 
  loadingText,
  className, 
  ...props 
}: LoadingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button 
      disabled={pending} 
      className={cn("relative", className)} 
      {...props}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || "Please wait…"}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
