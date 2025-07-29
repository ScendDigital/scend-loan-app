import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-pink-600">404 - Page Not Found</h2>
      <p className="mt-4">Sorry, we couldn't find what you were looking for.</p>
      <Link to="/" className="text-pink-600 underline mt-4 inline-block">
        Go back home
      </Link>
    </div>
  );
}

export default NotFound;
