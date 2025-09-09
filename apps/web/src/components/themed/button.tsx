import { Button, buttonVariants } from "../ui/button";
import { motion } from "motion/react";
import { VariantProps } from "class-variance-authority";

export default function ThemedButton({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant={variant}
        size={size}
        className={`${className}
        bg-custom-primary-color text-custom-primary-text cursor-pointer
        hover:bg-custom-primary-color hover:text-custom-primary-text`}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}
