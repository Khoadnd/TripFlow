import { cn } from '../lib/utils';

export default function Button({ 
    children, 
    variant = 'primary', 
    className, 
    onClick, 
    type = 'button',
    disabled = false,
    ...props 
}) {
    const baseStyles = "font-medium transition-all rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 transform hover:scale-105 active:scale-95",
        secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        outline: "bg-transparent border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
        danger: "bg-red-50 text-red-600 hover:bg-red-100",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30 transform hover:scale-105 active:scale-95",
        dark: "bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20 transform hover:scale-105 active:scale-95"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg",
        icon: "p-2"
    };

    // Determine size based on props or default to md if not icon
    const sizeClass = props.size ? sizes[props.size] : (variant === 'icon' ? sizes.icon : sizes.md);

    return (
        <button
            type={type}
            className={cn(baseStyles, variants[variant], sizeClass, className)}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}
