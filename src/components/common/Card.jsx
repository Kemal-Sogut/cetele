export default function Card({ children, className = '', hover = true }) {
    return (
        <div className={`glass-card ${hover ? '' : 'hover:transform-none hover:bg-white/5 hover:border-white/10'} ${className}`}>
            {children}
        </div>
    );
}
