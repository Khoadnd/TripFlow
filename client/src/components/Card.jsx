import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function Card({ children, className, onClick, hover = false, ...props }) {
    const Component = props.animate ? motion.div : 'div';
    
    return (
        <Component
            className={cn(
                "bg-white rounded-3xl p-6 shadow-sm border border-gray-100",
                hover && "transition-all hover:shadow-lg cursor-pointer",
                className
            )}
            onClick={onClick}
            {...props}
        >
            {children}
        </Component>
    );
}
