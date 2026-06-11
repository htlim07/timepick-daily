type BottomButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

export function BottomButton({
  children,
  onClick,
  variant = "primary",
}: BottomButtonProps) {
  return (
    <button
      className={`bottom-button ${variant === "secondary" ? "bottom-button-secondary" : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
