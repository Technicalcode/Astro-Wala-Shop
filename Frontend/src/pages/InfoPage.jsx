import { useParams, Link, Navigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { infoPages } from "../data/infoPages";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPolicies,
  selectPoliciesLoaded,
  selectPoliciesLoading,
  selectPolicyBySlug,
} from "../store/policySlice";

export default function InfoPage() {
  const dispatch = useDispatch();
  const { slug } = useParams();
  const dynamicPolicy = useSelector(selectPolicyBySlug(slug));
  const loading = useSelector(selectPoliciesLoading);
  const loaded = useSelector(selectPoliciesLoaded);
  const staticPage = infoPages[slug];

  useEffect(() => {
    dispatch(fetchPolicies());
  }, [dispatch]);

  let page = staticPage;

  if (dynamicPolicy) {
    const parts = dynamicPolicy.content.split('\n\n');
    page = {
      title: dynamicPolicy.heading,
      intro: parts[0] || "",
      sections: parts.slice(1).reduce((acc, curr, i, arr) => {
        if (i % 2 === 0) {
          acc.push({ heading: curr, body: arr[i + 1] || '' });
        }
        return acc;
      }, [])
    };
  }

  if (!page && (loading || !loaded)) {
    return <div className="text-sm text-gray-500">Loading policy...</div>;
  }

  if (!page) return <Navigate to="/" replace />;

  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Link to="/" className="hover:text-brand">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700">{page.title}</span>
      </div>

      <div className="bg-white rounded-md shadow-card p-6 md:p-8 max-w-3xl">
        <h1 className="font-display font-semibold text-2xl text-gray-900">{page.title}</h1>
        <p className="text-gray-500 mt-2">{page.intro}</p>

        <div className="flex flex-col gap-6 mt-6">
          {page.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="font-semibold text-gray-900 mb-1.5">{s.heading}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-5 border-t border-gray-100 text-sm text-gray-500">
          Still need help?{" "}
          <Link to="/contact" className="text-brand font-medium">
            Contact our support team
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
