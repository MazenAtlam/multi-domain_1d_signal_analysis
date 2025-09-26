const Input = ({
                   type = 'text',
                   placeholder = '',
                   value,
                   onChange,
                   className = '',
                   required = true,
                   ...props
               }) => {
    return (
        <input
            type={type}
            className={`input ${className}`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            {...props}
        />
    );
};

export default Input;