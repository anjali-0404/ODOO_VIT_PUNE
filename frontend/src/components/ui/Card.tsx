import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('rounded-2xl border border-gray-200 bg-white p-6 shadow-sm', className)}
        {...props as any}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
