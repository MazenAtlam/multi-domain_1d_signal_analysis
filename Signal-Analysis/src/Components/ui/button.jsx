const Button = ({
                    children,
                    className = '',
                    onClick,
                    type = 'button',
                    ...props
                }) => {
    const baseClasses = 'button';


    const classes = `${baseClasses} ${className}`.trim();

    return (
        <button className={classes} onClick={onClick} type={type} {...props}>
            {children}
        </button>
    );
};

export default Button;