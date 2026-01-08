import React, { useState } from "react";
import razorpayLogo from "../assets/images/Razorpay_logo.svg.png";
import MswipeLogo from "../assets/images/Mswipe.png";
import { ChevronLeft } from "lucide-react";

const PaymentMethodModal = ({ amount = 0, onClose, onProceed }) => {
  const [method, setMethod] = useState("razorpay");

  const convenienceFee = method === "razorpay" ? Number((amount * 0.02).toFixed(2)) : 0;

  const totalPayable = Number((amount + convenienceFee).toFixed(2));

  return (
    <div className="fixed inset-0 bg-gray-50 z-50">
      <div className="h-screen max-w-2xl mx-auto flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-700 hover:text-gray-900"
              aria-label="Back"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>

            <h2 className="text-base font-semibold text-gray-900">
              Payment Method
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
            {/* Razorpay */}
            <div
              onClick={() => setMethod("razorpay")}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                method === "razorpay"
                  ? "border-rose-500 bg-rose-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <img
                    src={razorpayLogo}
                    alt="razorpay Logo"
                    className="h-5 md:h-5 object-contain"
                  />
                  <span className="font-medium text-gray-900">Razorpay</span>
                </div>
                <p className="text-xs text-orange-500 mt-1">
                  2% convenience fee applicable
                </p>
              </div>

              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  method === "razorpay" ? "border-rose-600" : "border-gray-300"
                }`}
              >
                {method === "razorpay" && (
                  <div className="w-2.5 h-2.5 bg-rose-600 rounded-full" />
                )}
              </div>
            </div>

            {/* Mswipe Bank */}
            <div
              onClick={() => setMethod("mswipe")}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                method === "mswipe"
                  ? "border-rose-500 bg-rose-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <img
                    src={MswipeLogo}
                    alt="Mswipe Logo"
                    className="h-5 md:h-5 object-contain"
                  />
                  <span className="font-medium text-gray-900">Mswipe</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  No additional charges
                </p>
              </div>

              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  method === "mswipe" ? "border-rose-600" : "border-gray-300"
                }`}
              >
                {method === "mswipe" && (
                  <div className="w-2.5 h-2.5 bg-rose-600 rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Summary */}
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="text-sm text-gray-700 space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Donation Amount</span>
                <span>₹{amount.toLocaleString("en-IN")}</span>
              </div>

              {method === "razorpay" && (
                <div className="flex justify-between">
                  <span>Convenience Fee (2%)</span>
                  <span>₹{convenienceFee}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total Payable</span>
                <span>₹{totalPayable.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              onClick={() => onProceed(method)}
              className="w-full py-3.5 rounded-lg bg-[rgba(188,9,45,1)] hover:bg-[rgba(160,8,38,1)] text-white font-semibold transition"
            >
              Continue Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;
