export default function Button({ children, variant = 'primary', className = '', ...props }) {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-medium py-3 px-6 rounded-xl transition-all duration-300',
        ghost: 'text-dark-300 hover:text-white hover:bg-dark-700/50 font-medium py-3 px-6 rounded-xl transition-all duration-300'
    };

    return (
        <button
            className={`${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
