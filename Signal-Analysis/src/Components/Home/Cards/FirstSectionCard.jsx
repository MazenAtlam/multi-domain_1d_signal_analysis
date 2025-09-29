import { Link } from "react-router-dom";
export default function FirstSectionCard(props) {
  const IconComponent = props.icon;
  return (
    <>
      <div key={props.id} className="card col-2 py-3">
        <Link
          to={props.path}
          className="flex flex-col items-center text-center space-y-4 text-decoration-none"
        >
          <div
            className={`w-16 h-16 rounded-full ${props.color} flex items-center justify-center`}
          >
            <IconComponent className={`w-8 h-8 ${props.color}`} />
          </div>
          <div>
            <h3 className="">{props.title}</h3>
            <p className="">{props.description}</p>
          </div>
          <button variant="outline" size="sm" className="w-full btn">
            Analyze Signal
          </button>
        </Link>
      </div>
    </>
  );
}
