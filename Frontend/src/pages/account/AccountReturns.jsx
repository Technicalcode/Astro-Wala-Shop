import { Link } from "react-router-dom";
import { Undo2, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import Editable from "../../components/editable/Editable";

// Mock Data for Returns
const MOCK_RETURNS = [
  {
    id: "RET-90123",
    orderId: "ORD-1718901234",
    status: "Approved",
    requestDate: "2023-11-15T10:30:00Z",
    refundAmount: 1499,
    item: { name: "Crystal Healing Bracelet", image: "https://placehold.co/100?text=Crystal" }
  },
  {
    id: "RET-90124",
    orderId: "ORD-1718901235",
    status: "Processing",
    requestDate: "2023-11-20T14:15:00Z",
    refundAmount: 500,
    item: { name: "Rose Quartz Pendant", image: "https://placehold.co/100?text=Quartz" }
  }
];

export default function AccountReturns() {
  const returns = MOCK_RETURNS;

  if (returns.length === 0) {
    return (
      <Editable as="div" kind="button" id="returns-empty-card" label="Returns Empty Card" className="bg-white rounded-md shadow-card py-16 flex flex-col items-center gap-3">
        <Undo2 size={44} className="text-gray-300" />
        <p className="text-gray-600">You have no active or past returns.</p>
        <Link to="/account/orders" className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm mt-2">View Orders</Link>
      </Editable>
    );
  }

  return (
    <Editable as="div" kind="button" id="returns-main-card" label="Returns Main Card Background" className="bg-white rounded-md shadow-card p-4 sm:p-6">
      <Editable as="h1" id="returns-heading" label="Returns Page Heading" className="font-display font-semibold text-xl text-gray-900 mb-6">
        My Returns
      </Editable>

      <div className="flex flex-col gap-4">
        {returns.map((ret) => (
          <Editable key={ret.id} as="div" kind="button" group="return-card" label="Return Card Background" className="border border-gray-200 rounded-md p-4 hover:border-brand/40 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-4 items-center">
                <img loading="lazy" src={ret.item.image} alt="" className="w-16 h-16 rounded object-cover border border-gray-100" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{ret.item.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Return ID: {ret.id} • Order: {ret.orderId}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Requested on: {new Date(ret.requestDate).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm w-fit ${ret.status === "Approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {ret.status === "Approved" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  {ret.status}
                </div>
                <p className="text-sm font-semibold text-gray-900">Refund: ₹{ret.refundAmount.toLocaleString("en-IN")}</p>
                <Link to={`/account/returns/${ret.id}`} className="text-xs font-medium text-brand hover:underline flex items-center gap-1 mt-1">
                  View Status <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </Editable>
        ))}
      </div>
    </Editable>
  );
}
