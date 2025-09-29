export default function FeatureCard(props) {
  return (
    <>
      <div className="card col-11 col-md-5 col-xl-5 d-flex flex-row gap-3 ps-3 pe-1 py-3 border rounded-4">
        <i
          class="bi bi-check2-circle"
          style={{ fontSize: "22px", color: "#39c439ff" }}
        ></i>
        <div className="feature">
          <h6>{props.fetTitle}</h6>
          <p style={{ color: "#656565ff" }}>{props.fetDes}</p>
        </div>
      </div>
    </>
  );
}
