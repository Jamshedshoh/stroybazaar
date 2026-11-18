"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, cx } from "./ui";

export function SubmitButton({
  children,
  variant = "primary",
  size,
  className,
  disabled,
  name,
  value,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending || disabled}
      aria-busy={pending}
      className={cx(buttonClass(variant, size), className)}
    >
      {children}
    </button>
  );
}
