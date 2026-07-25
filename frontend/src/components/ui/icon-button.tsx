import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface IconButtonProps extends Omit<ButtonProps, "size" | "aria-label"> {
  /** Required: icon-only buttons have no visible text, so an accessible name is mandatory. */
  "aria-label": string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", ...props }, ref) => {
    return <Button ref={ref} size="icon" variant={variant} {...props} />;
  },
);
IconButton.displayName = "IconButton";

export { IconButton };
