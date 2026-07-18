export default function PageLoadingState({ label = "Loading..." }) {
  return (
    <div className="bg-white rounded-md shadow-card px-6 py-14 text-center" role="status">
      <div className="page-loading-track" aria-hidden="true">
        <span className="page-loading-track__indicator" />
      </div>
      <p className="mt-3 text-sm text-gray-700">{label}</p>
    </div>
  );
}
