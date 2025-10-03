const Card = ({ children, className = "", padding = "p-6", ...props }) => {
  return (
    <div
      className={`card ${padding} ${className} col-6 mx-auto mt-4`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
