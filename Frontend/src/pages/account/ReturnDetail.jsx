import { useParams, Link } from "react-router-dom";
import { ChevronLeft, CheckCircle2, Truck, Box, Wallet } from "lucide-react";
import Editable from "../../components/editable/Editable";

// Mock Data
const MOCK_RETURN = {
  id: "RET-90123",
  orderId: "ORD-1718901234",
  status: "Refunded", // Requested -> Pickup -> Received -> Refunded
  refundAmount: 1499,
  refundMethod: "Original Payment Source (UPI)",
  item: { name: "Crystal Healing Bracelet", qty: 1, price: 1499, image: "https://placehold.co/100?text=Crystal" }
};

const STEPS = [
  { key: "Requested", label: "Return Requested", icon: Box, desc: "Return request submitted." },
  { key: "Pickup", label: "Item Picked Up", icon: Truck, desc: "Courier has picked up the item." },
  { key: "Received", label: "Item Received", icon: CheckCircle2, desc: "Item received at our warehouse." },
  { key: "Refunded", label: "Refund Issued", icon: Wallet, desc: "Refund initiated to original source." },
];

export default function ReturnDetail() {
  const { returnId } = useParams();
  
  // Using Mock Data directly for demonstration
  const ret = { ...MOCK_RETURN, id: returnId };
  const activeIdx = STEPS.findIndex((s) => s.key === ret.status) > -1 ? STEPS.findIndex((s) => s.key === ret.status) : 3;

  return (
    <div className="flex flex-col gap-6">
      <Link to="/account/returns" className="text-sm font-medium text-gray-500 hover:text-brand flex items-center gap-1 w-fit">
        <ChevronLeft size={16} /> Back to Returns
      </Link>
      
      <div>
        <Editable as="h1" id="return-detail-heading" label="Return Detail Heading" className="text-xl font-semibold text-gray-900">
          Return #{ret.id}
        </Editable>
        <p className="text-sm text-gray-500 mt-1">Order ID: {ret.orderId}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status Timeline */}
        <Editable as="div" kind="button" id="return-timeline-card" label="Return Timeline Card" className="bg-white rounded-md shadow-card p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Return Status</h2>
          <div className="relative pl-4">
            <div className="absolute left-[1.35rem] top-4 bottom-4 w-0.5 bg-gray-100" />
            <div className="flex flex-col gap-6 relative">
              {STEPS.map((step, i) => {
                const done = i <= activeIdx;
                const isCurrent = i === activeIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className={`flex gap-4 ${!done && "opacity-40"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 bg-white relative z-10 transition-colors ${done ? "border-brand text-brand" : "border-gray-300 text-gray-400"} ${isCurrent && "bg-brand/10"}`}>
                      <Icon size={14} />
                    </div>
                    <div className="pt-1.5">
                      <h3 className={`font-semibold text-sm ${done ? "text-gray-900" : "text-gray-500"}`}>{step.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Editable>

        {/* Item & Refund Info */}
        <div className="flex flex-col gap-6">
          <Editable as="div" kind="button" id="return-item-card" label="Return Item Card" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Item Details</h2>
            <div className="flex gap-4">
              <img loading="lazy" src={ret.item.image} alt="" className="w-16 h-16 rounded object-cover border border-gray-100" />
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{ret.item.name}</h3>
                <p className="text-xs text-gray-500 mt-1">Qty: {ret.item.qty}</p>
                <p className="font-semibold text-gray-900 text-sm mt-2">₹{ret.item.price.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </Editable>

          <Editable as="div" kind="button" id="return-refund-card" label="Refund Info Card" className="bg-white rounded-md shadow-card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Refund Information</h2>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Refund Amount</span>
                <span className="font-semibold text-gray-900">₹{ret.refundAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Refund Method</span>
                <span className="text-sm font-medium text-gray-900 text-right">{ret.refundMethod}</span>
              </div>
            </div>
            {ret.status === "Refunded" && (
              <p className="text-xs text-green-700 bg-green-50 mt-4 p-3 rounded">
                The refund has been successfully processed to your original payment method. It may take 3-5 business days to reflect in your account.
              </p>
            )}
          </Editable>
        </div>

      </div>
    </div>
  );
}
