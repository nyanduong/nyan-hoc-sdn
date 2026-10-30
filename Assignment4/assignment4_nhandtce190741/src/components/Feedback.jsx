export default function Feedback({ type = "danger", children }) {
  if (!children) return null;
  return (
    <div
      className={`alert alert-${type}`}
      role={type === "danger" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
