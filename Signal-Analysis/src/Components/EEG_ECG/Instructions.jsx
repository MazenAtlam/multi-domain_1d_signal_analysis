export default function Instructions(props) {
  return (
    <>
      <div className="d-flex gap-3 border border-1 mx-auto col-10 col-xl-6 rounded-3 ps-3 pt-3">
        <i class="bi bi-exclamation-circle text-warning"></i>
        <div className="instructions">
          <h6>Data Requirements</h6>
          <ul>
            {props.li1 ? <li>{props.li1}</li> : ""}
            {props.li2 ? <li>{props.li2}</li> : ""}
            {props.li3 ? <li>{props.li3}</li> : ""}
            {props.li4 ? <li>{props.li4}</li> : ""}
            {props.li5 ? <li>{props.li5}</li> : ""}
          </ul>
        </div>
      </div>
    </>
  );
}
