import React from "react";

const Toast = ({ show, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-6">
      <div className="bg-[#f7931e] text-white rounded-2xl px-5 py-4 w-[90%] max-w-sm shadow-lg flex items-center justify-between">
        <span className="text-sm font-medium">
          {message}
        </span>
        <button
          onClick={onClose}
          className="bg-[#ffab3d] px-4 py-1.5 rounded-xl text-sm font-semibold"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default Toast;
